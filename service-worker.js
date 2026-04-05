// ===============================
// Penak PWA - Optimized Service Worker
// ===============================

const CACHE_VERSION = 'v3';
const CACHE_NAME = `penak-${CACHE_VERSION}`;
const BASE_PATH = '/penak';
const OFFLINE_URL = `${BASE_PATH}/offline.html`;

// Pre-cache essential static files
const STATIC_ASSETS = [
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/offline.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icon-192.png`,
  `${BASE_PATH}/icon-512.png`,
  'https://cdn.jsdelivr.net/gh/rastikerdar/estedad-font@v0.4.1/dist/Estedad-FD.css',
  'https://cdn.tailwindcss.com'
];

// ===============================
// INSTALL - Cache static assets
// ===============================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(
        STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' }))
      );
    })
  );
  self.skipWaiting();
});

// ===============================
// ACTIVATE - Remove old caches
// ===============================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ===============================
// FETCH - Smart caching strategy
// ===============================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestURL = new URL(event.request.url);

  // 1️⃣ Google Script API → network only
  if (requestURL.hostname.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // 2️⃣ Static assets → cache first
  if (
    requestURL.pathname.endsWith('.png') ||
    requestURL.pathname.endsWith('.css') ||
    requestURL.pathname.endsWith('.js') ||
    requestURL.pathname.startsWith(BASE_PATH)
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // 3️⃣ HTML pages → network first
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Default: network first
  event.respondWith(networkFirst(event.request));
});

// ===============================
// CACHE-FIRST (fast for static files)
// ===============================
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    return caches.match(OFFLINE_URL);
  }
}

// ===============================
// NETWORK-FIRST (best for HTML)
// ===============================
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || caches.match(OFFLINE_URL);
  }
}

// ===============================
// MESSAGE HANDLER (SKIP_WAITING)
// ===============================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
