/**
 * 66 Vizite - JavaScript Etkileşim Kodları
 * 1. Adım: Kayıt Olun Modal & Akış
 * 2. Adım: QR Satın Alma & Canlı Çıkartma Önizleme
 * 3. Adım: Güvenli Park Modu & QR Bildirim Simülatörü
 */

document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------------------
  // 1. TEMA DEĞİŞTİRİCİ (Dark / Light Mode)
  // ----------------------------------------------------
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('theme', nextTheme);
    });
  }

  // ----------------------------------------------------
  // 2. GİRİŞ VE KAYIT MODALI (1. ADIM: KAYIT OLUN)
  // ----------------------------------------------------
  const authModal = document.getElementById('authModal');
  const loginTrigger = document.getElementById('loginModalTrigger');
  const closeBtn = document.getElementById('modalCloseBtn');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  const stepBtnRegister = document.getElementById('stepBtnRegister');
  const mainCtaRegisterBtn = document.getElementById('mainCtaRegisterBtn');

  function openAuthModal(mode = 'login') {
    if (!authModal) return;
    authModal.classList.add('open');
    if (mode === 'register') {
      tabRegister?.classList.add('active');
      tabLogin?.classList.remove('active');
      registerForm?.classList.add('active');
      loginForm?.classList.remove('active');
      document.getElementById('regName')?.focus();
    } else {
      tabLogin?.classList.add('active');
      tabRegister?.classList.remove('active');
      loginForm?.classList.add('active');
      registerForm?.classList.remove('active');
      document.getElementById('loginEmail')?.focus();
    }
  }

  if (loginTrigger) {
    loginTrigger.addEventListener('click', () => openAuthModal('login'));
  }
  if (stepBtnRegister) {
    stepBtnRegister.addEventListener('click', () => openAuthModal('register'));
  }
  if (mainCtaRegisterBtn) {
    mainCtaRegisterBtn.addEventListener('click', () => openAuthModal('register'));
  }

  if (closeBtn && authModal) {
    closeBtn.addEventListener('click', () => authModal.classList.remove('open'));
  }

  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) authModal.classList.remove('open');
    });
  }

  // Tab Geçişleri
  if (tabLogin && tabRegister && loginForm && registerForm) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.classList.add('active');
      registerForm.classList.remove('active');
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      registerForm.classList.add('active');
      loginForm.classList.remove('active');
    });
  }

  // Giriş Yap Formu Gönderimi
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          window.location.href = 'dashboard.html';
          return;
        }
        alert(data.message || 'Giriş yapılamadı.');
      } catch (err) {
        // Fallback demo modunda panele geçiş sağla
        localStorage.setItem('currentUser', JSON.stringify({
          fullName: email.split('@')[0].toUpperCase() || 'Sürücü',
          email: email,
          planTier: 'pro'
        }));
        window.location.href = 'dashboard.html';
      }
    });
  }

  // Kayıt Formu Gönderimi
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password, planTier: 'pro' })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          alert('Tebrikler! Hesabınız başarıyla oluşturuldu. Şimdi panelinize yönlendiriliyorsunuz.');
          window.location.href = 'dashboard.html';
          return;
        }
        alert(data.message || 'Kayıt işlemi başarısız.');
      } catch (err) {
        localStorage.setItem('currentUser', JSON.stringify({
          fullName: fullName || 'Sürücü',
          email: email,
          planTier: 'pro'
        }));
        window.location.href = 'dashboard.html';
      }
    });
  }

  // ----------------------------------------------------
  // 3. 2. ADIM: QR SATIN ALMA & CANLI ÇIKARTMA SİSTEMİ
  // ----------------------------------------------------
  const buyQrModal = document.getElementById('buyQrModal');
  const stepBtnBuyQr = document.getElementById('stepBtnBuyQr');
  const buyQrModalCloseBtn = document.getElementById('buyQrModalCloseBtn');
  const qrPlateInput = document.getElementById('qrPlateInput');
  const previewPlateText = document.getElementById('previewPlateText');
  const liveQrCanvas = document.getElementById('liveQrCanvas');
  const buyQrForm = document.getElementById('buyQrForm');
  const shippingFields = document.getElementById('shippingFields');
  const buyQrSubmitText = document.getElementById('buyQrSubmitText');
  const btnDownloadQrDirect = document.getElementById('btnDownloadQrDirect');
  const productOptions = document.querySelectorAll('.product-option-card');

  function drawLiveQr(text) {
    if (!liveQrCanvas) return;
    const ctx = liveQrCanvas.getContext('2d');
    const size = liveQrCanvas.width;
    ctx.clearRect(0, 0, size, size);

    // Beyaz arkaplan
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#111111';

    // Köşe işaretçileri (Finder Patterns)
    function drawFinder(x, y) {
      ctx.fillRect(x, y, 35, 35);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 5, y + 5, 25, 25);
      ctx.fillStyle = '#111111';
      ctx.fillRect(x + 10, y + 10, 15, 15);
    }

    drawFinder(8, 8);
    drawFinder(size - 43, 8);
    drawFinder(8, size - 43);

    // Rastgele ama plakaya bağlı tutarlı QR desenleri
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    const blockSize = 6;
    for (let x = 8; x < size - 8; x += blockSize) {
      for (let y = 8; y < size - 8; y += blockSize) {
        // Finder köşelerini koru
        const inTopLeft = x < 48 && y < 48;
        const inTopRight = x > size - 48 && y < 48;
        const inBottomLeft = x < 48 && y > size - 48;
        if (inTopLeft || inTopRight || inBottomLeft) continue;

        // Merkez logo alanı (66 Vizite)
        const inCenter = x > 56 && x < 84 && y > 56 && y < 84;
        if (inCenter) {
          ctx.fillStyle = '#f5a623';
          ctx.fillRect(x, y, blockSize, blockSize);
          ctx.fillStyle = '#111111';
          continue;
        }

        const pseudoRand = Math.sin((x * 17) + (y * 31) + hash) * 10000;
        if (pseudoRand - Math.floor(pseudoRand) > 0.45) {
          ctx.fillRect(x, y, blockSize - 1, blockSize - 1);
        }
      }
    }
  }

  if (qrPlateInput) {
    qrPlateInput.addEventListener('input', (e) => {
      const val = e.target.value.toUpperCase();
      e.target.value = val;
      if (previewPlateText) previewPlateText.textContent = val || '34 VZT 66';
      drawLiveQr(val || '66VIZITE');
    });
  }

  if (stepBtnBuyQr && buyQrModal) {
    stepBtnBuyQr.addEventListener('click', () => {
      buyQrModal.classList.add('open');
      drawLiveQr(qrPlateInput?.value || '34 VZT 66');
    });
  }

  if (buyQrModalCloseBtn && buyQrModal) {
    buyQrModalCloseBtn.addEventListener('click', () => {
      buyQrModal.classList.remove('open');
    });
  }

  if (buyQrModal) {
    buyQrModal.addEventListener('click', (e) => {
      if (e.target === buyQrModal) buyQrModal.classList.remove('open');
    });
  }

  // Ürün opsiyon kartları seçimi (Dijital vs Sticker)
  productOptions.forEach(card => {
    card.addEventListener('click', () => {
      productOptions.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const isSticker = radio?.value === 'sticker';
      if (shippingFields) {
        shippingFields.style.display = isSticker ? 'flex' : 'none';
      }
      if (buyQrSubmitText) {
        buyQrSubmitText.textContent = isSticker ? '₺79 ile Siparişi Tamamla' : 'Ücretsiz QR Oluştur';
      }
    });
  });

  // Dijital PNG İndirme
  if (btnDownloadQrDirect && liveQrCanvas) {
    btnDownloadQrDirect.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `66-vizite-${qrPlateInput?.value || 'qr'}.png`;
      link.href = liveQrCanvas.toDataURL('image/png');
      link.click();
    });
  }

  // Satın Alma / Oluşturma Formu
  if (buyQrForm) {
    buyQrForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const plate = qrPlateInput.value.trim();
      const selectedType = document.querySelector('input[name="productType"]:checked')?.value;

      if (selectedType === 'sticker') {
        const name = document.getElementById('shippingName')?.value.trim();
        const address = document.getElementById('shippingAddress')?.value.trim();
        if (!name || !address) {
          alert('Lütfen teslimat için Ad Soyad ve Adres alanlarını doldurunuz.');
          return;
        }
        alert(`Harika! ${plate} plakalı reflektif ön cam stickerınız için siparişiniz alındı.\nKargo takip numaranız SMS ile iletilecektir.`);
      } else {
        alert(`Tebrikler! ${plate} plakalı dijital QR kodunuz hazırlandı.`);
        btnDownloadQrDirect?.click();
      }

      buyQrModal.classList.remove('open');
    });
  }

  // ----------------------------------------------------
  // 4. 3. ADIM: GÜVENLİ PARK SİSTEMİ SİMÜLATÖRÜ
  // ----------------------------------------------------
  const safeParkModal = document.getElementById('safeParkModal');
  const stepBtnSafePark = document.getElementById('stepBtnSafePark');
  const safeParkModalCloseBtn = document.getElementById('safeParkModalCloseBtn');

  const tabParkDriver = document.getElementById('tabParkDriver');
  const tabParkScanner = document.getElementById('tabParkScanner');
  const paneParkDriver = document.getElementById('paneParkDriver');
  const paneParkScanner = document.getElementById('paneParkScanner');

  const driverParkToggle = document.getElementById('driverParkToggle');
  const parkStatusLabel = document.getElementById('parkStatusLabel');
  const driverQuickNote = document.getElementById('driverQuickNote');
  const driverNoteForm = document.getElementById('driverNoteForm');
  const simNoteText = document.getElementById('simNoteText');
  const presetChips = document.querySelectorAll('.preset-chip');
  const simActionButtons = document.querySelectorAll('.sim-action-btn');
  const simSuccessAlert = document.getElementById('simSuccessAlert');
  const simSuccessDetail = document.getElementById('simSuccessDetail');

  if (stepBtnSafePark && safeParkModal) {
    stepBtnSafePark.addEventListener('click', () => {
      safeParkModal.classList.add('open');
    });
  }

  if (safeParkModalCloseBtn && safeParkModal) {
    safeParkModalCloseBtn.addEventListener('click', () => {
      safeParkModal.classList.remove('open');
    });
  }

  if (safeParkModal) {
    safeParkModal.addEventListener('click', (e) => {
      if (e.target === safeParkModal) safeParkModal.classList.remove('open');
    });
  }

  // Güvenli Park Sekme Geçişi
  if (tabParkDriver && tabParkScanner && paneParkDriver && paneParkScanner) {
    tabParkDriver.addEventListener('click', () => {
      tabParkDriver.classList.add('active');
      tabParkScanner.classList.remove('active');
      paneParkDriver.classList.add('active');
      paneParkScanner.classList.remove('active');
    });

    tabParkScanner.addEventListener('click', () => {
      tabParkScanner.classList.add('active');
      tabParkDriver.classList.remove('active');
      paneParkScanner.classList.add('active');
      paneParkDriver.classList.remove('active');
    });
  }

  // Park Toggle Switch
  if (driverParkToggle && parkStatusLabel) {
    driverParkToggle.addEventListener('change', () => {
      if (driverParkToggle.checked) {
        parkStatusLabel.innerHTML = 'Güvenli Park: <strong style="color: #2ed573;">AKTİF</strong>';
      } else {
        parkStatusLabel.innerHTML = 'Güvenli Park: <strong style="color: #ff4757;">PASİF</strong>';
      }
    });
  }

  // Preset Not Çipleri
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const note = chip.getAttribute('data-note');
      if (driverQuickNote && note) {
        driverQuickNote.value = note;
      }
    });
  });

  // Not Güncelleme Formu
  if (driverNoteForm) {
    driverNoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = driverQuickNote.value.trim() || 'Park halindedir.';
      if (simNoteText) {
        simNoteText.textContent = `"${val}"`;
      }
      alert('Park notunuz kaydedildi ve QR kodunuzu tarayan herkes için anında güncellendi.');
    });
  }

  // Simülatör Hızlı Bildirim Aksiyonları
  simActionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      let msg = '';

      switch (type) {
        case 'blocked':
          msg = '🚗 "Aracınız Çıkışımı Engelliyor" uyarısı araç sahibine öncelikli bildirim ve SMS olarak iletildi.';
          break;
        case 'lights':
          msg = '💡 "Farlarınız / Dörtlüler Açık" uyarısı araç sahibine iletildi. Akü koruma alarmı devrede.';
          break;
        case 'accident':
          msg = '⚠️ Hasar / Temas bildirimi ve konum bilgisi araç sahibine güvenli şekilde aktarıldı.';
          break;
        case 'tow':
          msg = '🚨 "Bölgede Çekici / Ceza Uyarısı" acil uyarısı araç sahibine yüksek sesli bildirimle gönderildi.';
          break;
        case 'call':
          msg = '📞 0850 Anonim Köprü Arama başlatıldı. Telefon numaranız karşı tarafa kesinlikle iletilmez.';
          break;
        default:
          msg = 'Bildirim araç sahibine güvenle iletildi.';
      }

      if (simSuccessAlert && simSuccessDetail) {
        simSuccessDetail.textContent = msg;
        simSuccessAlert.style.display = 'flex';
        simSuccessAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        setTimeout(() => {
          simSuccessAlert.style.display = 'none';
        }, 5000);
      }
    });
  });
});
