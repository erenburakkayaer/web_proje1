/**
 * MyCar - SQLite Veritabanı Modülü
 * Node.js 22+ yerleşik "node:sqlite" ve "node:crypto" modülleri kullanılmıştır.
 * Harici paket bağımlılığı gerektirmez (Zero-dependency).
 */

const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// Veritabanı dosya yolu: database/mycar.db
const dbDir = __dirname;
const dbPath = path.join(dbDir, 'mycar.db');
const schemaPath = path.join(dbDir, 'schema.sql');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Veritabanı bağlantısı
const db = new DatabaseSync(dbPath);

// Tabloları oluştur (schema.sql'den oku ve çalıştır)
function initDatabase() {
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
    console.log('✅ SQLite veritabanı ve tablolar hazırlandı:', dbPath);
  }
}

// Şifre Hashleme (PBKDF2 Güvenlik Standardı)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

// Şifre Doğrulama
function verifyPassword(password, savedHash, savedSalt) {
  const hash = crypto.pbkdf2Sync(password, savedSalt, 100000, 64, 'sha512').toString('hex');
  return hash === savedHash;
}

// Kullanıcı Kaydı (Register)
function registerUser(fullName, email, password, planTier = 'free') {
  // E-posta mükerrerlik kontrolü
  const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const existingUser = checkStmt.get(email.toLowerCase().trim());
  if (existingUser) {
    throw new Error('Bu e-posta adresi ile kayıtlı bir hesap zaten var.');
  }

  const { hash, salt } = hashPassword(password);
  const insertStmt = db.prepare(`
    INSERT INTO users (full_name, email, password_hash, salt, plan_tier)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    fullName.trim(),
    email.toLowerCase().trim(),
    hash,
    salt,
    planTier
  );

  return {
    id: result.lastInsertRowid,
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    planTier
  };
}

// Kullanıcı Girişi (Login)
function authenticateUser(email, password) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email.toLowerCase().trim());

  if (!user) {
    throw new Error('E-posta adresi veya şifre hatalı.');
  }

  const isPasswordValid = verifyPassword(password, user.password_hash, user.salt);
  if (!isPasswordValid) {
    throw new Error('E-posta adresi veya şifre hatalı.');
  }

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    planTier: user.plan_tier,
    createdAt: user.created_at
  };
}

// Kayıtlı Kullanıcıları Listele (Hocaya sunum / demo amaçlı)
function getAllUsers() {
  const stmt = db.prepare('SELECT id, full_name, email, plan_tier, created_at FROM users ORDER BY id DESC');
  return stmt.all();
}

module.exports = {
  db,
  initDatabase,
  registerUser,
  authenticateUser,
  getAllUsers
};
