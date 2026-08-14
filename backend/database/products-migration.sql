USE tindatrack_db;

SET @db_name = DATABASE();

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE products ADD COLUMN barcode VARCHAR(100) NULL AFTER sku',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'barcode'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE products ADD COLUMN image_url MEDIUMTEXT NULL AFTER barcode',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'image_url'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE products ADD COLUMN unit_label VARCHAR(50) DEFAULT ''Piece'' AFTER image_url',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'unit_label'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE products ADD COLUMN supplier VARCHAR(150) NULL AFTER unit_label',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'supplier'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE products ADD COLUMN track_stock TINYINT(1) NOT NULL DEFAULT 1 AFTER reorder_level',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'track_stock'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE products ADD COLUMN show_in_pos TINYINT(1) NOT NULL DEFAULT 1 AFTER track_stock',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @db_name
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'show_in_pos'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE products
SET unit_label = COALESCE(unit_label, 'Piece'),
    track_stock = COALESCE(track_stock, 1),
    show_in_pos = COALESCE(show_in_pos, 1);
