import React from "react";
import { PlantaBase } from "../types";

interface Props {
  plantas: PlantaBase[];
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

export const CensoSection: React.FC<Props> = ({
  plantas,
  caracterizacion,
  onCampoChange,
}) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Censo Poblacional
      </h2>
      <h3 className="text-xl font-bold text-gray-800 mb-4 mt-8">
        Plantas seleccionadas para monitoreo
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Las siguientes 5 plantas han sido generadas automáticamente. Complete los datos para cada una.
      </p>

      {plantas.map((planta, idx) => {
        const index = idx + 1;
        const obsKey = `censo_planta_${index}_observacion`;
        const alturaKey = `censo_planta_${index}_altura`;
        const diametroKey = `censo_planta_${index}_diametro`;

        return (
          <div key={planta.codigo} className="border rounded-lg p-4 mb-6 bg-white shadow-sm">
            <h4 className="font-semibold text-lg text-gray-800 mb-3">
              {planta.label} (Código: {planta.codigo})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Observaciones de la planta
                </label>
                <select
                  name={obsKey}
                  value={caracterizacion[obsKey] || ""}
                  onChange={(e) => onCampoChange(obsKey, e.target.value)}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>Seleccione</option>
                  <option value="Buena">Buena</option>
                  <option value="Regular">Regular</option>
                  <option value="Mala">Mala</option>
                  <option value="Resiembra">Resiembra</option>
                  <option value="Punto Vacío">Punto Vacío</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Altura de la planta (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name={alturaKey}
                  value={caracterizacion[alturaKey] || ""}
                  onChange={(e) => onCampoChange(alturaKey, e.target.value)}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 1.50"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Diámetro de la copa (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name={diametroKey}
                  value={caracterizacion[diametroKey] || ""}
                  onChange={(e) => onCampoChange(diametroKey, e.target.value)}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 2.00"
                  required
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};