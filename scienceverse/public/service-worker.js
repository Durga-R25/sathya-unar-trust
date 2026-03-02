/**
 * Service Worker for ScienceVerse PWA
 * Production-ready with Stale-While-Revalidate strategy
 * Provides instant loads + automatic updates for production deployment
 */

// Auto-versioned cache name - updates with each deployment
const CACHE_VERSION = '20250107'; // Update manually on major changes
const CACHE_NAME = `scienceverse-v${CACHE_VERSION}`;
const VIDEO_CACHE = `scienceverse-videos-v${CACHE_VERSION}`;

// Install event - activate immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  // Skip waiting to activate new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (cacheName !== CACHE_NAME && cacheName !== VIDEO_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - Stale-While-Revalidate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle video requests separately (larger cache)
  if (url.pathname.includes('.mp4') || url.pathname.includes('.webm')) {
    event.respondWith(handleVideoRequest(request));
    return;
  }

  // Handle all other requests with stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        // Fetch from network and update cache in background
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              // Clone before caching
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((error) => {
            console.log('[SW] Fetch failed:', error);
            // Return offline fallback if available
            if (request.destination === 'document') {
              return cache.match('/index.html');
            }
            return null;
          });

        // Return cached version immediately (fast), fetch updates in background
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Handle video requests with separate cache
async function handleVideoRequest(request) {
  const cache = await caches.open(VIDEO_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('[SW] Serving video from cache:', request.url);
    return cachedResponse;
  }

  try {
    console.log('[SW] Fetching video from network:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      // Cache videos for offline viewing
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Video fetch failed:', error);
    return new Response('Video unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background sync for uploading videos when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-uploads') {
    event.waitUntil(syncUploads());
  }
});

async function syncUploads() {
  // Get pending uploads from IndexedDB
  // Send to server
  // Mark as synced
  console.log('Syncing pending uploads...');
}

// Push notifications for competition updates
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
