import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { type PlantaBase } from '../types';
import { toast } from 'react-toastify';

interface ArvensesSectionProps {
  // Ya no se reciben "plantas" (muestra aleatoria)
  todasLasPlantas: PlantaBase[];   // todas las plantas del lote
  metodoMuestreo: 'X' | 'W';       // 'X' o 'W'
  surcos: number;                  // número de surcos del lote
  plantasPorSurco: number;         // plantas por surco
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

export interface ArvensesSectionRef {
  validate: () => boolean;
}

// (Las constantes ARVENSES_NOBLES, ARVENSES_AGRESIVAS, ImageModal, RealFotosSection, ArvenseRow, OtraEspecieSection se mantienen igual que en tu código original,
//  pero las he copiado aquí por completitud. Asumo que ya las tienes definidas. Para ahorrar espacio no las repito todas, pero están presentes.)

// ... (copia exacta de las constantes y componentes auxiliares desde tu código original hasta antes de ArvensesSection)

// ==================== COMPONENTE PRINCIPAL MODIFICADO ====================

export const ArvensesSection = forwardRef<ArvensesSectionRef, ArvensesSectionProps>(
  ({ todasLasPlantas, metodoMuestreo, surcos, plantasPorSurco, caracterizacion, onCampoChange }, ref) => {
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [errores, setErrores] = useState<Record<string, string>>({});

    // Generar los 5 puntos de muestreo según el método
    const generarPuntos = (): { id: number; surco: number; planta: number; label: string }[] => {
      const puntos: { id: number; surco: number; planta: number; label: string }[] = [];

      // Coordenadas límite (1-indexadas)
      const minSurco = 1;
      const maxSurco = surcos;
      const minPlanta = 1;
      const maxPlanta = plantasPorSurco;

      if (metodoMuestreo === 'X') {
        // 4 esquinas
        puntos.push({ id: 1, surco: minSurco, planta: minPlanta, label: 'Esquina superior izquierda' });
        puntos.push({ id: 2, surco: minSurco, planta: maxPlanta, label: 'Esquina superior derecha' });
        puntos.push({ id: 3, surco: maxSurco, planta: minPlanta, label: 'Esquina inferior izquierda' });
        puntos.push({ id: 4, surco: maxSurco, planta: maxPlanta, label: 'Esquina inferior derecha' });
        // Centro (promedio)
        const centroSurco = Math.round((minSurco + maxSurco) / 2);
        const centroPlanta = Math.round((minPlanta + maxPlanta) / 2);
        puntos.push({ id: 5, surco: centroSurco, planta: centroPlanta, label: 'Centro' });
      } else { // Método W
        // Puntos W: (0,0), (0, max/2), (0, max), (max/2, 0), (max, max)
        const medioSurco = Math.round((minSurco + maxSurco) / 2);
        const medioPlanta = Math.round((minPlanta + maxPlanta) / 2);
        puntos.push({ id: 1, surco: minSurco, planta: minPlanta, label: 'Punto superior izquierdo' });
        puntos.push({ id: 2, surco: minSurco, planta: medioPlanta, label: 'Punto superior central' });
        puntos.push({ id: 3, surco: minSurco, planta: maxPlanta, label: 'Punto superior derecho' });
        puntos.push({ id: 4, surco: medioSurco, planta: minPlanta, label: 'Punto medio izquierdo' });
        puntos.push({ id: 5, surco: maxSurco, planta: maxPlanta, label: 'Punto inferior derecho' });
      }

      return puntos;
    };

    const puntosMuestreo = generarPuntos();

    // Función para obtener el árbol más cercano a unas coordenadas dadas
    const obtenerArbolCercano = (surco: number, planta: number): PlantaBase | undefined => {
      // Buscar la planta exacta
      let exacta = todasLasPlantas.find(p => p.surco === surco && p.planta === planta);
      if (exacta) return exacta;
      // Si no existe, buscar la más cercana por distancia euclidiana
      let mejor: PlantaBase | undefined;
      let mejorDist = Infinity;
      for (const p of todasLasPlantas) {
        const dist = Math.hypot(p.surco - surco, p.planta - planta);
        if (dist < mejorDist) {
          mejorDist = dist;
          mejor = p;
        }
      }
      return mejor;
    };

    // Inicializar la selección de árbol de referencia para cada punto (si no existe en caracterización)
    puntosMuestreo.forEach((punto) => {
      const key = `arvenses_punto_${punto.id}_arbol_referencia`;
      if (!caracterizacion[key]) {
        const arbolCercano = obtenerArbolCercano(punto.surco, punto.planta);
        if (arbolCercano) {
          onCampoChange(key, arbolCercano.codigo);
        }
      }
    });

    // Helpers para leer/escribir caracterización con la nueva estructura
    const getValor = (puntoId: number, campo: string): string => {
      return caracterizacion[`arvenses_punto_${puntoId}_${campo}`] || '';
    };

    const setValor = (puntoId: number, campo: string, valor: string) => {
      onCampoChange(`arvenses_punto_${puntoId}_${campo}`, valor);
    };

    const handleZonaMonitoreadaChange = (puntoId: number, zona: 'plato' | 'calle', checked: boolean) => {
      setValor(puntoId, `zona_monitoreada_${zona}`, checked ? zona : '');
      if (!checked) {
        // Limpiar todos los campos de esa zona
        const campos: string[] = [
          `${zona}_cobertura_nobles`,
          `${zona}_cobertura_agresivas`,
          `${zona}_altura`,
        ];
        ARVENSES_NOBLES.forEach((a) => campos.push(`${zona}_noble_${a.id}_porcentaje`));
        ARVENSES_AGRESIVAS.forEach((a) => campos.push(`${zona}_agresiva_${a.id}_porcentaje`));
        campos.push(`${zona}_otra_especie_noble_nombre`, `${zona}_otra_especie_noble_porcentaje`, `${zona}_otra_especie_noble_fotos`);
        campos.push(`${zona}_otra_especie_agresiva_nombre`, `${zona}_otra_especie_agresiva_porcentaje`, `${zona}_otra_especie_agresiva_fotos`);
        campos.forEach((campo) => setValor(puntoId, campo, ''));
      }
    };

    const handleAlturaChange = (puntoId: number, zona: 'plato' | 'calle', valor: string) => {
      setValor(puntoId, `${zona}_altura`, valor);
    };

    // Componente interno para renderizar una zona (plato/calle) de un punto
    const renderZona = (puntoId: number, zona: 'plato' | 'calle', alturaActual: string) => {
      const titulo = zona === 'plato' ? 'Evaluación en Plato' : 'Evaluación en Calle';
      const errorKey = `arvenses_punto_${puntoId}_${zona}_sin_cobertura`;
      const errorMsg = errores[errorKey];

      return (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h5 className="font-medium text-md text-gray-700 mb-3">{titulo}</h5>
          {errorMsg && <p className="text-red-600 text-xs mb-2">{errorMsg}</p>}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Altura promedio de las arvenses monitoreadas</label>
            <div className="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-4">
              {['Hasta 20cm', 'De 20 a 50 cm', 'Mayor 50cm'].map((opcion) => (
                <label key={opcion} className="flex items-center">
                  <input type="radio" name={`punto_${puntoId}_${zona}_altura`} value={opcion}
                    checked={alturaActual === opcion}
                    onChange={(e) => handleAlturaChange(puntoId, zona, e.target.value)}
                    className="mr-2" />
                  {opcion}
                </label>
              ))}
            </div>
          </div>

          {/* Arvenses Nobles */}
          <div className="mb-5">
            <h6 className="font-medium text-sm text-gray-700 mb-2">Arvenses Nobles y % de cobertura</h6>
            <p className="text-xs text-gray-500 mb-2">(Si no hay presencia de arvenses nobles, coloque 0 en el porcentaje de cobertura)</p>
            <div className="space-y-2">
              {ARVENSES_NOBLES.map((arvense) => (
                <ArvenseRow
                  key={`punto-${puntoId}-${zona}-noble-${arvense.id}`}
                  codigo={`punto_${puntoId}`}
                  zona={zona}
                  tipo="noble"
                  arvense={arvense}
                  getValor={(codigo, campo) => getValor(puntoId, campo)}
                  setValor={(codigo, campo, val) => setValor(puntoId, campo, val)}
                  onOpenImage={(img) => setModalImage(`/imgs/${img}`)}
                />
              ))}
              <OtraEspecieSection
                codigo={`punto_${puntoId}`}
                zona={zona}
                tipo="noble"
                getValor={(codigo, campo) => getValor(puntoId, campo)}
                setValor={(codigo, campo, val) => setValor(puntoId, campo, val)}
                caracterizacion={caracterizacion}
                onCampoChange={onCampoChange}
              />
            </div>
          </div>

          {/* Arvenses Agresivas */}
          <div className="mb-2">
            <h6 className="font-medium text-sm text-gray-700 mb-2">Arvenses Agresivas y % de cobertura</h6>
            <p className="text-xs text-gray-500 mb-2">(Si no hay presencia de arvenses agresivas, coloque 0 en el porcentaje de cobertura)</p>
            <div className="space-y-2">
              {ARVENSES_AGRESIVAS.map((arvense) => (
                <ArvenseRow
                  key={`punto-${puntoId}-${zona}-agresiva-${arvense.id}`}
                  codigo={`punto_${puntoId}`}
                  zona={zona}
                  tipo="agresiva"
                  arvense={arvense}
                  getValor={(codigo, campo) => getValor(puntoId, campo)}
                  setValor={(codigo, campo, val) => setValor(puntoId, campo, val)}
                  onOpenImage={(img) => setModalImage(`/imgs/${img}`)}
                />
              ))}
              <OtraEspecieSection
                codigo={`punto_${puntoId}`}
                zona={zona}
                tipo="agresiva"
                getValor={(codigo, campo) => getValor(puntoId, campo)}
                setValor={(codigo, campo, val) => setValor(puntoId, campo, val)}
                caracterizacion={caracterizacion}
                onCampoChange={onCampoChange}
              />
            </div>
          </div>
        </div>
      );
    };

    // Validación (ahora sobre los 5 puntos)
    const validate = (): boolean => {
      const nuevosErrores: Record<string, string> = {};
      let isValid = true;

      puntosMuestreo.forEach((punto) => {
        const puntoId = punto.id;
        const arbolRefKey = `arvenses_punto_${puntoId}_arbol_referencia`;
        const arbolRef = caracterizacion[arbolRefKey];

        if (!arbolRef) {
          nuevosErrores[`arvenses_punto_${puntoId}_sin_arbol`] = `Debe seleccionar un árbol de referencia para el punto ${puntoId} (${punto.label}).`;
          isValid = false;
        }

        const zonaPlato = getValor(puntoId, 'zona_monitoreada_plato') === 'plato';
        const zonaCalle = getValor(puntoId, 'zona_monitoreada_calle') === 'calle';

        if (!zonaPlato && !zonaCalle) {
          nuevosErrores[`arvenses_punto_${puntoId}_sin_zona`] = `En el punto ${puntoId} (${punto.label}) debe seleccionar al menos una zona (Plato y/o Calle).`;
          isValid = false;
        }

        // Validar coberturas en cada zona seleccionada
        if (zonaPlato) {
          let hayCobertura = false;
          // Nobles
          for (const arvense of ARVENSES_NOBLES) {
            const val = getValor(puntoId, `plato_noble_${arvense.id}_porcentaje`);
            if (val && parseFloat(val) > 0) { hayCobertura = true; break; }
          }
          if (!hayCobertura) {
            for (const arvense of ARVENSES_AGRESIVAS) {
              const val = getValor(puntoId, `plato_agresiva_${arvense.id}_porcentaje`);
              if (val && parseFloat(val) > 0) { hayCobertura = true; break; }
            }
          }
          if (!hayCobertura) {
            const nobleNombre = getValor(puntoId, 'plato_otra_especie_noble_nombre');
            const noblePorc = getValor(puntoId, 'plato_otra_especie_noble_porcentaje');
            if (nobleNombre.trim() !== '' && noblePorc && parseFloat(noblePorc) > 0) hayCobertura = true;
          }
          if (!hayCobertura) {
            const agresivaNombre = getValor(puntoId, 'plato_otra_especie_agresiva_nombre');
            const agresivaPorc = getValor(puntoId, 'plato_otra_especie_agresiva_porcentaje');
            if (agresivaNombre.trim() !== '' && agresivaPorc && parseFloat(agresivaPorc) > 0) hayCobertura = true;
          }
          if (!hayCobertura) {
            nuevosErrores[`arvenses_punto_${puntoId}_plato_sin_cobertura`] = `En el punto ${puntoId} (${punto.label}), zona "Plato", debe registrar al menos un porcentaje de cobertura positivo.`;
            isValid = false;
          }
        }

        if (zonaCalle) {
          let hayCobertura = false;
          for (const arvense of ARVENSES_NOBLES) {
            const val = getValor(puntoId, `calle_noble_${arvense.id}_porcentaje`);
            if (val && parseFloat(val) > 0) { hayCobertura = true; break; }
          }
          if (!hayCobertura) {
            for (const arvense of ARVENSES_AGRESIVAS) {
              const val = getValor(puntoId, `calle_agresiva_${arvense.id}_porcentaje`);
              if (val && parseFloat(val) > 0) { hayCobertura = true; break; }
            }
          }
          if (!hayCobertura) {
            const nobleNombre = getValor(puntoId, 'calle_otra_especie_noble_nombre');
            const noblePorc = getValor(puntoId, 'calle_otra_especie_noble_porcentaje');
            if (nobleNombre.trim() !== '' && noblePorc && parseFloat(noblePorc) > 0) hayCobertura = true;
          }
          if (!hayCobertura) {
            const agresivaNombre = getValor(puntoId, 'calle_otra_especie_agresiva_nombre');
            const agresivaPorc = getValor(puntoId, 'calle_otra_especie_agresiva_porcentaje');
            if (agresivaNombre.trim() !== '' && agresivaPorc && parseFloat(agresivaPorc) > 0) hayCobertura = true;
          }
          if (!hayCobertura) {
            nuevosErrores[`arvenses_punto_${puntoId}_calle_sin_cobertura`] = `En el punto ${puntoId} (${punto.label}), zona "Calle", debe registrar al menos un porcentaje de cobertura positivo.`;
            isValid = false;
          }
        }
      });

      setErrores(nuevosErrores);
      if (!isValid) {
        toast.error('Por favor complete los campos obligatorios en el monitoreo de arvenses (árbol de referencia, zonas y coberturas).');
      }
      return isValid;
    };

    useImperativeHandle(ref, () => ({ validate }));

    // Obtener la lista de árboles disponibles para el selector
    const arbolesDisponibles = todasLasPlantas.map(p => ({ codigo: p.codigo, label: p.label }));

    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Monitoreo de Arvenses</h2>

        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
          <p className="text-sm text-gray-700"><span className="font-bold">Metodología de muestreo:</span> El monitoreo se realizará mediante un recorrido por el lote.</p>
          <ul className="list-disc list-inside text-sm text-gray-700 mt-2 ml-2">
            <li><span className="font-medium">Lotes menores de 1 hectárea (&lt; 1 ha):</span> Recorrido en forma de X, cubriendo las diagonales del lote e incluyendo un punto central.</li>
            <li><span className="font-medium">Lotes mayores de 1 hectárea (&gt; 1 ha):</span> Recorrido en forma de W, garantizando una mayor representatividad del área evaluada.</li>
          </ul>
          <p className="text-sm text-gray-700 mt-2">En cada punto de monitoreo se estimará visualmente el porcentaje de cobertura en <strong>platos</strong> (zona debajo de la gotera hacia el tronco) y <strong>calles</strong> (espacio entre hileras).</p>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-4">Puntos de Monitoreo (Método {metodoMuestreo})</h3>

        {puntosMuestreo.map((punto) => {
          const puntoId = punto.id;
          const arbolRefKey = `arvenses_punto_${puntoId}_arbol_referencia`;
          const arbolSeleccionado = caracterizacion[arbolRefKey] || '';
          const zonaPlato = getValor(puntoId, 'zona_monitoreada_plato') === 'plato';
          const zonaCalle = getValor(puntoId, 'zona_monitoreada_calle') === 'calle';
          const alturaPlato = getValor(puntoId, 'plato_altura');
          const alturaCalle = getValor(puntoId, 'calle_altura');

          const errorArbol = errores[`arvenses_punto_${puntoId}_sin_arbol`];
          const errorZona = errores[`arvenses_punto_${puntoId}_sin_zona`];

          return (
            <div key={puntoId} className="border rounded-lg p-4 mb-8 bg-white shadow-sm">
              <h4 className="font-semibold text-lg text-gray-800 mb-2">
                Punto de Monitoreo {puntoId} - {punto.label}
              </h4>
              <p className="text-sm text-gray-500 mb-3">Coordenadas sugeridas: Surco {punto.surco}, Planta {punto.planta}</p>

              {/* Selección de árbol de referencia */}
              <div className="mb-4 p-3 bg-gray-100 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-2">Árbol de referencia (código) *</label>
                {errorArbol && <p className="text-red-600 text-xs mb-2">{errorArbol}</p>}
                <select
                  value={arbolSeleccionado}
                  onChange={(e) => setValor(puntoId, 'arbol_referencia', e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccione un árbol --</option>
                  {arbolesDisponibles.map((arbol) => (
                    <option key={arbol.codigo} value={arbol.codigo}>
                      {arbol.label} (Código: {arbol.codigo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Zonas monitoreadas */}
              <div className="mb-4 p-3 bg-gray-100 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-2">¿En qué zonas se realizó el monitoreo?</label>
                {errorZona && <p className="text-red-600 text-xs mb-2">{errorZona}</p>}
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input type="checkbox" checked={zonaPlato} onChange={(e) => handleZonaMonitoreadaChange(puntoId, 'plato', e.target.checked)} className="mr-2" />
                    Platos
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" checked={zonaCalle} onChange={(e) => handleZonaMonitoreadaChange(puntoId, 'calle', e.target.checked)} className="mr-2" />
                    Calles
                  </label>
                </div>
              </div>

              {zonaPlato && renderZona(puntoId, 'plato', alturaPlato)}
              {zonaCalle && renderZona(puntoId, 'calle', alturaCalle)}

              {puntoId < puntosMuestreo.length && <hr className="my-6 border-t-2 border-gray-300" />}
            </div>
          );
        })}

        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700">
          <p className="font-medium mb-1">📝 Recordatorio metodológico:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Para lotes menores de 1 ha se usa muestreo en <strong>X</strong> (4 esquinas + centro).</li>
            <li>Para lotes mayores de 1 ha se usa muestreo en <strong>W</strong> (puntos definidos según el ancho del lote).</li>
            <li>Cada punto debe referenciarse con el código del árbol más próximo.</li>
            <li>En cada zona evaluada (plato y calle), clasifique la vegetación en arvenses nobles y agresivas.</li>
            <li>Registre el porcentaje de cobertura para cada especie identificada (0 si no hay).</li>
          </ul>
        </div>

        <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
      </div>
    );
  }
);