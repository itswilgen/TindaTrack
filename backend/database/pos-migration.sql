USE tindatrack_db;

CREATE TABLE IF NOT EXISTS pos_registers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    business_id BIGINT NOT NULL,
    register_name VARCHAR(100) NOT NULL,
    register_code VARCHAR(50) NOT NULL,
    location VARCHAR(120),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_business_register_code (business_id, register_code),

    FOREIGN KEY (business_id) REFERENCES businesses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS pos_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    business_id BIGINT NOT NULL,
    register_id BIGINT NOT NULL,
    opened_by_user_id BIGINT NOT NULL,
    closed_by_user_id BIGINT NULL,
    opening_cash DECIMAL(12, 2) NOT NULL DEFAULT 0,
    closing_cash DECIMAL(12, 2) NULL,
    status ENUM('open', 'closed') DEFAULT 'open',
    opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,
    notes VARCHAR(255),

    FOREIGN KEY (business_id) REFERENCES businesses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (register_id) REFERENCES pos_registers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (opened_by_user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (closed_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS pos_session_id BIGINT NULL AFTER business_id,
    ADD COLUMN IF NOT EXISTS register_id BIGINT NULL AFTER pos_session_id,
    ADD COLUMN IF NOT EXISTS cashier_user_id BIGINT NULL AFTER register_id,
    ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'paid', 'void', 'refunded') DEFAULT 'paid' AFTER payment_method,
    ADD COLUMN IF NOT EXISTS cash_received DECIMAL(12, 2) NULL AFTER total_amount,
    ADD COLUMN IF NOT EXISTS change_due DECIMAL(12, 2) NULL AFTER cash_received,
    ADD COLUMN IF NOT EXISTS notes VARCHAR(255) NULL AFTER change_due;

ALTER TABLE sale_items
    MODIFY COLUMN quantity DECIMAL(10, 2) NOT NULL,
    ADD COLUMN IF NOT EXISTS unit_label VARCHAR(50) NOT NULL DEFAULT 'Piece' AFTER quantity,
    ADD COLUMN IF NOT EXISTS unit_multiplier DECIMAL(10, 2) NOT NULL DEFAULT 1 AFTER unit_label,
    ADD COLUMN IF NOT EXISTS base_quantity DECIMAL(10, 2) NOT NULL DEFAULT 1 AFTER unit_multiplier;

ALTER TABLE inventory_movements
    MODIFY COLUMN quantity DECIMAL(10, 2) NOT NULL;

ALTER TABLE products
    MODIFY COLUMN current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    MODIFY COLUMN reorder_level DECIMAL(10, 2) NOT NULL DEFAULT 0;
