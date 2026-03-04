// src/components/Granjas/GestionGranjas.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import granjaService from '../../services/granjaService';
import programaService from '../../services/programaService';
import asignacionService from '../../services/asignacionService';

interface ProgramaResumen {
  id: string;
  nombre: string;
}

interface GranjaConDetalles {
  id: string;
  nombre: string;
  ubicacion?: string;
  programas: ProgramaResumen[];
}

// Normaliza cualquier respuesta a un array
const normalizarArray = <T,>(respuesta: any): T[] => {
  if (Array.isArray(respuesta)) return respuesta;
  if (respuesta?.items && Array.isArray(respuesta.items)) return respuesta.items;
  if (respuesta?.data && Array.isArray(respuesta.data)) return respuesta.data;
  return [];
};

const GestionGranjas: React.FC = () => {
  const navigate = useNavigate();
  const [granjas, setGranjas] = useState<GranjaConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarGranjas = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener granjas
      const granjasResp = await granjaService.obtenerGranjas();
      const granjasData = normalizarArray<any>(granjasResp);
      console.log('Granjas obtenidas:', granjasData);

      // 2. Obtener todos los programas
      const programasResp = await programaService.obtenerProgramas();
      const todosProgramas = normalizarArray<any>(programasResp);
      console.log('Programas obtenidos:', todosProgramas);

      // 3. Obtener asignaciones programa-granja (desde tabla pivote)
      let asignaciones: { programa_id: number; granja_id: number }[] = [];
      try {
        asignaciones = await asignacionService.obtenerRelacionesProgramaGranja();
        console.log('Asignaciones obtenidas:', asignaciones);
      } catch (err) {
        console.error('Error al obtener asignaciones programa-granja:', err);
        setError('No se pudieron cargar las asignaciones de programas a granjas. Verifique el backend.');
        setLoading(false);
        return;
      }

      // 4. Construir mapa de programas por granja usando las asignaciones
      const programasPorGranja = new Map<string, any[]>();
      
      const programasMap = new Map<string, any>();
      todosProgramas.forEach(prog => programasMap.set(String(prog.id), prog));

      asignaciones.forEach(asig => {
        const programaId = String(asig.programa_id);
        const granjaId = String(asig.granja_id);
        
        const programa = programasMap.get(programaId);
        if (!programa) {
          console.warn(`Asignación refiere a programa inexistente: ${programaId}`);
          return;
        }

        if (!programasPorGranja.has(granjaId)) {
          programasPorGranja.set(granjaId, []);
        }
        programasPorGranja.get(granjaId)!.push(programa);
      });

      console.log('Mapa programasPorGranja:', Object.fromEntries(programasPorGranja));

      // 5. Para cada granja, armar su detalle (solo programas)
      const granjasConDetalles = granjasData.map(granja => {
        const granjaId = String(granja.id);
        const programasDeGranja = programasPorGranja.get(granjaId) || [];
        console.log(`Granja ${granja.nombre} (${granjaId}) tiene ${programasDeGranja.length} programas`);

        const programasResumen: ProgramaResumen[] = programasDeGranja.map(prog => ({
          id: String(prog.id),
          nombre: prog.nombre,
        }));

        return {
          id: granjaId,
          nombre: granja.nombre,
          ubicacion: granja.ubicacion,
          programas: programasResumen,
        };
      });

      console.log('Granjas con detalles:', granjasConDetalles);
      setGranjas(granjasConDetalles);
    } catch (err) {
      console.error('Error al cargar las granjas:', err);
      setError('No se pudo cargar la información. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const eliminarGranja = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta granja? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      await granjaService.eliminarGranja(Number(id));
      // Recargar la lista después de eliminar
      cargarGranjas();
    } catch (err) {
      console.error('Error al eliminar granja:', err);
      alert('Ocurrió un error al eliminar la granja. Intente nuevamente.');
    }
  };

  useEffect(() => {
    cargarGranjas();
  }, []);

  return (
    <div>
      {/* Cabecera */}
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
                {/* Cabecera de tarjeta con nombre, ubicación y acciones */}
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
                    {/* Botones de navegación a secciones de la granja */}
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
                    {/* Botón de editar */}
                    <button
                      onClick={() => navigate(`/granjas/editar/${granja.id}`)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                      title="Editar granja"
                    >
                      <i className="fas fa-edit text-xl"></i>
                    </button>
                    {/* Botón de eliminar */}
                    <button
                      onClick={() => eliminarGranja(granja.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Eliminar granja"
                    >
                      <i className="fas fa-trash text-xl"></i>
                    </button>
                  </div>
                </div>

                {/* Lista de programas asociados */}
                {granja.programas.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <i className="fas fa-tasks text-green-500 mr-2"></i>
                      Programas asignados
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {granja.programas.map(prog => (
                        <span
                          key={prog.id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                        >
                          {prog.nombre}
                        </span>
                      ))}
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