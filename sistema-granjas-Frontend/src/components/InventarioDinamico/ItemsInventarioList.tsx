// src/components/InventarioDinamico/ItemsInventarioList.tsx
import React from 'react';
import type { ItemInventario, Campo } from '../../types/inventarioDinamicoTypes';

interface Props {
  items: ItemInventario[];
  campos: Campo[];
  onEdit: (item: ItemInventario) => void;
  onDelete: (id: number) => void;
  onCreate: () => void;
}

const ItemsInventarioList: React.FC<Props> = ({ items, campos, onEdit, onDelete, onCreate }) => {
  // Columnas fijas adicionales: fecha, cantidad, unidad, acciones
  const columnas = [
    { label: 'ID', key: 'id' },
    { label: 'Fecha', key: 'fecha_inventario' },
    ...campos.sort((a,b)=>a.orden-b.orden).map(c => ({ label: c.nombre_campo, key: c.nombre_campo })),
    { label: 'Cantidad disponible', key: 'cantidad_disponible' },
    { label: 'Unidad', key: 'unidad_medida' },
  ];

  const formatValue = (item: ItemInventario, key: string) => {
    if (key === 'id') return item.id;
    if (key === 'fecha_inventario') return new Date(item.fecha_inventario).toLocaleDateString();
    if (key === 'cantidad_disponible') return item.cantidad_disponible;
    if (key === 'unidad_medida') return item.unidad_medida || '-';
    const val = item.valores?.[key];
    if (val === undefined) return '—';
    if (typeof val === 'boolean') return val ? 'Sí' : 'No';
    return val;
  };

  return (
    <div className="bg-white rounded-lg shadow mt-6">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Registros de inventario</h3>
        <button onClick={onCreate} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
          <i className="fas fa-plus mr-1"></i> Nuevo registro
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columnas.map(col => <th key={col.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{col.label}</th>)}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr><td colSpan={columnas.length+1} className="text-center py-8 text-gray-500">No hay registros</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {columnas.map(col => (
                    <td key={col.key} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatValue(item, col.key)}
                    </td>
                  ))}
                  <td className="px-4 py-2 whitespace-nowrap text-sm space-x-2">
                    <button onClick={() => onEdit(item)} className="text-yellow-600"><i className="fas fa-edit"></i></button>
                    <button onClick={() => onDelete(item.id)} className="text-red-600"><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemsInventarioList;