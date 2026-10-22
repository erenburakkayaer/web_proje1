/**
 * 66 Vizite - Kimlik Doğrulama Rotaları (Auth Routes)
 */

const express = require('express');
const router = express.Router();
const {
  registerUser,
  authenticateUser,
  getUserById,
  updateUserProfile,
  updateUserPassword
} = require('../database/db.js');
const { generateToken, setAuthCookie, clearAuthCookie, authenticateToken } = require('../middleware/auth.js');
const { authLimiter } = require('../middleware/rateLimit.js');
const { isValidEmail } = require('../utils/validators.js');

// 1. Kullanıcı Kaydı (Register)
router.post('/register', authLimiter, (req, res) => {
  try {
    const { fullName, email, password, planTier } = req.body;
    const cleanName = String(fullName || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPass = String(password || '');
    const tier = String(planTier || 'pro').trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen Ad Soyad, E-posta ve Şifre alanlarının tamamını doldurunuz.'
      });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz e-posta formatı. Lütfen geçerli bir e-posta adresi giriniz.'
      });
    }

    if (cleanPass.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Şifreniz güvenlik sebebiyle en az 6 karakter olmalıdır.'
      });
    }

    const user = registerUser(cleanName, cleanEmail, cleanPass, tier);
    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Hesabınız başarıyla oluşturuldu! Hoş geldiniz.',
      token,
      user
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Kayıt işlemi gerçekleştirilemedi.'
    });
  }
});

// 2. Kullanıcı Girişi (Login)
router.post('/login', authLimiter, (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPass = String(password || '');

    if (!cleanEmail || !cleanPass) {
      return res.status(400).json({
        success: false,
        message: 'E-posta adresi ve şifre zorunludur.'
      });
    }

    const user = authenticateUser(cleanEmail, cleanPass);
    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: `Giriş başarılı! Hoş geldiniz, ${user.fullName}.`,
      token,
      user
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.message || 'E-posta adresi veya şifre hatalı.'
    });
  }
});

// 3. Mevcut Kullanıcı Bilgisi (Me)
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = getUserById(req.user.id);
    if (!user) {
      clearAuthCookie(res);
      return res.status(404).json({ success: false, message: 'Kullanıcı hesabı bulunamadı.' });
    }
    return res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Kullanıcı bilgisi alınırken hata oluştu: ' + err.message
    });
  }
});

// 4. Profil Güncelleme
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { fullName, phoneNumber, smsNotification, callBridge } = req.body;
    const updated = updateUserProfile(req.user.id, {
      fullName,
      phoneNumber,
      smsNotification,
      callBridge
    });

    return res.status(200).json({
      success: true,
      message: 'Profil ayarlarınız başarıyla güncellendi.',
      user: updated
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Profil güncellenemedi.'
    });
  }
});

// 5. Şifre Değiştirme
router.put('/password', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mevcut şifre ve yeni şifre alanları zorunludur.'
      });
    }

    updateUserPassword(req.user.id, currentPassword, newPassword);

    return res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi.'
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Şifre güncellenemedi.'
    });
  }
});

// 6. Çıkış Yap (Logout)
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: 'Başarıyla çıkış yapıldı.'
  });
});

module.exports = router;
