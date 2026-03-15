import React from 'react';
import { PlantaBase } from '../types';

interface ArvensesSectionProps {
  plantas: PlantaBase[]; // 5 plantas seleccionadas (puntos de monitoreo)
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

interface ArvenseNoble {
  id: string;
  nombre: string;
  nombreCientifico: React.ReactNode;
}

interface ArvenseAgresiva {
  id: string;
  nombre: string;
  nombreCientifico: React.ReactNode;
}

// Lista predefinida de arvenses nobles
const ARVENSES_NOBLES: ArvenseNoble[] = [
  { id: 'hyptis_atrorubens', nombre: 'Hyptis atrorubens', nombreCientifico: <em>Hyptis atrorubens</em> },
  { id: 'spermacoce_alata', nombre: 'Spermacoce alata', nombreCientifico: <em>Spermacoce alata</em> },
  { id: 'drymaria_cordata', nombre: 'Drymaria cordata', nombreCientifico: <em>Drymaria cordata</em> },
  { id: 'grona_adscendens', nombre: 'Grona adscendens', nombreCientifico: <><em>Grona adscendens</em> (antes <em>Desmodium ovalifolium</em>)</> },
  { id: 'synedrella_nodiflora', nombre: 'Synedrella nodiflora', nombreCientifico: <em>Synedrella nodiflora</em> },
  { id: 'arachis_pintoi', nombre: 'Arachis pintoi', nombreCientifico: <em>Arachis pintoi</em> },
  { id: 'dichondra_repens', nombre: 'Dichondra repens', nombreCientifico: <em>Dichondra repens</em> },
  { id: 'euphorbia_hirta', nombre: 'Euphorbia hirta', nombreCientifico: <em>Euphorbia hirta</em> },
  { id: 'pseudoelephantopus_spicatus', nombre: 'Pseudoelephantopus spicatus', nombreCientifico: <em>Pseudoelephantopus spicatus</em> },
];

// Lista predefinida de arvenses agresivas
const ARVENSES_AGRESIVAS: ArvenseAgresiva[] = [
  { id: 'setaria_palmifolia', nombre: 'Setaria palmifolia', nombreCientifico: <em>Setaria palmifolia</em> },
  { id: 'oxalis_latifolia', nombre: 'Oxalis latifolia', nombreCientifico: <em>Oxalis latifolia</em> },
  { id: 'paspalum_dilatatum', nombre: 'Paspalum dilatatum', nombreCientifico: <em>Paspalum dilatatum</em> },
  { id: 'sorghum_halepense', nombre: 'Sorghum halepense', nombreCientifico: <em>Sorghum halepense</em> },
  { id: 'digitaria_sanguinalis', nombre: 'Digitaria sanguinalis', nombreCientifico: <em>Digitaria sanguinalis</em> },
  { id: 'cyperus_brevifolius', nombre: 'Cyperus brevifolius', nombreCientifico: <em>Cyperus brevifolius</em> },
  { id: 'bidens_pilosa', nombre: 'Bidens pilosa', nombreCientifico: <em>Bidens pilosa</em> },
  { id: 'drymaria_cordata_agresiva', nombre: 'Drymaria cordata', nombreCientifico: <em>Drymaria cordata</em> },
  { id: 'solanum_americanum', nombre: 'Solanum americanum', nombreCientifico: <em>Solanum americanum</em> },
  { id: 'talinum_paniculatum', nombre: 'Talinum paniculatum', nombreCientifico: <em>Talinum paniculatum</em> },
];

export const ArvensesSection: React.FC<ArvensesSectionProps> = ({
  plantas,
  caracterizacion,
  onCampoChange,
}) => {
  const handleChange = (clave: string, valor: any) => {
    onCampoChange(clave, String(valor));
  };

  // Función para obtener el valor de un campo específico
  const getValor = (codigo: string, campo: string): string => {
    return caracterizacion[`arvenses_${codigo}_${campo}`] || '';
  };

  // Función para actualizar el valor de un campo
  const setValor = (codigo: string, campo: string, valor: string) => {
    handleChange(`arvenses_${codigo}_${campo}`, valor);
  };

  // Función para manejar el cambio en el select de altura
  const handleAlturaChange = (codigo: string, zona: 'plato' | 'calle', valor: string) => {
    setValor(codigo, `${zona}_altura`, valor);
  };

  // Función para manejar el cambio en el checkbox de zona monitoreada
  const handleZonaMonitoreadaChange = (codigo: string, zona: 'plato' | 'calle', checked: boolean) => {
    setValor(codigo, `zona_monitoreada_${zona}`, checked ? zona : '');
    // Si se desmarca, limpiar los campos de esa zona
    if (!checked) {
      const campos = [
        `${zona}_cobertura_nobles`,
        `${zona}_cobertura_agresivas`,
        `${zona}_altura`,
      ];
      // Limpiar también los porcentajes de cada especie
      ARVENSES_NOBLES.forEach(arvense => {
        campos.push(`${zona}_noble_${arvense.id}_porcentaje`);
      });
      ARVENSES_AGRESIVAS.forEach(arvense => {
        campos.push(`${zona}_agresiva_${arvense.id}_porcentaje`);
      });
      campos.push(`${zona}_otra_especie_nombre`);
      campos.push(`${zona}_otra_especie_porcentaje`);

      campos.forEach(campo => {
        setValor(codigo, campo, '');
      });
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Monitoreo de Arvenses
      </h2>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <p className="text-sm text-gray-700">
          <span className="font-bold">Metodología de muestreo:</span> El monitoreo se realizará mediante un recorrido por el lote.
        </p>
        <ul className="list-disc list-inside text-sm text-gray-700 mt-2 ml-2">
          <li><span className="font-medium">Lotes menores de 1 hectárea (&lt; 1 ha):</span> Recorrido en forma de X, cubriendo las diagonales del lote e incluyendo un punto central.</li>
          <li><span className="font-medium">Lotes mayores de 1 hectárea (&gt; 1 ha):</span> Recorrido en forma de W, garantizando una mayor representatividad del área evaluada.</li>
        </ul>
        <p className="text-sm text-gray-700 mt-2">
          En cada punto de monitoreo se estimará visualmente el porcentaje de cobertura en <strong>platos</strong> (zona debajo de la gotera hacia el tronco) y <strong>calles</strong> (espacio entre hileras).
        </p>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Puntos de Monitoreo
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Se han generado {plantas.length} puntos de monitoreo. Cada punto debe ser referenciado con el código del árbol más próximo.
      </p>

      {plantas.map((planta, index) => {
        const codigo = planta.codigo;
        const puntoNumero = index + 1;

        // Valores actuales
        const zonaPlato = getValor(codigo, 'zona_monitoreada_plato') === 'plato';
        const zonaCalle = getValor(codigo, 'zona_monitoreada_calle') === 'calle';
        const alturaPlato = getValor(codigo, 'plato_altura');
        const alturaCalle = getValor(codigo, 'calle_altura');

        return (
          <div key={codigo} className="border rounded-lg p-4 mb-8 bg-white shadow-sm">
            <h4 className="font-semibold text-lg text-gray-800 mb-2">
              Punto de Monitoreo {puntoNumero} (Árbol de referencia: {planta.label} - Código: {codigo})
            </h4>

            {/* Selección de zonas a monitorear */}
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿En qué zonas se realizó el monitoreo?
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={zonaPlato}
                    onChange={(e) => handleZonaMonitoreadaChange(codigo, 'plato', e.target.checked)}
                    className="mr-2"
                  />
                  Platos
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={zonaCalle}
                    onChange={(e) => handleZonaMonitoreadaChange(codigo, 'calle', e.target.checked)}
                    className="mr-2"
                  />
                  Calles
                </label>
              </div>
            </div>

            {/* Evaluación en PLATO */}
            {zonaPlato && (
              <div className="mb-6 p-4 border rounded bg-gray-50">
                <h5 className="font-medium text-md text-gray-700 mb-3">Evaluación en Plato</h5>

                {/* Altura promedio */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura promedio de las arvenses monitoreadas
                  </label>
                  <div className="flex space-x-4">
                    {['Hasta 20cm', 'De 20 a 50 cm', 'Mayor 50cm'].map((opcion) => (
                      <label key={opcion} className="flex items-center">
                        <input
                          type="radio"
                          name={`${codigo}_plato_altura`}
                          value={opcion}
                          checked={alturaPlato === opcion}
                          onChange={(e) => handleAlturaChange(codigo, 'plato', e.target.value)}
                          className="mr-2"
                        />
                        {opcion}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Arvenses Nobles */}
                <div className="mb-4">
                  <h6 className="font-medium text-sm text-gray-700 mb-2">Arvenses Nobles y % de cobertura</h6>
                  <p className="text-xs text-gray-500 mb-2">
                    (Si no hay presencia de arvenses nobles, coloque 0 en el porcentaje de cobertura)
                  </p>
                  <div className="space-y-2">
                    {ARVENSES_NOBLES.map((arvense) => (
                      <div key={arvense.id} className="grid grid-cols-2 gap-2 items-center">
                        <label className="text-sm text-gray-600">{arvense.nombreCientifico}</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={getValor(codigo, `plato_noble_${arvense.id}_porcentaje`)}
                          onChange={(e) => setValor(codigo, `plato_noble_${arvense.id}_porcentaje`, e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                          placeholder="% cobertura"
                        />
                      </div>
                    ))}
                    {/* Otra especie noble */}
                    <div className="grid grid-cols-2 gap-2 items-center mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={getValor(codigo, 'plato_otra_especie_noble_nombre')}
                          onChange={(e) => setValor(codigo, 'plato_otra_especie_noble_nombre', e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                          placeholder="Otra especie (nombre)"
                        />
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={getValor(codigo, 'plato_otra_especie_noble_porcentaje')}
                        onChange={(e) => setValor(codigo, 'plato_otra_especie_noble_porcentaje', e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="% cobertura"
                      />
                    </div>
                  </div>
                </div>

                {/* Arvenses Agresivas */}
                <div className="mb-4">
                  <h6 className="font-medium text-sm text-gray-700 mb-2">Arvenses Agresivas y % de cobertura</h6>
                  <p className="text-xs text-gray-500 mb-2">
                    (Si no hay presencia de arvenses agresivas, coloque 0 en el porcentaje de cobertura)
                  </p>
                  <div className="space-y-2">
                    {ARVENSES_AGRESIVAS.map((arvense) => (
                      <div key={arvense.id} className="grid grid-cols-2 gap-2 items-center">
                        <label className="text-sm text-gray-600">{arvense.nombreCientifico}</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={getValor(codigo, `plato_agresiva_${arvense.id}_porcentaje`)}
                          onChange={(e) => setValor(codigo, `plato_agresiva_${arvense.id}_porcentaje`, e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                          placeholder="% cobertura"
                        />
                      </div>
                    ))}
                    {/* Otra especie agresiva */}
                    <div className="grid grid-cols-2 gap-2 items-center mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={getValor(codigo, 'plato_otra_especie_agresiva_nombre')}
                          onChange={(e) => setValor(codigo, 'plato_otra_especie_agresiva_nombre', e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                          placeholder="Otra especie (nombre)"
                        />
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={getValor(codigo, 'plato_otra_especie_agresiva_porcentaje')}
                        onChange={(e) => setValor(codigo, 'plato_otra_especie_agresiva_porcentaje', e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="% cobertura"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Evaluación en CALLE */}
            {zonaCalle && (
              <div className="mb-4 p-4 border rounded bg-gray-50">
                <h5 className="font-medium text-md text-gray-700 mb-3">Evaluación en Calle</h5>

                {/* Altura promedio */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura promedio de las arvenses monitoreadas
                  </label>
                  <div className="flex space-x-4">
                    {['Hasta 20cm', 'De 20 a 50 cm', 'Mayor 50cm'].map((opcion) => (
                      <label key={opcion} className="flex items-center">
                        <input
                          type="radio"
                          name={`${codigo}_calle_altura`}
                          value={opcion}
                          checked={alturaCalle === opcion}
                          onChange={(e) => handleAlturaChange(codigo, 'calle', e.target.value)}
                          className="mr-2"
                        />
                        {opcion}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Arvenses Nobles */}
                <div className="mb-4">
                  <h6 className="font-medium text-sm text-gray-700 mb-2">Arvenses Nobles y % de cobertura</h6>
                  <div className="space-y-2">
                    {ARVENSES_NOBLES.map((arvense) => (
                      <div key={arvense.id} className="grid grid-cols-2 gap-2 items-center">
                        <label className="text-sm text-gray-600">{arvense.nombreCientifico}</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={getValor(codigo, `calle_noble_${arvense.id}_porcentaje`)}
                          onChange={(e) => setValor(codigo, `calle_noble_${arvense.id}_porcentaje`, e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                          placeholder="% cobertura"
                        />
                      </div>
                    ))}
                    {/* Otra especie noble */}
                    <div className="grid grid-cols-2 gap-2 items-center mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={getValor(codigo, 'calle_otra_especie_noble_nombre')}
                          onChange={(e) => setValor(codigo, 'calle_otra_especie_noble_nombre', e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                          placeholder="Otra especie (nombre)"
                        />
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={getValor(codigo, 'calle_otra_especie_noble_porcentaje')}
                        onChange={(e) => setValor(codigo, 'calle_otra_especie_noble_porcentaje', e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="% cobertura"
                      />
                    </div>
                  </div>
                </div>

                {/* Arvenses Agresivas */}
                <div className="mb-4">
                  <h6 className="font-medium text-sm text-gray-700 mb-2">Arvenses Agresivas y % de cobertura</h6>
                  <div className="space-y-2">
                    {ARVENSES_AGRESIVAS.map((arvense) => (
                      <div key={arvense.id} className="grid grid-cols-2 gap-2 items-center">
                        <label className="text-sm text-gray-600">{arvense.nombreCientifico}</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={getValor(codigo, `calle_agresiva_${arvense.id}_porcentaje`)}
                          onChange={(e) => setValor(codigo, `calle_agresiva_${arvense.id}_porcentaje`, e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                          placeholder="% cobertura"
                        />
                      </div>
                    ))}
                    {/* Otra especie agresiva */}
                    <div className="grid grid-cols-2 gap-2 items-center mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={getValor(codigo, 'calle_otra_especie_agresiva_nombre')}
                          onChange={(e) => setValor(codigo, 'calle_otra_especie_agresiva_nombre', e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                          placeholder="Otra especie (nombre)"
                        />
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={getValor(codigo, 'calle_otra_especie_agresiva_porcentaje')}
                        onChange={(e) => setValor(codigo, 'calle_otra_especie_agresiva_porcentaje', e.target.value)}
                        className="border rounded px-2 py-1 w-full"
                        placeholder="% cobertura"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Separador entre puntos */}
            {index < plantas.length - 1 && (
              <hr className="my-6 border-t-2 border-gray-300" />
            )}
          </div>
        );
      })}

      {/* Nota metodológica adicional */}
      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700">
        <p className="font-medium mb-1">📝 Recordatorio metodológico:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Cada punto de monitoreo debe estar referenciado con el código del árbol más próximo</li>
          <li>En cada zona evaluada (plato y calle), clasifique la vegetación en arvenses nobles (baja capacidad competitiva) y arvenses agresivas (trepadoras, invasivas o altamente competitivas)</li>
          <li>Registre el porcentaje de cobertura para cada especie identificada</li>
        </ul>
      </div>
    </div>
  );
};