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
    onRemoveGranja
}) => {
    if (!programa) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="space-y-6">
                {/* Encabezado */}
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Detalles del Programa</h3>
                        <p className="text-sm text-gray-500">ID: {programa.id}</p>
                    </div>
                    <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${programa.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}
                    >
                        {programa.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </div>

                {/* Información del programa */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Información General</h4>
                    <div className="space-y-2">
                        <div>
                            <span className="text-sm font-medium text-gray-600">Nombre:</span>
                            <p className="text-gray-900">{programa.nombre}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-600">Descripción:</span>
                            <p className="text-gray-900">{programa.descripcion || 'Sin descripción'}</p>
                        </div>
                    </div>
                </div>

                {/* Sección de Usuarios */}
                <div className="border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        <h4 className="font-medium text-gray-900">Usuarios Asignados</h4>
                        <button
                            onClick={onAsignarUsuarioOpen}
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition"
                        >
                            <i className="fas fa-plus mr-1"></i> Asignar Usuario
                        </button>
                    </div>
                    <div className="p-4">
                        {usuariosPrograma.length > 0 ? (
                            <div className="space-y-2">
                                {usuariosPrograma.map((usuario) => (
                                    <div
                                        key={usuario.id}
                                        className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">{usuario.nombre}</p>
                                            <p className="text-sm text-gray-500">{usuario.email}</p>
                                            <span className="text-xs text-gray-400">{usuario.rol}</span>
                                        </div>
                                        <button
                                            onClick={() => onRemoveUsuario(usuario.id)}
                                            className="text-red-600 hover:text-red-800 p-1"
                                            title="Remover usuario"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                <i className="fas fa-users text-2xl mb-2 text-gray-300"></i>
                                <p>No hay usuarios asignados</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sección de Granjas */}
                <div className="border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        <h4 className="font-medium text-gray-900">Granjas Asignadas</h4>
                        <button
                            onClick={onAsignarGranjaOpen}
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition"
                        >
                            <i className="fas fa-plus mr-1"></i> Asignar Granja
                        </button>
                    </div>
                    <div className="p-4">
                        {granjasPrograma.length > 0 ? (
                            <div className="space-y-2">
                                {granjasPrograma.map((granja) => (
                                    <div
                                        key={granja.id}
                                        className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">{granja.nombre}</p>
                                            <p className="text-sm text-gray-500">{granja.ubicacion}</p>
                                            <span
                                                className={`text-xs ${granja.activo ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                {granja.activo ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => onRemoveGranja(granja.id)}
                                            className="text-red-600 hover:text-red-800 p-1"
                                            title="Remover granja"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                <i className="fas fa-warehouse text-2xl mb-2 text-gray-300"></i>
                                <p>No hay granjas asignadas</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};