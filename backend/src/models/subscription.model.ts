import db from "../config/db";

export async function activateBusinessSubscription(data: {
  business_id: number;
  plan: string;
}) {
  await db.query(
    `
    UPDATE businesses
    SET status = 'active', selected_plan = ?
    WHERE id = ?
    `,
    [data.plan, data.business_id]
  );

  await db.query(
    `
    INSERT INTO subscriptions (
      business_id,
      plan,
      status,
      starts_at,
      ends_at
    )
    VALUES (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))
    ON DUPLICATE KEY UPDATE
      plan = VALUES(plan),
      status = 'active',
      starts_at = NOW(),
      ends_at = DATE_ADD(NOW(), INTERVAL 1 MONTH),
      updated_at = CURRENT_TIMESTAMP
    `,
    [data.business_id, data.plan]
  );
}
