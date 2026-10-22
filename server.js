/**
 * 66 Vizite - Platform Sunucusu (Modular Express Application)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('node:path');

// Veritabanı ve Modüler Rotalar
const { initDatabase, getAllUsers } = require('./database/db.js');
const authRoutes = require('./routes/auth.js');
const vehicleRoutes = require('./routes/vehicles.js');
const scanRoutes = require('./routes/scan.js');
const analyticsRoutes = require('./routes/analytics.js');
const qrRoutes = require('./routes/qr.js');
const { apiLimiter } = require('./middleware/rateLimit.js');

// Veritabanı tablolarını ve şemayı hazırla
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// ==========================================
// ARA YAZILIMLAR (MIDDLEWARE)
// ==========================================
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser(process.env.COOKIE_SECRET || '66vizite_cookie_secret_salt_2026'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const jwt = require('jsonwebtoken');
const { COOKIE_NAME } = require('./middleware/auth.js');
const JWT_SECRET = process.env.JWT_SECRET || '66vizite_ultra_secure_jwt_secret_key_2026_x89f_mycar';

// ==========================================
// SAYFA KORUMA: Dashboard Sadece Giriş Yapınca Açılır
// ==========================================
app.get('/dashboard.html', (req, res) => {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) {
    return res.redirect('/?auth=required');
  }
  try {
    jwt.verify(token, JWT_SECRET);
    return res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html'));
  } catch (err) {
    res.clearCookie(COOKIE_NAME);
    return res.redirect('/?auth=expired');
  }
});

// Statik Dosyalar (HTML, CSS, JS, Medya)
app.use(express.static(PUBLIC_DIR));

// ==========================================
// API ROTALARI (MODÜLER)
// ==========================================
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/qr', qrRoutes);

// Sistem Sağlık Durumu Uç Noktası
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    platform: '66 Vizite Araç Yönetim Sistemi',
    status: 'online',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    features: {
      jwtAuth: true,
      httpOnlyCookies: true,
      rateLimiting: true,
      sqliteDb: true,
      dynamicQr: true,
      realTimeScans: true
    }
  });
});

// Demo / Hoca Sunumu Kullanıcı Listeleme
app.get('/api/users', (req, res) => {
  try {
    const users = getAllUsers();
    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Kullanıcılar alınırken hata oluştu: ' + err.message
    });
  }
});

// 404 Sayfası
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Global Hata Yakalayıcı
app.use((err, req, res, next) => {
  console.error('Sunucu Hatası:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Beklenmeyen bir sunucu hatası oluştu.'
  });
});

// Sunucuyu Başlat
const serverInstance = app.listen(PORT, () => {
  console.log('===================================================');
  console.log('   66 Vizite - Platform Sunucusu Başarıyla Başlatıldı!');
  console.log(`   Yerel Adres: http://localhost:${PORT}`);
  console.log('   Güvenlik: JWT + HTTP-Only Çerezler + Rate Limiting Aktif');
  console.log('   Veritabanı: SQLite (İlişkisel & Otomatik Şema)');
  console.log('===================================================');
});

module.exports = { app, serverInstance };
