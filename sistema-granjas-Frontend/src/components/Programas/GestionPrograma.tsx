// src/components/GestionProgramas.tsx
import { useEffect, useState } from "react";

// Services
import programaService from "../../services/programaService";
import usuarioService from "../../services/usuarioService";
import granjaService from "../../services/granjaService";

// Components
import { StatsCard } from "../Common/StatsCard";
import { ProgramaForm } from "./ProgramasForm";
import { DetallesPrograma } from "./DetallesPrograma";
import { AsignarUsuarioModal } from "../Usuarios/AsignarUsuario";
import { AsignarGranjaModal } from "../Granjas/AsignarGranja";
import ProgramasTable from "./ProgramasTable";
import exportService from "../../services/exportService";

export default function GestionProgramas() {
    const [programas, setProgramas] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [granjas, setGranjas] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modales
    const [modalCrear, setModalCrear] = useState(false);
    const [modalDetalles, setModalDetalles] = useState(false);
    const [modalAsignarUsuario, setModalAsignarUsuario] = useState(false);
    const [modalAsignarGranja, setModalAsignarGranja] = useState(false);

    // Selecciones
    const [programaSeleccionado, setProgramaSeleccionado] = useState<any>(null);
    const [usuariosPrograma, setUsuariosPrograma] = useState<any[]>([]);
    const [granjasPrograma, setGranjasPrograma] = useState<any[]>([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number>(0);
    const [granjaSeleccionada, setGranjaSeleccionada] = useState<number>(0);

    // Estados específicos para exportación
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');

    // Handler para exportar programas
    const handleExportProgramas = async () => {
        if (exporting) return;
        setExporting(true);
        setExportMessage('Exportando programas...');

        try {
            const result = await exportService.exportarProgramas();
            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error) {
            console.error('❌ Error exportando programas:', error);
            setExportMessage('Error al exportar.');
            setTimeout(() => setExportMessage(''), 5000);
        } finally {
            setExporting(false);
        }
    };

    // Formulario
    const [editando, setEditando] = useState(false);
    const [datosFormulario, setDatosFormulario] = useState({
        nombre: "",
        descripcion: "",
        tipo: "agricola", // Valor por defecto: agrícola
        activo: true,
    });

    // Tipos de programa disponibles
    const tiposPrograma = [
        { value: "agricola", label: "Agrícola", icon: "fas fa-seedling" },
        { value: "pecuario", label: "Pecuario", icon: "fas fa-paw" },
        { value: "prueba", label: "Prueba", icon: "fas fa-flask" }
    ];

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);

            console.log('🔄 Cargando datos de programas...');
            const [datosProgramas, datosUsuarios, datosGranjas] = await Promise.all([
                programaService.obtenerProgramas(),
                usuarioService.obtenerUsuarios(),
                granjaService.obtenerGranjas()
            ]);

            console.log('✅ Datos cargados exitosamente');
            setProgramas(datosProgramas);
            setUsuarios(datosUsuarios);
            setGranjas(datosGranjas);

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
            console.log('📤 Guardando programa...', datosFormulario);

            if (editando) {
                await programaService.actualizarPrograma(programaSeleccionado.id, datosFormulario);
                console.log('✅ Programa actualizado');
            } else {
                await programaService.crearPrograma(datosFormulario);
                console.log('✅ Programa creado');
            }

            await cargarDatos();
            setModalCrear(false);
            setEditando(false);
            setDatosFormulario({
                nombre: "",
                descripcion: "",
                tipo: "agricola",
                activo: true
            });
        } catch (error: any) {
            console.error('❌ Error guardando programa:', error);
            setError(error.message || 'Error al guardar el programa');
        }
    };

    const abrirEditar = (programa: any) => {
        setDatosFormulario({
            nombre: programa.nombre,
            descripcion: programa.descripcion || "",
            tipo: programa.tipo || "agricola",
            activo: programa.activo
        });
        setProgramaSeleccionado(programa);
        setEditando(true);
        setModalCrear(true);
    };

    const abrirDetalles = async (programa: any) => {
        try {
            setError(null);
            setProgramaSeleccionado(programa);

            console.log('🔍 Cargando detalles de programa...');
            const [usuarios, granjas] = await Promise.all([
                programaService.obtenerUsuariosPorPrograma(programa.id),
                programaService.obtenerGranjasPorPrograma(programa.id)
            ]);

            setUsuariosPrograma(usuarios);
            setGranjasPrograma(granjas);
            setModalDetalles(true);
        } catch (error: any) {
            console.error('❌ Error al cargar detalles:', error);
            setError(error.message || 'Error al cargar los detalles');
        }
    };

    const manejarEliminar = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este programa?")) return;

        try {
            setError(null);
            await programaService.eliminarPrograma(id);
            console.log('✅ Programa eliminado');
            await cargarDatos();
        } catch (error: any) {
            console.error('❌ Error al eliminar programa:', error);
            setError(error.message || 'Error al eliminar el programa');
        }
    };

    const asignarUsuario = async () => {
        if (!usuarioSeleccionado) return;

        try {
            setError(null);
            await programaService.asignarUsuario(programaSeleccionado.id, usuarioSeleccionado);
            console.log('✅ Usuario asignado al programa');

            // Actualizar lista de usuarios del programa
            const usuariosActualizados = await programaService.obtenerUsuariosPorPrograma(programaSeleccionado.id);
            setUsuariosPrograma(usuariosActualizados);

            setUsuarioSeleccionado(0);
            setModalAsignarUsuario(false);
        } catch (error: any) {
            console.error('❌ Error al asignar usuario:', error);
            setError(error.message || 'Error al asignar usuario al programa');
        }
    };

    const asignarGranja = async () => {
        if (!granjaSeleccionada) return;

        try {
            setError(null);
            await programaService.asignarGranja(programaSeleccionado.id, granjaSeleccionada);
            console.log('✅ Granja asignada al programa');

            // Actualizar lista de granjas del programa
            const granjasActualizadas = await programaService.obtenerGranjasPorPrograma(programaSeleccionado.id);
            setGranjasPrograma(granjasActualizadas);

            setGranjaSeleccionada(0);
            setModalAsignarGranja(false);
        } catch (error: any) {
            console.error('❌ Error al asignar granja:', error);
            setError(error.message || 'Error al asignar granja al programa');
        }
    };

    const removerUsuario = async (usuarioId: number) => {
        if (!confirm("¿Estás seguro de remover este usuario del programa?")) return;

        try {
            setError(null);
            await programaService.removerUsuario(programaSeleccionado.id, usuarioId);
            console.log('✅ Usuario removido del programa');

            const usuariosActualizados = await programaService.obtenerUsuariosPorPrograma(programaSeleccionado.id);
            setUsuariosPrograma(usuariosActualizados);
        } catch (error: any) {
            console.error('❌ Error al remover usuario:', error);
            setError(error.message || 'Error al remover usuario del programa');
        }
    };

    const removerGranja = async (granjaId: number) => {
        if (!confirm("¿Estás seguro de remover esta granja del programa?")) return;

        try {
            setError(null);
            await programaService.removerGranja(programaSeleccionado.id, granjaId);
            console.log('✅ Granja removida del programa');

            const granjasActualizadas = await programaService.obtenerGranjasPorPrograma(programaSeleccionado.id);
            setGranjasPrograma(granjasActualizadas);
        } catch (error: any) {
            console.error('❌ Error al remover granja:', error);
            setError(error.message || 'Error al remover granja del programa');
        }
    };

    // Función para obtener el label del tipo de programa
    const obtenerLabelTipo = (tipo: string) => {
        const tipoObj = tiposPrograma.find(t => t.value === tipo);
        return tipoObj ? tipoObj.label : tipo;
    };

    // Función para obtener el icono del tipo de programa
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
            <h1 className="text-2xl font-bold mb-6">Gestión de Programas</h1>
            <div className="flex items-center space-x-3 m-2">
                {exportMessage && (
                    <span className={`text-sm px-3 py-1 rounded ${exportMessage.includes('Error')
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-600'
                        }`}>
                        {exportMessage}
                    </span>
                )}

                <button
                    onClick={handleExportProgramas}
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

            {/* Estadísticas por tipo de programa */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    icon="fas fa-clipboard-list"
                    color="bg-blue-600"
                    value={programas.length}
                    label="Programas Registrados"
                />
                <StatsCard
                    icon="fas fa-seedling"
                    color="bg-green-600"
                    value={programas.filter(p => p.tipo === 'agricola').length}
                    label="Programas Agrícolas"
                />
                <StatsCard
                    icon="fas fa-paw"
                    color="bg-amber-600"
                    value={programas.filter(p => p.tipo === 'pecuario').length}
                    label="Programas Pecuarios"
                />
                <StatsCard
                    icon="fas fa-flask"
                    color="bg-purple-600"
                    value={programas.filter(p => p.tipo === 'prueba').length}
                    label="Programas de Prueba"
                />
            </div>

            {/* Botón Crear */}
            <div className="mb-6">
                <button
                    onClick={() => {
                        setDatosFormulario({
                            nombre: "",
                            descripcion: "",
                            tipo: "agricola",
                            activo: true
                        });
                        setEditando(false);
                        setModalCrear(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i>
                    Nuevo Programa
                </button>
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

            {/* FORM */}
            <ProgramaForm
                isOpen={modalCrear}
                onClose={() => {
                    setModalCrear(false);
                    setEditando(false);
                    setDatosFormulario({
                        nombre: "",
                        descripcion: "",
                        tipo: "agricola",
                        activo: true
                    });
                }}
                datosFormulario={datosFormulario}
                setDatosFormulario={setDatosFormulario}
                onSubmit={manejarCrear}
                editando={editando}
                tiposPrograma={tiposPrograma}
            />

            {/* DETALLES */}
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

            {/* MODAL ASIGNAR USUARIO */}
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

            {/* MODAL ASIGNAR GRANJA */}
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