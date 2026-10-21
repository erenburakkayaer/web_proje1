/**
 * 66 Vizite - Yerel Geliştirme Sunucusu (Node.js)
 * Harici kütüphane gerektirmez (Zero-dependency).
 * Dahili SQLite ve statik dosya sunucusu barındırır.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { initDatabase, registerUser, authenticateUser, getAllUsers } = require('./database/db.js');

// Veritabanını hazırla
initDatabase();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) {
        return resolve({});
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        // x-www-form-urlencoded parse fallback
        const params = new URLSearchParams(body);
        const parsed = {};
        for (const [key, value] of params.entries()) {
          parsed[key] = value;
        }
        resolve(parsed);
      }
    });
    req.on('error', err => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // CORS ön kontrol
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // --- API Endpointleri ---
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const email = String(data.email || '').trim();
      const password = String(data.password || '');

      if (!email || !password) {
        return sendJson(res, 400, {
          success: false,
          message: 'E-posta ve Şifre alanları zorunludur.'
        });
      }

      const user = authenticateUser(email, password);
      return sendJson(res, 200, {
        success: true,
        message: 'Giriş başarılı!',
        user
      });
    } catch (err) {
      return sendJson(res, 401, {
        success: false,
        message: err.message || 'Giriş yapılamadı.'
      });
    }
  }

  if (pathname === '/api/auth/register' && req.method === 'POST') {
    try {
      const data = await parseRequestBody(req);
      const fullName = String(data.fullName || '').trim();
      const email = String(data.email || '').trim();
      const password = String(data.password || '');
      const planTier = String(data.planTier || 'pro').trim();

      if (!fullName || !email || !password) {
        return sendJson(res, 400, {
          success: false,
          message: 'Ad Soyad, E-posta ve Şifre alanları zorunludur.'
        });
      }

      if (password.length < 6) {
        return sendJson(res, 400, {
          success: false,
          message: 'Şifre en az 6 karakter olmalıdır.'
        });
      }

      const user = registerUser(fullName, email, password, planTier);
      return sendJson(res, 201, {
        success: true,
        message: 'Kayıt işlemi başarıyla tamamlandı.',
        user
      });
    } catch (err) {
      return sendJson(res, 400, {
        success: false,
        message: err.message || 'Kayıt başarısız.'
      });
    }
  }

  if (pathname === '/api/users' && req.method === 'GET') {
    try {
      const users = getAllUsers();
      return sendJson(res, 200, {
        success: true,
        count: users.length,
        users
      });
    } catch (err) {
      return sendJson(res, 500, {
        success: false,
        message: 'Kullanıcılar listelenirken hata oluştu: ' + err.message
      });
    }
  }

  // --- Statik Dosya Sunumu ---
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(path.join(PUBLIC_DIR, pathname));

  // Güvenlik: dizin dışına çıkışı engelle
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Erişim engellendi');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 - Sayfa veya Dosya Bulunamadı</h1><p><a href="/">Ana Sayfaya Dön</a></p>');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(safePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`   66 Vizite - Sunucu Başarıyla Başlatıldı!`);
  console.log(`   Adres: http://localhost:${PORT}`);
  console.log(`===================================================`);
});
