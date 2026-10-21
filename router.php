<?php
/**
 * 66 Vizite - PHP Dahili Geliştirme Sunucusu Router'ı
 * Kullanım: php -S localhost:8000 router.php
 */

declare(strict_types=1);

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$publicDir = __DIR__;

// 1. Ana Dizin Yönlendirmesi
if ($uri === '/' || $uri === '') {
    $indexFile = $publicDir . DIRECTORY_SEPARATOR . 'index.html';
    if (file_exists($indexFile)) {
        require $indexFile;
        exit;
    }
}

// 2. API Endpoint Yönlendirmeleri
$apiRoutes = [
    '/api/auth/register' => $publicDir . '/api/auth/register.php',
    '/api/auth/login'    => $publicDir . '/api/auth/login.php',
    '/api/users'         => $publicDir . '/api/users.php',
];

if (isset($apiRoutes[$uri])) {
    require $apiRoutes[$uri];
    exit;
}

// 3. Statik Dosyalar (.html, .css, .js, .svg, .png vb.)
$filePath = realpath($publicDir . $uri);

// Dizin dışına çıkış güvenliği
if ($filePath && str_starts_with($filePath, $publicDir) && is_file($filePath)) {
    // PHP Dahili Sunucusunun statik dosyayı doğrudan servis etmesine izin ver
    return false;
}

// Bulunamayan sayfa
http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
echo '<h1>404 - Sayfa veya Dosya Bulunamadı</h1><p><a href="/">Ana Sayfaya Dön</a></p>';
exit;
