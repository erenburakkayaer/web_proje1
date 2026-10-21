<?php
/**
 * 66 Vizite - SQLite Veritabanı Modülü (PHP PDO)
 * Harici kütüphane gerektirmez. PHP 8+ yerleşik PDO_SQLITE kullanır.
 */

declare(strict_types=1);

function getDbConnection(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dbDir = __DIR__;
    $dbPath = $dbDir . DIRECTORY_SEPARATOR . 'mycar.db';
    $schemaPath = $dbDir . DIRECTORY_SEPARATOR . 'schema.sql';

    if (!is_dir($dbDir)) {
        mkdir($dbDir, 0777, true);
    }

    $isNewDb = !file_exists($dbPath);

    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Tabloları oluştur (schema.sql'den)
    if (file_exists($schemaPath)) {
        $schemaSql = file_get_contents($schemaPath);
        $pdo->exec($schemaSql);
    }

    return $pdo;
}

/**
 * Kullanıcı Kaydı (Register)
 */
function registerUser(string $fullName, string $email, string $password, string $planTier = 'pro'): array {
    $db = getDbConnection();
    $email = strtolower(trim($email));
    $fullName = trim($fullName);

    // Mükerrer e-posta kontrolü
    $checkStmt = $db->prepare('SELECT id FROM users WHERE email = :email');
    $checkStmt->execute([':email' => $email]);
    if ($checkStmt->fetch()) {
        throw new InvalidArgumentException('Bu e-posta adresi ile kayıtlı bir hesap zaten var.');
    }

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $salt = bin2hex(random_bytes(16));

    $insertStmt = $db->prepare('
        INSERT INTO users (full_name, email, password_hash, salt, plan_tier)
        VALUES (:full_name, :email, :password_hash, :salt, :plan_tier)
    ');

    $insertStmt->execute([
        ':full_name' => $fullName,
        ':email' => $email,
        ':password_hash' => $passwordHash,
        ':salt' => $salt,
        ':plan_tier' => $planTier
    ]);

    $newId = (int)$db->lastInsertId();

    return [
        'id' => $newId,
        'fullName' => $fullName,
        'email' => $email,
        'planTier' => $planTier
    ];
}

/**
 * Kullanıcı Doğrulama (Login)
 */
function authenticateUser(string $email, string $password): array {
    $db = getDbConnection();
    $email = strtolower(trim($email));

    $stmt = $db->prepare('SELECT * FROM users WHERE email = :email');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if (!$user) {
        throw new InvalidArgumentException('E-posta adresi veya şifre hatalı.');
    }

    // Hem PHP password_hash hem de PBKDF2 hash (Node'dan kalan eski kayıtlar için geriye uyumlu) desteği
    $isPasswordValid = false;
    if (password_verify($password, $user['password_hash'])) {
        $isPasswordValid = true;
    } elseif (!empty($user['salt'])) {
        // PBKDF2 Node.js uyumluluğu kontrolü
        $pbkdf2Hash = hash_pbkdf2('sha512', $password, $user['salt'], 100000, 128);
        if (hash_equals($user['password_hash'], $pbkdf2Hash)) {
            $isPasswordValid = true;
        }
    }

    if (!$isPasswordValid) {
        throw new InvalidArgumentException('E-posta adresi veya şifre hatalı.');
    }

    return [
        'id' => (int)$user['id'],
        'fullName' => $user['full_name'],
        'email' => $user['email'],
        'planTier' => $user['plan_tier'] ?? 'pro',
        'createdAt' => $user['created_at'] ?? null
    ];
}

/**
 * Tüm Kullanıcıları Listele (Demo / Yönetim)
 */
function getAllUsers(): array {
    $db = getDbConnection();
    $stmt = $db->query('SELECT id, full_name, email, plan_tier, created_at FROM users ORDER BY id DESC');
    return $stmt->fetchAll();
}
