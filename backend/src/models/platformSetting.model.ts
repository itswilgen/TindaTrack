import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import db from "../config/db";

const DEFAULT_TRIAL_DAYS = 30;

function parseTrialDays(value: unknown) {
  const days = Number(value);
  return Number.isInteger(days) && days >= 1 && days <= 365
    ? days
    : DEFAULT_TRIAL_DAYS;
}

export async function getDefaultTrialDays(connection?: PoolConnection) {
  const executor = connection || db;
  const [rows] = await executor.query<RowDataPacket[]>(
    "SELECT setting_value FROM platform_settings WHERE setting_key = 'default_trial_days' LIMIT 1"
  );

  return parseTrialDays(rows[0]?.setting_value);
}

export async function setDefaultTrialDays(days: number, updatedByUserId: number) {
  await db.query(
    `
    INSERT INTO platform_settings (setting_key, setting_value, updated_by_user_id)
    VALUES ('default_trial_days', ?, ?)
    ON DUPLICATE KEY UPDATE
      setting_value = VALUES(setting_value),
      updated_by_user_id = VALUES(updated_by_user_id),
      updated_at = CURRENT_TIMESTAMP
    `,
    [String(days), updatedByUserId]
  );
}
