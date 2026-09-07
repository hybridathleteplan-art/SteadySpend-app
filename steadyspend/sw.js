// Minimal offline app-shell cache so the installed (home-screen) app still opens without a
// network connection. Bump CACHE_NAME whenever index.html changes so returning users get the
// update instead of a stale cached copy.
const CACHE_NAME = 'steadyspend-shell-v1';
const SHELL_FILES = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Cache-first for the app shell; anything else (like the live FX-rate lookup) always goes to
// the network untouched — the app must never see a stale exchange rate served from cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.indexOf('frankfurter.dev') !== -1) return; // never cache live rate lookups
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});
