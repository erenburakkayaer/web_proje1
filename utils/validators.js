/**
 * 66 Vizite - Doğrulama ve Formatlayıcı Yardımcıları
 */

// Türkiye Cumhuriyeti Araç Plaka Standart Regex'i
// Format: 01-81 il kodu, 1-3 harf, 2-4 rakam (boşluklu veya boşluksuz)
const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|8[01])\s?[A-ZÇĞİÖŞÜ]{1,3}\s?[0-9]{2,4}$/i;

function cleanPlate(plate) {
  if (!plate || typeof plate !== 'string') return '';
  return plate
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleUpperCase('tr-TR');
}

function isValidPlate(plate) {
  const cleaned = cleanPlate(plate);
  return TR_PLATE_REGEX.test(cleaned);
}

function formatPlate(plate) {
  const cleaned = cleanPlate(plate).replace(/\s+/g, '');
  const match = cleaned.match(/^([0-9]{2})([A-ZÇĞİÖŞÜ]{1,3})([0-9]{2,4})$/);
  if (!match) return cleanPlate(plate);
  return `${match[1]} ${match[2]} ${match[3]}`;
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

module.exports = {
  TR_PLATE_REGEX,
  cleanPlate,
  isValidPlate,
  formatPlate,
  isValidEmail
};
