import React, { useState } from 'react';
import type { Herramienta, Insumo, CategoriaInventario } from '../types/Inventariotypes';

interface InventarioTabsProps {
    herramientas: Herramienta[];
    insumos: Insumo[];
    categorias: CategoriaInventario[];
    onEditarHerramienta: (herramienta: Herramienta) => void;
    onEliminarHerramienta: (id: number) => void;
    onEditarInsumo: (insumo: Insumo) => void;
    onEliminarInsumo: (id: number) => void;
    onEditarCategoria: (categoria: CategoriaInventario) => void;
    onEliminarCategoria: (id: number) => void;
}

const InventarioTabs: React.FC<InventarioTabsProps> = ({
    herramientas,
    insumos,
    categorias,
    onEditarHerramienta,
    onEliminarHerramienta,
    onEditarInsumo,
    onEliminarInsumo,
    onEditarCategoria,
    onEliminarCategoria
}) => {
    const [activeTab, setActiveTab] = useState('herramientas');

    const tabs = [
        { id: 'herramientas', label: 'Herramientas', icon: 'fas fa-tools' },
        { id: 'insumos', label: 'Insumos', icon: 'fas fa-flask' },
        { id: 'categorias', label: 'Categorías', icon: 'fas fa-tags' },
    ];

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Tabs Header */}
            <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                flex items-center px-6 py-4 text-sm font-medium border-b-2
                ${activeTab === tab.id
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
              `}
                        >
                            <i className={`${tab.icon} mr-2`}></i>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {activeTab === 'herramientas' && (
                    <div>
                        <div className="mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Herramientas</h3>
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
                                            Categoría
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cantidad
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {herramienta.cantidad_disponible}/{herramienta.cantidad_total}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${herramienta.estado === 'disponible' ? 'bg-green-100 text-green-800' :
                                                    herramienta.estado === 'no_disponible' ? 'bg-red-100 text-red-800' :
                                                        herramienta.estado === 'en_mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {herramienta.estado?.charAt(0).toUpperCase() + herramienta.estado?.slice(1) || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => onEditarHerramienta(herramienta)}
                                                        className="text-yellow-600 hover:text-yellow-900"
                                                        title="Editar"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => onEliminarHerramienta(herramienta.id)}
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
                        </div>
                    </div>
                )}

                {activeTab === 'insumos' && (
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
                                                        {insumo.cantidad_disponible} / {insumo.cantidad_total} {insumo.unidad_medida}
                                                    </p>
                                                    {insumo.cantidad_disponible <= insumo.nivel_alerta && (
                                                        <p className="text-xs text-yellow-600">
                                                            ⚠️ Alerta: {insumo.nivel_alerta} {insumo.unidad_medida}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${insumo.estado === 'disponible' ? 'bg-green-100 text-green-800' :
                                                    insumo.estado === 'agotado' ? 'bg-red-100 text-red-800' :
                                                        insumo.estado === 'bajo_stock' ? 'bg-yellow-100 text-yellow-800' :
                                                            insumo.estado === 'vencido' ? 'bg-orange-100 text-orange-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {insumo.estado?.charAt(0).toUpperCase() + insumo.estado?.slice(1) || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => onEditarInsumo(insumo)}
                                                        className="text-yellow-600 hover:text-yellow-900"
                                                        title="Editar"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => onEliminarInsumo(insumo.id)}
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
                        </div>
                    </div>
                )}

                {activeTab === 'categorias' && (
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
                                                        onClick={() => onEditarCategoria(categoria)}
                                                        className="text-yellow-600 hover:text-yellow-900"
                                                        title="Editar"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => onEliminarCategoria(categoria.id)}
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
                        </div>
                    </div>
                )}

                {herramientas.length === 0 && insumos.length === 0 && categorias.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <i className="fas fa-boxes text-4xl mb-4 text-gray-300"></i>
                        <p className="text-lg mb-2">No hay registros de inventario</p>
                        <p className="text-sm">Comienza agregando herramientas, insumos o categorías</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventarioTabs;