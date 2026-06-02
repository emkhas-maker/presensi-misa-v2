// ============================================================
// Service Worker - Presensi MI Sultan Agung
// Versi: 1.0
// ============================================================

const CACHE_NAME = 'presensi-misa-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo_MISA.png',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/fonts/tabler-icons.woff2',
];

// Install: cache semua assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching assets...');
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[SW] Beberapa asset gagal di-cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first untuk assets, network-first untuk GAS API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google Apps Script: selalu network
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(fetch(event.request).catch(() => new Response('{"ok":false,"msg":"Offline"}', {headers: {'Content-Type': 'application/json'}})));
    return;
  }

  // Assets: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Simpan ke cache jika berhasil
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback untuk HTML
        if (event.request.headers.get('Accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Background sync (opsional - untuk sinkronisasi ke GAS saat online kembali)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-presensi') {
    console.log('[SW] Background sync presensi...');
    // Implementasi sync ke GAS bisa ditambah di sini
  }
});
