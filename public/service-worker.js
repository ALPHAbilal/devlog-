// Service Worker for Devlog PWA
const CACHE_NAME = 'devlog-v1';
const DYNAMIC_CACHE = 'devlog-dynamic-v1';
const API_CACHE = 'devlog-api-v1';

// Core files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Add your CSS and JS bundles here after build
  // '/assets/index-[hash].css',
  // '/assets/index-[hash].js',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName.startsWith('devlog-') &&
              cacheName !== CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== API_CACHE
            );
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Network-first strategy for HTML pages
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(handleHtmlRequest(request));
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle HTML requests - network first, fallback to cache
async function handleHtmlRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page if no cache available
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback HTML response
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Devlog</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: #0A0A0A;
              color: #E0E0E0;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            h1 { color: #00A86B; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
          </div>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' },
        status: 200,
      }
    );
  }
}

// Handle static asset requests - cache first, fallback to network
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a fallback for images
    if (request.destination === 'image') {
      return new Response(
        `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="#1A1A1A"/>
          <text x="50" y="50" text-anchor="middle" dy=".3em" fill="#666">Offline</text>
        </svg>`,
        {
          headers: { 'Content-Type': 'image/svg+xml' },
        }
      );
    }
    throw error;
  }
}

// Handle API requests - network first with timeout, fallback to cache
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  // Try network with timeout
  try {
    const networkResponse = await fetchWithTimeout(request, 5000);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Add header to indicate cached response
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers,
      });
    }
    
    // Return offline error response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No cached data available',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Fetch with timeout
function fetchWithTimeout(request, timeout = 5000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
}

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingData());
  }
});

// Sync pending data when back online
async function syncPendingData() {
  // Get all pending requests from IndexedDB
  const pendingRequests = await getPendingRequests();
  
  for (const pendingRequest of pendingRequests) {
    try {
      const response = await fetch(pendingRequest.request);
      if (response.ok) {
        await removePendingRequest(pendingRequest.id);
      }
    } catch (error) {
      console.error('Sync failed for request:', pendingRequest.id);
    }
  }
}

// IndexedDB helpers for offline queue
async function getPendingRequests() {
  // Implementation would use IndexedDB to store pending requests
  return [];
}

async function removePendingRequest(id) {
  // Implementation would remove from IndexedDB
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New update from Devlog',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      {
        action: 'open',
        title: 'Open',
      },
      {
        action: 'close',
        title: 'Dismiss',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Devlog', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') return;
  
  const url = event.notification.data.url || '/';
  event.waitUntil(
    clients.openWindow(url)
  );
});

// Cache management - limit cache sizes
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Remove oldest entries
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    for (const key of keysToDelete) {
      cache.delete(key);
    }
  }
}

// Periodically clean up caches
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEANUP_CACHES') {
    event.waitUntil(
      Promise.all([
        limitCacheSize(DYNAMIC_CACHE, 50),
        limitCacheSize(API_CACHE, 30),
      ])
    );
  }
});