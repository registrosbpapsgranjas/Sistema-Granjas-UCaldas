import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { PlantaBase } from '../types';
import { toast } from 'react-toastify';

interface ArvensesSectionProps {
  plantas: PlantaBase[];
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

export interface ArvensesSectionRef {
  validate: () => boolean;
}

interface ArvenseItem {
  id: string;
  nombre: string;
  nombreCientifico: React.ReactNode;
  image: string;
}

type ZonaType = 'plato' | 'calle';
type TipoArvense = 'noble' | 'agresiva';

const ARVENSES_NOBLES: ArvenseItem[] = [
  { id: 'hyptis_atrorubens', nombre: 'Hyptis atrorubens', nombreCientifico: <em>Hyptis atrorubens</em>, image: 'hyptis_atrorubens.png' },
  { id: 'spermacoce_alata', nombre: 'Spermacoce alata', nombreCientifico: <em>Spermacoce alata</em>, image: 'spermacoce_alata.png' },
  { id: 'drymaria_cordata', nombre: 'Drymaria cordata', nombreCientifico: <em>Drymaria cordata</em>, image: 'drymaria_cordata.png' },
  { id: 'grona_adscendens', nombre: 'Grona adscendens', nombreCientifico: <><em>Grona adscendens</em> (antes <em>Desmodium ovalifolium</em>)</>, image: 'grona_adscendens.png' },
  { id: 'synedrella_nodiflora', nombre: 'Synedrella nodiflora', nombreCientifico: <em>Synedrella nodiflora</em>, image: 'synedrella_nodiflora.png' },
  { id: 'arachis_pintoi', nombre: 'Arachis pintoi', nombreCientifico: <em>Arachis pintoi</em>, image: 'arachis_pintoi.png' },
  { id: 'dichondra_repens', nombre: 'Dichondra repens', nombreCientifico: <em>Dichondra repens</em>, image: 'dichondra_repens.png' },
  { id: 'euphorbia_hirta', nombre: 'Euphorbia hirta', nombreCientifico: <em>Euphorbia hirta</em>, image: 'euphorbia_hirta.png' },
  { id: 'pseudoelephantopus_spicatus', nombre: 'Pseudoelephantopus spicatus', nombreCientifico: <em>Pseudoelephantopus spicatus</em>, image: 'pseudoelephantopus_spicatus.png' },
];

const ARVENSES_AGRESIVAS: ArvenseItem[] = [
  { id: 'setaria_palmifolia', nombre: 'Setaria palmifolia', nombreCientifico: <em>Setaria palmifolia</em>, image: 'setaria_palmifolia.png' },
  { id: 'oxalis_latifolia', nombre: 'Oxalis latifolia', nombreCientifico: <em>Oxalis latifolia</em>, image: 'oxalis_latifolia.png' },
  { id: 'paspalum_dilatatum', nombre: 'Paspalum dilatatum', nombreCientifico: <em>Paspalum dilatatum</em>, image: 'paspalum_dilatatum.png' },
  { id: 'sorghum_halepense', nombre: 'Sorghum halepense', nombreCientifico: <em>Sorghum halepense</em>, image: 'sorghum_halepense.png' },
  { id: 'digitaria_sanguinalis', nombre: 'Digitaria sanguinalis', nombreCientifico: <em>Digitaria sanguinalis</em>, image: 'digitaria_sanguinalis.png' },
  { id: 'cyperus_brevifolius', nombre: 'Cyperus brevifolius', nombreCientifico: <em>Cyperus brevifolius</em>, image: 'cyperus_brevifolius.png' },
  { id: 'bidens_pilosa', nombre: 'Bidens pilosa', nombreCientifico: <em>Bidens pilosa</em>, image: 'bidens_pilosa.png' },
  { id: 'drymaria_cordata_agresiva', nombre: 'Drymaria cordata', nombreCientifico: <em>Drymaria cordata</em>, image: 'drymaria_cordata_agresiva.png' },
  { id: 'solanum_americanum', nombre: 'Solanum americanum', nombreCientifico: <em>Solanum americanum</em>, image: 'solanum_americanum.png' },
  { id: 'talinum_paniculatum', nombre: 'Talinum paniculatum', nombreCientifico: <em>Talinum paniculatum</em>, image: 'talinum_paniculatum.png' },
];

const ImageModal: React.FC<{ imageUrl: string | null; onClose: () => void }> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-4 rounded-lg max-w-lg max-h-full overflow-auto" onClick={(e) => e.stopPropagation()}>
        <button className="float-right text-gray-600 hover:text-gray-900 text-xl font-bold" onClick={onClose} type="button">×</button>
        <img src={imageUrl} alt="Vista previa" className="max-w-full h-auto" />
      </div>
    </div>
  );
};

const RealFotosSection: React.FC<{
  prefix: string;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}> = ({ prefix, caracterizacion, onCampoChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 5;
  const MAX_SIZE_MB = 10;

  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = Array.from(e.target.files || []);
    if (files.length > MAX_FILES) { setError(`Máximo ${MAX_FILES} fotos permitidas.`); return; }
    const oversized = files.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) { setError(`Algunos archivos superan el límite de ${MAX_SIZE_MB} MB.`); return; }
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    const newPreviews = files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setPreviews(newPreviews);
    onCampoChange(prefix, files.map((f) => f.name).join(','));
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onCampoChange(prefix, updated.map((p) => p.name).join(','));
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="mt-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">Fotos de la otra especie observada</label>
      <p className="text-xs text-gray-500 mb-2">Sube hasta {MAX_FILES} fotos desde tu galería. Tamaño máximo por archivo: {MAX_SIZE_MB} MB.</p>
      <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-sm transition-colors">Seleccionar fotos</button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {previews.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {previews.map((preview, idx) => (
            <div key={idx} className="relative group w-24">
              <div className="w-24 h-24"><img src={preview.url} alt={preview.name} className="w-full h-full object-cover rounded border border-gray-300" /></div>
              <button type="button" onClick={() => removePhoto(idx)} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow" title="Eliminar foto">×</button>
              <p className="text-xs text-gray-500 truncate mt-1 max-w-[6rem]">{preview.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ArvenseRow: React.FC<{
  codigo: string;
  zona: ZonaType;
  tipo: TipoArvense;
  arvense: ArvenseItem;
  getValor: (codigo: string, campo: string) => string;
  setValor: (codigo: string, campo: string, valor: string) => void;
  onOpenImage: (imageName: string) => void;
}> = ({ codigo, zona, tipo, arvense, getValor, setValor, onOpenImage }) => {
  const fieldKey = `${zona}_${tipo}_${arvense.id}_porcentaje`;
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-2 items-center">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-sm text-gray-600">{arvense.nombreCientifico}</label>
        <button type="button" onClick={() => onOpenImage(arvense.image)} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">Ver imagen</button>
      </div>
      <input type="number" step="0.1" min="0" max="100" value={getValor(codigo, fieldKey)} onChange={(e) => setValor(codigo, fieldKey, e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="% cobertura" />
    </div>
  );
};

const OtraEspecieSection: React.FC<{
  codigo: string;
  zona: ZonaType;
  tipo: TipoArvense;
  getValor: (codigo: string, campo: string) => string;
  setValor: (codigo: string, campo: string, valor: string) => void;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}> = ({ codigo, zona, tipo, getValor, setValor, caracterizacion, onCampoChange }) => {
  const nombreKey = `${zona}_otra_especie_${tipo}_nombre`;
  const porcentajeKey = `${zona}_otra_especie_${tipo}_porcentaje`;
  const fotosKey = `arvenses_${codigo}_${zona}_otra_especie_${tipo}_fotos`;
  const nombre = getValor(codigo, nombreKey);

  return (
    <div className="mt-2 p-3 bg-gray-100 rounded border">
      <p className="text-sm font-medium text-gray-700 mb-2">Otra especie {tipo === 'noble' ? 'noble' : 'agresiva'}</p>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-2 items-center">
        <input type="text" value={nombre} onChange={(e) => setValor(codigo, nombreKey, e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="Otra especie (nombre)" />
        <input type="number" step="0.1" min="0" max="100" value={getValor(codigo, porcentajeKey)} onChange={(e) => setValor(codigo, porcentajeKey, e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="% cobertura" />
      </div>
      {nombre.trim() !== '' && <RealFotosSection prefix={fotosKey} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />}
    </div>
  );
};

export const ArvensesSection = forwardRef<ArvensesSectionRef, ArvensesSectionProps>(
  ({ plantas, caracterizacion, onCampoChange }, ref) => {
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [errores, setErrores] = useState<Record<string, string>>({});

    const handleChange = (clave: string, valor: string | number | boolean) => {
      onCampoChange(clave, String(valor));
    };

    const getValor = (codigo: string, campo: string): string => {
      return caracterizacion[`arvenses_${codigo}_${campo}`] || '';
    };

    const setValor = (codigo: string, campo: string, valor: string) => {
      handleChange(`arvenses_${codigo}_${campo}`, valor);
    };

    const handleAlturaChange = (codigo: string, zona: ZonaType, valor: string) => {
      setValor(codigo, `${zona}_altura`, valor);
    };

    const handleZonaMonitoreadaChange = (codigo: string, zona: ZonaType, checked: boolean) => {
      setValor(codigo, `zona_monitoreada_${zona}`, checked ? zona : '');
      if (!checked) {
        const campos: string[] = [
          `${zona}_cobertura_nobles`,
          `${zona}_cobertura_agresivas`,
          `${zona}_altura`,
        ];
        ARVENSES_NOBLES.forEach((arvense) => campos.push(`${zona}_noble_${arvense.id}_porcentaje`));
        ARVENSES_AGRESIVAS.forEach((arvense) => campos.push(`${zona}_agresiva_${arvense.id}_porcentaje`));
        campos.push(`${zona}_otra_especie_noble_nombre`, `${zona}_otra_especie_noble_porcentaje`, `${zona}_otra_especie_noble_fotos`);
        campos.push(`${zona}_otra_especie_agresiva_nombre`, `${zona}_otra_especie_agresiva_porcentaje`, `${zona}_otra_especie_agresiva_fotos`);
        campos.forEach((campo) => setValor(codigo, campo, ''));
      }
    };

    const validate = (): boolean => {
      const nuevosErrores: Record<string, string> = {};
      let isValid = true;

      plantas.forEach((planta, idx) => {
        const codigo = planta.codigo;
        const puntoNumero = idx + 1;
        const puntoLabel = `${planta.label} (Código: ${codigo})`;

        // Verificar que se haya seleccionado al menos una zona (plato o calle)
        const zonaPlato = getValor(codigo, 'zona_monitoreada_plato') === 'plato';
        const zonaCalle = getValor(codigo, 'zona_monitoreada_calle') === 'calle';

        if (!zonaPlato && !zonaCalle) {
          const errorKey = `arvenses_${codigo}_sin_zona`;
          nuevosErrores[errorKey] = `En el punto ${puntoNumero} (${puntoLabel}) debe seleccionar al menos una zona para monitoreo (Plato y/o Calle).`;
          isValid = false;
        }

        // Validación por zona (si está seleccionada)
        if (zonaPlato) {
          let hayAlgunValor = false;
          // Nobles
          for (const arvense of ARVENSES_NOBLES) {
            const val = getValor(codigo, `plato_noble_${arvense.id}_porcentaje`);
            if (val && parseFloat(val) > 0) {
              hayAlgunValor = true;
              break;
            }
          }
          // Agresivas
          if (!hayAlgunValor) {
            for (const arvense of ARVENSES_AGRESIVAS) {
              const val = getValor(codigo, `plato_agresiva_${arvense.id}_porcentaje`);
              if (val && parseFloat(val) > 0) {
                hayAlgunValor = true;
                break;
              }
            }
          }
          // Otra especie noble
          if (!hayAlgunValor) {
            const nobleNombre = getValor(codigo, 'plato_otra_especie_noble_nombre');
            const noblePorc = getValor(codigo, 'plato_otra_especie_noble_porcentaje');
            if (nobleNombre.trim() !== '' && noblePorc && parseFloat(noblePorc) > 0) hayAlgunValor = true;
          }
          // Otra especie agresiva
          if (!hayAlgunValor) {
            const agresivaNombre = getValor(codigo, 'plato_otra_especie_agresiva_nombre');
            const agresivaPorc = getValor(codigo, 'plato_otra_especie_agresiva_porcentaje');
            if (agresivaNombre.trim() !== '' && agresivaPorc && parseFloat(agresivaPorc) > 0) hayAlgunValor = true;
          }

          if (!hayAlgunValor) {
            const errorKey = `arvenses_${codigo}_plato_sin_cobertura`;
            nuevosErrores[errorKey] = `En el punto ${puntoNumero} (${puntoLabel}), en la zona "Plato" debe registrar al menos un porcentaje de cobertura positivo o una "otra especie" con nombre y porcentaje.`;
            isValid = false;
          }
        }

        if (zonaCalle) {
          let hayAlgunValor = false;
          // Nobles
          for (const arvense of ARVENSES_NOBLES) {
            const val = getValor(codigo, `calle_noble_${arvense.id}_porcentaje`);
            if (val && parseFloat(val) > 0) {
              hayAlgunValor = true;
              break;
            }
          }
          // Agresivas
          if (!hayAlgunValor) {
            for (const arvense of ARVENSES_AGRESIVAS) {
              const val = getValor(codigo, `calle_agresiva_${arvense.id}_porcentaje`);
              if (val && parseFloat(val) > 0) {
                hayAlgunValor = true;
                break;
              }
            }
          }
          // Otra especie noble
          if (!hayAlgunValor) {
            const nobleNombre = getValor(codigo, 'calle_otra_especie_noble_nombre');
            const noblePorc = getValor(codigo, 'calle_otra_especie_noble_porcentaje');
            if (nobleNombre.trim() !== '' && noblePorc && parseFloat(noblePorc) > 0) hayAlgunValor = true;
          }
          // Otra especie agresiva
          if (!hayAlgunValor) {
            const agresivaNombre = getValor(codigo, 'calle_otra_especie_agresiva_nombre');
            const agresivaPorc = getValor(codigo, 'calle_otra_especie_agresiva_porcentaje');
            if (agresivaNombre.trim() !== '' && agresivaPorc && parseFloat(agresivaPorc) > 0) hayAlgunValor = true;
          }

          if (!hayAlgunValor) {
            const errorKey = `arvenses_${codigo}_calle_sin_cobertura`;
            nuevosErrores[errorKey] = `En el punto ${puntoNumero} (${puntoLabel}), en la zona "Calle" debe registrar al menos un porcentaje de cobertura positivo o una "otra especie" con nombre y porcentaje.`;
            isValid = false;
          }
        }
      });

      setErrores(nuevosErrores);
      if (!isValid) {
        toast.error('Por favor complete los campos obligatorios: seleccione al menos una zona por punto y registre al menos un porcentaje de cobertura en cada zona seleccionada.');
      }
      return isValid;
    };

    useImperativeHandle(ref, () => ({ validate }));

    const renderZona = (codigo: string, zona: ZonaType, alturaActual: string, onOpenImage: (imageName: string) => void) => {
      const titulo = zona === 'plato' ? 'Evaluación en Plato' : 'Evaluación en Calle';
      const errorKey = `arvenses_${codigo}_${zona}_sin_cobertura`;
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
                  <input type="radio" name={`${codigo}_${zona}_altura`} value={opcion} checked={alturaActual === opcion} onChange={(e) => handleAlturaChange(codigo, zona, e.target.value)} className="mr-2" />
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
                <ArvenseRow key={`${codigo}-${zona}-noble-${arvense.id}`} codigo={codigo} zona={zona} tipo="noble" arvense={arvense} getValor={getValor} setValor={setValor} onOpenImage={onOpenImage} />
              ))}
              <OtraEspecieSection codigo={codigo} zona={zona} tipo="noble" getValor={getValor} setValor={setValor} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
            </div>
          </div>

          {/* Arvenses Agresivas */}
          <div className="mb-2">
            <h6 className="font-medium text-sm text-gray-700 mb-2">Arvenses Agresivas y % de cobertura</h6>
            <p className="text-xs text-gray-500 mb-2">(Si no hay presencia de arvenses agresivas, coloque 0 en el porcentaje de cobertura)</p>
            <div className="space-y-2">
              {ARVENSES_AGRESIVAS.map((arvense) => (
                <ArvenseRow key={`${codigo}-${zona}-agresiva-${arvense.id}`} codigo={codigo} zona={zona} tipo="agresiva" arvense={arvense} getValor={getValor} setValor={setValor} onOpenImage={onOpenImage} />
              ))}
              <OtraEspecieSection codigo={codigo} zona={zona} tipo="agresiva" getValor={getValor} setValor={setValor} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
            </div>
          </div>
        </div>
      );
    };

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

        <h3 className="text-xl font-bold text-gray-800 mb-4">Puntos de Monitoreo</h3>
        <p className="text-sm text-gray-600 mb-6">Se han generado {plantas.length} puntos de monitoreo. Cada punto debe ser referenciado con el código del árbol más próximo.</p>

        {plantas.map((planta, index) => {
          const codigo = planta.codigo;
          const puntoNumero = index + 1;
          const zonaPlato = getValor(codigo, 'zona_monitoreada_plato') === 'plato';
          const zonaCalle = getValor(codigo, 'zona_monitoreada_calle') === 'calle';
          const alturaPlato = getValor(codigo, 'plato_altura');
          const alturaCalle = getValor(codigo, 'calle_altura');

          // Error si no se seleccionó ninguna zona
          const sinZonaError = errores[`arvenses_${codigo}_sin_zona`];

          return (
            <div key={codigo} className="border rounded-lg p-4 mb-8 bg-white shadow-sm">
              <h4 className="font-semibold text-lg text-gray-800 mb-2">Punto de Monitoreo {puntoNumero} (Árbol de referencia: {planta.label} - Código: {codigo})</h4>

              <div className="mb-4 p-3 bg-gray-100 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-2">¿En qué zonas se realizó el monitoreo?</label>
                {sinZonaError && <p className="text-red-600 text-xs mb-2">{sinZonaError}</p>}
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input type="checkbox" checked={zonaPlato} onChange={(e) => handleZonaMonitoreadaChange(codigo, 'plato', e.target.checked)} className="mr-2" />
                    Platos
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" checked={zonaCalle} onChange={(e) => handleZonaMonitoreadaChange(codigo, 'calle', e.target.checked)} className="mr-2" />
                    Calles
                  </label>
                </div>
              </div>

              {zonaPlato && renderZona(codigo, 'plato', alturaPlato, (imageName) => setModalImage(`/imgs/${imageName}`))}
              {zonaCalle && renderZona(codigo, 'calle', alturaCalle, (imageName) => setModalImage(`/imgs/${imageName}`))}

              {index < plantas.length - 1 && <hr className="my-6 border-t-2 border-gray-300" />}
            </div>
          );
        })}

        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700">
          <p className="font-medium mb-1">📝 Recordatorio metodológico:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Cada punto de monitoreo debe estar referenciado con el código del árbol más próximo</li>
            <li>En cada zona evaluada (plato y calle), clasifique la vegetación en arvenses nobles (baja capacidad competitiva) y arvenses agresivas (trepadoras, invasivas o altamente competitivas)</li>
            <li>Registre el porcentaje de cobertura para cada especie identificada</li>
          </ul>
        </div>

        <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
      </div>
    );
  }
);