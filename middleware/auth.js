/**
 * 66 Vizite - JWT & HTTP-Only Çerez Kimlik Doğrulama Ara Yazılımı
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '66vizite_ultra_secure_jwt_secret_key_2026_x89f_mycar';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_NAME = 'vizite_token';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName || user.full_name,
      planTier: user.planTier || user.plan_tier || 'pro'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 gün
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
}

function authenticateToken(req, res, next) {
  let token = null;

  // 1. HTTP-Only Çerezden oku (En güvenli)
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  }
  // 2. Authorization Header'dan oku (Bearer <token>)
  else if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Bu işlem için oturum açmanız gerekmektedir.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    clearAuthCookie(res);
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Oturum süreniz doldu veya geçersiz. Lütfen tekrar giriş yapın.'
    });
  }
}

function optionalAuth(req, res, next) {
  let token = null;
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  } else if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

module.exports = {
  COOKIE_NAME,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  authenticateToken,
  optionalAuth
};
