// src/components/GranjasTable.tsx
import React from 'react';

interface GranjasTableProps {
    granjas: any[];
    onEditar: (granja: any) => void;
    onEliminar: (id: number) => void;
    onVerDetalles: (granja: any) => void;
}

const GranjasTable: React.FC<GranjasTableProps> = ({
    granjas,
    onEditar,
    onEliminar,
    onVerDetalles
}) => {
    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ubicación
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
                        {granjas.map((granja) => (
                            <tr key={granja.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {granja.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {granja.nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {granja.ubicacion}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${granja.activo
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {granja.activo ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(granja.fecha_creacion).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        {/* Botón Ver Detalles */}
                                        <button
                                            onClick={() => onVerDetalles(granja)}
                                            className="text-green-600 hover:text-green-900 transition-colors"
                                            title="Ver Detalles"
                                        >
                                            <i className="fas fa-eye"></i>
                                        </button>

                                        {/* Botón Editar */}
                                        <button
                                            onClick={() => onEditar(granja)}
                                            className="text-blue-600 hover:text-blue-900 transition-colors"
                                            title="Editar"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>

                                        {/* Botón Eliminar */}
                                        <button
                                            onClick={() => onEliminar(granja.id)}
                                            className="text-red-600 hover:text-red-900 transition-colors"
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

                {granjas.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <i className="fas fa-warehouse text-4xl mb-4 text-gray-300"></i>
                        <p>No hay granjas registradas</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GranjasTable;