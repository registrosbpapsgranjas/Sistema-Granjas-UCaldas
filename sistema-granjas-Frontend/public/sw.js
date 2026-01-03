// sw.js - MÍNIMO para PWA instalable
const CACHE_NAME = "agrotech-v1";

// Instalación básica
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activación básica
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch MUY simple
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // NO hacer NADA con peticiones de API
  if (request.url.includes("/api") || request.url.includes("/auth")) {
    return;
  }

  // Para el resto, intentar red primero
  event.respondWith(fetch(request));
});

console.log("✅ Service Worker mínimo activo");
