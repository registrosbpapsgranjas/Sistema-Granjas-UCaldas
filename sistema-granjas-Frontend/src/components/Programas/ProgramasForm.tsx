// src/components/ProgramaForm.tsx
import React from "react";
import Modal from "../Common/Modal";

interface TipoPrograma {
    value: string;
    label: string;
    icon: string;
}

interface ProgramaFormProps {
    isOpen: boolean;
    onClose: () => void;
    datosFormulario: {
        nombre: string;
        descripcion: string;
        tipo: string;
        activo: boolean;
    };
    setDatosFormulario: React.Dispatch<React.SetStateAction<{
        nombre: string;
        descripcion: string;
        tipo: string;
        activo: boolean;
    }>>;
    onSubmit: (e: React.FormEvent) => void;
    editando: boolean;
    tiposPrograma: TipoPrograma[];
}

export const ProgramaForm: React.FC<ProgramaFormProps> = ({
    isOpen,
    onClose,
    datosFormulario,
    setDatosFormulario,
    onSubmit,
    editando,
    tiposPrograma = [
        { value: "agricola", label: "Agrícola", icon: "fas fa-seedling" },
        { value: "pecuario", label: "Pecuario", icon: "fas fa-paw" },
        { value: "prueba", label: "Prueba", icon: "fas fa-flask" }
    ]
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-xl font-bold mb-4">
                {editando ? "Editar Programa" : "Nuevo Programa"}
            </h3>

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
                        placeholder="Ingrese el nombre del programa"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Programa *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {tiposPrograma.map((tipo) => (
                            <button
                                key={tipo.value}
                                type="button"
                                onClick={() =>
                                    setDatosFormulario({ ...datosFormulario, tipo: tipo.value })
                                }
                                className={`flex flex-col items-center justify-center p-3 rounded-md border-2 transition-all ${datosFormulario.tipo === tipo.value
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                    }`}
                            >
                                <i className={`${tipo.icon} text-lg mb-1 ${datosFormulario.tipo === tipo.value ? "text-blue-600" : "text-gray-500"
                                    }`}></i>
                                <span className="text-sm font-medium">{tipo.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                    </label>
                    <textarea
                        value={datosFormulario.descripcion}
                        onChange={(e) =>
                            setDatosFormulario({ ...datosFormulario, descripcion: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Descripción del programa (opcional)"
                        rows={3}
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={datosFormulario.activo}
                        onChange={(e) =>
                            setDatosFormulario({ ...datosFormulario, activo: e.target.checked })
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-900">Programa activo</label>
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
                        {editando ? "Actualizar" : "Crear"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};