// src/components/CambiarRolModal.tsx
import React, { useState, useEffect } from "react";
import Modal from "./Modal";

interface CambiarRolModalProps {
    isOpen: boolean;
    onClose: () => void;
    usuario: any;
    roles: any[];
    rolActualId: number;
    onCambiarRol: (rol_id: number) => void;
}

export const CambiarRolModal: React.FC<CambiarRolModalProps> = ({
    isOpen,
    onClose,
    usuario,
    roles,
    rolActualId,
    onCambiarRol
}) => {
    const [nuevoRolId, setNuevoRolId] = useState<number>(rolActualId || 0);

    // Resetear cuando se abre el modal con un usuario diferente
    useEffect(() => {
        if (usuario) {
            setNuevoRolId(usuario.rol_id || 0);
        }
    }, [usuario]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nuevoRolId && nuevoRolId !== rolActualId) {
            onCambiarRol(nuevoRolId);
        }
    };

    if (!usuario) return null;

    const rolActual = roles.find(r => r.id === rolActualId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <div className="flex items-center mb-4">
                <div className="bg-yellow-100 p-3 rounded-full mr-3">
                    <i className="fas fa-user-tag text-yellow-600 text-xl"></i>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Cambiar Rol de Usuario</h3>
                    <p className="text-sm text-gray-500">{usuario.nombre} - {usuario.email}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Información del rol actual */}
                {rolActual && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                        <p className="text-sm font-medium text-blue-800">
                            <i className="fas fa-info-circle mr-2"></i>
                            Rol actual
                        </p>
                        <div className="mt-1">
                            <p className="text-sm font-semibold text-blue-900">{rolActual.nombre}</p>
                            {rolActual.descripcion && (
                                <p className="text-xs text-blue-700 mt-1">{rolActual.descripcion}</p>
                            )}
                            {rolActual.nivel_permiso !== undefined && (
                                <p className="text-xs text-blue-600 mt-1">
                                    Nivel de permiso: {rolActual.nivel_permiso}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar nuevo rol
                    </label>
                    <select
                        value={nuevoRolId}
                        onChange={(e) => setNuevoRolId(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                        <option value="0">-- Seleccione un rol --</option>
                        {roles.map((rol) => (
                            <option key={rol.id} value={rol.id}>
                                {rol.nombre} {rol.descripcion && `- ${rol.descripcion}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Información del rol seleccionado */}
                {nuevoRolId && nuevoRolId !== rolActualId && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-sm text-yellow-800">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            El usuario obtendrá los permisos del nuevo rol seleccionado.
                        </p>
                    </div>
                )}

                <div className="flex gap-2 justify-end pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!nuevoRolId || nuevoRolId === rolActualId}
                        className={`px-4 py-2 rounded-md transition ${!nuevoRolId || nuevoRolId === rolActualId
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                            }`}
                    >
                        Cambiar Rol
                    </button>
                </div>
            </form>
        </Modal>
    );
};