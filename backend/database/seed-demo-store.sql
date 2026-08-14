USE tindatrack_db;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @demo_email = 'owner@tindatrack.test';
SET @demo_password_hash = '$2b$10$L5WmqaGKvGGLNslsBW4GrO.8LDaM6I6T8hS8qMVoq3u2DpeAjtJPu';

INSERT INTO users (
    name,
    email,
    password_hash,
    global_role,
    status
)
VALUES (
    'Demo Owner',
    @demo_email,
    @demo_password_hash,
    'business_user',
    'active'
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password_hash = VALUES(password_hash),
    status = 'active';

SELECT id INTO @demo_user_id
FROM users
WHERE email = @demo_email
LIMIT 1;

INSERT INTO businesses (
    business_name,
    business_type,
    owner_user_id,
    phone,
    address,
    status,
    trial_ends_at
)
SELECT
    'Demo Sari-Sari Store',
    'Retail',
    @demo_user_id,
    '09171234567',
    'Quezon City, Metro Manila',
    'active',
    DATE_ADD(NOW(), INTERVAL 30 DAY)
WHERE NOT EXISTS (
    SELECT 1
    FROM businesses
    WHERE owner_user_id = @demo_user_id
      AND business_name = 'Demo Sari-Sari Store'
);

SELECT id INTO @demo_business_id
FROM businesses
WHERE owner_user_id = @demo_user_id
  AND business_name = 'Demo Sari-Sari Store'
LIMIT 1;

INSERT INTO business_users (business_id, user_id, role)
VALUES (@demo_business_id, @demo_user_id, 'owner')
ON DUPLICATE KEY UPDATE role = 'owner';

DELETE sale_items
FROM sale_items
INNER JOIN sales ON sales.id = sale_items.sale_id
WHERE sales.business_id = @demo_business_id;

DELETE FROM inventory_movements WHERE business_id = @demo_business_id;
DELETE FROM expenses WHERE business_id = @demo_business_id;
DELETE FROM sales WHERE business_id = @demo_business_id;
DELETE FROM pos_sessions WHERE business_id = @demo_business_id;
DELETE FROM pos_registers WHERE business_id = @demo_business_id;
DELETE FROM products WHERE business_id = @demo_business_id;

INSERT INTO products (
    business_id,
    name,
    category,
    sku,
    unit_price,
    cost_price,
    current_stock,
    reorder_level,
    status
)
VALUES
    (@demo_business_id, 'Rice 5kg', 'Staples', 'RICE-5KG', 320.00, 265.00, 3, 12, 'active'),
    (@demo_business_id, 'Rice per kilo', 'Staples', 'RICE-KILO', 64.00, 53.00, 180, 50, 'active'),
    (@demo_business_id, 'Coca-Cola 1.5L', 'Beverages', 'COKE-1.5L', 89.00, 72.00, 24, 18, 'active'),
    (@demo_business_id, 'Lucky Me Pancit Canton 60g', 'Snacks', 'LUCKY-ME-60G', 12.00, 9.00, 55, 20, 'active'),
    (@demo_business_id, 'Canned Sardines', 'Canned Goods', 'SARDINES-155G', 55.00, 39.00, 16, 20, 'active'),
    (@demo_business_id, 'Century Tuna Flakes in Oil 155g', 'Canned Goods', 'TUNA-155G', 35.00, 28.00, 32, 12, 'active'),
    (@demo_business_id, 'Instant Coffee', 'Coffee', 'COFFEE-STICK', 30.00, 19.00, 23, 35, 'active'),
    (@demo_business_id, 'Nescafe Classic 100g', 'Coffee', 'NESCAFE-100G', 165.00, 132.00, 18, 10, 'active'),
    (@demo_business_id, 'Nescafe Stick', 'Coffee', 'NESCAFE-STICK', 8.00, 5.00, 4, 24, 'active'),
    (@demo_business_id, 'Laundry Soap', 'Household', 'SOAP-BAR', 25.00, 17.00, 44, 15, 'active'),
    (@demo_business_id, 'Safeguard Soap 90g', 'Personal Care', 'SAFEGUARD-90G', 25.00, 18.00, 5, 12, 'active'),
    (@demo_business_id, 'Head & Shoulders Shampoo Sachet', 'Personal Care', 'HS-SACHET', 12.00, 9.00, 3, 10, 'active'),
    (@demo_business_id, 'Piattos Cheese 85g', 'Snacks', 'PIATTOS-85G', 28.00, 21.00, 20, 10, 'active'),
    (@demo_business_id, 'Nestea Lemon 500ml', 'Beverages', 'NESTEA-500ML', 28.00, 21.00, 15, 8, 'active'),
    (@demo_business_id, 'Eggs 1 dozen', 'Fresh Goods', 'EGGS-12', 120.00, 96.00, 18, 10, 'active');

SELECT id INTO @rice_id FROM products WHERE business_id = @demo_business_id AND sku = 'RICE-5KG' LIMIT 1;
SELECT id INTO @rice_kilo_id FROM products WHERE business_id = @demo_business_id AND sku = 'RICE-KILO' LIMIT 1;
SELECT id INTO @coke_id FROM products WHERE business_id = @demo_business_id AND sku = 'COKE-1.5L' LIMIT 1;
SELECT id INTO @lucky_me_id FROM products WHERE business_id = @demo_business_id AND sku = 'LUCKY-ME-60G' LIMIT 1;
SELECT id INTO @sardines_id FROM products WHERE business_id = @demo_business_id AND sku = 'SARDINES-155G' LIMIT 1;
SELECT id INTO @tuna_id FROM products WHERE business_id = @demo_business_id AND sku = 'TUNA-155G' LIMIT 1;
SELECT id INTO @coffee_id FROM products WHERE business_id = @demo_business_id AND sku = 'COFFEE-STICK' LIMIT 1;
SELECT id INTO @nescafe_100g_id FROM products WHERE business_id = @demo_business_id AND sku = 'NESCAFE-100G' LIMIT 1;
SELECT id INTO @nescafe_id FROM products WHERE business_id = @demo_business_id AND sku = 'NESCAFE-STICK' LIMIT 1;
SELECT id INTO @soap_id FROM products WHERE business_id = @demo_business_id AND sku = 'SOAP-BAR' LIMIT 1;
SELECT id INTO @safeguard_id FROM products WHERE business_id = @demo_business_id AND sku = 'SAFEGUARD-90G' LIMIT 1;
SELECT id INTO @hs_id FROM products WHERE business_id = @demo_business_id AND sku = 'HS-SACHET' LIMIT 1;
SELECT id INTO @piattos_id FROM products WHERE business_id = @demo_business_id AND sku = 'PIATTOS-85G' LIMIT 1;
SELECT id INTO @nestea_id FROM products WHERE business_id = @demo_business_id AND sku = 'NESTEA-500ML' LIMIT 1;
SELECT id INTO @eggs_id FROM products WHERE business_id = @demo_business_id AND sku = 'EGGS-12' LIMIT 1;

INSERT INTO pos_registers (
    business_id,
    register_name,
    register_code,
    location,
    status
)
VALUES (
    @demo_business_id,
    'Main Counter',
    'REG-01',
    'Front counter',
    'active'
);

SELECT id INTO @demo_register_id
FROM pos_registers
WHERE business_id = @demo_business_id
  AND register_code = 'REG-01'
LIMIT 1;

INSERT INTO pos_sessions (
    business_id,
    register_id,
    opened_by_user_id,
    opening_cash,
    status,
    opened_at,
    notes
)
VALUES (
    @demo_business_id,
    @demo_register_id,
    @demo_user_id,
    1000.00,
    'open',
    TIMESTAMP(CURDATE(), '07:30:00'),
    'Demo open register session'
);

SELECT id INTO @demo_pos_session_id
FROM pos_sessions
WHERE business_id = @demo_business_id
  AND register_id = @demo_register_id
  AND status = 'open'
LIMIT 1;

INSERT INTO sales (
    business_id,
    pos_session_id,
    register_id,
    cashier_user_id,
    receipt_number,
    customer_name,
    payment_method,
    payment_status,
    subtotal,
    discount,
    total_amount,
    cash_received,
    change_due,
    sold_at
)
VALUES
    (@demo_business_id, @demo_pos_session_id, @demo_register_id, @demo_user_id, CONCAT('DEMO-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-001'), 'Walk-in Customer', 'cash', 'paid', 3200.00, 0.00, 3200.00, 3200.00, 0.00, TIMESTAMP(CURDATE(), '08:15:00')),
    (@demo_business_id, @demo_pos_session_id, @demo_register_id, @demo_user_id, CONCAT('DEMO-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-002'), 'Walk-in Customer', 'cash', 'paid', 2200.00, 0.00, 2200.00, 2200.00, 0.00, TIMESTAMP(CURDATE(), '10:20:00')),
    (@demo_business_id, @demo_pos_session_id, @demo_register_id, @demo_user_id, CONCAT('DEMO-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-003'), 'Walk-in Customer', 'qrph', 'paid', 4350.00, 0.00, 4350.00, NULL, NULL, TIMESTAMP(CURDATE(), '12:05:00')),
    (@demo_business_id, @demo_pos_session_id, @demo_register_id, @demo_user_id, CONCAT('DEMO-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-004'), 'Walk-in Customer', 'gcash', 'paid', 1850.00, 0.00, 1850.00, NULL, NULL, TIMESTAMP(CURDATE(), '14:40:00')),
    (@demo_business_id, @demo_pos_session_id, @demo_register_id, @demo_user_id, CONCAT('DEMO-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-005'), 'Walk-in Customer', 'cash', 'paid', 2750.00, 0.00, 2750.00, 2800.00, 50.00, TIMESTAMP(CURDATE(), '16:10:00')),
    (@demo_business_id, @demo_pos_session_id, @demo_register_id, @demo_user_id, CONCAT('DEMO-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-006'), 'Walk-in Customer', 'cash', 'paid', 2450.00, 0.00, 2450.00, 2500.00, 50.00, TIMESTAMP(CURDATE(), '18:25:00')),
    (@demo_business_id, NULL, @demo_register_id, @demo_user_id, CONCAT('DEMO-', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y%m%d'), '-001'), 'Walk-in Customer', 'cash', 'paid', 9800.00, 0.00, 9800.00, 9800.00, 0.00, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '15:15:00'));

SELECT id INTO @sale_1 FROM sales WHERE business_id = @demo_business_id AND receipt_number = CONCAT('DEMO-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-001') LIMIT 1;
SELECT id INTO @sale_2 FROM sales WHERE business_id = @demo_business_id AND receipt_number = CONCAT('DEMO-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-002') LIMIT 1;
SELECT id INTO @sale_3 FROM sales WHERE business_id = @demo_business_id AND receipt_number = CONCAT('DEMO-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-003') LIMIT 1;
SELECT id INTO @sale_4 FROM sales WHERE business_id = @demo_business_id AND receipt_number = CONCAT('DEMO-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-004') LIMIT 1;
SELECT id INTO @sale_5 FROM sales WHERE business_id = @demo_business_id AND receipt_number = CONCAT('DEMO-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-005') LIMIT 1;
SELECT id INTO @sale_6 FROM sales WHERE business_id = @demo_business_id AND receipt_number = CONCAT('DEMO-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-006') LIMIT 1;

INSERT INTO sale_items (
    sale_id,
    product_id,
    quantity,
    unit_label,
    unit_multiplier,
    base_quantity,
    unit_price,
    unit_cost,
    line_total
)
VALUES
    (@sale_1, @rice_kilo_id, 5, '1 kilo', 1.00, 5.00, 64.00, 53.00, 320.00),
    (@sale_1, @coke_id, 10, 'Piece', 1.00, 10.00, 89.00, 72.00, 890.00),
    (@sale_1, @coffee_id, 20, 'Piece', 1.00, 20.00, 30.00, 19.00, 600.00),
    (@sale_1, @nescafe_id, 12, 'Piece', 1.00, 12.00, 8.00, 5.00, 96.00),
    (@sale_2, @sardines_id, 20, 'Piece', 1.00, 20.00, 55.00, 39.00, 1100.00),
    (@sale_2, @eggs_id, 5, 'Pack', 1.00, 5.00, 120.00, 96.00, 600.00),
    (@sale_2, @soap_id, 20, 'Piece', 1.00, 20.00, 25.00, 17.00, 500.00),
    (@sale_3, @rice_kilo_id, 10, '1 kilo', 1.00, 10.00, 64.00, 53.00, 640.00),
    (@sale_3, @coke_id, 12, 'Piece', 1.00, 12.00, 89.00, 72.00, 1068.00),
    (@sale_3, @sardines_id, 10, 'Piece', 1.00, 10.00, 55.00, 39.00, 550.00),
    (@sale_4, @coffee_id, 25, 'Piece', 1.00, 25.00, 30.00, 19.00, 750.00),
    (@sale_4, @eggs_id, 6, 'Pack', 1.00, 6.00, 120.00, 96.00, 720.00),
    (@sale_4, @nescafe_id, 20, 'Piece', 1.00, 20.00, 8.00, 5.00, 160.00),
    (@sale_5, @rice_kilo_id, 30, '5 kilo', 5.00, 30.00, 320.00, 265.00, 1920.00),
    (@sale_5, @coke_id, 9, 'Piece', 1.00, 9.00, 89.00, 72.00, 801.00),
    (@sale_6, @sardines_id, 18, 'Piece', 1.00, 18.00, 55.00, 39.00, 990.00),
    (@sale_6, @coffee_id, 20, 'Piece', 1.00, 20.00, 30.00, 19.00, 600.00),
    (@sale_6, @soap_id, 30, 'Piece', 1.00, 30.00, 25.00, 17.00, 750.00);

INSERT INTO inventory_movements (
    business_id,
    product_id,
    movement_type,
    quantity,
    notes
)
SELECT
    @demo_business_id,
    product_id,
    'sale',
    -SUM(base_quantity),
    'Demo sales movement'
FROM sale_items
INNER JOIN sales ON sales.id = sale_items.sale_id
WHERE sales.business_id = @demo_business_id
  AND DATE(sales.sold_at) = CURDATE()
GROUP BY product_id;

INSERT INTO expenses (
    business_id,
    category,
    amount,
    description,
    expense_date
)
VALUES
    (@demo_business_id, 'Product cost', 5850.00, 'Restock cost allocation', CURDATE()),
    (@demo_business_id, 'Staff allowance', 1450.00, 'Daily staff allowance', CURDATE()),
    (@demo_business_id, 'Utilities', 1030.00, 'Electricity and store utilities', CURDATE()),
    (@demo_business_id, 'Product cost', 5200.00, 'Previous day restock cost', DATE_SUB(CURDATE(), INTERVAL 1 DAY));
