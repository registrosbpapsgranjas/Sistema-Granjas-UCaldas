// src/components/InventarioDinamico/CamposInventarioList.tsx
import React from 'react';
import type { Campo } from '../../types/inventarioDinamicoTypes';

interface Props {
  campos: Campo[];
  onEdit: (campo: Campo) => void;
  onDelete: (id: number) => void;
  onCreate: () => void;
}

const CamposInventarioList: React.FC<Props> = ({ campos, onEdit, onDelete, onCreate }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Campos definidos</h3>
        <button onClick={onCreate} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
          <i className="fas fa-plus mr-1"></i> Nuevo campo
        </button>
      </div>
      {campos.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay campos definidos. Agrega campos para personalizar el formulario.</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th>Nombre</th><th>Tipo</th><th>Requerido</th><th>Orden</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {campos.map((campo) => (
              <tr key={campo.id} className="border-b">
                <td className="py-2">{campo.nombre_campo}</td>
                <td>{campo.tipo_dato}</td>
                <td>{campo.requerido ? 'Sí' : 'No'}</td>
                <td>{campo.orden}</td>
                <td className="space-x-2">
                  <button onClick={() => onEdit(campo)} className="text-yellow-600"><i className="fas fa-edit"></i></button>
                  <button onClick={() => onDelete(campo.id)} className="text-red-600"><i className="fas fa-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CamposInventarioList;