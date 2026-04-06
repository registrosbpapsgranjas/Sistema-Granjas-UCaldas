import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { type PlantaBase } from '../types';
import { toast } from 'react-toastify';

// ==================== INTERFACES ====================
interface ArvensesSectionProps {
  todasLasPlantas: PlantaBase[];
  metodoMuestreo: 'X' | 'W';
  surcos: number;
  plantasPorSurco: number;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

export interface ArvensesSectionRef {
  validate: () => boolean;
  getFiles: () => Map<string, File[]>;
}

// ==================== DATOS DE ARVENSES ====================
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

// ==================== COMPONENTES AUXILIARES ====================
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

// Componente de subida de fotos REAL – idéntico al usado en ArthropodSection
const RealFotosSection: React.FC<{
  prefix: string;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
  onFilesChange?: (prefix: string, files: File[]) => void;
}> = ({ prefix, caracterizacion, onCampoChange, onFilesChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 5;
  const MAX_SIZE_MB = 10;

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const selected = Array.from(e.target.files || []);
    if (selected.length + files.length > MAX_FILES) {
      setError(`Máximo ${MAX_FILES} fotos permitidas.`);
      return;
    }
    const oversized = selected.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`Algunos archivos superan el límite de ${MAX_SIZE_MB} MB.`);
      return;
    }

    const newPreviews = selected.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    const updatedFiles = [...files, ...selected];
    const updatedPreviews = [...previews, ...newPreviews];

    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    onCampoChange(prefix, updatedFiles.map((f) => f.name).join(','));
    if (onFilesChange) onFilesChange(prefix, updatedFiles);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    onCampoChange(prefix, updatedFiles.map((f) => f.name).join(','));
    if (onFilesChange) onFilesChange(prefix, updatedFiles);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="mt-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">Fotos de la otra especie observada</label>
      <p className="text-xs text-gray-500 mb-2">Sube hasta {MAX_FILES} fotos. Tamaño máximo {MAX_SIZE_MB} MB.</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-sm transition-colors"
      >
        Seleccionar fotos
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {previews.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {previews.map((preview, idx) => (
            <div key={idx} className="relative group w-24">
              <div className="w-24 h-24">
                <img src={preview.url} alt={preview.name} className="w-full h-full object-cover rounded border border-gray-300" />
              </div>
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow"
                title="Eliminar foto"
              >
                ×
              </button>
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
  errores?: Record<string, string>;
}> = ({ codigo, zona, tipo, arvense, getValor, setValor, onOpenImage, errores }) => {
  const fieldKey = `${zona}_${tipo}_${arvense.id}_porcentaje`;
  const errorKey = `${codigo}_${fieldKey}_error`;
  const value = getValor(codigo, fieldKey);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-2 items-center">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-sm text-gray-600">{arvense.nombreCientifico}</label>
        <button type="button" onClick={() => onOpenImage(arvense.image)} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">
          Ver imagen
        </button>
      </div>
      <div>
        <input
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValor(codigo, fieldKey, e.target.value)}
          className="border rounded px-2 py-1 w-full"
          placeholder="% cobertura"
        />
        {errores && errores[errorKey] && <p className="text-red-600 text-xs mt-1">{errores[errorKey]}</p>}
      </div>
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
  errores?: Record<string, string>;
  onFilesMap?: (prefix: string, files: File[]) => void;
}> = ({ codigo, zona, tipo, getValor, setValor, caracterizacion, onCampoChange, errores, onFilesMap }) => {
  const nombreKey = `${zona}_otra_especie_${tipo}_nombre`;
  const porcentajeKey = `${zona}_otra_especie_${tipo}_porcentaje`;
  const fotosKey = `arvenses_${codigo}_${zona}_otra_especie_${tipo}_fotos`;
  const nombre = getValor(codigo, nombreKey);
  const porcentaje = getValor(codigo, porcentajeKey);

  const handleNombreChange = (val: string) => setValor(codigo, nombreKey, val);
  const handlePorcentajeChange = (val: string) => setValor(codigo, porcentajeKey, val);
  const handleFilesChange = (prefix: string, files: File[]) => {
    if (onFilesMap) onFilesMap(prefix, files);
  };

  return (
    <div className="mt-2 p-3 bg-gray-100 rounded border">
      <p className="text-sm font-medium text-gray-700 mb-2">Otra especie {tipo === 'noble' ? 'noble' : 'agresiva'}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <input
            type="text"
            value={nombre}
            onChange={(e) => handleNombreChange(e.target.value)}
            className="border rounded px-2 py-1 w-full"
            placeholder="Otra especie (nombre)"
          />
          {errores && errores[`${codigo}_${nombreKey}_error`] && (
            <p className="text-red-600 text-xs mt-1">{errores[`${codigo}_${nombreKey}_error`]}</p>
          )}
        </div>
        <div>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={porcentaje}
            onChange={(e) => handlePorcentajeChange(e.target.value)}
            className="border rounded px-2 py-1 w-full"
            placeholder="% cobertura"
          />
          {errores && errores[`${codigo}_${porcentajeKey}_error`] && (
            <p className="text-red-600 text-xs mt-1">{errores[`${codigo}_${porcentajeKey}_error`]}</p>
          )}
        </div>
      </div>
      {nombre.trim() !== '' && (
        <RealFotosSection
          prefix={fotosKey}
          caracterizacion={caracterizacion}
          onCampoChange={onCampoChange}
          onFilesChange={handleFilesChange}
        />
      )}
      {/* Mostrar error de fotos si existe */}
      {errores && errores[`${codigo}_${fotosKey}_error`] && (
        <p className="text-red-600 text-xs mt-2">{errores[`${codigo}_${fotosKey}_error`]}</p>
      )}
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
export const ArvensesSection = forwardRef<ArvensesSectionRef, ArvensesSectionProps>(
  ({ todasLasPlantas, metodoMuestreo, surcos, plantasPorSurco, caracterizacion, onCampoChange }, ref) => {
    // Ajuste automático si el total de plantas supera 100
    if (surcos * plantasPorSurco > 100 && metodoMuestreo === 'X') {
      metodoMuestreo = 'W';
    }

    const [modalImage, setModalImage] = useState<string | null>(null);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const filesMapRef = useRef<Map<string, File[]>>(new Map());

    // Generar los 5 puntos de muestreo según el método
    const generarPuntos = (): { id: number; surco: number; planta: number; label: string }[] => {
      const puntos: { id: number; surco: number; planta: number; label: string }[] = [];
      const minSurco = 1;
      const maxSurco = surcos;
      const minPlanta = 1;
      const maxPlanta = plantasPorSurco;

      if (metodoMuestreo === 'X') {
        puntos.push({ id: 1, surco: minSurco, planta: minPlanta, label: 'Esquina superior izquierda' });
        puntos.push({ id: 2, surco: minSurco, planta: maxPlanta, label: 'Esquina superior derecha' });
        puntos.push({ id: 3, surco: maxSurco, planta: minPlanta, label: 'Esquina inferior izquierda' });
        puntos.push({ id: 4, surco: maxSurco, planta: maxPlanta, label: 'Esquina inferior derecha' });
        const centroSurco = Math.round((minSurco + maxSurco) / 2);
        const centroPlanta = Math.round((minPlanta + maxPlanta) / 2);
        puntos.push({ id: 5, surco: centroSurco, planta: centroPlanta, label: 'Centro' });
      } else {
        // W
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

    const obtenerArbolCercano = (surco: number, planta: number): PlantaBase | undefined => {
      let exacta = todasLasPlantas.find(p => p.surco === surco && p.planta === planta);
      if (exacta) return exacta;
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

    // Inicializar árbol de referencia
    puntosMuestreo.forEach((punto) => {
      const key = `arvenses_punto_${punto.id}_arbol_referencia`;
      if (!caracterizacion[key]) {
        const arbolCercano = obtenerArbolCercano(punto.surco, punto.planta);
        if (arbolCercano) onCampoChange(key, arbolCercano.codigo);
      }
    });

    const getValor = (puntoId: number, campo: string): string => caracterizacion[`arvenses_punto_${puntoId}_${campo}`] || '';
    const setValor = (puntoId: number, campo: string, valor: string) => {
      onCampoChange(`arvenses_punto_${puntoId}_${campo}`, valor);
      const errorKey = `arvenses_punto_${puntoId}_${campo}_error`;
      if (errores[errorKey]) {
        setErrores(prev => {
          const newErr = { ...prev };
          delete newErr[errorKey];
          return newErr;
        });
      }
    };

    const handleZonaMonitoreadaChange = (puntoId: number, zona: 'plato' | 'calle', checked: boolean) => {
      setValor(puntoId, `zona_monitoreada_${zona}`, checked ? zona : '');
      if (!checked) {
        const campos: string[] = [
          `${zona}_altura`,
          ...ARVENSES_NOBLES.map(a => `${zona}_noble_${a.id}_porcentaje`),
          ...ARVENSES_AGRESIVAS.map(a => `${zona}_agresiva_${a.id}_porcentaje`),
          `${zona}_otra_especie_noble_nombre`,
          `${zona}_otra_especie_noble_porcentaje`,
          `${zona}_otra_especie_agresiva_nombre`,
          `${zona}_otra_especie_agresiva_porcentaje`,
        ];
        campos.forEach(campo => setValor(puntoId, campo, ''));
        // Limpiar archivos asociados
        const prefixesToClear = [
          `arvenses_punto_${puntoId}_${zona}_otra_especie_noble_fotos`,
          `arvenses_punto_${puntoId}_${zona}_otra_especie_agresiva_fotos`,
        ];
        prefixesToClear.forEach(prefix => {
          if (filesMapRef.current.has(prefix)) filesMapRef.current.delete(prefix);
        });
      }
    };

    const handleAlturaChange = (puntoId: number, zona: 'plato' | 'calle', valor: string) => {
      setValor(puntoId, `${zona}_altura`, valor);
    };

    const registerFiles = (prefix: string, files: File[]) => {
      filesMapRef.current.set(prefix, files);
    };

    const renderZona = (puntoId: number, zona: 'plato' | 'calle', alturaActual: string) => {
      const titulo = zona === 'plato' ? 'Evaluación en Plato' : 'Evaluación en Calle';
      const errorCobertura = errores[`arvenses_punto_${puntoId}_${zona}_cobertura_error`];
      return (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h5 className="font-medium text-md text-gray-700 mb-3">{titulo}</h5>
          {errorCobertura && <p className="text-red-600 text-xs mb-2">{errorCobertura}</p>}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Altura promedio</label>
            <div className="flex gap-4">
              {['Hasta 20cm', 'De 20 a 50 cm', 'Mayor 50cm'].map(op => (
                <label key={op} className="flex items-center">
                  <input
                    type="radio"
                    name={`punto_${puntoId}_${zona}_altura`}
                    value={op}
                    checked={alturaActual === op}
                    onChange={(e) => handleAlturaChange(puntoId, zona, e.target.value)}
                    className="mr-2"
                  />
                  {op}
                </label>
              ))}
            </div>
            {errores[`arvenses_punto_${puntoId}_${zona}_altura_error`] && (
              <p className="text-red-600 text-xs mt-1">{errores[`arvenses_punto_${puntoId}_${zona}_altura_error`]}</p>
            )}
          </div>

          <div className="mb-5">
            <h6 className="font-medium text-sm text-gray-700 mb-2">Arvenses Nobles</h6>
            {ARVENSES_NOBLES.map(a => (
              <ArvenseRow
                key={`${puntoId}-${zona}-noble-${a.id}`}
                codigo={`punto_${puntoId}`}
                zona={zona}
                tipo="noble"
                arvense={a}
                getValor={(_, campo) => getValor(puntoId, campo)}
                setValor={(_, campo, val) => setValor(puntoId, campo, val)}
                onOpenImage={(img) => setModalImage(`/imgs/${img}`)}
                errores={errores}
              />
            ))}
            <OtraEspecieSection
              codigo={`punto_${puntoId}`}
              zona={zona}
              tipo="noble"
              getValor={(_, campo) => getValor(puntoId, campo)}
              setValor={(_, campo, val) => setValor(puntoId, campo, val)}
              caracterizacion={caracterizacion}
              onCampoChange={onCampoChange}
              errores={errores}
              onFilesMap={registerFiles}
            />
          </div>

          <div>
            <h6 className="font-medium text-sm text-gray-700 mb-2">Arvenses Agresivas</h6>
            {ARVENSES_AGRESIVAS.map(a => (
              <ArvenseRow
                key={`${puntoId}-${zona}-agresiva-${a.id}`}
                codigo={`punto_${puntoId}`}
                zona={zona}
                tipo="agresiva"
                arvense={a}
                getValor={(_, campo) => getValor(puntoId, campo)}
                setValor={(_, campo, val) => setValor(puntoId, campo, val)}
                onOpenImage={(img) => setModalImage(`/imgs/${img}`)}
                errores={errores}
              />
            ))}
            <OtraEspecieSection
              codigo={`punto_${puntoId}`}
              zona={zona}
              tipo="agresiva"
              getValor={(_, campo) => getValor(puntoId, campo)}
              setValor={(_, campo, val) => setValor(puntoId, campo, val)}
              caracterizacion={caracterizacion}
              onCampoChange={onCampoChange}
              errores={errores}
              onFilesMap={registerFiles}
            />
          </div>
        </div>
      );
    };

    const validate = (): boolean => {
      const nuevosErrores: Record<string, string> = {};
      let isValid = true;

      puntosMuestreo.forEach((punto) => {
        const puntoId = punto.id;
        const arbolRef = getValor(puntoId, 'arbol_referencia');
        if (!arbolRef) {
          nuevosErrores[`arvenses_punto_${puntoId}_arbol_referencia_error`] = `Seleccione un árbol de referencia.`;
          isValid = false;
        }

        const zonaPlato = getValor(puntoId, 'zona_monitoreada_plato') === 'plato';
        const zonaCalle = getValor(puntoId, 'zona_monitoreada_calle') === 'calle';
        if (!zonaPlato && !zonaCalle) {
          nuevosErrores[`arvenses_punto_${puntoId}_zona_monitoreada_error`] = `Seleccione al menos una zona.`;
          isValid = false;
        }

        // Función auxiliar para validar una zona específica
        const validarZona = (zona: 'plato' | 'calle') => {
          const altura = getValor(puntoId, `${zona}_altura`);
          if (!altura) {
            nuevosErrores[`arvenses_punto_${puntoId}_${zona}_altura_error`] = `Seleccione la altura promedio.`;
            isValid = false;
          }

          // Validación de cobertura: todos los campos deben tener un valor (puede ser 0)
          const coverageFields: string[] = [];
          ARVENSES_NOBLES.forEach(a => coverageFields.push(`${zona}_noble_${a.id}_porcentaje`));
          ARVENSES_AGRESIVAS.forEach(a => coverageFields.push(`${zona}_agresiva_${a.id}_porcentaje`));

          for (const field of coverageFields) {
            const val = getValor(puntoId, field);
            if (val === undefined || val === null || val.trim() === '') {
              nuevosErrores[`arvenses_punto_${puntoId}_${zona}_cobertura_error`] =
                `Debe llenar todos los campos de cobertura para las especies presentes. Si una especie no está presente, coloque 0.`;
              isValid = false;
              break;
            }
          }

          // Validación de "otra especie" noble
          const nobleNombre = getValor(puntoId, `${zona}_otra_especie_noble_nombre`);
          const noblePorc = getValor(puntoId, `${zona}_otra_especie_noble_porcentaje`);

          if (nobleNombre.trim() !== '') {
            if (!noblePorc || parseFloat(noblePorc) === 0) {
              nuevosErrores[`punto_${puntoId}_${zona}_otra_especie_noble_porcentaje_error`] = `Indique un porcentaje > 0.`;
              isValid = false;
            }
            const nobleFotosPrefix = `arvenses_punto_${puntoId}_${zona}_otra_especie_noble_fotos`;
            const nobleFiles = filesMapRef.current.get(nobleFotosPrefix) || [];
            if (nobleFiles.length === 0) {
              const errorKey = `punto_${puntoId}_${nobleFotosPrefix}_error`;
              nuevosErrores[errorKey] = `Debe subir al menos una foto de la especie noble.`;
              isValid = false;
            }
          } else if (noblePorc && parseFloat(noblePorc) > 0) {
            nuevosErrores[`punto_${puntoId}_${zona}_otra_especie_noble_nombre_error`] = `Indique el nombre.`;
            isValid = false;
          }

          // Validación de "otra especie" agresiva
          const agresivaNombre = getValor(puntoId, `${zona}_otra_especie_agresiva_nombre`);
          const agresivaPorc = getValor(puntoId, `${zona}_otra_especie_agresiva_porcentaje`);

          if (agresivaNombre.trim() !== '') {
            if (!agresivaPorc || parseFloat(agresivaPorc) === 0) {
              nuevosErrores[`punto_${puntoId}_${zona}_otra_especie_agresiva_porcentaje_error`] = `Indique un porcentaje > 0.`;
              isValid = false;
            }
            const agresivaFotosPrefix = `arvenses_punto_${puntoId}_${zona}_otra_especie_agresiva_fotos`;
            const agresivaFiles = filesMapRef.current.get(agresivaFotosPrefix) || [];
            if (agresivaFiles.length === 0) {
              const errorKey = `punto_${puntoId}_${agresivaFotosPrefix}_error`;
              nuevosErrores[errorKey] = `Debe subir al menos una foto de la especie agresiva.`;
              isValid = false;
            }
          } else if (agresivaPorc && parseFloat(agresivaPorc) > 0) {
            nuevosErrores[`punto_${puntoId}_${zona}_otra_especie_agresiva_nombre_error`] = `Indique el nombre.`;
            isValid = false;
          }
        };

        // Ejecutar la validación solo para las zonas que fueron seleccionadas
        if (zonaPlato) validarZona('plato');
        if (zonaCalle) validarZona('calle');
      });

      setErrores(nuevosErrores);
      if (!isValid) toast.error('Complete los campos obligatorios en arvenses (incluyendo fotos para otras especies).');
      return isValid;
    };

    const getFiles = (): Map<string, File[]> => filesMapRef.current;

    useImperativeHandle(ref, () => ({ validate, getFiles }));

    const arbolesDisponibles = todasLasPlantas.map(p => ({ codigo: p.codigo, label: p.label }));

    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Monitoreo de Arvenses</h2>
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
          <p className="text-sm text-gray-700"><span className="font-bold">Metodología:</span> Muestreo en {metodoMuestreo}.</p>
          <p className="text-sm text-gray-700 mt-2">En cada punto se estima visualmente el % de cobertura en <strong>platos</strong> y <strong>calles</strong>.</p>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-4">Puntos de Monitoreo (Método {metodoMuestreo})</h3>

        {puntosMuestreo.map((punto) => {
          const puntoId = punto.id;
          const arbolSeleccionado = getValor(puntoId, 'arbol_referencia');
          const zonaPlato = getValor(puntoId, 'zona_monitoreada_plato') === 'plato';
          const zonaCalle = getValor(puntoId, 'zona_monitoreada_calle') === 'calle';
          const alturaPlato = getValor(puntoId, 'plato_altura');
          const alturaCalle = getValor(puntoId, 'calle_altura');

          return (
            <div key={puntoId} className="border rounded-lg p-4 mb-8 bg-white shadow-sm">
              <h4 className="font-semibold text-lg text-gray-800 mb-2">Punto {puntoId} - {punto.label}</h4>
              <p className="text-sm text-gray-500 mb-3">Coordenadas sugeridas: Surco {punto.surco}, Planta {punto.planta}</p>

              <div className="mb-4 p-3 bg-gray-100 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-2">Árbol de referencia *</label>
                {errores[`arvenses_punto_${puntoId}_arbol_referencia_error`] && (
                  <p className="text-red-600 text-xs mb-2">{errores[`arvenses_punto_${puntoId}_arbol_referencia_error`]}</p>
                )}
                <select
                  value={arbolSeleccionado}
                  onChange={(e) => setValor(puntoId, 'arbol_referencia', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Seleccione --</option>
                  {arbolesDisponibles.map(a => <option key={a.codigo} value={a.codigo}>{a.label} ({a.codigo})</option>)}
                </select>
              </div>

              <div className="mb-4 p-3 bg-gray-100 rounded">
                <label className="block text-sm font-medium text-gray-700 mb-2">Zonas monitoreadas *</label>
                {errores[`arvenses_punto_${puntoId}_zona_monitoreada_error`] && (
                  <p className="text-red-600 text-xs mb-2">{errores[`arvenses_punto_${puntoId}_zona_monitoreada_error`]}</p>
                )}
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={zonaPlato}
                      onChange={(e) => handleZonaMonitoreadaChange(puntoId, 'plato', e.target.checked)}
                      className="mr-2"
                    /> Platos
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={zonaCalle}
                      onChange={(e) => handleZonaMonitoreadaChange(puntoId, 'calle', e.target.checked)}
                      className="mr-2"
                    /> Calles
                  </label>
                </div>
              </div>

              {zonaPlato && renderZona(puntoId, 'plato', alturaPlato)}
              {zonaCalle && renderZona(puntoId, 'calle', alturaCalle)}
            </div>
          );
        })}

        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700">
          <p className="font-medium mb-1">📝 Nota:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Muestreo en {metodoMuestreo} con 5 puntos.</li>
            <li>Debe registrarse al menos un % de cobertura &gt;0 por zona seleccionada.</li>
            <li>Si se ingresa "otra especie", deben completarse nombre, porcentaje y <strong>subir al menos una foto</strong>.</li>
          </ul>
        </div>

        <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
      </div>
    );
  }
);