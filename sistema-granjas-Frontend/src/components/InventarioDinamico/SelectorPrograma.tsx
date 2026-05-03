// src/components/InventarioDinamico/SelectorPrograma.tsx
import React from 'react';

interface SelectorProgramaProps {
  programas: any[];
  programaIdSeleccionado?: number | null;
  onProgramaChange: (programaId: number | null) => void;
  cargando?: boolean;
}

const SelectorPrograma: React.FC<SelectorProgramaProps> = ({
  programas,
  programaIdSeleccionado,
  onProgramaChange,
  cargando = false,
}) => {
  if (cargando) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
        <div className="w-full max-w-md border rounded-lg p-2 bg-gray-100 animate-pulse">
          Cargando programas...
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
      <select
        className="w-full max-w-md border rounded-lg p-2"
        value={programaIdSeleccionado ?? ''}
        onChange={(e) => onProgramaChange(e.target.value ? parseInt(e.target.value) : null)}
      >
        <option value="">Seleccionar programa</option>
        {programas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectorPrograma;