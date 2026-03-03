// src/components/Granjas/GestionGranjas.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Importamos los servicios necesarios
import granjaService from '../services/granjaService';
import programaService from '../services/programaService';
import loteService from '../services/loteService';
import laboresService from '../services/laboresService';

// Interfaces para los datos enriquecidos
interface ProgramaResumen {
  id: string;
  nombre: string;
  cantidadLotes: number;
}

interface GranjaConDetalles {
  id: string;
  nombre: string;
  ubicacion?: string;
  programas: ProgramaResumen[];
  totalLotes: number;
  laboresPendientes: number;
}

const GestionGranjas: React.FC = () => {
  const navigate = useNavigate();
  const [granjas, setGranjas] = useState<GranjaConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar todos los datos jerárquicos
  const cargarGranjas = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener todas las granjas
      const granjasData = await granjaService.obtenerGranjas();
      if (!Array.isArray(granjasData)) {
        throw new Error('Formato de granjas inválido');
      }

      // 2. Para cada granja, obtener sus programas y lotes
      const granjasConDetalles = await Promise.all(
        granjasData.map(async (granja) => {
          // Obtener programas de esta granja
          let programas = [];
          try {
            // Intentar usar método específico si existe
            programas = await programaService.obtenerPorGranja?.(granja.id) || [];
          } catch {
            // Fallback: obtener todos y filtrar
            const todosProgramas = await programaService.obtenerProgramas();
            programas = Array.isArray(todosProgramas)
              ? todosProgramas.filter(p => p.granjaId === granja.id)
              : [];
          }

          // Para cada programa, obtener sus lotes
          const programasConLotes = await Promise.all(
            programas.map(async (prog) => {
              let lotes = [];
              try {
                lotes = await loteService.obtenerPorPrograma?.(prog.id) || [];
              } catch {
                const todosLotes = await loteService.obtenerLotes();
                const lotesArray = Array.isArray(todosLotes)
                  ? todosLotes
                  : todosLotes?.items || [];
                lotes = lotesArray.filter(l => l.programaId === prog.id);
              }
              return {
                id: prog.id,
                nombre: prog.nombre,
                cantidadLotes: lotes.length,
              };
            })
          );

          // Calcular total de lotes de la granja
          const totalLotes = programasConLotes.reduce((acc, p) => acc + p.cantidadLotes, 0);

          // Calcular labores pendientes para esta granja
          let laboresPendientes = 0;
          try {
            const laboresResponse = await laboresService.obtenerLabores();
            const todasLabores = Array.isArray(laboresResponse)
              ? laboresResponse
              : laboresResponse?.items || [];

            // Necesitamos los IDs de todos los lotes de la granja
            const lotesDeGranja = await Promise.all(
              programas.map(p => loteService.obtenerPorPrograma?.(p.id) || [])
            ).then(arr => arr.flat());

            const lotesIds = lotesDeGranja.map(l => l.id);
            laboresPendientes = todasLabores.filter(labor =>
              lotesIds.includes(labor.loteId) && labor.estado !== 'completada'
            ).length;
          } catch (e) {
            console.warn('No se pudieron cargar labores pendientes', e);
          }

          return {
            id: granja.id,
            nombre: granja.nombre,
            ubicacion: granja.ubicacion,
            programas: programasConLotes,
            totalLotes,
            laboresPendientes,
          };
        })
      );

      setGranjas(granjasConDetalles);
    } catch (err) {
      console.error('Error al cargar las granjas:', err);
      setError('No se pudo cargar la información. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarGranjas();
  }, []);

  return (
    <div>
      {/* Cabecera con título y acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Mis Granjas</h2>
        <div className="flex space-x-3">
          <button
            onClick={cargarGranjas}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'} mr-2`}></i>
            Actualizar
          </button>
          <button
            onClick={() => navigate('/granjas/nueva')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <i className="fas fa-plus mr-2"></i>
            Nueva Granja
          </button>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Estado de carga */}
      {loading && (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista de granjas */}
      {!loading && !error && (
        <div className="space-y-6">
          {granjas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <i className="fas fa-tractor text-gray-300 text-5xl mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay granjas registradas</h3>
              <p className="text-gray-500 mb-6">Comienza creando una nueva granja.</p>
              <button
                onClick={() => navigate('/granjas/nueva')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <i className="fas fa-plus mr-2"></i>
                Crear granja
              </button>
            </div>
          ) : (
            granjas.map(granja => (
              <div key={granja.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                {/* Cabecera de la tarjeta: nombre + acciones */}
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3
                      className="text-xl font-bold text-gray-800 cursor-pointer hover:text-green-600"
                      onClick={() => navigate(`/granjas/${granja.id}`)}
                    >
                      {granja.nombre}
                    </h3>
                    {granja.ubicacion && (
                      <p className="text-sm text-gray-500">{granja.ubicacion}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/granjas/${granja.id}/programas`)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      title="Programas"
                    >
                      <i className="fas fa-tasks text-xl"></i>
                    </button>
                    <button
                      onClick={() => navigate(`/granjas/${granja.id}/lotes`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Lotes"
                    >
                      <i className="fas fa-layer-group text-xl"></i>
                    </button>
                    <button
                      onClick={() => navigate(`/granjas/${granja.id}/inventario`)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                      title="Inventario"
                    >
                      <i className="fas fa-boxes text-xl"></i>
                    </button>
                    <button
                      onClick={() => navigate(`/granjas/${granja.id}/labores`)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                      title="Labores"
                    >
                      <i className="fas fa-calendar-check text-xl"></i>
                    </button>
                  </div>
                </div>

                {/* Métricas rápidas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-semibold text-green-600">{granja.programas.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Programas</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-semibold text-blue-600">{granja.totalLotes}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Lotes totales</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-semibold text-orange-600">{granja.laboresPendientes}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Labores pendientes</div>
                  </div>
                </div>

                {/* Programas destacados (máx. 3) */}
                {granja.programas.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <i className="fas fa-tasks text-green-500 mr-2"></i>
                      Programas activos
                    </h4>
                    <div className="space-y-2">
                      {granja.programas.slice(0, 3).map(prog => (
                        <div key={prog.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">{prog.nombre}</span>
                          <span className="text-gray-400 text-xs">{prog.cantidadLotes} lotes</span>
                          <button
                            onClick={() => navigate(`/programas/${prog.id}/lotes`)}
                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                          >
                            Ver lotes
                          </button>
                        </div>
                      ))}
                      {granja.programas.length > 3 && (
                        <div className="text-xs text-gray-400 mt-1">
                          +{granja.programas.length - 3} programas más
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GestionGranjas;