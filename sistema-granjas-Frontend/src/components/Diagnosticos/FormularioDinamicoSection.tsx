import React from 'react';
import type { DiagnosticoCampo } from '../../services/diagnosticoDinamicoService';

interface Props {
  campos: DiagnosticoCampo[];
  valores: Record<string, any>;
  onChange: (nombre: string, valor: any) => void;
}

const FormularioDinamicoSection: React.FC<Props> = ({ campos, valores, onChange }) => {
  if (!campos || campos.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm">
        <i className="fas fa-info-circle mr-2"></i>
        Este tipo de diagnóstico no tiene campos configurados. Contacta al administrador.
      </div>
    );
  }

  // Determinar qué campos son visibles según dependencias
  const camposVisibles = campos.filter(campo => {
    if (!campo.campo_padre_id) return true;
    const padre = campos.find(c => c.id === campo.campo_padre_id);
    if (!padre) return true;
    const valorPadre = valores[padre.nombre_campo];
    if (!valorPadre || !campo.opciones_padre) return false;
    // Soporta multiselect (array) y select (string)
    if (Array.isArray(valorPadre)) {
      return campo.opciones_padre.some(op => valorPadre.includes(op));
    }
    return campo.opciones_padre.includes(valorPadre);
  });

  const renderCampo = (campo: DiagnosticoCampo) => {
    const valor = valores[campo.nombre_campo] ?? '';
    const baseClass = "w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

    switch (campo.tipo_dato) {
      case 'textarea':
        return (
          <textarea
            value={valor}
            onChange={e => onChange(campo.nombre_campo, e.target.value)}
            className={baseClass}
            rows={3}
            placeholder={campo.etiqueta}
            required={campo.requerido}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={valor}
            onChange={e => onChange(campo.nombre_campo, e.target.value)}
            className={baseClass}
            placeholder="0"
            required={campo.requerido}
            step="any"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={valor}
            onChange={e => onChange(campo.nombre_campo, e.target.value)}
            className={baseClass}
            required={campo.requerido}
          />
        );

      case 'select':
        return (
          <select
            value={valor}
            onChange={e => {
              onChange(campo.nombre_campo, e.target.value);
              // Limpiar valores de hijos que ya no aplican al cambiar el padre
              campos.forEach(hijo => {
                if (hijo.campo_padre_id === campo.id) {
                  if (!hijo.opciones_padre?.includes(e.target.value)) {
                    onChange(hijo.nombre_campo, '');
                  }
                }
              });
            }}
            className={baseClass}
            required={campo.requerido}
          >
            <option value="">Seleccionar...</option>
            {(campo.opciones || []).map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        );

      case 'multiselect': {
        const seleccionados: string[] = Array.isArray(valor) ? valor : [];
        return (
          <div className="space-y-1.5">
            {(campo.opciones || []).map(op => (
              <label key={op} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seleccionados.includes(op)}
                  onChange={e => {
                    const nuevo = e.target.checked
                      ? [...seleccionados, op]
                      : seleccionados.filter(v => v !== op);
                    onChange(campo.nombre_campo, nuevo);
                  }}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">{op}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'boolean':
        return (
          <select
            value={valor}
            onChange={e => onChange(campo.nombre_campo, e.target.value)}
            className={baseClass}
            required={campo.requerido}
          >
            <option value="">Seleccionar...</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={valor}
            onChange={e => onChange(campo.nombre_campo, e.target.value)}
            className={baseClass}
            placeholder={campo.etiqueta}
            required={campo.requerido}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {camposVisibles.map(campo => (
        <div key={campo.id} className={campo.campo_padre_id ? 'pl-4 border-l-2 border-yellow-300' : ''}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {campo.etiqueta}
            {campo.requerido && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderCampo(campo)}
        </div>
      ))}
    </div>
  );
};

export default FormularioDinamicoSection;
