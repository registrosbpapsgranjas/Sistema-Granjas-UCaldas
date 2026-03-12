// src/components/Cultivos/GestionCultivos.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import cultivoService from "../../services/cultivoService";
import granjaService from "../../services/granjaService";
import { StatsCard } from "../Common/StatsCard";
import CultivosTable from "./CultivosTable";
import CultivoForm from "./CultivoForm";
import exportService from "../../services/exportService";
import type { CultivoFormData, CultivoEspecie } from "../../types/cultivoTypes";

export default function GestionCultivos() {
    const [searchParams] = useSearchParams();
    const programaId = searchParams.get('programaId');
    
    const [cultivos, setCultivos] = useState<CultivoEspecie[]>([]);
    const [granjas, setGranjas] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // ✅ Estadísticas calculadas localmente (sin completados)
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        agricolas: 0,
        pecuarios: 0,
        activos: 0
    });

    // Modales
    const [modalCrear, setModalCrear] = useState(false);

    // Selecciones
    const [cultivoSeleccionado, setCultivoSeleccionado] = useState<CultivoEspecie | null>(null);
    const [editando, setEditando] = useState(false);

    // Formulario - SIN fecha_inicio NI duracion_dias
    const [datosFormulario, setDatosFormulario] = useState<CultivoFormData>({
        nombre: "",
        tipo: "agricola",
        descripcion: "",
        estado: "activo",
        granja_id: 0,
    });

    // Exportación
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');

    // Mostrar indicador de filtro activo
    useEffect(() => {
        if (programaId) {
            console.log(`🔍 Filtrando cultivos por programa ID: ${programaId}`);
        }
    }, [programaId]);

    // Handler para exportar cultivos
    const handleExportCultivos = async () => {
        if (exporting) return;

        setExporting(true);
        setExportMessage('Exportando cultivos...');

        try {
            const loadingToast = toast.loading('Exportando cultivos...');
            const result = await exportService.exportarCultivos();

            toast.dismiss(loadingToast);
            toast.success('Exportación completada exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error: any) {
            console.error('❌ Error exportando cultivos:', error);

            toast.error('Error al exportar cultivos', {
                duration: 4000,
                position: 'top-right'
            });

            setExportMessage('Error al exportar.');
            setTimeout(() => setExportMessage(''), 5000);
        } finally {
            setExporting(false);
        }
    };

    // ✅ Función para calcular estadísticas locales (sin completados)
    const calcularEstadisticasLocales = (cultivosData: CultivoEspecie[]) => {
        return {
            total: cultivosData.length,
            agricolas: cultivosData.filter(c => c.tipo?.toLowerCase() === 'agricola').length,
            pecuarios: cultivosData.filter(c => c.tipo?.toLowerCase() === 'pecuario').length,
            activos: cultivosData.filter(c => c.estado?.toLowerCase() === 'activo').length
        };
    };

    useEffect(() => {
        cargarDatos();
    }, [programaId]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);

            console.log('🔄 Cargando datos de cultivos...', programaId ? `para programa ${programaId}` : 'todos');
            const loadingToast = toast.loading('Cargando datos...');

            let datosCultivos: CultivoEspecie[];
            
            // Lógica de filtrado por programa
            if (programaId) {
                datosCultivos = await cultivoService.obtenerCultivosPorPrograma(Number(programaId));
            } else {
                datosCultivos = await cultivoService.obtenerCultivos();
            }

            // Obtener granjas (siempre se necesitan para los formularios)
            const datosGranjas = await granjaService.obtenerGranjas();

            toast.dismiss(loadingToast);
            console.log('✅ Datos cargados exitosamente');

            setCultivos(datosCultivos);
            setGranjas(datosGranjas);
            
            // ✅ Calcular estadísticas locales
            setEstadisticas(calcularEstadisticasLocales(datosCultivos));

        } catch (error: any) {
            console.error('❌ Error cargando datos:', error);
            setError(error.message || 'Error al cargar los datos');
            toast.error('Error al cargar los datos de cultivos', {
                duration: 4000,
                position: 'top-right'
            });
        } finally {
            setCargando(false);
        }
    };

    const manejarCrear = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setError(null);
            console.log('📤 Guardando cultivo...', datosFormulario);

            const loadingToast = toast.loading(
                editando ? 'Actualizando cultivo...' : 'Creando cultivo...'
            );

            if (editando && cultivoSeleccionado) {
                await cultivoService.actualizarCultivo(cultivoSeleccionado.id, datosFormulario);
                toast.dismiss(loadingToast);
                toast.success('Cultivo actualizado exitosamente', {
                    duration: 3000,
                    position: 'top-right'
                });
            } else {
                await cultivoService.crearCultivo(datosFormulario);
                toast.dismiss(loadingToast);
                toast.success('Cultivo creado exitosamente', {
                    duration: 3000,
                    position: 'top-right'
                });
            }

            await cargarDatos();
            setModalCrear(false);
            setEditando(false);
            resetFormulario();

        } catch (error: any) {
            console.error('❌ Error guardando cultivo:', error);
            setError(error.message || 'Error al guardar el cultivo');

            toast.dismiss();
            toast.error(`Error al guardar cultivo: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
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
    };

    const manejarEliminar = async (id: number) => {
        const confirmar = window.confirm("¿Estás seguro de eliminar este cultivo/especie?\nEsta acción no se puede deshacer.");
        if (!confirmar) return;

        try {
            setError(null);
            const loadingToast = toast.loading('Eliminando cultivo...');

            await cultivoService.eliminarCultivo(id);

            toast.dismiss(loadingToast);
            toast.success('Cultivo eliminado exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            await cargarDatos();

        } catch (error: any) {
            console.error('❌ Error al eliminar cultivo:', error);
            setError(error.message || 'Error al eliminar el cultivo');

            toast.error(`Error al eliminar cultivo: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
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
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <span className="ml-4 text-gray-600">
                    {programaId ? 'Cargando cultivos del programa...' : 'Cargando cultivos...'}
                </span>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    {programaId ? `Cultivos del Programa` : "Gestión de Cultivos/Especies"}
                </h1>
            </div>

            {/* Mensaje de exportación */}
            <div className="flex items-center space-x-3 m-2 mb-6">
                {exportMessage && (
                    <span className={`text-sm px-3 py-1 rounded ${exportMessage.includes('Error')
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-600'
                        }`}>
                        {exportMessage}
                    </span>
                )}

                <button
                    onClick={handleExportCultivos}
                    disabled={exporting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
                >
                    <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                    <span>{exporting ? 'Exportando...' : 'Exportar a Excel'}</span>
                </button>
            </div>

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

            {/* ✅ Estadísticas ahora calculadas localmente (sin completados) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    icon="fas fa-leaf"
                    color="bg-green-600"
                    value={estadisticas.total}
                    label="Total Cultivos"
                />
                <StatsCard
                    icon="fas fa-seedling"
                    color="bg-emerald-600"
                    value={estadisticas.agricolas}
                    label="Agrícolas"
                />
                <StatsCard
                    icon="fas fa-paw"
                    color="bg-amber-600"
                    value={estadisticas.pecuarios}
                    label="Pecuario"
                />
                <StatsCard
                    icon="fas fa-check-circle"
                    color="bg-blue-600"
                    value={estadisticas.activos}
                    label="Activos"
                />
            </div>

            {/* Botón Crear */}
            <div className="mb-6">
                <button
                    onClick={() => {
                        resetFormulario();
                        setEditando(false);
                        setModalCrear(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i>
                    Nuevo Cultivo/Especie
                </button>
            </div>

            {/* Tabla de cultivos */}
            <CultivosTable
                cultivos={cultivos}
                onEditar={abrirEditar}
                onEliminar={manejarEliminar}
            />

            {/* Modal de formulario */}
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
            />
        </div>
    );
}