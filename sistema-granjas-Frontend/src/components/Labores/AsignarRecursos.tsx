// src/components/Labores/AsignarRecursosModal.tsx
import React from 'react';
import type { Labor } from '../../types/laboresTypes';
import Modal from '../Common/Modal';

interface AsignarRecursosModalProps {
    isOpen: boolean;
    labor: Labor | null;
    onClose: () => void;
    onSuccess: () => void;
}

const AsignarRecursosModal: React.FC<AsignarRecursosModalProps> = ({
    isOpen,
    labor,
    onClose,
    onSuccess
}) => {
    if (!isOpen || !labor) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-2xl">
            <div className="p-6">
                <div className="border-b pb-4 mb-4">
                    <h2 className="text-xl font-bold">
                        Asignar Recursos a Labor #{labor.id}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">{labor.tipo_labor_nombre}</p>
                </div>

                <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <i className="fas fa-tools text-yellow-600 text-xl mr-3 mt-0.5"></i>
                            <div>
                                <h3 className="font-semibold text-yellow-800">Funcionalidad en migración</h3>
                                <p className="text-yellow-700 text-sm mt-1">
                                    La gestión de herramientas e insumos está siendo migrada al nuevo sistema de inventario dinámico.
                                    Esta sección será habilitada nuevamente una vez que la migración esté completa.
                                </p>
                                <p className="text-yellow-700 text-sm mt-2">
                                    Por favor, utiliza el nuevo módulo de "Inventario Dinámico" para gestionar recursos por programa.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 border rounded-lg p-4">
                        <h3 className="font-medium text-gray-700 mb-2">Recursos actuales de la labor</h3>
                        <p className="text-gray-500 text-sm">
                            La visualización de recursos asignados estará disponible nuevamente después de la migración.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AsignarRecursosModal;