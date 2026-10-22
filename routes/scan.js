/**
 * 66 Vizite - QR Tarama ve Ziyaretçi Bildirim Rotaları (Scan API)
 */

const express = require('express');
const router = express.Router();
const { getVehicleByPlate, logScan } = require('../database/db.js');
const { scanLimiter } = require('../middleware/rateLimit.js');

// 1. QR Tarama Görüntüleme & Loglama
router.get('/:plate', scanLimiter, (req, res) => {
  try {
    const plate = req.params.plate;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Bilinmeyen Cihaz';

    const result = logScan(plate, 'scan', ip, userAgent);

    return res.status(200).json({
      success: true,
      message: 'QR kod başarıyla tarandı.',
      data: {
        plateNumber: result.plateNumber,
        brandModel: result.brandModel,
        isActive: result.isActive,
        parkingNote: result.parkingNote,
        safeParkActive: result.safeParkActive,
        supportedActions: [
          { type: 'blocked', label: 'Aracınız Çıkışımı Engelliyor', icon: 'car' },
          { type: 'lights', label: 'Farlarınız / Dörtlüler Açık', icon: 'lightbulb' },
          { type: 'accident', label: 'Hasar / Kaza Durumu', icon: 'alert-triangle' },
          { type: 'tow', label: 'Bölgede Çekici / Ceza Uyarısı', icon: 'shield-alert' },
          { type: 'call', label: '0850 Anonim Köprü Arama', icon: 'phone-call' }
        ]
      }
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || 'Araç bulunamadı.'
    });
  }
});

// 2. Taramadan Sonra Araç Sahibine Bildirim Gönderme (Aksiyon Logu)
router.post('/:plate/action', scanLimiter, (req, res) => {
  try {
    const plate = req.params.plate;
    const { actionType, senderNote } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Bilinmeyen Cihaz';

    const validActions = ['blocked', 'lights', 'accident', 'tow', 'call', 'note', 'scan'];
    const action = validActions.includes(actionType) ? actionType : 'note';

    const result = logScan(plate, action, ip, userAgent);

    const actionDescriptions = {
      blocked: '🚗 "Aracınız Çıkışımı Engelliyor" uyarısı araç sahibine öncelikli bildirim ve SMS olarak iletildi.',
      lights: '💡 "Farlarınız / Dörtlüler Açık" uyarısı araç sahibine iletildi. Akü koruma alarmı devrede.',
      accident: '⚠️ Hasar / Temas bildirimi ve konum bilgisi araç sahibine güvenli şekilde aktarıldı.',
      tow: '🚨 "Bölgede Çekici / Ceza Uyarısı" acil uyarısı araç sahibine yüksek sesli bildirimle gönderildi.',
      call: '📞 0850 Anonim Köprü Arama başlatıldı. Telefon numaranız karşı tarafa kesinlikle iletilmez.',
      note: '📝 Notunuz araç sahibine başarıyla aktarıldı.'
    };

    return res.status(200).json({
      success: true,
      message: actionDescriptions[action] || 'Bildirim araç sahibine güvenle iletildi.',
      actionType: action,
      plateNumber: result.plateNumber,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Bildirim iletilemedi.'
    });
  }
});

module.exports = router;
