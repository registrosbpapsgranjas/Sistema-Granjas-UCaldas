import React from "react";

interface AsignarProgramaModalProps {
    isOpen: boolean;
    onClose: () => void;
    programas: any[];
    programasGranja: any[];
    programaSeleccionado: number;
    setProgramaSeleccionado: (id: number) => void;
    onAsignar: () => void;
}

export const AsignarProgramaModal: React.FC<AsignarProgramaModalProps> = ({
    isOpen,
    onClose,
    programas,
    programasGranja,
    programaSeleccionado,
    setProgramaSeleccionado,
    onAsignar
}) => {
    if (!isOpen) return null;

    // Filtrar programas que NO están asignados a la granja
    const programasDisponibles = programas.filter(
        (programa) => !programasGranja.some((pg) => pg.id === programa.id)
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Asignar Programa a Granja</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {programasDisponibles.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-gray-600">
                            No hay programas disponibles para asignar
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Seleccionar Programa
                            </label>
                            <select
                                value={programaSeleccionado}
                                onChange={(e) => setProgramaSeleccionado(Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value={0}>-- Seleccione un programa --</option>
                                {programasDisponibles.map((programa) => (
                                    <option key={programa.id} value={programa.id}>
                                        {programa.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onAsignar}
                                disabled={!programaSeleccionado}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Asignar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};