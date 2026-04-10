import React, { useEffect, useRef, useState } from 'react';
import { PlantaBase } from '../../types/diagnosticoTypes';

interface ControladoresSectionProps {
  plantas: PlantaBase[];
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

const safeParseArray = (value?: string): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const ImageModal: React.FC<{
  imageUrl: string | null;
  onClose: () => void;
}> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded-lg max-w-2xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="float-right text-gray-600 hover:text-gray-900 text-xl font-bold"
          onClick={onClose}
        >
          ×
        </button>
        <img src={imageUrl} alt="Vista previa" className="max-w-full h-auto rounded" />
      </div>
    </div>
  );
};

const RealFotosSection: React.FC<{
  prefix: string;
  onCampoChange: (campo: string, valor: string) => void;
  label?: string;
  disabled?: boolean;
  onOpenImage?: (url: string) => void;
}> = ({
  prefix,
  onCampoChange,
  label = 'Imágenes tomadas en campo',
  disabled = false,
  onOpenImage,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 5;
  const MAX_SIZE_MB = 10;

  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = Array.from(e.target.files || []);

    if (files.length > MAX_FILES) {
      setError(`Máximo ${MAX_FILES} fotos permitidas.`);
      return;
    }

    const oversized = files.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`Algunos archivos superan el límite de ${MAX_SIZE_MB} MB.`);
      return;
    }

    previews.forEach((p) => URL.revokeObjectURL(p.url));

    const newPreviews = files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }));

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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <p className="text-xs text-gray-500 mb-2">
        Sube hasta {MAX_FILES} fotos. Tamaño máximo por archivo: {MAX_SIZE_MB} MB.
      </p>

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded shadow-sm transition-colors ${
          disabled
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        Seleccionar fotos
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {previews.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {previews.map((preview, idx) => (
            <div key={idx} className="relative group w-24">
              <button
                type="button"
                className="w-24 h-24 block"
                onClick={() => onOpenImage?.(preview.url)}
              >
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="w-full h-full object-cover rounded border border-gray-300"
                />
              </button>

              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow"
                title="Eliminar foto"
              >
                ×
              </button>

              <p className="text-xs text-gray-500 truncate mt-1 max-w-[6rem]">
                {preview.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const IMAGES: Record<string, string> = {
  'Coccinélidos': '/imgs/coccinelidos.png',
  'Crisopas': '/imgs/crisopas.png',
  'Avispas parasitoides': '/imgs/avispas_parasitoides.png',
  'Tamarixia radiata': '/imgs/tamarixia_radiata.png',
  'Fidiobia sp.': '/imgs/fidiobia_sp.png',

  'Beauveria': '/imgs/beauveria.png',
  'Lecanicillium': '/imgs/lecanicillium.png',
  'Metarhizium': '/imgs/metarhizium.png',
  'Bacillus': '/imgs/bacillus.png',

  'Huevos de artrópodos benéficos': '/imgs/huevos_artropodos_beneficos.png',
  'Larvas depredando': '/imgs/larvas_depredando.png',
  'Plagas parasitadas': '/imgs/plagas_parasitadas.png',
  'Micelio en insectos': '/imgs/micelio_en_insectos.png',
  'Insectos benéficos en estados inmaduros': '/imgs/insectos_beneficos_inmaduros.png',
  'Insectos benéficos adultos': '/imgs/insectos_beneficos_adultos.png',
};

export const ControladoresSection: React.FC<ControladoresSectionProps> = ({
  plantas,
  caracterizacion,
  onCampoChange,
}) => {
  const prefix = 'controladores';
  const [modalImage, setModalImage] = useState<string | null>(null);
  const initialized = useRef<Set<string>>(new Set());

  const handleChange = (clave: string, valor: string | boolean) => {
    onCampoChange(clave, String(valor));
  };

  const handleGrupoChange = (
    baseKey: string,
    campo: string,
    opcion: string,
    checked: boolean,
    opcionNinguno: string
  ) => {
    const key = `${baseKey}_${campo}`;
    const current = safeParseArray(caracterizacion[key]);

    let nuevos: string[];

    if (opcion === opcionNinguno) {
      if (checked) {
        nuevos = [opcionNinguno];
        handleChange(`${baseKey}_${campo}_otro`, '');
        handleChange(`${baseKey}_${campo}_otro_fotos`, '');
      } else {
        nuevos = [];
      }
    } else {
      if (checked) {
        nuevos = current.filter((o) => o !== opcionNinguno);
        if (!nuevos.includes(opcion)) nuevos.push(opcion);
      } else {
        nuevos = current.filter((o) => o !== opcion);
      }

      if (opcion === 'Otro' && !checked) {
        handleChange(`${baseKey}_${campo}_otro`, '');
        handleChange(`${baseKey}_${campo}_otro_fotos`, '');
      }
    }

    handleChange(key, JSON.stringify(nuevos));
  };

  const handleOtroChange = (
    baseKey: string,
    campo: string,
    valor: string,
    opcionNinguno: string
  ) => {
    const key = `${baseKey}_${campo}`;
    const current = safeParseArray(caracterizacion[key]);

    if (current.includes(opcionNinguno)) return;

    handleChange(`${baseKey}_${campo}_otro`, valor);

    if (!valor.trim()) {
      handleChange(`${baseKey}_${campo}_otro_fotos`, '');
    }
  };

  const getNoAplica = (codigo: string): boolean => {
    return caracterizacion[`${prefix}_${codigo}_noAplica`] === 'true';
  };

  const handleNoAplicaChange = (codigo: string, checked: boolean) => {
    handleChange(`${prefix}_${codigo}_noAplica`, checked);

    if (checked) {
      [
        'insectos',
        'insectos_otro',
        'insectos_otro_fotos',
        'microbianos',
        'microbianos_otro',
        'microbianos_otro_fotos',
        'evidencias',
        'evidencias_otro',
        'evidencias_otro_fotos',
        'nivel',
      ].forEach((campo) => {
        handleChange(`${prefix}_${codigo}_${campo}`, '');
      });
    }
  };

  // Inicialización: para cada planta y cada grupo, si no hay valor seleccionado,
  // se establece por defecto ["No se observaron"].
  useEffect(() => {
    plantas.forEach((planta) => {
      const codigo = planta.codigo;
      const baseKey = `${prefix}_${codigo}`;

      // Grupos: insectos, microbianos, evidencias
      const grupos = [
        { key: `${baseKey}_insectos`, ninguno: 'No se observaron' },
        { key: `${baseKey}_microbianos`, ninguno: 'No se observaron' },
        { key: `${baseKey}_evidencias`, ninguno: 'No se observaron evidencias' },
      ];

      grupos.forEach((grupo) => {
        const current = safeParseArray(caracterizacion[grupo.key]);
        // Si no hay nada seleccionado (array vacío) y aún no se ha inicializado este grupo
        if (current.length === 0 && !initialized.current.has(grupo.key)) {
          initialized.current.add(grupo.key);
          handleChange(grupo.key, JSON.stringify([grupo.ninguno]));
        }
      });
    });
  }, [plantas, caracterizacion, handleChange]);

  const insectosOpciones = [
    'Coccinélidos',
    'Crisopas',
    'Avispas parasitoides',
    'Tamarixia radiata',
    'Fidiobia sp.',
    'No se observaron',
    'Otro',
  ];

  const microbianosOpciones = [
    'Beauveria',
    'Lecanicillium',
    'Metarhizium',
    'Bacillus',
    'No se observaron',
    'Otro',
  ];

  const evidenciasOpciones = [
    'Huevos de artrópodos benéficos',
    'Larvas depredando',
    'Plagas parasitadas',
    'Micelio en insectos',
    'Insectos benéficos en estados inmaduros',
    'Insectos benéficos adultos',
    'No se observaron evidencias',
    'Otro',
  ];

  const opcionNingunoInsectos = 'No se observaron';
  const opcionNingunoMicrobianos = 'No se observaron';
  const opcionNingunoEvidencias = 'No se observaron evidencias';

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Monitoreo de Controladores Biológicos
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Por cada planta, revise 4 brotes por punto cardinal (16 brotes en total). Registre la
        presencia de controladores biológicos.
      </p>

      {plantas.map((planta) => {
        const codigo = planta.codigo;
        const noAplica = getNoAplica(codigo);
        const baseKey = `${prefix}_${codigo}`;

        const insectos = safeParseArray(caracterizacion[`${baseKey}_insectos`]);
        const microbianos = safeParseArray(caracterizacion[`${baseKey}_microbianos`]);
        const evidencias = safeParseArray(caracterizacion[`${baseKey}_evidencias`]);
        const nivel = caracterizacion[`${baseKey}_nivel`] || '';

        const tieneNingunoInsectos = insectos.includes(opcionNingunoInsectos);
        const tieneNingunoMicrobianos = microbianos.includes(opcionNingunoMicrobianos);
        const tieneNingunoEvidencias = evidencias.includes(opcionNingunoEvidencias);

        const tieneOtroInsectos = insectos.includes('Otro');
        const tieneOtroMicrobianos = microbianos.includes('Otro');
        const tieneOtroEvidencias = evidencias.includes('Otro');

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
                No aplica (sin presencia)
              </label>
            </div>

            {!noAplica && (
              <div className="space-y-4">
                {/* Insectos benéficos */}
                <div className="border p-3 rounded bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insectos benéficos observados *
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {insectosOpciones.map((opcion) => (
                      <div key={opcion} className="flex items-center gap-2">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={insectos.includes(opcion)}
                            onChange={(e) =>
                              handleGrupoChange(
                                baseKey,
                                'insectos',
                                opcion,
                                e.target.checked,
                                opcionNingunoInsectos
                              )
                            }
                            className="mr-2"
                          />
                          {opcion}
                        </label>

                        {IMAGES[opcion] && (
                          <button
                            type="button"
                            onClick={() => setModalImage(IMAGES[opcion])}
                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                          >
                            Ver imagen
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {tieneOtroInsectos && (
                    <div className="mt-3">
                      <label className="block text-sm text-gray-600 mb-1">Otro (especifique)</label>
                      <input
                        type="text"
                        value={caracterizacion[`${baseKey}_insectos_otro`] || ''}
                        onChange={(e) =>
                          handleOtroChange(
                            baseKey,
                            'insectos',
                            e.target.value,
                            opcionNingunoInsectos
                          )
                        }
                        disabled={tieneNingunoInsectos}
                        className={`border rounded px-2 py-1 w-full text-sm ${
                          tieneNingunoInsectos ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        placeholder="Otro insecto benéfico"
                      />

                      <RealFotosSection
                        prefix={`${baseKey}_insectos_otro_fotos`}
                        onCampoChange={onCampoChange}
                        disabled={tieneNingunoInsectos}
                        label='Subir imágenes del insecto benéfico en "Otro"'
                        onOpenImage={(url) => setModalImage(url)}
                      />
                    </div>
                  )}
                </div>

                {/* Controladores microbianos */}
                <div className="border p-3 rounded bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Controladores microbianos observados *
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {microbianosOpciones.map((opcion) => (
                      <div key={opcion} className="flex items-center gap-2">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={microbianos.includes(opcion)}
                            onChange={(e) =>
                              handleGrupoChange(
                                baseKey,
                                'microbianos',
                                opcion,
                                e.target.checked,
                                opcionNingunoMicrobianos
                              )
                            }
                            className="mr-2"
                          />
                          {opcion}
                        </label>

                        {IMAGES[opcion] && (
                          <button
                            type="button"
                            onClick={() => setModalImage(IMAGES[opcion])}
                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                          >
                            Ver imagen
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {tieneOtroMicrobianos && (
                    <div className="mt-3">
                      <label className="block text-sm text-gray-600 mb-1">Otro (especifique)</label>
                      <input
                        type="text"
                        value={caracterizacion[`${baseKey}_microbianos_otro`] || ''}
                        onChange={(e) =>
                          handleOtroChange(
                            baseKey,
                            'microbianos',
                            e.target.value,
                            opcionNingunoMicrobianos
                          )
                        }
                        disabled={tieneNingunoMicrobianos}
                        className={`border rounded px-2 py-1 w-full text-sm ${
                          tieneNingunoMicrobianos ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        placeholder="Otro microbiano"
                      />

                      <RealFotosSection
                        prefix={`${baseKey}_microbianos_otro_fotos`}
                        onCampoChange={onCampoChange}
                        disabled={tieneNingunoMicrobianos}
                        label='Subir imágenes del controlador microbiano en "Otro"'
                        onOpenImage={(url) => setModalImage(url)}
                      />
                    </div>
                  )}
                </div>

                {/* Evidencia de presencia */}
                <div className="border p-3 rounded bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidencia de presencia observada *
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {evidenciasOpciones.map((opcion) => (
                      <div key={opcion} className="flex items-center gap-2">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={evidencias.includes(opcion)}
                            onChange={(e) =>
                              handleGrupoChange(
                                baseKey,
                                'evidencias',
                                opcion,
                                e.target.checked,
                                opcionNingunoEvidencias
                              )
                            }
                            className="mr-2"
                          />
                          {opcion}
                        </label>

                        {IMAGES[opcion] && (
                          <button
                            type="button"
                            onClick={() => setModalImage(IMAGES[opcion])}
                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                          >
                            Ver imagen
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {tieneOtroEvidencias && (
                    <div className="mt-3">
                      <label className="block text-sm text-gray-600 mb-1">Otro (especifique)</label>
                      <input
                        type="text"
                        value={caracterizacion[`${baseKey}_evidencias_otro`] || ''}
                        onChange={(e) =>
                          handleOtroChange(
                            baseKey,
                            'evidencias',
                            e.target.value,
                            opcionNingunoEvidencias
                          )
                        }
                        disabled={tieneNingunoEvidencias}
                        className={`border rounded px-2 py-1 w-full text-sm ${
                          tieneNingunoEvidencias ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        placeholder="Otra evidencia"
                      />

                      <RealFotosSection
                        prefix={`${baseKey}_evidencias_otro_fotos`}
                        onCampoChange={onCampoChange}
                        disabled={tieneNingunoEvidencias}
                        label='Subir imágenes de la evidencia en "Otro"'
                        onOpenImage={(url) => setModalImage(url)}
                      />
                    </div>
                  )}
                </div>

                {/* Nivel de presencia */}
                <div className="border p-3 rounded bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de presencia de controladores biológicos *
                  </label>

                  <div className="flex flex-col space-y-1">
                    {[
                      { value: 'alta', label: 'Alta (≥ 5 individuos por árbol)' },
                      { value: 'media', label: 'Media (2–4 individuos por árbol)' },
                      { value: 'baja', label: 'Baja (1 individuo por árbol)' },
                      { value: 'ninguno', label: 'No observados' },
                    ].map((opcion) => (
                      <label key={opcion.value} className="flex items-center text-sm">
                        <input
                          type="radio"
                          name={`${baseKey}_nivel`}
                          value={opcion.value}
                          checked={nivel === opcion.value}
                          onChange={(e) => handleChange(`${baseKey}_nivel`, e.target.value)}
                          className="mr-2"
                        />
                        {opcion.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
    </div>
  );
};