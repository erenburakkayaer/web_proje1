/**
 * 66 Vizite - Rate Limiting (İstek Sınırlandırma) Ara Yazılımları
 */

const { rateLimit } = require('express-rate-limit');

// Giriş ve Kayıt İçin Brute-Force Koruması (15 dakikada en fazla 15 deneme)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Çok fazla giriş denemesi yaptınız. Güvenliğiniz için lütfen 15 dakika sonra tekrar deneyin.'
  }
});

// QR Tarama ve Bildirim İstek Sınırlandırması (1 dakikada 30 istek)
const scanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Kısa süre içinde çok fazla QR tarama veya bildirim isteği gönderildi. Lütfen biraz bekleyin.'
  }
});

// Genel API İstek Sınırlandırması (15 dakikada 250 istek)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.'
  }
});

module.exports = {
  authLimiter,
  scanLimiter,
  apiLimiter
};
