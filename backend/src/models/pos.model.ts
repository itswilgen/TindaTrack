import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "../config/db";

export type PosProductRow = RowDataPacket & {
  id: number;
  name: string;
  category: string | null;
  sku: string | null;
  barcode: string | null;
  image_url: string | null;
  unit_label: string | null;
  unit_price: string | number;
  cost_price: string | number;
  current_stock: string | number;
  reorder_level: string | number;
  show_in_pos: number;
  status: string;
};

export type PosRegisterRow = RowDataPacket & {
  id: number;
  business_id: number;
  register_name: string;
  register_code: string;
  location: string | null;
  status: string;
};

export type PosSessionRow = RowDataPacket & {
  id: number;
  business_id: number;
  register_id: number;
  opened_by_user_id: number;
  opening_cash: string | number;
  status: "open" | "closed";
};

export async function getPosProducts(businessId: number) {
  const [rows] = await db.query<PosProductRow[]>(
    `
    SELECT
      id,
      name,
      category,
      sku,
      barcode,
      image_url,
      unit_label,
      unit_price,
      cost_price,
      current_stock,
      reorder_level,
      show_in_pos,
      status
    FROM products
    WHERE business_id = ?
      AND status = 'active'
      AND show_in_pos = 1
    ORDER BY category ASC, name ASC
    `,
    [businessId]
  );

  return rows;
}

export async function getOrCreateMainRegister(
  connection: PoolConnection,
  businessId: number
) {
  const [rows] = await connection.query<PosRegisterRow[]>(
    `
    SELECT *
    FROM pos_registers
    WHERE business_id = ?
      AND register_code = 'REG-01'
    LIMIT 1
    `,
    [businessId]
  );

  if (rows[0]) return rows[0];

  const [result] = await connection.query<ResultSetHeader>(
    `
    INSERT INTO pos_registers (
      business_id,
      register_name,
      register_code,
      location,
      status
    )
    VALUES (?, 'Main Counter', 'REG-01', 'Front counter', 'active')
    `,
    [businessId]
  );

  const [createdRows] = await connection.query<PosRegisterRow[]>(
    `
    SELECT *
    FROM pos_registers
    WHERE id = ?
    LIMIT 1
    `,
    [result.insertId]
  );

  return createdRows[0];
}

export async function getOrCreateOpenSession(
  connection: PoolConnection,
  data: {
    businessId: number;
    registerId: number;
    userId: number;
  }
) {
  const [rows] = await connection.query<PosSessionRow[]>(
    `
    SELECT *
    FROM pos_sessions
    WHERE business_id = ?
      AND register_id = ?
      AND status = 'open'
    ORDER BY opened_at DESC
    LIMIT 1
    `,
    [data.businessId, data.registerId]
  );

  if (rows[0]) return rows[0];

  const [result] = await connection.query<ResultSetHeader>(
    `
    INSERT INTO pos_sessions (
      business_id,
      register_id,
      opened_by_user_id,
      opening_cash,
      status,
      opened_at
    )
    VALUES (?, ?, ?, 0, 'open', NOW())
    `,
    [data.businessId, data.registerId, data.userId]
  );

  const [createdRows] = await connection.query<PosSessionRow[]>(
    `
    SELECT *
    FROM pos_sessions
    WHERE id = ?
    LIMIT 1
    `,
    [result.insertId]
  );

  return createdRows[0];
}

export async function findProductsForUpdate(
  connection: PoolConnection,
  businessId: number,
  productIds: number[]
) {
  if (productIds.length === 0) return [];

  const [rows] = await connection.query<PosProductRow[]>(
    `
    SELECT *
    FROM products
    WHERE business_id = ?
      AND id IN (?)
      AND status = 'active'
    FOR UPDATE
    `,
    [businessId, productIds]
  );

  return rows;
}

export async function createSaleRecord(
  connection: PoolConnection,
  data: {
    businessId: number;
    posSessionId: number;
    registerId: number;
    cashierUserId: number;
    receiptNumber: string;
    customerName: string | null;
    paymentMethod: string;
    subtotal: number;
    discount: number;
    totalAmount: number;
    cashReceived: number | null;
    changeDue: number | null;
  }
) {
  const [result] = await connection.query<ResultSetHeader>(
    `
    INSERT INTO sales (
      business_id,
      pos_session_id,
      register_id,
      cashier_user_id,
      receipt_number,
      customer_name,
      payment_method,
      payment_status,
      subtotal,
      discount,
      total_amount,
      cash_received,
      change_due,
      sold_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, ?, ?, NOW())
    `,
    [
      data.businessId,
      data.posSessionId,
      data.registerId,
      data.cashierUserId,
      data.receiptNumber,
      data.customerName,
      data.paymentMethod,
      data.subtotal,
      data.discount,
      data.totalAmount,
      data.cashReceived,
      data.changeDue,
    ]
  );

  return result.insertId;
}

export async function createSaleItem(
  connection: PoolConnection,
  data: {
    saleId: number;
    productId: number;
    quantity: number;
    unitLabel: string;
    unitMultiplier: number;
    baseQuantity: number;
    unitPrice: number;
    unitCost: number;
    lineTotal: number;
  }
) {
  await connection.query(
    `
    INSERT INTO sale_items (
      sale_id,
      product_id,
      quantity,
      unit_label,
      unit_multiplier,
      base_quantity,
      unit_price,
      unit_cost,
      line_total
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.saleId,
      data.productId,
      data.quantity,
      data.unitLabel,
      data.unitMultiplier,
      data.baseQuantity,
      data.unitPrice,
      data.unitCost,
      data.lineTotal,
    ]
  );
}

export async function deductProductStock(
  connection: PoolConnection,
  data: {
    businessId: number;
    productId: number;
    baseQuantity: number;
    saleId: number;
  }
) {
  await connection.query(
    `
    UPDATE products
    SET current_stock = current_stock - ?
    WHERE business_id = ?
      AND id = ?
    `,
    [data.baseQuantity, data.businessId, data.productId]
  );

  await connection.query(
    `
    INSERT INTO inventory_movements (
      business_id,
      product_id,
      movement_type,
      quantity,
      notes
    )
    VALUES (?, ?, 'sale', ?, ?)
    `,
    [
      data.businessId,
      data.productId,
      -data.baseQuantity,
      `POS sale #${data.saleId}`,
    ]
  );
}
