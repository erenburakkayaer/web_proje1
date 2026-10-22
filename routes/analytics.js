/**
 * 66 Vizite - Gerçek Zamanlı Analitik ve Raporlama Rotaları
 */

const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../database/db.js');
const { optionalAuth } = require('../middleware/auth.js');

router.get('/', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : (req.query.userId ? Number(req.query.userId) : null);
    const data = getAnalytics(userId);

    // Haftalık grafikteki en yüksek değeri bulup yüzdelik normalize et
    const maxCount = Math.max(...data.weeklyChart.map(d => d.count), 1);
    const chartWithPercentages = data.weeklyChart.map(item => ({
      ...item,
      percentage: Math.round((item.count / maxCount) * 100)
    }));

    return res.status(200).json({
      success: true,
      analytics: {
        ...data,
        weeklyChart: chartWithPercentages
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Analitik verileri alınırken hata oluştu: ' + err.message
    });
  }
});

module.exports = router;
