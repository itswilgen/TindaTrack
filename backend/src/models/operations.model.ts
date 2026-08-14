import bcrypt from "bcryptjs";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "../config/db";

export type InventoryRow = RowDataPacket & {
  id: number;
  product_id: number;
  product: string;
  sku: string | null;
  unit_label: string | null;
  movement_type: "stock_in" | "sale" | "adjustment";
  quantity: string | number;
  notes: string | null;
  staff: string;
  created_at: Date;
};

export type SaleRow = RowDataPacket & {
  id: number;
  receipt_number: string;
  customer_name: string | null;
  payment_method: string;
  payment_status: string;
  subtotal: string | number;
  discount: string | number;
  total_amount: string | number;
  sold_at: Date;
  item_count: number;
};

export async function getInventoryOverview(businessId: number, query = "") {
  const search = `%${query}%`;
  const [stats] = await db.query<RowDataPacket[]>(
    `SELECT
      COALESCE(SUM(current_stock), 0) total_units,
      SUM(current_stock <= reorder_level AND status = 'active') low_stock,
      COALESCE(SUM(current_stock * cost_price), 0) stock_value,
      COUNT(*) total_products
     FROM products WHERE business_id = ?`,
    [businessId]
  );
  const [stockIn] = await db.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(quantity), 0) quantity FROM inventory_movements
     WHERE business_id = ? AND movement_type = 'stock_in' AND DATE(created_at) = CURDATE()`,
    [businessId]
  );
  const [lowStock] = await db.query<RowDataPacket[]>(
    `SELECT id, name product, sku, unit_label, current_stock stock, reorder_level reorder_level
     FROM products WHERE business_id = ? AND status = 'active' AND track_stock = 1
       AND current_stock <= reorder_level ORDER BY current_stock ASC, name ASC`,
    [businessId]
  );
  const [movements] = await db.query<InventoryRow[]>(
    `SELECT im.id, im.product_id, p.name product, p.sku, p.unit_label,
       im.movement_type, im.quantity, im.notes,
       COALESCE(u.name, 'System') staff, im.created_at
     FROM inventory_movements im
     JOIN products p ON p.id = im.product_id
     LEFT JOIN sales s ON im.movement_type = 'sale' AND im.notes = CONCAT('POS sale #', s.id)
     LEFT JOIN users u ON u.id = s.cashier_user_id
     WHERE im.business_id = ? AND (p.name LIKE ? OR COALESCE(p.sku, '') LIKE ? OR im.movement_type LIKE ?)
     ORDER BY im.created_at DESC LIMIT 100`,
    [businessId, search, search, search]
  );

  return {
    stats: {
      total_units: Number(stats[0]?.total_units || 0),
      low_stock: Number(stats[0]?.low_stock || 0),
      stock_in_today: Number(stockIn[0]?.quantity || 0),
      stock_value: Number(stats[0]?.stock_value || 0),
      total_products: Number(stats[0]?.total_products || 0),
    },
    low_stock: lowStock,
    movements,
  };
}

export async function stockInProduct(data: {
  businessId: number;
  productId: number;
  quantity: number;
  notes?: string | null;
}) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [updated] = await connection.query<ResultSetHeader>(
      `UPDATE products SET current_stock = current_stock + ?
       WHERE business_id = ? AND id = ? AND track_stock = 1`,
      [data.quantity, data.businessId, data.productId]
    );
    if (!updated.affectedRows) throw new Error("PRODUCT_NOT_FOUND");
    await connection.query(
      `INSERT INTO inventory_movements (business_id, product_id, movement_type, quantity, notes)
       VALUES (?, ?, 'stock_in', ?, ?)`,
      [data.businessId, data.productId, data.quantity, data.notes || "Manual stock-in"]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getSalesOverview(businessId: number, query = "") {
  const search = `%${query}%`;
  const [summary] = await db.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(total_amount), 0) gross_sales, COUNT(*) transactions,
       COALESCE(AVG(total_amount), 0) average_basket, COALESCE(SUM(discount), 0) discounts
     FROM sales WHERE business_id = ? AND payment_status = 'paid' AND DATE(sold_at) = CURDATE()`,
    [businessId]
  );
  const [payments] = await db.query<RowDataPacket[]>(
    `SELECT payment_method, COALESCE(SUM(total_amount), 0) amount
     FROM sales WHERE business_id = ? AND payment_status = 'paid' AND DATE(sold_at) = CURDATE()
     GROUP BY payment_method ORDER BY amount DESC`,
    [businessId]
  );
  const [sales] = await db.query<SaleRow[]>(
    `SELECT s.id, s.receipt_number, s.customer_name, s.payment_method, s.payment_status,
       s.subtotal, s.discount, s.total_amount, s.sold_at, COUNT(si.id) item_count
     FROM sales s LEFT JOIN sale_items si ON si.sale_id = s.id
     WHERE s.business_id = ? AND (s.receipt_number LIKE ? OR COALESCE(s.customer_name, '') LIKE ? OR s.payment_method LIKE ?)
     GROUP BY s.id ORDER BY s.sold_at DESC LIMIT 200`,
    [businessId, search, search, search]
  );
  return { summary: summary[0], payments, sales };
}

export async function getReportOverview(businessId: number) {
  const [categoryRows] = await db.query<RowDataPacket[]>(
    `SELECT COALESCE(p.category, 'Uncategorized') category,
       COALESCE(SUM(si.line_total), 0) sales, COALESCE(SUM(si.quantity), 0) sold
     FROM sale_items si JOIN sales s ON s.id = si.sale_id JOIN products p ON p.id = si.product_id
     WHERE s.business_id = ? AND s.payment_status = 'paid'
     GROUP BY COALESCE(p.category, 'Uncategorized') ORDER BY sales DESC`,
    [businessId]
  );
  const [totals] = await db.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(total_amount), 0) sales, COUNT(*) transactions
     FROM sales WHERE business_id = ? AND payment_status = 'paid'`,
    [businessId]
  );
  const [expenses] = await db.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(amount), 0) expenses FROM expenses WHERE business_id = ?`,
    [businessId]
  );
  return { categories: categoryRows, totals: totals[0], expenses: expenses[0] };
}

export async function getStaff(businessId: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT u.id, u.name, u.email, bu.role, u.status, u.updated_at
     FROM business_users bu JOIN users u ON u.id = bu.user_id
     WHERE bu.business_id = ? ORDER BY bu.role = 'owner' DESC, u.name ASC`,
    [businessId]
  );
  return rows;
}

export async function createStaff(data: {
  businessId: number;
  name: string;
  email: string;
  password: string;
  role: "cashier" | "inventory_staff";
}) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const passwordHash = await bcrypt.hash(data.password, 12);
    const [userResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO users (name, email, password_hash, global_role, status)
       VALUES (?, ?, ?, 'business_user', 'active')`,
      [data.name, data.email, passwordHash]
    );
    await connection.query(
      `INSERT INTO business_users (business_id, user_id, role) VALUES (?, ?, ?)`,
      [data.businessId, userResult.insertId, data.role]
    );
    await connection.commit();
    return userResult.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function setStaffStatus(businessId: number, userId: number, status: "active" | "inactive") {
  const [result] = await db.query<ResultSetHeader>(
    `UPDATE users u JOIN business_users bu ON bu.user_id = u.id
     SET u.status = ? WHERE bu.business_id = ? AND u.id = ? AND bu.role <> 'owner'`,
    [status, businessId, userId]
  );
  return result.affectedRows > 0;
}

export async function updateStaffAccess(data: {
  businessId: number;
  userId: number;
  role: "cashier" | "inventory_staff";
  password?: string;
}) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [roleResult] = await connection.query<ResultSetHeader>(
      `UPDATE business_users
       SET role = ?
       WHERE business_id = ? AND user_id = ? AND role <> 'owner'`,
      [data.role, data.businessId, data.userId]
    );

    if (roleResult.affectedRows === 0) {
      await connection.rollback();
      return false;
    }

    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, 12);
      await connection.query(
        `UPDATE users SET password_hash = ? WHERE id = ?`,
        [passwordHash, data.userId]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getSettings(businessId: number) {
  const [businessRows] = await db.query<RowDataPacket[]>(
    `SELECT id, business_name, business_type, phone, address, status FROM businesses WHERE id = ?`,
    [businessId]
  );
  const [settingRows] = await db.query<RowDataPacket[]>(
    `SELECT low_stock_alerts, daily_sales_summary, payment_updates, staff_activity
     FROM business_settings WHERE business_id = ?`,
    [businessId]
  );
  return {
    business: businessRows[0],
    notifications: settingRows[0] || {
      low_stock_alerts: 1,
      daily_sales_summary: 1,
      payment_updates: 1,
      staff_activity: 1,
    },
  };
}

export async function updateSettings(data: {
  businessId: number;
  businessName: string;
  businessType: string | null;
  phone: string | null;
  address: string | null;
  notifications: Record<string, boolean>;
}) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE businesses SET business_name = ?, business_type = ?, phone = ?, address = ? WHERE id = ?`,
      [data.businessName, data.businessType, data.phone, data.address, data.businessId]
    );
    await connection.query(
      `INSERT INTO business_settings
       (business_id, low_stock_alerts, daily_sales_summary, payment_updates, staff_activity)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE low_stock_alerts = VALUES(low_stock_alerts),
       daily_sales_summary = VALUES(daily_sales_summary), payment_updates = VALUES(payment_updates),
       staff_activity = VALUES(staff_activity)`,
      [
        data.businessId,
        data.notifications.low_stock_alerts ? 1 : 0,
        data.notifications.daily_sales_summary ? 1 : 0,
        data.notifications.payment_updates ? 1 : 0,
        data.notifications.staff_activity ? 1 : 0,
      ]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createExpense(data: {
  businessId: number;
  category: string;
  amount: number;
  description: string | null;
  expenseDate: string;
}) {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO expenses (business_id, category, amount, description, expense_date)
     VALUES (?, ?, ?, ?, ?)`,
    [data.businessId, data.category, data.amount, data.description, data.expenseDate]
  );
  return result.insertId;
}

export async function getExpenses(businessId: number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, category, amount, description, expense_date, created_at
     FROM expenses WHERE business_id = ? ORDER BY expense_date DESC, id DESC LIMIT 200`,
    [businessId]
  );
  return rows;
}
