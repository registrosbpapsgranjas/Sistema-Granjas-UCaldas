import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Activity, Leaf, AlertTriangle, TrendingUp, CheckCircle, ClipboardList } from 'lucide-react';
import DashboardHeader from '../components/Common/DashboardHeader';
import { api } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#E74C3C', '#16A085', '#D35400'];

interface Programa {
  id: number;
  nombre: string;
}

interface EstadDiagnosticos {
  total: number;
  por_monitoreo: Record<string, number>;
  por_lote: Record<string, number>;
  por_tipo: Record<string, number>;
  por_programa: Record<string, number>;
}

interface EstadLabores {
  total: number;
  pendientes: number;
  en_progreso: number;
  completadas: number;
  canceladas: number;
  promedio_avance: number;
}

interface EstadRecomendaciones {
  total: number;
  pendientes: number;
  aprobadas: number;
  en_ejecucion: number;
  completadas: number;
  canceladas: number;
  por_tipo: Record<string, number>;
}

type Tab = 'general' | 'diagnosticos' | 'labores' | 'recomendaciones';

const toChartData = (record: Record<string, number>) =>
  Object.entries(record).map(([name, value]) => ({ name, value }));

const KpiCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color?: string }> = ({
  label, value, icon, color = 'text-blue-600'
}) => (
  <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
    {icon}
  </div>
);

const GestionEstadisticasPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('general');
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [programaId, setProgramaId] = useState<number | ''>('');
  const [loadingProgs, setLoadingProgs] = useState(true);

  const [estadDiag, setEstatDiag] = useState<EstadDiagnosticos | null>(null);
  const [estadLab, setEstatLab] = useState<EstadLabores | null>(null);
  const [estadRec, setEstatRec] = useState<EstadRecomendaciones | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/programas').then(res => {
      const data = res.data;
      setProgramas(Array.isArray(data) ? data : (data?.items || []));
    }).catch(() => {}).finally(() => setLoadingProgs(false));
  }, []);

  const cargarEstadisticas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = programaId ? `?programa_id=${programaId}` : '';
      const [diagRes, labRes, recRes] = await Promise.all([
        api.get(`/diagnosticos/estadisticas/resumen${params}`),
        api.get(`/labores/estadisticas/resumen`),
        api.get(`/recomendaciones/estadisticas/resumen`),
      ]);
      setEstatDiag(diagRes.data);
      setEstatLab(labRes.data);
      setEstatRec(recRes.data);
    } catch (e: any) {
      setError('No se pudieron cargar las estadísticas. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  }, [programaId]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'diagnosticos', label: 'Diagnósticos' },
    { key: 'labores', label: 'Labores' },
    { key: 'recomendaciones', label: 'Recomendaciones' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        title="Estadísticas de Monitoreo"
        selectedModule="estadisticas"
        onBack={() => window.history.back()}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                Dashboard de Monitoreo
              </h1>
              <p className="text-gray-600 mt-1">Estadísticas en tiempo real del sistema</p>
            </div>

            {/* Selector de programa */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtrar por programa:</label>
              {loadingProgs ? (
                <div className="border rounded-lg px-4 py-2 text-sm text-gray-400">Cargando...</div>
              ) : (
                <select
                  value={programaId}
                  onChange={e => setProgramaId(e.target.value ? parseInt(e.target.value) : '')}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Todos los programas</option>
                  {programas.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              )}
              <button
                onClick={cargarEstadisticas}
                disabled={loading}
                className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync'} mr-1`}></i>
                Actualizar
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && !estadDiag && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          )}

          {!loading || estadDiag ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KpiCard
                  label="Total Diagnósticos"
                  value={estadDiag?.total ?? '—'}
                  icon={<Activity className="w-10 h-10 text-blue-400" />}
                  color="text-blue-700"
                />
                <KpiCard
                  label="Labores Completadas"
                  value={estadLab?.completadas ?? '—'}
                  icon={<CheckCircle className="w-10 h-10 text-green-400" />}
                  color="text-green-700"
                />
                <KpiCard
                  label="Labores Pendientes"
                  value={estadLab?.pendientes ?? '—'}
                  icon={<ClipboardList className="w-10 h-10 text-yellow-400" />}
                  color="text-yellow-700"
                />
                <KpiCard
                  label="Recomendaciones"
                  value={estadRec?.total ?? '—'}
                  icon={<Leaf className="w-10 h-10 text-purple-400" />}
                  color="text-purple-700"
                />
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      tab === t.key ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              {tab === 'general' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Diagnósticos por monitoreo */}
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Diagnósticos por tipo de monitoreo</h3>
                      {estadDiag && Object.keys(estadDiag.por_monitoreo || {}).length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={toChartData(estadDiag.por_monitoreo)}
                              dataKey="value" nameKey="name"
                              cx="50%" cy="50%" outerRadius={100} label
                            >
                              {toChartData(estadDiag.por_monitoreo).map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400">Sin datos</div>
                      )}
                    </div>

                    {/* Estado de labores */}
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Estado de labores</h3>
                      {estadLab ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={[
                            { name: 'Pendientes', value: estadLab.pendientes },
                            { name: 'En Progreso', value: estadLab.en_progreso },
                            { name: 'Completadas', value: estadLab.completadas },
                            { name: 'Canceladas', value: estadLab.canceladas },
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#4ade80" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400">Sin datos</div>
                      )}
                    </div>
                  </div>

                  {/* Tabla resumen */}
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Resumen General</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-700">{estadDiag?.total ?? 0}</p>
                        <p className="text-sm text-gray-600">Diagnósticos totales</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-3xl font-bold text-green-700">{estadLab?.completadas ?? 0}</p>
                        <p className="text-sm text-gray-600">Labores completadas</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-3xl font-bold text-yellow-700">{estadRec?.aprobadas ?? 0}</p>
                        <p className="text-sm text-gray-600">Recomendaciones aprobadas</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-3xl font-bold text-purple-700">
                          {estadLab?.promedio_avance != null ? `${estadLab.promedio_avance}%` : '—'}
                        </p>
                        <p className="text-sm text-gray-600">Avance promedio labores</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'diagnosticos' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Por tipo de monitoreo */}
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Por tipo de monitoreo (dinámico)</h3>
                      {estadDiag && Object.keys(estadDiag.por_monitoreo || {}).length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={toChartData(estadDiag.por_monitoreo)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400">Sin datos</div>
                      )}
                    </div>

                    {/* Por lote */}
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Por lote</h3>
                      {estadDiag && Object.keys(estadDiag.por_lote || {}).length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={toChartData(estadDiag.por_lote)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#10B981" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400">Sin datos</div>
                      )}
                    </div>
                  </div>

                  {/* Por programa */}
                  {!programaId && estadDiag && Object.keys(estadDiag.por_programa || {}).length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Por programa</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={toChartData(estadDiag.por_programa)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8B5CF6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Lista por monitoreo */}
                  {estadDiag && (
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Detalle por tipo de monitoreo</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Tipo de Monitoreo</th>
                              <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Diagnósticos</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(estadDiag.por_monitoreo || {}).map(([tipo, count]) => (
                              <tr key={tipo} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">{tipo}</td>
                                <td className="px-4 py-3 text-right text-blue-700 font-semibold">{count}</td>
                              </tr>
                            ))}
                            {Object.keys(estadDiag.por_monitoreo || {}).length === 0 && (
                              <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-400">Sin diagnósticos registrados</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'labores' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-yellow-700">{estadLab?.pendientes ?? 0}</p>
                      <p className="text-sm text-gray-600">Pendientes</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-blue-700">{estadLab?.en_progreso ?? 0}</p>
                      <p className="text-sm text-gray-600">En Progreso</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-green-700">{estadLab?.completadas ?? 0}</p>
                      <p className="text-sm text-gray-600">Completadas</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-red-700">{estadLab?.canceladas ?? 0}</p>
                      <p className="text-sm text-gray-600">Canceladas</p>
                    </div>
                  </div>

                  {estadLab && (
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Distribución de labores</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Pendientes', value: estadLab.pendientes },
                              { name: 'En Progreso', value: estadLab.en_progreso },
                              { name: 'Completadas', value: estadLab.completadas },
                              { name: 'Canceladas', value: estadLab.canceladas },
                            ].filter(d => d.value > 0)}
                            dataKey="value" nameKey="name"
                            cx="50%" cy="50%" outerRadius={110} label
                          >
                            {['#F59E0B', '#3B82F6', '#10B981', '#EF4444'].map((color, i) => (
                              <Cell key={i} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                          Avance promedio: <span className="font-bold text-green-700">{estadLab.promedio_avance}%</span>
                          {' | '}Total: <span className="font-bold">{estadLab.total}</span> labores
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'recomendaciones' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Estado de recomendaciones</h3>
                      {estadRec && (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Pendientes', value: estadRec.pendientes },
                                { name: 'Aprobadas', value: estadRec.aprobadas },
                                { name: 'En Ejecución', value: estadRec.en_ejecucion },
                                { name: 'Completadas', value: estadRec.completadas },
                                { name: 'Canceladas', value: estadRec.canceladas },
                              ].filter(d => d.value > 0)}
                              dataKey="value" nameKey="name"
                              cx="50%" cy="50%" outerRadius={100} label
                            >
                              {['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444'].map((c, i) => (
                                <Cell key={i} fill={c} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Por tipo (dinámico) */}
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Por tipo de recomendación (dinámico)</h3>
                      {estadRec && Object.keys(estadRec.por_tipo || {}).length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={toChartData(estadRec.por_tipo)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8B5CF6" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-gray-500">
                          <p className="text-sm">No hay tipos de recomendación registrados.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {estadRec && (
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Resumen de recomendaciones</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Estado</th>
                              <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Cantidad</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {[
                              { label: 'Pendientes', val: estadRec.pendientes, color: 'text-yellow-700' },
                              { label: 'Aprobadas', val: estadRec.aprobadas, color: 'text-green-700' },
                              { label: 'En Ejecución', val: estadRec.en_ejecucion, color: 'text-blue-700' },
                              { label: 'Completadas', val: estadRec.completadas, color: 'text-purple-700' },
                              { label: 'Canceladas', val: estadRec.canceladas, color: 'text-red-700' },
                            ].map(row => (
                              <tr key={row.label} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">{row.label}</td>
                                <td className={`px-4 py-3 text-right font-semibold ${row.color}`}>{row.val}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GestionEstadisticasPage;
