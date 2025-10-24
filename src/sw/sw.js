const CACHE_NAME = "ibragimov-currency-offline-v1";
const ASSETS_CACHE_NAME = "ibragimov-currency-assets-v1";

// Assets that should be pre-cached during installation
const PRECACHE_ASSETS = [
  '/currency/',
  '/currency/index.html',
  '/currency/app.js',
  '/currency/app.css',
  '/currency/data.json',
  '/currency/assets/manifest.json',
  '/currency/assets/favicon-192x192.png',
  '/currency/assets/favicon-1024x1024.png',
  '/currency/assets/favicon-144x144.png',
  '/currency/assets/favicon-96x96.png',
  '/currency/assets/favicon.ico'
];

self.addEventListener("install", function (event) {
  console.log("[PWA Builder] Install Event processing");

  // Pre-cache essential assets during installation
  event.waitUntil(
    caches.open(ASSETS_CACHE_NAME)
      .then(function(cache) {
        console.log('[PWA Builder] Pre-caching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(function() {
        // Force the service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// When the service worker is activated, clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[PWA Builder] Activate Event processing');

  const currentCaches = [CACHE_NAME, ASSETS_CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (!currentCaches.includes(cacheName)) {
            console.log('[PWA Builder] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      // Ensure the service worker takes control of all clients
      return self.clients.claim();
    })
  );
});

// Helper function to strip query parameters from URLs for cache matching
function stripQueryParams(url) {
  return url.split('?')[0];
}

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const cleanUrl = stripQueryParams(requestUrl.href);

  // For HTML and JSON files, use stale-while-revalidate strategy
  if (cleanUrl.includes('/currency/index.html') ||
      cleanUrl.includes('/currency/data.json')) {
    event.respondWith(
      staleWhileRevalidate(event.request)
    );
    return;
  }

  // For pre-cached assets, try the cache first (ignoring query parameters)
  if (PRECACHE_ASSETS.some(asset => cleanUrl.endsWith(asset) || cleanUrl.includes(asset))) {
    event.respondWith(
      caches.open(ASSETS_CACHE_NAME).then(function(cache) {
        // Try to match with query params first, then without
        return cache.match(event.request).then(function(response) {
          if (response) return response;

          // Try matching without query parameters
          return cache.match(cleanUrl).then(function(cleanResponse) {
            if (cleanResponse) return cleanResponse;

            // Fetch from network and cache
            return fetch(event.request).then(function(networkResponse) {
              // Only cache successful responses
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            }).catch(function(error) {
              console.log("[PWA Builder] Failed to fetch asset:", error);
              // Return a meaningful error for debugging
              throw error;
            });
          });
        });
      })
    );
    return;
  }

  // For all other requests, try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        console.log("[PWA Builder] add page to offline cache: " + response.url);

        // If request was success, add or update it in the cache
        event.waitUntil(updateCache(event.request, response.clone()));

        return response;
      })
      .catch(function (error) {
        console.log("[PWA Builder] Network request Failed. Serving content from cache: " + error);
        return fromCache(event.request);
      })
  );
});

/**
 * Implements the stale-while-revalidate caching strategy:
 * 1. Try to fetch from cache first (for immediate response)
 * 2. Then fetch from network and update the cache (for future requests)
 * 3. If both cache and network fail, return a 404 response
 */
function staleWhileRevalidate(request) {
  return caches.open(CACHE_NAME).then(function(cache) {
    return cache.match(request).then(function(response) {
      const fetchPromise = fetch(request).then(function(networkResponse) {
        cache.put(request, networkResponse.clone());
        return networkResponse;
      });

      // Return the cached response if we have one, otherwise wait for the network response
      return response || fetchPromise;
    }).catch(function() {
      // If both cache and network fail, return a 404 response
      return new Response('Not found', { status: 404, statusText: 'Not found' });
    });
  });
}

function fromCache(request) {
  return caches.open(CACHE_NAME).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return Promise.reject("no-match");
      }

      return matching;
    });
  });
}

function updateCache(request, response) {
  return caches.open(CACHE_NAME).then(function (cache) {
    return cache.put(request, response);
  });
}
