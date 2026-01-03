import React from 'react';
import type { Herramienta } from '../types/Inventariotypes';

interface HerramientasTableProps {
    herramientas: Herramienta[];
    onEditar: (herramienta: Herramienta) => void;
    onEliminar: (id: number) => void;
}

const HerramientasTable: React.FC<HerramientasTableProps> = ({
    herramientas,
    onEditar,
    onEliminar
}) => {
    // Función para obtener color según estado
    const getEstadoColor = (estado: string) => {
        switch (estado?.toLowerCase()) {
            case 'disponible': return 'bg-green-100 text-green-800';
            case 'agotado': return 'bg-red-100 text-red-800';
            case 'mantenimiento': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Calcular porcentaje disponible
    const calcularPorcentaje = (total: number, disponible: number) => {
        if (total === 0) return 0;
        return Math.round((disponible / total) * 100);
    };

    return (
        <div>
            <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Herramientasss</h3>
                <p className="text-sm text-gray-500">
                    Mostrando {herramientas.length} herramientas
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
                                Categoríaa
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Inventario
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
                        {herramientas.map((herramienta) => (
                            <tr key={herramienta.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{herramienta.nombre}</p>
                                        {herramienta.descripcion && (
                                            <p className="text-sm text-gray-500 truncate max-w-xs">
                                                {herramienta.descripcion}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {herramienta.categoria_nombre || `Categoría ${herramienta.categoria_id}`}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                            <div className="text-sm text-gray-600">
                                                {`${calcularPorcentaje(herramienta.cantidad_total, herramienta.cantidad_disponible)}%`}
                                                {herramienta.cantidad_disponible}X{herramienta.cantidad_total}
                                                {"ESTA ES LA CAN"}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(herramienta.estado)}`}>
                                        {herramienta.estado?.charAt(0).toUpperCase() + herramienta.estado?.slice(1) || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onEditar(herramienta)}
                                            className="text-yellow-600 hover:text-yellow-900"
                                            title="Editar"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            onClick={() => onEliminar(herramienta.id)}
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

                {herramientas.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <i className="fas fa-tools text-4xl mb-4 text-gray-300"></i>
                        <p className="text-lg mb-2">No hay herramientas registradas</p>
                        <p className="text-sm">Agrega herramientas usando el botón correspondiente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HerramientasTable;