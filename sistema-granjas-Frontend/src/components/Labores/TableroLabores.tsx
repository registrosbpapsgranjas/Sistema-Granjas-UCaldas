// src/components/Labores/TableroLabores.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { openDB } from 'idb';

const DB_NAME = 'granjasDB';
const LABORES_STORE = 'labores_cache';
const PENDING_ACTIONS_STORE = 'pending_actions';

interface Labor {
  id: number;
  estado: string;
  tipo_labor_nombre?: string;
  avance_porcentaje: number;
  comentario?: string;
  lote_nombre?: string;
  granja_nombre?: string;
  recomendacion_titulo?: string;
  trabajador_nombre?: string;
  fecha_asignacion: string;
  fecha_finalizacion?: string;
  tipo_labor_id?: number;
  recomendacion_id?: number;
  inventario_item_nombre?: string;
  cantidad_usada?: number;
}

const getDB = async () => {
  return await openDB(DB_NAME, 3, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(LABORES_STORE)) {
        db.createObjectStore(LABORES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PENDING_ACTIONS_STORE)) {
        db.createObjectStore(PENDING_ACTIONS_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const ESTADO_COLS = [
  { key: 'pendiente', label: 'Pendiente', color: 'border-yellow-400', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
  { key: 'en_progreso', label: 'En Progreso', color: 'border-blue-400', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-400' },
  { key: 'completada', label: 'Completada', color: 'border-green-400', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800', dot: 'bg-green-400' },
];

const TableroLabores: React.FC = () => {
  const { user } = useAuth();
  const [labores, setLabores] = useState<Labor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const [pendientesSync, setPendientesSync] = useState(0);
  const [avanceModal, setAvanceModal] = useState<{ labor: Labor | null; valor: number; comentario: string }>({ labor: null, valor: 0, comentario: '' });
  const [vistaMovil, setVistaMovil] = useState<string>('todas');

  useEffect(() => {
    const handleOnline = () => { setOnline(true); sincronizarAcciones(); };
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    cargarLabores();
    cargarPendientes();
  }, []);

  const cargarPendientes = async () => {
    try {
      const db = await getDB();
      const items = await db.getAll(PENDING_ACTIONS_STORE);
      setPendientesSync(items.length);
    } catch { /* ignore */ }
  };

  const guardarEnCache = async (items: Labor[]) => {
    try {
      const db = await getDB();
      const tx = db.transaction(LABORES_STORE, 'readwrite');
      await tx.store.clear();
      for (const item of items) await tx.store.put(item);
      await tx.done;
    } catch { /* ignore */ }
  };

  const cargarDesdeCache = async (): Promise<Labor[]> => {
    try {
      const db = await getDB();
      return await db.getAll(LABORES_STORE);
    } catch { return []; }
  };

  const cargarLabores = useCallback(async () => {
    setCargando(true);
    if (navigator.onLine) {
      try {
        const url = user?.rol === 'trabajador'
          ? `${API_BASE}/labores?trabajador_id=${user.id}&limit=200`
          : `${API_BASE}/labores?limit=200`;
        const res = await fetch(url, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al cargar');
        const data = await res.json();
        const items: Labor[] = Array.isArray(data) ? data : (data?.items || []);
        setLabores(items);
        await guardarEnCache(items);
      } catch (err) {
        toast.error('No se pudo cargar desde servidor, usando caché');
        const cached = await cargarDesdeCache();
        setLabores(cached);
      }
    } else {
      const cached = await cargarDesdeCache();
      setLabores(cached);
      if (cached.length === 0) toast('Sin conexión — no hay datos en caché', { icon: '📵' });
    }
    setCargando(false);
  }, [user]);

  const encolarAccion = async (accion: any) => {
    try {
      const db = await getDB();
      await db.add(PENDING_ACTIONS_STORE, { ...accion, timestamp: new Date().toISOString() });
      await cargarPendientes();
    } catch { /* ignore */ }
  };

  const sincronizarAcciones = async () => {
    try {
      const db = await getDB();
      const acciones = await db.getAll(PENDING_ACTIONS_STORE);
      if (acciones.length === 0) return;
      let synced = 0;
      for (const accion of acciones) {
        try {
          let url = '', method = 'PUT', body: any = {};
          if (accion.tipo === 'avance') {
            url = `${API_BASE}/labores/${accion.labor_id}/avance`;
            method = 'POST';
            body = { avance_porcentaje: accion.avance, comentario: accion.comentario };
          } else if (accion.tipo === 'completar') {
            url = `${API_BASE}/labores/${accion.labor_id}/completar`;
            method = 'POST';
            body = {};
          }
          if (!url) continue;
          const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(body) });
          if (res.ok) {
            await db.delete(PENDING_ACTIONS_STORE, accion.id);
            synced++;
          }
        } catch { /* skip this action */ }
      }
      if (synced > 0) {
        toast.success(`${synced} acción(es) sincronizada(s)`);
        await cargarLabores();
        await cargarPendientes();
      }
    } catch { /* ignore */ }
  };

  const actualizarAvance = async () => {
    const { labor, valor, comentario } = avanceModal;
    if (!labor) return;
    const optimistic = labores.map(l => l.id === labor.id
      ? { ...l, avance_porcentaje: valor, comentario, estado: valor === 100 ? 'completada' : valor > 0 ? 'en_progreso' : 'pendiente' }
      : l
    );
    setLabores(optimistic);
    await guardarEnCache(optimistic);
    setAvanceModal({ labor: null, valor: 0, comentario: '' });
    if (navigator.onLine) {
      try {
        const res = await fetch(`${API_BASE}/labores/${labor.id}/avance`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ avance_porcentaje: valor, comentario }),
        });
        if (res.ok) {
          toast.success('Avance registrado');
          await cargarLabores();
        } else throw new Error();
      } catch {
        await encolarAccion({ tipo: 'avance', labor_id: labor.id, avance: valor, comentario });
        toast('Guardado localmente, se sincronizará cuando haya conexión', { icon: '💾' });
      }
    } else {
      await encolarAccion({ tipo: 'avance', labor_id: labor.id, avance: valor, comentario });
      toast('Sin conexión — guardado localmente', { icon: '📵' });
    }
  };

  const completarLabor = async (labor: Labor) => {
    if (!window.confirm(`¿Completar la labor "${labor.tipo_labor_nombre}"?`)) return;
    const optimistic = labores.map(l => l.id === labor.id ? { ...l, estado: 'completada', avance_porcentaje: 100 } : l);
    setLabores(optimistic);
    await guardarEnCache(optimistic);
    if (navigator.onLine) {
      try {
        const res = await fetch(`${API_BASE}/labores/${labor.id}/completar`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({}),
        });
        if (res.ok) {
          toast.success('Labor completada e inventario actualizado');
          await cargarLabores();
        } else throw new Error();
      } catch {
        await encolarAccion({ tipo: 'completar', labor_id: labor.id });
        toast('Guardado localmente, se sincronizará cuando haya conexión', { icon: '💾' });
      }
    } else {
      await encolarAccion({ tipo: 'completar', labor_id: labor.id });
      toast('Sin conexión — guardado localmente', { icon: '📵' });
    }
  };

  const laboresFiltradas = vistaMovil === 'todas' ? labores : labores.filter(l => l.estado === vistaMovil);

  const getEstadoInfo = (estado: string) => ESTADO_COLS.find(c => c.key === estado) || ESTADO_COLS[0];

  const formatFecha = (s: string) => {
    try {
      return new Date(s).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return s; }
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="text-gray-600">Cargando tablero de tareas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de estado */}
      <div className={`flex items-center justify-between px-4 py-2 text-sm ${online ? 'bg-green-600' : 'bg-orange-500'} text-white`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${online ? 'bg-white' : 'bg-white animate-pulse'}`}></div>
          <span>{online ? 'Conectado' : 'Sin conexión — modo offline'}</span>
          {pendientesSync > 0 && (
            <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">
              {pendientesSync} pendientes
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {pendientesSync > 0 && online && (
            <button onClick={sincronizarAcciones} className="bg-white text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              Sincronizar
            </button>
          )}
          <button onClick={cargarLabores} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs">
            Actualizar
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Encabezado */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Mis Tareas</h1>
          <p className="text-sm text-gray-500">{labores.length} tarea{labores.length !== 1 ? 's' : ''} asignada{labores.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Filtro móvil */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 md:hidden">
          {[{ key: 'todas', label: 'Todas' }, ...ESTADO_COLS].map(col => (
            <button
              key={col.key}
              onClick={() => setVistaMovil(col.key)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                vistaMovil === col.key ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border'
              }`}
            >
              {col.label}
              {col.key !== 'todas' && (
                <span className="ml-1 text-xs">({labores.filter(l => l.estado === col.key).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Vista Desktop: Kanban */}
        <div className="hidden md:grid md:grid-cols-3 gap-4">
          {ESTADO_COLS.map(col => (
            <div key={col.key} className={`rounded-xl border-t-4 ${col.color} bg-white shadow-sm`}>
              <div className={`px-4 py-3 ${col.bg} rounded-t-xl flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${col.dot}`}></div>
                  <span className="font-semibold text-gray-800">{col.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badge}`}>
                  {labores.filter(l => l.estado === col.key).length}
                </span>
              </div>
              <div className="p-3 space-y-3 min-h-24 max-h-[70vh] overflow-y-auto">
                {labores.filter(l => l.estado === col.key).length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">Sin tareas</p>
                ) : (
                  labores.filter(l => l.estado === col.key).map(labor => (
                    <LaborCard
                      key={labor.id}
                      labor={labor}
                      onAvance={() => setAvanceModal({ labor, valor: labor.avance_porcentaje, comentario: labor.comentario || '' })}
                      onCompletar={() => completarLabor(labor)}
                      formatFecha={formatFecha}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Vista Móvil: Lista filtrada */}
        <div className="md:hidden space-y-3">
          {laboresFiltradas.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">✅</div>
              <p>No hay tareas en esta categoría</p>
            </div>
          ) : (
            laboresFiltradas.map(labor => (
              <LaborCard
                key={labor.id}
                labor={labor}
                onAvance={() => setAvanceModal({ labor, valor: labor.avance_porcentaje, comentario: labor.comentario || '' })}
                onCompletar={() => completarLabor(labor)}
                formatFecha={formatFecha}
                fullWidth
              />
            ))
          )}
        </div>
      </div>

      {/* Modal de avance */}
      {avanceModal.labor && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b">
              <h3 className="font-bold text-lg text-gray-900">Registrar Avance</h3>
              <p className="text-sm text-gray-500 mt-1">{avanceModal.labor.tipo_labor_nombre}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porcentaje de avance: <span className="text-green-600 font-bold">{avanceModal.valor}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={avanceModal.valor}
                  onChange={e => setAvanceModal(prev => ({ ...prev, valor: parseInt(e.target.value) }))}
                  className="w-full h-3 accent-green-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
              </div>
              <div className="flex gap-3 justify-between text-sm">
                {[25, 50, 75, 100].map(v => (
                  <button
                    key={v}
                    onClick={() => setAvanceModal(prev => ({ ...prev, valor: v }))}
                    className={`flex-1 py-2 rounded-lg border font-medium transition-colors ${avanceModal.valor === v ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comentario (opcional)</label>
                <textarea
                  value={avanceModal.comentario}
                  onChange={e => setAvanceModal(prev => ({ ...prev, comentario: e.target.value }))}
                  rows={3}
                  placeholder="Describe el avance realizado..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="p-4 flex gap-3 border-t">
              <button
                onClick={() => setAvanceModal({ labor: null, valor: 0, comentario: '' })}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={actualizarAvance}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface LaborCardProps {
  labor: Labor;
  onAvance: () => void;
  onCompletar: () => void;
  formatFecha: (s: string) => string;
  fullWidth?: boolean;
}

const LaborCard: React.FC<LaborCardProps> = ({ labor, onAvance, onCompletar, formatFecha, fullWidth }) => {
  const completada = labor.estado === 'completada';
  const enProgreso = labor.estado === 'en_progreso';

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${fullWidth ? 'w-full' : ''} ${completada ? 'opacity-75' : ''}`}>
      <div className={`h-1 ${completada ? 'bg-green-400' : enProgreso ? 'bg-blue-400' : 'bg-yellow-400'}`}
        style={{ width: `${labor.avance_porcentaje}%`, minWidth: '4px' }}></div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1 mr-2">
            {labor.tipo_labor_nombre || 'Labor'}
          </h4>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
            completada ? 'bg-green-100 text-green-700' :
            enProgreso ? 'bg-blue-100 text-blue-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {completada ? 'Completada' : enProgreso ? 'En progreso' : 'Pendiente'}
          </span>
        </div>

        {labor.recomendacion_titulo && (
          <p className="text-xs text-blue-600 mb-1 truncate">
            📋 {labor.recomendacion_titulo}
          </p>
        )}
        {labor.lote_nombre && (
          <p className="text-xs text-gray-500 mb-1">
            🌱 {labor.lote_nombre}{labor.granja_nombre ? ` — ${labor.granja_nombre}` : ''}
          </p>
        )}
        {labor.inventario_item_nombre && (
          <p className="text-xs text-purple-600 mb-1">
            📦 {labor.inventario_item_nombre}{labor.cantidad_usada ? ` (${labor.cantidad_usada})` : ''}
          </p>
        )}

        {/* Barra de progreso */}
        <div className="mt-3 mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Avance</span>
            <span className="font-semibold">{labor.avance_porcentaje}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${completada ? 'bg-green-500' : enProgreso ? 'bg-blue-500' : 'bg-yellow-400'}`}
              style={{ width: `${labor.avance_porcentaje}%` }}
            ></div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-3">
          Asignada: {formatFecha(labor.fecha_asignacion)}
          {labor.fecha_finalizacion && ` · Completada: ${formatFecha(labor.fecha_finalizacion)}`}
        </p>

        {labor.comentario && (
          <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mb-3 italic">
            "{labor.comentario}"
          </p>
        )}

        {!completada && (
          <div className="flex gap-2">
            <button
              onClick={onAvance}
              className="flex-1 py-2 text-xs bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              Registrar avance
            </button>
            <button
              onClick={onCompletar}
              className="flex-1 py-2 text-xs bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Completar
            </button>
          </div>
        )}
        {completada && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <span>✅</span><span className="font-medium">Labor completada</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableroLabores;
