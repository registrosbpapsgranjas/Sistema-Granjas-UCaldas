import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 Importar useNavigate
import type { CultivoEspecie } from '../../types/cultivoTypes';
import granjaService from '../../services/granjaService';

interface CultivosTableProps {
    cultivos: CultivoEspecie[];
    onEditar: (cultivo: CultivoEspecie) => void;
    onEliminar: (id: number) => void;
}

const CultivosTable: React.FC<CultivosTableProps> = ({
    cultivos,
    onEditar,
    onEliminar
}) => {
    const navigate = useNavigate(); // 👈 Para navegación
    const [granjasMap, setGranjasMap] = useState<Record<number, string>>({});
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const cargarNombresGranjas = async () => {
            if (cultivos.length === 0) return;
            
            const granjaIds = Array.from(
                new Set(cultivos.map(c => c.granja_id).filter(Boolean))
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
    }, [cultivos]);

    // ✅ NUEVA FUNCIÓN: Ver lotes que usan este cultivo
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

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Lista de Cultivos/Especies</h3>
                        <p className="text-sm text-gray-500">
                            Mostrando {cultivos.length} registros
                            {cargando && <span className="ml-2 text-blue-500">(Cargando granjas...)</span>}
                        </p>
                    </div>
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
                                Duración
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {cultivos.map((cultivo) => (
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {cultivo.duracion_dias ? `${cultivo.duracion_dias} días` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        {/* ✅ NUEVO BOTÓN: Ver lotes con este cultivo */}
                                        <button
                                            onClick={(e) => verLotesConCultivo(e, cultivo.id, cultivo.nombre)}
                                            className="text-purple-600 hover:text-purple-900 p-1.5 hover:bg-purple-50 rounded transition-colors"
                                            title="Ver lotes con este cultivo"
                                        >
                                            <i className="fas fa-seedling"></i>
                                        </button>

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
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {cultivos.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <i className="fas fa-leaf text-4xl mb-4 text-gray-300"></i>
                        <p className="text-lg mb-2">No hay cultivos registrados</p>
                        <p className="text-sm">Crea tu primer cultivo usando el botón "Nuevo Cultivo"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CultivosTable;