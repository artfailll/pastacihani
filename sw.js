const VERSION = 'v3';
const PAGES = 'pastacihani-pages-' + VERSION;
const ASSETS = 'pastacihani-assets-' + VERSION;
const SHELL = ['/', '/site.webmanifest', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/brand-logo.jpeg', '/pwa-install.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGES).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== PAGES && key !== ASSETS).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/.netlify/') || url.pathname.startsWith('/api/')) return;

  // Sayfalar: önce ağ (her zaman güncel), çevrimdışıysa son görülen kopya
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(PAGES).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('/')))
    );
    return;
  }

  // Yazı tipleri ve görseller: önbellek öncelikli (dosya adları içerik özetli, değişmez)
  if (url.pathname.startsWith('/assets/fonts/') || url.pathname.startsWith('/assets/img/')) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(ASSETS).then((cache) => cache.put(request, copy));
        }
        return response;
      }))
    );
    return;
  }

  // Betikler: önce ağ (HTML ile uyumsuz eski betik riskini önler), çevrimdışıysa önbellek
  if (url.pathname.startsWith('/assets/js/') || url.pathname === '/pwa-install.js') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(ASSETS).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
