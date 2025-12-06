import React from "react";
import Modal from "../Common/Modal";

export const GranjaForm = ({
    isOpen,
    onClose,
    datosFormulario,
    setDatosFormulario,
    onSubmit,
    editando
}: any) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-xl font-bold mb-4">
                {editando ? "Editar Granja" : "Nueva Granja"}
            </h3>

            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                        type="text"
                        required
                        value={datosFormulario.nombre}
                        onChange={(e) =>
                            setDatosFormulario({ ...datosFormulario, nombre: e.target.value })
                        }
                        className="w-full border rounded-md px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <input
                        type="text"
                        required
                        value={datosFormulario.ubicacion}
                        onChange={(e) =>
                            setDatosFormulario({ ...datosFormulario, ubicacion: e.target.value })
                        }
                        className="w-full border rounded-md px-3 py-2"
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={datosFormulario.activo}
                        onChange={(e) =>
                            setDatosFormulario({ ...datosFormulario, activo: e.target.checked })
                        }
                        className="h-4 w-4"
                    />
                    <label className="ml-2 text-sm text-gray-900">Granja activa</label>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded-md"
                    >
                        {editando ? "Actualizar" : "Crear"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
