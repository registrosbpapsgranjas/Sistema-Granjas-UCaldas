import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import granjaService from '../../services/granjaService';
import programaService from '../../services/programaService';
import asignacionService from '../../services/asignacionService';
import { GranjaForm } from './GranjaForm';
import type { Granja, Programa } from '../../types/granjaTypes';

interface ProgramaResumen {
  id: number;
  nombre: string;
}

interface GranjaConDetalles extends Granja {
  programas: ProgramaResumen[];
}

const normalizarArray = <T,>(respuesta: any): T[] => {
  if (Array.isArray(respuesta)) return respuesta;
  if (respuesta?.items) return respuesta.items;
  if (respuesta?.data) return respuesta.data;
  return [];
};

const GestionGranjas: React.FC = () => {
  const navigate = useNavigate();

  const [granjas, setGranjas] = useState<GranjaConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(false);

  const [granjaActual, setGranjaActual] = useState<Partial<Granja>>({
    nombre: '',
    ubicacion: '',
    activo: true
  });

  const cargarGranjas = async () => {
    try {
      setLoading(true);
      setError(null);

      const granjasData = normalizarArray<Granja>(
        await granjaService.obtenerGranjas()
      );

      const programas = normalizarArray<Programa>(
        await programaService.obtenerProgramas()
      );

      const asignaciones =
        await asignacionService.obtenerRelacionesProgramaGranja();

      const programasMap = new Map(programas.map(p => [p.id, p]));

      const programasPorGranja = new Map<number, Programa[]>();

      asignaciones.forEach((a: any) => {
        const programa = programasMap.get(a.programa_id);

        if (!programa) return;

        if (!programasPorGranja.has(a.granja_id)) {
          programasPorGranja.set(a.granja_id, []);
        }

        programasPorGranja.get(a.granja_id)!.push(programa);
      });

      const resultado: GranjaConDetalles[] = granjasData.map(g => ({
        ...g,
        programas:
          programasPorGranja.get(g.id)?.map(p => ({
            id: p.id,
            nombre: p.nombre
          })) || []
      }));

      setGranjas(resultado);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarGranja = async (id: number) => {
    if (!window.confirm('¿Eliminar granja?')) return;

    try {
      await granjaService.eliminarGranja(id);
      cargarGranjas();
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    cargarGranjas();
  }, []);

  const abrirModalNueva = () => {
    setEditando(false);
    setGranjaActual({
      nombre: '',
      ubicacion: '',
      activo: true
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (granja: Granja) => {
    setEditando(true);
    setGranjaActual(granja);
    setModalAbierto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editando && granjaActual.id) {
        await granjaService.actualizarGranja(granjaActual.id, granjaActual);
      } else {
        await granjaService.crearGranja({
          nombre: granjaActual.nombre!,
          ubicacion: granjaActual.ubicacion!,
          activo: granjaActual.activo ?? true
        });
      }

      setModalAbierto(false);
      cargarGranjas();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Mis Granjas</h2>

        <button
          onClick={abrirModalNueva}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Nueva Granja
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {loading && <p>Cargando...</p>}

      {!loading &&
        granjas.map(granja => (
          <div key={granja.id} className="border p-4 rounded mb-4">
            <h3
              className="font-bold cursor-pointer"
              onClick={() => navigate(`/granjas/${granja.id}`)}
            >
              {granja.nombre}
            </h3>

            <p>{granja.ubicacion}</p>

            <div className="flex gap-2 mt-2">
              <button onClick={() => abrirModalEditar(granja)}>Editar</button>

              <button onClick={() => eliminarGranja(granja.id)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}

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