// Service Worker for Habit Tracker PWA
const CACHE_NAME = 'habit-tracker-v82';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// JS and CSS files - use network-first strategy
const NETWORK_FIRST_ASSETS = [
    '/js/',
    '/styles/',
    '/customize.html'
];

// Check if URL should use network-first strategy
function shouldUseNetworkFirst(url) {
    return NETWORK_FIRST_ASSETS.some(path => url.includes(path));
}

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing v82...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating v82...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network-first for JS/CSS/navigation, cache-first for others
self.addEventListener('fetch', (event) => {
    // IMPORTANT: Never cache Supabase API calls - they must always go to network
    if (event.request.url.includes('supabase.co')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Skip other cross-origin requests (except CDNs we want to cache)
    if (!event.request.url.startsWith(self.location.origin) &&
        !event.request.url.includes('cdnjs.cloudflare.com') &&
        !event.request.url.includes('cdn.jsdelivr.net')) {
        return;
    }

    // Use network-first for navigation requests (page loads)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the fresh response
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache, then offline page
                    return caches.match(event.request)
                        .then((cached) => cached || caches.match(OFFLINE_URL));
                })
        );
        return;
    }

    // Use network-first for JS and CSS files (always get latest code)
    if (shouldUseNetworkFirst(event.request.url)) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the fresh response
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Cache-first for other assets
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                }).catch(() => {
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }
                });
            })
    );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
