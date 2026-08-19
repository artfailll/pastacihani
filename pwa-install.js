(function () {
  'use strict';
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
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});

  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var deferredPrompt = null;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var style = document.createElement('style');
  style.textContent = [
    '.pc-install{position:fixed;z-index:2147483000;left:max(14px,env(safe-area-inset-left));right:max(14px,env(safe-area-inset-right));bottom:max(14px,calc(env(safe-area-inset-bottom) + 10px));max-width:520px;margin:auto;padding:14px;background:rgba(35,20,25,.96);color:#fff;border:1px solid rgba(222,185,119,.34);border-radius:22px;box-shadow:0 18px 60px rgba(20,8,12,.42);backdrop-filter:blur(18px);display:grid;grid-template-columns:54px 1fr auto;gap:12px;align-items:center;font:14px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;transform:translateY(150%);opacity:0;transition:.55s cubic-bezier(.2,.8,.2,1)}',
    '.pc-install.on{transform:none;opacity:1}.pc-install img{width:54px;height:54px;border-radius:50%;object-fit:cover;background:#fff;border:2px solid #DDB977}.pc-install strong{display:block;font-size:15px;margin-bottom:3px}.pc-install span{color:#dccdd1;font-size:12px}.pc-install button{border:0;border-radius:12px;padding:10px 13px;font-weight:750;cursor:pointer}.pc-install .pc-go{background:linear-gradient(135deg,#DDB977,#F4D99E);color:#29171d}.pc-install .pc-x{position:absolute;right:7px;top:-30px;width:26px;height:26px;padding:0;border-radius:50%;background:#29171d;color:#fff;border:1px solid rgba(255,255,255,.2)}',
    '.pc-sheet{position:fixed;z-index:2147483100;inset:0;background:rgba(19,9,12,.64);display:flex;align-items:flex-end;justify-content:center;padding:18px;opacity:0;pointer-events:none;transition:.3s}.pc-sheet.on{opacity:1;pointer-events:auto}.pc-sheet>div{max-width:520px;width:100%;background:#fff;color:#29171d;border-radius:24px;padding:24px;box-shadow:0 25px 80px rgba(0,0,0,.35);transform:translateY(30px);transition:.35s}.pc-sheet.on>div{transform:none}.pc-sheet h2{font:700 22px/1.2 Georgia,serif;margin:0 0 10px}.pc-sheet p{margin:8px 0 18px;line-height:1.55}.pc-sheet ol{padding-left:22px;line-height:1.7}.pc-sheet button{width:100%;border:0;border-radius:14px;background:#8E3B57;color:#fff;padding:13px;font-weight:750}',
    '.pc-launch{position:fixed;z-index:2147483200;inset:0;display:grid;place-items:center;background:radial-gradient(circle at 50% 48%,#713247 0,#34151f 50%,#170b0f 100%);color:#F4D99E;animation:pcLaunchOut .65s ease 2.25s forwards;pointer-events:none}.pc-launch>div{text-align:center;animation:pcLaunchIn .8s cubic-bezier(.2,.8,.2,1) both}.pc-launch img{width:134px;height:134px;border-radius:50%;object-fit:cover;background:#fff;border:4px solid #DDB977;box-shadow:0 0 0 13px rgba(221,185,119,.12),0 22px 70px rgba(0,0,0,.42)}.pc-launch b{display:block;margin-top:28px;font:500 34px/1 Georgia,serif;letter-spacing:.03em}.pc-launch small{display:block;margin-top:11px;font-size:10px;letter-spacing:.35em;text-transform:uppercase;color:#e8d5b2}@keyframes pcLaunchIn{from{opacity:0;transform:scale(.82) translateY(14px)}to{opacity:1;transform:none}}@keyframes pcLaunchOut{to{opacity:0;visibility:hidden}}',
    '@media(max-width:390px){.pc-install{grid-template-columns:48px 1fr}.pc-install img{width:48px;height:48px}.pc-install .pc-go{grid-column:1/-1;width:100%}}@media(prefers-reduced-motion:reduce){.pc-install,.pc-sheet,.pc-sheet>div,.pc-launch,.pc-launch>div{transition:none;animation:none}.pc-launch{display:none}}'
  ].join('');
  document.head.appendChild(style);

  function instructions() {
    var sheet = document.createElement('div');
    sheet.className = 'pc-sheet';
    sheet.innerHTML = '<div role="dialog" aria-modal="true" aria-label="Uygulama kurulum adımları"><h2>Pastacihanı’nı ana ekrana ekle</h2><p>Bir sonraki siparişinde siteyi uygulama gibi tek dokunuşla aç.</p><ol><li>Tarayıcının <b>Paylaş</b> simgesine dokun.</li><li><b>Ana Ekrana Ekle</b> seçeneğini seç.</li><li>Sağ üstten <b>Ekle</b> de.</li></ol><button type="button">Anladım</button></div>';
    document.body.appendChild(sheet);
    requestAnimationFrame(function () { sheet.classList.add('on'); });
    function close() { sheet.classList.remove('on'); setTimeout(function () { sheet.remove(); }, 350); }
    sheet.addEventListener('click', function (event) { if (event.target === sheet || event.target.tagName === 'BUTTON') close(); });
  }

  function showInstall() {
    if (standalone || document.querySelector('.pc-install')) return;
    var banner = document.createElement('aside');
    banner.className = 'pc-install';
    banner.setAttribute('aria-label', 'Pastacihanı uygulamasını yükle');
    banner.innerHTML = '<button class="pc-x" type="button" aria-label="Kapat">×</button><img src="/apple-touch-icon.png" alt=""><div><strong>Pastacihanı cebinde olsun</strong><span>Daha hızlı aç, tasarla ve sipariş ver.</span></div><button class="pc-go" type="button">Uygulamayı Yükle</button>';
    document.body.appendChild(banner);
    requestAnimationFrame(function () { banner.classList.add('on'); });
    banner.querySelector('.pc-x').addEventListener('click', function () { banner.remove(); });
    banner.querySelector('.pc-go').addEventListener('click', async function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice.catch(function () {});
        deferredPrompt = null;
        banner.remove();
      } else {
        instructions();
      }
    });
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    showInstall();
  });
  window.addEventListener('appinstalled', function () {
    var banner = document.querySelector('.pc-install');
    if (banner) banner.remove();
  });

  if (standalone && !sessionStorage.getItem('pc_launch_seen')) {
    sessionStorage.setItem('pc_launch_seen', '1');
    var launch = document.createElement('div');
    launch.className = 'pc-launch';
    launch.innerHTML = '<div><img src="/apple-touch-icon.png" alt="Pastacihanı"><b>Pastacihanı</b><small>Couture Pastane · Silivri</small></div>';
    document.body.appendChild(launch);
    setTimeout(function () { launch.remove(); }, 3100);
  } else if (!standalone) {
    setTimeout(showInstall, isIOS ? 1200 : 2600);
  }
})();
