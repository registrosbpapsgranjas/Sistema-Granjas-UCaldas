import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import inventarioService from "../../services/InventarioService";
import programaService from "../../services/programaService";
import { StatsCard } from "../Common/StatsCard";
import InventarioTabs from "./InventarioTabs";
import HerramientaForm from "./HerramientasForm";
import InsumoForm from "./InsumosForm";
import CategoriaForm from "../Categorias/CategoriasForm";
import MovimientosTab from "./MovimientosTab";
import type {
    Herramienta, HerramientaFormData,
    Insumo, InsumoFormData,
    CategoriaInventario, CategoriaFormData,
    InventarioStats
} from "../../types/Inventariotypes";
import exportService from "../../services/exportService";

export default function GestionInventario() {
    const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
    const [insumos, setInsumos] = useState<Insumo[]>([]);
    const [categorias, setCategorias] = useState<CategoriaInventario[]>([]);
    const [programas, setProgramas] = useState<any[]>([]);
    const [estadisticas, setEstadisticas] = useState<InventarioStats>({
        total_herramientas: 0,
        total_insumos: 0,
        herramientas_disponibles: 0,
        insumos_disponibles: 0,
        herramientas_agotadas: 0,
        insumos_agotados: 0,
        bajo_stock_insumos: 0,
        movimientos_recientes: 0
    });

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modales
    const [modalHerramienta, setModalHerramienta] = useState(false);
    const [modalInsumo, setModalInsumo] = useState(false);
    const [modalCategoria, setModalCategoria] = useState(false);

    // Selecciones
    const [herramientaSeleccionada, setHerramientaSeleccionada] = useState<Herramienta | null>(null);
    const [insumoSeleccionado, setInsumoSeleccionado] = useState<Insumo | null>(null);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaInventario | null>(null);

    const [editandoHerramienta, setEditandoHerramienta] = useState(false);
    const [editandoInsumo, setEditandoInsumo] = useState(false);
    const [editandoCategoria, setEditandoCategoria] = useState(false);

    // Estados específicos para exportación
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');

    // Estado para la pestaña activa
    const [tabActiva, setTabActiva] = useState<'inventario' | 'movimientos'>('inventario');

    // Formularios
    const [formHerramienta, setFormHerramienta] = useState<HerramientaFormData>({
        nombre: "",
        descripcion: "",
        categoria_id: 0,
        cantidad_total: 0,
        cantidad_disponible: 0,
        estado: "disponible"
    });

    const [formInsumo, setFormInsumo] = useState<InsumoFormData>({
        nombre: "",
        descripcion: "",
        programa_id: 0,
        cantidad_total: 0,
        cantidad_disponible: 0,
        unidad_medida: "unidades",
        nivel_alerta: 0,
        estado: "disponible"
    });

    const [formCategoria, setFormCategoria] = useState<CategoriaFormData>({
        nombre: "",
        descripcion: ""
    });

    // Función para calcular estadísticas desde las listas
    const calcularEstadisticasDesdeListas = (
        herramientasList: Herramienta[],
        insumosList: Insumo[]
    ) => {
        // Calcular para herramientas
        const total_herramientas = herramientasList.length;
        const herramientas_disponibles = herramientasList.reduce(
            (total, herramienta) => total + (herramienta.cantidad_disponible || 0),
            0
        );

        // Calcular para insumos
        const total_insumos = insumosList.length;
        const insumos_disponibles = insumosList.reduce(
            (total, insumo) => total + (insumo.cantidad_disponible || 0),
            0
        );

        return {
            total_herramientas,
            total_insumos,
            herramientas_disponibles,
            insumos_disponibles
        };
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);

            console.log('🔄 Cargando datos de inventario...');
            const loadingToast = toast.loading('Cargando inventario...');

            const [
                datosHerramientas,
                datosInsumos,
                datosCategorias,
                datosProgramas,
                datosEstadisticas
            ] = await Promise.all([
                inventarioService.obtenerHerramientas(),
                inventarioService.obtenerInsumos(),
                inventarioService.obtenerCategorias(),
                programaService.obtenerProgramas(),
                inventarioService.obtenerEstadisticas(30)
            ]);

            toast.dismiss(loadingToast);
            console.log('✅ Datos de inventario cargados exitosamente');

            setHerramientas(datosHerramientas);
            setInsumos(datosInsumos);
            setCategorias(datosCategorias);
            setProgramas(datosProgramas);

            // Calcular estadísticas basadas en las listas
            const estadisticasCalculadas = calcularEstadisticasDesdeListas(
                datosHerramientas,
                datosInsumos
            );

            // Actualizar las estadísticas con los valores calculados
            // Mantenemos las otras estadísticas del servidor si las necesitas
            setEstadisticas(prev => ({
                ...prev,
                ...estadisticasCalculadas
            }));

        } catch (error: any) {
            console.error('❌ Error cargando inventario:', error);
            setError(error.message || 'Error al cargar los datos del inventario');
            toast.error('Error al cargar los datos del inventario', {
                duration: 4000,
                position: 'top-right'
            });
        } finally {
            setCargando(false);
        }
    };

    // Actualizar estadísticas cuando cambian las listas
    useEffect(() => {
        if (herramientas.length > 0 || insumos.length > 0) {
            const nuevasEstadisticas = calcularEstadisticasDesdeListas(herramientas, insumos);
            setEstadisticas(prev => ({
                ...prev,
                ...nuevasEstadisticas
            }));
        }
    }, [herramientas, insumos]);

    // ========== HANDLERS DE EXPORTACIÓN ==========
    const handleExportInventario = async () => {
        if (exporting) return;
        setExporting(true);
        setExportMessage('Exportando inventario...');

        try {
            const loadingToast = toast.loading('Exportando inventario...');
            const result = await exportService.exportarInventario();

            toast.dismiss(loadingToast);
            toast.success('Inventario exportado exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error: any) {
            console.error('❌ Error exportando inventario:', error);

            toast.error('Error al exportar inventario', {
                duration: 4000,
                position: 'top-right'
            });

            setExportMessage('Error al exportar.');
            setTimeout(() => setExportMessage(''), 5000);
        } finally {
            setExporting(false);
        }
    };

    // Handler para exportar movimientos
    const handleExportMovimientos = async () => {
        if (exporting) return;
        setExporting(true);
        setExportMessage('Exportando movimientos...');

        try {
            const loadingToast = toast.loading('Exportando movimientos...');
            const result = await exportService.exportarMovimientos();

            toast.dismiss(loadingToast);
            toast.success('Movimientos exportados exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error: any) {
            console.error('❌ Error exportando movimientos:', error);

            toast.error('Error al exportar movimientos', {
                duration: 4000,
                position: 'top-right'
            });

            setExportMessage('Error al exportar.');
            setTimeout(() => setExportMessage(''), 5000);
        } finally {
            setExporting(false);
        }
    };

    // ========== MANEJO HERRAMIENTAS ==========
    const abrirEditarHerramienta = (herramienta: Herramienta) => {
        setFormHerramienta({
            nombre: herramienta.nombre || "",
            descripcion: herramienta.descripcion || "",
            categoria_id: herramienta.categoria_id || 0,
            cantidad_total: herramienta.cantidad_total || 0,
            cantidad_disponible: herramienta.cantidad_disponible || 0,
            estado: herramienta.estado || "disponible"
        });
        setHerramientaSeleccionada(herramienta);
        setEditandoHerramienta(true);
        setModalHerramienta(true);
    };

    const manejarGuardarHerramienta = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setError(null);
            const loadingToast = toast.loading(
                editandoHerramienta ? 'Actualizando herramienta...' : 'Creando herramienta...'
            );

            if (editandoHerramienta && herramientaSeleccionada) {
                await inventarioService.actualizarHerramienta(herramientaSeleccionada.id, formHerramienta);

                toast.dismiss(loadingToast);
                toast.success('Herramienta actualizada exitosamente', {
                    duration: 3000,
                    position: 'top-right'
                });

                console.log('✅ Herramienta actualizada');
            } else {
                await inventarioService.crearHerramienta(formHerramienta);

                toast.dismiss(loadingToast);
                toast.success('Herramienta creada exitosamente', {
                    duration: 3000,
                    position: 'top-right'
                });

                console.log('✅ Herramienta creada');
            }

            await cargarDatos();
            cerrarModalHerramienta();
        } catch (error: any) {
            console.error('❌ Error guardando herramienta:', error);
            setError(error.message || 'Error al guardar la herramienta');

            toast.error(`Error al guardar herramienta: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const manejarEliminarHerramienta = async (id: number) => {
        const confirmar = window.confirm("¿Estás seguro de eliminar esta herramienta?\nEsta acción no se puede deshacer.");
        if (!confirmar) return;

        try {
            setError(null);
            const loadingToast = toast.loading('Eliminando herramienta...');

            await inventarioService.eliminarHerramienta(id);

            toast.dismiss(loadingToast);
            toast.success('Herramienta eliminada exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            console.log('✅ Herramienta eliminada');
            await cargarDatos();
        } catch (error: any) {
            console.error('❌ Error al eliminar herramienta:', error);
            setError(error.message || 'Error al eliminar la herramienta');

            toast.error(`Error al eliminar herramienta: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const cerrarModalHerramienta = () => {
        setModalHerramienta(false);
        setEditandoHerramienta(false);
        setHerramientaSeleccionada(null);
        setFormHerramienta({
            nombre: "",
            descripcion: "",
            categoria_id: 0,
            cantidad_total: 0,
            cantidad_disponible: 0,
            estado: "disponible"
        });
    };

    // ========== MANEJO INSUMOS ==========
    const abrirEditarInsumo = (insumo: Insumo) => {
        setFormInsumo({
            nombre: insumo.nombre || "",
            descripcion: insumo.descripcion || "",
            programa_id: insumo.programa_id || 0,
            cantidad_total: insumo.cantidad_total || 0,
            cantidad_disponible: insumo.cantidad_disponible || 0,
            unidad_medida: insumo.unidad_medida || "unidades",
            nivel_alerta: insumo.nivel_alerta || 0,
            estado: insumo.estado || "disponible"
        });
        setInsumoSeleccionado(insumo);
        setEditandoInsumo(true);
        setModalInsumo(true);
    };

    const manejarGuardarInsumo = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setError(null);
            const loadingToast = toast.loading(
                editandoInsumo ? 'Actualizando insumo...' : 'Creando insumo...'
            );

            if (editandoInsumo && insumoSeleccionado) {
                await inventarioService.actualizarInsumo(insumoSeleccionado.id, formInsumo);

                toast.dismiss(loadingToast);
                toast.success('Insumo actualizado exitosamente', {
                    duration: 3000,
                    position: 'top-right'
                });

                console.log('✅ Insumo actualizado');
            } else {
                await inventarioService.crearInsumo(formInsumo);

                toast.dismiss(loadingToast);
                toast.success('Insumo creado exitosamente', {
                    duration: 3000,
                    position: 'top-right'
                });

                console.log('✅ Insumo creado');
            }

            await cargarDatos();
            cerrarModalInsumo();
        } catch (error: any) {
            console.error('❌ Error guardando insumo:', error);
            setError(error.message || 'Error al guardar el insumo');

            toast.error(`Error al guardar insumo: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const manejarEliminarInsumo = async (id: number) => {
        const confirmar = window.confirm("¿Estás seguro de eliminar este insumo?\nEsta acción no se puede deshacer.");
        if (!confirmar) return;

        try {
            setError(null);
            const loadingToast = toast.loading('Eliminando insumo...');

            await inventarioService.eliminarInsumo(id);

            toast.dismiss(loadingToast);
            toast.success('Insumo eliminado exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            console.log('✅ Insumo eliminado');
            await cargarDatos();
        } catch (error: any) {
            console.error('❌ Error al eliminar insumo:', error);
            setError(error.message || 'Error al eliminar el insumo');

            toast.error(`Error al eliminar insumo: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const cerrarModalInsumo = () => {
        setModalInsumo(false);
        setEditandoInsumo(false);
        setInsumoSeleccionado(null);
        setFormInsumo({
            nombre: "",
            descripcion: "",
            programa_id: 0,
            cantidad_total: 0,
            cantidad_disponible: 0,
            unidad_medida: "unidades",
            nivel_alerta: 0,
            estado: "disponible"
        });
    };

    // ========== MANEJO CATEGORÍAS ==========
    const abrirEditarCategoria = (categoria: CategoriaInventario) => {
        setFormCategoria({
            nombre: categoria.nombre || "",
            descripcion: categoria.descripcion || ""
        });
        setCategoriaSeleccionada(categoria);
        setEditandoCategoria(true);
        setModalCategoria(true);
    };

    const manejarGuardarCategoria = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setError(null);
            const loadingToast = toast.loading(
                editandoCategoria ? 'Actualizando categoría...' : 'Creando categoría...'
            );

            if (editandoCategoria && categoriaSeleccionada) {
                await inventarioService.actualizarCategoria(categoriaSeleccionada.id, formCategoria);

                toast.dismiss(loadingToast);
                toast.success('Categoría actualizada exitosamente', {
                    duration: 3000,
                    position: 'top-right'
                });

                console.log('✅ Categoría actualizada');
            } else {
                await inventarioService.crearCategoria(formCategoria);

                toast.dismiss(loadingToast);
                toast.success('Categoría creada exitosamente', {
                    duration: 3000,
                    position: 'top-right'
                });

                console.log('✅ Categoría creada');
            }

            await cargarDatos();
            cerrarModalCategoria();
        } catch (error: any) {
            console.error('❌ Error guardando categoría:', error);
            setError(error.message || 'Error al guardar la categoría');

            toast.error(`Error al guardar categoría: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const manejarEliminarCategoria = async (id: number) => {
        const confirmar = window.confirm("¿Estás seguro de eliminar esta categoría?\nEsta acción no se puede deshacer.");
        if (!confirmar) return;

        try {
            setError(null);
            const loadingToast = toast.loading('Eliminando categoría...');

            await inventarioService.eliminarCategoria(id);

            toast.dismiss(loadingToast);
            toast.success('Categoría eliminada exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            console.log('✅ Categoría eliminada');
            await cargarDatos();
        } catch (error: any) {
            console.error('❌ Error al eliminar categoría:', error);
            setError(error.message || 'Error al eliminar la categoría');

            toast.error(`Error al eliminar categoría: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const cerrarModalCategoria = () => {
        setModalCategoria(false);
        setEditandoCategoria(false);
        setCategoriaSeleccionada(null);
        setFormCategoria({
            nombre: "",
            descripcion: ""
        });
    };

    // ========== RENDER ==========
    if (cargando) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <span className="ml-4 text-gray-600">Cargando inventario...</span>
            </div>
        );
    }

    console.log("Estadisticas calculadas: ", estadisticas);
    console.log("Total herramientas:", estadisticas.total_herramientas, "Disponibles:", estadisticas.herramientas_disponibles);
    console.log("Total insumos:", estadisticas.total_insumos, "Disponibles:", estadisticas.insumos_disponibles);

    return (
        <div className="p-6">
            {/* Encabezado con tabs y botones */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Gestión de Inventario</h1>

                    <div className="flex items-center space-x-3">
                        {exportMessage && (
                            <span className={`text-sm px-3 py-1 rounded ${exportMessage.includes('Error')
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-green-600'
                                }`}>
                                {exportMessage}
                            </span>
                        )}

                        <button
                            onClick={tabActiva === 'inventario' ? handleExportInventario : handleExportMovimientos}
                            disabled={exporting}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
                        >
                            <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                            <span>{exporting ? 'Exportando...' : 'Exportar a Excel'}</span>
                        </button>
                    </div>
                </div>

                {/* Tabs de navegación */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setTabActiva('inventario')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${tabActiva === 'inventario'
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <i className="fas fa-boxes mr-2"></i>
                            Inventarioo
                        </button>

                        <button
                            onClick={() => setTabActiva('movimientos')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${tabActiva === 'movimientos'
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <i className="fas fa-exchange-alt mr-2"></i>
                            Movimientos
                        </button>
                    </nav>
                </div>
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

            {/* Contenido según la pestaña activa */}
            {tabActiva === 'inventario' ? (
                <>
                    {/* Estadísticas del inventario - SOLO 2 CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Card de Herramientas */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center mb-3">
                                <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                                    <i className="fas fa-tools text-xl"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Herramientas</h3>
                                    <p className="text-sm text-gray-600">Gestión de herramientas del inventario</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{estadisticas.total_herramientas}</div>
                                    <div className="text-sm text-gray-600">Total</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{estadisticas.herramientas_disponibles}</div>
                                    <div className="text-sm text-gray-600">Disponibles</div>
                                </div>
                            </div>
                        </div>

                        {/* Card de Insumos */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center mb-3">
                                <div className="p-3 rounded-lg bg-purple-100 text-purple-600 mr-4">
                                    <i className="fas fa-flask text-xl"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Insumos</h3>
                                    <p className="text-sm text-gray-600">Gestión de insumos del inventario</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">{estadisticas.total_insumos}</div>
                                    <div className="text-sm text-gray-600">Total</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{estadisticas.insumos_disponibles}</div>
                                    <div className="text-sm text-gray-600">Disponibles</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="mb-6 flex flex-wrap gap-3">
                        <button
                            onClick={() => {
                                setEditandoHerramienta(false);
                                setModalHerramienta(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <i className="fas fa-plus"></i>
                            Nueva Herramienta
                        </button>

                        <button
                            onClick={() => {
                                setEditandoInsumo(false);
                                setModalInsumo(true);
                            }}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                        >
                            <i className="fas fa-plus"></i>
                            Nuevo Insumo
                        </button>
                    </div>

                    {/* Tabs con contenido del inventario */}
                    <InventarioTabs
                        herramientas={herramientas}
                        insumos={insumos}
                        categorias={categorias}
                        onEditarHerramienta={abrirEditarHerramienta}
                        onEliminarHerramienta={manejarEliminarHerramienta}
                        onEditarInsumo={abrirEditarInsumo}
                        onEliminarInsumo={manejarEliminarInsumo}
                        onEditarCategoria={abrirEditarCategoria}
                        onEliminarCategoria={manejarEliminarCategoria}
                    />
                </>
            ) : (
                <>
                    {/* Sección de movimientos */}
                    <div className="mb-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center">
                                <i className="fas fa-info-circle text-blue-500 text-xl mr-3"></i>
                                <div>
                                    <h4 className="font-medium text-blue-800">Registro de Movimientos</h4>
                                    <p className="text-blue-700 text-sm">
                                        Esta sección muestra todos los movimientos de inventario (entradas, salidas, ajustes y transferencias).
                                        Filtra por tipo o fecha para encontrar información específica.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Componente MovimientosTab */}
                        <MovimientosTab tipo="todos" />
                    </div>
                </>
            )}

            {/* Modales */}
            <HerramientaForm
                isOpen={modalHerramienta}
                onClose={cerrarModalHerramienta}
                datosFormulario={formHerramienta}
                setDatosFormulario={setFormHerramienta}
                onSubmit={manejarGuardarHerramienta}
                editando={editandoHerramienta}
                categorias={categorias}
            />

            <InsumoForm
                isOpen={modalInsumo}
                onClose={cerrarModalInsumo}
                datosFormulario={formInsumo}
                setDatosFormulario={setFormInsumo}
                onSubmit={manejarGuardarInsumo}
                editando={editandoInsumo}
                programas={programas}
            />

            <CategoriaForm
                isOpen={modalCategoria}
                onClose={cerrarModalCategoria}
                datosFormulario={formCategoria}
                setDatosFormulario={setFormCategoria}
                onSubmit={manejarGuardarCategoria}
                editando={editandoCategoria}
            />
        </div>
    );
}