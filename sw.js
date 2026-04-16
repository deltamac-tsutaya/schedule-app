const CACHE_NAME = 'schedule-v7';

const SKIP_HOSTS = [
  'gstatic.com',
  'googleapis.com',
  'firebaseio.com',
  'cdnjs.cloudflare.com'
];

// Files to pre-cache on install
const SHELL_URLS = [
  '/index.html',
  '/admin.html',
  '/manifest.json',
  '/firebase-config.js'
].map(p => {
  const base = self.location.pathname.replace(/sw\.js$/, '');
  return base + p.replace(/^\//, '');
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Always bypass SW for Firebase and external CDN requests
  if (SKIP_HOSTS.some(h => url.hostname.includes(h))) return;

  const isHtmlOrJs = event.request.destination === 'document'
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('.js');

  if (isHtmlOrJs) {
    // Network-first：HTML/JS 永遠優先拿網路最新版，離線才用快取
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first：其他靜態資源（manifest 等）用快取加速
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        }).catch(() => caches.match('/index.html'));
      })
    );
  }
});
