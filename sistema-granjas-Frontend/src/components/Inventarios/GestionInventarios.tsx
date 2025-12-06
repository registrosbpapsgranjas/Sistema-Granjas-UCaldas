import { useEffect, useState } from "react";
import inventarioService from "../../services/InventarioService";
import programaService from "../../services/programaService";
import { StatsCard } from "../Common/StatsCard";
import InventarioTabs from "./InventarioTabs";
import HerramientaForm from "./HerramientasForm";
import InsumoForm from "./InsumosForm";
import CategoriaForm from "../Categorias/CategoriasForm";
import type {
    Herramienta, HerramientaFormData,
    Insumo, InsumoFormData,
    CategoriaInventario, CategoriaFormData,
    InventarioStats
} from "../../types/Inventariotypes";

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

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);

            console.log('🔄 Cargando datos de inventario...');
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

            console.log('✅ Datos de inventario cargados exitosamente');
            setHerramientas(datosHerramientas);
            setInsumos(datosInsumos);
            setCategorias(datosCategorias);
            setProgramas(datosProgramas);
            setEstadisticas(datosEstadisticas);

        } catch (error: any) {
            console.error('❌ Error cargando inventario:', error);
            setError(error.message || 'Error al cargar los datos del inventario');
        } finally {
            setCargando(false);
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

            if (editandoHerramienta && herramientaSeleccionada) {
                await inventarioService.actualizarHerramienta(herramientaSeleccionada.id, formHerramienta);
                console.log('✅ Herramienta actualizada');
            } else {
                await inventarioService.crearHerramienta(formHerramienta);
                console.log('✅ Herramienta creada');
            }

            await cargarDatos();
            cerrarModalHerramienta();
        } catch (error: any) {
            console.error('❌ Error guardando herramienta:', error);
            setError(error.message || 'Error al guardar la herramienta');
        }
    };

    const manejarEliminarHerramienta = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar esta herramienta?")) return;

        try {
            setError(null);
            await inventarioService.eliminarHerramienta(id);
            console.log('✅ Herramienta eliminada');
            await cargarDatos();
        } catch (error: any) {
            console.error('❌ Error al eliminar herramienta:', error);
            setError(error.message || 'Error al eliminar la herramienta');
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

            if (editandoInsumo && insumoSeleccionado) {
                await inventarioService.actualizarInsumo(insumoSeleccionado.id, formInsumo);
                console.log('✅ Insumo actualizado');
            } else {
                await inventarioService.crearInsumo(formInsumo);
                console.log('✅ Insumo creado');
            }

            await cargarDatos();
            cerrarModalInsumo();
        } catch (error: any) {
            console.error('❌ Error guardando insumo:', error);
            setError(error.message || 'Error al guardar el insumo');
        }
    };

    const manejarEliminarInsumo = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este insumo?")) return;

        try {
            setError(null);
            await inventarioService.eliminarInsumo(id);
            console.log('✅ Insumo eliminado');
            await cargarDatos();
        } catch (error: any) {
            console.error('❌ Error al eliminar insumo:', error);
            setError(error.message || 'Error al eliminar el insumo');
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

            if (editandoCategoria && categoriaSeleccionada) {
                await inventarioService.actualizarCategoria(categoriaSeleccionada.id, formCategoria);
                console.log('✅ Categoría actualizada');
            } else {
                await inventarioService.crearCategoria(formCategoria);
                console.log('✅ Categoría creada');
            }

            await cargarDatos();
            cerrarModalCategoria();
        } catch (error: any) {
            console.error('❌ Error guardando categoría:', error);
            setError(error.message || 'Error al guardar la categoría');
        }
    };

    const manejarEliminarCategoria = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;

        try {
            setError(null);
            await inventarioService.eliminarCategoria(id);
            console.log('✅ Categoría eliminada');
            await cargarDatos();
        } catch (error: any) {
            console.error('❌ Error al eliminar categoría:', error);
            setError(error.message || 'Error al eliminar la categoría');
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

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gestión de Inventario</h1>

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
                    icon="fas fa-tools"
                    color="bg-blue-600"
                    value={estadisticas.total_herramientas}
                    label="Herramientas"
                />
                <StatsCard
                    icon="fas fa-flask"
                    color="bg-purple-600"
                    value={estadisticas.total_insumos}
                    label="Insumos"
                />
                <StatsCard
                    icon="fas fa-check-circle"
                    color="bg-green-600"
                    value={estadisticas.herramientas_disponibles + estadisticas.insumos_disponibles}
                    label="Disponibles"
                />
                <StatsCard
                    icon="fas fa-exclamation-triangle"
                    color="bg-yellow-600"
                    value={estadisticas.herramientas_agotadas + estadisticas.insumos_agotados + estadisticas.bajo_stock_insumos}
                    label="Alertas"
                />
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

                <button
                    onClick={() => {
                        setEditandoCategoria(false);
                        setModalCategoria(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i>
                    Nueva Categoría
                </button>
            </div>

            {/* Tabs con contenido */}
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