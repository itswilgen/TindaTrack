import db from "../config/db";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type PaymentStatus = "pending" | "paid" | "cancelled" | "failed";
export type PaymentProvider = "mock" | "paymongo";

export type PaymentTransactionRow = RowDataPacket & {
  id: number;
  checkout_session_id: string;
  provider: PaymentProvider;
  business_id: number | null;
  user_id: number | null;
  plan: string;
  amount: number;
  currency: string;
  customer_email: string | null;
  customer_name: string | null;
  status: PaymentStatus;
  checkout_url: string | null;
};

export async function createPaymentTransaction(data: {
  checkout_session_id: string;
  provider: PaymentProvider;
  business_id?: number | null;
  user_id?: number | null;
  plan: string;
  amount: number;
  currency?: string;
  customer_email?: string | null;
  customer_name?: string | null;
  status?: PaymentStatus;
  checkout_url?: string | null;
}) {
  const [result] = await db.query<ResultSetHeader>(
    `
    INSERT INTO payment_transactions (
      checkout_session_id,
      provider,
      business_id,
      user_id,
      plan,
      amount,
      currency,
      customer_email,
      customer_name,
      status,
      checkout_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.checkout_session_id,
      data.provider,
      data.business_id || null,
      data.user_id || null,
      data.plan,
      data.amount,
      data.currency || "PHP",
      data.customer_email || null,
      data.customer_name || null,
      data.status || "pending",
      data.checkout_url || null,
    ]
  );

  return result.insertId;
}

export async function findPaymentTransactionByCheckoutSession(
  checkoutSessionId: string
) {
  const [rows] = await db.query<PaymentTransactionRow[]>(
    `
    SELECT *
    FROM payment_transactions
    WHERE checkout_session_id = ?
    LIMIT 1
    `,
    [checkoutSessionId]
  );

  return rows[0] || null;
}

export async function updatePaymentTransactionStatus(
  checkoutSessionId: string,
  status: PaymentStatus
) {
  const [result] = await db.query<ResultSetHeader>(
    `
    UPDATE payment_transactions
    SET status = ?
    WHERE checkout_session_id = ?
    `,
    [status, checkoutSessionId]
  );

  return result.affectedRows;
}
