import db from "../config/db";
import { PoolConnection, RowDataPacket } from "mysql2/promise";
import { expireEndedBusinessesForUser } from "./business.model";

export type BusinessUserRole = "owner" | "cashier" | "inventory_staff";

export type BusinessUserRow = RowDataPacket & {
  id: number;
  business_id: number;
  user_id: number;
  role: BusinessUserRole;
};

export type UserAccessRow = RowDataPacket & {
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  user_status: "active" | "inactive" | "suspended";
  business_id: number;
  business_name: string;
  business_status: "trial" | "active" | "expired" | "suspended";
  trial_ends_at: Date | null;
  role: BusinessUserRole;
};

export async function createBusinessUser(
  connection: PoolConnection,
  data: {
    business_id: number;
    user_id: number;
    role: BusinessUserRole;
  }
) {
  await connection.query(
    `
    INSERT INTO business_users (business_id, user_id, role)
    VALUES (?, ?, ?)
    `,
    [data.business_id, data.user_id, data.role]
  );
}

export async function findBusinessUserRole(businessId: number, userId: number) {
  const [rows] = await db.query<BusinessUserRow[]>(
    `
    SELECT *
    FROM business_users
    WHERE business_id = ?
      AND user_id = ?
    LIMIT 1
    `,
    [businessId, userId]
  );

  return rows[0] || null;
}

export async function findUserAccessById(userId: number) {
  await expireEndedBusinessesForUser(userId);
  const [rows] = await db.query<UserAccessRow[]>(
    `
    SELECT
      users.id AS user_id,
      users.name,
      users.email,
      users.phone,
      users.status AS user_status,
      businesses.id AS business_id,
      businesses.business_name,
      businesses.status AS business_status,
      businesses.trial_ends_at,
      business_users.role
    FROM users
    INNER JOIN business_users
      ON business_users.user_id = users.id
    INNER JOIN businesses
      ON businesses.id = business_users.business_id
    WHERE users.id = ?
    ORDER BY business_users.role = 'owner' DESC, businesses.created_at ASC
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}
