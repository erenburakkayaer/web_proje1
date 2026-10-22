/**
 * 66 Vizite - SQLite Veritabanı ve İş Mantığı Katmanı
 * Node.js 22+ "node:sqlite", bcryptjs ve crypto modülleri
 */

const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');

// Veritabanı dosya yolları
const dbDir = __dirname;
const dbPath = path.join(dbDir, 'mycar.db');
const schemaPath = path.join(dbDir, 'schema.sql');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Veritabanı bağlantısı
const db = new DatabaseSync(dbPath);

// Kolon var mı kontrolü
function columnExists(table, column) {
  try {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    return info.some(col => col.name === column);
  } catch (e) {
    return false;
  }
}

// Güvenli Şema Güncellemesi
function initDatabase() {
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }

  // Gerekli ek kolonları güvenle ekle
  try {
    if (!columnExists('vehicles', 'parking_note')) {
      db.exec("ALTER TABLE vehicles ADD COLUMN parking_note TEXT DEFAULT 'Park halindedir. Acil durumda arayabilirsiniz.'");
    }
    if (!columnExists('vehicles', 'safe_park_active')) {
      db.exec("ALTER TABLE vehicles ADD COLUMN safe_park_active INTEGER DEFAULT 1");
    }
    if (!columnExists('users', 'sms_notification')) {
      db.exec("ALTER TABLE users ADD COLUMN sms_notification INTEGER DEFAULT 1");
    }
    if (!columnExists('users', 'call_bridge')) {
      db.exec("ALTER TABLE users ADD COLUMN call_bridge INTEGER DEFAULT 1");
    }
  } catch (e) {
    console.warn('Şema güncelleme notu:', e.message);
  }

  // Başlangıç Kullanıcısı ve Demo Araçlarını Kontrol Et
  try {
    const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get()?.cnt || 0;
    let mainUserId = 1;

    if (userCount === 0) {
      const demoUser = registerUser('Osman Can Acar', 'osmancanacar805@gmail.com', '123456', 'pro');
      mainUserId = demoUser.id;
    } else {
      const firstUser = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get();
      if (firstUser) mainUserId = firstUser.id;
    }

    const vehicleCount = db.prepare('SELECT COUNT(*) as cnt FROM vehicles').get()?.cnt || 0;
    if (vehicleCount === 0) {
      addVehicle(mainUserId, '34 VZT 66', 'BMW 320i M Sport (2022)', 'Metalik Gri • Bireysel Kullanım', 'Ön camda telefon yerine 66 Vizite aktiftir. Acil durumlarda arayabilirsiniz.');
      addVehicle(mainUserId, '06 ANK 1923', 'Tesla Model Y Long Range (2023)', 'İnci Beyazı • Şirket Aracı', 'Şarj alanında park halindedir.');
    }

    // Analitik tablosunda örnek gerçekçi veri yoksa son 7 güne ait tarama logları oluştur
    const scanCount = db.prepare('SELECT COUNT(*) as cnt FROM scans').get()?.cnt || 0;
    if (scanCount === 0) {
      seedDemoScans();
    }
  } catch (err) {
    console.warn('Tohumlama uyarısı:', err.message);
  }

  console.log('✅ SQLite veritabanı ve tablolar hazırlandı:', dbPath);
}

// Gerçekçi Demo Tarama Verileri
function seedDemoScans() {
  try {
    const vList = db.prepare('SELECT id, plate_number FROM vehicles LIMIT 2').all();
    if (vList.length === 0) return;

    const v1 = vList[0];
    const v2 = vList[1] || vList[0];
    const actions = ['scan', 'scan', 'scan', 'call', 'blocked', 'lights', 'accident'];

    // Son 7 gün için rastgele taramalar
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const countForDay = Math.floor(Math.random() * 8) + 4; // Gün başına 4-11 tarama
      for (let i = 0; i < countForDay; i++) {
        const vehicle = Math.random() > 0.4 ? v1 : v2;
        const act = actions[Math.floor(Math.random() * actions.length)];
        const insertStmt = db.prepare(`
          INSERT INTO scans (vehicle_id, plate_number, ip_address, user_agent, action_type, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days', '+' || ? || ' hours'))
        `);
        insertStmt.run(vehicle.id, vehicle.plate_number, '127.0.0.1', 'Mobile Safari / iPhone', act, dayOffset, i * 2);
      }
    }

    // qr_codes scan_count senkronizasyonu
    db.exec(`
      UPDATE qr_codes
      SET scan_count = (SELECT COUNT(*) FROM scans WHERE scans.vehicle_id = qr_codes.vehicle_id)
    `);
  } catch (e) {
    console.warn('Demo tarama verisi hatası:', e.message);
  }
}

// ==========================================
// KULLANICI İŞLEMLERİ
// ==========================================

// Şifre Hashleme
function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  return { hash, salt };
}

// Şifre Doğrulama (Bcrypt ve geriye dönük PBKDF2 desteği)
function verifyPassword(password, savedHash, savedSalt) {
  if (savedHash && (savedHash.startsWith('$2a$') || savedHash.startsWith('$2b$') || savedHash.startsWith('$2y$'))) {
    return bcrypt.compareSync(password, savedHash);
  }
  if (savedSalt && savedSalt !== 'bcrypt') {
    const hash = crypto.pbkdf2Sync(password, savedSalt, 100000, 64, 'sha512').toString('hex');
    if (hash === savedHash) return true;
  }
  return false;
}

// Kullanıcı Kaydı (Register)
function registerUser(fullName, email, password, planTier = 'pro') {
  const cleanEmail = email.toLowerCase().trim();
  const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const existingUser = checkStmt.get(cleanEmail);
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
    cleanEmail,
    hash,
    salt,
    planTier
  );

  return {
    id: result.lastInsertRowid,
    fullName: fullName.trim(),
    email: cleanEmail,
    planTier
  };
}

// Kullanıcı Girişi (Login)
function authenticateUser(email, password) {
  const cleanEmail = email.toLowerCase().trim();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(cleanEmail);

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
    phoneNumber: user.phone_number || '',
    planTier: user.plan_tier || 'pro',
    smsNotification: user.sms_notification ?? 1,
    callBridge: user.call_bridge ?? 1,
    createdAt: user.created_at
  };
}

// ID'ye Göre Güvenli Kullanıcı Getir
function getUserById(id) {
  const stmt = db.prepare(`
    SELECT id, full_name as fullName, email, phone_number as phoneNumber,
           plan_tier as planTier, sms_notification as smsNotification,
           call_bridge as callBridge, created_at as createdAt
    FROM users WHERE id = ?
  `);
  return stmt.get(Number(id));
}

// Profil Güncelle
function updateUserProfile(userId, { fullName, phoneNumber, smsNotification, callBridge }) {
  const user = getUserById(userId);
  if (!user) throw new Error('Kullanıcı bulunamadı.');

  const newName = fullName !== undefined ? String(fullName).trim() : user.fullName;
  const newPhone = phoneNumber !== undefined ? String(phoneNumber).trim() : user.phoneNumber;
  const newSms = smsNotification !== undefined ? (smsNotification ? 1 : 0) : user.smsNotification;
  const newCall = callBridge !== undefined ? (callBridge ? 1 : 0) : user.callBridge;

  const stmt = db.prepare(`
    UPDATE users
    SET full_name = ?, phone_number = ?, sms_notification = ?, call_bridge = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(newName, newPhone, newSms, newCall, Number(userId));

  return getUserById(userId);
}

// Şifre Değiştir
function updateUserPassword(userId, currentPassword, newPassword) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(Number(userId));
  if (!user) throw new Error('Kullanıcı bulunamadı.');

  const isValid = verifyPassword(currentPassword, user.password_hash, user.salt);
  if (!isValid) throw new Error('Mevcut şifreniz hatalı.');

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Yeni şifre en az 6 karakter olmalıdır.');
  }

  const { hash, salt } = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(hash, salt, Number(userId));

  return true;
}

// Tüm Kullanıcılar
function getAllUsers() {
  const stmt = db.prepare('SELECT id, full_name, email, plan_tier, created_at FROM users ORDER BY id DESC');
  return stmt.all();
}

// ==========================================
// ARAÇ İŞLEMLERİ (FULL CRUD)
// ==========================================

// Araçları Listele
function getVehicles(userId = null) {
  if (userId) {
    const stmt = db.prepare(`
      SELECT v.*, q.qr_token, COALESCE(q.is_active, 1) as is_active, COALESCE(q.scan_count, 0) as scan_count
      FROM vehicles v
      LEFT JOIN qr_codes q ON q.vehicle_id = v.id
      WHERE v.user_id = ?
      ORDER BY v.id DESC
    `);
    return stmt.all(Number(userId));
  }
  const stmt = db.prepare(`
    SELECT v.*, q.qr_token, COALESCE(q.is_active, 1) as is_active, COALESCE(q.scan_count, 0) as scan_count,
           u.full_name as owner_name, u.email as owner_email
    FROM vehicles v
    LEFT JOIN qr_codes q ON q.vehicle_id = v.id
    LEFT JOIN users u ON u.id = v.user_id
    ORDER BY v.id DESC
  `);
  return stmt.all();
}

// ID'ye Göre Tekil Araç
function getVehicleById(id, userId = null) {
  if (userId) {
    const stmt = db.prepare(`
      SELECT v.*, q.qr_token, COALESCE(q.is_active, 1) as is_active, COALESCE(q.scan_count, 0) as scan_count
      FROM vehicles v
      LEFT JOIN qr_codes q ON q.vehicle_id = v.id
      WHERE v.id = ? AND v.user_id = ?
    `);
    return stmt.get(Number(id), Number(userId));
  }
  const stmt = db.prepare(`
    SELECT v.*, q.qr_token, COALESCE(q.is_active, 1) as is_active, COALESCE(q.scan_count, 0) as scan_count
    FROM vehicles v
    LEFT JOIN qr_codes q ON q.vehicle_id = v.id
    WHERE v.id = ?
  `);
  return stmt.get(Number(id));
}

// Plakaya Göre Araç
function getVehicleByPlate(plateNumber) {
  const clean = String(plateNumber || '').toUpperCase().trim();
  const stmt = db.prepare(`
    SELECT v.*, q.qr_token, COALESCE(q.is_active, 1) as is_active, COALESCE(q.scan_count, 0) as scan_count,
           u.full_name as owner_name, u.phone_number as owner_phone, u.sms_notification, u.call_bridge
    FROM vehicles v
    LEFT JOIN qr_codes q ON q.vehicle_id = v.id
    LEFT JOIN users u ON u.id = v.user_id
    WHERE v.plate_number = ?
  `);
  return stmt.get(clean);
}

// Yeni Araç Ekle
function addVehicle(userId, plateNumber, brandModel, color = '', parkingNote = '') {
  const cleanPlate = String(plateNumber || '').toUpperCase().trim();
  const cleanBrand = String(brandModel || '').trim();
  const cleanColor = String(color || 'Bireysel Araç').trim();
  const cleanNote = String(parkingNote || 'Park halindedir. Acil durumda arayabilirsiniz.').trim();

  // Plaka mükerrerlik kontrolü
  const existing = db.prepare('SELECT id FROM vehicles WHERE plate_number = ?').get(cleanPlate);
  if (existing) {
    throw new Error(`"${cleanPlate}" plakalı bir araç sistemde zaten kayıtlı.`);
  }

  const insertStmt = db.prepare(`
    INSERT INTO vehicles (user_id, plate_number, brand_model, color, parking_note, safe_park_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  const result = insertStmt.run(Number(userId), cleanPlate, cleanBrand, cleanColor, cleanNote);
  const vehicleId = result.lastInsertRowid;

  // QR kodu oluştur
  const qrToken = 'VZT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const qrStmt = db.prepare(`
    INSERT INTO qr_codes (vehicle_id, qr_token, is_active, scan_count)
    VALUES (?, ?, 1, 0)
  `);
  qrStmt.run(vehicleId, qrToken);

  return getVehicleById(vehicleId, userId);
}

// Araç Güncelle (Update)
function updateVehicle(id, userId, { brandModel, color, parkingNote, safeParkActive }) {
  const vehicle = getVehicleById(id, userId);
  if (!vehicle) throw new Error('Araç bulunamadı veya düzenleme yetkiniz yok.');

  const brand = brandModel !== undefined ? String(brandModel).trim() : vehicle.brand_model;
  const col = color !== undefined ? String(color).trim() : vehicle.color;
  const note = parkingNote !== undefined ? String(parkingNote).trim() : vehicle.parking_note;
  const safePark = safeParkActive !== undefined ? (safeParkActive ? 1 : 0) : vehicle.safe_park_active;

  const stmt = db.prepare(`
    UPDATE vehicles
    SET brand_model = ?, color = ?, parking_note = ?, safe_park_active = ?
    WHERE id = ?
  `);
  stmt.run(brand, col, note, safePark, Number(id));

  return getVehicleById(id, userId);
}

// Araç Sil (Delete)
function deleteVehicle(id, userId = null) {
  const vehicle = getVehicleById(id, userId);
  if (!vehicle) throw new Error('Araç bulunamadı veya silme yetkiniz yok.');

  // scans ve qr_codes cascade ile silinir
  db.prepare('DELETE FROM scans WHERE vehicle_id = ?').run(Number(id));
  db.prepare('DELETE FROM qr_codes WHERE vehicle_id = ?').run(Number(id));
  db.prepare('DELETE FROM vehicles WHERE id = ?').run(Number(id));

  return true;
}

// QR Durumu Aç/Kapat
function toggleVehicleActive(plateNumber, isActive, userId = null) {
  const vehicle = getVehicleByPlate(plateNumber);
  if (!vehicle) throw new Error('Araç bulunamadı.');
  if (userId && vehicle.user_id !== Number(userId)) {
    throw new Error('Bu aracı yönetme yetkiniz yok.');
  }

  const activeVal = isActive ? 1 : 0;
  const stmt = db.prepare('UPDATE qr_codes SET is_active = ? WHERE vehicle_id = ?');
  stmt.run(activeVal, vehicle.id);

  return { plateNumber, isActive: activeVal };
}

// Park Notunu Güncelle
function updateParkingNote(plateNumber, note, userId = null) {
  const vehicle = getVehicleByPlate(plateNumber);
  if (!vehicle) throw new Error('Araç bulunamadı.');
  if (userId && vehicle.user_id !== Number(userId)) {
    throw new Error('Bu aracı yönetme yetkiniz yok.');
  }

  const cleanNote = String(note || 'Park halindedir.').trim();
  db.prepare('UPDATE vehicles SET parking_note = ? WHERE id = ?').run(cleanNote, vehicle.id);
  return { plateNumber, parkingNote: cleanNote };
}

// ==========================================
// TARAMA (SCAN) LOGLAMA & ANALİTİK
// ==========================================

// QR Tarama Kaydet
function logScan(plateNumber, actionType = 'scan', ip = null, userAgent = null) {
  const vehicle = getVehicleByPlate(plateNumber);
  if (!vehicle) {
    throw new Error(`"${plateNumber}" plakalı araç sistemde bulunamadı.`);
  }

  const insertStmt = db.prepare(`
    INSERT INTO scans (vehicle_id, plate_number, ip_address, user_agent, action_type)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertStmt.run(vehicle.id, vehicle.plate_number, ip || '127.0.0.1', userAgent || 'Browser', actionType);

  // QR kodu tarama sayısını artır
  db.prepare('UPDATE qr_codes SET scan_count = scan_count + 1 WHERE vehicle_id = ?').run(vehicle.id);

  return {
    plateNumber: vehicle.plate_number,
    brandModel: vehicle.brand_model,
    isActive: vehicle.is_active === 1,
    parkingNote: vehicle.parking_note,
    safeParkActive: vehicle.safe_park_active === 1,
    actionType
  };
}

// Analitik İstatistikleri (Haftalık Grafik Verileri)
function getAnalytics(userId = null) {
  let vehicleFilter = '';
  const params = [];
  if (userId) {
    vehicleFilter = 'WHERE v.user_id = ?';
    params.push(Number(userId));
  }

  // Toplam Taramalar
  const totalScansStmt = db.prepare(`
    SELECT COUNT(s.id) as cnt
    FROM scans s
    JOIN vehicles v ON v.id = s.vehicle_id
    ${vehicleFilter}
  `);
  const totalScans = totalScansStmt.get(...params)?.cnt || 0;

  // Bugünkü Taramalar
  const todayFilter = userId
    ? "WHERE v.user_id = ? AND date(s.created_at) = date('now', 'localtime')"
    : "WHERE date(s.created_at) = date('now', 'localtime')";
  const todayScans = db.prepare(`
    SELECT COUNT(s.id) as cnt
    FROM scans s
    JOIN vehicles v ON v.id = s.vehicle_id
    ${todayFilter}
  `).get(...params)?.cnt || 0;

  // Araç ve Aktif QR Sayısı
  const vStats = db.prepare(`
    SELECT COUNT(v.id) as total_vehicles,
           SUM(CASE WHEN q.is_active = 1 THEN 1 ELSE 0 END) as active_qrs
    FROM vehicles v
    LEFT JOIN qr_codes q ON q.vehicle_id = v.id
    ${vehicleFilter}
  `).get(...params);

  // Son 7 Günlük Çubuk Grafik Verileri (Pzt, Sal, Çar, Per, Cum, Cmt, Paz)
  // Son 7 günü geriye doğru hesapla
  const daysTurkish = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const weeklyChart = [];

  for (let i = 6; i >= 0; i--) {
    const dayQuery = db.prepare(`
      SELECT date('now', 'localtime', '-' || ? || ' days') as day_date,
             strftime('%w', 'now', 'localtime', '-' || ? || ' days') as day_index,
             COUNT(s.id) as scan_count
      FROM scans s
      JOIN vehicles v ON v.id = s.vehicle_id
      WHERE date(s.created_at) = date('now', 'localtime', '-' || ? || ' days')
      ${userId ? 'AND v.user_id = ?' : ''}
    `);

    const qParams = userId ? [i, i, i, Number(userId)] : [i, i, i];
    const row = dayQuery.get(...qParams);
    const dayIdx = Number(row?.day_index || 0);
    const dayName = daysTurkish[dayIdx];

    weeklyChart.push({
      date: row?.day_date,
      day: dayName,
      count: row?.scan_count || 0
    });
  }

  // Son 10 Tarama Hareketi
  const recentLogsQuery = db.prepare(`
    SELECT s.id, s.plate_number, s.action_type, s.created_at, v.brand_model
    FROM scans s
    JOIN vehicles v ON v.id = s.vehicle_id
    ${vehicleFilter}
    ORDER BY s.id DESC
    LIMIT 8
  `);
  const recentLogs = recentLogsQuery.all(...params);

  return {
    totalScans,
    todayScans,
    totalVehicles: vStats?.total_vehicles || 0,
    activeQrs: vStats?.active_qrs || 0,
    weeklyChart,
    recentLogs
  };
}

module.exports = {
  db,
  initDatabase,
  registerUser,
  authenticateUser,
  getUserById,
  updateUserProfile,
  updateUserPassword,
  getAllUsers,
  getVehicles,
  getVehicleById,
  getVehicleByPlate,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  toggleVehicleActive,
  updateParkingNote,
  logScan,
  getAnalytics
};
