/**
 * Service Worker for Devlog
 * 
 * Implements advanced caching strategies for optimal performance
 */

const CACHE_NAME = 'devlog-v1';
const STATIC_CACHE = 'devlog-static-v1';
const DYNAMIC_CACHE = 'devlog-dynamic-v1';
const IMAGE_CACHE = 'devlog-images-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Cache configuration
const CACHE_CONFIG = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxEntries: 50,
  imageCacheMaxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  imageMaxEntries: 100
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
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
          .filter((name) => name.startsWith('devlog-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    // Handle Supabase API requests
    if (url.hostname.includes('supabase')) {
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
      return;
    }
    // Handle CDN resources
    if (url.hostname.includes('cdn')) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
      return;
    }
    return;
  }

  // Routing logic
  if (url.pathname.startsWith('/api/')) {
    // API calls - network first
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    // Images - cache first with long expiry
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (url.pathname.match(/\.(js|css)$/)) {
    // Static assets - cache first
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else {
    // HTML pages - network first
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      // Update cache in background
      refreshCache(request, cacheName);
      return cached;
    }
    
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline page if available
    const cached = await caches.match('/offline.html');
    return cached || new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Refresh cache in background
async function refreshCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response);
    }
  } catch (error) {
    // Silent fail - we already served from cache
  }
}

// Clean up old cache entries
async function cleanupCache(cacheName, maxEntries, maxAge) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const now = Date.now();

  const entriesToDelete = requests
    .map((request) => {
      const response = cache.match(request);
      return response.then((res) => {
        if (!res) return null;
        const dateHeader = res.headers.get('date');
        const date = dateHeader ? new Date(dateHeader).getTime() : 0;
        return {
          request,
          date,
          age: now - date
        };
      });
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  const entries = await Promise.all(entriesToDelete);

  // Remove old entries
  const oldEntries = entries.filter((entry) => entry.age > maxAge);
  
  // Remove excess entries
  const excessEntries = entries.slice(0, Math.max(0, entries.length - maxEntries));
  
  const toDelete = [...new Set([...oldEntries, ...excessEntries])];
  
  await Promise.all(
    toDelete.map((entry) => cache.delete(entry.request))
  );
}

// Periodic cleanup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHES') {
    event.waitUntil(
      Promise.all([
        cleanupCache(IMAGE_CACHE, CACHE_CONFIG.imageMaxEntries, CACHE_CONFIG.imageCacheMaxAge),
        cleanupCache(DYNAMIC_CACHE, CACHE_CONFIG.maxEntries, CACHE_CONFIG.maxAge)
      ])
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-documents') {
    event.waitUntil(syncDocuments());
  }
});

async function syncDocuments() {
  // Implement document sync logic
  // This would sync any offline changes when connection is restored
}

// Push notifications (if needed in future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: data.data
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});