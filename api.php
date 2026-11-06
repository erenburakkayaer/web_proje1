<?php
// 66 Vizite - Tek Dosya Sade PHP Backend (10 Yönetici Hiyerarşisi)
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/database/db.php';

$db = getDb();
$roller = getYoneticiRolleri();
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$islem = $_GET['islem'] ?? $input['islem'] ?? '';
$aktifUye = $_SESSION['user'] ?? null;
$benimSeviyem = $aktifUye ? (int)($aktifUye['roleLevel'] ?? 0) : 0;

try {
    switch ($islem) {

        // 1. STANDART ÜYE KAYDI (Seviye 0 - Admin Paneline Giremez)
        case 'register':
            $ad    = trim($input['fullName'] ?? '');
            $email = strtolower(trim($input['email'] ?? ''));
            $sifre = $input['password'] ?? '';
            $paket = $input['planTier'] ?? 'pro';

            if (!$ad || !$email || strlen($sifre) < 6) {
                echo json_encode(['success' => false, 'message' => 'Tüm alanları doldurun (Şifre en az 6 karakter).']);
                exit;
            }

            $hash = password_hash($sifre, PASSWORD_DEFAULT);
            $ekle = $db->prepare("INSERT INTO users (full_name, email, password_hash, salt, role, plan_tier) VALUES (?, ?, ?, '', 'user', ?)");
            $ekle->execute([$ad, $email, $hash, $paket]);

            $userData = [
                'id' => (int)$db->lastInsertId(),
                'fullName' => $ad,
                'email' => $email,
                'role' => 'user',
                'roleTitle' => 'Standart Üye',
                'roleLevel' => 0,
                'canAccessAdmin' => false,
                'planTier' => $paket
            ];
            $_SESSION['user'] = $userData;

            echo json_encode([
                'success' => true,
                'message' => 'Üye kaydınız tamamlandı! (Admin paneline yalnızca 10 yönetici hesabı girebilir)',
                'user' => $userData
            ]);
            break;

        // 2. GİRİŞ VE YETKİ KONTROLÜ
        case 'login':
            $email = strtolower(trim($input['email'] ?? ''));
            $sifre = $input['password'] ?? '';

            $sorgu = $db->prepare("SELECT * FROM users WHERE email = ?");
            $sorgu->execute([$email]);
            $uye = $sorgu->fetch();

            $dogruMu = false;
            if ($uye) {
                if (password_verify($sifre, $uye['password_hash'])) {
                    $dogruMu = true;
                } elseif (!empty($uye['salt'])) {
                    $pbkdf2 = hash_pbkdf2('sha512', $sifre, $uye['salt'], 100000, 128);
                    $dogruMu = ($pbkdf2 === $uye['password_hash']);
                }
            }

            if (!$dogruMu) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'E-posta veya şifre hatalı!']);
                exit;
            }

            $rolKey = $uye['role'] ?? 'user';
            $yoneticiMi = isset($roller[$rolKey]);
            $seviye = $yoneticiMi ? $roller[$rolKey]['level'] : 0;
            $baslik = $yoneticiMi ? $roller[$rolKey]['title'] : 'Standart Üye';

            $userData = [
                'id'             => (int)$uye['id'],
                'fullName'       => $uye['full_name'],
                'email'          => $uye['email'],
                'role'           => $rolKey,
                'roleTitle'      => $baslik,
                'roleLevel'      => $seviye,
                'canAccessAdmin' => $yoneticiMi,
                'planTier'       => $uye['plan_tier'] ?? 'pro'
            ];
            $_SESSION['user'] = $userData;

            echo json_encode(['success' => true, 'message' => 'Giriş başarılı!', 'user' => $userData]);
            break;

        // 3. OTURUM KAPATMA
        case 'logout':
            $_SESSION = [];
            session_destroy();
            echo json_encode(['success' => true, 'message' => 'Oturum kapatıldı.']);
            break;

        // 4. AKTİF YÖNETİCİ KONTROLÜ (Sadece 10 Yönetici Hesabı)
        case 'me':
            if (!$aktifUye || $benimSeviyem < 1) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Admin paneline yalnızca 10 yönetici hesabı erişebilir!']);
                exit;
            }
            echo json_encode(['success' => true, 'user' => $aktifUye, 'roles' => $roller]);
            break;

        // 5. ARAÇ & QR İŞLEMLERİ
        case 'add_vehicle':
            $userId = $aktifUye['id'] ?? 1;
            $plaka  = strtoupper(trim($input['plate'] ?? ''));
            $marka  = trim($input['brand'] ?? 'Otomobil');
            $renk   = trim($input['color'] ?? 'Beyaz • Otomobil');
            $not    = trim($input['note'] ?? 'Park halindedir. Acil durumda arayabilirsiniz.');

            if (!$plaka) {
                echo json_encode(['success' => false, 'message' => 'Plaka zorunludur.']);
                exit;
            }

            $db->prepare("INSERT INTO vehicles (user_id, plate_number, brand_model, color, parking_note) VALUES (?, ?, ?, ?, ?)")
               ->execute([$userId, $plaka, $marka, $renk, $not]);

            echo json_encode(['success' => true, 'message' => 'Araç ve QR kod kaydedildi!']);
            break;

        case 'vehicles':
            if ($benimSeviyem < 1) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Yetkisiz erişim!']);
                exit;
            }
            $araclar = $db->query("SELECT * FROM vehicles ORDER BY id DESC")->fetchAll();
            echo json_encode(['success' => true, 'vehicles' => $araclar]);
            break;

        case 'toggle_qr':
            $plaka = strtoupper(trim($input['plate'] ?? ''));
            $aktif = (int)($input['isActive'] ?? 1);
            $db->prepare("UPDATE vehicles SET is_active = ? WHERE plate_number = ?")->execute([$aktif, $plaka]);
            echo json_encode(['success' => true, 'message' => 'QR durumu güncellendi.']);
            break;

        case 'update_park':
            $not   = trim($input['note'] ?? 'Park halindedir.');
            $aktif = (int)($input['isActive'] ?? 1);
            $db->prepare("UPDATE vehicles SET parking_note = ?, is_active = ?")->execute([$not, $aktif]);
            echo json_encode(['success' => true, 'message' => 'Park notu kaydedildi.']);
            break;

        case 'send_notif':
            $plaka = strtoupper(trim($input['plate'] ?? '34 VZT 66'));
            $tip   = trim($input['type'] ?? 'genel');
            $mesaj = trim($input['message'] ?? 'Araç bildirim uyarısı.');
            $db->prepare("INSERT INTO notifications (plate_number, alert_type, message) VALUES (?, ?, ?)")->execute([$plaka, $tip, $mesaj]);
            $db->prepare("UPDATE vehicles SET scan_count = scan_count + 1 WHERE plate_number = ?")->execute([$plaka]);
            echo json_encode(['success' => true, 'message' => 'Bildirim kaydedildi.']);
            break;

        // 6. 10 YÖNETİCİ HİYERARŞİ TABLOSU (Sadece Yöneticiler Görebilir)
        case 'users':
            if ($benimSeviyem < 1) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Yetkisiz erişim!']);
                exit;
            }
            $uyeler = $db->query("SELECT id, full_name, email, role, plan_tier, created_at FROM users WHERE role != 'user'")->fetchAll();
            foreach ($uyeler as &$u) {
                $rKey = isset($roller[$u['role']]) ? $u['role'] : 'ilce_yardimcisi';
                $u['role'] = $rKey;
                $u['role_level'] = $roller[$rKey]['level'];
                $u['role_title'] = $roller[$rKey]['title'];
            }
            usort($uyeler, fn($a, $b) => $b['role_level'] <=> $a['role_level']);

            echo json_encode(['success' => true, 'users' => $uyeler, 'roles' => $roller, 'myLevel' => $benimSeviyem]);
            break;

        // 7. ALT KADEMEYE YENİ YÖNETİCİ / YARDIMCI EKLEME
        case 'add_sub_user':
            $ad      = trim($input['fullName'] ?? '');
            $email   = strtolower(trim($input['email'] ?? ''));
            $sifre   = $input['password'] ?? '123456';
            $yeniRol = $input['role'] ?? '';
            $hedefSeviye = getRolSeviye($yeniRol);

            if ($hedefSeviye < 1 || $benimSeviyem <= $hedefSeviye) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Yetkisiz işlem! Sadece kendi kademenizin ALTINDAKİ bir göreve yönetici ekleyebilirsiniz.']);
                exit;
            }

            $hash = password_hash($sifre, PASSWORD_DEFAULT);
            $db->prepare("INSERT INTO users (full_name, email, password_hash, salt, role, plan_tier) VALUES (?, ?, ?, '', ?, 'business')")
               ->execute([$ad, $email, $hash, $yeniRol]);

            echo json_encode(['success' => true, 'message' => "$ad başarıyla alt kademenize eklendi!"]);
            break;

        // 8. ALT KADEMEDEKİ YÖNETİCİYİ YÜKSELTME / ALÇALTMA
        case 'change_role':
            $hedefId = (int)($input['userId'] ?? 0);
            $yeniRol = $input['newRole'] ?? '';

            $sorgu = $db->prepare("SELECT role FROM users WHERE id = ?");
            $sorgu->execute([$hedefId]);
            $hedefUye = $sorgu->fetch();

            if (!$hedefUye) {
                echo json_encode(['success' => false, 'message' => 'Yönetici bulunamadı.']);
                exit;
            }

            $mevcutSeviye = getRolSeviye($hedefUye['role']);
            $yeniSeviye   = getRolSeviye($yeniRol);

            if ($yeniSeviye < 1 || $benimSeviyem <= $mevcutSeviye || $benimSeviyem <= $yeniSeviye) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Yetki sınırı! Yalnızca kendi altınızdaki yöneticileri ve kendi kademenizin altındaki dereceleri değiştirebilirsiniz.']);
                exit;
            }

            $db->prepare("UPDATE users SET role = ? WHERE id = ?")->execute([$yeniRol, $hedefId]);
            echo json_encode(['success' => true, 'message' => 'Yönetici kademesi başarıyla güncellendi!']);
            break;

        // 9. ALT KADEMEDEKİ YÖNETİCİYİ ÇIKARTMA / SİLME
        case 'delete_user':
            $hedefId = (int)($input['userId'] ?? 0);
            $sorgu = $db->prepare("SELECT full_name, role FROM users WHERE id = ?");
            $sorgu->execute([$hedefId]);
            $hedefUye = $sorgu->fetch();

            if (!$hedefUye) {
                echo json_encode(['success' => false, 'message' => 'Yönetici bulunamadı.']);
                exit;
            }

            $mevcutSeviye = getRolSeviye($hedefUye['role']);
            if ($benimSeviyem <= $mevcutSeviye) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Yetkisiz işlem! Üstünüzdeki veya sizinle eşit kademedeki bir yöneticiyi çıkartamazsınız.']);
                exit;
            }

            $db->prepare("DELETE FROM users WHERE id = ?")->execute([$hedefId]);
            echo json_encode(['success' => true, 'message' => $hedefUye['full_name'] . ' görevden çıkartıldı.']);
            break;

        default:
            echo json_encode(['success' => true, 'message' => '66 Vizite PHP API Aktif']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(400);
    $hata = str_contains($e->getMessage(), 'UNIQUE') ? 'Bu e-posta adresi zaten kayıtlı!' : $e->getMessage();
    echo json_encode(['success' => false, 'message' => $hata]);
}
