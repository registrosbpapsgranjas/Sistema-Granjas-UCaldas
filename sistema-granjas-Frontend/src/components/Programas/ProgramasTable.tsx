// src/components/ProgramasTable.tsx
import React from 'react';

interface ProgramasTableProps {
    programas: any[];
    onEditar: (programa: any) => void;
    onEliminar: (id: number) => void;
    onVerDetalles: (programa: any) => void;
}

const ProgramasTable: React.FC<ProgramasTableProps> = ({
    programas,
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
                                Descripción
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
                        {programas.map((programa) => (
                            <tr key={programa.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {programa.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {programa.nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                                    {programa.descripcion || 'Sin descripción'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${programa.activo
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {programa.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        {/* Botón Ver Detalles */}
                                        <button
                                            onClick={() => onVerDetalles(programa)}
                                            className="text-blue-600 hover:text-blue-900 transition-colors"
                                            title="Ver Detalles"
                                        >
                                            <i className="fas fa-eye"></i>
                                        </button>

                                        {/* Botón Editar */}
                                        <button
                                            onClick={() => onEditar(programa)}
                                            className="text-green-600 hover:text-green-900 transition-colors"
                                            title="Editar"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>

                                        {/* Botón Eliminar */}
                                        <button
                                            onClick={() => onEliminar(programa.id)}
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

                {programas.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <i className="fas fa-clipboard-list text-4xl mb-4 text-gray-300"></i>
                        <p>No hay programas registrados</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgramasTable;