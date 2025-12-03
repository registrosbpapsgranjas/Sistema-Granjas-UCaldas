// src/components/AsignarGranjaModal.tsx
import React from "react";
import Modal from "../components/Modal";

interface AsignarGranjaModalProps {
    isOpen: boolean;
    onClose: () => void;
    granjas: any[];
    granjasAsignadas: any[];
    granjaSeleccionada: number;
    setGranjaSeleccionada: (id: number) => void;
    onAsignar: () => void;
}

export const AsignarGranjaModal: React.FC<AsignarGranjaModalProps> = ({
    isOpen,
    onClose,
    granjas,
    granjasAsignadas,
    granjaSeleccionada,
    setGranjaSeleccionada,
    onAsignar
}) => {
    // Filtrar granjas que no están asignadas
    const granjasDisponibles = granjas.filter(
        granja => !granjasAsignadas.some(asignada => asignada.id === granja.id)
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-xl font-bold mb-4">Asignar Granja al Programa</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccionar Granja
                    </label>
                    <select
                        value={granjaSeleccionada}
                        onChange={(e) => setGranjaSeleccionada(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                        <option value="0">-- Seleccione una granja --</option>
                        {granjasDisponibles.map((granja) => (
                            <option key={granja.id} value={granja.id}>
                                {granja.nombre} - {granja.ubicacion}
                            </option>
                        ))}
                    </select>
                </div>

                {granjasDisponibles.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-yellow-800 text-sm">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            Todas las granjas ya están asignadas a este programa.
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
                        type="button"
                        onClick={onAsignar}
                        disabled={!granjaSeleccionada || granjasDisponibles.length === 0}
                        className={`px-4 py-2 rounded-md transition ${!granjaSeleccionada || granjasDisponibles.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        Asignar Granja
                    </button>
                </div>
            </div>
        </Modal>
    );
};