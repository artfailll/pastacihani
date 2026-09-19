(function () {
  'use strict';

  // Tüm sayfalarda <head> içinde zaten var; yalnızca eksikse tamamlar.
  [
    ['theme-color', '#8E3B57'],
    ['apple-mobile-web-app-capable', 'yes'],
    ['apple-mobile-web-app-status-bar-style', 'black-translucent'],
    ['apple-mobile-web-app-title', 'Pastacihanı']
  ].forEach(function (entry) {
    if (document.querySelector('meta[name="' + entry[0] + '"]')) return;
    var meta = document.createElement('meta');
    meta.name = entry[0]; meta.content = entry[1]; document.head.appendChild(meta);
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
    });
  }

  // Açılışta tek ekran kuralı: uygulama başlarken (standalone) ek bir "launch" perdesi YOK.
  // İşletim sistemi açılış ekranı (manifest background_color) -> sayfanın kendi marka perdesi -> içerik.
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) return;

  var DISMISS_KEY = 'pc_install_dismissed';
  var DISMISS_DAYS = 14;
  function dismissedRecently() {
    try {
      var t = +localStorage.getItem(DISMISS_KEY);
      return t && Date.now() - t < DISMISS_DAYS * 864e5;
    } catch (e) { return false; }
  }
  function rememberDismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
  }

  var deferredPrompt = null;
  var style = document.createElement('style');
  style.textContent = [
    '.pc-install{position:fixed;z-index:2147483000;left:max(14px,env(safe-area-inset-left));right:max(14px,env(safe-area-inset-right));bottom:max(14px,calc(env(safe-area-inset-bottom) + 10px));max-width:520px;margin:auto;padding:14px;background:rgba(35,20,25,.96);color:#fff;border:1px solid rgba(222,185,119,.34);border-radius:22px;box-shadow:0 18px 60px rgba(20,8,12,.42);backdrop-filter:blur(18px);display:grid;grid-template-columns:54px 1fr auto;gap:12px;align-items:center;font:14px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;transform:translateY(150%);opacity:0;transition:.55s cubic-bezier(.2,.8,.2,1)}',
    '.pc-install.on{transform:none;opacity:1}.pc-install img{width:54px;height:54px;border-radius:50%;object-fit:cover;background:#fff;border:2px solid #DDB977}.pc-install strong{display:block;font-size:15px;margin-bottom:3px}.pc-install span{color:#dccdd1;font-size:12px}.pc-install button{border:0;border-radius:12px;padding:10px 13px;font-weight:750;cursor:pointer}.pc-install .pc-go{background:linear-gradient(135deg,#DDB977,#F4D99E);color:#29171d}.pc-install .pc-x{position:absolute;right:7px;top:-30px;width:26px;height:26px;padding:0;border-radius:50%;background:#29171d;color:#fff;border:1px solid rgba(255,255,255,.2)}',
    '@media(max-width:390px){.pc-install{grid-template-columns:48px 1fr}.pc-install img{width:48px;height:48px}.pc-install .pc-go{grid-column:1/-1;width:100%}}@media(prefers-reduced-motion:reduce){.pc-install{transition:none}}'
  ].join('');
  document.head.appendChild(style);

  function showInstall() {
    if (!deferredPrompt || dismissedRecently() || document.querySelector('.pc-install')) return;
    var banner = document.createElement('aside');
    banner.className = 'pc-install';
    banner.setAttribute('aria-label', 'Pastacihanı uygulamasını yükle');
    banner.innerHTML = '<button class="pc-x" type="button" aria-label="Kapat">×</button><img src="/apple-touch-icon.png" alt="" width="54" height="54"><div><strong>Pastacihanı cebinde olsun</strong><span>Daha hızlı aç, tasarla ve sipariş ver.</span></div><button class="pc-go" type="button">Uygulamayı Yükle</button>';
    document.body.appendChild(banner);
    requestAnimationFrame(function () { banner.classList.add('on'); });
    banner.querySelector('.pc-x').addEventListener('click', function () { rememberDismiss(); banner.remove(); });
    banner.querySelector('.pc-go').addEventListener('click', async function () {
      var p = deferredPrompt;
      deferredPrompt = null;
      banner.remove();
      if (!p) return;
      p.prompt();
      var choice = await p.userChoice.catch(function () { return null; });
      if (!choice || choice.outcome !== 'accepted') rememberDismiss();
    });
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    // Açılış perdesi ve ilk izlenim bitsin; ziyaretçi sayfada biraz vakit geçirdikten sonra göster.
    setTimeout(showInstall, 9000);
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    var banner = document.querySelector('.pc-install');
    if (banner) banner.remove();
  });
})();
