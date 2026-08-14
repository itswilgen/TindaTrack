USE tindatrack_db;

ALTER TABLE users
    ADD COLUMN phone VARCHAR(30) NULL AFTER email,
    ADD UNIQUE KEY unique_user_phone (phone);

ALTER TABLE businesses
    ADD COLUMN logo_url MEDIUMTEXT NULL AFTER address,
    ADD COLUMN selected_plan VARCHAR(50) NOT NULL DEFAULT 'free_trial' AFTER logo_url;

UPDATE businesses
SET trial_ends_at = DATE_ADD(created_at, INTERVAL 1 MONTH)
WHERE status = 'trial'
  AND (
    trial_ends_at IS NULL
    OR trial_ends_at < DATE_ADD(created_at, INTERVAL 1 MONTH)
  );
