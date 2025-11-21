// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { syncPendingData } from './services/sync';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { getToken, checkBackendConnection } from './api/auth';

function App() {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // === Verificar estado del backend ===
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isOnline = await checkBackendConnection();
        console.log("Marlon isOn", isOnline);
        setBackendOnline(isOnline);
        console.log(`🌐 Backend: ${isOnline ? 'Conectado' : 'Desconectado'}`);
      } catch (error) {
        setBackendOnline(false);
        console.warn('❌ No se pudo verificar el backend:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkBackend();
  }, []);

  // === Manejo de sincronización offline ===
  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 Conexión restablecida. Iniciando sincronización...');
      setBackendOnline(await checkBackendConnection());

      // Solo sincronizar si el backend está disponible
      if (navigator.onLine && backendOnline) {
        try {
          await syncPendingData();
          console.log('✅ Sincronización completada');
        } catch (error) {
          console.error('❌ Error en sincronización:', error);
        }
      }
    };

    const handleOffline = () => {
      console.log('🔴 Sin conexión a internet');
      setBackendOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [backendOnline]);

  // === Componente para proteger rutas ===
  const RequireAuth = ({ children }: { children: JSX.Element }) => {
    const token = getToken();

    if (!token) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  // === Componente para redirigir si ya está autenticado ===
  const RedirectIfAuth = ({ children }: { children: JSX.Element }) => {
    const token = getToken();

    if (token) {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  };

  // === Mostrar loading mientras verifica el backend ===
  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-800 font-medium">Verificando conexión...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {/* Banner de estado del sistema */}
        {!navigator.onLine && (
          <div className="bg-yellow-600 text-white text-center py-2 px-4">
            ⚠️ Estás trabajando sin conexión a internet
          </div>
        )}

        {navigator.onLine && backendOnline === false && (
          <div className="bg-red-600 text-white text-center py-2 px-4">
            ❌ Backend no disponible. Usando modo offline.
          </div>
        )}

        {navigator.onLine && backendOnline && (
          <div className="bg-green-600 text-white text-center py-2 px-4">
            ✅ Sistema conectado y funcionando
          </div>
        )}

        <Routes>
          {/* Página principal → redirige según sesión */}
          <Route
            path="/"
            element={
              getToken() ?
                <Navigate to="/dashboard" replace /> :
                <Navigate to="/login" replace />
            }
          />

          {/* Login - solo accesible si NO está autenticado */}
          <Route
            path="/login"
            element={
              <RedirectIfAuth>
                <Login />
              </RedirectIfAuth>
            }
          />

          {/* Dashboard protegido - solo accesible si ESTÁ autenticado */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />

          {/* Ruta 404 - redirige a la página principal */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;