/**
 * BAC Software Factory Web - Service Worker
 * Provides offline fallback and asset caching.
 */

const CACHE_NAME = 'bac-sw-v1';
const OFFLINE_URL = '/offline';

const PRECACHE_URLS = [
  '/',
  '/offline',
];

// Install: precache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') {
    // For non-navigation requests: cache-first for static assets
    if (event.request.url.includes('/_next/static/')) {
      event.respondWith(
        caches.match(event.request).then((cached) =>
          cached || fetch(event.request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
        )
      );
      return;
    }
    return;
  }

  // For navigation: network-first with offline fallback
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then((cached) => cached || new Response('Offline', { status: 503 }))
    )
  );
});
