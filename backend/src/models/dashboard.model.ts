import { RowDataPacket } from "mysql2/promise";
import db from "../config/db";

type SalesSummaryRow = RowDataPacket & {
  total_sales: string | number | null;
  transaction_count: number;
  average_basket: string | number | null;
};

type CountRow = RowDataPacket & {
  count: number;
};

type LowStockRow = RowDataPacket & {
  name: string;
  current_stock: number;
  reorder_level: number;
};

type SalesTrendRow = RowDataPacket & {
  sale_hour: number;
  total_sales: string | number;
};

type TopSaleRow = RowDataPacket & {
  product: string;
  category: string | null;
  sold: string | number;
  revenue: string | number;
};

type PaymentMixRow = RowDataPacket & {
  payment_method: string;
  total_sales: string | number;
};

type ExpenseRow = RowDataPacket & {
  category: string;
  total_amount: string | number;
};

type DailyAmountRow = RowDataPacket & {
  activity_date: string | Date;
  amount: string | number;
};

export async function getTodaySalesSummary(businessId: number) {
  const [rows] = await db.query<SalesSummaryRow[]>(
    `
    SELECT
      COALESCE(SUM(total_amount), 0) AS total_sales,
      COUNT(*) AS transaction_count,
      COALESCE(AVG(total_amount), 0) AS average_basket
    FROM sales
    WHERE business_id = ?
      AND DATE(sold_at) = CURDATE()
    `,
    [businessId]
  );

  return rows[0];
}

export async function getYesterdaySalesTotal(businessId: number) {
  const [rows] = await db.query<SalesSummaryRow[]>(
    `
    SELECT
      COALESCE(SUM(total_amount), 0) AS total_sales,
      COUNT(*) AS transaction_count,
      COALESCE(AVG(total_amount), 0) AS average_basket
    FROM sales
    WHERE business_id = ?
      AND DATE(sold_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    `,
    [businessId]
  );

  return Number(rows[0]?.total_sales || 0);
}

export async function getProductCounts(businessId: number) {
  const [activeRows] = await db.query<CountRow[]>(
    `
    SELECT COUNT(*) AS count
    FROM products
    WHERE business_id = ?
      AND status = 'active'
    `,
    [businessId]
  );

  const [lowStockRows] = await db.query<CountRow[]>(
    `
    SELECT COUNT(*) AS count
    FROM products
    WHERE business_id = ?
      AND status = 'active'
      AND current_stock <= reorder_level
    `,
    [businessId]
  );

  return {
    activeProducts: activeRows[0]?.count || 0,
    lowStockCount: lowStockRows[0]?.count || 0,
  };
}

export async function getLowStockItems(businessId: number) {
  const [rows] = await db.query<LowStockRow[]>(
    `
    SELECT
      name,
      current_stock,
      reorder_level
    FROM products
    WHERE business_id = ?
      AND status = 'active'
      AND current_stock <= reorder_level
    ORDER BY current_stock ASC, name ASC
    LIMIT 6
    `,
    [businessId]
  );

  return rows;
}

export async function getSalesTrend(businessId: number) {
  const [rows] = await db.query<SalesTrendRow[]>(
    `
    SELECT
      HOUR(sold_at) AS sale_hour,
      COALESCE(SUM(total_amount), 0) AS total_sales
    FROM sales
    WHERE business_id = ?
      AND DATE(sold_at) = CURDATE()
    GROUP BY HOUR(sold_at)
    ORDER BY sale_hour ASC
    `,
    [businessId]
  );

  return rows;
}

export async function getTopSales(businessId: number) {
  const [rows] = await db.query<TopSaleRow[]>(
    `
    SELECT
      products.name AS product,
      products.category,
      COALESCE(SUM(sale_items.quantity), 0) AS sold,
      COALESCE(SUM(sale_items.line_total), 0) AS revenue
    FROM sale_items
    INNER JOIN sales ON sales.id = sale_items.sale_id
    INNER JOIN products ON products.id = sale_items.product_id
    WHERE sales.business_id = ?
      AND DATE(sales.sold_at) = CURDATE()
    GROUP BY products.id, products.name, products.category
    ORDER BY revenue DESC
    LIMIT 4
    `,
    [businessId]
  );

  return rows;
}

export async function getPaymentMix(businessId: number) {
  const [rows] = await db.query<PaymentMixRow[]>(
    `
    SELECT
      payment_method,
      COALESCE(SUM(total_amount), 0) AS total_sales
    FROM sales
    WHERE business_id = ?
      AND DATE(sold_at) = CURDATE()
    GROUP BY payment_method
    ORDER BY total_sales DESC
    `,
    [businessId]
  );

  return rows;
}

export async function getExpenseBreakdown(businessId: number) {
  const [rows] = await db.query<ExpenseRow[]>(
    `
    SELECT
      category,
      COALESCE(SUM(amount), 0) AS total_amount
    FROM expenses
    WHERE business_id = ?
      AND expense_date = CURDATE()
    GROUP BY category
    ORDER BY total_amount DESC
    `,
    [businessId]
  );

  return rows;
}

export async function getWeeklyFinancials(businessId: number) {
  const [salesRows] = await db.query<DailyAmountRow[]>(
    `
    SELECT DATE(sold_at) activity_date, COALESCE(SUM(total_amount), 0) amount
    FROM sales
    WHERE business_id = ? AND payment_status = 'paid'
      AND sold_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(sold_at)
    `,
    [businessId]
  );
  const [expenseRows] = await db.query<DailyAmountRow[]>(
    `
    SELECT expense_date activity_date, COALESCE(SUM(amount), 0) amount
    FROM expenses
    WHERE business_id = ? AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY expense_date
    `,
    [businessId]
  );

  return { salesRows, expenseRows };
}
