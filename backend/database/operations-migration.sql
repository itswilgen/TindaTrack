USE tindatrack_db;

CREATE TABLE IF NOT EXISTS business_settings (
    business_id BIGINT PRIMARY KEY,
    low_stock_alerts TINYINT(1) NOT NULL DEFAULT 1,
    daily_sales_summary TINYINT(1) NOT NULL DEFAULT 1,
    payment_updates TINYINT(1) NOT NULL DEFAULT 1,
    staff_activity TINYINT(1) NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE CASCADE
);
