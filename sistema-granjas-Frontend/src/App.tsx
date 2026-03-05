import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuthValue } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import { syncPendingData } from './services/sync';
import { checkBackendConnection } from './api/auth';
import { Toaster } from 'react-hot-toast';
// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GestionGranjasPage from './pages/GestionGranjas';
import GestionProgramasPage from './pages/GestionProgramas';
import GestionLaboresPage from './pages/GestionLabores';
import GestionUsuariosPage from './pages/GestionUsuarios';
import GestionLotesPage from './pages/GestionLotes';
import GestionCultivosPage from './pages/GestionCultivos';
import GestionInventarioPage from './pages/GestionInventarios';
import GestionDiagnosticosPage from './pages/GestionDiagnosticos';
import GestionRecomendacionesPage from './pages/GestionRecomendaciones';

function AppContent() {
  const { token } = useAuthValue();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const handleOnline = async () => {
      const isBackendOnline = await checkBackendConnection();
      setBackendOnline(isBackendOnline);

      if (navigator.onLine && isBackendOnline && token) {
        try {
          await syncPendingData();
        } catch (error) {
          console.error('Error en sincronización:', error);
        }
      }
    };

    const handleOffline = () => {
      setBackendOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    handleOnline();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token]);

  const RedirectIfAuth = ({ children }: { children: JSX.Element }) => {
    if (token) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  return (
    <div className="App">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
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
        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />

        <Route path="/home" element={<Home />} />

        <Route
          path="/login"
          element={
            <RedirectIfAuth>
              <Login />
            </RedirectIfAuth>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Rutas para gestiones separadas */}
        <Route
          path="/gestion/granjas"
          element={
            <ProtectedRoute>
              <GestionGranjasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/programas/:programaId/lotes"
          element={
            <ProtectedRoute>
              <GestionLotesPage /> {/* Usamos el mismo componente, no uno nuevo */}
            </ProtectedRoute>
          }
        />

        <Route
          path="/gestion/programas"
          element={
            <ProtectedRoute>
              <GestionProgramasPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ NUEVA RUTA: Programas filtrados por granja */}
        <Route
          path="/granjas/:granjaId/programas"
          element={
            <ProtectedRoute>
              <GestionProgramasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gestion/labores"
          element={
            <ProtectedRoute>
              <GestionLaboresPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gestion/usuarios"
          element={
            <ProtectedRoute>
              <GestionUsuariosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gestion/lotes"
          element={
            <ProtectedRoute>
              <GestionLotesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gestion/cultivos"
          element={
            <ProtectedRoute>
              <GestionCultivosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gestion/inventario"
          element={
            <ProtectedRoute>
              <GestionInventarioPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gestion/recomendaciones"
          element={
            <ProtectedRoute>
              <GestionRecomendacionesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gestion/diagnosticos"
          element={
            <ProtectedRoute>
              <GestionDiagnosticosPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  const authValue = useAuthValue();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await checkBackendConnection();
      } catch (error) {
        console.error('Error verificando backend:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkBackend();
  }, []);

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
      <AuthContext.Provider value={authValue}>
        <AppContent />
      </AuthContext.Provider>
    </Router>
  );
}

export default App;