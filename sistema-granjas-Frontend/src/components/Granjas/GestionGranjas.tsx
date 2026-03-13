import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import granjaService from '../../services/granjaService';
import programaService from '../../services/programaService';
import asignacionService from '../../services/asignacionService';
import { GranjaForm } from './GranjasForm';
import type { Granja, Programa } from '../../types/granjaTypes';

interface ProgramaResumen {
  id: number;
  nombre: string;
}

interface GranjaConDetalles extends Granja {
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

  // Estado para el modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [granjaActual, setGranjaActual] = useState<Partial<Granja>>({
    id: undefined,
    nombre: '',
    ubicacion: '',
    activo: true
  });

  const cargarGranjas = async () => {
    try {
      setLoading(true);
      setError(null);

      const granjasResp = await granjaService.obtenerGranjas();
      const granjasData = normalizarArray<Granja>(granjasResp);
      console.log('Granjas obtenidas:', granjasData);

      const programasResp = await programaService.obtenerProgramas();
      const todosProgramas = normalizarArray<Programa>(programasResp);
      console.log('Programas obtenidos:', todosProgramas);

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

      const programasPorGranja = new Map<number, Programa[]>();
      const programasMap = new Map<number, Programa>();
      todosProgramas.forEach(prog => programasMap.set(prog.id, prog));

      asignaciones.forEach(asig => {
        const programa = programasMap.get(asig.programa_id);
        if (!programa) return;
        const granjaId = asig.granja_id;
        if (!programasPorGranja.has(granjaId)) {
          programasPorGranja.set(granjaId, []);
        }
        programasPorGranja.get(granjaId)!.push(programa);
      });

      const granjasConDetalles: GranjaConDetalles[] = granjasData.map(granja => {
        const programasDeGranja = programasPorGranja.get(granja.id) || [];
        return {
          ...granja,
          programas: programasDeGranja.map(prog => ({
            id: prog.id,
            nombre: prog.nombre,
          })),
        };
      });

      setGranjas(granjasConDetalles);
    } catch (err) {
      console.error('Error al cargar las granjas:', err);
      setError('No se pudo cargar la información. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const eliminarGranja = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta granja? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      await granjaService.eliminarGranja(id);
      cargarGranjas();
    } catch (err) {
      console.error('Error al eliminar granja:', err);
      alert('Ocurrió un error al eliminar la granja. Intente nuevamente.');
    }
  };

  const abrirModalNueva = () => {
    setEditando(false);
    setGranjaActual({ id: undefined, nombre: '', ubicacion: '', activo: true });
    setModalAbierto(true);
  };

  const abrirModalEditar = (granja: GranjaConDetalles) => {
    setEditando(true);
    setGranjaActual({
      id: granja.id,
      nombre: granja.nombre,
      ubicacion: granja.ubicacion || '',
      activo: granja.activo !== undefined ? granja.activo : true
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editando && granjaActual.id) {
        await granjaService.actualizarGranja(granjaActual.id, {
          nombre: granjaActual.nombre!,
          ubicacion: granjaActual.ubicacion,
          activo: granjaActual.activo
        });
      } else {
        await granjaService.crearGranja({
          nombre: granjaActual.nombre!,
          ubicacion: granjaActual.ubicacion,
          activo: granjaActual.activo ?? true
        });
      }
      setModalAbierto(false);
      cargarGranjas();
    } catch (err) {
      console.error('Error al guardar granja:', err);
      alert('Ocurrió un error al guardar la granja. Intente nuevamente.');
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
            onClick={abrirModalNueva}
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
                onClick={abrirModalNueva}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <i className="fas fa-plus mr-2"></i>
                Crear granja
              </button>
            </div>
          ) : (
            granjas.map(granja => (
              <div key={granja.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
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
                    {granja.activo === false && (
                      <span className="inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs bg-red-100 text-red-800">
                        Inactiva
                      </span>
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
                      onClick={() => navigate(`/granjas/${granja.id}/inventario`)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                      title="Inventario"
                    >
                      <i className="fas fa-boxes text-xl"></i>
                    </button>
                    <button
                      onClick={() => abrirModalEditar(granja)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                      title="Editar granja"
                    >
                      <i className="fas fa-edit text-xl"></i>
                    </button>
                    <button
                      onClick={() => eliminarGranja(granja.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Eliminar granja"
                    >
                      <i className="fas fa-trash text-xl"></i>
                    </button>
                  </div>
                </div>

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

      {/* Modal de creación/edición */}
      <GranjaForm
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        datosFormulario={granjaActual}
        setDatosFormulario={setGranjaActual}
        onSubmit={handleSubmit}
        editando={editando}
      />
    </div>
  );
};

export default GestionGranjas;