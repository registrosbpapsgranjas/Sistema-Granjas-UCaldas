import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Renderizamos la app principal en el root del HTML
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// ✅ Registro del Service Worker para habilitar modo offline e instalación PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado correctamente:', registration);
      })
      .catch((error) => {
        console.error('❌ Error al registrar el Service Worker:', error);
      });
  });
}
