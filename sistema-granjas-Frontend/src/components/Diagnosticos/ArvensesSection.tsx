import React from 'react';
import { PlantaBase } from '../types/index';

interface ArvensesSectionProps {
  plantas: PlantaBase[]; // para sugerir códigos válidos
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

  const codigosValidos = plantas.map(p => p.codigo).join(', ');

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Monitoreo de Arvenses
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Realice un recorrido por el lote y estime visualmente el porcentaje de cobertura en platos (zona de 50–70 cm alrededor del árbol) y calles (espacio entre hileras). Clasifique las arvenses en nobles (baja competencia) y agresivas (trepadoras, invasivas).
      </p>

      {/* Plantas monitoreadas */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Plantas a monitorear en el lote *
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Para cada planta monitoreada, registre el código en el formato SURCO–PLANTA, separando los registros con coma. Ej.: 4-6, 2-4
        </p>
        <input
          type="text"
          value={caracterizacion[`${prefix}_plantas`] || ''}
          onChange={(e) => handleChange(`${prefix}_plantas`, e.target.value)}
          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej: 4-6, 2-4"
        />
        {codigosValidos && (
          <p className="text-xs text-gray-400 mt-1">
            Códigos válidos: {codigosValidos}
          </p>
        )}
      </div>

      {/* Evaluación en PLATOS */}
      <div className="mb-6 p-4 border rounded-lg bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Evaluación en PLATOS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              % cobertura TOTAL de arvenses en PLATOS *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={caracterizacion[`${prefix}_platos_cobertura_total`] || ''}
              onChange={(e) => handleChange(`${prefix}_platos_cobertura_total`, e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 25.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              % cobertura de ARVENSES NOBLES en PLATOS *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={caracterizacion[`${prefix}_platos_cobertura_nobles`] || ''}
              onChange={(e) => handleChange(`${prefix}_platos_cobertura_nobles`, e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 10.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              % cobertura de ARVENSES AGRESIVAS en PLATOS *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={caracterizacion[`${prefix}_platos_cobertura_agresivas`] || ''}
              onChange={(e) => handleChange(`${prefix}_platos_cobertura_agresivas`, e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 15.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Altura promedio de arvenses en platos (cm)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={caracterizacion[`${prefix}_platos_altura`] || ''}
              onChange={(e) => handleChange(`${prefix}_platos_altura`, e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 12.5"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Especies NOBLES observadas en platos
          </label>
          <input
            type="text"
            value={caracterizacion[`${prefix}_platos_especies_nobles`] || ''}
            onChange={(e) => handleChange(`${prefix}_platos_especies_nobles`, e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Kikuyo, Trébol"
          />
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Especies AGRESIVAS observadas en platos
          </label>
          <input
            type="text"
            value={caracterizacion[`${prefix}_platos_especies_agresivas`] || ''}
            onChange={(e) => handleChange(`${prefix}_platos_especies_agresivas`, e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Cortadera, Batatilla"
          />
        </div>
      </div>

      {/* Evaluación en CALLES */}
      <div className="mb-6 p-4 border rounded-lg bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Evaluación en CALLES</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              % cobertura de ARVENSES NOBLES en CALLES *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={caracterizacion[`${prefix}_calles_cobertura_nobles`] || ''}
              onChange={(e) => handleChange(`${prefix}_calles_cobertura_nobles`, e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 30.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              % cobertura de ARVENSES AGRESIVAS en CALLES *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={caracterizacion[`${prefix}_calles_cobertura_agresivas`] || ''}
              onChange={(e) => handleChange(`${prefix}_calles_cobertura_agresivas`, e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 20.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Altura promedio de arvenses en calles (cm)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={caracterizacion[`${prefix}_calles_altura`] || ''}
              onChange={(e) => handleChange(`${prefix}_calles_altura`, e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 25.0"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Especies NOBLES observadas en calles
          </label>
          <input
            type="text"
            value={caracterizacion[`${prefix}_calles_especies_nobles`] || ''}
            onChange={(e) => handleChange(`${prefix}_calles_especies_nobles`, e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Grama, Trébol"
          />
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Especies AGRESIVAS observadas en calles
          </label>
          <input
            type="text"
            value={caracterizacion[`${prefix}_calles_especies_agresivas`] || ''}
            onChange={(e) => handleChange(`${prefix}_calles_especies_agresivas`, e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Pasto guinea, Cortadera"
          />
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Si no se encuentra presencia de arvenses, escriba "No aplica" en el campo "Plantas a monitorear".
      </p>
    </div>
  );
};