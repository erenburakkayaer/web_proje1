-- =========================================================
-- 66 Vizite - Veritabanı Tablo Yapıları ve Örnek Veriler
-- =========================================================

-- 1. Kullanıcılar Tablosu (Roller: user, admin, root_admin)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    plan_tier TEXT DEFAULT 'pro',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Araçlar ve QR Kodlar Tablosu
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    plate_number TEXT NOT NULL,
    brand_model TEXT NOT NULL,
    color TEXT DEFAULT 'Beyaz • Otomobil',
    parking_note TEXT DEFAULT 'Park halindedir. Acil durumda bildirim gönderebilirsiniz.',
    is_active INTEGER DEFAULT 1,
    scan_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. QR Bildirimleri Tablosu
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Örnek Araç Kaydı
INSERT INTO vehicles (id, user_id, plate_number, brand_model, color, parking_note, is_active, scan_count)
SELECT 1, 1, '34 VZT 66', '66 Vizite Demo Araç', 'Siyah • Sedan', '10 dakikaya geliyorum, acilse bildirim gönderin.', 1, 14
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE id = 1);
