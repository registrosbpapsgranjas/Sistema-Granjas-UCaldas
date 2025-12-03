// src/components/EditarUsuarioModal.tsx
import React from "react";
import Modal from "./Modal";

interface EditarUsuarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    datosFormulario: {
        nombre: string;
        email: string;
        activo: boolean;
    };
    setDatosFormulario: React.Dispatch<React.SetStateAction<{
        nombre: string;
        email: string;
        activo: boolean;
    }>>;
    onSubmit: (e: React.FormEvent) => void;
    usuario: any;
}

export const EditarUsuarioModal: React.FC<EditarUsuarioModalProps> = ({
    isOpen,
    onClose,
    datosFormulario,
    setDatosFormulario,
    onSubmit,
    usuario
}) => {
    if (!usuario) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full mr-3">
                    <i className="fas fa-user-edit text-purple-600 text-xl"></i>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Editar Usuario</h3>
                    <p className="text-sm text-gray-500">ID: {usuario.id}</p>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                    </label>
                    <input
                        type="text"
                        required
                        value={datosFormulario.nombre}
                        onChange={(e) =>
                            setDatosFormulario({ ...datosFormulario, nombre: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nombre completo"
                    />
                    <p className="text-xs text-gray-500 mt-1">Mínimo 3 caracteres</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                    </label>
                    <input
                        type="email"
                        required
                        value={datosFormulario.email}
                        onChange={(e) =>
                            setDatosFormulario({ ...datosFormulario, email: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="usuario@ucaldas.edu.co"
                    />
                    <p className="text-xs text-gray-500 mt-1">Debe ser del dominio de la universidad</p>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="activo"
                        checked={datosFormulario.activo}
                        onChange={(e) =>
                            setDatosFormulario({ ...datosFormulario, activo: e.target.checked })
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="activo" className="ml-2 text-sm text-gray-900">
                        Usuario activo
                    </label>
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">
                        <i className="fas fa-info-circle mr-2 text-blue-500"></i>
                        Los usuarios se registran mediante autenticación. La contraseña no se puede cambiar desde aquí.
                    </p>
                </div>

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
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </Modal>
    );
};