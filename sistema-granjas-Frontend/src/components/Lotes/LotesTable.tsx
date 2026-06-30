import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import programaService from '../../services/programaService';
import cultivoService from '../../services/cultivoService';
import granjaService from '../../services/granjaService';
import { useAuth } from '../../hooks/useAuth';

interface LotesTableProps {
    lotes: any[];
    onEditar: (lote: any) => void;
    onEliminar: (id: number) => void;
    canWrite?: boolean;
}

const LotesTable: React.FC<LotesTableProps> = ({
    lotes,
    onEditar,
    onEliminar,
    canWrite = true,
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Mapas
    const [programasMap, setProgramasMap] = useState<Record<number, string>>({});
    const [cultivosMap, setCultivosMap] = useState<Record<number, any>>({});
    const [granjasMap, setGranjasMap] = useState<Record<number, any>>({});
    const [cultivosPorLote, setCultivosPorLote] = useState<Record<number, any[]>>({});

    const [cargando, setCargando] = useState(false);

    // 👇 DETERMINAR ROL Y PROGRAMAS DEL USUARIO
    const esAdmin = user?.rol_id === 1;
    const esDocente = user?.rol_id === 2 || user?.rol_id === 5;
    const programasDocente = user?.programas?.map((p: any) => p.id) || [];

    // 👇 FILTRAR LOTES SEGÚN ROL
    const lotesFiltrados = useMemo(() => {
        if (esAdmin) {
            // Administradores ven todos los lotes
            return [...lotes].sort((a, b) => a.id - b.id);
        }

        if (esDocente) {
            // Docentes solo ven lotes de sus programas
            return [...lotes]
                .filter(lote => programasDocente.includes(lote.programa_id))
                .sort((a, b) => a.id - b.id);
        }

        // Otros roles (estudiantes, trabajadores, etc.) ven todos
        return [...lotes].sort((a, b) => a.id - b.id);
    }, [lotes, esAdmin, esDocente, programasDocente]);

    useEffect(() => {
        const cargarDatosRelacionados = async () => {
            if (lotesFiltrados.length === 0) return;

            setCargando(true);

            try {
                // IDs únicos de los lotes filtrados
                const programasIds = Array.from(new Set(lotesFiltrados.map(l => l.programa_id).filter(Boolean)));
                const cultivosIdsSet = new Set<number>();

                lotesFiltrados.forEach(lote => {
                    if (lote.cultivos_ids && Array.isArray(lote.cultivos_ids)) {
                        lote.cultivos_ids.forEach((id: number) => {
                            cultivosIdsSet.add(id);
                        });
                    }
                });

                const granjasIds = Array.from(new Set(lotesFiltrados.map(l => l.granja_id).filter(Boolean)));
                const cultivosIds = Array.from(cultivosIdsSet);

                // Promesas para programas
                const programasPromises = programasIds.map(async (id) => {
                    try {
                        const res = await programaService.obtenerProgramaPorId(id);
                        return { id, nombre: res.nombre };
                    } catch {
                        return { id, nombre: 'No encontrado' };
                    }
                });

                // Promesas para cultivos
                const cultivosPromises = cultivosIds.map(async (id) => {
                    try {
                        const res = await cultivoService.obtenerCultivoPorId(id);
                        return {
                            id,
                            nombre: res.nombre,
                            tipo: res.tipo
                        };
                    } catch {
                        return {
                            id,
                            nombre: 'No encontrado',
                            tipo: 'desconocido'
                        };
                    }
                });

                // Promesas para granjas
                const granjasPromises = granjasIds.map(async (id) => {
                    try {
                        const res = await granjaService.obtenerGranjaPorId(id);
                        return { id, nombre: res.nombre };
                    } catch {
                        return { id, nombre: 'No encontrada' };
                    }
                });

                const [programasResp, cultivosResp, granjasResp] = await Promise.all([
                    Promise.all(programasPromises),
                    Promise.all(cultivosPromises),
                    Promise.all(granjasPromises)
                ]);

                const progMap: Record<number, string> = {};
                programasResp.forEach(p => progMap[p.id] = p.nombre);

                const cultMap: Record<number, any> = {};
                cultivosResp.forEach(c => cultMap[c.id] = c);

                const granMap: Record<number, any> = {};
                granjasResp.forEach(g => granMap[g.id] = g);

                const nuevosCultivosPorLote: Record<number, any[]> = {};

                lotesFiltrados.forEach(lote => {
                    if (lote.cultivos_ids && Array.isArray(lote.cultivos_ids)) {
                        nuevosCultivosPorLote[lote.id] = lote.cultivos_ids
                            .map((id: number) => cultMap[id])
                            .filter(Boolean);
                    } else {
                        nuevosCultivosPorLote[lote.id] = [];
                    }
                });

                setProgramasMap(progMap);
                setCultivosMap(cultMap);
                setGranjasMap(granMap);
                setCultivosPorLote(nuevosCultivosPorLote);

            } catch (error) {
                console.error('Error cargando datos relacionados:', error);
            } finally {
                setCargando(false);
            }
        };

        cargarDatosRelacionados();
    }, [lotesFiltrados]);

    const verPlantasDelLote = (e: React.MouseEvent, loteId: number, loteNombre: string) => {
        e.stopPropagation();
        navigate(`/gestion/plantas?loteId=${loteId}&loteNombre=${encodeURIComponent(loteNombre)}`);
    };

    const getEstadoColor = (estado: string) => {
        switch (estado?.toLowerCase()) {
            case 'activo': return 'bg-green-100 text-green-800';
            case 'inactivo': return 'bg-red-100 text-red-800';
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'completado': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatearFecha = (fechaString: string | null | undefined) => {
        if (!fechaString) return '-';
        try {
            return new Date(fechaString).toLocaleDateString('es-ES');
        } catch {
            return '-';
        }
    };

    const getTipoColor = (tipo: string) => {
        switch (tipo?.toLowerCase()) {
            case 'agricola': return 'bg-green-100 text-green-800';
            case 'pecuario': return 'bg-amber-100 text-amber-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const renderCultivos = (loteId: number) => {
        const cultivosLote = cultivosPorLote[loteId] || [];

        if (cultivosLote.length === 0) {
            return <span className="text-gray-400 text-sm italic">—</span>;
        }

        const cultivosVisibles = cultivosLote.slice(0, 100);

        return (
            <div className="flex flex-wrap gap-1">
                {cultivosVisibles.map((cultivo) => (
                    <span
                        key={cultivo.id}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTipoColor(cultivo.tipo)}`}
                    >
                        <i className={`fas ${cultivo.tipo === 'agricola' ? 'fa-seedling' : 'fa-paw'} mr-1 text-xs`}></i>
                        {cultivo.nombre}
                    </span>
                ))}
            </div>
        );
    };

    const formatearNumero = (numero: number | null | undefined) => {
        if (numero === null || numero === undefined) return '-';
        return numero.toLocaleString('es-ES');
    };

    // 👇 OBTENER NOMBRE DEL PROGRAMA PARA MOSTRAR EN EL HEADER DEL DOCENTE
    const programasDocenteNombres = useMemo(() => {
        if (!esDocente || programasDocente.length === 0) return '';
        return programasDocente
            .map(id => programasMap[id] || `ID: ${id}`)
            .join(', ');
    }, [esDocente, programasDocente, programasMap]);

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Lista de Lotes</h3>
                        <p className="text-sm text-gray-500">
                            Mostrando {lotesFiltrados.length} {lotesFiltrados.length === 1 ? 'lote registrado' : 'lotes registrados'}
                        </p>
                    </div>
                    {esDocente && (
                        <div className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                            <i className="fas fa-chalkboard-teacher"></i>
                            {programasDocente.length > 0 ? (
                                <span>Mostrando lotes de: <strong>{programasDocenteNombres}</strong></span>
                            ) : (
                                <span>Sin programas asignados</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Granja</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cultivos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surcos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plantas/Surco</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Plantas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siembra</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {lotesFiltrados.map((lote) => {
                            const granja = granjasMap[lote.granja_id];
                            const totalPlantas = lote.surcos && lote.plantas_por_surco
                                ? lote.surcos * lote.plantas_por_surco
                                : null;

                            return (
                                <tr key={lote.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{lote.nombre}</div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {granja?.nombre || lote.nombre_granja || `Granja ID: ${lote.granja_id}`}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        {renderCultivos(lote.id)}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {programasMap[lote.programa_id] || `Programa ID: ${lote.programa_id}`}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 text-center">
                                            {formatearNumero(lote.surcos)}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 text-center">
                                            {formatearNumero(lote.plantas_por_surco)}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-green-600 text-center">
                                            {totalPlantas ? formatearNumero(totalPlantas) : '-'}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(lote.estado)}`}>
                                            {lote.estado ? lote.estado.charAt(0).toUpperCase() + lote.estado.slice(1) : 'N/A'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        Inicio: {formatearFecha(lote.fecha_inicio)}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/lotes/${lote.id}/mapa`);
                                                }}
                                                className="text-blue-600 hover:text-blue-900 transition-colors p-2 hover:bg-blue-50 rounded"
                                                title="Ver mapa del lote"
                                            >
                                                <i className="fas fa-map"></i>
                                            </button>
                                            <button
                                                onClick={(e) => verPlantasDelLote(e, lote.id, lote.nombre)}
                                                className="text-green-600 hover:text-green-900 transition-colors p-2 hover:bg-green-50 rounded"
                                                title="Ver plantas de este lote"
                                            >
                                                <i className="fas fa-leaf"></i>
                                            </button>

                                            {canWrite && (
                                              <>
                                                <button
                                                    onClick={() => onEditar(lote)}
                                                    className="text-yellow-600 hover:text-yellow-900 transition-colors p-2 hover:bg-yellow-50 rounded"
                                                    title="Editar lote"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => onEliminar(lote.id)}
                                                    className="text-red-600 hover:text-red-900 transition-colors p-2 hover:bg-red-50 rounded"
                                                    title="Eliminar lote"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                              </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {lotesFiltrados.length === 0 && (
                    <div className="text-center py-12">
                        <i className="fas fa-archive text-gray-400 text-5xl mb-4"></i>
                        <p className="text-lg text-gray-500">
                            {esDocente && programasDocente.length === 0 ? (
                                'No tienes programas asignados'
                            ) : esDocente ? (
                                'No hay lotes en tus programas asignados'
                            ) : (
                                'No hay lotes registrados'
                            )}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                            {esDocente && programasDocente.length === 0 ? (
                                'Contacta con un administrador para que te asigne programas'
                            ) : esDocente ? (
                                'Puedes ver los lotes de otros programas si te los asignan'
                            ) : (
                                'Comienza creando un nuevo lote desde el botón "Nuevo Lote"'
                            )}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LotesTable;