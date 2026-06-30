// Dashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/Common/DashboardHeader';
import { useAuth } from '../hooks/useAuth';
import granjaService from '../services/granjaService';
import programaService from '../services/programaService';
import loteService from '../services/loteService';
import cultivoService from '../services/cultivoService';
import { normalizarArray } from '../utils/normalize';

interface DashboardStats {
  granjas: number;
  programas: number;
  lotes: number;
  cultivos: number;
}

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

const getRoleLabel = (rol: string | undefined): string => {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    asesor: 'Asesor',
    docente: 'Docente',
    talento_humano: 'Talento Humano',
    estudiante: 'Estudiante',
    trabajador: 'Trabajador',
  };
  return labels[rol || ''] || 'Usuario';
};

const getRoleBadge = (rol: string | undefined) => {
  const config: Record<string, { bg: string; text: string; icon: string }> = {
    admin:          { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'fa-shield-alt' },
    asesor:         { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: 'fa-user-tie' },
    docente:        { bg: 'bg-green-100',  text: 'text-green-700',  icon: 'fa-chalkboard-teacher' },
    talento_humano: { bg: 'bg-red-100',    text: 'text-red-700',    icon: 'fa-users-cog' },
    estudiante:     { bg: 'bg-amber-100',  text: 'text-amber-700',  icon: 'fa-user-graduate' },
    trabajador:     { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'fa-hard-hat' },
  };
  return config[rol || ''] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'fa-user' };
};

// ── Capacidades del sistema por rol ────────────────────────────────────────────
interface RoleCapability {
  icon: string;
  color: string;
  title: string;
  description: string;
  path: string;
}

interface RoleProfile {
  headline: string;
  summary: string;
  capabilities: RoleCapability[];
}

const ROLE_PROFILES: Record<string, RoleProfile> = {
  admin: {
    headline: 'Control total del sistema',
    summary: 'Tienes acceso completo a todos los módulos. Puedes configurar el sistema, gestionar usuarios y supervisar toda la operación de las granjas.',
    capabilities: [
      { icon: 'fa-users', color: 'bg-purple-500', title: 'Gestión de usuarios', description: 'Crea, edita y asigna roles a todos los usuarios del sistema.', path: '/gestion/usuarios' },
      { icon: 'fa-warehouse', color: 'bg-blue-500', title: 'Granjas y programas', description: 'Administra granjas, programas agrícolas y la jerarquía completa de producción.', path: '/gestion/granjas' },
      { icon: 'fa-boxes', color: 'bg-amber-500', title: 'Inventario', description: 'Controla insumos, herramientas y productos disponibles en cada granja.', path: '/gestion/inventario' },
      { icon: 'fa-calendar-check', color: 'bg-teal-500', title: 'Labores y tablero', description: 'Planifica, asigna y hace seguimiento de todas las labores del campo.', path: '/gestion/labores' },
      { icon: 'fa-stethoscope', color: 'bg-green-500', title: 'Diagnósticos', description: 'Revisa y valida diagnósticos fitosanitarios emitidos por asesores y docentes.', path: '/gestion/diagnosticos' },
      { icon: 'fa-chart-bar', color: 'bg-rose-500', title: 'Estadísticas', description: 'Accede a reportes, gráficas y análisis del rendimiento de las granjas.', path: '/gestion/estadisticas' },
    ],
  },
  docente: {
    headline: 'Docencia y gestión técnica',
    summary: 'Puedes gestionar todo el ciclo técnico: desde los cultivos hasta los diagnósticos y recomendaciones. También supervisas labores, inventario y estadísticas de tus programas.',
    capabilities: [
      { icon: 'fa-stethoscope', color: 'bg-teal-500', title: 'Diagnósticos', description: 'Registra observaciones de campo y documenta el estado fitosanitario de los cultivos.', path: '/gestion/diagnosticos' },
      { icon: 'fa-lightbulb', color: 'bg-yellow-500', title: 'Recomendaciones', description: 'Emite recomendaciones técnicas con productos específicos para cada situación.', path: '/gestion/recomendaciones' },
      { icon: 'fa-chart-bar', color: 'bg-rose-500', title: 'Estadísticas', description: 'Consulta reportes, gráficas y análisis de diagnósticos de tus programas.', path: '/gestion/estadisticas' },
      { icon: 'fa-calendar-check', color: 'bg-green-500', title: 'Labores', description: 'Planifica y asigna actividades de campo al equipo de trabajadores.', path: '/gestion/labores' },
      { icon: 'fa-boxes', color: 'bg-amber-500', title: 'Inventario', description: 'Consulta y gestiona los insumos y herramientas disponibles para las labores.', path: '/gestion/inventario' },
      { icon: 'fa-tractor', color: 'bg-purple-500', title: 'Lotes y cultivos', description: 'Monitorea los lotes de producción y el avance de los cultivos registrados.', path: '/gestion/lotes' },
    ],
  },
  asesor: {
    headline: 'Asesoría técnica en campo',
    summary: 'Tu rol es apoyar el diagnóstico y dar recomendaciones técnicas. También puedes monitorear el avance de los programas y el estado de los lotes.',
    capabilities: [
      { icon: 'fa-stethoscope', color: 'bg-teal-500', title: 'Diagnósticos', description: 'Realiza diagnósticos fitosanitarios en los lotes y registra tus hallazgos.', path: '/gestion/diagnosticos' },
      { icon: 'fa-lightbulb', color: 'bg-yellow-500', title: 'Recomendaciones', description: 'Genera recomendaciones técnicas con productos y dosis para cada situación.', path: '/gestion/recomendaciones' },
      { icon: 'fa-tractor', color: 'bg-purple-500', title: 'Lotes', description: 'Consulta y navega por los lotes de producción asignados a tu zona.', path: '/gestion/lotes' },
      { icon: 'fa-calendar-check', color: 'bg-green-500', title: 'Labores', description: 'Revisa las labores programadas y su estado actual en campo.', path: '/gestion/labores' },
      { icon: 'fa-clipboard-list', color: 'bg-blue-500', title: 'Programas', description: 'Consulta los programas agrícolas activos y sus cronogramas.', path: '/gestion/programas' },
      { icon: 'fa-boxes', color: 'bg-amber-500', title: 'Inventario', description: 'Verifica la disponibilidad de insumos antes de emitir recomendaciones.', path: '/gestion/inventario' },
    ],
  },
  estudiante: {
    headline: 'Aprendizaje y práctica en campo',
    summary: 'Como estudiante puedes aplicar lo aprendido registrando diagnósticos y consultando recomendaciones técnicas. Todo lo que registres queda documentado.',
    capabilities: [
      { icon: 'fa-stethoscope', color: 'bg-teal-500', title: 'Diagnósticos', description: 'Registra tus observaciones de campo y practica la identificación de problemas fitosanitarios.', path: '/gestion/diagnosticos' },
      { icon: 'fa-lightbulb', color: 'bg-yellow-500', title: 'Recomendaciones', description: 'Consulta las recomendaciones técnicas emitidas por asesores y docentes.', path: '/gestion/recomendaciones' },
    ],
  },
  trabajador: {
    headline: 'Ejecución de labores en campo',
    summary: 'Tu espacio está centrado en las labores asignadas. Puedes ver las tareas pendientes, en progreso y completadas directamente desde el tablero.',
    capabilities: [
      { icon: 'fa-th-large', color: 'bg-orange-500', title: 'Mi tablero', description: 'Visualiza todas tus labores asignadas con estado, prioridad y fechas límite.', path: '/tablero' },
      { icon: 'fa-calendar-check', color: 'bg-green-500', title: 'Labores', description: 'Accede al detalle de cada labor: instrucciones, insumos necesarios y ubicación.', path: '/gestion/labores' },
    ],
  },
  talento_humano: {
    headline: 'Gestión del personal',
    summary: 'Tu función es coordinar el equipo de trabajo. Puedes asignar labores, registrar personal y hacer seguimiento de las actividades en campo.',
    capabilities: [
      { icon: 'fa-th-large', color: 'bg-orange-500', title: 'Tablero de labores', description: 'Visualiza el estado de todas las labores asignadas al personal.', path: '/tablero' },
      { icon: 'fa-calendar-check', color: 'bg-green-500', title: 'Asignar labores', description: 'Crea y asigna labores al personal trabajador según las necesidades del campo.', path: '/gestion/labores' },
      { icon: 'fa-users', color: 'bg-purple-500', title: 'Gestionar personal', description: 'Administra los usuarios trabajadores: crea cuentas y controla el acceso.', path: '/gestion/usuarios' },
    ],
  },
  jefe_talento_humano: {
    headline: 'Jefatura de Talento Humano',
    summary: 'Tienes acceso completo al personal y las labores de todas las granjas. Puedes asignar, supervisar y completar labores, gestionar usuarios y consultar programas y lotes.',
    capabilities: [
      { icon: 'fa-th-large', color: 'bg-orange-500', title: 'Tablero de labores', description: 'Visualiza el estado de todas las labores de todas las granjas.', path: '/tablero' },
      { icon: 'fa-calendar-check', color: 'bg-green-500', title: 'Labores', description: 'Crea, asigna y completa labores del personal en todas las granjas.', path: '/gestion/labores' },
      { icon: 'fa-users', color: 'bg-purple-500', title: 'Gestionar personal', description: 'Administra los usuarios trabajadores de todas las granjas.', path: '/gestion/usuarios' },
      { icon: 'fa-clipboard-list', color: 'bg-blue-500', title: 'Programas', description: 'Consulta los programas agrícolas activos.', path: '/gestion/programas' },
      { icon: 'fa-tractor', color: 'bg-yellow-500', title: 'Lotes', description: 'Navega por los lotes de todas las granjas.', path: '/gestion/lotes' },
      { icon: 'fa-leaf', color: 'bg-teal-500', title: 'Cultivos', description: 'Consulta los cultivos registrados en el sistema.', path: '/gestion/cultivos' },
    ],
  },
};

// ── Acciones rápidas por rol ───────────────────────────────────────────────────
interface QuickAction {
  label: string;
  icon: string;
  path: string;
  color: string;
}

const QUICK_ACTIONS: Record<string, QuickAction[]> = {
  admin:          [
    { label: 'Usuarios',      icon: 'fa-users',          path: '/gestion/usuarios',        color: 'bg-purple-500' },
    { label: 'Estadísticas',  icon: 'fa-chart-bar',      path: '/gestion/estadisticas',    color: 'bg-blue-500' },
    { label: 'Inventario',    icon: 'fa-boxes',          path: '/gestion/inventario',      color: 'bg-amber-500' },
    { label: 'Labores',       icon: 'fa-calendar-check', path: '/gestion/labores',         color: 'bg-teal-500' },
  ],
  docente:        [
    { label: 'Diagnóstico',     icon: 'fa-stethoscope',    path: '/gestion/diagnosticos',    color: 'bg-teal-500' },
    { label: 'Recomendación',   icon: 'fa-lightbulb',      path: '/gestion/recomendaciones', color: 'bg-yellow-500' },
    { label: 'Estadísticas',    icon: 'fa-chart-bar',      path: '/gestion/estadisticas',    color: 'bg-rose-500' },
    { label: 'Labores',         icon: 'fa-calendar-check', path: '/gestion/labores',         color: 'bg-green-500' },
  ],
  asesor:         [
    { label: 'Diagnóstico',     icon: 'fa-stethoscope',    path: '/gestion/diagnosticos',    color: 'bg-teal-500' },
    { label: 'Recomendación',   icon: 'fa-lightbulb',      path: '/gestion/recomendaciones', color: 'bg-yellow-500' },
    { label: 'Lotes',           icon: 'fa-tractor',        path: '/gestion/lotes',           color: 'bg-purple-500' },
    { label: 'Labores',         icon: 'fa-calendar-check', path: '/gestion/labores',         color: 'bg-green-500' },
  ],
  estudiante:     [
    { label: 'Diagnóstico',     icon: 'fa-stethoscope',    path: '/gestion/diagnosticos',    color: 'bg-teal-500' },
    { label: 'Recomendaciones', icon: 'fa-lightbulb',      path: '/gestion/recomendaciones', color: 'bg-yellow-500' },
  ],
  trabajador:     [
    { label: 'Mi tablero', icon: 'fa-th-large',        path: '/tablero',         color: 'bg-orange-500' },
    { label: 'Labores',    icon: 'fa-calendar-check',  path: '/gestion/labores', color: 'bg-green-500' },
  ],
  talento_humano: [
    { label: 'Tablero',   icon: 'fa-th-large',        path: '/tablero',           color: 'bg-orange-500' },
    { label: 'Labores',   icon: 'fa-calendar-check',  path: '/gestion/labores',   color: 'bg-green-500' },
    { label: 'Personal',  icon: 'fa-users',            path: '/gestion/usuarios',  color: 'bg-purple-500' },
  ],
  jefe_talento_humano: [
    { label: 'Tablero',   icon: 'fa-th-large',        path: '/tablero',           color: 'bg-orange-500' },
    { label: 'Labores',   icon: 'fa-calendar-check',  path: '/gestion/labores',   color: 'bg-green-500' },
    { label: 'Personal',  icon: 'fa-users',            path: '/gestion/usuarios',  color: 'bg-purple-500' },
    { label: 'Programas', icon: 'fa-clipboard-list',   path: '/gestion/programas', color: 'bg-blue-500' },
  ],
};

// ── Componente principal ───────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ granjas: 0, programas: 0, lotes: 0, cultivos: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 👇 DETERMINAR ROL Y PROGRAMAS DEL USUARIO
  const esAdmin = user?.rol_id === 1;
  const esDocente = user?.rol_id === 2 || user?.rol_id === 5;
  const programasUsuario = useMemo(
    () => user?.programas?.map((p: any) => p.id) || [],
    [user?.id, user?.programas]
  );

  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 👇 Si es docente, verificar si tiene programas asignados
      if (esDocente) {
        // 👇 Si NO tiene programas asignados, mostrar todo en 0
        if (programasUsuario.length === 0) {
          setStats({
            granjas: 0,
            programas: 0,
            lotes: 0,
            cultivos: 0,
          });
          setLoading(false);
          return;
        }

        // 👇 Si tiene programas, cargar datos filtrados
        const programasResponse = await programaService.obtenerProgramas();
        const todosProgramas = normalizarArray(programasResponse);
        const programasDocente = todosProgramas.filter((p: any) => 
          programasUsuario.includes(p.id)
        );
        
        // 👇 Obtener granjas de los programas del docente
        const granjasSet = new Set<number>();
        const lotesSet = new Set<number>();
        const cultivosSet = new Set<number>();

        for (const programa of programasDocente) {
          try {
            const lotesResponse = await loteService.obtenerLotesPorPrograma(programa.id);
            const lotesArray = normalizarArray(lotesResponse);
            
            lotesArray.forEach((lote: any) => {
              lotesSet.add(lote.id);
              if (lote.granja_id) granjasSet.add(lote.granja_id);
              if (lote.cultivos_ids && Array.isArray(lote.cultivos_ids)) {
                lote.cultivos_ids.forEach((cid: number) => cultivosSet.add(cid));
              }
            });
          } catch (error) {
            console.error(`Error cargando lotes del programa ${programa.id}:`, error);
          }
        }

        setStats({
          granjas: granjasSet.size,
          programas: programasDocente.length,
          lotes: lotesSet.size,
          cultivos: cultivosSet.size,
        });
      } else {
        // 👇 Admin y otros roles: cargar todos los datos
        const [granjasR, programasR, lotesR, cultivosR] = await Promise.allSettled([
          granjaService.obtenerGranjas(),
          programaService.obtenerProgramas(),
          loteService.obtenerLotes(),
          cultivoService.obtenerCultivos(),
        ]);
        const get = (r: PromiseSettledResult<any>) =>
          r.status === 'fulfilled' ? normalizarArray(r.value) : [];
        setStats({
          granjas: get(granjasR).length,
          programas: get(programasR).length,
          lotes: get(lotesR).length,
          cultivos: get(cultivosR).length,
        });
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      setError('No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, [esDocente, programasUsuario, esAdmin]);

  useEffect(() => { 
    if (user) {
      cargarEstadisticas(); 
    }
  }, [cargarEstadisticas, user]);

  const rol = user?.rol ?? '';
  const badge = getRoleBadge(rol);
  const quickActions = QUICK_ACTIONS[rol] ?? [];
  const roleProfile = ROLE_PROFILES[rol];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
            <i className="fas fa-exclamation-circle flex-shrink-0"></i>
            <span>{error}</span>
            <button onClick={cargarEstadisticas}
              className="ml-auto text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg font-medium transition-colors">
              Reintentar
            </button>
          </div>
        )}

        {/* ── Banner de bienvenida ─────────────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 sm:p-8 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-green-200 text-sm">{getGreeting()},</p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-0.5 leading-tight">
                {user?.nombre || 'Usuario'}
              </h1>
              <span className={`inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                <i className={`fas ${badge.icon} text-[10px]`}></i>
                {getRoleLabel(rol)}
              </span>
              {esDocente && programasUsuario.length > 0 && (
                <span className="inline-flex items-center gap-1.5 mt-2 ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                  <i className="fas fa-chalkboard-teacher"></i>
                  {programasUsuario.length} programa(s) asignado(s)
                </span>
              )}
              {esDocente && programasUsuario.length === 0 && (
                <span className="inline-flex items-center gap-1.5 mt-2 ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/30 text-white">
                  <i className="fas fa-exclamation-triangle"></i>
                  Sin programas asignados
                </span>
              )}
            </div>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { n: stats.granjas,   l: 'Granjas'   },
                { n: stats.programas, l: 'Programas' },
                { n: stats.lotes,     l: 'Lotes'     },
                { n: stats.cultivos,  l: 'Cultivos'  },
              ].map(({ n, l }) => (
                <div key={l} className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center min-w-[54px]">
                  <div className="text-xl font-bold">{n}</div>
                  <div className="text-green-100 text-[11px]">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Acciones rápidas ─────────────────────────────────────────────────── */}
        {quickActions.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fas fa-bolt text-amber-400"></i>
              Acciones rápidas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((a) => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className="flex items-center gap-3 bg-white border border-gray-200 hover:border-green-300 hover:shadow-sm rounded-xl p-4 text-left transition-all duration-200 group"
                >
                  <div className={`w-9 h-9 rounded-lg ${a.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <i className={`fas ${a.icon} text-white text-sm`}></i>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── ¿Qué puedo hacer? (por rol) ─────────────────────────────────────── */}
        {roleProfile && (
          <section>
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                <i className={`fas ${badge.icon} text-gray-400`}></i>
                ¿Qué puedo hacer con este sistema?
              </h2>
              <p className="text-lg font-bold text-gray-800">{roleProfile.headline}</p>
              <p className="text-sm text-gray-500 mt-1 max-w-2xl">{roleProfile.summary}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roleProfile.capabilities.map((cap) => (
                <button
                  key={cap.path}
                  onClick={() => navigate(cap.path)}
                  className="group bg-white border border-gray-200 hover:border-green-300 hover:shadow-md rounded-xl p-5 text-left transition-all duration-200 flex gap-4 items-start"
                >
                  <div className={`w-11 h-11 rounded-xl ${cap.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    <i className={`fas ${cap.icon} text-white text-lg`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-800 group-hover:text-green-700 transition-colors text-sm">
                        {cap.title}
                      </h3>
                      <i className="fas fa-arrow-right text-gray-300 group-hover:text-green-400 text-xs transition-colors flex-shrink-0"></i>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{cap.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Pie de página mínimo ─────────────────────────────────────────────── */}
        <div className="text-center text-xs text-gray-400 pb-4">
          Sistema de Granjas — Universidad de Caldas
        </div>

      </main>
    </div>
  );
};

export default React.memo(Dashboard);