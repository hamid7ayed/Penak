// Service Worker for Penak PWA (iOS Compatible)
const CACHE_NAME = 'penak-v1.1';
const OFFLINE_URL = '/';

// Essential files to cache
const urlsToCache = [
  '/',
  '/index.html'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential files');
        // Use addAll with error handling for iOS
        return cache.addAll(urlsToCache).catch(err => {
          console.log('[SW] Cache failed, continuing anyway:', err);
        });
      })
  );
  // iOS fix: activate immediately
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // iOS fix: take control immediately
  self.clients.claim();
});

// Fetch event - iOS compatible strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // CRITICAL: Never cache Google Apps Script API calls
  if (url.hostname.includes('script.google.com') || 
      url.hostname.includes('googleapis.com')) {
    // Always go to network for API calls
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, return empty array
          return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Skip external CDN resources (fonts, tailwind)
  if (url.hostname.includes('cdn.') || 
      url.hostname.includes('cloudflare.com') ||
      url.hostname.includes('jsdelivr.net')) {
    // Network first for CDN resources
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For app files: Network first, fallback to cache (iOS works best with this)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache the response
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});

// Handle messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
