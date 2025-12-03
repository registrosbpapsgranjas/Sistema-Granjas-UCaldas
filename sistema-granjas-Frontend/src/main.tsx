import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// DESACTIVAR SERVICE WORKER TEMPORALMENTE
if ('serviceWorker' in navigator) {
  // Primero desregistrar cualquier Service Worker existente
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('🚫 Service Worker desregistrado para desarrollo');
    });
  });

  // También limpiar caché
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName);
    });
  });
}

// COMENTAR EL REGISTRO DEL SERVICE WORKER:
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado correctamente:', registration);
      })
      .catch((error) => {
        console.log('❌ Error registrando Service Worker:', error);
      });
  });
}
*/

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);