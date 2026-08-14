import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "../config/db";
import { getDefaultTrialDays } from "./platformSetting.model";

export type AccountStatus = "active" | "inactive" | "suspended";
export type BusinessStatus = "trial" | "active" | "expired" | "suspended";

export async function getAdminOverview() {
  await db.query(
    `
    UPDATE businesses AS business
    LEFT JOIN subscriptions AS subscription ON subscription.business_id = business.id
    SET business.status = 'expired'
    WHERE (business.status = 'trial' AND business.trial_ends_at <= NOW())
       OR (
         business.status = 'active'
         AND subscription.id IS NOT NULL
         AND (subscription.status <> 'active' OR subscription.ends_at <= NOW())
       )
    `
  );

  const [businesses] = await db.query<RowDataPacket[]>(
    `
    SELECT
      business.id,
      business.business_name,
      business.logo_url,
      business.status,
      business.selected_plan,
      business.trial_ends_at,
      business.created_at,
      owner.id AS owner_user_id,
      owner.name AS owner_name,
      owner.email AS owner_email,
      owner.phone AS owner_phone,
      COUNT(DISTINCT access.user_id) AS user_count
    FROM businesses AS business
    INNER JOIN users AS owner ON owner.id = business.owner_user_id
    LEFT JOIN business_users AS access ON access.business_id = business.id
    GROUP BY business.id, owner.id
    ORDER BY business.created_at DESC
    LIMIT 500
    `
  );

  const [users] = await db.query<RowDataPacket[]>(
    `
    SELECT
      user.id,
      user.name,
      user.email,
      user.phone,
      user.global_role,
      user.status,
      user.created_at,
      business.business_name,
      access.role AS business_role
    FROM users AS user
    LEFT JOIN business_users AS access ON access.user_id = user.id
    LEFT JOIN businesses AS business ON business.id = access.business_id
    ORDER BY user.created_at DESC
    LIMIT 1000
    `
  );

  const defaultTrialDays = await getDefaultTrialDays();
  return {
    settings: { default_trial_days: defaultTrialDays },
    stats: {
      businesses: businesses.length,
      users: users.length,
      trials: businesses.filter((row) => row.status === "trial").length,
      locked: businesses.filter(
        (row) => row.status === "expired" || row.status === "suspended"
      ).length,
    },
    businesses,
    users,
  };
}

export async function updatePlatformUserStatus(userId: number, status: AccountStatus) {
  const [result] = await db.query<ResultSetHeader>(
    "UPDATE users SET status = ? WHERE id = ?",
    [status, userId]
  );
  return result.affectedRows;
}

export async function updateBusinessStatus(
  businessId: number,
  status: BusinessStatus,
  defaultTrialDays: number
) {
  const [result] = await db.query<ResultSetHeader>(
    `
    UPDATE businesses
    SET
      status = ?,
      trial_ends_at = CASE
        WHEN ? = 'trial' AND (trial_ends_at IS NULL OR trial_ends_at <= NOW())
          THEN DATE_ADD(NOW(), INTERVAL ? DAY)
        ELSE trial_ends_at
      END
    WHERE id = ?
    `,
    [status, status, defaultTrialDays, businessId]
  );
  return result.affectedRows;
}

export async function updateBusinessTrialDeadline(businessId: number, deadline: string) {
  const [result] = await db.query<ResultSetHeader>(
    `
    UPDATE businesses
    SET status = 'trial', selected_plan = 'free_trial', trial_ends_at = CONCAT(?, ' 23:59:59')
    WHERE id = ? AND status IN ('trial', 'expired')
    `,
    [deadline, businessId]
  );
  return result.affectedRows;
}
