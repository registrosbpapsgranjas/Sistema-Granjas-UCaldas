import React from 'react';
import type { CategoriaInventario } from '../types/Inventariotypes';

interface CategoriasTableProps {
    categorias: CategoriaInventario[];
    onEditar: (categoria: CategoriaInventario) => void;
    onEliminar: (id: number) => void;
}

const CategoriasTable: React.FC<CategoriasTableProps> = ({
    categorias,
    onEditar,
    onEliminar
}) => {
    return (
        <div>
            <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Categorías de Inventario</h3>
                <p className="text-sm text-gray-500">
                    Mostrando {categorias.length} categorías
                </p>
            </div>

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
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {categorias.map((categoria) => (
                            <tr key={categoria.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {categoria.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <p className="text-sm font-medium text-gray-900">{categoria.nombre}</p>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {categoria.descripcion || 'Sin descripción'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onEditar(categoria)}
                                            className="text-yellow-600 hover:text-yellow-900"
                                            title="Editar"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            onClick={() => onEliminar(categoria.id)}
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

                {categorias.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <i className="fas fa-tags text-4xl mb-4 text-gray-300"></i>
                        <p className="text-lg mb-2">No hay categorías registradas</p>
                        <p className="text-sm">Agrega categorías usando el botón correspondiente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoriasTable;