import React, { useState } from 'react';
import type { DiagnosticoItem } from '../../types/diagnosticoTypes';
import Modal from '../Common/Modal';

interface AsignarDocenteModalProps {
    isOpen: boolean;                    // 👈 NECESARIO para tu Modal
    diagnostico: DiagnosticoItem;
    docentes: any[];
    onSubmit: (docenteId: number) => void;
    onClose: () => void;
}

const AsignarDocenteModal: React.FC<AsignarDocenteModalProps> = ({
    isOpen,
    diagnostico,
    docentes,
    onSubmit,
    onClose
}) => {

    const [docenteId, setDocenteId] = useState<number>(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (docenteId) {
            onSubmit(docenteId);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-lg">
            <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Asignar Docente</h2>

                <div className="mb-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800">
                        <strong>Diagnóstico:</strong> {diagnostico.tipo}<br />
                        <strong>Lote:</strong> {diagnostico.lote?.nombre}<br />
                        <strong>Creado por:</strong> {diagnostico.estudiante?.nombre || 'Estudiante'}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Seleccionar Docente *
                        </label>

                        <select
                            value={docenteId}
                            onChange={(e) => setDocenteId(parseInt(e.target.value))}
                            className="w-full border rounded p-2"
                            required
                        >
                            <option value="">Seleccionar docente</option>
                            {docentes.map(doc => (
                                <option key={doc.id} value={doc.id}>
                                    {doc.nombre} ({doc.email}) - {doc.rol?.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={!docenteId}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                        >
                            Asignar Docente
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AsignarDocenteModal;
