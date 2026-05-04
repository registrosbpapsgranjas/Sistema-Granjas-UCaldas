// src/components/InventarioDinamico/ItemInventarioForm.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../Common/Modal';
import type { Campo, ItemInventario } from '../../types/inventarioDinamicoTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  campos: Campo[];
  item?: ItemInventario;
}

const ItemInventarioForm: React.FC<Props> = ({ isOpen, onClose, onSave, campos, item }) => {
  const [fechaInventario, setFechaInventario] = useState(item?.fecha_inventario?.slice(0,10) || new Date().toISOString().slice(0,10));
  const [cantidadDisponible, setCantidadDisponible] = useState(item?.cantidad_disponible || 0);
  const [unidadMedida, setUnidadMedida] = useState(item?.unidad_medida || '');
  const [observaciones, setObservaciones] = useState(item?.observaciones || '');
  const [valores, setValores] = useState<Record<string, any>>(item?.valores || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setValores(item.valores || {});
    } else {
      // Inicializar valores vacíos para campos requeridos (opcional)
      const init: Record<string, any> = {};
      campos.forEach(c => { if (c.requerido) init[c.nombre_campo] = ''; });
      setValores(init);
    }
  }, [item, campos]);

  const handleCampoChange = (nombre: string, value: any) => {
    setValores(prev => ({ ...prev, [nombre]: value }));
  };

  const renderCampo = (campo: Campo) => {
    const value = valores[campo.nombre_campo] ?? '';
    const common = `w-full border rounded p-2 ${campo.requerido && !value ? 'border-red-500' : 'border-gray-300'}`;
    switch (campo.tipo_dato) {
      case 'text':
        return <input type="text" value={value} onChange={(e) => handleCampoChange(campo.nombre_campo, e.target.value)} className={common} required={campo.requerido} />;
      case 'number':
        return <input type="number" step="any" value={value} onChange={(e) => handleCampoChange(campo.nombre_campo, e.target.value)} className={common} />;
      case 'date':
        return <input type="date" value={value} onChange={(e) => handleCampoChange(campo.nombre_campo, e.target.value)} className={common} />;
      case 'select':
        return (
          <select value={value} onChange={(e) => handleCampoChange(campo.nombre_campo, e.target.value)} className={common} required={campo.requerido}>
            <option value="">Seleccione...</option>
            {campo.opciones?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'boolean':
        return (
          <select value={value === true ? 'true' : value === false ? 'false' : ''} onChange={(e) => handleCampoChange(campo.nombre_campo, e.target.value === 'true')} className={common}>
            <option value="">Seleccione...</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        );
      default:
        return <input type="text" value={value} onChange={(e) => handleCampoChange(campo.nombre_campo, e.target.value)} className={common} />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar campos requeridos
    for (const campo of campos) {
      if (campo.requerido && (valores[campo.nombre_campo] === undefined || valores[campo.nombre_campo] === '')) {
        alert(`El campo "${campo.nombre_campo}" es requerido.`);
        return;
      }
    }
    setLoading(true);
    try {
      await onSave({
        fecha_inventario: fechaInventario,
        cantidad_disponible: cantidadDisponible,
        unidad_medida: unidadMedida || null,
        valores,
        observaciones: observaciones || null,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-2xl">
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">{item ? 'Editar registro' : 'Nuevo registro'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha inventario *</label>
              <input type="date" value={fechaInventario} onChange={(e) => setFechaInventario(e.target.value)} className="w-full border rounded p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cantidad disponible</label>
              <input type="number" step="any" value={cantidadDisponible} onChange={(e) => setCantidadDisponible(parseFloat(e.target.value) || 0)} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unidad de medida</label>
              <input type="text" value={unidadMedida} onChange={(e) => setUnidadMedida(e.target.value)} className="w-full border rounded p-2" placeholder="kg, L, bultos..." />
            </div>
          </div>

          {campos.sort((a,b)=>a.orden-b.orden).map(campo => (
            <div key={campo.id} className="mb-4">
              <label className="block text-sm font-medium mb-1">{campo.nombre_campo} {campo.requerido && '*'}</label>
              {renderCampo(campo)}
            </div>
          ))}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Observaciones</label>
            <textarea rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full border rounded p-2" />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ItemInventarioForm;