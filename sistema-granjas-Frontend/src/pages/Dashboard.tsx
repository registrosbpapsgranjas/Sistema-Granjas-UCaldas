// Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/Common/DashboardHeader';
import granjaService from '../services/granjaService';
import programaService from '../services/programaService';
import loteService from '../services/loteService';
import { normalizarArray } from '../utils/normalize';
import type { Granja, Programa, Lote } from '../types/granjaTypes';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    granjas: 0,
    programas: 0,
    lotes: 0,
    usuarios: 0
  });
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');

  useEffect(() => {
    cargarEstadisticas();
    
    // Obtener nombre del usuario del localStorage
    const user = localStorage.getItem('user');
    setNombreUsuario(user || 'Usuario');
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      
      const [granjasResp, programasResp, lotesResp] = await Promise.all([
        granjaService.obtenerGranjas().catch(() => []),
        programaService.obtenerProgramas().catch(() => []),
        loteService.obtenerLotes().catch(() => [])
      ]);

      setStats({
        granjas: normalizarArray(granjasResp).length,
        programas: normalizarArray(programasResp).length,
        lotes: normalizarArray(lotesResp).length,
        usuarios: 7 // Valor fijo por ahora
      });

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setError('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const irA = (ruta: string) => navigate(ruta);

  const ModuloCard = ({ 
    titulo, 
    descripcion, 
    icono, 
    color, 
    ruta,
    stats,
    features 
  }: { 
    titulo: string; 
    descripcion: string; 
    icono: string; 
    color: string; 
    ruta: string;
    stats?: string;
    features: string[];
  }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
      <div className={`h-2 ${color}`}></div>
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${color} bg-opacity-20 flex items-center justify-center`}>
            <i className={`fas fa-${icono} text-xl sm:text-2xl ${color.replace('bg-', 'text-')}`}></i>
          </div>
          {stats && (
            <span className="text-xs sm:text-sm bg-gray-100 text-gray-600 px-2 sm:px-3 py-1 rounded-full">
              {stats}
            </span>
          )}
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{titulo}</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4">{descripcion}</p>
        
        <div className="border-t border-gray-100 pt-4 mb-4 flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Funcionalidades:</p>
          <ul className="space-y-1 sm:space-y-2">
            {features.map((feature, idx) => (
              <li key={idx} className="text-xs sm:text-sm text-gray-600 flex items-start">
                <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5 text-xs"></i>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <button
          onClick={() => irA(ruta)}
          className={`mt-auto w-full ${color} text-white py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center font-medium text-sm sm:text-base`}
        >
          <span>Acceder al módulo</span>
          <i className="fas fa-arrow-right ml-2 text-xs sm:text-sm"></i>
        </button>
      </div>
    </div>
  );

  const FlujoItem = ({ numero, titulo, descripcion }: { numero: string; titulo: string; descripcion: string }) => (
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600">Cargando información del sistema...</p>
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 sm:mb-6 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Banner de bienvenida */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 text-white">
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
              <span className="font-semibold">{stats.lotes}</span> lotes
            </div>
          </div>
        </div>

        {/* Sección: ¿Qué es esta aplicación? */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <i className="fas fa-info-circle text-green-600 mr-2 sm:mr-3"></i>
            ¿Qué es el Sistema Granjas UCaldas?
          </h2>
          <p className="text-gray-700 text-sm sm:text-base lg:text-lg leading-relaxed">
            Es un sistema integral de gestión agrícola diseñado para la Universidad de Caldas 
            que permite administrar granjas, programas productivos, lotes y labores de manera 
            integrada. Conecta estudiantes, trabajadores y administradores en un ecosistema 
            colaborativo para optimizar la producción y el aprendizaje.
          </p>
        </div>

        {/* Módulos Principales */}
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
          <i className="fas fa-cubes text-green-600 mr-2 sm:mr-3"></i>
          Módulos del Sistema
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <ModuloCard
            titulo="Granjas"
            descripcion="Administra tus granjas, ubicaciones y configuración general"
            icono="warehouse"
            color="bg-blue-600"
            ruta="/gestion/granjas"
            stats={`${stats.granjas} activas`}
            features={[
              "Listado de granjas con información básica",
              "Crear, editar y eliminar granjas",
              "Ver programas asignados a cada granja",
              "Acceso rápido a programas e inventario"
            ]}
          />
          
          <ModuloCard
            titulo="Programas"
            descripcion="Gestiona programas agrícolas y pecuarios"
            icono="clipboard-list"
            color="bg-green-600"
            ruta="/gestion/programas"
            stats={`${stats.programas} registrados`}
            features={[
              "Programas agrícolas y pecuarios",
              "Filtrado por granja específica",
              "Asignación de usuarios a programas",
              "Asignación de granjas a programas",
              "Exportación a Excel"
            ]}
          />
          
          <ModuloCard
            titulo="Lotes"
            descripcion="Controla lotes de producción y seguimiento de cultivos"
            icono="tractor"
            color="bg-purple-600"
            ruta="/gestion/lotes"
            stats={`${stats.lotes} registrados`}
            features={[
              "Jerarquía: Granja → Programa → Lotes",
              "Tipos de lote configurables",
              "Cultivos asociados por granja",
              "Estados: Activo, Inactivo, Pendiente, Completado"
            ]}
          />
          
          <ModuloCard
            titulo="Usuarios"
            descripcion="Administra roles, permisos y acceso al sistema"
            icono="users"
            color="bg-amber-600"
            ruta="/gestion/usuarios"
            stats={`${stats.usuarios} usuarios`}
            features={[
              "Gestión de usuarios del sistema",
              "Asignación de roles",
              "Vinculación a granjas",
              "Vinculación a programas"
            ]}
          />
        </div>

        {/* Flujos de Trabajo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <i className="fas fa-diagram-project text-green-600 mr-2"></i>
              Flujo Jerárquico
            </h3>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg font-mono text-xs sm:text-sm mb-3 sm:mb-4">
              Granja → Programas → Lotes
            </div>
            <div className="space-y-3 sm:space-y-4">
              <FlujoItem 
                numero="1"
                titulo="Desde una granja"
                descripcion="Puedes ver todos sus programas asignados"
              />
              <FlujoItem 
                numero="2"
                titulo="Desde un programa"
                descripcion="Accedes a sus lotes de producción"
              />
              <FlujoItem 
                numero="3"
                titulo="Navegación contextual"
                descripcion="Botón 'Volver' que regresa al nivel anterior"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <i className="fas fa-link text-green-600 mr-2"></i>
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
          </div>
        </div>

        {/* Características Técnicas */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <i className="fas fa-cogs text-green-600 mr-2"></i>
            Características del Sistema
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center text-sm sm:text-base">
                <i className="fas fa-check-circle mr-2 text-green-500"></i>
                Filtrado Inteligente
              </h4>
              <ul className="space-y-1 text-xs sm:text-sm text-gray-600">
                <li>• Programas filtrados por granja</li>
                <li>• Lotes filtrados por programa</li>
                <li>• Cultivos filtrados por granja</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center text-sm sm:text-base">
                <i className="fas fa-check-circle mr-2 text-green-500"></i>
                Exportación de Datos
              </h4>
              <ul className="space-y-1 text-xs sm:text-sm text-gray-600">
                <li>• Exportar todos los programas a Excel</li>
                <li>• Exportar programas filtrados por granja</li>
                <li>• Nombres de archivo con fecha automática</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center text-sm sm:text-base">
                <i className="fas fa-check-circle mr-2 text-green-500"></i>
                Actualización en Tiempo Real
              </h4>
              <ul className="space-y-1 text-xs sm:text-sm text-gray-600">
                <li>• Relaciones visibles inmediatamente</li>
                <li>• Actualización automática tras cambios</li>
                <li>• UI reactiva a modificaciones</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Guía Rápida */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-3 sm:mb-4 flex items-center">
            <i className="fas fa-compass text-blue-600 mr-2"></i>
            Guía Rápida para Usuarios
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="font-semibold text-blue-700 mb-2 sm:mb-3 text-sm sm:text-base">Para Administradores</h4>
              <ol className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-blue-900 list-decimal list-inside">
                <li>Crear granjas</li>
                <li>Definir programas</li>
                <li>Asignar programas a granjas</li>
                <li>Gestionar usuarios y roles</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-700 mb-2 sm:mb-3 text-sm sm:text-base">Para Operarios</h4>
              <ol className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-blue-900 list-decimal list-inside">
                <li>Ver programas de sus granjas</li>
                <li>Gestionar lotes</li>
                <li>Registrar labores</li>
                <li>Consultar inventario</li>
              </ol>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-blue-200">
            <p className="text-xs sm:text-sm text-blue-700">
              <i className="fas fa-info-circle mr-1"></i>
              <strong>Navegación:</strong> Usa el menú superior para acceder a los módulos · 
              Botones de colores para acciones principales
            </p>
          </div>
        </div>

        {/* Tecnologías Utilizadas */}
        <div className="bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center">
            <i className="fas fa-code text-green-400 mr-2"></i>
            Tecnologías Utilizadas
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <span className="px-2 sm:px-3 py-1 bg-gray-700 rounded-full text-xs sm:text-sm">React 18</span>
            <span className="px-2 sm:px-3 py-1 bg-gray-700 rounded-full text-xs sm:text-sm">TypeScript</span>
            <span className="px-2 sm:px-3 py-1 bg-gray-700 rounded-full text-xs sm:text-sm">Tailwind CSS</span>
            <span className="px-2 sm:px-3 py-1 bg-gray-700 rounded-full text-xs sm:text-sm">React Router v6</span>
            <span className="px-2 sm:px-3 py-1 bg-gray-700 rounded-full text-xs sm:text-sm">Fetch API</span>
            <span className="px-2 sm:px-3 py-1 bg-gray-700 rounded-full text-xs sm:text-sm">React Hot Toast</span>
            <span className="px-2 sm:px-3 py-1 bg-gray-700 rounded-full text-xs sm:text-sm">Vite</span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">
            Sistema de Gestión Agrícola - Universidad de Caldas © 2026
          </p>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;