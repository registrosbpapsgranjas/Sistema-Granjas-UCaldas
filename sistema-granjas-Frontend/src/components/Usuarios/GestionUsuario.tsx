// src/components/GestionUsuarios.tsx
import { useEffect, useState } from "react";

// Services
import usuarioService from "../../services/usuarioService";

// Components
import { StatsCard } from "../Common/StatsCard";
import { EditarUsuarioModal } from "./EditarUsuario";
import { CambiarRolModal } from "./CambiarRol";
import { AsignarProgramaModal } from "./AsignarProgramaModal";
import { AsignarGranjaModal } from "./AsignarGranjaModal";
import { CrearUsuarioModal } from "./CrearUsuarioModal";
import UsuariosTable from "./UsuariosTable";
import exportService from "../../services/exportService";

export default function GestionUsuarios() {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');

    const handleExportUsuarios = async () => {
        if (exporting) return;
        setExporting(true);
        setExportMessage('Exportando usuarios...');

        try {
            const result = await exportService.exportarUsuarios();
            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error) {
            console.error('❌ Error exportando usuarios:', error);
            setExportMessage('Error al exportar.');
            setTimeout(() => setExportMessage(''), 5000);
        } finally {
            setExporting(false);
        }
    };

    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        activos: 0,
        inactivos: 0,
        porRol: {} as Record<string, number>
    });

    // Modales
    const [modalCrear, setModalCrear] = useState(false);
    const [modalEditar, setModalEditar] = useState(false);
    const [modalCambiarRol, setModalCambiarRol] = useState(false);
    const [modalAsignarPrograma, setModalAsignarPrograma] = useState(false);
    const [modalAsignarGranja, setModalAsignarGranja] = useState(false);

    // Selecciones
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);

    // Formularios
    const [datosFormulario, setDatosFormulario] = useState({
        nombre: "",
        email: "",
        activo: true
    });

    // Filtros
    const [filtroRol, setFiltroRol] = useState<string>("todos");
    const [filtroEstado, setFiltroEstado] = useState<string>("todos");
    const [busqueda, setBusqueda] = useState<string>("");

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);

            console.log('🔄 Cargando datos de usuarios y roles...');

            const [datosUsuarios, datosRoles] = await Promise.all([
                usuarioService.obtenerUsuarios(),
                usuarioService.obtenerRoles()
            ]);

            console.log('✅ Usuarios cargados:', datosUsuarios.length);
            console.log('✅ Roles cargados desde backend:', datosRoles);

            setUsuarios(datosUsuarios);
            setRoles(datosRoles);
            calcularEstadisticas(datosUsuarios, datosRoles);

        } catch (error: any) {
            console.error('❌ Error cargando datos:', error);
            setError(error.message || 'Error al cargar los datos');
        } finally {
            setCargando(false);
        }
    };

    const calcularEstadisticas = (usuariosList: any[], rolesList: any[]) => {
        const porRol: Record<string, number> = {};
        let activos = 0;
        let inactivos = 0;

        rolesList.forEach(rol => {
            porRol[rol.nombre] = 0;
        });

        usuariosList.forEach(usuario => {
            const rol = rolesList.find(r => r.id === usuario.rol_id);
            const rolNombre = rol ? rol.nombre : `Rol ${usuario.rol_id}`;

            if (porRol[rolNombre] !== undefined) {
                porRol[rolNombre]++;
            } else {
                porRol[rolNombre] = 1;
            }

            if (usuario.activo) {
                activos++;
            } else {
                inactivos++;
            }
        });

        setEstadisticas({
            total: usuariosList.length,
            activos,
            inactivos,
            porRol
        });
    };

    const abrirEditar = (usuario: any) => {
        setDatosFormulario({
            nombre: usuario.nombre,
            email: usuario.email,
            activo: usuario.activo
        });
        setUsuarioSeleccionado(usuario);
        setModalEditar(true);
    };

    const manejarEditar = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setError(null);
            console.log('✏️ Actualizando usuario...');

            const datosActualizacion: any = {
                nombre: datosFormulario.nombre,
                email: datosFormulario.email,
                activo: datosFormulario.activo
            };

            await usuarioService.actualizarUsuario(usuarioSeleccionado.id, datosActualizacion);
            console.log('✅ Usuario actualizado');

            const usuarioActualizado = {
                ...usuarioSeleccionado,
                ...datosActualizacion
            };

            setUsuarios(prev => prev.map(u =>
                u.id === usuarioSeleccionado.id ? usuarioActualizado : u
            ));

            calcularEstadisticas(
                usuarios.map(u =>
                    u.id === usuarioSeleccionado.id ? usuarioActualizado : u
                ),
                roles
            );

            cerrarModales();
        } catch (error: any) {
            console.error('❌ Error actualizando usuario:', error);
            setError(error.message || 'Error al actualizar el usuario');
        }
    };

    const abrirCambiarRol = (usuario: any) => {
        setUsuarioSeleccionado(usuario);
        setModalCambiarRol(true);
    };

    const abrirAsignarPrograma = (usuario: any) => {
        setUsuarioSeleccionado(usuario);
        setModalAsignarPrograma(true);
    };

    const abrirAsignarGranja = (usuario: any) => {
        setUsuarioSeleccionado(usuario);
        setModalAsignarGranja(true);
    };

    const manejarEliminar = async (id: number) => {
        const usuario = usuarios.find(u => u.id === id);
        const nombre = usuario ? `"${usuario.nombre}"` : "este usuario";
        if (!confirm(
            `¿Eliminar permanentemente a ${nombre}?\n\n` +
            `Esta acción borra el usuario de la base de datos y NO se puede deshacer.\n` +
            `Si el usuario tiene diagnósticos, recomendaciones o evidencias registradas, la eliminación no será posible; usa "Desactivar" en ese caso.`
        )) return;

        try {
            setError(null);
            await usuarioService.eliminarUsuario(id);
            console.log('✅ Usuario eliminado permanentemente');

            const nuevosUsuarios = usuarios.filter(u => u.id !== id);
            setUsuarios(nuevosUsuarios);
            calcularEstadisticas(nuevosUsuarios, roles);

        } catch (error: any) {
            console.error('❌ Error al eliminar usuario:', error);
            setError(error.message || 'Error al eliminar el usuario');
        }
    };

    const cambiarRol = async (rol_id: number) => {
        try {
            setError(null);
            await usuarioService.actualizarUsuario(usuarioSeleccionado.id, { rol_id });
            console.log('✅ Rol cambiado a:', rol_id);

            const nuevoRol = roles.find(r => r.id === rol_id);
            const rolNombre = nuevoRol ? nuevoRol.nombre : `Rol ${rol_id}`;

            const usuarioActualizado = {
                ...usuarioSeleccionado,
                rol_id: rol_id,
                rol_nombre: rolNombre
            };

            setUsuarios(prev => prev.map(u =>
                u.id === usuarioSeleccionado.id ? usuarioActualizado : u
            ));

            calcularEstadisticas(
                usuarios.map(u =>
                    u.id === usuarioSeleccionado.id ? usuarioActualizado : u
                ),
                roles
            );

            setModalCambiarRol(false);
        } catch (error: any) {
            console.error('❌ Error al cambiar rol:', error);
            setError(error.message || 'Error al cambiar el rol');
        }
    };

    const toggleActivo = async (usuario: any) => {
        const nuevoEstado = !usuario.activo;
        const accion = nuevoEstado ? 'activar' : 'desactivar';
        
        if (!confirm(`¿Estás seguro de ${accion} el usuario "${usuario.nombre}"?`)) return;

        try {
            setError(null);
            await usuarioService.actualizarUsuario(usuario.id, { activo: nuevoEstado });
            console.log(`✅ Usuario ${accion}do`);

            const usuarioActualizado = {
                ...usuario,
                activo: nuevoEstado
            };

            setUsuarios(prev => prev.map(u =>
                u.id === usuario.id ? usuarioActualizado : u
            ));

            calcularEstadisticas(
                usuarios.map(u =>
                    u.id === usuario.id ? usuarioActualizado : u
                ),
                roles
            );
            
            if (nuevoEstado) {
                alert(`✅ Usuario "${usuario.nombre}" reactivado exitosamente`);
            } else {
                alert(`✅ Usuario "${usuario.nombre}" desactivado exitosamente`);
            }
        } catch (error: any) {
            console.error('❌ Error al cambiar estado:', error);
            setError(error.message || 'Error al cambiar el estado del usuario');
        }
    };

    const manejarCrearUsuario = async (datos: {
        nombre: string;
        email: string;
        password: string;
        rol_id: number;
    }) => {
        const nuevoUsuario = await usuarioService.crearUsuarioAdmin(datos);
        const nuevoRol = roles.find(r => r.id === nuevoUsuario.rol_id);
        const usuarioConRol = {
            ...nuevoUsuario,
            rol_nombre: nuevoRol?.nombre ?? nuevoUsuario.rol_nombre ?? `Rol ${nuevoUsuario.rol_id}`,
        };
        const nuevosUsuarios = [usuarioConRol, ...usuarios];
        setUsuarios(nuevosUsuarios);
        calcularEstadisticas(nuevosUsuarios, roles);
        setModalCrear(false);
    };

    const cerrarModales = () => {
        setModalEditar(false);
        setModalCambiarRol(false);
        setModalAsignarPrograma(false);
        setModalAsignarGranja(false);
        setUsuarioSeleccionado(null);
        setDatosFormulario({
            nombre: "",
            email: "",
            activo: true
        });
    };

    const usuariosFiltrados = usuarios.filter(usuario => {
        const cumpleRol = filtroRol === "todos" || usuario.rol_id.toString() === filtroRol;
        const cumpleEstado = filtroEstado === "todos" ||
            (filtroEstado === "activos" && usuario.activo) ||
            (filtroEstado === "inactivos" && !usuario.activo);

        const cumpleBusqueda = busqueda === "" ||
            usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            usuario.email.toLowerCase().includes(busqueda.toLowerCase());

        return cumpleRol && cumpleEstado && cumpleBusqueda;
    });

    if (cargando) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <span className="ml-4 text-gray-600">Cargando usuarios...</span>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <i className="fas fa-exclamation-circle text-xl"></i>
                        <span>{error}</span>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Administra los usuarios del sistema, sus roles y asignaciones
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setModalCrear(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <i className="fas fa-user-plus"></i>
                        Crear Usuario
                    </button>
                    <button
                        onClick={handleExportUsuarios}
                        disabled={exporting}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-file-export'}`}></i>
                        {exporting ? 'Exportando...' : 'Exportar'}
                    </button>
                </div>
            </div>

            {/* Distribución por Roles */}
            {Object.keys(estadisticas.porRol).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <i className="fas fa-chart-pie text-purple-500"></i>
                        Distribución por Roles
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {Object.entries(estadisticas.porRol)
                            .sort((a, b) => b[1] - a[1])
                            .map(([rol, cantidad]) => (
                                <div key={rol} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-sm font-medium text-gray-700 capitalize">{rol}</span>
                                    <span className="text-sm font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full min-w-[24px] text-center">
                                        {cantidad}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Barra de herramientas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Búsqueda */}
                    <div className="flex-1 relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                        {busqueda && (
                            <button
                                onClick={() => setBusqueda('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <i className="fas fa-times-circle"></i>
                            </button>
                        )}
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={filtroRol}
                            onChange={(e) => setFiltroRol(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                        >
                            <option value="todos">Todos los roles</option>
                            {roles.map((rol) => (
                                <option key={rol.id} value={rol.id}>
                                    {rol.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="activos">🟢 Activos</option>
                            <option value="inactivos">🔴 Inactivos</option>
                        </select>

                        {(filtroRol !== "todos" || filtroEstado !== "todos" || busqueda) && (
                            <button
                                onClick={() => {
                                    setFiltroRol("todos");
                                    setFiltroEstado("todos");
                                    setBusqueda("");
                                }}
                                className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <i className="fas fa-times mr-1"></i>
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* Información de resultados */}
                <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                    <i className="fas fa-info-circle text-gray-400"></i>
                    <span>
                        Mostrando <strong className="text-gray-700">{usuariosFiltrados.length}</strong> de <strong className="text-gray-700">{usuarios.length}</strong> usuarios
                        {filtroEstado === "activos" && " (solo activos)"}
                        {filtroEstado === "inactivos" && " (solo inactivos)"}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                        {estadisticas.activos} activos · {estadisticas.inactivos} inactivos
                    </span>
                </div>
            </div>

            {/* Tabla */}
            <UsuariosTable
                usuarios={usuariosFiltrados}
                roles={roles}
                onEditar={abrirEditar}
                onEliminar={manejarEliminar}
                onChangeRol={abrirCambiarRol}
                onToggleActivo={toggleActivo}
                onAsignarPrograma={abrirAsignarPrograma}
                onAsignarGranja={abrirAsignarGranja}
                totalUsuarios={usuarios.length}
            />

            {/* MODALES */}
            <CrearUsuarioModal
                isOpen={modalCrear}
                onClose={() => setModalCrear(false)}
                roles={roles}
                onCreate={manejarCrearUsuario}
            />

            <EditarUsuarioModal
                isOpen={modalEditar}
                onClose={cerrarModales}
                datosFormulario={datosFormulario}
                setDatosFormulario={setDatosFormulario}
                onSubmit={manejarEditar}
                usuario={usuarioSeleccionado}
            />

            <CambiarRolModal
                isOpen={modalCambiarRol}
                onClose={() => setModalCambiarRol(false)}
                usuario={usuarioSeleccionado}
                roles={roles}
                rolActualId={usuarioSeleccionado?.rol_id}
                onCambiarRol={cambiarRol}
            />

            <AsignarProgramaModal
                isOpen={modalAsignarPrograma}
                onClose={cerrarModales}
                usuario={usuarioSeleccionado}
            />

            <AsignarGranjaModal
                isOpen={modalAsignarGranja}
                onClose={cerrarModales}
                usuario={usuarioSeleccionado}
            />
        </div>
    );
}