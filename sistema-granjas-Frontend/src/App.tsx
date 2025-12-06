import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuthValue } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import { syncPendingData } from './services/sync';
import { getToken, checkBackendConnection } from './api/auth';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GestionGranjasPage from './pages/GestionGranjas';
import GestionProgramasPage from './pages/GestionProgramas';
import GestionLaboresPage from './pages/GestionLabores';
import GestionUsuariosPage from './pages/GestionUsuarios';
import GestionLotesPage from './pages/GestionLotes'; // NUEVO IMPORT
import GestionCultivosPage from './pages/GestionCultivos';
import GestionInventarioPage from './pages/GestionInventarios';
import GestionDiagnosticosPage from './pages/GestionDiagnosticos';

function App() {
  const authValue = useAuthValue();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isOnline = await checkBackendConnection();
        setBackendOnline(isOnline);
      } catch (error) {
        setBackendOnline(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkBackend();
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      const isBackendOnline = await checkBackendConnection();
      setBackendOnline(isBackendOnline);

      if (navigator.onLine && isBackendOnline) {
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

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const RedirectIfAuth = ({ children }: { children: JSX.Element }) => {
    const token = getToken();
    if (token) return <Navigate to="/dashboard" replace />;
    return children;
  };

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
    <AuthContext.Provider value={authValue}>
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
            <Route path="/" element={
              getToken() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } />

            <Route path="/home" element={<Home />} />

            <Route path="/login" element={
              <RedirectIfAuth>
                <Login />
              </RedirectIfAuth>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Rutas para gestiones separadas */}
            <Route path="/gestion/granjas" element={
              <ProtectedRoute>
                <GestionGranjasPage />
              </ProtectedRoute>
            } />

            <Route path="/gestion/programas" element={
              <ProtectedRoute>
                <GestionProgramasPage />
              </ProtectedRoute>
            } />

            <Route path="/gestion/labores" element={
              <ProtectedRoute>
                <GestionLaboresPage />
              </ProtectedRoute>
            } />

            <Route path="/gestion/usuarios" element={
              <ProtectedRoute>
                <GestionUsuariosPage />
              </ProtectedRoute>
            } />

            {/* NUEVA RUTA PARA LOTES */}
            <Route path="/gestion/lotes" element={
              <ProtectedRoute>
                <GestionLotesPage />
              </ProtectedRoute>
            } />

            // Agregar en las rutas:
            <Route path="/gestion/cultivos" element={
              <ProtectedRoute>
                <GestionCultivosPage />
              </ProtectedRoute>
            } />
            <Route path="/gestion/inventario" element={
              <ProtectedRoute>
                <GestionInventarioPage />
              </ProtectedRoute>
            } />

            <Route path="/gestion/diagnosticos" element={<ProtectedRoute><GestionDiagnosticosPage /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;