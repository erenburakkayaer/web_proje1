# 66 Vizite - Araç QR İletişim ve Hiyerarşik Yönetim Platformu

Araç sahiplerinin telefon numaralarını camda paylaşmadan, QR kod aracılığıyla güvenli ve anonim şekilde iletişim kurmasını sağlayan web platformu.

---

## 1. Kullanılan Teknolojiler
- **Backend:** PHP 8+ (Sade, tek dosya mimari: `api.php`, `router.php`, `$_SESSION` oturum ve hiyerarşi kontrolü)
- **Veritabanı:** SQLite (`PDO_SQLITE` - `database/mycar.db` ve `database/schema.sql`)
- **Frontend:** HTML5, CSS3 (Dark/Light Tema), Vanilla JavaScript (Fetch API)

---

## 2. Kurulum ve Çalıştırma Adımları
- **macOS / Linux:** `./baslat.sh` veya `php -S localhost:3000 router.php`
- **Windows:** `baslat.bat` dosyasına çift tıklayın.
- **Başlangıç Adresi:** `http://localhost:3000`

---

## 3. Admin Paneline Girebilen 10 Yönetici Gmail Hesabı (Şifre: `123456`)

Ana sayfadaki **"Panel"** yazısı ve Admin Paneli (`/dashboard.html`) **yalnızca aşağıdaki 10 yönetici Gmail hesabından biriyle giriş yapıldığında** görünür ve açılır. Standart üyeler veya oturum açmamış ziyaretçiler **"Panel"** yazısını göremez ve URL'den doğrudan girmeye çalışsalar dahi `router.php` tarafından engellenirler.

| Kademe | Yetki Puanı | Görev / Unvan | Gmail Adresi | Şifre | Yetki Sınırı |
| :---: | :---: | :--- | :--- | :---: | :--- |
| **1** | **10 / 10** | **Genel Müdür** | `genelmudur@gmail.com` | `123456` | Altındaki 9 kademenin tamamını ekler, yükseltir/alçaltır ve çıkartır. |
| **2** | **9 / 10** | **Genel Müdür Yardımcısı** | `genelmuduryrd@gmail.com` | `123456` | Ülke Sorumlusu (8) ve altındaki kademeleri yönetir; Genel Müdür'e dokunamaz. |
| **3** | **8 / 10** | **Ülke Sorumlusu** | `ulke@gmail.com` | `123456` | Ülke Sorumlusu Yardımcısı (7) ve altındaki kademeleri yönetir. |
| **4** | **7 / 10** | **Ülke Sorumlusu Yardımcısı** | `ulkeyrd@gmail.com` | `123456` | Bölge Sorumlusu (6) ve altındaki kademeleri yönetir. |
| **5** | **6 / 10** | **Bölge Sorumlusu** | `bolge@gmail.com` | `123456` | Bölge Sorumlusu Yardımcısı (5) ve altındaki kademeleri yönetir. |
| **6** | **5 / 10** | **Bölge Sorumlusu Yardımcısı** | `bolgeyrd@gmail.com` | `123456` | İl Sorumlusu (4) ve altındaki kademeleri yönetir. |
| **7** | **4 / 10** | **İl Sorumlusu** | `il@gmail.com` | `123456` | İl Sorumlusu Yardımcısı (3) ve altındaki kademeleri yönetir. |
| **8** | **3 / 10** | **İl Sorumlusu Yardımcısı** | `ilyrd@gmail.com` | `123456` | İlçe Sorumlusu (2) ve altındaki kademeleri yönetir. |
| **9** | **2 / 10** | **İlçe Sorumlusu** | `ilce@gmail.com` | `123456` | Sadece İlçe Sorumlusu Yardımcısını (1) ekleyebilir ve çıkartabilir. |
| **10** | **1 / 10** | **İlçe Sorumlusu Yardımcısı** | `ilceyrd@gmail.com` | `123456` | En alt yönetici kademesidir; altında başka yönetici kademesi yoktur. |

---

## 4. Bilinen Eksiklikler (Final Aşamasına Kalanlar)
- Gerçek SMS / 0850 sesli arama operatör entegrasyonu şu an simülasyon olarak çalışmaktadır.
- Fiziksel sticker siparişlerinde kredi kartı ödeme adımı final sürümünde eklenecektir.
