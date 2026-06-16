const CACHE_NAME = 'WebApp';
const CORE_ASSETS = [
  '/ThePerfectOne/index.html',
  '/ThePerfectOne/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Third-party CDN assets that never change — safe to serve cache-first
function isThirdParty(url) {
  return (
    url.includes('cdnjs.cloudflare.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  );
}

// Your own assets — HTML, JS, JSON on your GitHub Pages origin
function isOwnAsset(url) {
  return url.includes('cheechcheech16-pixel.github.io');
}

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Cache-first for stable third-party CDN assets
  if (isThirdParty(url)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Network-first for your own HTML/JS/JSON — always gets fresh content,
  // falls back to cache only when genuinely offline
  if (isOwnAsset(url)) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() =>
        caches.match(e.request).then(cached =>
          cached || new Response('Offline', { status: 503 })
        )
      )
    );
    return;
  }

  // Everything else: network-first, no caching
  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then(cached =>
        cached || new Response('Offline', { status: 503 })
      )
    )
  );
});
