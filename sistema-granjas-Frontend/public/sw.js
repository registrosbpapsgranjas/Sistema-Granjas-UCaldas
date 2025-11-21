// sw.js - Service Worker con soporte offline mejorado
const CACHE_VERSION = "agrotech-cache-v1";
const OFFLINE_URL = "/offline.html";

const ASSETS_TO_CACHE = ["/", "/index.html", OFFLINE_URL];

// ✅ Instalar y guardar archivos necesarios
self.addEventListener("install", (event) => {
  console.log("✅ Instalando Service Worker...");

  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );

  self.skipWaiting();
});

// ✅ Activación y limpieza de caches viejos
self.addEventListener("activate", (event) => {
  console.log("⚡ Activando nuevo Service Worker...");

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION) {
            console.log("🗑️ Eliminando cache viejo:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// ✅ Intercepción de requests
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Evitar cachear peticiones de API de login
  if (request.url.includes("/auth")) return;

  event.respondWith(
    caches.match(request).then((response) => {
      if (response) return response; // ✅ Responder desde cache si existe

      return fetch(request)
        .then((networkResponse) => {
          // ✅ Guardar en cache para uso futuro
          const cloned = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, cloned);
          });
          return networkResponse;
        })
        .catch(() => {
          // ❌ Sin cache + sin red → mostrar offline page
          return caches.match(OFFLINE_URL);
        });
    })
  );
});

console.log("✅ Service Worker listo");
