// GestionProgramas.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import programaService from "../../services/programaService";
import usuarioService from "../../services/usuarioService";
import granjaService from "../../services/granjaService";
import asignacionService from "../../services/asignacionService";
import exportService from "../../services/exportService";
import { StatsCard } from "../../components/Common/StatsCard";
import { ProgramaForm } from "../../components/Programas/ProgramasForm";
import { DetallesPrograma } from "../../components/Programas/DetallesPrograma";
import { AsignarUsuarioModal } from "../../components/Usuarios/AsignarUsuario";
import { AsignarGranjaModal } from "../../components/Granjas/AsignarGranja";
import ProgramasTable from "../../components/Programas/ProgramasTable";
import DashboardHeader from "../../components/Common/DashboardHeader";
import { normalizarArray } from "../../utils/normalize";
import type { Programa, Usuario, Granja } from "../../types/granjaTypes";

// ─── Tipos locales ────────────────────────────────────────────────────────────
interface AsignacionProgramaGranja {
  programa_id: number;
  granja_id: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Normaliza cualquier respuesta a un array seguro (copia defensiva del helper
 * de GestionGranjas, aquí usada como fallback inline por si el import falla).
 */
const toArray = <T,>(resp: unknown): T[] => {
  if (Array.isArray(resp)) return resp as T[];
  if (resp && typeof resp === "object") {
    const r = resp as Record<string, unknown>;
    if (Array.isArray(r.items)) return r.items as T[];
    if (Array.isArray(r.data)) return r.data as T[];
    if (Array.isArray(r.results)) return r.results as T[];
  }
  return [];
};

/** Convierte cualquier valor a número entero de forma segura. */
const toNum = (v: unknown): number => Number(v);

export default function GestionProgramas() {
  const { granjaId } = useParams<{ granjaId: string }>();
  const navigate = useNavigate();

  // ── Estado principal ────────────────────────────────────────────────────────
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [granjas, setGranjas] = useState<Granja[]>([]);
  const [granjaActual, setGranjaActual] = useState<Granja | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Modales ─────────────────────────────────────────────────────────────────
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalles, setModalDetalles] = useState(false);
  const [modalAsignarUsuario, setModalAsignarUsuario] = useState(false);
  const [modalAsignarGranja, setModalAsignarGranja] = useState(false);

  // ── Selecciones ─────────────────────────────────────────────────────────────
  const [programaSeleccionado, setProgramaSeleccionado] = useState<Programa | null>(null);
  const [usuariosPrograma, setUsuariosPrograma] = useState<Usuario[]>([]);
  const [granjasPrograma, setGranjasPrograma] = useState<Granja[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number>(0);
  const [granjaSeleccionada, setGranjaSeleccionada] = useState<number>(0);

  // ── Exportación ─────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  // ── Formulario ──────────────────────────────────────────────────────────────
  const [editando, setEditando] = useState(false);
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: "",
    descripcion: "",
    tipo: "agricola" as const,
    activo: true,
    granjas_ids: [] as number[],
  });

  const tiposPrograma = [
    { value: "agricola", label: "Agrícola", icon: "fas fa-seedling" },
    { value: "pecuario", label: "Pecuario", icon: "fas fa-paw" },
  ];

  // ── Carga de datos ──────────────────────────────────────────────────────────
  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granjaId]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      const granjaIdNum = granjaId ? Number(granjaId) : null;

      // Peticiones base comunes
      const [respProgramas, respUsuarios, respGranjas] = await Promise.all([
        programaService.obtenerProgramas(),
        usuarioService.obtenerUsuarios(),
        granjaService.obtenerGranjas(),
      ]);

      const todosProgramas = toArray<Programa>(respProgramas);
      setUsuarios(toArray<Usuario>(respUsuarios));
      setGranjas(toArray<Granja>(respGranjas));

      if (granjaIdNum) {
        // ── Vista filtrada por granja ──────────────────────────────────────

        // Cargar datos de la granja actual para el header
        try {
          const granja = await granjaService.obtenerGranjaPorId(granjaIdNum);
          setGranjaActual(granja ?? null);
        } catch {
          setGranjaActual(null);
        }

        // Obtener asignaciones programa ↔ granja
        let asignaciones: AsignacionProgramaGranja[] = [];
        try {
          const respAsig = await asignacionService.obtenerRelacionesProgramaGranja();
          asignaciones = toArray<AsignacionProgramaGranja>(respAsig);
        } catch (err) {
          console.error("Error al obtener asignaciones:", err);
          setError(
            "No se pudieron cargar las asignaciones. Verifique el backend."
          );
          setCargando(false);
          return;
        }

        // ✅ FILTRO CLAVE: comparación numérica estricta para evitar
        //    fallos por string/number mismatch devuelto por la API
        const programasFiltrados = todosProgramas.filter((programa) =>
          asignaciones.some(
            (a) =>
              toNum(a.programa_id) === toNum(programa.id) &&
              toNum(a.granja_id) === granjaIdNum
          )
        );

        setProgramas(programasFiltrados);
      } else {
        // ── Vista general (sin filtro de granja) ──────────────────────────
        setGranjaActual(null);
        setProgramas(todosProgramas);
      }
    } catch (err: any) {
      setError(err?.message ?? "Error al cargar los datos");
    } finally {
      setCargando(false);
    }
  };

  // ── CRUD Programas ──────────────────────────────────────────────────────────
  const manejarCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      if (editando && programaSeleccionado) {
        await programaService.actualizarPrograma(
          programaSeleccionado.id,
          datosFormulario
        );
      } else {
        const nuevoPrograma: Programa =
          await programaService.crearPrograma(datosFormulario);
        // Si estamos en vista filtrada, asignar automáticamente la granja
        if (granjaId && nuevoPrograma?.id) {
          await programaService.asignarGranja(
            nuevoPrograma.id,
            Number(granjaId)
          );
        }
      }
      await cargarDatos();
      cerrarModalCrear();
    } catch (err: any) {
      setError(err?.message ?? "Error al guardar el programa");
    }
  };

  const cerrarModalCrear = () => {
    setModalCrear(false);
    setEditando(false);
    setDatosFormulario({
      nombre: "",
      descripcion: "",
      tipo: "agricola",
      activo: true,
      granjas_ids: [],
    });
  };

  const abrirEditar = (programa: Programa) => {
    const granjasAsignadas = programa.granjas?.map((g: any) => toNum(g.id)) ?? [];
    setDatosFormulario({
      nombre: programa.nombre,
      descripcion: programa.descripcion ?? "",
      tipo: programa.tipo ?? "agricola",
      activo: programa.activo,
      granjas_ids: granjasAsignadas,
    });
    setProgramaSeleccionado(programa);
    setEditando(true);
    setModalCrear(true);
  };

  const abrirDetalles = async (programa: Programa) => {
    try {
      setProgramaSeleccionado(programa);
      const [respU, respG] = await Promise.all([
        programaService.obtenerUsuariosPorPrograma(programa.id),
        programaService.obtenerGranjasPorPrograma(programa.id),
      ]);
      setUsuariosPrograma(normalizarArray<Usuario>(respU));
      setGranjasPrograma(normalizarArray<Granja>(respG));
      setModalDetalles(true);
    } catch (err: any) {
      setError(err?.message ?? "Error al cargar los detalles");
    }
  };

  const manejarEliminar = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este programa?")) return;
    try {
      await programaService.eliminarPrograma(id);
      await cargarDatos();
    } catch (err: any) {
      setError(err?.message ?? "Error al eliminar el programa");
    }
  };

  // ── Asignaciones ────────────────────────────────────────────────────────────
  const asignarUsuario = async () => {
    if (!usuarioSeleccionado || !programaSeleccionado) return;
    try {
      await programaService.asignarUsuario(
        programaSeleccionado.id,
        usuarioSeleccionado
      );
      const updated = await programaService.obtenerUsuariosPorPrograma(
        programaSeleccionado.id
      );
      setUsuariosPrograma(normalizarArray<Usuario>(updated));
      setUsuarioSeleccionado(0);
      setModalAsignarUsuario(false);
    } catch (err: any) {
      setError(err?.message ?? "Error al asignar usuario");
    }
  };

  const asignarGranja = async () => {
    if (!granjaSeleccionada || !programaSeleccionado) return;
    try {
      await programaService.asignarGranja(
        programaSeleccionado.id,
        granjaSeleccionada
      );
      const updated = await programaService.obtenerGranjasPorPrograma(
        programaSeleccionado.id
      );
      setGranjasPrograma(normalizarArray<Granja>(updated));
      setGranjaSeleccionada(0);
      setModalAsignarGranja(false);
    } catch (err: any) {
      setError(err?.message ?? "Error al asignar granja");
    }
  };

  const removerUsuario = async (usuarioId: number) => {
    if (!programaSeleccionado) return;
    if (!confirm("¿Estás seguro de remover este usuario?")) return;
    try {
      await programaService.removerUsuario(programaSeleccionado.id, usuarioId);
      const updated = await programaService.obtenerUsuariosPorPrograma(
        programaSeleccionado.id
      );
      setUsuariosPrograma(normalizarArray<Usuario>(updated));
    } catch (err: any) {
      setError(err?.message ?? "Error al remover usuario");
    }
  };

  const removerGranja = async (gId: number) => {
    if (!programaSeleccionado) return;
    if (!confirm("¿Estás seguro de remover esta granja?")) return;
    try {
      await programaService.removerGranja(programaSeleccionado.id, gId);
      const updated = await programaService.obtenerGranjasPorPrograma(
        programaSeleccionado.id
      );
      setGranjasPrograma(normalizarArray<Granja>(updated));
    } catch (err: any) {
      setError(err?.message ?? "Error al remover granja");
    }
  };

  // ── Exportación ─────────────────────────────────────────────────────────────
  const handleExportProgramas = async () => {
    if (exporting) return;
    setExporting(true);
    setExportMessage("Exportando programas...");
    try {
      const result = granjaId
        ? await exportService.exportarProgramasPorGranja(Number(granjaId))
        : await exportService.exportarProgramas();
      setExportMessage(`¡Exportación completada! (${result.filename})`);
    } catch {
      setExportMessage("Error al exportar.");
    } finally {
      setExporting(false);
      setTimeout(() => setExportMessage(""), 5000);
    }
  };

  // ── Helpers UI ──────────────────────────────────────────────────────────────
  const obtenerLabelTipo = (tipo: string) =>
    tiposPrograma.find((t) => t.value === tipo)?.label ?? tipo;

  const obtenerIconoTipo = (tipo: string) =>
    tiposPrograma.find((t) => t.value === tipo)?.icon ?? "fas fa-question";

  // ── Render: cargando ────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <span className="ml-4 text-gray-600">Cargando programas...</span>
      </div>
    );
  }

  // ── Render principal ────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Cabecera */}
      <DashboardHeader
        title={
          granjaActual
            ? `Programas de ${granjaActual.nombre}`
            : "Gestión de Programas"
        }
        selectedModule="programas"
        onBack={granjaId ? () => navigate("/granjas") : undefined}
      />

      {/* Barra de exportación */}
      <div className="flex items-center space-x-3 m-2">
        {exportMessage && (
          <span
            className={`text-sm px-3 py-1 rounded ${
              exportMessage.includes("Error")
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {exportMessage}
          </span>
        )}
        <button
          onClick={handleExportProgramas}
          disabled={exporting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
        >
          <i className={`fas ${exporting ? "fa-spinner fa-spin" : "fa-file-excel"}`} />
          <span>{exporting ? "Exportando..." : "Exportar a Excel"}</span>
        </button>
      </div>

      {/* Alerta de error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle mr-2" />
            <strong>Error:</strong>&nbsp;{error}
          </div>
          <button
            onClick={() => setError(null)}
            className="float-right text-red-800 hover:text-red-900"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <StatsCard
          icon="fas fa-clipboard-list"
          color="bg-blue-600"
          value={programas.length}
          label="Programas Registrados"
        />
        <StatsCard
          icon="fas fa-seedling"
          color="bg-green-600"
          value={programas.filter((p) => p.tipo === "agricola").length}
          label="Programas Agrícolas"
        />
        <StatsCard
          icon="fas fa-paw"
          color="bg-amber-600"
          value={programas.filter((p) => p.tipo === "pecuario").length}
          label="Programas Pecuarios"
        />
      </div>

      {/* Botón nuevo programa */}
      <div className="mb-6">
        <button
          onClick={() => {
            setDatosFormulario({
              nombre: "",
              descripcion: "",
              tipo: "agricola",
              activo: true,
              granjas_ids: [],
            });
            setEditando(false);
            setModalCrear(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <i className="fas fa-plus" />
          Nuevo Programa
        </button>
        {granjaId && (
          <p className="text-sm text-gray-500 mt-2">
            * Los nuevos programas se asignarán automáticamente a esta granja.
          </p>
        )}
      </div>

      {/* Tabla */}
      <ProgramasTable
        programas={programas}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
        onVerDetalles={abrirDetalles}
        obtenerLabelTipo={obtenerLabelTipo}
        obtenerIconoTipo={obtenerIconoTipo}
      />

      {/* Modales */}
      <ProgramaForm
        isOpen={modalCrear}
        onClose={cerrarModalCrear}
        datosFormulario={datosFormulario}
        setDatosFormulario={setDatosFormulario}
        onSubmit={manejarCrear}
        editando={editando}
        tiposPrograma={tiposPrograma}
      />

      <DetallesPrograma
        isOpen={modalDetalles}
        onClose={() => setModalDetalles(false)}
        programa={programaSeleccionado}
        usuariosPrograma={usuariosPrograma}
        granjasPrograma={granjasPrograma}
        onAsignarUsuarioOpen={() => setModalAsignarUsuario(true)}
        onAsignarGranjaOpen={() => setModalAsignarGranja(true)}
        onRemoveUsuario={removerUsuario}
        onRemoveGranja={removerGranja}
        obtenerLabelTipo={obtenerLabelTipo}
        obtenerIconoTipo={obtenerIconoTipo}
      />

      <AsignarUsuarioModal
        isOpen={modalAsignarUsuario}
        onClose={() => {
          setModalAsignarUsuario(false);
          setUsuarioSeleccionado(0);
        }}
        usuarios={usuarios}
        usuariosAsignados={usuariosPrograma}
        usuarioSeleccionado={usuarioSeleccionado}
        setUsuarioSeleccionado={setUsuarioSeleccionado}
        onAsignar={asignarUsuario}
      />

      <AsignarGranjaModal
        isOpen={modalAsignarGranja}
        onClose={() => {
          setModalAsignarGranja(false);
          setGranjaSeleccionada(0);
        }}
        granjas={granjas}
        granjasAsignadas={granjasPrograma}
        granjaSeleccionada={granjaSeleccionada}
        setGranjaSeleccionada={setGranjaSeleccionada}
        onAsignar={asignarGranja}
      />
    </div>
  );
}
