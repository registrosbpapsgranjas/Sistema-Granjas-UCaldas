// src/components/Lotes/LoteMapa.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import DashboardHeader from '../Common/DashboardHeader';
import loteService from '../../services/loteService';
import plantaService from '../../services/plantaService';
import type { PlantaResponse } from '../../types/plantaTypes';

interface LoteInfo {
  id: number;
  nombre: string;
  surcos: number;
  plantas_por_surco: number;
  total_plantas: number;
}

interface MapaDiagData {
  planta_id: number;
  diagnosticos_count: number;
  ultima_fecha?: string;
  presion_plagas?: 'alta' | 'media' | 'baja' | 'ninguna';
  tiene_enfermedades?: boolean;
  estadio_fenologico?: string;
}

type VistaMapaKey = 'estado' | 'diagnosticos' | 'plagas' | 'enfermedades';

const VISTAS: { key: VistaMapaKey; label: string; icon: string; desc: string }[] = [
  { key: 'estado', label: 'Estado', icon: '🌱', desc: 'Estado productivo de cada planta' },
  { key: 'diagnosticos', label: 'Diagnósticos', icon: '🔬', desc: 'Intensidad de diagnósticos registrados' },
  { key: 'plagas', label: 'Presión Plagas', icon: '🐛', desc: 'Nivel de presión de plagas por planta' },
  { key: 'enfermedades', label: 'Enfermedades', icon: '🍂', desc: 'Plantas con enfermedades registradas' },
];

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const LoteMapa: React.FC = () => {
  const { loteId } = useParams<{ loteId: string }>();
  const navigate = useNavigate();
  const [lote, setLote] = useState<LoteInfo | null>(null);
  const [plantas, setPlantas] = useState<PlantaResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [matriz, setMatriz] = useState<(PlantaResponse | null)[][]>([]);
  const [vistaActual, setVistaActual] = useState<VistaMapaKey>('estado');
  const [mapaData, setMapaData] = useState<Record<number, MapaDiagData>>({});
  const [cargandoMapa, setCargandoMapa] = useState(false);
  const [plantaSeleccionada, setPlantaSeleccionada] = useState<PlantaResponse | null>(null);

  useEffect(() => {
    if (!loteId) { toast.error('ID de lote no válido'); navigate('/lotes'); return; }
    cargarDatos();
  }, [loteId]);

  useEffect(() => {
    if (loteId && vistaActual !== 'estado') {
      cargarMapaData();
    }
  }, [vistaActual, loteId]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [loteData, plantasData] = await Promise.all([
        loteService.obtenerLotePorId(Number(loteId)),
        plantaService.obtenerPlantas(Number(loteId)),
      ]);
      setLote({
        id: loteData.id,
        nombre: loteData.nombre,
        surcos: loteData.surcos,
        plantas_por_surco: loteData.plantas_por_surco,
        total_plantas: loteData.surcos * loteData.plantas_por_surco,
      });
      setPlantas(plantasData);
      const rows = loteData.surcos;
      const cols = loteData.plantas_por_surco;
      const nuevaMatriz: (PlantaResponse | null)[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));
      plantasData.forEach((planta) => {
        const fila = planta.surco - 1;
        const columna = planta.numero - 1;
        if (fila >= 0 && fila < rows && columna >= 0 && columna < cols) {
          nuevaMatriz[fila][columna] = planta;
        }
      });
      setMatriz(nuevaMatriz);
    } catch {
      toast.error('No se pudo cargar la información del lote');
      navigate('/lotes');
    } finally {
      setCargando(false);
    }
  };

  const cargarMapaData = async () => {
    setCargandoMapa(true);
    try {
      const res = await fetch(`${API_BASE}/diagnosticos/mapa/${loteId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const byPlantaId: Record<number, MapaDiagData> = {};
        (data.plants || []).forEach((p: MapaDiagData) => { byPlantaId[p.planta_id] = p; });
        setMapaData(byPlantaId);
      }
    } catch { /* silence — mapa data is optional */ }
    setCargandoMapa(false);
  };

  const getCelda = (planta: PlantaResponse | null): { cls: string; label?: string } => {
    if (!planta) return { cls: 'bg-white border-gray-200 opacity-50' };

    if (vistaActual === 'estado') {
      switch (planta.estado) {
        case 'productivo': return { cls: 'bg-green-500 hover:bg-green-600 border-green-600' };
        case 'para_eliminar': return { cls: 'bg-red-500 hover:bg-red-600 border-red-600' };
        case 'punto_vacio': return { cls: 'bg-gray-300 hover:bg-gray-400 border-gray-400' };
        default: return { cls: 'bg-gray-100 border-gray-300' };
      }
    }

    const d = mapaData[planta.id];

    if (vistaActual === 'diagnosticos') {
      if (!d || d.diagnosticos_count === 0) return { cls: 'bg-gray-100 border-gray-300', label: '0' };
      if (d.diagnosticos_count >= 5) return { cls: 'bg-red-600 hover:bg-red-700 border-red-700', label: String(d.diagnosticos_count) };
      if (d.diagnosticos_count >= 3) return { cls: 'bg-orange-500 hover:bg-orange-600 border-orange-600', label: String(d.diagnosticos_count) };
      if (d.diagnosticos_count >= 1) return { cls: 'bg-yellow-400 hover:bg-yellow-500 border-yellow-500', label: String(d.diagnosticos_count) };
      return { cls: 'bg-gray-100 border-gray-300' };
    }

    if (vistaActual === 'plagas') {
      const p = d?.presion_plagas;
      if (p === 'alta') return { cls: 'bg-red-500 hover:bg-red-600 border-red-600' };
      if (p === 'media') return { cls: 'bg-orange-400 hover:bg-orange-500 border-orange-500' };
      if (p === 'baja') return { cls: 'bg-yellow-300 hover:bg-yellow-400 border-yellow-400' };
      return { cls: 'bg-green-100 border-green-200' };
    }

    if (vistaActual === 'enfermedades') {
      if (d?.tiene_enfermedades) return { cls: 'bg-purple-500 hover:bg-purple-600 border-purple-600' };
      return { cls: 'bg-green-100 border-green-200' };
    }

    return { cls: 'bg-gray-100 border-gray-300' };
  };

  const getTooltip = (planta: PlantaResponse | null): string => {
    if (!planta) return 'Sin planta registrada';
    const base = `${planta.codigo} (S${planta.surco}/P${planta.numero})`;
    const d = mapaData[planta.id];
    if (vistaActual === 'estado') {
      const estados: Record<string, string> = { productivo: 'Productivo', para_eliminar: 'Para Eliminar', punto_vacio: 'Punto Vacío' };
      return `${base} — ${estados[planta.estado] || planta.estado}`;
    }
    if (vistaActual === 'diagnosticos') return `${base} — ${d?.diagnosticos_count ?? 0} diagnóstico(s)`;
    if (vistaActual === 'plagas') return `${base} — Plagas: ${d?.presion_plagas ?? 'sin datos'}`;
    if (vistaActual === 'enfermedades') return `${base} — ${d?.tiene_enfermedades ? 'Con enfermedades' : 'Sin enfermedades'}`;
    return base;
  };

  const getLeyenda = () => {
    switch (vistaActual) {
      case 'estado': return [
        { color: 'bg-green-500', label: 'Productivo' },
        { color: 'bg-red-500', label: 'Para Eliminar' },
        { color: 'bg-gray-300', label: 'Punto Vacío' },
        { color: 'bg-white border border-gray-300', label: 'Sin registrar' },
      ];
      case 'diagnosticos': return [
        { color: 'bg-gray-100 border', label: '0 diagnósticos' },
        { color: 'bg-yellow-400', label: '1–2 diagnósticos' },
        { color: 'bg-orange-500', label: '3–4 diagnósticos' },
        { color: 'bg-red-600', label: '5+ diagnósticos' },
      ];
      case 'plagas': return [
        { color: 'bg-green-100 border', label: 'Sin datos / Sin presión' },
        { color: 'bg-yellow-300', label: 'Presión baja' },
        { color: 'bg-orange-400', label: 'Presión media' },
        { color: 'bg-red-500', label: 'Presión alta' },
      ];
      case 'enfermedades': return [
        { color: 'bg-green-100 border', label: 'Sin enfermedades' },
        { color: 'bg-purple-500', label: 'Con enfermedades' },
      ];
      default: return [];
    }
  };

  const handleBack = () => { if (window.history.length > 1) navigate(-1); else navigate('/lotes'); };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader title="Mapa del Lote" selectedModule="lotes" onBack={handleBack} />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <span className="ml-4 text-gray-600">Cargando mapa del lote...</span>
        </div>
      </div>
    );
  }

  if (!lote) return null;

  const vistaInfo = VISTAS.find(v => v.key === vistaActual)!;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader title={`Mapa: ${lote.nombre}`} selectedModule="lotes" onBack={handleBack} />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Info y acción */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <p className="text-gray-600 text-sm">
              {lote.surcos} surcos × {lote.plantas_por_surco} plantas = {lote.total_plantas} posiciones
            </p>
            <button
              onClick={() => navigate(`/gestion/plantas?loteId=${lote.id}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2"
            >
              <span>📋</span> Ver lista de plantas
            </button>
          </div>

          {/* Selector de vistas */}
          <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1 flex-wrap">
            {VISTAS.map(v => (
              <button
                key={v.key}
                onClick={() => setVistaActual(v.key)}
                className={`flex-1 min-w-max flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  vistaActual === v.key
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{v.icon}</span>
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>

          {/* Descripción de la vista */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700 flex items-center gap-2">
            <span>{vistaInfo.icon}</span>
            <span>{vistaInfo.desc}</span>
            {cargandoMapa && <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
          </div>

          {/* Leyenda */}
          <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap gap-4">
            {getLeyenda().map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded ${item.color}`}></div>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Detalle planta seleccionada */}
          {plantaSeleccionada && (
            <div className="bg-white rounded-xl shadow-sm border p-4 relative">
              <button onClick={() => setPlantaSeleccionada(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              <h3 className="font-semibold text-gray-800 mb-2">{plantaSeleccionada.codigo}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500">Surco:</span> <span className="font-medium">{plantaSeleccionada.surco}</span></div>
                <div><span className="text-gray-500">Planta:</span> <span className="font-medium">{plantaSeleccionada.numero}</span></div>
                <div>
                  <span className="text-gray-500">Estado:</span>{' '}
                  <span className={`font-medium ${plantaSeleccionada.estado === 'productivo' ? 'text-green-600' : plantaSeleccionada.estado === 'para_eliminar' ? 'text-red-600' : 'text-gray-600'}`}>
                    {plantaSeleccionada.estado === 'productivo' ? 'Productivo' : plantaSeleccionada.estado === 'para_eliminar' ? 'Para Eliminar' : 'Punto Vacío'}
                  </span>
                </div>
                {mapaData[plantaSeleccionada.id] && (
                  <div><span className="text-gray-500">Diagnósticos:</span> <span className="font-medium">{mapaData[plantaSeleccionada.id].diagnosticos_count}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Matriz de plantas */}
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <div className="inline-block min-w-full align-middle p-2">
              <table className="border-collapse">
                <tbody>
                  {matriz.map((fila, i) => (
                    <tr key={i}>
                      <td className="sticky left-0 bg-gray-50 text-xs font-semibold text-center px-2 py-1 border border-gray-200 text-gray-500 min-w-max">
                        S{i + 1}
                      </td>
                      {fila.map((planta, j) => {
                        const celda = getCelda(planta);
                        return (
                          <td key={j} className="p-0.5 border-0">
                            <div
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded transition-all duration-200 cursor-pointer border ${celda.cls} flex items-center justify-center`}
                              title={getTooltip(planta)}
                              onClick={() => planta && setPlantaSeleccionada(planta)}
                            >
                              {celda.label && (
                                <span className="text-white text-xs font-bold leading-none">{celda.label}</span>
                              )}
                              {!celda.label && planta && (
                                <span className="text-xs text-white font-bold leading-none opacity-70">{planta.numero}</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard value={plantas.filter(p => p.estado === 'productivo').length} label="Productivos" color="text-green-600" />
            <StatCard value={plantas.filter(p => p.estado === 'para_eliminar').length} label="Para Eliminar" color="text-red-600" />
            <StatCard value={plantas.filter(p => p.estado === 'punto_vacio').length} label="Puntos Vacíos" color="text-gray-500" />
            <StatCard value={lote.total_plantas - plantas.length} label="Sin registrar" color="text-gray-400" />
          </div>

          {vistaActual !== 'estado' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatCard
                value={Object.values(mapaData).reduce((s, d) => s + d.diagnosticos_count, 0)}
                label="Total diagnósticos"
                color="text-blue-600"
              />
              <StatCard
                value={Object.values(mapaData).filter(d => d.presion_plagas === 'alta').length}
                label="Con presión alta"
                color="text-red-600"
              />
              <StatCard
                value={Object.values(mapaData).filter(d => d.tiene_enfermedades).length}
                label="Con enfermedades"
                color="text-purple-600"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm text-center">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-gray-500 mt-1">{label}</div>
  </div>
);

export default LoteMapa;
