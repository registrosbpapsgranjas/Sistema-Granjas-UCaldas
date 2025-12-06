import React, { useState, useEffect } from 'react';
import type { DiagnosticoDetalle, Evidencia } from '../../types/diagnosticoTypes';
import Modal from '../Common/Modal';
import diagnosticoService from '../../services/diagnosticoService';

interface DetallesDiagnosticoModalProps {
    isOpen: boolean;
    diagnostico: DiagnosticoDetalle | null;
    onClose: () => void;
}

const DetallesDiagnosticoModal: React.FC<DetallesDiagnosticoModalProps> = ({
    isOpen,
    diagnostico,
    onClose
}) => {
    const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
    const [loadingEvidencias, setLoadingEvidencias] = useState(false);
    const [loadingDetalles, setLoadingDetalles] = useState(false);
    const [diagnosticoDetallado, setDiagnosticoDetallado] = useState<DiagnosticoDetalle | null>(null);

    useEffect(() => {
        if (isOpen && diagnostico) {
            setDiagnosticoDetallado(null); // limpiar antes de cargar
            cargarDetallesCompletos(diagnostico.id);
            cargarEvidencias(diagnostico.id);
        }
    }, [isOpen, diagnostico]);

    const cargarDetallesCompletos = async (id: number) => {
        try {
            setLoadingDetalles(true);
            const detalles = await diagnosticoService.obtenerDiagnosticoPorId(id);
            setDiagnosticoDetallado(detalles);
        } catch (err) {
            console.error('Error cargando detalles:', err);
        } finally {
            setLoadingDetalles(false);
        }
    };

    const cargarEvidencias = async (id: number) => {
        try {
            setLoadingEvidencias(true);
            console.log('Cargando evidencias para diagnóstico ID:', id);
            const data = await diagnosticoService.obtenerEvidencias(id);
            const evidenciasData = Array.isArray(data) ? data : (data?.items || []);
            console.log('Evidencias cargadas:', evidenciasData);
            setEvidencias(evidenciasData);
        } catch (err) {
            console.error('Error cargando evidencias:', err);
            setEvidencias([]);
        } finally {
            setLoadingEvidencias(false);
        }
    };

    if (!diagnostico) return null;

    const getEstadoBadge = (estado: string) => {
        const estados: Record<string, { color: string; icon: string }> = {
            abierto: { color: 'bg-green-100 text-green-800', icon: 'fas fa-circle' },
            en_revision: { color: 'bg-yellow-100 text-yellow-800', icon: 'fas fa-clock' },
            cerrado: { color: 'bg-red-100 text-red-800', icon: 'fas fa-check-circle' }
        };

        const config = estados[estado] || { color: 'bg-gray-100 text-gray-800', icon: 'fas fa-question-circle' };

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                <i className={`${config.icon} mr-2`}></i>
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </span>
        );
    };

    const getTipoIcon = (tipo: string) => {
        const icons: Record<string, string> = {
            imagen: 'fas fa-image text-blue-500',
            video: 'fas fa-video text-red-500',
            documento: 'fas fa-file-alt text-green-500',
            audio: 'fas fa-volume-up text-purple-500',
            otro: 'fas fa-file text-gray-500'
        };
        return icons[tipo] || 'fas fa-file text-gray-500';
    };

    const data = diagnosticoDetallado || diagnostico;

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-4xl">
            <div className="p-6 max-h-[90vh] overflow-y-auto">

                {/* HEADER */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            Diagnóstico #{data.id}
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                            {getEstadoBadge(data.estado)}
                            <span className="text-gray-600">
                                <i className="fas fa-tag mr-1"></i>
                                {data.tipo}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                {loadingDetalles ? (
                    <div className="text-center py-8">
                        <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                        <p className="mt-2 text-gray-600">Cargando detalles...</p>
                    </div>
                ) : (
                    <>
                        {/* INFO GENERAL */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                            {/* Col 1 */}
                            <div className="space-y-4">
                                {/* Info */}
                                <div className="bg-white border rounded-lg p-5 shadow-sm">
                                    <h3 className="font-bold text-lg mb-4 text-gray-800">
                                        <i className="fas fa-info-circle mr-2 text-blue-500"></i>
                                        Información del Diagnóstico
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="flex">
                                            <span className="font-medium text-gray-700 w-40">Tipo:</span>
                                            <span>{data.tipo}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="font-medium text-gray-700 w-40">Fecha creación:</span>
                                            <span>{new Date(data.fecha_creacion).toLocaleString()}</span>
                                        </div>
                                        {data.fecha_revision && (
                                            <div className="flex">
                                                <span className="font-medium text-gray-700 w-40">Fecha revisión:</span>
                                                <span>{new Date(data.fecha_revision).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div className="bg-white border rounded-lg p-5 shadow-sm">
                                    <h3 className="font-bold text-lg mb-4 text-gray-800">
                                        <i className="fas fa-file-alt mr-2 text-green-500"></i>
                                        Descripción
                                    </h3>
                                    <div className="bg-gray-50 rounded p-4">
                                        <p className="whitespace-pre-line text-gray-700">{data.descripcion}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Col 2 */}
                            <div className="space-y-4">

                                {/* Contexto */}
                                <div className="bg-white border rounded-lg p-5 shadow-sm">
                                    <h3 className="font-bold text-lg mb-4 text-gray-800">
                                        <i className="fas fa-link mr-2 text-purple-500"></i>
                                        Contexto y Relaciones
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="flex">
                                            <span className="font-medium text-gray-700 w-32">Lote:</span>
                                            <span>{data.lote_nombre || 'N/A'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="font-medium text-gray-700 w-32">Granja:</span>
                                            <span>{data.granja_nombre || 'N/A'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="font-medium text-gray-700 w-32">Programa:</span>
                                            <span>{data.programa_nombre || 'N/A'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="font-medium text-gray-700 w-32">Estudiante:</span>
                                            <span>{data.estudiante_nombre || data.estudiante_id || 'N/A'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="font-medium text-gray-700 w-32">Docente:</span>
                                            <span>{data.docente_nombre || 'Sin asignar'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Observaciones */}
                                {data.observaciones && (
                                    <div className="bg-white border border-yellow-200 rounded-lg p-5 shadow-sm">
                                        <h3 className="font-bold text-lg mb-4 text-gray-800">
                                            <i className="fas fa-sticky-note mr-2 text-yellow-500"></i>
                                            Observaciones
                                        </h3>
                                        <div className="bg-yellow-50 rounded p-4">
                                            <p className="whitespace-pre-line text-yellow-800">
                                                {data.observaciones}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* EVIDENCIAS */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-xl text-gray-800 flex items-center">
                                    <i className="fas fa-folder-open mr-2 text-blue-500"></i>
                                    Evidencias
                                </h3>
                                <span className="text-sm text-gray-500">
                                    {evidencias.length} archivo{evidencias.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            {loadingEvidencias ? (
                                <div className="text-center py-4">
                                    <i className="fas fa-spinner fa-spin text-blue-500 mr-2"></i>
                                    Cargando evidencias...
                                </div>
                            ) : evidencias.length === 0 ? (
                                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded">
                                    <i className="fas fa-image text-3xl text-gray-300 mb-2"></i>
                                    <p className="text-gray-500">No hay evidencias registradas</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {evidencias.map((e) => (
                                        <div key={e.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                                            <div className="p-3 bg-gray-50 border-b">
                                                <div className="flex items-center">
                                                    <i className={`${getTipoIcon(e.tipo)} mr-2`}></i>
                                                    <span className="font-medium capitalize">{e.tipo}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1 truncate">
                                                    {e.descripcion}
                                                </p>
                                            </div>
                                            <div className="p-3">
                                                <a
                                                    href={e.url_archivo}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                                >
                                                    <i className="fas fa-external-link-alt mr-1"></i>
                                                    Ver archivo
                                                </a>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Subido: {new Date(e.fecha_creacion).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default DetallesDiagnosticoModal;
