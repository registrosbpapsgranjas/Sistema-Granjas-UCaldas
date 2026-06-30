import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Activity, Leaf, AlertTriangle, TrendingUp, CheckCircle, ClipboardList, Layers, ChevronRight, Calendar } from 'lucide-react';
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

interface SubtipoStat {
  id: number;
  nombre: string;
  descripcion?: string;
  monitoreo_nombre?: string;
  programa_nombre?: string;
  total: number;
  num_campos: number;
}

interface CampoStat {
  nombre_campo: string;
  etiqueta: string;
  tipo_dato: string;
  opciones?: string[];
  total_respuestas: number;
  distribucion?: Record<string, number>;
  promedio?: number;
  minimo?: number;
  maximo?: number;
}

interface SubtipoItemStat {
  subtipo_id: number;
  subtipo_nombre: string;
  descripcion?: string;
  monitoreo_nombre?: string;
  programa_nombre?: string;
  total: number;
  campos: CampoStat[];
}

type Tab = 'general' | 'diagnosticos' | 'labores' | 'recomendaciones';
type DatePreset = '7d' | '30d' | '90d' | 'custom' | 'all';

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

const CampoStatCard: React.FC<{ campo: CampoStat }> = ({ campo }) => {
  const hasDistribucion = campo.distribucion && Object.keys(campo.distribucion).length > 0;
  const distData = hasDistribucion
    ? Object.entries(campo.distribucion!).map(([name, value]) => ({ name, value }))
    : [];

  const isNumeric = ['number', 'integer', 'float'].includes(campo.tipo_dato);
  const isBoolean = campo.tipo_dato === 'boolean';
  const isCategoric = ['select', 'radio', 'checkbox'].includes(campo.tipo_dato) || isBoolean;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="mb-3">
        <h4 className="font-semibold text-gray-800 text-sm">{campo.etiqueta}</h4>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {campo.tipo_dato}
        </span>
        <span className="text-xs text-gray-500 ml-2">
          {campo.total_respuestas} respuesta{campo.total_respuestas !== 1 ? 's' : ''}
        </span>
      </div>

      {campo.total_respuestas === 0 ? (
        <div className="text-center py-4 text-gray-400 text-sm">Sin datos</div>
      ) : isNumeric ? (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Mínimo</p>
            <p className="text-lg font-bold text-blue-700">{campo.minimo ?? '—'}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Promedio</p>
            <p className="text-lg font-bold text-green-700">{campo.promedio ?? '—'}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Máximo</p>
            <p className="text-lg font-bold text-purple-700">{campo.maximo ?? '—'}</p>
          </div>
        </div>
      ) : isCategoric && distData.length > 0 ? (
        <>
          {isBoolean ? (
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={distData.filter(d => d.value > 0)} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={50} label={({ name, value }) => `${name}: ${value}`}>
                  {distData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(100, distData.length * 28)}>
              <BarChart data={distData} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 3, 3, 0]}>
                  {distData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-2xl font-bold text-gray-700">{campo.total_respuestas}</p>
          <p className="text-xs text-gray-500">respuestas registradas</p>
        </div>
      )}
    </div>
  );
};

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: '7d', label: 'Últimos 7 días' },
  { key: '30d', label: 'Últimos 30 días' },
  { key: '90d', label: 'Últimos 90 días' },
  { key: 'custom', label: 'Personalizado' },
  { key: 'all', label: 'Todo' },
];

function computeDates(preset: DatePreset, customStart: string, customEnd: string): { fi: string; ff: string } {
  if (preset === 'all') return { fi: '', ff: '' };
  if (preset === 'custom') return { fi: customStart, ff: customEnd };
  const today = new Date();
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const from = new Date(today);
  from.setDate(today.getDate() - days);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { fi: fmt(from), ff: fmt(today) };
}

const GestionEstadisticasPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('general');
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [programaId, setProgramaId] = useState<number | ''>('');
  const [loadingProgs, setLoadingProgs] = useState(true);

  // Date range
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [estadDiag, setEstatDiag] = useState<EstadDiagnosticos | null>(null);
  const [estadLab, setEstatLab] = useState<EstadLabores | null>(null);
  const [estadRec, setEstatRec] = useState<EstadRecomendaciones | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subtipos state
  const [subtipos, setSubtipos] = useState<SubtipoStat[]>([]);
  const [loadingSubtipos, setLoadingSubtipos] = useState(false);
  const [selectedSubtipoId, setSelectedSubtipoId] = useState<number | ''>('');
  const [subtipoItems, setSubtipoItems] = useState<SubtipoItemStat | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);

  const buildDiagParams = useCallback((extra = '') => {
    const { fi, ff } = computeDates(datePreset, customStart, customEnd);
    const parts: string[] = [];
    if (programaId) parts.push(`programa_id=${programaId}`);
    if (fi) parts.push(`fecha_inicio=${fi}`);
    if (ff) parts.push(`fecha_fin=${ff}`);
    if (extra) parts.push(extra.replace(/^[?&]/, ''));
    return parts.length ? `?${parts.join('&')}` : '';
  }, [programaId, datePreset, customStart, customEnd]);

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
      const params = buildDiagParams();
      const [diagRes, labRes, recRes] = await Promise.all([
        api.get(`/diagnosticos/estadisticas/resumen${params}`),
        api.get(`/labores/estadisticas/resumen`),
        api.get(`/recomendaciones/estadisticas/resumen`),
      ]);
      setEstatDiag(diagRes.data);
      setEstatLab(labRes.data);
      setEstatRec(recRes.data);
    } catch {
      setError('No se pudieron cargar las estadísticas. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  }, [buildDiagParams]);

  const cargarSubtipos = useCallback(async () => {
    setLoadingSubtipos(true);
    setSelectedSubtipoId('');
    setSubtipoItems(null);
    try {
      const params = buildDiagParams();
      const res = await api.get(`/diagnosticos/estadisticas/subtipos${params}`);
      setSubtipos(res.data || []);
    } catch {
      setSubtipos([]);
    } finally {
      setLoadingSubtipos(false);
    }
  }, [buildDiagParams]);

  const cargarItemsSubtipo = useCallback(async (subtipoId: number) => {
    setLoadingItems(true);
    setSubtipoItems(null);
    try {
      const params = buildDiagParams();
      const res = await api.get(`/diagnosticos/estadisticas/subtipos/${subtipoId}/items${params}`);
      setSubtipoItems(res.data);
    } catch {
      setSubtipoItems(null);
    } finally {
      setLoadingItems(false);
    }
  }, [buildDiagParams]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  useEffect(() => {
    if (tab === 'diagnosticos') {
      cargarSubtipos();
    }
  }, [tab, cargarSubtipos]);

  useEffect(() => {
    if (selectedSubtipoId) {
      cargarItemsSubtipo(Number(selectedSubtipoId));
    } else {
      setSubtipoItems(null);
    }
  }, [selectedSubtipoId, cargarItemsSubtipo]);

  const { fi: activeFi, ff: activeFf } = computeDates(datePreset, customStart, customEnd);
  const dateLabel = datePreset === 'all' ? 'Todos los períodos'
    : datePreset === 'custom' ? (activeFi && activeFf ? `${activeFi} → ${activeFf}` : 'Rango personalizado')
    : DATE_PRESETS.find(p => p.key === datePreset)?.label ?? '';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'diagnosticos', label: 'Diagnósticos' },
    { key: 'labores', label: 'Labores' },
    { key: 'recomendaciones', label: 'Recomendaciones' },
  ];

  const subtiposConDatos = subtipos.filter(s => s.total > 0);

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

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Programa:</label>
              {loadingProgs ? (
                <div className="border rounded-lg px-4 py-2 text-sm text-gray-400">Cargando...</div>
              ) : (
                <select
                  value={programaId}
                  onChange={e => {
                    setProgramaId(e.target.value ? parseInt(e.target.value) : '');
                    setSelectedSubtipoId('');
                    setSubtipoItems(null);
                  }}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Todos los programas</option>
                  {programas.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => { cargarEstadisticas(); if (tab === 'diagnosticos') cargarSubtipos(); }}
                disabled={loading}
                className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync'} mr-1`}></i>
                Actualizar
              </button>
            </div>
          </div>

          {/* Date range filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-gray-600 shrink-0">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Período:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DATE_PRESETS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => {
                      setDatePreset(p.key);
                      if (p.key !== 'custom') { setCustomStart(''); setCustomEnd(''); }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                      datePreset === p.key
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-green-400 hover:text-green-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {datePreset === 'custom' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-gray-400 text-sm">→</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}
              {datePreset !== 'all' && (
                <span className="text-xs text-gray-500 italic ml-auto">
                  {dateLabel}
                </span>
              )}
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

              {/* ── GENERAL ── */}
              {tab === 'general' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Diagnósticos por tipo de monitoreo</h3>
                      {estadDiag && Object.keys(estadDiag.por_monitoreo || {}).length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie data={toChartData(estadDiag.por_monitoreo)} dataKey="value" nameKey="name"
                              cx="50%" cy="50%" outerRadius={100} label>
                              {toChartData(estadDiag.por_monitoreo).map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip /><Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400">Sin datos</div>
                      )}
                    </div>

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
                            <XAxis dataKey="name" /><YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#4ade80" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400">Sin datos</div>
                      )}
                    </div>
                  </div>

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

              {/* ── DIAGNÓSTICOS ── */}
              {tab === 'diagnosticos' && (
                <div className="space-y-6">
                  {/* Gráficas existentes */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Por tipo de monitoreo</h3>
                      {estadDiag && Object.keys(estadDiag.por_monitoreo || {}).length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={toChartData(estadDiag.por_monitoreo)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis /><Tooltip />
                            <Bar dataKey="value" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400">Sin datos</div>
                      )}
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Por lote</h3>
                      {estadDiag && Object.keys(estadDiag.por_lote || {}).length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={toChartData(estadDiag.por_lote)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis /><Tooltip />
                            <Bar dataKey="value" fill="#10B981" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400">Sin datos</div>
                      )}
                    </div>
                  </div>

                  {!programaId && estadDiag && Object.keys(estadDiag.por_programa || {}).length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Por programa</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={toChartData(estadDiag.por_programa)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis /><Tooltip />
                          <Bar dataKey="value" fill="#8B5CF6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* ── SECCIÓN SUBTIPOS ── */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="w-5 h-5 text-green-600" />
                      <h2 className="text-xl font-bold text-gray-800">Estadísticas por Subtipo</h2>
                    </div>

                    {loadingSubtipos ? (
                      <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      </div>
                    ) : subtipos.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400">
                        <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p>No hay subtipos de diagnóstico configurados{programaId ? ' para este programa' : ''}.</p>
                      </div>
                    ) : (
                      <>
                        {/* Gráfica de barras de subtipos */}
                        {subtiposConDatos.length > 0 && (
                          <div className="bg-white p-4 rounded-lg shadow mb-4">
                            <h3 className="text-base font-semibold mb-3 text-gray-700">Diagnósticos por subtipo</h3>
                            <ResponsiveContainer width="100%" height={Math.max(200, subtiposConDatos.length * 36)}>
                              <BarChart data={subtiposConDatos.map(s => ({ name: s.nombre, value: s.total, monitoreo: s.monitoreo_nombre }))} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                                <Tooltip formatter={(val) => [val, 'Diagnósticos']} />
                                <Bar dataKey="value" fill="#059669" radius={[0, 4, 4, 0]}>
                                  {subtiposConDatos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* Tabla de subtipos con selector */}
                        <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
                          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
                            <h3 className="text-base font-semibold text-gray-700">Listado de subtipos</h3>
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600 whitespace-nowrap">Ver detalle de:</label>
                              <select
                                value={selectedSubtipoId}
                                onChange={e => setSelectedSubtipoId(e.target.value ? parseInt(e.target.value) : '')}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                <option value="">— Seleccionar subtipo —</option>
                                {subtipos.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.nombre}{s.monitoreo_nombre ? ` (${s.monitoreo_nombre})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Subtipo</th>
                                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Monitoreo</th>
                                  <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase">Campos</th>
                                  <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase">Diagnósticos</th>
                                  <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase">Detalle</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {subtipos.map(s => (
                                  <tr
                                    key={s.id}
                                    className={`hover:bg-gray-50 cursor-pointer transition ${selectedSubtipoId === s.id ? 'bg-green-50 border-l-4 border-green-500' : ''}`}
                                    onClick={() => setSelectedSubtipoId(selectedSubtipoId === s.id ? '' : s.id)}
                                  >
                                    <td className="px-4 py-3 font-medium text-gray-800">{s.nombre}</td>
                                    <td className="px-4 py-3 text-gray-500">{s.monitoreo_nombre ?? '—'}</td>
                                    <td className="px-4 py-3 text-center text-gray-600">{s.num_campos}</td>
                                    <td className="px-4 py-3 text-right">
                                      <span className={`font-bold ${s.total > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                                        {s.total}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <button
                                        className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 mx-auto ${
                                          selectedSubtipoId === s.id
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                                        }`}
                                        onClick={e => { e.stopPropagation(); setSelectedSubtipoId(selectedSubtipoId === s.id ? '' : s.id); }}
                                      >
                                        <ChevronRight className="w-3 h-3" />
                                        {selectedSubtipoId === s.id ? 'Ocultar' : 'Ver'}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* ── DETALLE DE ITEMS DEL SUBTIPO ── */}
                        {selectedSubtipoId && (
                          <div className="bg-white rounded-lg shadow p-4">
                            {loadingItems ? (
                              <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                              </div>
                            ) : subtipoItems ? (
                              <>
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-800">{subtipoItems.subtipo_nombre}</h3>
                                    {subtipoItems.monitoreo_nombre && (
                                      <p className="text-sm text-gray-500">Monitoreo: {subtipoItems.monitoreo_nombre}</p>
                                    )}
                                  </div>
                                  <div className="text-center bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                                    <p className="text-2xl font-bold text-green-700">{subtipoItems.total}</p>
                                    <p className="text-xs text-gray-500">diagnósticos totales</p>
                                  </div>
                                </div>

                                {subtipoItems.campos.length === 0 ? (
                                  <div className="text-center py-8 text-gray-400">
                                    Este subtipo no tiene campos de formulario configurados.
                                  </div>
                                ) : subtipoItems.total === 0 ? (
                                  <div className="text-center py-8 text-gray-400">
                                    No hay diagnósticos registrados para este subtipo aún.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {subtipoItems.campos.map(campo => (
                                      <CampoStatCard key={campo.nombre_campo} campo={campo} />
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-center py-8 text-gray-400">No se pudo cargar el detalle.</div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Tabla detalle por monitoreo */}
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

              {/* ── LABORES ── */}
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
                            dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label
                          >
                            {['#F59E0B', '#3B82F6', '#10B981', '#EF4444'].map((color, i) => (
                              <Cell key={i} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip /><Legend />
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

              {/* ── RECOMENDACIONES ── */}
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
                              dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label
                            >
                              {['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444'].map((c, i) => (
                                <Cell key={i} fill={c} />
                              ))}
                            </Pie>
                            <Tooltip /><Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-4">Por tipo de recomendación</h3>
                      {estadRec && Object.keys(estadRec.por_tipo || {}).length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={toChartData(estadRec.por_tipo)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis /><Tooltip />
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
