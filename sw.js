// Offline app-shell cache so the installed (home-screen) app still opens without a network
// connection. IMPORTANT — learned the hard way in Round 14: cache-first on index.html meant every
// code update kept getting silently overridden by an old cached copy, even after a real redeploy,
// which looked exactly like a bug that was never actually fixed. Two changes fix that for good:
// (1) CACHE_NAME must be bumped on every release that touches index.html/app.js — bumped here to v2,
//     and MUST be bumped again on every future update (this comment is the reminder to future edits).
// (2) the HTML shell itself is now network-first (falls back to cache only when truly offline), so
//     even a forgotten version bump can't trap a user on stale code as long as they have a connection —
//     cache-first is kept only for the rarely-changing static assets (manifest, icons).
const CACHE_NAME = 'steadyspend-shell-v2';
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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.indexOf('frankfurter.dev') !== -1) return; // never cache live rate lookups

  var isShellDoc = event.request.mode === 'navigate' || event.request.url.indexOf('index.html') !== -1;
  if (isShellDoc){
    // Network-first for the app itself: always tries to fetch the latest version first, and only
    // falls back to whatever's cached if there's genuinely no connection. This is what makes "add
    // to home screen" still open offline, without ever trapping a user on old code while online.
    event.respondWith(
      fetch(event.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        return res;
      }).catch(function(){ return caches.match(event.request); })
    );
    return;
  }

  // Everything else (manifest, icons) — cache-first, these essentially never change between releases.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});
