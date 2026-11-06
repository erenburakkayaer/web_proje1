<?php
// 66 Vizite - Veritabanı ve 10 Kademeli Yönetici Hiyerarşisi Modülü
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Sadece Admin Paneline Girebilen 10 Yönetici Kademesi (Seviye 10 -> 1)
function getYoneticiRolleri(): array {
    return [
        'genel_mudur'     => ['level' => 10, 'title' => '1. Genel Müdür'],
        'genel_mudur_yrd' => ['level' => 9,  'title' => '2. Genel Müdür Yardımcısı'],
        'ulke_sorumlusu'  => ['level' => 8,  'title' => '3. Ülke Sorumlusu'],
        'ulke_yardimcisi' => ['level' => 7,  'title' => '4. Ülke Sorumlusu Yardımcısı'],
        'bolge_sorumlusu' => ['level' => 6,  'title' => '5. Bölge Sorumlusu'],
        'bolge_yardimcisi'=> ['level' => 5,  'title' => '6. Bölge Sorumlusu Yardımcısı'],
        'il_sorumlusu'    => ['level' => 4,  'title' => '7. İl Sorumlusu'],
        'il_yardimcisi'   => ['level' => 3,  'title' => '8. İl Sorumlusu Yardımcısı'],
        'ilce_sorumlusu'  => ['level' => 2,  'title' => '9. İlçe Sorumlusu'],
        'ilce_yardimcisi' => ['level' => 1,  'title' => '10. İlçe Sorumlusu Yardımcısı']
    ];
}

// Normal üye seviyesi 0'dır (Admin paneline giremez)
function getRolSeviye(string $role): int {
    $roller = getYoneticiRolleri();
    return $roller[$role]['level'] ?? 0;
}

function getDb() {
    static $db = null;
    if ($db !== null) return $db;

    $db = new PDO('sqlite:' . __DIR__ . '/mycar.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $db->exec(file_get_contents(__DIR__ . '/schema.sql'));

    $uCols = array_column($db->query("PRAGMA table_info(users)")->fetchAll(), 'name');
    if (!in_array('role', $uCols)) $db->exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");

    $vCols = array_column($db->query("PRAGMA table_info(vehicles)")->fetchAll(), 'name');
    if (!in_array('parking_note', $vCols)) $db->exec("ALTER TABLE vehicles ADD COLUMN parking_note TEXT DEFAULT 'Park halindedir.'");
    if (!in_array('is_active', $vCols))    $db->exec("ALTER TABLE vehicles ADD COLUMN is_active INTEGER DEFAULT 1");
    if (!in_array('scan_count', $vCols))   $db->exec("ALTER TABLE vehicles ADD COLUMN scan_count INTEGER DEFAULT 0");

    // Admin Paneline Girebilen 10 Hazır Yönetici Hesabı (Gmail - Şifre: 123456)
    $sifreHash = password_hash('123456', PASSWORD_DEFAULT);
    $yoneticiHesaplari = [
        ['Genel Müdür',                'genelmudur@gmail.com',    'genel_mudur',     'business'],
        ['Genel Müdür Yardımcısı',     'genelmuduryrd@gmail.com', 'genel_mudur_yrd', 'business'],
        ['Ülke Sorumlusu',             'ulke@gmail.com',          'ulke_sorumlusu',  'business'],
        ['Ülke Sorumlusu Yardımcısı',  'ulkeyrd@gmail.com',       'ulke_yardimcisi', 'business'],
        ['Bölge Sorumlusu',            'bolge@gmail.com',         'bolge_sorumlusu', 'pro'],
        ['Bölge Sorumlusu Yardımcısı', 'bolgeyrd@gmail.com',      'bolge_yardimcisi','pro'],
        ['İl Sorumlusu',               'il@gmail.com',            'il_sorumlusu',    'pro'],
        ['İl Sorumlusu Yardımcısı',    'ilyrd@gmail.com',         'il_yardimcisi',   'pro'],
        ['İlçe Sorumlusu',             'ilce@gmail.com',          'ilce_sorumlusu',  'pro'],
        ['İlçe Sorumlusu Yardımcısı',  'ilceyrd@gmail.com',       'ilce_yardimcisi', 'pro']
    ];

    $kontrol = $db->prepare("SELECT id FROM users WHERE email = ?");
    $ekle    = $db->prepare("INSERT INTO users (full_name, email, password_hash, salt, role, plan_tier) VALUES (?, ?, ?, '', ?, ?)");
    foreach ($yoneticiHesaplari as $h) {
        $kontrol->execute([$h[1]]);
        if (!$kontrol->fetch()) {
            $ekle->execute([$h[0], $h[1], $sifreHash, $h[2], $h[3]]);
        } else {
            $db->prepare("UPDATE users SET full_name = ?, role = ? WHERE email = ?")->execute([$h[0], $h[2], $h[1]]);
        }
    }

    return $db;
}
