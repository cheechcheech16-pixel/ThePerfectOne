const CACHE_NAME = 'mylibrary-v1';
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

// Match any .js file inside any subfolder of the repo — covers ALL series
// regardless of what the folder is named, including future ones.
// Also catches covers.js, fonts, and anything else served from the same origin.
function shouldCache(url) {
  if (CORE_ASSETS.some(a => url.includes(a))) return true;
  // Any .js file under the GitHub Pages origin (book data + covers for every series)
  if (url.includes('cheechcheech16-pixel.github.io') && url.endsWith('.js')) return true;
  // Google Fonts
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) return true;
  return false;
}

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        if (shouldCache(e.request.url)) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
