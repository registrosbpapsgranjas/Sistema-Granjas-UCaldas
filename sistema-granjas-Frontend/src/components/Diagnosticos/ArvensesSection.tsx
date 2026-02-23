import React from 'react';
import { PlantaBase } from '../../types/diagnosticoTypes';

interface ArvensesSectionProps {
  plantas: PlantaBase[]; // plantas seleccionadas (con codigo y label)
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

export const ArvensesSection: React.FC<ArvensesSectionProps> = ({
  plantas,
  caracterizacion,
  onCampoChange,
}) => {
  const prefix = 'arvenses';

  const handleChange = (clave: string, valor: any) => {
    onCampoChange(clave, String(valor));
  };

  // Verificar si una planta tiene "No aplica" marcado
  const getNoAplica = (codigo: string): boolean => {
    return caracterizacion[`${prefix}_${codigo}_noAplica`] === 'true';
  };

  const handleNoAplicaChange = (codigo: string, checked: boolean) => {
    handleChange(`${prefix}_${codigo}_noAplica`, checked);
    // Si se marca "No aplica", limpiar todos los campos de esa planta
    if (checked) {
      const campos = [
        'plato_cobertura_total',
        'plato_cobertura_nobles',
        'plato_cobertura_agresivas',
        'plato_especies_nobles',
        'plato_especies_agresivas',
        'plato_altura',
        'calle_cobertura_nobles',
        'calle_cobertura_agresivas',
        'calle_especies_nobles',
        'calle_especies_agresivas',
        'calle_altura',
      ];
      campos.forEach(campo => {
        handleChange(`${prefix}_${codigo}_${campo}`, '');
      });
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Monitoreo de Arvenses por Planta
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Para cada planta, estime visualmente el porcentaje de cobertura en <strong>platos</strong> (zona de 50–70 cm alrededor del árbol) y <strong>calles</strong> (espacio entre hileras). Clasifique las arvenses en nobles (baja competencia) y agresivas (trepadoras, invasivas).
      </p>

      {plantas.map((planta) => {
        const codigo = planta.codigo;
        const noAplica = getNoAplica(codigo);

        return (
          <div key={codigo} className="border rounded-lg p-4 mb-6 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg text-gray-800">
                {planta.label} (Código: {codigo})
              </h3>
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={noAplica}
                  onChange={(e) => handleNoAplicaChange(codigo, e.target.checked)}
                  className="mr-2"
                />
                No aplica (sin arvenses)
              </label>
            </div>

            {!noAplica && (
              <>
                {/* Evaluación en PLATO */}
                <div className="mb-4 p-3 border rounded bg-gray-50">
                  <h4 className="font-medium text-md text-gray-700 mb-2">Plato (alrededor del árbol)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        % cobertura TOTAL
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={caracterizacion[`${prefix}_${codigo}_plato_cobertura_total`] || ''}
                        onChange={(e) => handleChange(`${prefix}_${codigo}_plato_cobertura_total`, e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Ej: 25.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        % ARVENSES NOBLES
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={caracterizacion[`${prefix}_${codigo}_plato_cobertura_nobles`] || ''}
                        onChange={(e) => handleChange(`${prefix}_${codigo}_plato_cobertura_nobles`, e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Ej: 10.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        % ARVENSES AGRESIVAS
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={caracterizacion[`${prefix}_${codigo}_plato_cobertura_agresivas`] || ''}
                        onChange={(e) => handleChange(`${prefix}_${codigo}_plato_cobertura_agresivas`, e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Ej: 15.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Altura promedio (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={caracterizacion[`${prefix}_${codigo}_plato_altura`] || ''}
                        onChange={(e) => handleChange(`${prefix}_${codigo}_plato_altura`, e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Ej: 12.5"
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Especies NOBLES
                      </label>
                      <input
                        type="text"
                        value={caracterizacion[`${prefix}_${codigo}_plato_especies_nobles`] || ''}
                        onChange={(e) => handleChange(`${prefix}_${codigo}_plato_especies_nobles`, e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Ej: Kikuyo, Trébol"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Especies AGRESIVAS
                      </label>
                      <input
                        type="text"
                        value={caracterizacion[`${prefix}_${codigo}_plato_especies_agresivas`] || ''}
                        onChange={(e) => handleChange(`${prefix}_${codigo}_plato_especies_agresivas`, e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Ej: Cortadera, Batatilla"
                      />
                    </div>
                  </div>
                </div>

                {/* Evaluación en CALLE */}
                <div className="p-3 border rounded bg-gray-50">
                  <h4 className="font-medium text-md text-gray-700 mb-2">Calle (entre hileras)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        % ARVENSES NOBLES
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={caracterizacion[`${prefix}_${codigo}_calle_cobertura_nobles`] || ''}
                        onChange={(e) => handleChange(`${prefix}_${codigo}_calle_cobertura_nobles`, e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Ej: 30.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        % ARVENSES AGRESIVAS
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={caracterizacion[`${prefix}_${codigo}_calle_cobertura_agresivas`] || ''}
                        onChange={(e) => handleChange(`${prefix}_${codigo}_calle_cobertura_agresivas`, e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Ej: 20.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Altura promedio (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={caracterizacion[`${prefix}_${codigo}_calle_altura`] || ''}
                        onChange={(e) => handleChange(`${prefix}_${codigo}_calle_altura`, e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Ej: 25.0"
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Especies NOBLES
                      </label>
                      <input
                        type="text"
                        value={caracterizacion[`${prefix}_${codigo}_calle_especies_nobles`] || ''}
                        onChange={(e) => handleChange(`${prefix}_${codigo}_calle_especies_nobles`, e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Ej: Grama, Trébol"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Especies AGRESIVAS
                      </label>
                      <input
                        type="text"
                        value={caracterizacion[`${prefix}_${codigo}_calle_especies_agresivas`] || ''}
                        onChange={(e) => handleChange(`${prefix}_${codigo}_calle_especies_agresivas`, e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Ej: Pasto guinea, Cortadera"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};