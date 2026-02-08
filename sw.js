// OrderFlow Service Worker
// Bump cache name to ensure clients don't keep the old app-shell cached under "/".
const CACHE_NAME = 'orderflow-v3562-landing-first';

const PRECACHE_URLS = [
  // Landing entry (served at "/" and "/index.html")
  '/index.html',
  '/landing-pages/landing.html',

  // Main app entry (served at "/app")
  '/app/index.html',

  // Core assets for the main app shell
  '/css/styles.css',
  '/css/design-tokens.css',
  '/css/utilities.css',
  '/css/components.css',
  '/css/appbuilder.css',
  '/config/version.js?v=3562',
  '/js/app.js?v=3562',
  '/images/FLOW-logo-hvid-4K.png'
];

// Install event - cache basic assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests (Supabase, etc.)
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        const offlineFallback = () =>
          new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });

        // Navigation fallback:
        // - "/app" (and deep "/app/*") should boot the main app shell
        // - everything else falls back to landing
        if (event.request.mode === 'navigate') {
          const isAppPath = url.pathname === '/app' || url.pathname.startsWith('/app/');
          const fallbackPath = isAppPath ? '/app/index.html' : '/index.html';
          return caches.match(fallbackPath).then((cached) => cached || offlineFallback());
        }

        const isStaticAsset =
          url.pathname.startsWith('/css/') ||
          url.pathname.startsWith('/js/') ||
          url.pathname.startsWith('/images/') ||
          url.pathname.startsWith('/config/') ||
          url.pathname.startsWith('/assets/');

        // Fallback to cache if offline.
        // For static assets we also try ignoreSearch to tolerate cache-busting query params.
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (isStaticAsset) {
            return caches.match(event.request, { ignoreSearch: true }).then((c2) => c2 || offlineFallback());
          }
          return offlineFallback();
        });
      })
  );
});

// Message handler for cache invalidation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CMS_CACHE') {
    caches.keys().then((names) => {
      Promise.all(names.map((name) => caches.delete(name))).then(() => {
        self.skipWaiting();
        // Notify all clients to refresh
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        });
      });
    });
  }
});
