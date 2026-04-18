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

const LoteMapa: React.FC = () => {
  const { loteId } = useParams<{ loteId: string }>();
  const navigate = useNavigate();
  const [lote, setLote] = useState<LoteInfo | null>(null);
  const [plantas, setPlantas] = useState<PlantaResponse[]>([]);
  const [cargando, setCargando] = useState(true);
  const [matriz, setMatriz] = useState<(PlantaResponse | null)[][]>([]);

  useEffect(() => {
    if (!loteId) {
      toast.error('ID de lote no válido');
      navigate('/lotes');
      return;
    }
    cargarDatos();
  }, [loteId]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const loteData = await loteService.obtenerLotePorId(Number(loteId));
      const plantasData = await plantaService.obtenerPlantas(Number(loteId));

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
      const nuevaMatriz: (PlantaResponse | null)[][] = Array(rows)
        .fill(null)
        .map(() => Array(cols).fill(null));

      plantasData.forEach((planta) => {
        const fila = planta.surco - 1;
        const columna = planta.numero - 1;
        if (fila >= 0 && fila < rows && columna >= 0 && columna < cols) {
          nuevaMatriz[fila][columna] = planta;
        }
      });

      setMatriz(nuevaMatriz);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('No se pudo cargar la información del lote');
      navigate('/lotes');
    } finally {
      setCargando(false);
    }
  };

  const getColorPorEstado = (planta: PlantaResponse | null): string => {
    if (!planta) return 'bg-white border-gray-300';
    switch (planta.estado) {
      case 'productivo':
        return 'bg-green-500 hover:bg-green-600 border-green-600';
      case 'para_eliminar':
        return 'bg-red-500 hover:bg-red-600 border-red-600';
      case 'punto_vacio':
        return 'bg-gray-300 hover:bg-gray-400 border-gray-400';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getTooltipText = (planta: PlantaResponse | null): string => {
    if (!planta) return 'Sin planta registrada';
    return `${planta.codigo} - Estado: ${
      planta.estado === 'productivo'
        ? 'Productivo'
        : planta.estado === 'para_eliminar'
        ? 'Para Eliminar'
        : 'Punto Vacío'
    }`;
  };

  // Función para volver atrás en el historial, o a la lista si no hay historial
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1); // Regresa a la página anterior (con el contexto correcto)
    } else {
      navigate('/lotes'); // Fallback
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader
          title="Mapa del Lote"
          selectedModule="lotes"
          onBack={handleBack}
        />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <span className="ml-4 text-gray-600">Cargando mapa del lote...</span>
        </div>
      </div>
    );
  }

  if (!lote) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        title={`Mapa del Lote: ${lote.nombre}`}
        selectedModule="lotes"
        onBack={handleBack}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <p className="text-gray-600 mt-1">
                {lote.surcos} surcos × {lote.plantas_por_surco} plantas/surco = {lote.total_plantas} posiciones
              </p>
            </div>
            <button
              onClick={() => navigate(`/gestion/plantas?loteId=${lote.id}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <i className="fas fa-list mr-2"></i>
              Ver lista de plantas
            </button>
          </div>

          {/* Leyenda */}
          <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded border border-green-600"></div>
              <span className="text-sm">Productivo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-500 rounded border border-red-600"></div>
              <span className="text-sm">Para Eliminar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-300 rounded border border-gray-400"></div>
              <span className="text-sm">Punto Vacío</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-white rounded border border-gray-300"></div>
              <span className="text-sm">Sin planta registrada</span>
            </div>
          </div>

          {/* Matriz de plantas */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full border-collapse">
                <tbody>
                  {matriz.map((fila, i) => (
                    <tr key={i}>
                      <td className="sticky left-0 bg-gray-100 font-semibold text-center px-2 border border-gray-300">
                        Surco {i + 1}
                      </td>
                      {fila.map((planta, j) => (
                        <td key={j} className="p-1 border border-gray-300">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded transition-all duration-200 cursor-help ${getColorPorEstado(
                              planta
                            )} border`}
                            title={getTooltipText(planta)}
                          >
                            <div className="text-xs text-center text-white font-bold leading-10">
                              {planta ? planta.numero : ''}
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen estadístico */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-green-600">
                {plantas.filter((p) => p.estado === 'productivo').length}
              </div>
              <div className="text-sm text-gray-600">Productivos</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-red-600">
                {plantas.filter((p) => p.estado === 'para_eliminar').length}
              </div>
              <div className="text-sm text-gray-600">Para Eliminar</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-gray-600">
                {plantas.filter((p) => p.estado === 'punto_vacio').length}
              </div>
              <div className="text-sm text-gray-600">Puntos Vacíos</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-gray-800">
                {lote.total_plantas - plantas.length}
              </div>
              <div className="text-sm text-gray-600">Sin registrar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoteMapa;