const CACHE_NAME = 'schedule-v4';

// Derive base path automatically so this works on GitHub Pages
// (e.g. /schedule-app/) as well as a custom domain root (/)
const BASE = self.location.pathname.replace(/sw\.js$/, '');

const SHELL_URLS = [
  BASE + 'index.html',
  BASE + 'admin.html',
  BASE + 'manifest.json',
  BASE + 'firebase-config.js'
];

// Skip caching requests to these external hosts
const SKIP_HOSTS = [
  'gstatic.com',
  'googleapis.com',
  'firebaseio.com',
  'cdnjs.cloudflare.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_URLS).catch(() => {
        return cache.addAll(['/index.html', '/manifest.json']);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Let Firebase SDK and API requests go straight to network
  if (SKIP_HOSTS.some(h => url.hostname.includes(h))) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
