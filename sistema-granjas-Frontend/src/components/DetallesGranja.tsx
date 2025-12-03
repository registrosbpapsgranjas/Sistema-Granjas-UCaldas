// src/components/DetallesGranja.tsx
import React from 'react';

interface DetallesGranjaProps {
    isOpen: boolean;
    onClose: () => void;
    granja: any;
    usuariosGranja: any[];
    programasGranja: any[];
    onAsignarUsuarioOpen: () => void;
    onAsignarProgramaOpen: () => void;
    onRemoveUsuario: (id: number) => void;
    onRemovePrograma: (id: number) => void;
}

export const DetallesGranja: React.FC<DetallesGranjaProps> = ({
    isOpen,
    onClose,
    granja,
    usuariosGranja,
    programasGranja,
    onAsignarUsuarioOpen,
    onAsignarProgramaOpen,
    onRemoveUsuario,
    onRemovePrograma
}) => {
    if (!isOpen || !granja) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Detalles de: {granja.nombre}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-xl"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    {/* Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-700 mb-2">Información General</h3>
                            <p><strong>Ubicación:</strong> {granja.ubicacion}</p>
                            <p><strong>Estado:</strong> {granja.activo ? 'Activa' : 'Inactiva'}</p>
                            <p><strong>Fecha creación:</strong> {new Date(granja.fecha_creacion).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Usuarios asignados */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Usuarios Asignados</h3>
                            <button
                                onClick={onAsignarUsuarioOpen}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <i className="fas fa-plus"></i>
                                Asignar Usuario
                            </button>
                        </div>
                        <div className="space-y-2">
                            {usuariosGranja.map((usuario) => (
                                <div key={usuario.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">{usuario.nombre}</div>
                                        <div className="text-sm text-gray-500">{usuario.email}</div>
                                        <div className="text-xs text-gray-400 capitalize">{usuario.rol_nombre}</div>
                                    </div>
                                    <button
                                        onClick={() => onRemoveUsuario(usuario.id)}
                                        className="text-red-600 hover:text-red-800"
                                        title="Remover usuario"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ))}
                            {usuariosGranja.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No hay usuarios asignados</p>
                            )}
                        </div>
                    </div>

                    {/* Programas asignados */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Programas Asignados</h3>
                            <button
                                onClick={onAsignarProgramaOpen}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <i className="fas fa-plus"></i>
                                Asignar Programa
                            </button>
                        </div>
                        <div className="space-y-2">
                            {programasGranja.map((programa) => (
                                <div key={programa.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">{programa.nombre}</div>
                                        <div className="text-sm text-gray-500">{programa.descripcion}</div>
                                    </div>
                                    <button
                                        onClick={() => onRemovePrograma(programa.id)}
                                        className="text-red-600 hover:text-red-800"
                                        title="Remover programa"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ))}
                            {programasGranja.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No hay programas asignados</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};