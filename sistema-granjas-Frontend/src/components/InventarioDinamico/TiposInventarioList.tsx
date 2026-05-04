// src/components/InventarioDinamico/TiposInventarioList.tsx
import React from 'react';
import type { TipoInventario } from '../../types/inventarioDinamicoTypes';

interface Props {
  tipos: TipoInventario[];
  selectedTipoId?: number;
  onSelectTipo: (tipoId: number) => void;
  onEdit: (tipo: TipoInventario) => void;
  onDelete: (id: number) => void;
  onCreate: () => void;
}

const TiposInventarioList: React.FC<Props> = ({ tipos, selectedTipoId, onSelectTipo, onEdit, onDelete, onCreate }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Tipos de inventario</h3>
        <button onClick={onCreate} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
          <i className="fas fa-plus mr-1"></i> Nuevo tipo
        </button>
      </div>
      {tipos.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay tipos creados.</p>
      ) : (
        <ul className="space-y-2">
          {tipos.map((tipo) => (
            <li
              key={tipo.id}
              className={`p-2 rounded cursor-pointer flex justify-between items-center ${selectedTipoId === tipo.id ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'}`}
              onClick={() => onSelectTipo(tipo.id)}
            >
              <div>
                <span className="font-medium">{tipo.nombre}</span>
                {tipo.descripcion && <p className="text-xs text-gray-500">{tipo.descripcion}</p>}
              </div>
              <div className="space-x-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => onEdit(tipo)} className="text-yellow-600 hover:text-yellow-800">
                  <i className="fas fa-edit"></i>
                </button>
                <button onClick={() => onDelete(tipo.id)} className="text-red-600 hover:text-red-800">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TiposInventarioList;