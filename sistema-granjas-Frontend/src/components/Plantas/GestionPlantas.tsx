// src/components/Plantas/GestionPlantas.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import plantaService from "../../services/plantaService";
import loteService from "../../services/loteService"; // Asume que existe
import { StatsCard } from "../Common/StatsCard";
import PlantasTable from "./PlantasTable";
import PlantaForm from "./PlantaForm";
import type { PlantaResponse, PlantaCreate } from "../../types/plantaTypes";

interface LoteSimple {
  id: number;
  nombre: string;
  surcos: number;
  plantas_por_surco: number;
}

export default function GestionPlantas() {
  const [searchParams] = useSearchParams();
  const loteIdParam = searchParams.get("loteId");

  const [plantas, setPlantas] = useState<PlantaResponse[]>([]);
  const [lotes, setLotes] = useState<LoteSimple[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteSimple | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [erroresValidacion, setErroresValidacion] = useState<Record<string, string>>({});

  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    activas: 0,
    eliminadas: 0,
  });

  const [modalCrear, setModalCrear] = useState(false);
  const [plantaSeleccionada, setPlantaSeleccionada] = useState<PlantaResponse | null>(null);
  const [editando, setEditando] = useState(false);
  const [generando, setGenerando] = useState(false);

  const [datosFormulario, setDatosFormulario] = useState<PlantaCreate>({
    lote_id: loteIdParam ? Number(loteIdParam) : 0,
    surco: 1,
    numero: 1,
  });

  // Cargar lotes disponibles
  useEffect(() => {
    const cargarLotes = async () => {
      try {
        const data = await loteService.obtenerLotes(); // Asume método que trae todos los lotes
        setLotes(data);
        if (loteIdParam) {
          const lote = data.find((l: LoteSimple) => l.id === Number(loteIdParam));
          if (lote) setLoteSeleccionado(lote);
        }
      } catch (err) {
        console.error("Error cargando lotes:", err);
        toast.error("No se pudieron cargar los lotes");
      }
    };
    cargarLotes();
  }, [loteIdParam]);

  // Cargar plantas cuando cambia el lote seleccionado
  useEffect(() => {
    if (loteIdParam) {
      cargarPlantas(Number(loteIdParam));
    } else if (lotes.length > 0 && !loteSeleccionado) {
      // Si no hay filtro, cargar todas las plantas (opcional)
      cargarPlantas();
    }
  }, [loteIdParam, lotes]);

  const cargarPlantas = async (loteId?: number) => {
    try {
      setCargando(true);
      setError(null);
      const datos = await plantaService.obtenerPlantas(loteId);
      setPlantas(datos);

      setEstadisticas({
        total: datos.length,
        activas: datos.filter((p) => p.estado === "activa").length,
        eliminadas: datos.filter((p) => p.estado === "eliminada").length,
      });
    } catch (err: any) {
      const mensaje = err?.message || "Error al cargar plantas";
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setCargando(false);
    }
  };

  const manejarCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroresValidacion({});
    const loadingToast = toast.loading(editando ? "Actualizando..." : "Creando...");

    try {
      if (editando && plantaSeleccionada) {
        await plantaService.actualizarPlanta(plantaSeleccionada.id, {
          surco: datosFormulario.surco,
          numero: datosFormulario.numero,
        });
        toast.success("Planta actualizada");
      } else {
        await plantaService.crearPlanta(datosFormulario);
        toast.success("Planta creada");
      }

      await cargarPlantas(loteSeleccionado?.id);
      setModalCrear(false);
      setEditando(false);
      resetFormulario();
    } catch (err: any) {
      if (err.erroresValidacion) {
        setErroresValidacion(err.erroresValidacion);
        const primerError = Object.values(err.erroresValidacion)[0] as string;
        if (primerError) toast.error(primerError);
      } else {
        const mensaje = err?.message || "Error inesperado";
        setError(mensaje);
        toast.error(mensaje);
      }
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const abrirEditar = (planta: PlantaResponse) => {
    setDatosFormulario({
      lote_id: planta.lote_id,
      surco: planta.surco,
      numero: planta.numero,
      codigo: planta.codigo,
    });
    setPlantaSeleccionada(planta);
    setEditando(true);
    setModalCrear(true);
    setErroresValidacion({});
  };

  const manejarEliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar esta planta? (Cambiará a estado 'eliminada')")) return;
    try {
      await plantaService.eliminarPlanta(id);
      toast.success("Planta eliminada");
      await cargarPlantas(loteSeleccionado?.id);
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar");
    }
  };

  const generarPlantasParaLote = async () => {
    if (!loteSeleccionado) {
      toast.error("Seleccione un lote primero");
      return;
    }
    if (!window.confirm(`¿Generar automáticamente todas las plantas del lote "${loteSeleccionado.nombre}"?`)) {
      return;
    }
    setGenerando(true);
    try {
      const response = await plantaService.generarPlantasParaLote(loteSeleccionado.id);
      toast.success(response.mensaje);
      await cargarPlantas(loteSeleccionado.id);
    } catch (err: any) {
      toast.error(err?.message || "Error al generar plantas");
    } finally {
      setGenerando(false);
    }
  };

  const resetFormulario = () => {
    setDatosFormulario({
      lote_id: loteSeleccionado?.id || 0,
      surco: 1,
      numero: 1,
    });
    setErroresValidacion({});
  };

  const cambiarLote = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    const lote = lotes.find((l) => l.id === id);
    setLoteSeleccionado(lote || null);
    if (id) {
      cargarPlantas(id);
    } else {
      cargarPlantas();
    }
    setDatosFormulario((prev) => ({ ...prev, lote_id: id }));
  };

  if (cargando && plantas.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <span className="ml-4">Cargando plantas...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Plantas</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Filtro por lote */}
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-1">Filtrar por lote</label>
          <select
            value={loteSeleccionado?.id || ""}
            onChange={cambiarLote}
            className="border rounded px-3 py-2 min-w-[200px]"
          >
            <option value="">Todos los lotes</option>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>
        </div>

        {loteSeleccionado && (
          <button
            onClick={generarPlantasParaLote}
            disabled={generando}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg mt-5 disabled:opacity-50"
          >
            {generando ? "Generando..." : "Generar plantas desde lote"}
          </button>
        )}
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard icon="fas fa-seedling" color="bg-green-600" value={estadisticas.total} label="Total Plantas" />
        <StatsCard icon="fas fa-check-circle" color="bg-blue-600" value={estadisticas.activas} label="Activas" />
        <StatsCard icon="fas fa-trash-alt" color="bg-red-600" value={estadisticas.eliminadas} label="Eliminadas" />
      </div>

      {/* Botón nuevo (solo si hay lote seleccionado) */}
      {loteSeleccionado && (
        <button
          onClick={() => {
            resetFormulario();
            setEditando(false);
            setModalCrear(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg mb-4"
        >
          <i className="fas fa-plus mr-2"></i>
          Nueva Planta
        </button>
      )}

      {/* Tabla */}
      <PlantasTable
        plantas={plantas}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
        loteNombre={loteSeleccionado?.nombre}
      />

      {/* Modal de formulario */}
      <PlantaForm
        isOpen={modalCrear}
        onClose={() => {
          setModalCrear(false);
          setEditando(false);
          resetFormulario();
        }}
        datosFormulario={datosFormulario}
        setDatosFormulario={setDatosFormulario}
        onSubmit={manejarCrear}
        editando={editando}
        lotes={lotes}
        erroresValidacion={erroresValidacion}
      />
    </div>
  );
}