<?php
// 66 Vizite - PHP Sunucu Yönlendiricisi ve Admin Paneli Koruması
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. ADMİN PANELİ KORUMASI: Sadece 10 Yönetici Hesabı (roleLevel >= 1) Girebilir!
if ($uri === '/dashboard.html') {
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');

    $aktifUye = $_SESSION['user'] ?? null;
    $yetkiSeviyesi = (int)($aktifUye['roleLevel'] ?? 0);

    // Oturum yoksa veya 10 yönetici hesabından biri değilse kesinlikle engelle
    if (!$aktifUye || $yetkiSeviyesi < 1) {
        header('Location: /index.html?yetkisiz=1');
        exit;
    }

    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/dashboard.html');
    exit;
}

// 2. Ana Sayfa
if ($uri === '/' || $uri === '') {
    require __DIR__ . '/index.html';
    exit;
}

// 3. API Yönlendirmeleri
$eskiYollar = [
    '/api/auth/register' => 'register',
    '/api/auth/login'    => 'login',
    '/api/users'         => 'users'
];
if (isset($eskiYollar[$uri])) {
    $_GET['islem'] = $eskiYollar[$uri];
    require __DIR__ . '/api.php';
    exit;
}

// 4. Statik Dosyalar (.css, .js, .png vb.)
if (file_exists(__DIR__ . $uri) && is_file(__DIR__ . $uri)) {
    return false;
}

http_response_code(404);
require __DIR__ . '/index.html';
