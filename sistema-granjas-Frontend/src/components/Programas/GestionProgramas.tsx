import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import programaService from "../../services/programaService";
import usuarioService from "../../services/usuarioService";
import granjaService from "../../services/granjaService";
import exportService from "../../services/exportService";
import { StatsCard } from "../Common/StatsCard";
import { ProgramaForm } from "./ProgramasForm";
import { DetallesPrograma } from "./DetallesPrograma";
import { AsignarUsuarioModal } from "../Usuarios/AsignarUsuario";
import { AsignarGranjaModal } from "../Granjas/AsignarGranja";
import ProgramasTable from "./ProgramasTable";
import { normalizarArray } from "../../utils/normalize";
import type { Programa, Usuario, Granja } from "../../types/granjaTypes";
import toast from "react-hot-toast";

export default function GestionProgramas() {
  const { granjaId } = useParams<{ granjaId: string }>();
  console.log('Valor granja id: ', granjaId)
  if (granjaId) {
    localStorage.setItem("granjaid", granjaId)
  }
  const navigate = useNavigate();
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [granjas, setGranjas] = useState<Granja[]>([]);
  const [granjaActual, setGranjaActual] = useState<Granja | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [erroresValidacion, setErroresValidacion] = useState<Record<string, string>>({});
  
  // 👇 NUEVO: Estado para controlar envío
  const [enviando, setEnviando] = useState(false);

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalles, setModalDetalles] = useState(false);
  const [modalAsignarUsuario, setModalAsignarUsuario] = useState(false);
  const [modalAsignarGranja, setModalAsignarGranja] = useState(false);

  // Selecciones
  const [programaSeleccionado, setProgramaSeleccionado] = useState<Programa | null>(null);
  const [usuariosPrograma, setUsuariosPrograma] = useState<Usuario[]>([]);
  const [granjasPrograma, setGranjasPrograma] = useState<Granja[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number>(0);
  const [granjaSeleccionada, setGranjaSeleccionada] = useState<number>(0);

  // Exportación
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Formulario
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
    { value: "pecuario", label: "Pecuario", icon: "fas fa-paw" }
  ];

  // Efecto para cargar datos cuando cambia granjaId
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError(null);
        setErroresValidacion({});

        console.log("🆔 granjaId desde URL:", granjaId);

        // Obtener información de la granja si hay ID
        if (granjaId) {
          try {
            const granja = await granjaService.obtenerGranjaPorId(Number(granjaId));
            setGranjaActual(granja);
            console.log("🏠 Granja obtenida:", granja);
          } catch (err) {
            console.error("Error al obtener granja:", err);
          }
        } else {
          setGranjaActual(null);
        }

        // Obtener usuarios y granjas (para los modales)
        const usuariosResp = await usuarioService.obtenerUsuarios();
        const granjasResp = await granjaService.obtenerGranjas();
        setUsuarios(normalizarArray<Usuario>(usuariosResp));
        setGranjas(normalizarArray<Granja>(granjasResp));

        // ===== OBTENER PROGRAMAS CON SUS GRANJAS =====
        if (granjaId) {
          // Usar el método optimizado del servicio
          const programasConGranjas = await programaService.obtenerProgramasPorGranjaConGranjas(Number(granjaId));
          setProgramas(programasConGranjas);
          console.log(`✅ Programas filtrados para granja ${granjaId}:`, programasConGranjas);
        } else {
          // Vista general: cargar todos los programas con sus granjas
          const programasConGranjas = await programaService.obtenerProgramasConGranjas();
          setProgramas(programasConGranjas);
          console.log("✅ Programas con granjas:", programasConGranjas);
        }
      } catch (error: any) {
        console.error("❌ Error en cargarDatos:", error);
        setError(error.message || "Error al cargar los datos");
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [granjaId]);

  const manejarCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 👇 PREVENIR DOBLE ENVÍO
    if (enviando) {
      console.log("⏳ Ya se está procesando un envío...");
      return;
    }
    
    setEnviando(true);
    setErroresValidacion({});

    try {
      setError(null);

      if (editando && programaSeleccionado) {
        await programaService.actualizarPrograma(programaSeleccionado.id, datosFormulario);
        toast.success("Programa actualizado correctamente");
      } else {
        const nuevoPrograma = await programaService.crearPrograma(datosFormulario);

        if (granjaId && nuevoPrograma) {
          await programaService.asignarGranja(nuevoPrograma.id, Number(granjaId));
        }
        toast.success("Programa creado correctamente");
      }

      // 👇 CERRAR MODAL PRIMERO
      cerrarModalCrear();
      
      // 👇 LUEGO RECARGAR DATOS (sin recargar la página)
      await cargarDatos();

    } catch (error: any) {
      console.error("❌ Error al guardar programa:", error);

      if (error.erroresValidacion) {
        setErroresValidacion(error.erroresValidacion);
        const primerError = Object.values(error.erroresValidacion)[0];
        toast.error(primerError);
      } else {
        const mensaje = error.message || "Error al guardar el programa";
        setError(mensaje);
        toast.error(mensaje);
      }
    } finally {
      // 👇 SIEMPRE DESACTIVAR ESTADO DE ENVÍO
      setEnviando(false);
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
      granjas_ids: []
    });
    setProgramaSeleccionado(null);
    setErroresValidacion({});
    setEnviando(false); // 👈 IMPORTANTE: resetear también este estado
  };

  const abrirEditar = (programa: Programa) => {
    const granjasAsignadas = programa.granjas?.map((g: any) => g.id) || [];
    setDatosFormulario({
      nombre: programa.nombre,
      descripcion: programa.descripcion || "",
      tipo: programa.tipo || "agricola",
      activo: programa.activo,
      granjas_ids: granjasAsignadas,
    });
    setProgramaSeleccionado(programa);
    setEditando(true);
    setModalCrear(true);
    setErroresValidacion({});
  };

  const abrirDetalles = async (programa: Programa) => {
    try {
      setProgramaSeleccionado(programa);

      if (programa.granjas && programa.granjas.length > 0) {
        setGranjasPrograma(programa.granjas);
      } else {
        const granjas = await programaService.obtenerGranjasPorPrograma(programa.id);
        setGranjasPrograma(normalizarArray<Granja>(granjas));
      }

      const usuarios = await programaService.obtenerUsuariosPorPrograma(programa.id);
      setUsuariosPrograma(normalizarArray<Usuario>(usuarios));

      setModalDetalles(true);
    } catch (error: any) {
      setError(error.message || "Error al cargar los detalles");
    }
  };

  const manejarEliminar = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este programa?")) return;
    try {
      await programaService.eliminarPrograma(id);
      await cargarDatos();
      toast.success("Programa eliminado correctamente");
    } catch (error: any) {
      setError(error.message || "Error al eliminar el programa");
      toast.error(error.message || "Error al eliminar el programa");
    }
  };

  const asignarUsuario = async () => {
    if (!usuarioSeleccionado || !programaSeleccionado) return;
    try {
      await programaService.asignarUsuario(programaSeleccionado.id, usuarioSeleccionado);
      const usuariosActualizados = await programaService.obtenerUsuariosPorPrograma(programaSeleccionado.id);
      setUsuariosPrograma(normalizarArray<Usuario>(usuariosActualizados));
      setUsuarioSeleccionado(0);
      setModalAsignarUsuario(false);
      toast.success("Usuario asignado correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al asignar usuario");
    }
  };

  const asignarGranja = async () => {
    if (!granjaSeleccionada || !programaSeleccionado) return;
    try {
      await programaService.asignarGranja(programaSeleccionado.id, granjaSeleccionada);
      const granjasActualizadas = await programaService.obtenerGranjasPorPrograma(programaSeleccionado.id);
      setGranjasPrograma(normalizarArray<Granja>(granjasActualizadas));

      setProgramas(programas.map(p =>
        p.id === programaSeleccionado.id
          ? { ...p, granjas: granjasActualizadas }
          : p
      ));

      setGranjaSeleccionada(0);
      setModalAsignarGranja(false);
      toast.success("Granja asignada correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al asignar granja");
    }
  };

  const removerUsuario = async (usuarioId: number) => {
    if (!programaSeleccionado) return;
    if (!confirm("¿Estás seguro de remover este usuario?")) return;
    try {
      await programaService.removerUsuario(programaSeleccionado.id, usuarioId);
      const usuariosActualizados = await programaService.obtenerUsuariosPorPrograma(programaSeleccionado.id);
      setUsuariosPrograma(normalizarArray<Usuario>(usuariosActualizados));
      toast.success("Usuario removido correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al remover usuario");
    }
  };

  const removerGranja = async (granjaId: number) => {
    if (!programaSeleccionado) return;
    if (!confirm("¿Estás seguro de remover esta granja?")) return;
    try {
      await programaService.removerGranja(programaSeleccionado.id, granjaId);
      const granjasActualizadas = await programaService.obtenerGranjasPorPrograma(programaSeleccionado.id);
      setGranjasPrograma(normalizarArray<Granja>(granjasActualizadas));

      setProgramas(programas.map(p =>
        p.id === programaSeleccionado.id
          ? { ...p, granjas: granjasActualizadas }
          : p
      ));
      toast.success("Granja removida correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al remover granja");
    }
  };

  const handleExportProgramas = async () => {
    if (exporting) return;
    setExporting(true);
    setExportMessage("Exportando programas...");
    try {
      const result = granjaId
        ? await exportService.exportarProgramasPorGranja(Number(granjaId))
        : await exportService.exportarProgramas();
      setExportMessage(`¡Exportación completada! (${result.filename})`);
      setTimeout(() => setExportMessage(""), 5000);
      toast.success("Exportación completada");
    } catch (error) {
      setExportMessage("Error al exportar.");
      toast.error("Error al exportar");
      setTimeout(() => setExportMessage(""), 5000);
    } finally {
      setExporting(false);
    }
  };

  const obtenerLabelTipo = (tipo: string) => {
    const tipoObj = tiposPrograma.find(t => t.value === tipo);
    return tipoObj ? tipoObj.label : tipo;
  };

  const obtenerIconoTipo = (tipo: string) => {
    const tipoObj = tiposPrograma.find(t => t.value === tipo);
    return tipoObj ? tipoObj.icon : "fas fa-question";
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Cargando programas...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 m-2 mb-4">
        {exportMessage && (
          <span className={`text-sm px-3 py-1 rounded ${exportMessage.includes("Error")
              ? "bg-red-100 text-red-600"
              : "bg-green-100 text-green-600"
            }`}>
            {exportMessage}
          </span>
        )}
        <button
          onClick={handleExportProgramas}
          disabled={exporting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
        >
          <i className={`fas ${exporting ? "fa-spinner fa-spin" : "fa-file-excel"}`}></i>
          <span>{exporting ? "Exportando..." : "Exportar a Excel"}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            <strong>Error:</strong> {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="float-right text-red-800 hover:text-red-900"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          icon="fas fa-clipboard-list"
          color="bg-blue-600"
          value={programas.length}
          label="Programas Registrados"
        />
        <StatsCard
          icon="fas fa-seedling"
          color="bg-green-600"
          value={programas.filter(p => p.tipo === "agricola").length}
          label="Programas Agrícolas"
        />
        <StatsCard
          icon="fas fa-paw"
          color="bg-amber-600"
          value={programas.filter(p => p.tipo === "pecuario").length}
          label="Programas Pecuarios"
        />
      </div>

      <div className="mb-6">
        <button
          onClick={() => {
            setDatosFormulario({
              nombre: "",
              descripcion: "",
              tipo: "agricola",
              activo: true,
              granjas_ids: []
            });
            setEditando(false);
            setModalCrear(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Nuevo Programa
        </button>
      </div>

      <ProgramasTable
        programas={programas}
        onEditar={abrirEditar}
        onEliminar={manejarEliminar}
        onVerDetalles={abrirDetalles}
        obtenerLabelTipo={obtenerLabelTipo}
        obtenerIconoTipo={obtenerIconoTipo}
      />

      <ProgramaForm
        isOpen={modalCrear}
        onClose={cerrarModalCrear}
        datosFormulario={datosFormulario}
        setDatosFormulario={setDatosFormulario}
        onSubmit={manejarCrear}
        editando={editando}
        tiposPrograma={tiposPrograma}
        erroresValidacion={erroresValidacion}
        enviando={enviando}  // 👑 NUEVA PROP
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