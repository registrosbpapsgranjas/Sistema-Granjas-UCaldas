import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Configuración para PWA
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Solo registrar en producción o cuando quieras probar
      const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      // En desarrollo, puedes elegir si activarlo o no
      const enableInDevelopment = false; // Cambia a true si quieres probar PWA en local

      if (!isLocalhost || enableInDevelopment) {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('✅ Service Worker registrado para PWA:', registration);

        // Verificar si ya está instalada
        if (window.matchMedia('(display-mode: standalone)').matches) {
          console.log('📱 Aplicación ejecutándose como PWA instalada');
        }
      } else {
        console.log('🏠 Modo desarrollo: Service Worker no registrado');

        // En desarrollo, limpiar cualquier SW previo para evitar conflictos
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
    } catch (error) {
      console.warn('⚠️ Service Worker no registrado:', error);
    }
  }
};

// Registrar el Service Worker después de que la app cargue
window.addEventListener('load', () => {
  // Pequeño delay para asegurar que todo está listo
  setTimeout(registerServiceWorker, 1000);
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);