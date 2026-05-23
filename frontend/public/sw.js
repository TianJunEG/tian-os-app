// Tutor Match service worker — offline app shell.
// Strategy: app-shell precache + network-first navigation (SPA fallback)
// + stale-while-revalidate for same-origin static assets. API and
// cross-origin requests are left to the network.
// __SW_VERSION__ is replaced at build time (scripts/postbuild-sw.cjs) with a
// hash of the built assets, so a new release auto-invalidates old caches.
const CACHE = 'tutormatch-__SW_VERSION__';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)));
});

// The page posts this when the user accepts an update; activating here fires
// `controllerchange` in the client, which triggers a one-time reload.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // backend / CDN: network only
  if (url.pathname.startsWith('/api')) return; // never cache API responses

  // SPA navigations: try network, fall back to cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/index.html')));
    return;
  }

  // Hashed static assets: serve cache fast, refresh in background.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
