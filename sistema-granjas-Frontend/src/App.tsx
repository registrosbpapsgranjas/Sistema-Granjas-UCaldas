import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuthValue } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import { syncPendingData } from './services/sync';
import { checkBackendConnection } from './api/auth';
import { Toaster } from 'react-hot-toast';
import AIChatbot from './components/AI/AIChatbot';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Módulos principales
import GestionGranjasPage from './pages/GestionGranjas';
import GestionProgramasPage from './pages/GestionProgramas';
import GestionLotesPage from './pages/GestionLotes';
import GestionCultivosPage from './pages/GestionCultivos';
import GestionPlantasPage from './pages/GestionPlantas';
import GestionLaboresPage from './pages/GestionLabores';
import GestionUsuariosPage from './pages/GestionUsuarios';
import GestionInventarioPage from './pages/GestionInventarioDinamico';
import GestionDiagnosticosPage from './pages/GestionDiagnosticos';
import GestionRecomendacionesPage from './pages/GestionRecomendaciones';
import GestionEstadisticasPage from './pages/GestionEstadisticas';
import LoteMapa from './components/Lotes/LoteMapa';
import TableroLaboresPage from './pages/TableroLaboresPage';

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
      <AIChatbot />

      {/* Banners de estado de conexión */}
      {!navigator.onLine && (
        <div className="bg-yellow-500 text-white text-center py-1.5 px-4 text-sm font-medium flex items-center justify-center gap-2">
          <i className="fas fa-wifi-slash text-xs"></i>
          Sin conexión a internet — trabajando en modo offline
        </div>
      )}

      {navigator.onLine && backendOnline === false && (
        <div className="bg-red-600 text-white text-center py-1.5 px-4 text-sm font-medium flex items-center justify-center gap-2">
          <i className="fas fa-exclamation-triangle text-xs"></i>
          Servidor no disponible — algunas funciones están limitadas
        </div>
      )}

      <Routes>
        {/* ===== RUTAS PÚBLICAS ===== */}
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

        {/* ===== RUTAS PROTEGIDAS ===== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ===== RUTAS DE GESTIÓN PRINCIPALES ===== */}

        {/* Granjas - Solo admin */}
        <Route
          path="/gestion/granjas"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <GestionGranjasPage />
            </ProtectedRoute>
          }
        />

        {/* Mapa de lote - Todos excepto talento_humano */}
        <Route
          path="/lotes/:loteId/mapa"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente', 'asesor', 'estudiante', 'trabajador']}>
              <LoteMapa />
            </ProtectedRoute>
          }
        />

        {/* Programas - Admin, docente, jefe_talento_humano */}
        <Route
          path="/gestion/programas"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente', 'jefe_talento_humano']}>
              <GestionProgramasPage />
            </ProtectedRoute>
          }
        />

        {/* Lotes - Admin, docente, trabajador, jefe_talento_humano */}
        <Route
          path="/gestion/lotes"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente', 'trabajador', 'jefe_talento_humano']}>
              <GestionLotesPage />
            </ProtectedRoute>
          }
        />

        {/* Cultivos - Admin, docente, jefe_talento_humano */}
        <Route
          path="/gestion/cultivos"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente', 'jefe_talento_humano']}>
              <GestionCultivosPage />
            </ProtectedRoute>
          }
        />

        {/* Plantas - Admin y docente */}
        <Route
          path="/gestion/plantas"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente']}>
              <GestionPlantasPage />
            </ProtectedRoute>
          }
        />

        {/* Tablero de labores - Admin, docente, talento_humano, jefe_talento_humano, trabajador */}
        <Route
          path="/tablero"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente', 'talento_humano', 'jefe_talento_humano', 'trabajador']}>
              <TableroLaboresPage />
            </ProtectedRoute>
          }
        />

        {/* Gestión de labores - Admin, docente, talento_humano, jefe_talento_humano, trabajador, asesor */}
        <Route
          path="/gestion/labores"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente', 'talento_humano', 'jefe_talento_humano', 'trabajador', 'asesor']}>
              <GestionLaboresPage />
            </ProtectedRoute>
          }
        />

        {/* Usuarios - Admin (todos), talento_humano y jefe_talento_humano (trabajadores) */}
        <Route
          path="/gestion/usuarios"
          element={
            <ProtectedRoute allowedRoles={['admin', 'talento_humano', 'jefe_talento_humano']}>
              <GestionUsuariosPage />
            </ProtectedRoute>
          }
        />

        {/* Inventario - Admin, docente, asesor */}
        <Route
          path="/gestion/inventario"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente', 'asesor']}>
              <GestionInventarioPage />
            </ProtectedRoute>
          }
        />

        {/* Diagnósticos - Admin, docente (ver), asesor (ver), estudiante (crear) */}
        <Route
          path="/gestion/diagnosticos"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente', 'asesor', 'estudiante']}>
              <GestionDiagnosticosPage />
            </ProtectedRoute>
          }
        />

        {/* Recomendaciones - Admin, docente (crear/aprobar), asesor (ver), estudiante (ver sus asociadas) */}
        <Route
          path="/gestion/recomendaciones"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente', 'asesor', 'estudiante']}>
              <GestionRecomendacionesPage />
            </ProtectedRoute>
          }
        />

        {/* Estadísticas - Admin y Docente */}
        <Route
          path="/gestion/estadisticas"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente']}>
              <GestionEstadisticasPage />
            </ProtectedRoute>
          }
        />

        {/* ===== RUTAS JERÁRQUICAS (Navegación contextual) ===== */}

        {/* Programas filtrados por granja */}
        <Route
          path="/granjas/:granjaId/programas"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente']}>
              <GestionProgramasPage />
            </ProtectedRoute>
          }
        />

        {/* Lotes de un programa específico */}
        <Route
          path="/granjas/:granjaId/programas/:programaId/lotes"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente', 'estudiante', 'trabajador']}>
              <GestionLotesPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta alternativa para lotes por programa (sin granja) */}
        <Route
          path="/programas/:programaId/lotes"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente', 'estudiante', 'trabajador']}>
              <GestionLotesPage />
            </ProtectedRoute>
          }
        />

        {/* Lotes filtrados por cultivo */}
        <Route
          path="/lotes"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente', 'trabajador']}>
              <GestionLotesPage />
            </ProtectedRoute>
          }
        />

        {/* Cultivos filtrados por programa */}
        <Route
          path="/gestion/cultivos"
          element={
            <ProtectedRoute allowedRoles={['admin', 'docente']}>
              <GestionCultivosPage />
            </ProtectedRoute>
          }
        />

        {/* ===== RUTA POR DEFECTO ===== */}
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