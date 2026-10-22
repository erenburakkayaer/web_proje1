/**
 * 66 Vizite - Modern Toast Bildirim Motoru
 * Tarayıcının ilkel alert() yerine animasyonlu, glassmorphism bildirimler sunar.
 */

(function () {
  let container = null;

  function getContainer() {
    if (!container || !document.body.contains(container)) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(type, message, title = '') {
    const parent = getContainer();

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '!',
      info: 'i'
    };

    const defaultTitles = {
      success: 'Başarılı',
      error: 'Hata',
      warning: 'Uyarı',
      info: 'Bilgi'
    };

    const finalTitle = title || defaultTitles[type] || '';

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || 'i'}</div>
      <div class="toast-content">
        ${finalTitle ? `<div class="toast-title">${finalTitle}</div>` : ''}
        <p class="toast-msg">${message}</p>
      </div>
      <button class="toast-close" aria-label="Kapat">&times;</button>
      <div class="toast-progress"></div>
    `;

    // Kapatma butonu
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => dismissToast(toast));

    parent.appendChild(toast);

    // 4.5 saniye sonra otomatik kapat
    const timer = setTimeout(() => {
      dismissToast(toast);
    }, 4500);

    toast._timer = timer;
    return toast;
  }

  function dismissToast(toast) {
    if (!toast || toast._isDismissing) return;
    toast._isDismissing = true;
    if (toast._timer) clearTimeout(toast._timer);

    toast.classList.add('toast-leave');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 320);
  }

  window.toast = {
    success: (msg, title) => showToast('success', msg, title),
    error: (msg, title) => showToast('error', msg, title),
    warning: (msg, title) => showToast('warning', msg, title),
    info: (msg, title) => showToast('info', msg, title)
  };
})();
