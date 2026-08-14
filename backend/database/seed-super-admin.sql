-- Development and local testing only. Never use this credential in production.
USE tindatrack_db;

INSERT INTO users (
    name,
    email,
    password_hash,
    global_role,
    status
)
VALUES (
    'TindaTrack Administrator',
    'admin@tindatrack.test',
    '$2b$12$1XcZfn2Zt0ROAOR3BTwP7OgyJKJ.s2FX3SyMiUMNaIspfqk83cz4G',
    'super_admin',
    'active'
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password_hash = VALUES(password_hash),
    global_role = 'super_admin',
    status = 'active';
