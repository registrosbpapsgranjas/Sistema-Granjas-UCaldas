import React, { useEffect, useMemo, useState } from 'react';
import type { DiagnosticoCampo } from '../../services/diagnosticoDinamicoService';

interface Props {
  campos: DiagnosticoCampo[];
  valores: Record<string, any>;
  onChange: (nombre: string, valor: any) => void;
  prefix?: string;
  contexto?: string;
}

const FormularioDinamicoSection: React.FC<Props> = ({ 
  campos, 
  valores, 
  onChange,
  prefix = '',
  contexto = ''
}) => {
  // Estado para controlar qué fila está expandida en móvil
  const [filaExpandida, setFilaExpandida] = useState<number | null>(null);

  // Construir el árbol de dependencias
  const campoPorId = useMemo(() => {
    const map = new Map<number, DiagnosticoCampo>();
    campos.forEach(campo => map.set(campo.id, campo));
    return map;
  }, [campos]);

  // Obtener el valor de un campo por nombre
  const getValorCampo = (nombreCampo: string): any => {
    return valores[nombreCampo];
  };

  // Detectar si es móvil
  const isMobile = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  };

  // Obtener el contexto completo para un campo
  const getCampoContexto = (campo: DiagnosticoCampo, valorEspecifico?: string): string => {
    const breadcrumb: string[] = [];
    let current: DiagnosticoCampo | undefined = campo;
    let visited = new Set<number>();
    
    if (contexto) {
      breadcrumb.push(contexto);
    }
    
    while (current?.campo_padre_id && !visited.has(current.id)) {
      visited.add(current.id);
      const padre = campoPorId.get(current.campo_padre_id);
      if (!padre) break;
      
      const valorPadre = getValorCampo(padre.nombre_campo);
      if (valorPadre && valorPadre !== '') {
        if (Array.isArray(valorPadre) && valorEspecifico && padre.id === campo.campo_padre_id) {
          breadcrumb.push(valorEspecifico);
        } else if (!Array.isArray(valorPadre)) {
          breadcrumb.push(String(valorPadre));
        }
      }
      current = padre;
    }
    
    if (breadcrumb.length > 0) {
      return `${breadcrumb.join(' → ')} → ${campo.etiqueta}`;
    }
    return campo.etiqueta;
  };

  // Helper: saber si un campo es visible
  const esCampoVisible = (campo: DiagnosticoCampo, visitados: Set<number> = new Set()): boolean => {
    if (visitados.has(campo.id)) return true;
    visitados.add(campo.id);
    
    if (!campo.campo_padre_id) return true;
    const padre = campoPorId.get(campo.campo_padre_id);
    if (!padre) return true;
    
    const valorPadre = getValorCampo(padre.nombre_campo);
    if (!valorPadre || !campo.opciones_padre) return false;
    
    if (!esCampoVisible(padre, visitados)) return false;
    
    if (Array.isArray(valorPadre)) {
      return campo.opciones_padre.some(op => valorPadre.includes(op));
    }
    return campo.opciones_padre.includes(valorPadre);
  };

  // Helper: obtener todos los IDs de campos que dependen de un campo
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

  // Manejar cambio en campo padre
  const handleChange = (campo: DiagnosticoCampo, nuevoValor: any) => {
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

  const limpiarDependientes = (campoId: number) => {
    const dependientes = campos.filter(c => c.campo_padre_id === campoId);
    dependientes.forEach(dep => {
      if (valores[dep.nombre_campo] !== undefined && valores[dep.nombre_campo] !== '') {
        onChange(dep.nombre_campo, '');
      }
      limpiarDependientes(dep.id);
    });
  };

  // Render de celda de matriz para vista móvil (expandida)
  const renderCeldaMatrizMobile = (
    valorCelda: any,
    tipoCelda: string,
    onChangeCelda: (nuevoValor: any) => void,
    fila: string,
    columna: string,
    nombreCampo: string,
    valorMatriz: Record<string, Record<string, any>>
  ) => {
    const inputBase = "w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    
    switch (tipoCelda) {
      case 'boolean':
        return (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={valorCelda === true || valorCelda === 'true'}
              onChange={e => onChangeCelda(e.target.checked ? true : false)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
        );
      case 'number':
        return (
          <input
            type="number"
            value={valorCelda !== undefined && valorCelda !== '' ? valorCelda : ''}
            onChange={e => onChangeCelda(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className={inputBase}
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
          <div className="flex justify-center">
            <input
              type="radio"
              name={radioName}
              checked={seleccionado === columna}
              onChange={() => onChangeCelda(columna)}
              className="w-5 h-5 text-blue-600 focus:ring-blue-500"
            />
          </div>
        );
      }
      default:
        return (
          <input
            type="text"
            value={valorCelda || ''}
            onChange={e => onChangeCelda(e.target.value)}
            className={inputBase}
          />
        );
    }
  };

  // Render de celda de matriz para vista desktop (tabla)
  const renderCeldaMatrizDesktop = (
    valorCelda: any,
    tipoCelda: string,
    onChangeCelda: (nuevoValor: any) => void,
    fila: string,
    columna: string,
    nombreCampo: string,
    valorMatriz: Record<string, Record<string, any>>
  ) => {
    const inputBase = "text-center border border-gray-300 rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-20";
    
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
            className={inputBase}
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
            className={inputBase}
          />
        );
    }
  };

  // Renderizar matriz responsive
  const renderMatriz = (campo: DiagnosticoCampo) => {
    const valor = valores[campo.nombre_campo] ?? '';
    const etiquetaConContexto = getCampoContexto(campo);
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
      if (!nuevaMatriz[fila]) nuevaMatriz[fila] = {};
      else nuevaMatriz[fila] = { ...nuevaMatriz[fila] };
      
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
      
      if (Object.keys(nuevaMatriz[fila]).length === 0) delete nuevaMatriz[fila];
      handleChange(campo, Object.keys(nuevaMatriz).length > 0 ? nuevaMatriz : '');
    };

    const mobile = isMobile();

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {etiquetaConContexto}
          {campo.requerido && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {mobile ? (
          // Vista móvil: cards expandibles
          <div className="space-y-3">
            {filas.map((fila, idx) => {
              const isExpanded = filaExpandida === idx;
              const seleccionRadio = valorMatriz[fila]?.['_selected'] || '';
              
              return (
                <div key={fila} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFilaExpandida(isExpanded ? null : idx)}
                    className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-700">{fila}</span>
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-gray-400 text-sm`}></i>
                  </button>
                  
                  {isExpanded && (
                    <div className="p-3 space-y-3 bg-white">
                      {columnas.map(col => {
                        const valorCelda = tipo_celda === 'radio' 
                          ? seleccionRadio 
                          : valorMatriz[fila]?.[col] ?? '';
                        
                        return (
                          <div key={col} className="border-b border-gray-100 pb-3 last:border-0">
                            <div className="text-sm font-medium text-gray-600 mb-2">{col}</div>
                            {renderCeldaMatrizMobile(
                              valorCelda,
                              tipo_celda,
                              (nuevoValor) => handleCeldaChange(fila, col, nuevoValor),
                              fila,
                              col,
                              campo.nombre_campo,
                              valorMatriz
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Vista desktop: tabla
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
                        {renderCeldaMatrizDesktop(
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
        )}
      </div>
    );
  };

  // Renderizar campos hijos para un valor específico de multiselect
  const renderHijosParaValor = (campo: DiagnosticoCampo, valorSeleccionado: string, nivel: number = 0): React.ReactNode => {
    const hijos = campos.filter(c => c.campo_padre_id === campo.id);
    if (hijos.length === 0) return null;
    
    const margenIzquierdo = nivel > 0 ? 'ml-6' : 'ml-4';
    
    return (
      <div className={`${margenIzquierdo} pl-4 border-l-2 border-blue-200 mt-3 space-y-3`}>
        {hijos.map(hijo => {
          const esVisible = !hijo.opciones_padre || hijo.opciones_padre.includes(valorSeleccionado);
          if (!esVisible) return null;
          
          const valorHijo = getValorCampo(hijo.nombre_campo);
          const etiquetaConContexto = getCampoContexto(hijo, valorSeleccionado);
          
          if (hijo.tipo_dato === 'multiselect') {
            const valoresHijoSeleccionados = Array.isArray(valorHijo) ? valorHijo : [];
            return (
              <div key={hijo.id} className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {etiquetaConContexto}
                  {hijo.requerido && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="space-y-1.5">
                  {(Array.isArray(hijo.opciones) ? hijo.opciones : []).map((op: string) => (
                    <label key={op} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={valoresHijoSeleccionados.includes(op)}
                        onChange={e => {
                          const nuevo = e.target.checked
                            ? [...valoresHijoSeleccionados, op]
                            : valoresHijoSeleccionados.filter(v => v !== op);
                          handleChange(hijo, nuevo);
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{op}</span>
                    </label>
                  ))}
                </div>
                {valoresHijoSeleccionados.map(valorHijoSeleccionado => (
                  <div key={`${hijo.id}_${valorHijoSeleccionado}`}>
                    {renderHijosParaValor(hijo, valorHijoSeleccionado, nivel + 1)}
                  </div>
                ))}
              </div>
            );
          }
          
          return (
            <div key={hijo.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {etiquetaConContexto}
                {hijo.requerido && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderCampoSimple(hijo, valorHijo, etiquetaConContexto)}
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar campo simple (no multiselect)
  const renderCampoSimple = (campo: DiagnosticoCampo, valor: any, etiqueta: string) => {
    const baseClass = "w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

    switch (campo.tipo_dato) {
      case 'textarea':
        return (
          <textarea
            value={valor || ''}
            onChange={e => handleChange(campo, e.target.value)}
            className={baseClass}
            rows={3}
            placeholder={etiqueta}
            required={campo.requerido}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={valor || ''}
            onChange={e => handleChange(campo, e.target.value)}
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
            value={valor || ''}
            onChange={e => handleChange(campo, e.target.value)}
            className={baseClass}
            required={campo.requerido}
          />
        );
      case 'select':
        return (
          <select
            value={valor || ''}
            onChange={e => handleChange(campo, e.target.value)}
            className={baseClass}
            required={campo.requerido}
          >
            <option value="">Seleccionar...</option>
            {(Array.isArray(campo.opciones) ? campo.opciones : []).map((op: string) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <select
            value={valor || ''}
            onChange={e => handleChange(campo, e.target.value)}
            className={baseClass}
            required={campo.requerido}
          >
            <option value="">Seleccionar...</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        );
      case 'matrix':
        return renderMatriz(campo);
      default:
        return (
          <input
            type="text"
            value={valor || ''}
            onChange={e => handleChange(campo, e.target.value)}
            className={baseClass}
            placeholder={etiqueta}
            required={campo.requerido}
          />
        );
    }
  };

  // Obtener hijos directos NO multiselect
  const getHijosNormalesDirectos = (campo: DiagnosticoCampo): DiagnosticoCampo[] => {
    return campos.filter(c => 
      c.campo_padre_id === campo.id && 
      c.tipo_dato !== 'multiselect'
    );
  };

  // Renderizar campo principal
  const renderCampo = (campo: DiagnosticoCampo) => {
    const valor = valores[campo.nombre_campo] ?? '';
    const etiquetaConContexto = getCampoContexto(campo);

    if (campo.tipo_dato === 'multiselect') {
      const seleccionados: string[] = Array.isArray(valor) ? valor : [];
      const opciones = Array.isArray(campo.opciones) ? campo.opciones : [];
      
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {etiquetaConContexto}
            {campo.requerido && <span className="text-red-500 ml-1">*</span>}
          </label>
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
                    handleChange(campo, nuevo);
                  }}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">{op}</span>
              </label>
            ))}
          </div>
          
          {seleccionados.length > 0 && (
            <div className="mt-3 space-y-4">
              {seleccionados.map(valorSeleccionado => (
                <div key={`${campo.nombre_campo}_${valorSeleccionado}`}>
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    {contexto ? `${contexto} → ` : ''}{valorSeleccionado}
                  </div>
                  {renderHijosParaValor(campo, valorSeleccionado)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    const tienePadreMultiselect = campos.some(c => 
      c.id === campo.campo_padre_id && c.tipo_dato === 'multiselect'
    );
    
    if (tienePadreMultiselect) {
      return null;
    }
    
    const hijosNormales = getHijosNormalesDirectos(campo);
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {etiquetaConContexto}
          {campo.requerido && <span className="text-red-500 ml-1">*</span>}
        </label>
        {renderCampoSimple(campo, valor, etiquetaConContexto)}
        
        {hijosNormales.length > 0 && (
          <div className="ml-4 pl-4 border-l-2 border-gray-200 mt-3">
            {hijosNormales.map(hijo => renderCampo(hijo))}
          </div>
        )}
      </div>
    );
  };

  const camposRaiz = campos.filter(c => !c.campo_padre_id);
  const camposVisibles = camposRaiz.filter(c => esCampoVisible(c));

  if (!campos || campos.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm">
        <i className="fas fa-info-circle mr-2"></i>
        Este tipo de diagnóstico no tiene campos configurados. Contacta al administrador.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {camposVisibles.map(campo => (
        <div key={campo.id}>
          {renderCampo(campo)}
        </div>
      ))}
    </div>
  );
};

export default FormularioDinamicoSection;