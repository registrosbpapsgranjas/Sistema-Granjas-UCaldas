import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CultivoEspecie } from '../../types/cultivoTypes';
import granjaService from '../../services/granjaService';
import { useAuth } from '../../hooks/useAuth';
import loteService from '../../services/loteService';

interface CultivosTableProps {
    cultivos: CultivoEspecie[];
    onEditar: (cultivo: CultivoEspecie) => void;
    onEliminar: (id: number) => void;
    canWrite?: boolean;
}

const CultivosTable: React.FC<CultivosTableProps> = ({
    cultivos,
    onEditar,
    onEliminar,
    canWrite = true,
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [granjasMap, setGranjasMap] = useState<Record<number, string>>({});
    const [cargando, setCargando] = useState(false);
    const [cultivosFiltradosIds, setCultivosFiltradosIds] = useState<Set<number>>(new Set());
    const [cargandoFiltros, setCargandoFiltros] = useState(false);

    // 👇 DETERMINAR ROL Y PROGRAMAS DEL USUARIO
    const esAdmin = user?.rol_id === 1;
    const esDocente = user?.rol_id === 2 || user?.rol_id === 5;
    const programasDocente = user?.programas?.map((p: any) => p.id) || [];

    // 👇 FILTRAR CULTIVOS SEGÚN ROL
    const cultivosFiltrados = useMemo(() => {
        if (esAdmin) {
            // Administradores ven todos los cultivos
            return [...cultivos].sort((a, b) => a.id - b.id);
        }

        if (esDocente) {
            // Docentes solo ven cultivos de sus programas
            return [...cultivos]
                .filter(cultivo => cultivosFiltradosIds.has(cultivo.id))
                .sort((a, b) => a.id - b.id);
        }

        // Otros roles ven todos los cultivos
        return [...cultivos].sort((a, b) => a.id - b.id);
    }, [cultivos, esAdmin, esDocente, cultivosFiltradosIds]);

    // 👇 OBTENER CULTIVOS DE LOS PROGRAMAS DEL DOCENTE
    useEffect(() => {
        const obtenerCultivosDeProgramas = async () => {
            if (!esDocente || programasDocente.length === 0) {
                setCultivosFiltradosIds(new Set());
                return;
            }

            setCargandoFiltros(true);
            const idsSet = new Set<number>();

            try {
                // Para cada programa del docente, obtener sus lotes y cultivos
                for (const programaId of programasDocente) {
                    try {
                        const lotes = await loteService.obtenerLotesPorPrograma(programaId);
                        
                        if (Array.isArray(lotes)) {
                            lotes.forEach((lote: any) => {
                                if (lote.cultivos_ids && Array.isArray(lote.cultivos_ids)) {
                                    lote.cultivos_ids.forEach((cultivoId: number) => {
                                        idsSet.add(cultivoId);
                                    });
                                }
                            });
                        }
                    } catch (error) {
                        console.error(`Error obteniendo lotes del programa ${programaId}:`, error);
                    }
                }

                setCultivosFiltradosIds(idsSet);
            } catch (error) {
                console.error('Error obteniendo cultivos de programas:', error);
            } finally {
                setCargandoFiltros(false);
            }
        };

        obtenerCultivosDeProgramas();
    }, [esDocente, programasDocente]);

    useEffect(() => {
        const cargarNombresGranjas = async () => {
            if (cultivosFiltrados.length === 0) return;
            
            const granjaIds = Array.from(
                new Set(cultivosFiltrados.map(c => c.granja_id).filter(Boolean))
            ) as number[];
            
            if (granjaIds.length === 0) return;
            
            setCargando(true);
            
            try {
                const promesas = granjaIds.map(async (id) => {
                    try {
                        const res = await granjaService.obtenerGranjaPorId(id);
                        return { id, nombre: res.nombre };
                    } catch (error) {
                        console.error(`Error al obtener granja ${id}:`, error);
                        return { id, nombre: 'No encontrada' };
                    }
                });
                
                const resultados = await Promise.all(promesas);
                const nuevoMap: Record<number, string> = {};
                resultados.forEach(r => nuevoMap[r.id] = r.nombre);
                setGranjasMap(nuevoMap);
            } catch (error) {
                console.error('Error cargando nombres de granjas:', error);
            } finally {
                setCargando(false);
            }
        };
        
        cargarNombresGranjas();
    }, [cultivosFiltrados]);

    const verLotesConCultivo = (e: React.MouseEvent, cultivoId: number, cultivoNombre: string) => {
        e.stopPropagation();
        navigate(`/lotes?cultivoId=${cultivoId}&cultivoNombre=${encodeURIComponent(cultivoNombre)}`);
    };

    const getTipoColor = (tipo: string) => {
        switch (tipo?.toLowerCase()) {
            case 'agricola': return 'bg-green-100 text-green-800';
            case 'pecuario': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado?.toLowerCase()) {
            case 'activo': return 'bg-blue-100 text-blue-800';
            case 'completado': return 'bg-purple-100 text-purple-800';
            case 'inactivo': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // 👇 OBTENER NOMBRES DE PROGRAMAS DEL DOCENTE PARA MOSTRAR
    const programasDocenteNombres = useMemo(() => {
        if (!esDocente || programasDocente.length === 0) return '';
        // Nota: Los nombres de programas no están disponibles aquí, se podrían pasar como prop
        return programasDocente.join(', ');
    }, [esDocente, programasDocente]);

    // 👇 CONTAR CULTIVOS ENCONTRADOS PARA DOCENTE
    const totalCultivosEncontrados = cultivosFiltradosIds.size;

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Lista de Cultivos/Especies</h3>
                        <p className="text-sm text-gray-500">
                            Mostrando {cultivosFiltrados.length} registros
                            {cargando && <span className="ml-2 text-blue-500">(Cargando granjas...)</span>}
                            {cargandoFiltros && <span className="ml-2 text-purple-500">(Filtrando cultivos...)</span>}
                        </p>
                    </div>
                    {esDocente && (
                        <div className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                            <i className="fas fa-chalkboard-teacher"></i>
                            {programasDocente.length > 0 ? (
                                <span>
                                    Mostrando cultivos de {totalCultivosEncontrados} cultivo(s) en tus programas
                                </span>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Granja
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {cultivosFiltrados.map((cultivo) => (
                            <tr key={cultivo.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{cultivo.nombre}</p>
                                        {cultivo.descripcion && (
                                            <p className="text-sm text-gray-500 truncate max-w-xs">
                                                {cultivo.descripcion}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(cultivo.tipo)}`}>
                                        {cultivo.tipo?.charAt(0).toUpperCase() + cultivo.tipo?.slice(1) || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(cultivo.estado)}`}>
                                        {cultivo.estado?.charAt(0).toUpperCase() + cultivo.estado?.slice(1) || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {granjasMap[cultivo.granja_id] || cultivo.granja_nombre || `Granja ${cultivo.granja_id}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={(e) => verLotesConCultivo(e, cultivo.id, cultivo.nombre)}
                                            className="text-purple-600 hover:text-purple-900 p-1.5 hover:bg-purple-50 rounded transition-colors"
                                            title="Ver lotes con este cultivo"
                                        >
                                            <i className="fas fa-seedling"></i>
                                        </button>

                                        {canWrite && (
                                          <>
                                            <button
                                                onClick={() => onEditar(cultivo)}
                                                className="text-yellow-600 hover:text-yellow-900 p-1.5 hover:bg-yellow-50 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={() => onEliminar(cultivo.id)}
                                                className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded transition-colors"
                                                title="Eliminar"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                          </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {cultivosFiltrados.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <i className="fas fa-leaf text-4xl mb-4 text-gray-300"></i>
                        <p className="text-lg mb-2">
                            {esDocente && programasDocente.length === 0 ? (
                                'No tienes programas asignados'
                            ) : esDocente ? (
                                'No hay cultivos en tus programas asignados'
                            ) : (
                                'No hay cultivos registrados'
                            )}
                        </p>
                        <p className="text-sm">
                            {esDocente && programasDocente.length === 0 ? (
                                'Contacta con un administrador para que te asigne programas'
                            ) : esDocente ? (
                                'Los cultivos aparecerán aquí cuando estén asociados a tus programas'
                            ) : (
                                'Crea tu primer cultivo usando el botón "Nuevo Cultivo"'
                            )}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CultivosTable;