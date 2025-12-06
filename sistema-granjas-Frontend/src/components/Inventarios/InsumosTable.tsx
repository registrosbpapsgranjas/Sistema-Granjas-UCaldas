import React from 'react';
import type { Insumo } from '../types/Inventariotypes';

interface InsumosTableProps {
    insumos: Insumo[];
    onEditar: (insumo: Insumo) => void;
    onEliminar: (id: number) => void;
}

const InsumosTable: React.FC<InsumosTableProps> = ({
    insumos,
    onEditar,
    onEliminar
}) => {
    // Función para obtener color según estado
    const getEstadoColor = (estado: string) => {
        switch (estado?.toLowerCase()) {
            case 'disponible': return 'bg-green-100 text-green-800';
            case 'agotado': return 'bg-red-100 text-red-800';
            case 'bajo_stock': return 'bg-yellow-100 text-yellow-800';
            case 'vencido': return 'bg-orange-100 text-orange-800';
            case 'inactivo': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Verificar si está bajo stock
    const estaBajoStock = (insumo: Insumo) => {
        return insumo.cantidad_disponible <= insumo.nivel_alerta;
    };

    return (
        <div>
            <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Insumos</h3>
                <p className="text-sm text-gray-500">
                    Mostrando {insumos.length} insumos
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Programa
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cantidad
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Unidad
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {insumos.map((insumo) => (
                            <tr key={insumo.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{insumo.nombre}</p>
                                        {insumo.descripcion && (
                                            <p className="text-sm text-gray-500 truncate max-w-xs">
                                                {insumo.descripcion}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {insumo.programa_nombre || `Programa ${insumo.programa_id}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <p className="text-sm text-gray-900">
                                            {insumo.cantidad_disponible} / {insumo.cantidad_total}
                                        </p>
                                        {estaBajoStock(insumo) && (
                                            <p className="text-xs text-yellow-600">
                                                ⚠️ Alerta: {insumo.nivel_alerta} {insumo.unidad_medida}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {insumo.unidad_medida || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(insumo.estado)}`}>
                                        {insumo.estado?.charAt(0).toUpperCase() + insumo.estado?.slice(1) || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onEditar(insumo)}
                                            className="text-yellow-600 hover:text-yellow-900"
                                            title="Editar"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            onClick={() => onEliminar(insumo.id)}
                                            className="text-red-600 hover:text-red-900"
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

                {insumos.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <i className="fas fa-flask text-4xl mb-4 text-gray-300"></i>
                        <p className="text-lg mb-2">No hay insumos registrados</p>
                        <p className="text-sm">Agrega insumos usando el botón correspondiente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InsumosTable;