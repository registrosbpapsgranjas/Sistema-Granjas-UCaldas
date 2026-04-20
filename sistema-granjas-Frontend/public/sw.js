// sw.js - Service Worker mínimo y funcional
const CACHE_NAME = "agrotech-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Para TODAS las peticiones (incluyendo API), responder con fetch normal
  // Así el service worker no interfiere con las llamadas al backend
  event.respondWith(fetch(request));
});

console.log("✅ Service Worker activo (modo pasivo)");