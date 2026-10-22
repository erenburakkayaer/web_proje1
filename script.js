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
  // 2. GİRİŞ VE KAYIT MODALI & PANEL ERİŞİM KONTROLÜ
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

  // Navbar Elemanları
  const navDashboardLink = document.getElementById('navDashboardLink');
  const navUserBadge = document.getElementById('navUserBadge');
  const navUserName = document.getElementById('navUserName');
  const navLogoutBtn = document.getElementById('navLogoutBtn');
  const navGetStartedBtn = document.getElementById('navGetStartedBtn');

  // Panel Linkini ve Kullanıcı Durumunu Kontrol Et
  async function checkUserAuthStatus() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        // Oturum AÇIK: Panel linkini ve kullanıcı rozetini göster
        if (navDashboardLink) navDashboardLink.style.display = 'inline-flex';
        if (navUserBadge) navUserBadge.style.display = 'inline-flex';
        if (navUserName) navUserName.textContent = data.user.fullName || 'Sürücü';
        if (loginTrigger) loginTrigger.style.display = 'none';
        if (navGetStartedBtn) navGetStartedBtn.style.display = 'none';

        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return;
      }
    } catch (e) {}

    // Oturum KAPALI: Panel linkini kesinlikle gizle
    if (navDashboardLink) navDashboardLink.style.display = 'none';
    if (navUserBadge) navUserBadge.style.display = 'none';
    if (loginTrigger) loginTrigger.style.display = 'inline-flex';
    if (navGetStartedBtn) navGetStartedBtn.style.display = 'inline-flex';
    localStorage.removeItem('currentUser');

    // Eğer yetkisiz panel erişimiyle index'e yönlendirildiyse
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'required') {
      openAuthModal('login');
      setTimeout(() => {
        toast.warning('Yönetim paneline erişebilmek için lütfen önce giriş yapınız.', 'Oturum Gerekli');
      }, 350);
      history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('auth') === 'expired') {
      openAuthModal('login');
      setTimeout(() => {
        toast.warning('Oturum süreniz doldu, lütfen tekrar giriş yapınız.', 'Oturum Yenile');
      }, 350);
      history.replaceState({}, document.title, window.location.pathname);
    }
  }

  checkUserAuthStatus();

  if (navLogoutBtn) {
    navLogoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch (e) {}
      localStorage.removeItem('currentUser');
      toast.info('Başarıyla çıkış yapıldı.');
      checkUserAuthStatus();
    });
  }

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
      const emailInput = document.getElementById('loginEmail');
      const passInput = document.getElementById('loginPassword');
      const email = emailInput.value.trim();
      const password = passInput.value;

      if (!email || !password) {
        toast.warning('Lütfen e-posta ve şifrenizi giriniz.');
        return;
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.user) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
          }
          toast.success(data.message || 'Giriş başarılı! Yönlendiriliyorsunuz...', 'Giriş Yapıldı');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 900);
          return;
        }
        toast.error(data.message || 'Giriş yapılamadı.');
      } catch (err) {
        toast.error('Sunucuya bağlanılamadı. Lütfen sunucunun açık olduğundan emin olun.');
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

      if (!fullName || !email || !password) {
        toast.warning('Lütfen tüm zorunlu alanları doldurunuz.');
        return;
      }

      if (password.length < 6) {
        toast.warning('Şifreniz en az 6 karakter olmalıdır.');
        return;
      }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ fullName, email, password, planTier: 'pro' })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.user) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
          }
          toast.success('Tebrikler! Hesabınız başarıyla oluşturuldu. Panelinize yönlendiriliyorsunuz.', 'Kayıt Başarılı');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1100);
          return;
        }
        toast.error(data.message || 'Kayıt işlemi başarısız.');
      } catch (err) {
        toast.error('Sunucu bağlantısı sağlanamadı.');
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
      const plate = (qrPlateInput?.value || '').trim().toUpperCase();
      const selectedType = document.querySelector('input[name="productType"]:checked')?.value;

      // Türkiye Plaka Doğrulaması (Regex)
      const trPlateRegex = /^(0[1-9]|[1-7][0-9]|8[01])\s?[A-ZÇĞİÖŞÜ]{1,3}\s?[0-9]{2,4}$/i;
      if (!plate || !trPlateRegex.test(plate)) {
        toast.warning('Lütfen geçerli bir Türkiye plakası giriniz (Örn: 34 VZT 66 veya 06 ANK 1923).', 'Geçersiz Plaka');
        qrPlateInput?.focus();
        return;
      }

      if (selectedType === 'sticker') {
        const name = document.getElementById('shippingName')?.value.trim();
        const address = document.getElementById('shippingAddress')?.value.trim();
        if (!name || !address) {
          toast.warning('Lütfen teslimat için Ad Soyad ve Adres alanlarını doldurunuz.');
          return;
        }
        toast.success(`Harika! ${plate} plakalı reflektif ön cam stickerınız için siparişiniz alındı.\nKargo takip numaranız SMS ile iletilecektir.`, 'Sipariş Alındı');
      } else {
        toast.success(`Tebrikler! ${plate} plakalı dijital QR kodunuz hazırlandı ve indiriliyor.`, 'QR Vizite Hazır');
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
        toast.success('Güvenli park modu aktif edildi.');
      } else {
        parkStatusLabel.innerHTML = 'Güvenli Park: <strong style="color: #ff4757;">PASİF</strong>';
        toast.info('Güvenli park modu pasife alındı.');
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
    driverNoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = driverQuickNote.value.trim() || 'Park halindedir.';
      if (simNoteText) {
        simNoteText.textContent = `"${val}"`;
      }
      try {
        await fetch('/api/vehicles/34%20VZT%2066/note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ parkingNote: val })
        });
      } catch (err) {}
      toast.success('Park notunuz kaydedildi ve QR kodunuzu tarayan herkes için güncellendi.', 'Not Güncellendi');
    });
  }

  // Simülatör Hızlı Bildirim Aksiyonları (Gerçek API Loglama)
  simActionButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const type = btn.getAttribute('data-type');
      let defaultMsg = 'Bildirim araç sahibine güvenle iletildi.';

      try {
        const res = await fetch('/api/scan/34%20VZT%2066/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionType: type })
        });
        const data = await res.json();
        const msg = data.message || defaultMsg;

        if (simSuccessAlert && simSuccessDetail) {
          simSuccessDetail.textContent = msg;
          simSuccessAlert.style.display = 'flex';
          simSuccessAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

          setTimeout(() => {
            simSuccessAlert.style.display = 'none';
          }, 5000);
        }

        toast.info(msg, 'Bildirim İletildi');
      } catch (err) {
        toast.info(defaultMsg, 'Bildirim İletildi');
      }
    });
  });
});
