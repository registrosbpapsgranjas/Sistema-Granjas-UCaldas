import React, { useState, useEffect } from 'react';
import type { DiagnosticoDetalle } from '../../types/diagnosticoTypes';
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
    const [loadingDetalles, setLoadingDetalles] = useState(false);
    const [diagnosticoDetallado, setDiagnosticoDetallado] = useState<DiagnosticoDetalle | null>(null);
    const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
    const [pestanaActiva, setPestanaActiva] = useState<'general' | 'plantas' | 'fotos'>('general');

    useEffect(() => {
        if (isOpen && diagnostico) {
            setDiagnosticoDetallado(null);
            setPestanaActiva('general');
            setImagenSeleccionada(null);
            cargarDetallesCompletos(diagnostico.id);
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

    if (!diagnostico) return null;

    const data = diagnosticoDetallado || diagnostico;
    const fotosSubidas = data.formulario?.fotos_subidas as Record<string, string[]> | undefined;
    const tieneFotos = fotosSubidas && Object.keys(fotosSubidas).length > 0;
    const tienePlantas = data.formulario?.plantas && data.formulario.plantas.length > 0;
    const tieneCaracterizacion = data.formulario?.caracterizacion && Object.keys(data.formulario.caracterizacion).length > 0;
    const tieneFormulariosPorPlanta = data.formulario?.formularios_por_planta && Object.keys(data.formulario.formularios_por_planta).length > 0;

    const formatFieldName = (key: string): string => {
        return key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const getBadgeRevision = (estado?: string) => {
        if (!estado || estado === 'pendiente_revision') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    Pendiente de revisión
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Revisado
            </span>
        );
    };

    const getCondicionIcon = (condicion: string) => {
        switch (condicion?.toLowerCase()) {
            case 'soleado': return '☀️';
            case 'nublado': return '☁️';
            case 'lluvia': return '🌧️';
            default: return '🌡️';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-6xl">
            <div className="relative">
                {/* Header con gradiente */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl px-6 py-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                                    🔬
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        Diagnóstico #{data.id}
                                    </h2>
                                    <p className="text-blue-100 text-sm mt-0.5">
                                        {data.tipo_diagnostico?.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                                {getBadgeRevision(data.estado_revision)}
                                <span className="inline-flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full">
                                    <span>{getCondicionIcon(data.condiciones_dia)}</span>
                                    <span>{data.condiciones_dia}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full">
                                    📅 {new Date(data.fecha_creacion).toLocaleDateString('es-CO', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Pestañas de navegación */}
                <div className="bg-gray-100 border-b border-gray-200 px-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPestanaActiva('general')}
                            className={`px-4 py-3 text-sm font-medium transition-all ${
                                pestanaActiva === 'general'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white -mb-px'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-t-lg'
                            }`}
                        >
                            <i className="fas fa-info-circle mr-2"></i>
                            Información general
                        </button>
                        {(tienePlantas || tieneCaracterizacion || tieneFormulariosPorPlanta) && (
                            <button
                                onClick={() => setPestanaActiva('plantas')}
                                className={`px-4 py-3 text-sm font-medium transition-all ${
                                    pestanaActiva === 'plantas'
                                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white -mb-px'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-t-lg'
                                }`}
                            >
                                <i className="fas fa-seedling mr-2"></i>
                                Evaluación
                                {tienePlantas && <span className="ml-1 text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">{data.formulario.plantas.length}</span>}
                            </button>
                        )}
                        {tieneFotos && (
                            <button
                                onClick={() => setPestanaActiva('fotos')}
                                className={`px-4 py-3 text-sm font-medium transition-all ${
                                    pestanaActiva === 'fotos'
                                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white -mb-px'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-t-lg'
                                }`}
                            >
                                <i className="fas fa-camera mr-2"></i>
                                Evidencias
                                <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                                    {Object.values(fotosSubidas || {}).flat().length}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {loadingDetalles ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-500">Cargando detalles del diagnóstico...</p>
                        </div>
                    ) : (
                        <>
                            {/* Pestaña: Información general */}
                            {pestanaActiva === 'general' && (
                                <div className="space-y-6">
                                    {/* Tarjeta de usuario y ubicación */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                    <i className="fas fa-user text-lg"></i>
                                                </div>
                                                <h3 className="font-bold text-gray-800 text-lg">Usuario</h3>
                                            </div>
                                            <p className="text-gray-700 font-medium">{data.usuario_nombre || 'N/A'}</p>
                                            {data.usuario_email && (
                                                <p className="text-sm text-gray-500 mt-1">{data.usuario_email}</p>
                                            )}
                                        </div>

                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                                    <i className="fas fa-map-marker-alt text-lg"></i>
                                                </div>
                                                <h3 className="font-bold text-gray-800 text-lg">Ubicación</h3>
                                            </div>
                                            <div className="space-y-2">
                                                <p><span className="font-semibold">Programa:</span> {data.programa_nombre || 'N/A'}</p>
                                                <p><span className="font-semibold">Lote:</span> {data.lote_nombre || 'N/A'}</p>
                                                <p><span className="font-semibold">Granja:</span> {data.granja_nombre || 'N/A'}</p>
                                                {data.formulario?.total_plantas_lote && (
                                                    <p className="text-sm text-green-600 mt-2">
                                                        <i className="fas fa-chart-line mr-1"></i>
                                                        Total plantas en lote: {data.formulario.total_plantas_lote.toLocaleString()}
                                                        {data.formulario.porcentaje_muestreo && 
                                                            ` (Muestreo: ${data.formulario.porcentaje_muestreo}%)`
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Resumen del monitoreo */}
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                                <i className="fas fa-clipboard-list text-lg"></i>
                                            </div>
                                            <h3 className="font-bold text-gray-800 text-lg">Resumen del monitoreo</h3>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="text-center p-3 bg-white rounded-lg">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {data.formulario?.plantas?.length || 0}
                                                </div>
                                                <div className="text-xs text-gray-500">Plantas evaluadas</div>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg">
                                                <div className="text-2xl font-bold text-green-600">
                                                    {tieneCaracterizacion ? Object.keys(data.formulario.caracterizacion).length : 0}
                                                </div>
                                                <div className="text-xs text-gray-500">Campos evaluados</div>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg">
                                                <div className="text-2xl font-bold text-orange-600">
                                                    {tieneFormulariosPorPlanta ? Object.keys(data.formulario.formularios_por_planta).length : 0}
                                                </div>
                                                <div className="text-xs text-gray-500">Con evaluación individual</div>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg">
                                                <div className="text-2xl font-bold text-purple-600">
                                                    {tieneFotos ? Object.values(fotosSubidas || {}).flat().length : 0}
                                                </div>
                                                <div className="text-xs text-gray-500">Fotos subidas</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recomendaciones si existen */}
                                    {data.recomendaciones && data.recomendaciones.length > 0 && (
                                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                                    <i className="fas fa-lightbulb text-lg"></i>
                                                </div>
                                                <h3 className="font-bold text-gray-800 text-lg">Recomendaciones</h3>
                                            </div>
                                            <div className="space-y-3">
                                                {data.recomendaciones.map((rec: any, idx: number) => (
                                                    <div key={idx} className="bg-white rounded-lg p-3 border border-orange-100">
                                                        <p className="font-medium text-gray-800">{rec.titulo}</p>
                                                        {rec.descripcion && (
                                                            <p className="text-sm text-gray-600 mt-1">{rec.descripcion}</p>
                                                        )}
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            {new Date(rec.fecha_creacion).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Pestaña: Evaluación (Plantas y formularios) */}
                            {pestanaActiva === 'plantas' && (
                                <div className="space-y-6">
                                    {/* Plantas muestreadas */}
                                    {tienePlantas && (
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                                    <i className="fas fa-seedling text-lg"></i>
                                                </div>
                                                <h3 className="font-bold text-gray-800 text-lg">
                                                    Plantas muestreadas
                                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                                        ({data.formulario.plantas.length} plantas)
                                                    </span>
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                {data.formulario.plantas.map((p: any, i: number) => (
                                                    <div key={i} className="bg-white rounded-lg px-3 py-2 text-sm shadow-sm border border-green-100">
                                                        <i className="fas fa-map-pin text-green-500 mr-1 text-xs"></i>
                                                        {p.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Caracterización general */}
                                    {tieneCaracterizacion && (
                                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                    <i className="fas fa-chart-bar text-lg"></i>
                                                </div>
                                                <h3 className="font-bold text-gray-800 text-lg">Caracterización general</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {Object.entries(data.formulario.caracterizacion).map(([k, v]) => {
                                                    let valorMostrado = v as string;
                                                    let esArray = false;
                                                    
                                                    if (typeof v === 'string' && (v.startsWith('[') || v.startsWith('{'))) {
                                                        try {
                                                            const parsed = JSON.parse(v);
                                                            if (Array.isArray(parsed)) {
                                                                valorMostrado = parsed.join(', ');
                                                                esArray = true;
                                                            }
                                                        } catch (e) {}
                                                    }
                                                    
                                                    return (
                                                        <div key={k} className="bg-white rounded-lg p-3 border border-gray-200">
                                                            <div className="text-xs text-gray-500 uppercase tracking-wide">
                                                                {formatFieldName(k)}
                                                            </div>
                                                            <div className="text-gray-800 font-medium mt-1">
                                                                {esArray ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {(valorMostrado as string).split(', ').map((item, idx) => (
                                                                            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                                                                                {item}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    valorMostrado || '—'
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Evaluación por planta */}
                                    {tieneFormulariosPorPlanta && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                                    <i className="fas fa-list-ul text-lg"></i>
                                                </div>
                                                <h3 className="font-bold text-gray-800 text-lg">Evaluación por planta</h3>
                                            </div>
                                            <div className="space-y-4">
                                                {Object.entries(data.formulario.formularios_por_planta).map(([plantaId, valores]) => {
                                                    const planta = data.formulario?.plantas?.find((p: any) => p.id === parseInt(plantaId));
                                                    return (
                                                        <div key={plantaId} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 overflow-hidden">
                                                            <div className="bg-purple-100 px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <i className="fas fa-seedling text-purple-600"></i>
                                                                    <span className="font-semibold text-gray-800">
                                                                        {planta?.label || `Planta ID: ${plantaId}`}
                                                                    </span>
                                                                    {planta?.codigo && (
                                                                        <span className="text-xs text-gray-500">({planta.codigo})</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {Object.entries(valores as Record<string, string>).map(([campo, valor]) => {
                                                                    let valorMostrado = valor;
                                                                    if (typeof valor === 'string' && (valor.startsWith('[') || valor.startsWith('{'))) {
                                                                        try {
                                                                            const parsed = JSON.parse(valor);
                                                                            if (Array.isArray(parsed)) {
                                                                                valorMostrado = parsed.join(', ');
                                                                            }
                                                                        } catch (e) {}
                                                                    }
                                                                    return (
                                                                        <div key={campo} className="bg-white rounded-lg p-2">
                                                                            <div className="text-xs text-gray-500">{formatFieldName(campo)}</div>
                                                                            <div className="text-sm text-gray-800">{valorMostrado || '—'}</div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {!tienePlantas && !tieneCaracterizacion && !tieneFormulariosPorPlanta && (
                                        <div className="text-center py-12 text-gray-400">
                                            <i className="fas fa-inbox text-5xl mb-3 block"></i>
                                            <p>No hay información de evaluación disponible</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Pestaña: Fotos / Evidencias */}
                            {pestanaActiva === 'fotos' && tieneFotos && (
                                <div className="space-y-6">
                                    {Object.entries(fotosSubidas).map(([campo, urls]) => (
                                        <div key={campo} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 border border-gray-200">
                                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <i className="fas fa-folder-open text-blue-500"></i>
                                                {formatFieldName(campo)}
                                                <span className="text-sm font-normal text-gray-500">({urls.length} fotos)</span>
                                            </h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {urls.map((url, idx) => (
                                                    <div
                                                        key={`${campo}-${idx}`}
                                                        className="relative group cursor-pointer"
                                                        onClick={() => setImagenSeleccionada(url)}
                                                    >
                                                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300">
                                                            <img
                                                                src={url}
                                                                alt={`${campo} - ${idx + 1}`}
                                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                                                                loading="lazy"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Error+al+cargar';
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                            <i className="fas fa-search-plus text-white text-2xl"></i>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal de imagen ampliada */}
            {imagenSeleccionada && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setImagenSeleccionada(null)}
                >
                    <div className="relative max-w-4xl w-full">
                        <button
                            onClick={() => setImagenSeleccionada(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl"
                        >
                            ✕
                        </button>
                        <img
                            src={imagenSeleccionada}
                            alt="Vista ampliada"
                            className="w-full h-auto rounded-lg shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default DetallesDiagnosticoModal;