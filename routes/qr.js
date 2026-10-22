/**
 * 66 Vizite - Dinamik QR Kod Üreteci Rotası
 */

const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');

router.get('/', async (req, res) => {
  try {
    const text = String(req.query.text || 'https://66vizite.com').trim();
    const format = req.query.format || 'image';
    const size = Math.min(Math.max(Number(req.query.size) || 300, 100), 1200);

    const qrOptions = {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#111111',
        light: '#ffffff'
      }
    };

    if (format === 'json') {
      const dataUrl = await QRCode.toDataURL(text, qrOptions);
      return res.status(200).json({
        success: true,
        text,
        qrDataUrl: dataUrl
      });
    }

    const buffer = await QRCode.toBuffer(text, qrOptions);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'QR kod oluşturulamadı: ' + err.message
    });
  }
});

module.exports = router;
