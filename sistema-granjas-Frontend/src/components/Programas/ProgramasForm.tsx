import React, { useEffect, useState } from "react";
import Modal from "../Common/Modal";
import granjaService from "../../services/granjaService";

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
        granjas_ids?: number[];
    };
    setDatosFormulario: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: (e: React.FormEvent) => void;
    editando: boolean;
    tiposPrograma: TipoPrograma[];
    erroresValidacion?: Record<string, string>;
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
        { value: "pecuario", label: "Pecuario", icon: "fas fa-paw" }
    ],
    erroresValidacion = {}
}) => {
    const [granjas, setGranjas] = useState<any[]>([]);
    const [cargandoGranjas, setCargandoGranjas] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCargandoGranjas(true);
            granjaService.obtenerGranjas()
                .then(data => setGranjas(data))
                .catch(err => console.error("Error cargando granjas:", err))
                .finally(() => setCargandoGranjas(false));
        }
    }, [isOpen]);

    const handleGranjaChange = (granjaId: number) => {
        const current = datosFormulario.granjas_ids || [];
        const newIds = current.includes(granjaId)
            ? current.filter(id => id !== granjaId)
            : [...current, granjaId];
        setDatosFormulario({ ...datosFormulario, granjas_ids: newIds });
    };

    const getError = (campo: string) => erroresValidacion[campo] || '';

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-xl font-bold mb-4">
                {editando ? "Editar Programa" : "Nuevo Programa"}
            </h3>

            {Object.keys(erroresValidacion).length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    <p className="font-bold mb-2">Por favor corrige los siguientes errores:</p>
                    <ul className="list-disc pl-5 text-sm">
                        {Object.entries(erroresValidacion).map(([campo, msg]) => (
                            <li key={campo}>{msg.replace('Value error, ', '')}</li>
                        ))}
                    </ul>
                </div>
            )}

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
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            getError('nombre') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Ingrese el nombre del programa"
                    />
                    {getError('nombre') && (
                        <p className="text-red-500 text-sm mt-1">{getError('nombre').replace('Value error, ', '')}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Programa *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {tiposPrograma.map((tipo) => (
                            <button
                                key={tipo.value}
                                type="button"
                                onClick={() =>
                                    setDatosFormulario({ ...datosFormulario, tipo: tipo.value })
                                }
                                className={`flex flex-col items-center justify-center p-3 rounded-md border-2 transition-all ${
                                    datosFormulario.tipo === tipo.value
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                } ${
                                    getError('tipo') ? 'border-red-500' : ''
                                }`}
                            >
                                <i className={`${tipo.icon} text-lg mb-1 ${
                                    datosFormulario.tipo === tipo.value ? "text-blue-600" : "text-gray-500"
                                }`}></i>
                                <span className="text-sm font-medium">{tipo.label}</span>
                            </button>
                        ))}
                    </div>
                    {getError('tipo') && (
                        <p className="text-red-500 text-sm mt-1">{getError('tipo').replace('Value error, ', '')}</p>
                    )}
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
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            getError('descripcion') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Descripción del programa (mínimo 10 caracteres)"
                        rows={3}
                    />
                    {getError('descripcion') && (
                        <p className="text-red-500 text-sm mt-1">{getError('descripcion').replace('Value error, ', '')}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Granjas asociadas
                    </label>
                    {cargandoGranjas ? (
                        <div className="text-gray-500">Cargando granjas...</div>
                    ) : (
                        <div className="border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
                            {granjas.map((granja) => (
                                <label key={granja.id} className="flex items-center space-x-2 py-1">
                                    <input
                                        type="checkbox"
                                        checked={(datosFormulario.granjas_ids || []).includes(granja.id)}
                                        onChange={() => handleGranjaChange(granja.id)}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm">{granja.nombre}</span>
                                </label>
                            ))}
                            {granjas.length === 0 && (
                                <p className="text-sm text-gray-500">No hay granjas disponibles</p>
                            )}
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        Selecciona las granjas donde estará disponible este programa.
                    </p>
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