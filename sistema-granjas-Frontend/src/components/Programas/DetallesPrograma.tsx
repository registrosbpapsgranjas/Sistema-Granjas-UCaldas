// src/components/DetallesPrograma.tsx
import React from "react";
import Modal from "../Common/Modal";

interface DetallesProgramaProps {
    isOpen: boolean;
    onClose: () => void;
    programa: any;
    usuariosPrograma: any[];
    granjasPrograma: any[];
    onAsignarUsuarioOpen: () => void;
    onAsignarGranjaOpen: () => void;
    onRemoveUsuario: (usuarioId: number) => void;
    onRemoveGranja: (granjaId: number) => void;
    obtenerLabelTipo?: (tipo: string) => string;
    obtenerIconoTipo?: (tipo: string) => string;
}

export const DetallesPrograma: React.FC<DetallesProgramaProps> = ({
    isOpen,
    onClose,
    programa,
    usuariosPrograma,
    granjasPrograma,
    onAsignarUsuarioOpen,
    onAsignarGranjaOpen,
    onRemoveUsuario,
    onRemoveGranja,
    obtenerLabelTipo = (tipo) => tipo,
    obtenerIconoTipo = (tipo) => "fas fa-question"
}) => {
    if (!programa) return null;

    // Función para obtener el color según el tipo de programa
    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'agricola': return 'text-green-600 bg-green-50 border-green-200';
            case 'pecuario': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'prueba': return 'text-purple-600 bg-purple-50 border-purple-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    // Función para obtener el color del icono
    const getIconColor = (tipo: string) => {
        switch (tipo) {
            case 'agricola': return 'text-green-600';
            case 'pecuario': return 'text-amber-600';
            case 'prueba': return 'text-purple-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="space-y-6">
                {/* Encabezado */}
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Detalles del Programa</h3>
                        <p className="text-sm text-gray-500">ID: {programa.id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {/* Estado */}
                        <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${programa.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}
                        >
                            {programa.activo ? 'Activo' : 'Inactivo'}
                        </span>

                        {/* Tipo */}
                        {programa.tipo && (
                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTipoColor(programa.tipo)}`}
                            >
                                <i className={`${obtenerIconoTipo(programa.tipo)} mr-2 ${getIconColor(programa.tipo)}`}></i>
                                {obtenerLabelTipo(programa.tipo)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Información del programa */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Información General</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Nombre del Programa
                            </label>
                            <p className="text-gray-900 font-medium">{programa.nombre}</p>
                        </div>

                        {/* Tipo de Programa */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Tipo de Programa
                            </label>
                            <div className="flex items-center">
                                <i className={`${obtenerIconoTipo(programa.tipo)} mr-2 text-lg ${getIconColor(programa.tipo)}`}></i>
                                <span className="font-medium text-gray-900">
                                    {obtenerLabelTipo(programa.tipo)}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Descripción
                            </label>
                            <p className="text-gray-900">
                                {programa.descripcion || (
                                    <span className="text-gray-400 italic">Sin descripción</span>
                                )}
                            </p>
                        </div>

                        {/* Fecha de creación */}
                        {programa.fecha_creacion && (
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Fecha de Creación
                                </label>
                                <p className="text-gray-900">
                                    {new Date(programa.fecha_creacion).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sección de Usuarios */}
                <div className="border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        <div className="flex items-center">
                            <h4 className="font-medium text-gray-900">Usuarios Asignados</h4>
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                {usuariosPrograma.length}
                            </span>
                        </div>
                        <button
                            onClick={onAsignarUsuarioOpen}
                            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition flex items-center"
                        >
                            <i className="fas fa-plus mr-2"></i> Asignar Usuario
                        </button>
                    </div>
                    <div className="p-4">
                        {usuariosPrograma.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {usuariosPrograma.map((usuario) => (
                                    <div
                                        key={usuario.id}
                                        className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <i className="fas fa-user text-blue-600"></i>
                                                </div>
                                            </div>
                                            <div className="ml-3">
                                                <p className="font-medium text-gray-900">{usuario.nombre}</p>
                                                <p className="text-sm text-gray-500">{usuario.email}</p>
                                                <span className="text-xs text-gray-400">{usuario.rol}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onRemoveUsuario(usuario.id)}
                                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                                            title="Remover usuario"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <i className="fas fa-users text-4xl mb-3 text-gray-300"></i>
                                <p className="font-medium">No hay usuarios asignados</p>
                                <p className="text-sm mt-1">Asigna usuarios para gestionar este programa</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sección de Granjas */}
                <div className="border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        <div className="flex items-center">
                            <h4 className="font-medium text-gray-900">Granjas Asignadas</h4>
                            <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                {granjasPrograma.length}
                            </span>
                        </div>
                        <button
                            onClick={onAsignarGranjaOpen}
                            className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition flex items-center"
                        >
                            <i className="fas fa-plus mr-2"></i> Asignar Granja
                        </button>
                    </div>
                    <div className="p-4">
                        {granjasPrograma.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {granjasPrograma.map((granja) => (
                                    <div
                                        key={granja.id}
                                        className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                    <i className="fas fa-warehouse text-green-600"></i>
                                                </div>
                                            </div>
                                            <div className="ml-3">
                                                <p className="font-medium text-gray-900">{granja.nombre}</p>
                                                <p className="text-sm text-gray-500">{granja.ubicacion}</p>
                                                <div className="flex items-center">
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded-full ${granja.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}
                                                    >
                                                        {granja.activo ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onRemoveGranja(granja.id)}
                                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                                            title="Remover granja"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <i className="fas fa-warehouse text-4xl mb-3 text-gray-300"></i>
                                <p className="font-medium">No hay granjas asignadas</p>
                                <p className="text-sm mt-1">Asigna granjas para este programa</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};