import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import DashboardHeader from '../components/Common/DashboardHeader';
import Sidebar from '../components/Common/SideBar';
import granjaService from '../services/granjaService';
import programaService from '../services/programaService';
import loteService from '../services/loteService';
import usuarioService from '../services/usuarioService';
import laboresService from '../services/laboresService';
import { normalizarArray } from '../utils/normalize';
import type { Labor, Usuario, Lote, Granja, Programa } from '../types/granjaTypes';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#8A2BE2'];

// Interfaces
interface MetricasPrincipales {
  totalGranjas: number;
  totalProgramas: number;
  totalLotes: number;
  totalUsuarios: number;
  lotesActivos: number;
  programasActivos: number;
}

interface LaboresPorDia {
  fecha: string;
  cantidad: number;
}

interface UsuarioPorRol {
  name: string;
  value: number;
}

interface ProgramaPorTipo {
  name: string;
  value: number;
  color: string;
}

interface ResumenLotes {
  total: number;
  activos: number;
  inactivos: number;
  completados: number;
  enProduccion: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para datos
  const [metricas, setMetricas] = useState<MetricasPrincipales>({
    totalGranjas: 0,
    totalProgramas: 0,
    totalLotes: 0,
    totalUsuarios: 0,
    lotesActivos: 0,
    programasActivos: 0
  });
  
  const [laboresPorDia, setLaboresPorDia] = useState<LaboresPorDia[]>([]);
  const [usuariosPorRol, setUsuariosPorRol] = useState<UsuarioPorRol[]>([]);
  const [programasPorTipo, setProgramasPorTipo] = useState<ProgramaPorTipo[]>([]);
  const [proximasLabores, setProximasLabores] = useState<Labor[]>([]);
  const [resumenLotes, setResumenLotes] = useState<ResumenLotes>({ 
    total: 0, 
    activos: 0, 
    inactivos: 0, 
    completados: 0,
    enProduccion: 0 
  });
  const [granjasRecientes, setGranjasRecientes] = useState<Granja[]>([]);
  const [programasRecientes, setProgramasRecientes] = useState<Programa[]>([]);

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const cargarDatosDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ejecutar todas las peticiones en paralelo
      const [
        granjasResp,
        programasResp,
        lotesResp,
        usuariosResp,
        laboresResp
      ] = await Promise.all([
        granjaService.obtenerGranjas().catch(() => []),
        programaService.obtenerProgramas().catch(() => []),
        loteService.obtenerLotes().catch(() => []),
        usuarioService.obtenerUsuarios().catch(() => []),
        laboresService.obtenerLabores().catch(() => ({}))
      ]);

      // Normalizar datos
      const granjas = normalizarArray<Granja>(granjasResp);
      const programas = normalizarArray<Programa>(programasResp);
      const lotes = normalizarArray<Lote>(lotesResp);
      const usuarios = normalizarArray<Usuario>(usuariosResp);
      
      // Procesar labores (pueden venir en diferentes formatos)
      const labores = Array.isArray(laboresResp) 
        ? laboresResp 
        : (laboresResp?.items || []);

      // ===== 1. MÉTRICAS PRINCIPALES =====
      setMetricas({
        totalGranjas: granjas.length,
        totalProgramas: programas.length,
        totalLotes: lotes.length,
        totalUsuarios: usuarios.length,
        lotesActivos: lotes.filter(l => l.estado === 'activo').length,
        programasActivos: programas.filter(p => p.activo).length
      });

      // ===== 2. GRÁFICO DE LABORES POR DÍA =====
      const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        return fecha.toISOString().split('T')[0];
      }).reverse();

      const conteoPorDia = ultimos7Dias.map(fecha => ({
        fecha: new Date(fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        cantidad: labores.filter((l: Labor) => l.fecha_asignacion?.startsWith(fecha)).length
      }));
      setLaboresPorDia(conteoPorDia);

      // ===== 3. PRÓXIMAS LABORES =====
      const hoy = new Date().toISOString().split('T')[0];
      const futuras = labores
        .filter((l: Labor) => l.fecha_asignacion && l.fecha_asignacion >= hoy)
        .sort((a: Labor, b: Labor) => (a.fecha_asignacion || '').localeCompare(b.fecha_asignacion || ''))
        .slice(0, 5);
      setProximasLabores(futuras);

      // ===== 4. USUARIOS POR ROL =====
      const rolesMap = new Map<string, number>();
      usuarios.forEach(u => {
        const rol = u.rol || 'Sin rol';
        rolesMap.set(rol, (rolesMap.get(rol) || 0) + 1);
      });
      const rolesData = Array.from(rolesMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      setUsuariosPorRol(rolesData);

      // ===== 5. PROGRAMAS POR TIPO =====
      const agricolas = programas.filter(p => p.tipo === 'agricola').length;
      const pecuarios = programas.filter(p => p.tipo === 'pecuario').length;
      setProgramasPorTipo([
        { name: 'Agrícolas', value: agricolas, color: '#10b981' },
        { name: 'Pecuarios', value: pecuarios, color: '#f59e0b' }
      ]);

      // ===== 6. RESUMEN DE LOTES =====
      setResumenLotes({
        total: lotes.length,
        activos: lotes.filter((l: Lote) => l.estado === 'activo').length,
        inactivos: lotes.filter((l: Lote) => l.estado === 'inactivo').length,
        completados: lotes.filter((l: Lote) => l.estado === 'completado').length,
        enProduccion: lotes.filter((l: Lote) => l.etapa === 'produccion').length,
      });

      // ===== 7. GRANJAS Y PROGRAMAS RECIENTES =====
      setGranjasRecientes(granjas.slice(0, 3));
      setProgramasRecientes(programas.slice(0, 3));

    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const irA = (ruta: string) => navigate(ruta);

  // Cards de métricas rápidas
  const MetricCard = ({ 
    icon, 
    color, 
    value, 
    label, 
    onClick 
  }: { 
    icon: string; 
    color: string; 
    value: number; 
    label: string; 
    onClick?: () => void;
  }) => (
    <div 
      className={`bg-white rounded-lg shadow p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
          <i className={`fas fa-${icon} text-white text-xl`}></i>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 p-8">
            <div className="animate-pulse space-y-6">
              {/* Skeleton de métricas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
              {/* Skeleton de gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1,2].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          {/* Header con título y actualizar */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <button
              onClick={cargarDatosDashboard}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Actualizar
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-800 hover:text-red-900">
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          {/* Banner de bienvenida */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-8 mb-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Bienvenido al Sistema Granjas UCaldas</h1>
            <p className="text-green-100 text-lg">
              Gestiona tus granjas, programas, lotes y labores de manera eficiente
            </p>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              icon="warehouse"
              color="bg-blue-600"
              value={metricas.totalGranjas}
              label="Granjas"
              onClick={() => irA('/gestion/granjas')}
            />
            <MetricCard
              icon="clipboard-list"
              color="bg-green-600"
              value={metricas.totalProgramas}
              label="Programas"
              onClick={() => irA('/gestion/programas')}
            />
            <MetricCard
              icon="tractor"
              color="bg-purple-600"
              value={metricas.totalLotes}
              label="Lotes"
              onClick={() => irA('/lotes')}
            />
            <MetricCard
              icon="users"
              color="bg-amber-600"
              value={metricas.totalUsuarios}
              label="Usuarios"
              onClick={() => irA('/gestion/usuarios')}
            />
          </div>

          {/* Segunda fila de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Estado de Programas</h3>
              <div className="flex justify-around">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metricas.programasActivos}</div>
                  <div className="text-sm text-gray-500">Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">{metricas.totalProgramas - metricas.programasActivos}</div>
                  <div className="text-sm text-gray-500">Inactivos</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Estado de Lotes</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xl font-bold text-green-600">{resumenLotes.activos}</div>
                  <div className="text-xs text-gray-500">Activos</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-yellow-600">{resumenLotes.enProduccion}</div>
                  <div className="text-xs text-gray-500">Producción</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-600">{resumenLotes.completados}</div>
                  <div className="text-xs text-gray-500">Completados</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Distribución de Programas</h3>
              <div className="flex justify-around">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{programasPorTipo[0]?.value || 0}</div>
                  <div className="text-sm text-gray-500">Agrícolas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{programasPorTipo[1]?.value || 0}</div>
                  <div className="text-sm text-gray-500">Pecuarios</div>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de labores por día */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-chart-line text-green-500 mr-2"></i>
                Labores por día (últimos 7 días)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={laboresPorDia} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cantidad" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de usuarios por rol */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-users text-blue-500 mr-2"></i>
                Usuarios por rol
              </h2>
              {usuariosPorRol.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={usuariosPorRol}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {usuariosPorRol.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No hay datos de usuarios
                </div>
              )}
            </div>
          </div>

          {/* Segunda fila de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Próximas labores */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-calendar-alt text-orange-500 mr-2"></i>
                Próximas labores
              </h2>
              {proximasLabores.length > 0 ? (
                <ul className="space-y-3">
                  {proximasLabores.map((labor, idx) => (
                    <li key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <span className="font-medium">{labor.nombre || 'Labor sin nombre'}</span>
                        <p className="text-xs text-gray-500 mt-1">{labor.descripcion || ''}</p>
                      </div>
                      <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        {new Date(labor.fecha_asignacion!).toLocaleDateString('es-ES')}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  No hay labores programadas
                </div>
              )}
              <button
                onClick={() => irA('/labores')}
                className="mt-4 w-full bg-orange-50 text-orange-600 hover:bg-orange-100 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <i className="fas fa-calendar-plus mr-2"></i>
                Gestionar labores
              </button>
            </div>

            {/* Granjas recientes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-warehouse text-green-500 mr-2"></i>
                Granjas recientes
              </h2>
              {granjasRecientes.length > 0 ? (
                <ul className="space-y-3">
                  {granjasRecientes.map((granja) => (
                    <li key={granja.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <span className="font-medium">{granja.nombre}</span>
                        <p className="text-xs text-gray-500 mt-1">{granja.ubicacion || 'Sin ubicación'}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        granja.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {granja.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  No hay granjas registradas
                </div>
              )}
              <button
                onClick={() => irA('/gestion/granjas')}
                className="mt-4 w-full bg-green-50 text-green-600 hover:bg-green-100 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <i className="fas fa-plus-circle mr-2"></i>
                Ver todas las granjas
              </button>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-rocket text-purple-500 mr-2"></i>
                Acciones rápidas
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => irA('/gestion/granjas/nueva')}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-left p-3 rounded-lg flex items-center transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                    <i className="fas fa-plus"></i>
                  </div>
                  <div>
                    <span className="font-medium">Nueva granja</span>
                    <p className="text-xs text-gray-500">Agregar una nueva granja al sistema</p>
                  </div>
                </button>

                <button
                  onClick={() => irA('/gestion/programas/nuevo')}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-left p-3 rounded-lg flex items-center transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                    <i className="fas fa-plus"></i>
                  </div>
                  <div>
                    <span className="font-medium">Nuevo programa</span>
                    <p className="text-xs text-gray-500">Crear un programa agrícola o pecuario</p>
                  </div>
                </button>

                <button
                  onClick={() => irA('/lotes/nuevo')}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-left p-3 rounded-lg flex items-center transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                    <i className="fas fa-plus"></i>
                  </div>
                  <div>
                    <span className="font-medium">Nuevo lote</span>
                    <p className="text-xs text-gray-500">Registrar un nuevo lote de producción</p>
                  </div>
                </button>

                <button
                  onClick={() => irA('/labores/nueva')}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-left p-3 rounded-lg flex items-center transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-3 group-hover:bg-orange-200 transition-colors">
                    <i className="fas fa-plus"></i>
                  </div>
                  <div>
                    <span className="font-medium">Asignar labor</span>
                    <p className="text-xs text-gray-500">Programar una nueva labor agrícola</p>
                  </div>
                </button>

                <button
                  onClick={() => irA('/reportes')}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-left p-3 rounded-lg flex items-center transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                    <i className="fas fa-file-pdf"></i>
                  </div>
                  <div>
                    <span className="font-medium">Generar reporte</span>
                    <p className="text-xs text-gray-500">Exportar informes del sistema</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 flex items-start">
            <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5"></i>
            <div>
              <strong>Datos actualizados en tiempo real.</strong> Los gráficos reflejan la información actual de la base de datos. 
              {metricas.totalGranjas === 0 && " Comienza agregando tu primera granja."}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;