// src/components/UsuariosTable.tsx
import React from 'react';

interface UsuariosTableProps {
    usuarios: any[];
    roles: any[];
    onEditar: (usuario: any) => void;
    onEliminar: (id: number) => void;
    onChangeRol: (usuario: any) => void;
    onToggleActivo: (usuario: any) => void;
    totalUsuarios: number;
}

const UsuariosTable: React.FC<UsuariosTableProps> = ({
    usuarios,
    roles,
    onEditar,
    onEliminar,
    onChangeRol,
    onToggleActivo,
    totalUsuarios
}) => {
    // Función para obtener nombre del rol por ID
    const obtenerNombreRol = (rolId: number) => {
        const rol = roles.find(r => r.id === rolId);
        return rol ? rol.nombre : `Rol ${rolId}`;
    };

    // Función para obtener color del badge según rol
    const getRolColor = (rolId: number) => {
        const rol = roles.find(r => r.id === rolId);
        const nombreRol = rol ? rol.nombre.toLowerCase() : '';

        if (nombreRol.includes('admin')) return 'bg-red-100 text-red-800';
        if (nombreRol.includes('tecnico')) return 'bg-blue-100 text-blue-800';
        if (nombreRol.includes('supervisor')) return 'bg-purple-100 text-purple-800';
        if (nombreRol.includes('invitado')) return 'bg-gray-100 text-gray-800';
        return 'bg-green-100 text-green-800';
    };

    // Función para formatear fecha
    const formatearFecha = (fechaString: string) => {
        try {
            const fecha = new Date(fechaString);
            return fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return 'Fecha inválida';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Lista de Usuarios</h3>
                        <p className="text-sm text-gray-500">
                            Mostrando {usuarios.length} de {totalUsuarios} usuarios
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usuario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha Registro
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {usuarios.map((usuario) => (
                            <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {usuario.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{usuario.nombre}</p>
                                        <p className="text-sm text-gray-500">{usuario.email}</p>
                                        {usuario.rol_nombre && (
                                            <p className="text-xs text-gray-400">Rol actual: {usuario.rol_nombre}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRolColor(usuario.rol_id)}`}>
                                            {obtenerNombreRol(usuario.rol_id)}
                                        </span>
                                        <button
                                            onClick={() => onChangeRol(usuario)}
                                            className="ml-2 text-blue-600 hover:text-blue-800 transition"
                                            title="Cambiar rol"
                                        >
                                            <i className="fas fa-exchange-alt text-xs"></i>
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${usuario.activo
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {usuario.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                        <button
                                            onClick={() => onToggleActivo(usuario)}
                                            className="ml-2 text-gray-600 hover:text-gray-800 transition"
                                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                                        >
                                            <i className={`fas fa-power-off text-xs ${usuario.activo ? 'text-green-600' : 'text-red-600'}`}></i>
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatearFecha(usuario.fecha_creacion)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        {/* Botón Editar */}
                                        <button
                                            onClick={() => onEditar(usuario)}
                                            className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                                            title="Editar información"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>

                                        {/* Botón Eliminar */}
                                        <button
                                            onClick={() => onEliminar(usuario.id)}
                                            className="text-red-600 hover:text-red-900 transition-colors p-1"
                                            title="Eliminar usuario"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {usuarios.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <i className="fas fa-users-slash text-4xl mb-4 text-gray-300"></i>
                        <p className="text-lg mb-2">No se encontraron usuarios</p>
                        <p className="text-sm">Intenta cambiar los filtros de búsqueda</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsuariosTable;