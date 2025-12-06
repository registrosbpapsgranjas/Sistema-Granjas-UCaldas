import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DiagnosticoItem } from '../../types/diagnosticoTypes';
import loteService from '../../services/loteService';

interface DiagnosticosTableProps {
    diagnosticos: DiagnosticoItem[];
    onEditar: (diagnostico: DiagnosticoItem) => void;
    onEliminar: (id: number) => void;
    onAsignarDocente: (diagnostico: DiagnosticoItem) => void;
    onAgregarEvidencia: (diagnostico: DiagnosticoItem) => void;
    onVerDetalles: (diagnostico: DiagnosticoItem) => void;
    onCerrar: (diagnostico: DiagnosticoItem) => void;
    currentUser: any;
}

interface LoteDetallado {
    id: number;
    nombre: string;
    nombre_cultivo: string;
    cultivo_id?: number;
    granja_id?: number;
    programa_id?: number;
    tipo_gestion?: string;
    estado?: string;
}

const DiagnosticosTable: React.FC<DiagnosticosTableProps> = ({
    diagnosticos,
    onEditar,
    onEliminar,
    onAsignarDocente,
    onAgregarEvidencia,
    onVerDetalles,
    onCerrar,
    currentUser
}) => {
    const [lotesDetallados, setLotesDetallados] = useState<Record<number, LoteDetallado>>({});
    const [cargandoLotes, setCargandoLotes] = useState<Record<number, boolean>>({});
    const [lotesCargados, setLotesCargados] = useState<Set<number>>(new Set());

    // Identificar lotes únicos que necesitan ser cargados
    const lotesACargar = useMemo(() => {
        const lotesUnicos = new Set<number>();
        diagnosticos.forEach(d => {
            if (d.lote_id && !lotesCargados.has(d.lote_id)) {
                lotesUnicos.add(d.lote_id);
            }
        });
        return Array.from(lotesUnicos);
    }, [diagnosticos, lotesCargados]);

    // Cargar información detallada de lotes
    const cargarLotes = useCallback(async () => {
        if (lotesACargar.length === 0) return;

        console.log(`🔍 Cargando ${lotesACargar.length} lotes únicos:`, lotesACargar);

        for (const loteId of lotesACargar) {
            // Si ya está cargando o ya cargado, saltar
            if (cargandoLotes[loteId] || lotesCargados.has(loteId)) continue;

            try {
                // Marcar como cargando
                setCargandoLotes(prev => ({ ...prev, [loteId]: true }));

                console.log(`🔍 Obteniendo datos del lote ${loteId}...`);

                // IMPORTANTE: Verifica la URL correcta del endpoint
                // Probablemente debería ser algo como:
                // const loteData = await loteService.obtenerLotePorId(loteId);

                // Por ahora, simulemos una respuesta para depurar
                const loteData = await loteService.obtenerLote(loteId);

                console.log(`✅ Datos del lote ${loteId}:`, loteData);

                // Extraer nombre y cultivo del lote
                // Asegúrate de que la API devuelva estos campos
                const nombreLote = loteData.nombre || loteData.nombre_lote || `Lote ${loteId}`;
                const nombreCultivo = loteData.nombre_cultivo || loteData.cultivo || 'Sin cultivo';

                // Actualizar estado con los datos del lote
                setLotesDetallados(prev => ({
                    ...prev,
                    [loteId]: {
                        id: loteId,
                        nombre: nombreLote,
                        nombre_cultivo: nombreCultivo,
                        cultivo_id: loteData.cultivo_id,
                        granja_id: loteData.granja_id,
                        programa_id: loteData.programa_id,
                        tipo_gestion: loteData.tipo_gestion,
                        estado: loteData.estado
                    }
                }));

                // Marcar como cargado
                setLotesCargados(prev => new Set(prev).add(loteId));

            } catch (error) {
                console.error(`❌ Error cargando lote ${loteId}:`, error);

                // En caso de error, usar datos por defecto
                setLotesDetallados(prev => ({
                    ...prev,
                    [loteId]: {
                        id: loteId,
                        nombre: `Lote ${loteId}`,
                        nombre_cultivo: 'Sin información',
                        cultivo_id: undefined,
                        granja_id: undefined,
                        programa_id: undefined,
                        tipo_gestion: undefined,
                        estado: undefined
                    }
                }));

                // Marcar como cargado para no reintentar
                setLotesCargados(prev => new Set(prev).add(loteId));
            } finally {
                // Limpiar estado de carga
                setCargandoLotes(prev => {
                    const newState = { ...prev };
                    delete newState[loteId];
                    return newState;
                });
            }
        }
    }, [lotesACargar, cargandoLotes, lotesCargados]);

    // Efecto para cargar lotes cuando hay nuevos
    useEffect(() => {
        if (lotesACargar.length > 0) {
            cargarLotes();
        }
    }, [lotesACargar, cargandoLotes, lotesCargados, cargarLotes]);

    // Función auxiliar para obtener información del lote
    const obtenerInfoLote = useCallback((diagnostico: DiagnosticoItem) => {
        if (!diagnostico.lote_id) {
            return { nombre: 'N/A', cultivo: 'Sin lote' };
        }

        const loteId = diagnostico.lote_id;
        const cargando = cargandoLotes[loteId];
        const loteDetallado = lotesDetallados[loteId];

        if (cargando) {
            return { nombre: 'Cargando...', cultivo: '...' };
        }

        if (loteDetallado) {
            return {
                nombre: loteDetallado.nombre,
                cultivo: loteDetallado.nombre_cultivo
            };
        }

        // Si no hay datos todavía
        return {
            nombre: `Lote ${loteId}`,
            cultivo: 'Sin información'
        };
    }, [lotesDetallados, cargandoLotes]);

    // Resto del componente permanece igual...
    const getEstadoBadge = (estado: string) => {
        const estados: Record<string, { color: string; icon: string }> = {
            abierto: { color: 'bg-green-100 text-green-800', icon: 'fas fa-circle' },
            en_revision: { color: 'bg-yellow-100 text-yellow-800', icon: 'fas fa-clock' },
            cerrado: { color: 'bg-red-100 text-red-800', icon: 'fas fa-check-circle' }
        };

        const config = estados[estado] || { color: 'bg-gray-100 text-gray-800', icon: 'fas fa-question-circle' };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <i className={`${config.icon} mr-1`}></i>
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </span>
        );
    };

    // Funciones de permisos (sin cambios)...
    const puedeEditar = (diagnostico: DiagnosticoItem) => {
        if (currentUser?.rol_id === 1) return true;
        if (diagnostico.estudiante_id === currentUser?.id && diagnostico.estado === 'abierto') return true;
        if (diagnostico.docente_id === currentUser?.id && diagnostico.estado !== 'cerrado') return true;
        return false;
    };

    const puedeAsignarDocente = (diagnostico: DiagnosticoItem) => {
        return currentUser?.rol_id === 1 && diagnostico.estado === 'abierto' && !diagnostico.docente_id;
    };

    const puedeCerrar = (diagnostico: DiagnosticoItem) => {
        if (currentUser?.rol_id === 1) return diagnostico.estado !== 'cerrado';
        if (diagnostico.docente_id === currentUser?.id) return diagnostico.estado !== 'cerrado';
        return false;
    };

    const puedeAgregarEvidencia = (diagnostico: DiagnosticoItem) => {
        if (diagnostico.estado === 'cerrado') return false;
        return diagnostico.estudiante_id === currentUser?.id || diagnostico.docente_id === currentUser?.id;
    };

    const puedeEliminar = (diagnostico: DiagnosticoItem) => {
        if (currentUser?.rol_id === 1) return true;
        if (diagnostico.estudiante_id === currentUser?.id && diagnostico.estado === 'abierto') return true;
        return false;
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Lote / Cultivo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estudiante
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Docente
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha Creación
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {diagnosticos.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                    <i className="fas fa-clipboard-list text-3xl mb-2 block text-gray-300"></i>
                                    No hay diagnósticos registrados
                                </td>
                            </tr>
                        ) : (
                            diagnosticos.map((diagnostico) => {
                                const loteInfo = obtenerInfoLote(diagnostico);
                                const loteId = diagnostico.lote_id || 0;

                                return (
                                    <tr key={diagnostico.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            #{diagnostico.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="font-medium">{diagnostico.tipo}</div>
                                            <div className="text-gray-500 truncate max-w-xs">
                                                {diagnostico.descripcion?.substring(0, 50) || 'Sin descripción'}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {loteInfo.nombre}
                                                </div>
                                                <div className="text-gray-500 text-xs">
                                                    <span className="inline-flex items-center">
                                                        <i className="fas fa-seedling mr-1 text-green-500"></i>
                                                        {loteInfo.cultivo}
                                                    </span>
                                                </div>
                                                {lotesDetallados[loteId]?.tipo_gestion && (
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        <i className="fas fa-tag mr-1"></i>
                                                        {lotesDetallados[loteId]?.tipo_gestion}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {diagnostico?.estudiante_nombre || 'N/A'}

                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {diagnostico?.docente_nombre || 'Sin asignar'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getEstadoBadge(diagnostico.estado)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(diagnostico.fecha_creacion).toLocaleDateString()}
                                            <div className="text-xs text-gray-500">
                                                {new Date(diagnostico.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => onVerDetalles(diagnostico)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                    title="Ver detalles"
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>

                                                {puedeEditar(diagnostico) && (
                                                    <button
                                                        onClick={() => onEditar(diagnostico)}
                                                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                                                        title="Editar"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                )}

                                                {puedeAgregarEvidencia(diagnostico) && (
                                                    <button
                                                        onClick={() => onAgregarEvidencia(diagnostico)}
                                                        className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                                                        title="Agregar evidencia"
                                                    >
                                                        <i className="fas fa-paperclip"></i>
                                                    </button>
                                                )}

                                                {puedeAsignarDocente(diagnostico) && (
                                                    <button
                                                        onClick={() => onAsignarDocente(diagnostico)}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                                                        title="Asignar docente"
                                                    >
                                                        <i className="fas fa-user-plus"></i>
                                                    </button>
                                                )}

                                                {puedeCerrar(diagnostico) && (
                                                    <button
                                                        onClick={() => onCerrar(diagnostico)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                        title="Cerrar diagnóstico"
                                                    >
                                                        <i className="fas fa-lock"></i>
                                                    </button>
                                                )}

                                                {puedeEliminar(diagnostico) && (
                                                    <button
                                                        onClick={() => onEliminar(diagnostico.id)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                        title="Eliminar"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DiagnosticosTable;