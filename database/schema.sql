-- ============================================================================
-- 66 Vizite - Veritabanı Şeması (Database Schema)
-- Standart SQL & SQLite Uyumlu
-- ============================================================================

-- 1. Kullanıcılar Tablosu (Users)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    phone_number VARCHAR(20) DEFAULT NULL,
    plan_tier VARCHAR(20) DEFAULT 'pro' CHECK(plan_tier IN ('free', 'pro', 'business')),
    sms_notification INTEGER DEFAULT 1,
    call_bridge INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Araçlar Tablosu (Vehicles)
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    brand_model VARCHAR(100) DEFAULT NULL,
    color VARCHAR(50) DEFAULT NULL,
    parking_note TEXT DEFAULT 'Park halindedir. Acil durumda arayabilirsiniz.',
    safe_park_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. QR Kodlar Tablosu (QR Codes)
CREATE TABLE IF NOT EXISTS qr_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    qr_token VARCHAR(64) NOT NULL UNIQUE,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    scan_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- 4. QR Tarama ve Ziyaretçi Logları (Scans Log)
CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    action_type VARCHAR(50) DEFAULT 'scan', -- 'scan', 'call', 'note', 'blocked', 'lights', 'accident', 'tow'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- İndeksler (Sorgu Performansı ve Benzersizlik İçin)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_vehicles_user ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number);
CREATE INDEX IF NOT EXISTS idx_qr_token ON qr_codes(qr_token);
CREATE INDEX IF NOT EXISTS idx_scans_vehicle ON scans(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at);
