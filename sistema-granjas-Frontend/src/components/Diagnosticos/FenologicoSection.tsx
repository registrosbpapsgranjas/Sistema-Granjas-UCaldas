import React from "react";
import { PlantaFenologico } from "../types";

interface Props {
  plantas: PlantaFenologico[];
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
  onFaseChange: (indice: number, nuevaFase: PlantaFenologico["fase"]) => void;
}

export const FenologicoSection: React.FC<Props> = ({
  plantas,
  caracterizacion,
  onCampoChange,
  onFaseChange,
}) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Monitoreo Fenológico
      </h2>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <p className="text-sm text-gray-700">
          <span className="font-bold">Metodología:</span> Para cada planta seleccione la fase fenológica
          que está observando. Complete los campos correspondientes a la fase elegida.
        </p>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-4 mt-8">
        Plantas seleccionadas para monitoreo fenológico
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Las siguientes 5 plantas han sido generadas automáticamente. Defina la fase de cada una.
      </p>

      {plantas.map((planta, idx) => {
        const i = idx + 1;
        const fase = planta.fase;

        const hojasKey = `fenologico_planta_${i}_total_hojas`;
        const brotesKey = `fenologico_planta_${i}_brotes_activos`;
        const bbchVegKey = `fenologico_planta_${i}_bbch_vegetativo`;
        const totalFloresKey = `fenologico_planta_${i}_total_flores`;
        const botonesKey = `fenologico_planta_${i}_botones_florales`;
        const bbchFlorKey = `fenologico_planta_${i}_bbch_floracion`;
        const totalFrutosKey = `fenologico_planta_${i}_total_frutos`;
        const canicaKey = `fenologico_planta_${i}_frutos_canica`;
        const pinponKey = `fenologico_planta_${i}_frutos_pinpon`;
        const bolaTenisKey = `fenologico_planta_${i}_frutos_bola_tenis`;
        const cuartoKey = `fenologico_planta_${i}_frutos_cuarto`;
        const bbchFrucKey = `fenologico_planta_${i}_bbch_fructificacion`;

        return (
          <div key={planta.codigo} className="border rounded-lg p-4 mb-6 bg-white shadow-sm">
            <h4 className="font-semibold text-lg text-gray-800 mb-2">
              {planta.label} (Código: {planta.codigo})
            </h4>

            <div className="mb-4 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fase fenológica
              </label>
              <select
                value={planta.fase}
                onChange={(e) =>
                  onFaseChange(idx, e.target.value as PlantaFenologico["fase"])
                }
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              >
                <option value="" disabled>
                  -- Seleccione una fase --
                </option>
                <option value="vegetativa">Vegetativa</option>
                <option value="floracion">Floración</option>
                <option value="fructificacion">Fructificación</option>
              </select>
            </div>

            {fase === "vegetativa" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Número total de hojas evaluadas
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    name={hojasKey}
                    value={caracterizacion[hojasKey] || ""}
                    onChange={(e) => onCampoChange(hojasKey, e.target.value)}
                    className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 45"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Número de brotes vegetativos activos
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    name={brotesKey}
                    value={caracterizacion[brotesKey] || ""}
                    onChange={(e) => onCampoChange(brotesKey, e.target.value)}
                    className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 8"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Estado BBCH predominante
                  </label>
                  <select
                    name={bbchVegKey}
                    value={caracterizacion[bbchVegKey] || ""}
                    onChange={(e) => onCampoChange(bbchVegKey, e.target.value)}
                    className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="" disabled>Seleccione</option>
                    <option value="10-11">10–11: Primeras hojas visibles</option>
                    <option value="15">15: Hojas en expansión</option>
                    <option value="19">19: Hojas alcanzan tamaño final</option>
                  </select>
                </div>
              </div>
            )}

            {fase === "floracion" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Número total de flores observadas
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    name={totalFloresKey}
                    value={caracterizacion[totalFloresKey] || ""}
                    onChange={(e) => onCampoChange(totalFloresKey, e.target.value)}
                    className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 30"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Número de botones florales
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    name={botonesKey}
                    value={caracterizacion[botonesKey] || ""}
                    onChange={(e) => onCampoChange(botonesKey, e.target.value)}
                    className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 12"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Estado BBCH predominante
                  </label>
                  <select
                    name={bbchFlorKey}
                    value={caracterizacion[bbchFlorKey] || ""}
                    onChange={(e) => onCampoChange(bbchFlorKey, e.target.value)}
                    className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="" disabled>Seleccione</option>
                    <option value="60">60: primeras flores abiertas</option>
                    <option value="65">65: Plena floración (≈50% abiertas)</option>
                    <option value="67">67: Inicio caída de pétalos</option>
                    <option value="69">69: Fin de floración</option>
                  </select>
                </div>
              </div>
            )}

            {fase === "fructificacion" && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Número total de frutos observados
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      name={totalFrutosKey}
                      value={caracterizacion[totalFrutosKey] || ""}
                      onChange={(e) => onCampoChange(totalFrutosKey, e.target.value)}
                      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 50"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Frutos tipo canica
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      name={canicaKey}
                      value={caracterizacion[canicaKey] || ""}
                      onChange={(e) => onCampoChange(canicaKey, e.target.value)}
                      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 10"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Frutos tipo pin-pon
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      name={pinponKey}
                      value={caracterizacion[pinponKey] || ""}
                      onChange={(e) => onCampoChange(pinponKey, e.target.value)}
                      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 15"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Frutos tipo bola de tenis
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      name={bolaTenisKey}
                      value={caracterizacion[bolaTenisKey] || ""}
                      onChange={(e) => onCampoChange(bolaTenisKey, e.target.value)}
                      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 12"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Frutos 1/4 de maduración
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      name={cuartoKey}
                      value={caracterizacion[cuartoKey] || ""}
                      onChange={(e) => onCampoChange(cuartoKey, e.target.value)}
                      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 8"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4 mt-2">
                  <div className="flex flex-col md:w-1/3">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Estado BBCH predominante
                    </label>
                    <select
                      name={bbchFrucKey}
                      value={caracterizacion[bbchFrucKey] || ""}
                      onChange={(e) => onCampoChange(bbchFrucKey, e.target.value)}
                      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="" disabled>Seleccione</option>
                      <option value="71">71: Cuajado inicial</option>
                      <option value="72">72: Fruto verde con sépalos</option>
                      <option value="74">74: Crecimiento del fruto</option>
                      <option value="79">79: ≈90% Tamaño final</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};