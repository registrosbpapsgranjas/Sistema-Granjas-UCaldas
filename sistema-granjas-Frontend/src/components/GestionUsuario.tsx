// src/components/GestionUsuarios.tsx
import { useEffect, useState } from "react";

// Services
import usuarioService from "../services/usuarioService";

// Components
import { StatsCard } from "../components/StatsCard";
import { EditarUsuarioModal } from "../components/EditarUsuario";
import { CambiarRolModal } from "../components/CambiarRol";
import UsuariosTable from "../components/UsuariosTable";

export default function GestionUsuarios() {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estadísticas
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        activos: 0,
        inactivos: 0,
        porRol: {} as Record<string, number>
    });

    // Modales
    const [modalEditar, setModalEditar] = useState(false);
    const [modalCambiarRol, setModalCambiarRol] = useState(false);

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

            // Cargar usuarios y roles en paralelo
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

        // Inicializar todos los roles con 0
        rolesList.forEach(rol => {
            porRol[rol.nombre] = 0;
        });

        usuariosList.forEach(usuario => {
            // Encontrar el nombre del rol basado en rol_id
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

            // Actualizar localmente
            const usuarioActualizado = {
                ...usuarioSeleccionado,
                ...datosActualizacion
            };

            setUsuarios(prev => prev.map(u =>
                u.id === usuarioSeleccionado.id ? usuarioActualizado : u
            ));

            // Recalcular estadísticas
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

    const manejarEliminar = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) return;

        try {
            setError(null);
            await usuarioService.eliminarUsuario(id);
            console.log('✅ Usuario eliminado');

            // Actualizar localmente
            const nuevosUsuarios = usuarios.filter(u => u.id !== id);
            setUsuarios(nuevosUsuarios);

            // Recalcular estadísticas
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

            // Obtener el nombre del nuevo rol
            const nuevoRol = roles.find(r => r.id === rol_id);
            const rolNombre = nuevoRol ? nuevoRol.nombre : `Rol ${rol_id}`;

            // Actualizar localmente
            const usuarioActualizado = {
                ...usuarioSeleccionado,
                rol_id: rol_id,
                rol_nombre: rolNombre
            };

            setUsuarios(prev => prev.map(u =>
                u.id === usuarioSeleccionado.id ? usuarioActualizado : u
            ));

            // Recalcular estadísticas
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
        if (!confirm(`¿Estás seguro de ${usuario.activo ? 'desactivar' : 'activar'} este usuario?`)) return;

        try {
            setError(null);
            await usuarioService.actualizarUsuario(usuario.id, { activo: !usuario.activo });
            console.log(`✅ Usuario ${usuario.activo ? 'desactivado' : 'activado'}`);

            // Actualizar localmente
            const usuarioActualizado = {
                ...usuario,
                activo: !usuario.activo
            };

            setUsuarios(prev => prev.map(u =>
                u.id === usuario.id ? usuarioActualizado : u
            ));

            // Recalcular estadísticas
            calcularEstadisticas(
                usuarios.map(u =>
                    u.id === usuario.id ? usuarioActualizado : u
                ),
                roles
            );
        } catch (error: any) {
            console.error('❌ Error al cambiar estado:', error);
            setError(error.message || 'Error al cambiar el estado del usuario');
        }
    };

    const cerrarModales = () => {
        setModalEditar(false);
        setModalCambiarRol(false);
        setUsuarioSeleccionado(null);
        setDatosFormulario({
            nombre: "",
            email: "",
            activo: true
        });
    };

    // Función para obtener nombre del rol por ID
    const obtenerNombreRol = (rolId: number) => {
        const rol = roles.find(r => r.id === rolId);
        return rol ? rol.nombre : `Rol ${rolId}`;
    };

    // Filtrar usuarios
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
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1>

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
                    icon="fas fa-users"
                    color="bg-purple-600"
                    value={estadisticas.total}
                    label="Usuarios Totales"
                />
                <StatsCard
                    icon="fas fa-user-check"
                    color="bg-green-600"
                    value={estadisticas.activos}
                    label="Usuarios Activos"
                />
                <StatsCard
                    icon="fas fa-user-slash"
                    color="bg-red-600"
                    value={estadisticas.inactivos}
                    label="Usuarios Inactivos"
                />
                <StatsCard
                    icon="fas fa-user-shield"
                    color="bg-blue-600"
                    value={Object.keys(estadisticas.porRol).length}
                    label="Roles Diferentes"
                />
            </div>

            {/* Estadísticas por Rol */}
            {Object.keys(estadisticas.porRol).length > 0 && (
                <div className="mb-6 bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Distribución por Roles</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(estadisticas.porRol).map(([rol, cantidad]) => (
                            <div key={rol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">{rol}</span>
                                <span className="text-lg font-bold text-purple-600">{cantidad}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Barra de herramientas */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                {/* Información */}
                <div className="text-sm text-gray-600">
                    <i className="fas fa-info-circle mr-1"></i>
                    Los usuarios se registran mediante el sistema de autenticación
                </div>

                {/* Filtros y búsqueda */}
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    {/* Búsqueda */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full md:w-64"
                        />
                        <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>

                    {/* Filtro por Rol */}
                    <select
                        value={filtroRol}
                        onChange={(e) => setFiltroRol(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="todos">Todos los roles</option>
                        {roles.map((rol) => (
                            <option key={rol.id} value={rol.id}>
                                {rol.nombre}
                            </option>
                        ))}
                    </select>

                    {/* Filtro por Estado */}
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="activos">Activos</option>
                        <option value="inactivos">Inactivos</option>
                    </select>
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
                totalUsuarios={usuarios.length}
            />

            {/* MODAL Editar */}
            <EditarUsuarioModal
                isOpen={modalEditar}
                onClose={cerrarModales}
                datosFormulario={datosFormulario}
                setDatosFormulario={setDatosFormulario}
                onSubmit={manejarEditar}
                usuario={usuarioSeleccionado}
            />

            {/* MODAL Cambiar Rol */}
            <CambiarRolModal
                isOpen={modalCambiarRol}
                onClose={() => setModalCambiarRol(false)}
                usuario={usuarioSeleccionado}
                roles={roles}
                rolActualId={usuarioSeleccionado?.rol_id}
                onCambiarRol={cambiarRol}
            />
        </div>
    );
}