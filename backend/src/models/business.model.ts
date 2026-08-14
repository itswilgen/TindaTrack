import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "../config/db";

export type BusinessRow = RowDataPacket & {
  id: number;
  business_name: string;
  business_type: string | null;
  owner_user_id: number;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  selected_plan: string;
  status: "trial" | "active" | "expired" | "suspended";
  trial_ends_at: Date | null;
};

export async function createBusiness(
  connection: PoolConnection,
  data: {
    business_name: string;
    business_type?: string | null;
    owner_user_id: number;
    phone?: string | null;
    address?: string | null;
    logo_url?: string | null;
    selected_plan?: string;
    trial_days?: number;
  }
) {
  const [result] = await connection.query<ResultSetHeader>(
    `
    INSERT INTO businesses (
      business_name,
      business_type,
      owner_user_id,
      phone,
      address,
      logo_url,
      selected_plan,
      status,
      trial_ends_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'trial', DATE_ADD(NOW(), INTERVAL ? DAY))
    `,
    [
      data.business_name,
      data.business_type || null,
      data.owner_user_id,
      data.phone || null,
      data.address || null,
      data.logo_url || null,
      data.selected_plan || "free_trial",
      data.trial_days || 30,
    ]
  );

  return result.insertId;
}

export async function expireEndedBusinessesForUser(userId: number) {
  await db.query(
    `
    UPDATE businesses AS business
    INNER JOIN business_users AS access ON access.business_id = business.id
    LEFT JOIN subscriptions AS subscription ON subscription.business_id = business.id
    SET business.status = 'expired'
    WHERE access.user_id = ?
      AND (
        (business.status = 'trial' AND business.trial_ends_at <= NOW())
        OR (
          business.status = 'active'
          AND subscription.id IS NOT NULL
          AND (subscription.status <> 'active' OR subscription.ends_at <= NOW())
        )
      )
    `,
    [userId]
  );
}

export async function findPrimaryBusinessByUserId(userId: number) {
  await expireEndedBusinessesForUser(userId);
  const [rows] = await db.query<BusinessRow[]>(
    `
    SELECT businesses.*
    FROM businesses
    INNER JOIN business_users
      ON business_users.business_id = businesses.id
    WHERE business_users.user_id = ?
    ORDER BY
      business_users.role = 'owner' DESC,
      businesses.created_at ASC
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}
