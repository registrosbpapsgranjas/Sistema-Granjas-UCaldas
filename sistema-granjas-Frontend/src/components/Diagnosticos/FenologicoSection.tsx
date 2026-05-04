import React, { forwardRef, useImperativeHandle, useState } from "react";
import type { PlantaBase } from '../types';
import { toast } from "react-toastify";

interface PlantaFenologico extends PlantaBase {}

interface Props {
  plantas: PlantaFenologico[];
  caracterizacion: Record<string, string | string[]>;
  onCampoChange: (campo: string, valor: string | string[]) => void;
}

export interface FenologicoSectionRef {
  validate: () => boolean;
}

const OPCIONES_FASES = [
  { value: "vegetativa", label: "Vegetativa" },
  { value: "floracion", label: "Floración" },
  { value: "fructificacion", label: "Fructificación" }
];

export const FenologicoSection = forwardRef<FenologicoSectionRef, Props>(
  ({ plantas, caracterizacion, onCampoChange }, ref) => {
    const [errores, setErrores] = useState<Record<string, string>>({});

    const getKey = (plantaIdx: number, ramaIdx: number, campo: string) =>
      `fenologico_planta_${plantaIdx + 1}_rama_${ramaIdx}_${campo}`;

    // Obtener fases seleccionadas desde caracterizacion (puede ser array o string JSON)
    const getFasesSeleccionadas = (plantaIdx: number, ramaIdx: number): string[] => {
      const faseKey = getKey(plantaIdx, ramaIdx, "fases");
      const fases = caracterizacion[faseKey];
      if (Array.isArray(fases)) return fases;
      if (typeof fases === 'string') {
        try {
          const parsed = JSON.parse(fases);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
        return fases ? [fases] : [];
      }
      return [];
    };

    const isFaseSeleccionada = (plantaIdx: number, ramaIdx: number, faseValue: string): boolean =>
      getFasesSeleccionadas(plantaIdx, ramaIdx).includes(faseValue);

    const handleFasesChange = (plantaIdx: number, ramaIdx: number, selectedValues: string[]) => {
      const faseKey = getKey(plantaIdx, ramaIdx, "fases");
      onCampoChange(faseKey, selectedValues);
    };

    const validate = (): boolean => {
      const nuevosErrores: Record<string, string> = {};
      let isValid = true;

      plantas.forEach((planta, plantaIdx) => {
        for (let ramaIdx = 1; ramaIdx <= 4; ramaIdx++) {
          const fases = getFasesSeleccionadas(plantaIdx, ramaIdx);
          const puntoLabel = `${planta.label} (Código: ${planta.codigo}), Rama ${ramaIdx}`;

          if (fases.length === 0) {
            const errorKey = `fenologico_${planta.codigo}_rama_${ramaIdx}_sin_fase`;
            nuevosErrores[errorKey] = `En la planta ${puntoLabel} debe seleccionar al menos una fase fenológica.`;
            isValid = false;
            continue;
          }

          if (fases.includes("vegetativa")) {
            const totalPuntosKey = getKey(plantaIdx, ramaIdx, "total_puntos_crecimiento");
            const bbchVegKey = getKey(plantaIdx, ramaIdx, "bbch_vegetativo");
            const totalPuntos = caracterizacion[totalPuntosKey];
            const bbchVeg = caracterizacion[bbchVegKey];

            if (!totalPuntos || totalPuntos === "") {
              nuevosErrores[totalPuntosKey] = `Campo "Número total de puntos de crecimiento" requerido en ${puntoLabel}.`;
              isValid = false;
            }
            if (!bbchVeg || bbchVeg === "") {
              nuevosErrores[bbchVegKey] = `Campo "Estado BBCH vegetativo" requerido en ${puntoLabel}.`;
              isValid = false;
            }
          }

          if (fases.includes("floracion")) {
            const totalFloresKey = getKey(plantaIdx, ramaIdx, "total_flores");
            const bbchFlorKey = getKey(plantaIdx, ramaIdx, "bbch_floracion");
            const totalFlores = caracterizacion[totalFloresKey];
            const bbchFlor = caracterizacion[bbchFlorKey];

            if (!totalFlores || totalFlores === "") {
              nuevosErrores[totalFloresKey] = `Campo "Número total de flores" requerido en ${puntoLabel}.`;
              isValid = false;
            }
            if (!bbchFlor || bbchFlor === "") {
              nuevosErrores[bbchFlorKey] = `Campo "Estado BBCH floración" requerido en ${puntoLabel}.`;
              isValid = false;
            }
          }

          if (fases.includes("fructificacion")) {
            const totalFrutosKey = getKey(plantaIdx, ramaIdx, "total_frutos");
            const canicaKey = getKey(plantaIdx, ramaIdx, "frutos_canica");
            const pinponKey = getKey(plantaIdx, ramaIdx, "frutos_pinpon");
            const bolaTenisKey = getKey(plantaIdx, ramaIdx, "frutos_bola_tenis");
            const cuartoKey = getKey(plantaIdx, ramaIdx, "frutos_cuarto");
            const bbchFrucKey = getKey(plantaIdx, ramaIdx, "bbch_fructificacion");

            const totalFrutos = caracterizacion[totalFrutosKey];
            const canica = caracterizacion[canicaKey];
            const pinpon = caracterizacion[pinponKey];
            const bolaTenis = caracterizacion[bolaTenisKey];
            const cuarto = caracterizacion[cuartoKey];
            const bbchFruc = caracterizacion[bbchFrucKey];

            if (!totalFrutos || totalFrutos === "") {
              nuevosErrores[totalFrutosKey] = `Campo "Número total de frutos" requerido en ${puntoLabel}.`;
              isValid = false;
            }
            if (!canica || canica === "") {
              nuevosErrores[canicaKey] = `Campo "Frutos tipo canica" requerido en ${puntoLabel}.`;
              isValid = false;
            }
            if (!pinpon || pinpon === "") {
              nuevosErrores[pinponKey] = `Campo "Frutos tipo pin-pon" requerido en ${puntoLabel}.`;
              isValid = false;
            }
            if (!bolaTenis || bolaTenis === "") {
              nuevosErrores[bolaTenisKey] = `Campo "Frutos tipo bola de tenis" requerido en ${puntoLabel}.`;
              isValid = false;
            }
            if (!cuarto || cuarto === "") {
              nuevosErrores[cuartoKey] = `Campo "Frutos 1/4 de maduración" requerido en ${puntoLabel}.`;
              isValid = false;
            }
            if (!bbchFruc || bbchFruc === "") {
              nuevosErrores[bbchFrucKey] = `Campo "Estado BBCH fructificación" requerido en ${puntoLabel}.`;
              isValid = false;
            }
          }
        }
      });

      setErrores(nuevosErrores);
      if (!isValid) {
        toast.error("Por favor complete todos los campos obligatorios según las fases seleccionadas.");
      }
      return isValid;
    };

    useImperativeHandle(ref, () => ({ validate }));

    const renderError = (errorKey: string) => {
      if (errores[errorKey]) return <p className="text-red-600 text-xs mt-1">{errores[errorKey]}</p>;
      return null;
    };

    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Monitoreo Fenológico</h2>

        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
          <p className="text-sm text-gray-700">
            <span className="font-bold">Metodología:</span> Para cada árbol, divida la copa en 4 cuadrantes.
            Seleccione una rama terminal de aproximadamente 50 cm en cada cuadrante. Evalúe cada rama
            de forma independiente, registrando la(s) fase(s) fenológica(s) predominante(s) y los parámetros
            correspondientes.
          </p>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-4 mt-8">Plantas seleccionadas para monitoreo fenológico</h3>
        <p className="text-sm text-gray-600 mb-6">
          Las siguientes {plantas.length} plantas han sido generadas. Para cada una, evalúe las 4 ramas (una por cuadrante).
        </p>

        {plantas.map((planta, idxPlanta) => {
          return (
            <div key={planta.codigo} className="border rounded-lg p-4 mb-8 bg-white shadow-sm">
              <h4 className="font-semibold text-lg text-gray-800 mb-2">
                {planta.label} (Código: {planta.codigo})
              </h4>
              <p className="text-sm text-gray-500 mb-4">Evalúe cada una de las 4 ramas (cuadrantes)</p>

              {[1, 2, 3, 4].map((ramaNum) => {
                const j = ramaNum;
                const fasesSeleccionadas = getFasesSeleccionadas(idxPlanta, j);
                const sinFaseErrorKey = `fenologico_${planta.codigo}_rama_${j}_sin_fase`;

                const totalPuntosKey = getKey(idxPlanta, j, "total_puntos_crecimiento");
                const bbchVegKey = getKey(idxPlanta, j, "bbch_vegetativo");
                const totalFloresKey = getKey(idxPlanta, j, "total_flores");
                const bbchFlorKey = getKey(idxPlanta, j, "bbch_floracion");
                const totalFrutosKey = getKey(idxPlanta, j, "total_frutos");
                const canicaKey = getKey(idxPlanta, j, "frutos_canica");
                const pinponKey = getKey(idxPlanta, j, "frutos_pinpon");
                const bolaTenisKey = getKey(idxPlanta, j, "frutos_bola_tenis");
                const cuartoKey = getKey(idxPlanta, j, "frutos_cuarto");
                const bbchFrucKey = getKey(idxPlanta, j, "bbch_fructificacion");

                return (
                  <div key={`${planta.codigo}-rama-${j}`} className="ml-4 mb-6 p-3 border-l-4 border-blue-200 bg-gray-50 rounded">
                    <h5 className="font-medium text-md text-gray-700 mb-3">Rama {j} (Cuadrante {j})</h5>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fase(s) fenológica(s) de la rama (puede seleccionar varias)
                      </label>
                      {renderError(sinFaseErrorKey)}
                      <div className="space-y-2 border rounded-lg p-4 bg-white">
                        {OPCIONES_FASES.map((fase) => (
                          <label key={fase.value} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={isFaseSeleccionada(idxPlanta, j, fase.value)}
                              onChange={(e) => {
                                const nuevasFases = e.target.checked
                                  ? [...fasesSeleccionadas, fase.value]
                                  : fasesSeleccionadas.filter(f => f !== fase.value);
                                handleFasesChange(idxPlanta, j, nuevasFases);
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{fase.label}</span>
                          </label>
                        ))}
                      </div>
                      {fasesSeleccionadas.length === 0 && (
                        <p className="text-sm text-yellow-600 mt-2">
                          ⚠️ Seleccione al menos una fase para habilitar los campos correspondientes
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      {isFaseSeleccionada(idxPlanta, j, "vegetativa") && (
                        <div className="border-t pt-4">
                          <h6 className="font-medium mb-3">Fase Vegetativa</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1">Número total de puntos de crecimiento evaluados en la Rama {j}</label>
                              <input type="number" step="1" min="0" value={caracterizacion[totalPuntosKey] || ""}
                                onChange={(e) => onCampoChange(totalPuntosKey, e.target.value)}
                                className="border rounded px-3 py-2 w-full" placeholder="Ej: 45" />
                              {renderError(totalPuntosKey)}
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1">Estado BBCH predominante</label>
                              <select value={caracterizacion[bbchVegKey] || ""} onChange={(e) => onCampoChange(bbchVegKey, e.target.value)}
                                className="border rounded px-3 py-2 w-full">
                                <option value="" disabled>Seleccione</option>
                                <option value="09">09: Los primordios foliares son visibles</option>
                                <option value="10">10: Las primeras hojas empiezan a separarse</option>
                                <option value="15">15: Se hacen visibles más hojas, pero sin alcanzar su tamaño final</option>
                                <option value="19">19: Las hojas alcanzan su tamaño final</option>
                                <option value="31">31: Empieza a crecer el brote: se hace visible su tallo</option>
                                <option value="32">32: Los brotes alcanzan alrededor del 20% de su tamaño final</option>
                                <option value="39">39: Los brotes alcanzan alrededor del 90% de su tamaño final</option>
                              </select>
                              {renderError(bbchVegKey)}
                            </div>
                          </div>
                        </div>
                      )}

                      {isFaseSeleccionada(idxPlanta, j, "floracion") && (
                        <div className="border-t pt-4">
                          <h6 className="font-medium mb-3">Fase de Floración</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1">Número total de flores evaluadas en la Rama {j}</label>
                              <input type="number" step="1" min="0" value={caracterizacion[totalFloresKey] || ""}
                                onChange={(e) => onCampoChange(totalFloresKey, e.target.value)}
                                className="border rounded px-3 py-2 w-full" placeholder="Ej: 30" />
                              {renderError(totalFloresKey)}
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1">Estado BBCH predominante</label>
                              <select value={caracterizacion[bbchFlorKey] || ""} onChange={(e) => onCampoChange(bbchFlorKey, e.target.value)}
                                className="border rounded px-3 py-2 w-full">
                                <option value="" disabled>Seleccione</option>
                                <option value="51">51: Se hacen visibles las escamas ligeramente verdes</option>
                                <option value="53">53: Las escamas se separan y se hacen visibles los primordios florales</option>
                                <option value="55">55: Las flores se hacen visibles: están todavía cerradas (botón verde)</option>
                                <option value="56">56: Los pétalos crecen (botón blanco)</option>
                                <option value="57">57: Apertura de sépalos con pétalos visibles aún cerrados</option>
                                <option value="59">59: Flores mayoritariamente con pétalos cerrados</option>
                                <option value="60">60: Se abren las primeras flores</option>
                                <option value="61">61: Comienza la floración: alrededor del 10% de las flores están abiertas</option>
                                <option value="65">65: Plena floración: alrededor del 50% de las flores están abiertas</option>
                                <option value="67">67: Las flores se marchitan: la mayoría de los pétalos están cayendo</option>
                                <option value="69">69: Fin de la floración: han caído todos los pétalos</option>
                              </select>
                              {renderError(bbchFlorKey)}
                            </div>
                          </div>
                        </div>
                      )}

                      {isFaseSeleccionada(idxPlanta, j, "fructificacion") && (
                        <div className="border-t pt-4">
                          <h6 className="font-medium mb-3">Fase de Fructificación</h6>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-1">Número total de frutos observados en la Rama {j}</label>
                                <input type="number" step="1" min="0" value={caracterizacion[totalFrutosKey] || ""}
                                  onChange={(e) => onCampoChange(totalFrutosKey, e.target.value)}
                                  className="border rounded px-3 py-2 w-full" placeholder="Ej: 50" />
                                {renderError(totalFrutosKey)}
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-1">Frutos tipo canica</label>
                                <input type="number" step="1" min="0" value={caracterizacion[canicaKey] || ""}
                                  onChange={(e) => onCampoChange(canicaKey, e.target.value)}
                                  className="border rounded px-3 py-2 w-full" placeholder="Ej: 10" />
                                {renderError(canicaKey)}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-1">Frutos tipo pin-pon</label>
                                <input type="number" step="1" min="0" value={caracterizacion[pinponKey] || ""}
                                  onChange={(e) => onCampoChange(pinponKey, e.target.value)}
                                  className="border rounded px-3 py-2 w-full" placeholder="Ej: 15" />
                                {renderError(pinponKey)}
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-1">Frutos tipo bola de tenis</label>
                                <input type="number" step="1" min="0" value={caracterizacion[bolaTenisKey] || ""}
                                  onChange={(e) => onCampoChange(bolaTenisKey, e.target.value)}
                                  className="border rounded px-3 py-2 w-full" placeholder="Ej: 12" />
                                {renderError(bolaTenisKey)}
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-1">Frutos 1/4 de maduración</label>
                                <input type="number" step="1" min="0" value={caracterizacion[cuartoKey] || ""}
                                  onChange={(e) => onCampoChange(cuartoKey, e.target.value)}
                                  className="border rounded px-3 py-2 w-full" placeholder="Ej: 8" />
                                {renderError(cuartoKey)}
                              </div>
                            </div>
                            <div className="md:w-1/3">
                              <label className="text-sm font-medium text-gray-700 mb-1">Estado BBCH predominante</label>
                              <select value={caracterizacion[bbchFrucKey] || ""} onChange={(e) => onCampoChange(bbchFrucKey, e.target.value)}
                                className="border rounded px-3 py-2 w-full">
                                <option value="" disabled>Seleccione</option>
                                <option value="71">71: Cuajado: el ovario empieza a crecer</option>
                                <option value="72">72: El fruto, verde, está rodeado por los sépalos</option>
                                <option value="73">73: Algunos frutos amarillean: caída fisiológica</option>
                                <option value="74">74: Fruto al 40% del tamaño final, color verde oscuro</option>
                                <option value="79">79: El fruto alcanza alrededor del 90% de su tamaño final</option>
                              </select>
                              {renderError(bbchFrucKey)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {fasesSeleccionadas.length > 0 && (
                      <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-2">
                        <span className="font-medium">Fases activas:</span>
                        {fasesSeleccionadas.map(fase => (
                          <span key={fase} className={`px-2 py-1 rounded-full ${fase === 'vegetativa' ? 'bg-green-100' : fase === 'floracion' ? 'bg-pink-100' : 'bg-orange-100'}`}>
                            {fase === 'vegetativa' ? 'Vegetativa' : fase === 'floracion' ? 'Floración' : 'Fructificación'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }
);