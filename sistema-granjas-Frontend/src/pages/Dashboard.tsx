// Dashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/Common/DashboardHeader';
import granjaService from '../services/granjaService';
import programaService from '../services/programaService';
import loteService from '../services/loteService';
import cultivoService from '../services/cultivoService';
import { normalizarArray } from '../utils/normalize';
import type { Granja, Programa, Lote, Cultivo } from '../types/granjaTypes';

// Interfaces para tipado fuerte
interface DashboardStats {
  granjas: number;
  programas: number;
  lotes: number;
  cultivos: number;
  granjasActivas?: number;
  programasActivos?: number;
  lotesActivos?: number;
  cultivosActivos?: number;
}

interface ModuloCardProps {
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  ruta: string;
  stats?: string;
  features: string[];
  onClick?: () => void;
}

interface FlujoItemProps {
  numero: string;
  titulo: string;
  descripcion: string;
}

// Componente memoizado para evitar re-renderizados innecesarios
const ModuloCard: React.FC<ModuloCardProps> = React.memo(({ 
  titulo, 
  descripcion, 
  icono, 
  color, 
  ruta,
  stats,
  features,
  onClick 
}) => {
  const navigate = useNavigate();
  
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      navigate(ruta);
    }
  }, [navigate, ruta, onClick]);

  return (
    <article className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col group">
      <div className={`h-2 ${color}`}></div>
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        <header className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${color} bg-opacity-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <i className={`fas fa-${icono} text-xl sm:text-2xl ${color.replace('bg-', 'text-')}`} aria-hidden="true"></i>
          </div>
          {stats && (
            <span className="text-xs sm:text-sm bg-gray-100 text-gray-600 px-2 sm:px-3 py-1 rounded-full font-medium">
              {stats}
            </span>
          )}
        </header>
        
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{titulo}</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4">{descripcion}</p>
        
        <div className="border-t border-gray-100 pt-4 mb-4 flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Funcionalidades:
          </p>
          <ul className="space-y-1 sm:space-y-2">
            {features.map((feature, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-gray-600 flex items-start">
                <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5 text-xs flex-shrink-0" aria-hidden="true"></i>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <button
          onClick={handleClick}
          className={`mt-auto w-full ${color} text-white py-2.5 rounded-lg hover:opacity-90 transition-all duration-300 flex items-center justify-center font-medium text-sm sm:text-base group-hover:shadow-lg`}
          aria-label={`Acceder al módulo de ${titulo}`}
        >
          <span>Acceder al módulo</span>
          <i className="fas fa-arrow-right ml-2 text-xs sm:text-sm transition-transform group-hover:translate-x-1" aria-hidden="true"></i>
        </button>
      </div>
    </article>
  );
});

ModuloCard.displayName = 'ModuloCard';

const FlujoItem: React.FC<FlujoItemProps> = ({ numero, titulo, descripcion }) => (
  <div className="flex items-start space-x-3 sm:space-x-4">
    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm sm:text-base">
      {numero}
    </div>
    <div>
      <h4 className="font-semibold text-gray-800 text-sm sm:text-base">{titulo}</h4>
      <p className="text-xs sm:text-sm text-gray-600">{descripcion}</p>
    </div>
  </div>
);

// Hook personalizado para manejar estadísticas
const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    granjas: 0,
    programas: 0,
    lotes: 0,
    cultivos: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [granjasResp, programasResp, lotesResp, cultivosResp] = await Promise.allSettled([
        granjaService.obtenerGranjas(),
        programaService.obtenerProgramas(),
        loteService.obtenerLotes(),
        cultivoService.obtenerCultivos()
      ]);

      const obtenerValor = (result: PromiseSettledResult<any>): any[] => {
        return result.status === 'fulfilled' ? normalizarArray(result.value) : [];
      };

      const granjas = obtenerValor(granjasResp);
      const programas = obtenerValor(programasResp);
      const lotes = obtenerValor(lotesResp);
      const cultivos = obtenerValor(cultivosResp);

      setStats({
        granjas: granjas.length,
        programas: programas.length,
        lotes: lotes.length,
        cultivos: cultivos.length,
        granjasActivas: granjas.filter((g: Granja) => g.estado === 'activo').length,
        programasActivos: programas.filter((p: Programa) => p.estado === 'activo').length,
        lotesActivos: lotes.filter((l: Lote) => l.estado === 'activo').length,
        cultivosActivos: cultivos.filter((c: Cultivo) => c.estado === 'activo').length
      });

      // Verificar si hubo errores parciales
      const errores = [granjasResp, programasResp, lotesResp, cultivosResp]
        .filter(r => r.status === 'rejected');
      
      if (errores.length > 0) {
        console.warn(`${errores.length} servicio(s) fallaron al cargar`);
      }

    } catch (error) {
      console.error('Error crítico cargando estadísticas:', error);
      setError('Error al cargar la información del dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  return { stats, loading, error, refetch: cargarEstadisticas };
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { stats, loading, error, refetch } = useDashboardStats();
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');

  useEffect(() => {
    // Obtener nombre del usuario del localStorage de manera segura
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setNombreUsuario(userData.nombre || userData.email || 'Usuario');
      }
    } catch {
      setNombreUsuario(localStorage.getItem('user') || 'Usuario');
    }
  }, []);

  const irA = useCallback((ruta: string) => {
    navigate(ruta);
  }, [navigate]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Memoizar los módulos para evitar re-renderizados
  const modulos = useMemo(() => [
    {
      titulo: "Granjas",
      descripcion: "Administra tus granjas, ubicaciones y configuración general",
      icono: "warehouse",
      color: "bg-blue-600",
      ruta: "/gestion/granjas",
      stats: `${stats.granjas} ${stats.granjas === 1 ? 'activa' : 'activas'}`,
      features: [
        "Listado completo de granjas",
        "Gestión de ubicaciones y contacto",
        "Programas asignados por granja",
        "Acceso rápido a programas e inventario"
      ]
    },
    {
      titulo: "Programas",
      descripcion: "Gestiona programas agrícolas y pecuarios",
      icono: "clipboard-list",
      color: "bg-green-600",
      ruta: "/gestion/programas",
      stats: `${stats.programas} ${stats.programas === 1 ? 'registrado' : 'registrados'}`,
      features: [
        "Programas agrícolas y pecuarios",
        "Filtrado inteligente por granja",
        "Asignación de usuarios y granjas",
        "Exportación a Excel y reportes"
      ]
    },
    {
      titulo: "Lotes",
      descripcion: "Controla lotes de producción y seguimiento",
      icono: "tractor",
      color: "bg-purple-600",
      ruta: "/gestion/lotes",
      stats: `${stats.lotes} ${stats.lotes === 1 ? 'registrado' : 'registrados'}`,
      features: [
        "Jerarquía Granja → Programa → Lotes",
        "Múltiples tipos de lote",
        "Cultivos asociados",
        "Estados personalizables"
      ]
    },
    {
      titulo: "Cultivos",
      descripcion: "Gestiona cultivos, especies y variedades",
      icono: "leaf",
      color: "bg-amber-600",
      ruta: "/gestion/cultivos",
      stats: `${stats.cultivos} ${stats.cultivos === 1 ? 'registrado' : 'registrados'}`,
      features: [
        "Catálogo completo de cultivos",
        "Variedades por cultivo",
        "Ciclos de crecimiento",
        "Requerimientos de suelo y clima"
      ]
    }
  ], [stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center" role="status" aria-label="Cargando">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600 animate-pulse">
              Cargando información del sistema...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-center justify-between" role="alert">
            <div className="flex items-center">
              <i className="fas fa-exclamation-circle text-red-500 mr-3 text-xl"></i>
              <span className="text-sm sm:text-base">{error}</span>
            </div>
            <button 
              onClick={handleRetry}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Banner de bienvenida */}
        <section className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 text-white">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">
            ¡Bienvenido, {nombreUsuario}! 👋
          </h1>
          <p className="text-green-100 text-sm sm:text-base lg:text-lg max-w-3xl">
            Sistema de Gestión Agrícola - Universidad de Caldas
          </p>
          <div className="mt-3 sm:mt-4 flex flex-wrap gap-3 sm:gap-4">
            <div className="bg-green-500 bg-opacity-30 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base">
              <span className="font-semibold">{stats.granjas}</span> granjas ·{' '}
              <span className="font-semibold">{stats.programas}</span> programas ·{' '}
              <span className="font-semibold">{stats.lotes}</span> lotes ·{' '}
              <span className="font-semibold">{stats.cultivos}</span> cultivos
            </div>
            {stats.granjasActivos !== undefined && (
              <div className="bg-green-500 bg-opacity-30 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm lg:text-base">
                <span className="font-semibold">{stats.granjasActivos}</span> activas
              </div>
            )}
          </div>
        </section>

        {/* Sección: ¿Qué es esta aplicación? */}
        <section className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <i className="fas fa-info-circle text-green-600 mr-2 sm:mr-3" aria-hidden="true"></i>
            ¿Qué es el Sistema Granjas UCaldas?
          </h2>
          <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
            Es un sistema integral de gestión agrícola diseñado para la Universidad de Caldas 
            que permite administrar granjas, programas productivos, lotes y labores de manera 
            integrada. Conecta estudiantes, trabajadores y administradores en un ecosistema 
            colaborativo para optimizar la producción y el aprendizaje.
          </p>
        </section>

        {/* Módulos Principales */}
        <section>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
            <i className="fas fa-cubes text-green-600 mr-2 sm:mr-3" aria-hidden="true"></i>
            Módulos del Sistema
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {modulos.map((modulo, index) => (
              <ModuloCard
                key={index}
                {...modulo}
                onClick={() => irA(modulo.ruta)}
              />
            ))}
          </div>
        </section>

        {/* Flujos de Trabajo */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <article className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <i className="fas fa-diagram-project text-green-600 mr-2" aria-hidden="true"></i>
              Flujo Jerárquico
            </h3>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg font-mono text-xs sm:text-sm mb-3 sm:mb-4 border border-gray-200">
              Granja → Programas → Lotes
            </div>
            <div className="space-y-3 sm:space-y-4">
              <FlujoItem 
                numero="1"
                titulo="Desde una granja"
                descripcion="Visualiza todos sus programas asignados"
              />
              <FlujoItem 
                numero="2"
                titulo="Desde un programa"
                descripcion="Accede a sus lotes de producción"
              />
              <FlujoItem 
                numero="3"
                titulo="Navegación contextual"
                descripcion="Botón 'Volver' que regresa al nivel anterior"
              />
            </div>
          </article>

          <article className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <i className="fas fa-link text-green-600 mr-2" aria-hidden="true"></i>
              Asignaciones
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <FlujoItem 
                numero="•"
                titulo="Programas ↔ Granjas"
                descripcion="Relación muchos a muchos entre programas y granjas"
              />
              <FlujoItem 
                numero="•"
                titulo="Usuarios ↔ Programas"
                descripcion="Usuarios asignados a programas específicos"
              />
              <FlujoItem 
                numero="•"
                titulo="Lotes ↔ Programas"
                descripcion="Cada lote pertenece a un programa específico"
              />
            </div>
          </article>
        </section>

        {/* Características Técnicas */}
        <section className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <i className="fas fa-cogs text-green-600 mr-2" aria-hidden="true"></i>
            Características del Sistema
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-3 flex items-center text-sm sm:text-base">
                <i className="fas fa-filter mr-2 text-green-500" aria-hidden="true"></i>
                Filtrado Inteligente
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Programas filtrados por granja
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Lotes filtrados por programa
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Cultivos filtrados por programa
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-700 mb-3 flex items-center text-sm sm:text-base">
                <i className="fas fa-sync-alt mr-2 text-green-500" aria-hidden="true"></i>
                Actualización en Tiempo Real
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Relaciones visibles inmediatamente
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  UI reactiva a modificaciones
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Cache optimizado
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-green-700 mb-3 flex items-center text-sm sm:text-base">
                <i className="fas fa-shield-alt mr-2 text-green-500" aria-hidden="true"></i>
                Seguridad y Control
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Roles y permisos granulares
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Auditoría de acciones
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Respaldos automáticos
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Atajo rápido */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Volver arriba"
          >
            <i className="fas fa-arrow-up"></i>
          </button>
        </div>
      </main>
    </div>
  );
};

export default React.memo(Dashboard);