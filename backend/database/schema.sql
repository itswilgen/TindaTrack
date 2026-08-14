CREATE DATABASE IF NOT EXISTS tindatrack_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE tindatrack_db;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    firebase_uid VARCHAR(255) UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30) UNIQUE,
    password_hash VARCHAR(255),
    global_role ENUM('super_admin', 'business_user') DEFAULT 'business_user',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS businesses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    business_name VARCHAR(150) NOT NULL,
    business_type VARCHAR(100),
    owner_user_id BIGINT NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    logo_url MEDIUMTEXT,
    selected_plan VARCHAR(50) NOT NULL DEFAULT 'free_trial',
    status ENUM('trial', 'active', 'expired', 'suspended') DEFAULT 'trial',
    trial_ends_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS business_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    business_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role ENUM('owner', 'cashier', 'inventory_staff') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_business_user (business_id, user_id),

    FOREIGN KEY (business_id) REFERENCES businesses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

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

CREATE TABLE IF NOT EXISTS payment_transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    checkout_session_id VARCHAR(255) UNIQUE NOT NULL,
    provider ENUM('mock', 'paymongo') NOT NULL,
    business_id BIGINT NULL,
    user_id BIGINT NULL,
    plan VARCHAR(50) NOT NULL,
    amount INT NOT NULL,
    currency VARCHAR(10) DEFAULT 'PHP',
    customer_email VARCHAR(150),
    customer_name VARCHAR(100),
    status ENUM('pending', 'paid', 'cancelled', 'failed') DEFAULT 'pending',
    checkout_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (business_id) REFERENCES businesses(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    business_id BIGINT UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL,
    status ENUM('active', 'cancelled', 'expired') DEFAULT 'active',
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (business_id) REFERENCES businesses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    business_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    sku VARCHAR(80),
    barcode VARCHAR(100),
    image_url MEDIUMTEXT,
    unit_label VARCHAR(50) DEFAULT 'Piece',
    supplier VARCHAR(150),
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    reorder_level DECIMAL(10, 2) NOT NULL DEFAULT 0,
    track_stock TINYINT(1) NOT NULL DEFAULT 1,
    show_in_pos TINYINT(1) NOT NULL DEFAULT 1,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_business_sku (business_id, sku),

    FOREIGN KEY (business_id) REFERENCES businesses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS sales (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    business_id BIGINT NOT NULL,
    pos_session_id BIGINT NULL,
    register_id BIGINT NULL,
    cashier_user_id BIGINT NULL,
    receipt_number VARCHAR(80) NOT NULL,
    customer_name VARCHAR(120),
    payment_method ENUM('cash', 'qrph', 'gcash', 'card') DEFAULT 'cash',
    payment_status ENUM('pending', 'paid', 'void', 'refunded') DEFAULT 'paid',
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cash_received DECIMAL(12, 2) NULL,
    change_due DECIMAL(12, 2) NULL,
    notes VARCHAR(255),
    sold_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_business_receipt (business_id, receipt_number),

    FOREIGN KEY (business_id) REFERENCES businesses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (pos_session_id) REFERENCES pos_sessions(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (register_id) REFERENCES pos_registers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (cashier_user_id) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS sale_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sale_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_label VARCHAR(50) NOT NULL DEFAULT 'Piece',
    unit_multiplier DECIMAL(10, 2) NOT NULL DEFAULT 1,
    base_quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    unit_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12, 2) NOT NULL,

    FOREIGN KEY (sale_id) REFERENCES sales(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    business_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    movement_type ENUM('stock_in', 'sale', 'adjustment') NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (business_id) REFERENCES businesses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS expenses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    business_id BIGINT NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description VARCHAR(255),
    expense_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (business_id) REFERENCES businesses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS business_settings (
    business_id BIGINT PRIMARY KEY,
    low_stock_alerts TINYINT(1) NOT NULL DEFAULT 1,
    daily_sales_summary TINYINT(1) NOT NULL DEFAULT 1,
    payment_updates TINYINT(1) NOT NULL DEFAULT 1,
    staff_activity TINYINT(1) NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (business_id) REFERENCES businesses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
