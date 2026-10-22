/**
 * 66 Vizite - Araç Yönetimi Rotaları (Vehicles Full CRUD)
 */

const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  getVehicleByPlate,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  toggleVehicleActive,
  updateParkingNote
} = require('../database/db.js');
const { authenticateToken, optionalAuth } = require('../middleware/auth.js');
const { isValidPlate, formatPlate } = require('../utils/validators.js');

// 1. Araçları Listele (Read All)
router.get('/', optionalAuth, (req, res) => {
  try {
    // Giriş yapmış kullanıcı varsa sadece onun araçları, yoksa genel demo/tüm araçlar
    const userId = req.user ? req.user.id : (req.query.userId ? Number(req.query.userId) : null);
    const vehicles = getVehicles(userId);

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Araçlar listelenirken hata oluştu: ' + err.message
    });
  }
});

// 2. Tekil Araç Getir (Read One)
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user ? req.user.id : null;
    const vehicle = getVehicleById(id, userId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Araç bulunamadı.'
      });
    }

    return res.status(200).json({
      success: true,
      vehicle
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Araç bilgisi alınamadı: ' + err.message
    });
  }
});

// 3. Yeni Araç Ekle (Create)
router.post('/', optionalAuth, (req, res) => {
  try {
    const { plateNumber, brandModel, color, parkingNote, userId: bodyUid } = req.body;
    const rawPlate = String(plateNumber || '').trim();
    const brand = String(brandModel || '').trim();
    const col = String(color || 'Bireysel Araç').trim();
    const note = String(parkingNote || 'Park halindedir. Acil durumda arayabilirsiniz.').trim();

    // 1. Zorunlu Alan Kontrolü
    if (!rawPlate || !brand) {
      return res.status(400).json({
        success: false,
        message: 'Plaka ve Araç Modeli alanları zorunludur.'
      });
    }

    // 2. Türkiye Plaka Formatı Doğrulaması (Regex)
    if (!isValidPlate(rawPlate)) {
      return res.status(400).json({
        success: false,
        message: `"${rawPlate}" geçerli bir Türkiye plakası formatına (örn: 34 ABC 123 veya 06 ANK 1923) uymuyor.`
      });
    }

    const formattedPlate = formatPlate(rawPlate);
    const effectiveUserId = req.user ? req.user.id : (bodyUid ? Number(bodyUid) : 1);

    const vehicle = addVehicle(effectiveUserId, formattedPlate, brand, col, note);

    return res.status(201).json({
      success: true,
      message: `✅ ${formattedPlate} plakalı araç başarıyla eklendi ve QR vizite kodu üretildi.`,
      vehicle
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Araç eklenirken bir hata oluştu.'
    });
  }
});

// 4. Araç Bilgilerini Güncelle (Update)
router.put('/:id', optionalAuth, (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user ? req.user.id : null;
    const { brandModel, color, parkingNote, safeParkActive } = req.body;

    const updated = updateVehicle(id, userId, {
      brandModel,
      color,
      parkingNote,
      safeParkActive
    });

    return res.status(200).json({
      success: true,
      message: 'Araç bilgileri başarıyla güncellendi.',
      vehicle: updated
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Araç güncellenemedi.'
    });
  }
});

// 5. Araç Sil (Delete)
router.delete('/:id', optionalAuth, (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user ? req.user.id : null;

    deleteVehicle(id, userId);

    return res.status(200).json({
      success: true,
      message: 'Araç ve ilişkili tüm QR kod kayıtları başarıyla silindi.'
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Araç silinemedi.'
    });
  }
});

// 6. QR Durumu Aç / Kapat (Güvenli Park İletişim Durumu)
router.post('/:plate/toggle', optionalAuth, (req, res) => {
  try {
    const plate = req.params.plate;
    const { isActive } = req.body;
    const userId = req.user ? req.user.id : null;

    const result = toggleVehicleActive(plate, isActive !== false && isActive !== 0, userId);

    return res.status(200).json({
      success: true,
      message: `${plate} plakası için QR iletişimi ${result.isActive ? 'AKTİF' : 'PASİF'} yapıldı.`,
      result
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Durum değiştirilemedi.'
    });
  }
});

// 7. Park Notunu Güncelle
router.post('/:plate/note', optionalAuth, (req, res) => {
  try {
    const plate = req.params.plate;
    const { parkingNote } = req.body;
    const userId = req.user ? req.user.id : null;

    const result = updateParkingNote(plate, parkingNote, userId);

    return res.status(200).json({
      success: true,
      message: 'Park notu kaydedildi ve QR tarayanlar için güncellendi.',
      result
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Park notu güncellenemedi.'
    });
  }
});

module.exports = router;
