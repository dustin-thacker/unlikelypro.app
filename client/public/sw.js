const CACHE_NAME = 'inspection-tracker-v1';
const OFFLINE_URL = '/field-tech';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/field-tech',
  '/offline.html',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
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
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // API requests - network first
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(event.request);
        })
    );
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Background sync for offline uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-deliverables') {
    event.waitUntil(syncDeliverables());
  }
});

async function syncDeliverables() {
  // Get pending uploads from IndexedDB
  const db = await openDB();
  const tx = db.transaction('pending-uploads', 'readonly');
  const store = tx.objectStore('pending-uploads');
  const pendingUploads = await store.getAll();

  // Upload each pending deliverable
  for (const upload of pendingUploads) {
    try {
      const response = await fetch('/api/trpc/deliverables.create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(upload.data),
      });

      if (response.ok) {
        // Remove from pending uploads
        const deleteTx = db.transaction('pending-uploads', 'readwrite');
        await deleteTx.objectStore('pending-uploads').delete(upload.id);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('inspection-tracker-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-uploads')) {
        db.createObjectStore('pending-uploads', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cached-tasks')) {
        db.createObjectStore('cached-tasks', { keyPath: 'id' });
      }
    };
  });
}
