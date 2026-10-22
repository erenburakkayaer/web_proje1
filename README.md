# 🚗 66 Vizite - Araç Takip ve Anonim QR İletişim Platformu (v2.0)

66 Vizite; araç sahiplerinin kişisel telefon numaralarını doğrudan araç camında paylaşmadan, ön cama yerleştirilen anonim **QR Vizite** etiketleri sayesinde diğer sürücüler ve vatandaşlarla güvenli köprü iletişim kurmasını sağlayan kurumsal standartlarda bir web uygulamasıdır.

---

## ⚡ Hızlı Başlatma

Projeyi bilgisayarınızda çalıştırmak için aşağıdaki adımlardan dilediğinizi uygulayabilirsiniz:

### Yöntem 1: Tek Tıkla Başlatma (Windows)
Klasör içindeki **`baslat.bat`** dosyasına çift tıklayın. Sistem otomatik olarak:
1. Node.js ve npm kütüphanelerini kontrol eder,
2. Eksik paket varsa `npm install` çalıştırır,
3. Express sunucusunu ayağa kaldırır,
4. Varsayılan tarayıcınızda `http://localhost:3000` adresini açar.

### Yöntem 2: Terminal / Komut Satırı ile
```bash
# 1. Gerekli tüm kütüphaneleri kurun
npm install

# 2. Sunucuyu başlatın
npm start

# Geliştirici modu (Nodemon ile dosya değişiminde otomatik yeniden başlatma):
npm run dev
```

Tarayıcınızdan açın:  
👉 **Ana Sayfa:** `http://localhost:3000`  
👉 **Yönetim Paneli:** `http://localhost:3000/dashboard.html`  
👉 **Kayıt Ol:** `http://localhost:3000/register.html`

🔑 **Demo Yönetici Giriş Bilgileri:**
- **E-posta:** `osmancanacar805@gmail.com`
- **Şifre:** `123456`

---

## 🛡️ Güvenlik ve Mimari Yenilikler

1. **JWT & Güvenli HTTP-Only Çerezler:**
   - İstemci tarafı (`localStorage`) manipülasyonlarına karşı oturumlar `jsonwebtoken` ve `cookie-parser` ile imzalanmış **HTTP-Only, SameSite=Lax** çerezlerle korunmaktadır.
2. **Bcryptjs Şifreleme:**
   - Kullanıcı şifreleri veritabanına asla düz metin (plaintext) kaydedilmez. `bcryptjs` (salt rounds: 10) ile tek yönlü hash'lenerek güvenle saklanır.
3. **Brute-Force Koruması (Rate Limiting):**
   - `express-rate-limit` entegrasyonu ile `/api/auth/login` ve `/api/auth/register` rotalarında 15 dakikada en fazla 20 denemeye izin verilir.
4. **Türkiye Plaka Formatı Doğrulaması:**
   - Araç kayıt formlarında hem frontend hem de backend tarafında Regex (`^(0[1-9]|[1-7][0-9]|8[01])\s?[A-ZÇĞİÖŞÜ]{1,3}\s?[0-9]{2,4}$`) doğrulaması uygulanır.
5. **Modern Toast Bildirimleri (Alert Yerine):**
   - Tarayıcının ilkel `alert(...)` popupları yerine sağ üst köşede çıkan akıcı, renk kodlu ve zaman sayaçlı Toast bildirim sistemi (`toast.js`) kullanılmıştır.
6. **Gerçek Zamanlı Tarama (Scan) ve Analitik:**
   - Herhangi bir araç QR kodu okutulduğunda (`/api/scan/:plate`) veya simülatörden bildirim gönderildiğinde SQLite `scans` tablosuna log kaydedilir. Dashboard'daki 7 günlük çubuk grafik ve taranma sayıları bu tablodan dinamik beslenir.
7. **Boş Durum (Empty State) Tasarımı:**
   - Kullanıcının hiç aracı kalmadığında yönetim panelinde şık bir yönlendirme kartı belirir.

---

## 📡 RESTful API Uç Noktaları

| Metot | Uç Nokta | Açıklama | Güvenlik |
|---|---|---|---|
| `GET` | `/api/status` | Sistem sağlık durumu ve aktif modül listesi | Açık |
| `POST` | `/api/auth/register` | Yeni kullanıcı kaydı ve HTTP-Only JWT çerez üretimi | Rate-Limited |
| `POST` | `/api/auth/login` | Kullanıcı girişi ve oturum başlatma | Rate-Limited |
| `GET` | `/api/auth/me` | Giriş yapmış kullanıcının profil bilgileri | JWT Auth |
| `PUT` | `/api/auth/profile` | Ad soyad, telefon ve bildirim ayarlarını güncelleme | JWT Auth |
| `PUT` | `/api/auth/password` | Güvenli şifre değiştirme | JWT Auth |
| `POST` | `/api/auth/logout` | Oturumu sonlandırma ve çerezi temizleme | Açık |
| `GET` | `/api/vehicles` | Kullanıcının araçlarını ve QR token durumlarını getirme | İsteğe Bağlı Auth |
| `POST` | `/api/vehicles` | Yeni araç ekleme (TR plaka regex kontrollü) | Açık / Auth |
| `PUT` | `/api/vehicles/:id` | Araç model, renk ve park notunu güncelleme | Auth |
| `DELETE` | `/api/vehicles/:id` | Aracı ve ilişkili QR kayıtlarını silme | Auth |
| `POST` | `/api/vehicles/:plate/toggle` | QR vizite iletişimini aktif/pasif yapma | Auth |
| `GET` | `/api/scan/:plate` | QR kod tarama logu oluşturma ve araç durumunu okuma | Rate-Limited |
| `POST` | `/api/scan/:plate/action` | Araç sahibine hızlı anonim bildirim (engel, far, çekici) iletme | Rate-Limited |
| `GET` | `/api/analytics` | 7 günlük tarama grafiği ve toplam istatistikler | İsteğe Bağlı Auth |
| `GET` | `/api/qr?text=...` | Anlık taranabilir QR PNG görseli üretme (`?size=300`) | Cache-Control |

---

## 📂 Modüler Dizin Yapısı

```
web_proje1-main/
├── server.js               # Express ana sunucu ve ara yazılım orkestrasyonu
├── package.json            # Node.js bağımlılıkları ve çalıştırma komutları
├── .env                    # Port, JWT secret ve çerez ayarları
├── toast.js                # Şık Toast bildirim motoru (Vanilla JS)
├── baslat.bat              # Windows otomatik başlatıcı
├── baslat.sh               # Linux / macOS terminal başlatıcı
│
├── routes/                 # Modüler API Yönlendiricileri
│   ├── auth.js             # Giriş, kayıt, profil, şifre ve oturum rotaları
│   ├── vehicles.js         # Araç CRUD, plaka doğrulaması ve QR toggle
│   ├── scan.js             # Ziyaretçi tarama ve acil bildirim loglama
│   ├── analytics.js        # 7 günlük dinamik çubuk grafik ve metrikler
│   └── qr.js               # Dinamik QR kod görsel üreteci
│
├── middleware/             # Güvenlik ve Doğrulama Ara Katmanları
│   ├── auth.js             # JWT imza ve HTTP-only çerez kontrolü
│   └── rateLimit.js        # Brute-force ve DDoS koruma sınırları
│
├── utils/
│   └── validators.js       # TR plaka regex'i ve e-posta formatlayıcılar
│
├── database/
│   ├── db.js               # SQLite veritabanı sürücüsü ve CRUD fonksiyonları
│   ├── schema.sql          # Tablo şemaları (users, vehicles, qr_codes, scans)
│   └── mycar.db            # SQLite ilişkisel veritabanı dosyası
│
├── index.html              # Tanıtım, canlı simülatör ve interaktif modallar
├── dashboard.html          # Araç yönetimi, QR baskı ve canlı tarama analitiği
├── register.html           # Ayrı kullanıcı kayıt sayfası
└── style.css               # Dark/Light tema, Toast ve responsive stiller
```
