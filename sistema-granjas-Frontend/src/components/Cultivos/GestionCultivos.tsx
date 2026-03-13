import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import cultivoService from "../../services/cultivoService";
import granjaService from "../../services/granjaService";
import { StatsCard } from "../Common/StatsCard";
import CultivosTable from "./CultivosTable";
import CultivoForm from "./CultivosForm";
import type { CultivoFormData, CultivoEspecie } from "../../types/cultivoTypes";

export default function GestionCultivos() {
    const [searchParams] = useSearchParams();
    const programaId = searchParams.get("programaId");

    const [cultivos, setCultivos] = useState<CultivoEspecie[]>([]);
    const [granjas, setGranjas] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [erroresValidacion, setErroresValidacion] = useState<Record<string, string>>({});

    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        agricolas: 0,
        pecuarios: 0,
        activos: 0,
    });

    const [modalCrear, setModalCrear] = useState(false);
    const [cultivoSeleccionado, setCultivoSeleccionado] = useState<CultivoEspecie | null>(null);
    const [editando, setEditando] = useState(false);

    const [datosFormulario, setDatosFormulario] = useState<CultivoFormData>({
        nombre: "",
        tipo: "agricola",
        descripcion: "",
        estado: "activo",
        granja_id: 0,
    });

    useEffect(() => {
        cargarDatos();
    }, [programaId]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);

            let datosCultivos: CultivoEspecie[];

            if (programaId) {
                datosCultivos = await cultivoService.obtenerCultivosPorPrograma(Number(programaId));
            } else {
                datosCultivos = await cultivoService.obtenerCultivos();
            }

            const datosGranjas = await granjaService.obtenerGranjas();

            setCultivos(datosCultivos);
            setGranjas(datosGranjas);

            setEstadisticas({
                total: datosCultivos.length,
                agricolas: datosCultivos.filter((c) => c.tipo === "agricola").length,
                pecuarios: datosCultivos.filter((c) => c.tipo === "pecuario").length,
                activos: datosCultivos.filter((c) => c.estado === "activo").length,
            });
        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al cargar los datos";
            setError(mensaje);
            toast.error(mensaje);
        } finally {
            setCargando(false);
        }
    };

    const manejarCrear = async (e: React.FormEvent) => {
        e.preventDefault();

        setErroresValidacion({});
        setError(null);

        const loadingToast = toast.loading(editando ? "Actualizando..." : "Creando...");

        try {
            if (editando && cultivoSeleccionado) {
                await cultivoService.actualizarCultivo(cultivoSeleccionado.id, datosFormulario);
                toast.success("Actualizado exitosamente");
            } else {
                await cultivoService.crearCultivo(datosFormulario);
                toast.success("Creado exitosamente");
            }

            await cargarDatos();

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

    const abrirEditar = (cultivo: CultivoEspecie) => {
        setDatosFormulario({
            nombre: cultivo.nombre || "",
            tipo: cultivo.tipo || "agricola",
            descripcion: cultivo.descripcion || "",
            estado: cultivo.estado || "activo",
            granja_id: cultivo.granja_id || 0,
        });

        setCultivoSeleccionado(cultivo);
        setEditando(true);
        setModalCrear(true);
        setErroresValidacion({});
    };

    const manejarEliminar = async (id: number) => {
        if (!window.confirm("¿Eliminar este cultivo?")) return;

        try {
            await cultivoService.eliminarCultivo(id);
            toast.success("Eliminado exitosamente");
            await cargarDatos();
        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al eliminar";
            toast.error(mensaje);
        }
    };

    const resetFormulario = () => {
        setDatosFormulario({
            nombre: "",
            tipo: "agricola",
            descripcion: "",
            estado: "activo",
            granja_id: 0,
        });

        setErroresValidacion({});
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <span className="ml-4">Cargando...</span>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">
                {programaId ? "Cultivos del Programa" : "Gestión de Cultivos"}
            </h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatsCard icon="fas fa-leaf" color="bg-green-600" value={estadisticas.total} label="Total" />
                <StatsCard icon="fas fa-seedling" color="bg-emerald-600" value={estadisticas.agricolas} label="Agrícolas" />
                <StatsCard icon="fas fa-paw" color="bg-amber-600" value={estadisticas.pecuarios} label="Pecuarios" />
                <StatsCard icon="fas fa-check-circle" color="bg-blue-600" value={estadisticas.activos} label="Activos" />
            </div>

            <button
                onClick={() => {
                    resetFormulario();
                    setEditando(false);
                    setModalCrear(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg mb-4"
            >
                <i className="fas fa-plus mr-2"></i>
                Nuevo Cultivo
            </button>

            <CultivosTable
                cultivos={cultivos}
                onEditar={abrirEditar}
                onEliminar={manejarEliminar}
            />

            <CultivoForm
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
                granjas={granjas}
                erroresValidacion={erroresValidacion}
            />
        </div>
    );
}