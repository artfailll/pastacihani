(function () {
  'use strict';

  // Metataglar
  [
    ['theme-color', '#241018'],
    ['apple-mobile-web-app-capable', 'yes'],
    ['apple-mobile-web-app-status-bar-style', 'black-translucent'],
    ['apple-mobile-web-app-title', 'Pastacihanı']
  ].forEach(function (entry) {
    if (document.querySelector('meta[name="' + entry[0] + '"]')) return;
    var meta = document.createElement('meta');
    meta.name = entry[0]; meta.content = entry[1]; document.head.appendChild(meta);
  });

  // Service Worker Kaydı
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
  }

  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var deferredPrompt = null;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  // Stiller
  var style = document.createElement('style');
  style.textContent = [
    /* PWA Yükleme Bannerı */
    '.pc-install{position:fixed;z-index:2147483000;left:max(14px,env(safe-area-inset-left));right:max(14px,env(safe-area-inset-right));bottom:max(14px,calc(env(safe-area-inset-bottom) + 12px));max-width:480px;margin:auto;padding:14px 16px;background:rgba(25,12,18,.95);color:#fff;border:1px solid rgba(222,185,119,.4);border-radius:24px;box-shadow:0 20px 60px rgba(10,3,6,.6),0 0 30px rgba(221,185,119,.15);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);display:grid;grid-template-columns:52px 1fr auto;gap:14px;align-items:center;font:14px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;transform:translateY(160%);opacity:0;transition:.5s cubic-bezier(.16,1,.3,1)}',
    '.pc-install.on{transform:none;opacity:1}',
    '.pc-install img{width:52px;height:52px;border-radius:50%;object-fit:cover;background:#fff;border:2px solid #DDB977;box-shadow:0 0 14px rgba(221,185,119,.3)}',
    '.pc-install strong{display:block;font-size:15px;font-weight:700;color:#FFF8EF;margin-bottom:3px}',
    '.pc-install span{color:#DBC8CF;font-size:12px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}',
    '.pc-install button{border:0;border-radius:14px;padding:11px 16px;font-weight:750;font-size:13px;cursor:pointer;transition:.2s}',
    '.pc-install .pc-go{background:linear-gradient(135deg,#DDB977,#F4D99E);color:#210D14;box-shadow:0 4px 15px rgba(221,185,119,.35);white-space:nowrap}',
    '.pc-install .pc-go:active{transform:scale(.96)}',
    '.pc-install .pc-x{position:absolute;right:10px;top:-12px;width:26px;height:26px;padding:0;border-radius:50%;background:#29111A;color:#EAD3DA;border:1px solid rgba(255,255,255,.2);display:grid;place-items:center;font-size:14px;cursor:pointer}',

    /* iOS Yönlendirme Modalı */
    '.pc-sheet{position:fixed;z-index:2147483100;inset:0;background:rgba(12,4,8,.75);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:.35s ease}',
    '.pc-sheet.on{opacity:1;pointer-events:auto}',
    '.pc-sheet-body{max-width:440px;width:100%;background:linear-gradient(180deg,#241018,#160910);color:#FFF8EF;border:1px solid rgba(222,185,119,.35);border-radius:28px;padding:24px 22px;box-shadow:0 30px 90px rgba(0,0,0,.8);transform:translateY(40px);transition:.4s cubic-bezier(.16,1,.3,1);position:relative;text-align:center}',
    '.pc-sheet.on .pc-sheet-body{transform:none}',
    '.pc-sheet-logo{width:72px;height:72px;border-radius:50%;border:3px solid #DDB977;box-shadow:0 0 20px rgba(221,185,119,.3);margin:-50px auto 14px;object-fit:cover;background:#fff}',
    '.pc-sheet h3{font:700 21px/1.2 Georgia,serif;margin:0 0 8px;color:#F4D99E}',
    '.pc-sheet p{font-size:13px;color:#D8C4CB;margin:0 0 18px;line-height:1.5}',
    '.pc-steps{text-align:left;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px 16px;margin-bottom:20px}',
    '.pc-step{display:flex;align-items:center;gap:12px;margin-bottom:12px;font-size:13px;color:#EFE2E7}',
    '.pc-step:last-child{margin-bottom:0}',
    '.pc-step-num{width:26px;height:26px;border-radius:50%;background:#DDB977;color:#210D14;font-weight:800;font-size:12px;display:grid;place-items:center;flex-shrink:0}',
    '.pc-sheet-close{width:100%;border:0;border-radius:14px;background:linear-gradient(135deg,#DDB977,#F4D99E);color:#210D14;padding:13px;font-size:14px;font-weight:750;cursor:pointer}',
    '.pc-ios-pointer{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:2147483150;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;animation:pcBounce 1.2s infinite alternate ease-in-out}',
    '.pc-ios-pointer span{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#F4D99E;background:rgba(33,13,20,.9);padding:5px 12px;border-radius:12px;border:1px solid #DDB977}',
    '.pc-ios-pointer svg{width:28px;height:28px;fill:#DDB977;filter:drop-shadow(0 4px 10px rgba(0,0,0,.6))}',
    '@keyframes pcBounce{from{transform:translate(-50%,0)}to{transform:translate(-50%,-12px)}}',

    '@media(max-width:390px){.pc-install{grid-template-columns:46px 1fr}.pc-install img{width:46px;height:46px}.pc-install .pc-go{grid-column:1/-1;width:100%}}'
  ].join('');
  document.head.appendChild(style);

  // iOS Rehber Modalı Göster
  function showIOSGuide() {
    if (document.querySelector('.pc-sheet')) return;
    var sheet = document.createElement('div');
    sheet.className = 'pc-sheet';
    sheet.innerHTML = [
      '<div class="pc-sheet-body" role="dialog" aria-modal="true">',
      '  <img class="pc-sheet-logo" src="/apple-touch-icon.png" alt="Pastacihanı">',
      '  <h3>Pastacihanı’nı Yükle</h3>',
      '  <p>Siparişlerinizi uygulama hızında vermek için ana ekranınıza ekleyin.</p>',
      '  <div class="pc-steps">',
      '    <div class="pc-step"><div class="pc-step-num">1</div><span>Safari alt menüsündeki <b>Paylaş (Share)</b> butonuna dokunun.</span></div>',
      '    <div class="pc-step"><div class="pc-step-num">2</div><span>Açılan listede <b>Ana Ekrana Ekle</b> seçeneğine basın.</span></div>',
      '    <div class="pc-step"><div class="pc-step-num">3</div><span>Sağ üstteki <b>Ekle</b> butonuna dokunarak tamamlayın.</span></div>',
      '  </div>',
      '  <button type="button" class="pc-sheet-close">Anladım</button>',
      '</div>',
      '<div class="pc-ios-pointer">',
      '  <span>Paylaş Butonuna Basın</span>',
      '  <svg viewBox="0 0 24 24"><path d="M11 4.586V16h2V4.586l4.293 4.293 1.414-1.414L12 0 5.293 7.465l1.414 1.414L11 4.586zM3 18h18v4H3v-4z"/></svg>',
      '</div>'
    ].join('');
    document.body.appendChild(sheet);
    requestAnimationFrame(function () { sheet.classList.add('on'); });

    function close() {
      sheet.classList.remove('on');
      setTimeout(function () { sheet.remove(); }, 350);
    }
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet || e.target.classList.contains('pc-sheet-close')) close();
    });
  }

  // Yükleme Bannerını Göster
  function showInstallBanner() {
    if (standalone || document.querySelector('.pc-install')) return;
    var banner = document.createElement('aside');
    banner.className = 'pc-install';
    banner.setAttribute('aria-label', 'Pastacihanı uygulamasını yükle');
    banner.innerHTML = [
      '<button class="pc-x" type="button" aria-label="Kapat">×</button>',
      '<img src="/apple-touch-icon.png" alt="Pastacihanı">',
      '<div><strong>Pastacihanı Cebinizde</strong><span>Hızlı sipariş, pasta tasarımı ve canlı takip</span></div>',
      '<button class="pc-go" type="button">Uygulamayı Yükle</button>'
    ].join('');
    document.body.appendChild(banner);

    requestAnimationFrame(function () { banner.classList.add('on'); });

    banner.querySelector('.pc-x').addEventListener('click', function () { banner.remove(); });
    banner.querySelector('.pc-go').addEventListener('click', async function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        var choice = await deferredPrompt.userChoice.catch(function () {});
        deferredPrompt = null;
        banner.remove();
      } else {
        showIOSGuide();
      }
    });
  }

  // Event Listener'lar
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    showInstallBanner();
  });

  window.addEventListener('appinstalled', function () {
    var banner = document.querySelector('.pc-install');
    if (banner) banner.remove();
  });

  if (!standalone) {
    setTimeout(showInstallBanner, isIOS ? 1000 : 1800);
  }
})();
