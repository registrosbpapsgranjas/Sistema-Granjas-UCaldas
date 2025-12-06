import { useEffect, useState } from "react";
import { loteService } from "../../services/loteService";
import granjaService from "../../services/granjaService";
import programaService from "../../services/programaService";
import { StatsCard } from "../Common/StatsCard";
import LotesTable from "./LotesTable";
import LoteForm from "./LotesForm";
import TiposLoteModal from "./TiposLote";

export default function GestionLotes() {
    const [lotes, setLotes] = useState<any[]>([]);
    const [tiposLote, setTiposLote] = useState<any[]>([]);
    const [granjas, setGranjas] = useState<any[]>([]);
    const [programas, setProgramas] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modales
    const [modalCrear, setModalCrear] = useState(false);
    const [modalTiposLote, setModalTiposLote] = useState(false);

    // Selecciones
    const [loteSeleccionado, setLoteSeleccionado] = useState<any>(null);
    const [editando, setEditando] = useState(false);

    // Formulario
    const [datosFormulario, setDatosFormulario] = useState({
        nombre: "",
        tipo_lote_id: 0,
        granja_id: 0,
        programa_id: 0,
        nombre_cultivo: "",
        tipo_gestion: "Convencional",
        fecha_inicio: new Date().toISOString().split('T')[0],
        duracion_dias: 30,
        estado: "activo",
        cultivo_id: null as number | null,
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);

            console.log('🔄 Cargando datos de lotes...');
            const [datosLotes, datosTiposLote, datosGranjas, datosProgramas] = await Promise.all([
                loteService.obtenerLotes(),
                loteService.obtenerTiposLote(),
                granjaService.obtenerGranjas(),
                programaService.obtenerProgramas()
            ]);

            console.log('✅ Datos cargados exitosamente');
            setLotes(datosLotes);
            setTiposLote(datosTiposLote);
            setGranjas(datosGranjas);
            setProgramas(datosProgramas);

        } catch (error: any) {
            console.error('❌ Error cargando datos:', error);
            setError(error.message || 'Error al cargar los datos');
        } finally {
            setCargando(false);
        }
    };

    const manejarCrear = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setError(null);
            console.log('📤 Guardando lote...', datosFormulario);

            if (editando && loteSeleccionado) {
                await loteService.actualizarLote(loteSeleccionado.id, datosFormulario);
                console.log('✅ Lote actualizado');
            } else {
                await loteService.crearLote(datosFormulario);
                console.log('✅ Lote creado');
            }

            await cargarDatos();
            setModalCrear(false);
            setEditando(false);
            resetFormulario();
        } catch (error: any) {
            console.error('❌ Error guardando lote:', error);
            setError(error.message || 'Error al guardar el lote');
        }
    };

    const abrirEditar = (lote: any) => {
        setDatosFormulario({
            nombre: lote.nombre || "",
            tipo_lote_id: lote.tipo_lote_id || 0,
            granja_id: lote.granja_id || 0,
            programa_id: lote.programa_id || 0,
            nombre_cultivo: lote.nombre_cultivo || "",
            tipo_gestion: lote.tipo_gestion || "Convencional",
            fecha_inicio: lote.fecha_inicio ? new Date(lote.fecha_inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            duracion_dias: lote.duracion_dias || 30,
            estado: lote.estado || "activo",
            cultivo_id: lote.cultivo_id || null,
        });
        setLoteSeleccionado(lote);
        setEditando(true);
        setModalCrear(true);
    };

    const manejarEliminar = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este lote?")) return;

        try {
            setError(null);
            await loteService.eliminarLote(id);
            console.log('✅ Lote eliminado');
            await cargarDatos();
        } catch (error: any) {
            console.error('❌ Error al eliminar lote:', error);
            setError(error.message || 'Error al eliminar el lote');
        }
    };

    const resetFormulario = () => {
        setDatosFormulario({
            nombre: "",
            tipo_lote_id: 0,
            granja_id: 0,
            programa_id: 0,
            nombre_cultivo: "",
            tipo_gestion: "Convencional",
            fecha_inicio: new Date().toISOString().split('T')[0],
            duracion_dias: 30,
            estado: "activo",
            cultivo_id: null,
        });
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <span className="ml-4 text-gray-600">Cargando lotes...</span>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gestión de Lotes</h1>

            {/* Mostrar error global */}
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

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    icon="fas fa-seedling"
                    color="bg-green-600"
                    value={lotes.length}
                    label="Lotes Totales"
                />
                <StatsCard
                    icon="fas fa-tractor"
                    color="bg-blue-600"
                    value={lotes.filter(l => l.estado === 'activo').length}
                    label="Lotes Activos"
                />
                <StatsCard
                    icon="fas fa-warehouse"
                    color="bg-purple-600"
                    value={granjas.length}
                    label="Granjas"
                />
                <StatsCard
                    icon="fas fa-list"
                    color="bg-yellow-600"
                    value={tiposLote.length}
                    label="Tipos de Lote"
                />
            </div>

            {/* Botones de acción */}
            <div className="mb-6 flex gap-4">
                <button
                    onClick={() => {
                        resetFormulario();
                        setEditando(false);
                        setModalCrear(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i>
                    Nuevo Lote
                </button>

                <button
                    onClick={() => setModalTiposLote(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <i className="fas fa-cog"></i>
                    Gestionar Tipos de Lote
                </button>
            </div>

            {/* Tabla de lotes */}
            <LotesTable
                lotes={lotes}
                onEditar={abrirEditar}
                onEliminar={manejarEliminar}
            />

            {/* Modal de formulario */}
            <LoteForm
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
                tiposLote={tiposLote}
                granjas={granjas}
                programas={programas}
            />

            {/* Modal de tipos de lote */}
            <TiposLoteModal
                isOpen={modalTiposLote}
                onClose={() => setModalTiposLote(false)}
                tiposLote={tiposLote}
                onRefresh={cargarDatos}
            />
        </div>
    );
}