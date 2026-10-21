/**
 * 66 Vizite - Temel JavaScript Kodları
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Tema Değiştirici (Dark / Light Mode)
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

  // 2. Giriş Modalı Kontrolleri
  const authModal = document.getElementById('authModal');
  const loginTrigger = document.getElementById('loginModalTrigger');
  const closeBtn = document.getElementById('modalCloseBtn');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginTrigger && authModal) {
    loginTrigger.addEventListener('click', () => {
      authModal.classList.add('open');
    });
  }

  if (closeBtn && authModal) {
    closeBtn.addEventListener('click', () => {
      authModal.classList.remove('open');
    });
  }

  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) {
        authModal.classList.remove('open');
      }
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

  // Giriş Yap Formu Gönderimi -> dashboard.html Yönlendirmesi
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
      } catch (err) {
        // Sunucu kapalı olsa bile demo modunda panele geçiş sağla
      }

      // Demo giriş
      localStorage.setItem('currentUser', JSON.stringify({
        fullName: email.split('@')[0].toUpperCase() || 'Sürücü',
        email: email,
        planTier: 'pro'
      }));
      window.location.href = 'dashboard.html';
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
          window.location.href = 'dashboard.html';
          return;
        }
      } catch (err) { }

      localStorage.setItem('currentUser', JSON.stringify({
        fullName: fullName || 'Sürücü',
        email: email,
        planTier: 'pro'
      }));
      window.location.href = 'dashboard.html';
    });
  }
});
