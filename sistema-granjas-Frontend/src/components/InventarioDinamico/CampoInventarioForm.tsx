// src/components/InventarioDinamico/CampoInventarioForm.tsx
import React, { useState } from 'react';
import Modal from '../Common/Modal';
import type { Campo } from '../../types/inventarioDinamicoTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  campo?: Campo;
}

const CampoInventarioForm: React.FC<Props> = ({ isOpen, onClose, onSave, campo }) => {
  const [nombreCampo, setNombreCampo] = useState(campo?.nombre_campo || '');
  const [tipoDato, setTipoDato] = useState<Campo['tipo_dato']>(campo?.tipo_dato || 'text');
  const [requerido, setRequerido] = useState(campo?.requerido || false);
  const [opciones, setOpciones] = useState(campo?.opciones?.join(', ') || '');
  const [orden, setOrden] = useState(campo?.orden || 0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        nombre_campo: nombreCampo,
        tipo_dato: tipoDato,
        requerido,
        opciones: tipoDato === 'select' ? opciones.split(',').map(s => s.trim()) : undefined,
        orden,
      });
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
        <h3 className="text-lg font-bold mb-4">{campo ? 'Editar campo' : 'Nuevo campo'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nombre del campo *</label>
            <input type="text" value={nombreCampo} onChange={(e) => setNombreCampo(e.target.value)} className="w-full border rounded p-2" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Tipo de dato</label>
            <select value={tipoDato} onChange={(e) => setTipoDato(e.target.value as any)} className="w-full border rounded p-2">
              <option value="text">Texto</option>
              <option value="number">Número</option>
              <option value="date">Fecha</option>
              <option value="select">Selección (desplegable)</option>
              <option value="boolean">Sí/No</option>
            </select>
          </div>
          {tipoDato === 'select' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Opciones (separadas por coma) *</label>
              <input type="text" value={opciones} onChange={(e) => setOpciones(e.target.value)} className="w-full border rounded p-2" required />
            </div>
          )}
          <div className="mb-4 flex items-center">
            <input type="checkbox" checked={requerido} onChange={(e) => setRequerido(e.target.checked)} className="mr-2" />
            <label className="text-sm">Campo requerido</label>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Orden</label>
            <input type="number" value={orden} onChange={(e) => setOrden(parseInt(e.target.value) || 0)} className="w-full border rounded p-2" />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CampoInventarioForm;