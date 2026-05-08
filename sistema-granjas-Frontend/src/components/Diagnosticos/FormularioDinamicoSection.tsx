import React, { useEffect } from 'react';
import type { DiagnosticoCampo } from '../../services/diagnosticoDinamicoService';

interface Props {
  campos: DiagnosticoCampo[];
  valores: Record<string, any>;
  onChange: (nombre: string, valor: any) => void;
  prefix?: string; // Para diferenciar instancias (ej: planta.id)
}

const FormularioDinamicoSection: React.FC<Props> = ({
  campos,
  valores,
  onChange,
  prefix = ''
}) => {
  if (!campos || campos.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm">
        <i className="fas fa-info-circle mr-2"></i>
        Este tipo de diagnóstico no tiene campos configurados. Contacta al administrador.
      </div>
    );
  }

  // Helper: saber si un campo es visible según el valor actual de su padre
  const esCampoVisible = (campo: DiagnosticoCampo): boolean => {
    if (!campo.campo_padre_id) return true;
    const padre = campos.find(c => c.id === campo.campo_padre_id);
    if (!padre) return true;
    const valorPadre = valores[padre.nombre_campo];
    if (!valorPadre || !campo.opciones_padre) return false;

    if (Array.isArray(valorPadre)) {
      return campo.opciones_padre.some(op => valorPadre.includes(op));
    }
    return campo.opciones_padre.includes(valorPadre);
  };

  // Helper: obtener todos los IDs de campos que dependen de un campo (directa o indirectamente)
  const obtenerDependientes = (campoId: number): number[] => {
    const hijos = campos.filter(c => c.campo_padre_id === campoId);
    let todos: number[] = [];
    hijos.forEach(hijo => {
      todos.push(hijo.id);
      todos = [...todos, ...obtenerDependientes(hijo.id)];
    });
    return todos;
  };

  // Limpiar valores de campos que se vuelven invisibles
  useEffect(() => {
    campos.forEach(campo => {
      if (!esCampoVisible(campo)) {
        if (valores[campo.nombre_campo] !== undefined && valores[campo.nombre_campo] !== '') {
          onChange(campo.nombre_campo, '');
        }

        const dependientes = obtenerDependientes(campo.id);
        dependientes.forEach(depId => {
          const depCampo = campos.find(c => c.id === depId);
          if (depCampo && valores[depCampo.nombre_campo] !== undefined && valores[depCampo.nombre_campo] !== '') {
            onChange(depCampo.nombre_campo, '');
          }
        });
      }
    });
  }, [campos, valores, onChange]);

  // Manejar cambio en campo padre (select/multiselect) limpiando hijos que ya no aplican
  const handleSelectChange = (campo: DiagnosticoCampo, nuevoValor: any) => {
    onChange(campo.nombre_campo, nuevoValor);

    const hijosDirectos = campos.filter(c => c.campo_padre_id === campo.id);

    hijosDirectos.forEach(hijo => {
      if (hijo.opciones_padre) {
        const valorArray = Array.isArray(nuevoValor) ? nuevoValor : [nuevoValor];
        const hijoVisible = hijo.opciones_padre.some(op => valorArray.includes(op));

        if (!hijoVisible) {
          onChange(hijo.nombre_campo, '');
          limpiarDependientes(hijo.id);
        }
      }
    });
  };

  // Función recursiva para limpiar dependientes en cascada
  const limpiarDependientes = (campoId: number) => {
    const dependientes = campos.filter(c => c.campo_padre_id === campoId);
    dependientes.forEach(dep => {
      if (valores[dep.nombre_campo] !== undefined && valores[dep.nombre_campo] !== '') {
        onChange(dep.nombre_campo, '');
      }
      limpiarDependientes(dep.id);
    });
  };

  // Encontrar el padre directo de un campo y el valor que lo activa
  const getPadreYValor = (campo: DiagnosticoCampo): { padre: DiagnosticoCampo | null; valorActivador: string } => {
    if (!campo.campo_padre_id) return { padre: null, valorActivador: '' };
    const padre = campos.find(c => c.id === campo.campo_padre_id);
    if (!padre) return { padre: null, valorActivador: '' };

    const valorPadre = valores[padre.nombre_campo];
    let valorActivador = '';

    if (campo.opciones_padre && campo.opciones_padre.length > 0) {
      if (Array.isArray(valorPadre)) {
        valorActivador = campo.opciones_padre
          .filter(op => valorPadre.includes(op))
          .join(', ');
      } else {
        valorActivador = campo.opciones_padre[0] || '';
      }
    }

    return { padre, valorActivador };
  };

  // ── Render de celda de matriz ───────────────────────────────────────────────
  const renderCeldaMatriz = (
    valorCelda: any,
    tipoCelda: string,
    onChangeCelda: (nuevoValor: any) => void,
    fila: string,
    columna: string,
    nombreCampo: string,
    valorMatriz: Record<string, Record<string, any>>
  ) => {
    const inputBase = "text-center border border-gray-300 rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

    switch (tipoCelda) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={valorCelda === true || valorCelda === 'true'}
            onChange={e => onChangeCelda(e.target.checked ? true : false)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mx-auto block"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={valorCelda !== undefined && valorCelda !== '' ? valorCelda : ''}
            onChange={e => onChangeCelda(e.target.value === '' ? '' : e.target.value)}
            className={`${inputBase} w-20`}
            min="0"
            step="any"
          />
        );

      case 'radio': {
        const seleccionado = valorMatriz[fila]?.['_selected'] || '';
        const radioName = prefix
          ? `${prefix}_${nombreCampo}_${fila.replace(/\s+/g, '_')}`
          : `${nombreCampo}_${fila.replace(/\s+/g, '_')}`;
        return (
          <input
            type="radio"
            name={radioName}
            checked={seleccionado === columna}
            onChange={() => onChangeCelda(columna)}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500 mx-auto block"
          />
        );
      }

      default:
        return (
          <input
            type="text"
            value={valorCelda || ''}
            onChange={e => onChangeCelda(e.target.value)}
            className={`${inputBase} w-20`}
          />
        );
    }
  };

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
            value={Array.isArray(valor) ? '' : valor}
            onChange={e => handleSelectChange(campo, e.target.value)}
            className={baseClass}
            required={campo.requerido}
          >
            <option value="">Seleccionar...</option>
            {(Array.isArray(campo.opciones) ? campo.opciones : []).map((op: string) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        );

      case 'multiselect': {
        const seleccionados: string[] = Array.isArray(valor) ? valor : [];
        const opciones = Array.isArray(campo.opciones) ? campo.opciones : [];
        return (
          <div className="space-y-1.5">
            {opciones.map((op: string) => (
              <label key={op} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seleccionados.includes(op)}
                  onChange={e => {
                    const nuevo = e.target.checked
                      ? [...seleccionados, op]
                      : seleccionados.filter(v => v !== op);
                    handleSelectChange(campo, nuevo);
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

      case 'matrix': {
        const matrixData = campo.opciones as { filas: string[]; columnas: string[]; tipo_celda: string } | null;
        if (!matrixData || !matrixData.filas || !matrixData.columnas) {
          return <p className="text-red-500 text-sm">Error: matriz mal configurada</p>;
        }
        const { filas, columnas, tipo_celda } = matrixData;
        const valorMatriz: Record<string, Record<string, any>> =
          (typeof valor === 'object' && valor !== null && !Array.isArray(valor))
            ? valor as Record<string, Record<string, any>>
            : {};

        const handleCeldaChange = (fila: string, columna: string, nuevoValor: any) => {
          const nuevaMatriz = { ...valorMatriz };

          if (!nuevaMatriz[fila]) {
            nuevaMatriz[fila] = {};
          } else {
            nuevaMatriz[fila] = { ...nuevaMatriz[fila] };
          }

          if (tipo_celda === 'radio') {
            if (nuevoValor === columna) {
              nuevaMatriz[fila]['_selected'] = columna;
            }
          } else {
            if (nuevoValor === '' || nuevoValor === false || nuevoValor === undefined) {
              delete nuevaMatriz[fila][columna];
            } else {
              nuevaMatriz[fila][columna] = nuevoValor;
            }
          }

          if (Object.keys(nuevaMatriz[fila]).length === 0) {
            delete nuevaMatriz[fila];
          }

          onChange(campo.nombre_campo, Object.keys(nuevaMatriz).length > 0 ? nuevaMatriz : '');
        };

        return (
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    {campo.etiqueta}
                  </th>
                  {columnas.map((col, idx) => (
                    <th key={idx} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filas.map((fila, idx) => (
                  <tr key={fila} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-3 py-2 text-sm font-medium text-gray-700 sticky left-0 bg-inherit whitespace-nowrap">
                      {fila}
                    </td>
                    {columnas.map((col, colIdx) => (
                      <td key={colIdx} className="px-2 py-1 text-center">
                        {renderCeldaMatriz(
                          tipo_celda === 'radio'
                            ? valorMatriz[fila]?.['_selected']
                            : valorMatriz[fila]?.[col] ?? '',
                          tipo_celda,
                          (nuevoValor) => handleCeldaChange(fila, col, nuevoValor),
                          fila,
                          col,
                          campo.nombre_campo,
                          valorMatriz
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

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

  // ── FUNCIÓN PRINCIPAL: Agrupar campos por jerarquía ────────────────────────
  // ── FUNCIÓN PRINCIPAL: Agrupar campos por jerarquía ────────────────────────
  const renderGrupo = (
    camposRestantes: DiagnosticoCampo[],
    nivel: number = 0
  ): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    const camposProcesados = new Set<number>();
    const colors = ['border-yellow-300', 'border-orange-300', 'border-pink-300', 'border-purple-300'];
    const bgColors = ['bg-yellow-50/50', 'bg-orange-50/50', 'bg-pink-50/50', 'bg-purple-50/50'];

    for (const campo of camposRestantes) {
      if (camposProcesados.has(campo.id)) continue;
      if (!esCampoVisible(campo)) continue;

      camposProcesados.add(campo.id);

      // Buscar todos los hijos directos visibles de este campo
      const hijos = campos.filter(c =>
        c.campo_padre_id === campo.id &&
        esCampoVisible(c) &&
        !camposProcesados.has(c.id)
      );

      if (hijos.length > 0) {
        // ── Campo CON hijos ──
        const valorPadre = valores[campo.nombre_campo];

        elements.push(
          <div key={campo.id} className={nivel > 0 ? `pl-4 border-l-2 ${colors[Math.min(nivel - 1, colors.length - 1)]}` : ''}>
            {/* El campo padre */}
            <div className="mb-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {campo.etiqueta}
                {campo.requerido && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderCampo(campo)}
            </div>

            {/* Hijos agrupados por el valor que los activa */}
            {hijos.length > 0 && valorPadre && (
              <div className="mt-3 space-y-3">
                {(() => {
                  // Si el padre es select (valor único), agrupar por la opción seleccionada
                  // Si el padre es multiselect (array), agrupar por cada opción seleccionada
                  const valoresPadre = Array.isArray(valorPadre) ? valorPadre : [valorPadre];

                  // Para cada valor seleccionado del padre, encontrar los hijos que aplican
                  return valoresPadre.map((valor: string) => {
                    // Filtrar hijos que son visibles para ESTE valor específico
                    const hijosParaEsteValor = hijos.filter(hijo => {
                      if (!hijo.opciones_padre || hijo.opciones_padre.length === 0) return false;
                      return hijo.opciones_padre.includes(valor);
                    });

                    if (hijosParaEsteValor.length === 0) return null;

                    // Marcar estos hijos como procesados
                    hijosParaEsteValor.forEach(h => camposProcesados.add(h.id));

                    return (
                      <div key={`${campo.id}-${valor}`} className={`pl-4 border-l-2 ${colors[Math.min(nivel, colors.length - 1)]} ${bgColors[Math.min(nivel, bgColors.length - 1)]} rounded p-3`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            {campo.etiqueta}: {valor}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {renderGrupo(hijosParaEsteValor, nivel + 1)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* Procesar campos siguientes que no son hijos */}
            {renderGrupo(
              camposRestantes.filter(c => !camposProcesados.has(c.id)),
              nivel
            )}
          </div>
        );
      } else {
        // ── Campo SIN hijos (hoja) ──
        elements.push(
          <div key={campo.id} className={nivel > 0 ? `pl-4 border-l-2 ${colors[Math.min(nivel - 1, colors.length - 1)]}` : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {campo.etiqueta}
              {campo.requerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderCampo(campo)}
          </div>
        );
      }
    }

    return elements;
  };

  const camposRaiz = campos.filter(c => !c.campo_padre_id);

  return (
    <div className="space-y-4">
      {renderGrupo(camposRaiz)}
    </div>
  );
};

export default FormularioDinamicoSection;