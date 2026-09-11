// public/sw.js - Service Worker para Caché Automático de Mapas (Tiles)
const CACHE_NAME = 'turismo-map-tiles-v1';

const TILE_HOSTS = [
  'tile.openstreetmap.org',
  'server.arcgisonline.com',
  'services.arcgisonline.com',
  'google.com',
  'googleapis.com',
  'basemaps.cartocdn.com'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('turismo-map-tiles-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isTile = TILE_HOSTS.some(host => url.hostname.includes(host));

  if (!isTile) {
    return;
  }

  // Estrategia: Cache-First con actualización en segundo plano
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Entregar inmediatamente desde caché local
        // y refrescar en segundo plano si hay conexión
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
          })
          .catch(() => {
            // Modo sin conexión: no hacer nada, ya tenemos la imagen local
          });
        return cachedResponse;
      }

      // Si no está en caché, descargarlo de internet y almacenarlo
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkResponse;
        })
        .catch(() => {
          // Si está offline y no existe en caché, devolver respuesta vacía para no romper la app
          return new Response('', {
            status: 408,
            headers: { 'Content-Type': 'image/png' }
          });
        });
    })
  );
});
