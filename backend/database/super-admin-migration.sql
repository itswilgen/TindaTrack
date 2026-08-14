USE tindatrack_db;

CREATE TABLE IF NOT EXISTS platform_settings (
    setting_key VARCHAR(80) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    updated_by_user_id BIGINT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

INSERT INTO platform_settings (setting_key, setting_value)
VALUES ('default_trial_days', '30')
ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key);
