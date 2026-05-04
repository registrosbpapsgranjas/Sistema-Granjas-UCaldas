// src/components/InventarioDinamico/TipoInventarioForm.tsx
import React, { useState } from 'react';
import Modal from '../Common/Modal';
import type { TipoInventario } from '../../types/inventarioDinamicoTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nombre: string; descripcion?: string; orden?: number }) => Promise<void>;
  tipo?: TipoInventario;
}

const TipoInventarioForm: React.FC<Props> = ({ isOpen, onClose, onSave, tipo }) => {
  const [nombre, setNombre] = useState(tipo?.nombre || '');
  const [descripcion, setDescripcion] = useState(tipo?.descripcion || '');
  const [orden, setOrden] = useState(tipo?.orden || 0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ nombre, descripcion, orden });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-md">
      <div className="p-4">
        <h3 className="text-lg font-bold mb-4">{tipo ? 'Editar tipo' : 'Nuevo tipo'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full border rounded p-2"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
            <input
              type="number"
              value={orden}
              onChange={(e) => setOrden(parseInt(e.target.value) || 0)}
              className="w-full border rounded p-2"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default TipoInventarioForm;