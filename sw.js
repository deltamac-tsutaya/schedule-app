const CACHE_NAME = 'management-v11';

const SKIP_HOSTS = [
  'gstatic.com',
  'googleapis.com',
  'firebaseio.com',
  'cdnjs.cloudflare.com'
];

const SHELL_URLS = [
  'index.html',
  'admin.html',
  'design-tokens.css',
  'module-popup.js',
  'module-employees.js',
  'firebase-config.js',
  'manifest.json'
].map(p => {
  const base = self.location.pathname.replace(/sw\.js$/, '');
  return base + p;
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (SKIP_HOSTS.some(h => url.hostname.includes(h))) return;

  const isHtmlOrJs = event.request.destination === 'document'
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('.js');

  if (isHtmlOrJs) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
          }
          return response;
        }).catch(() => caches.match('index.html'));
      })
    );
  }
});
