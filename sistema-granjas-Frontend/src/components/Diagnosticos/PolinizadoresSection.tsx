import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import type { PlantaBase } from '../types/index';
import { toast } from 'react-toastify';

// ----------------------------------------------------------------------
// Componente de subida REAL de fotos — usado en "Otro artrópodo"
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
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selected = Array.from(e.target.files || []);

    if (selected.length > MAX_FILES) {
      setError(`Máximo ${MAX_FILES} fotos permitidas.`);
      return;
    }

    const oversized = selected.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`Algunos archivos superan el límite de ${MAX_SIZE_MB} MB.`);
      return;
    }

    // Limpiar URLs anteriores
    previews.forEach((p) => URL.revokeObjectURL(p.url));

    const newPreviews = selected.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }));

    setFiles(selected);
    setPreviews(newPreviews);
    onCampoChange(prefix, selected.map((f) => f.name).join(","));
    if (onFilesChange) onFilesChange(prefix, selected);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    onCampoChange(prefix, updatedFiles.map((f) => f.name).join(","));
    if (onFilesChange) onFilesChange(prefix, updatedFiles);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Fotos tomadas en campo de síntomas o del artrópodo
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Sube hasta {MAX_FILES} fotos desde tu galería. Tamaño máximo por archivo: {MAX_SIZE_MB} MB.
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-sm transition-colors"
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
      />

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {previews.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {previews.map((preview, idx) => (
            <div key={idx} className="relative group w-24 h-24">
              <img
                src={preview.url}
                alt={preview.name}
                className="w-full h-full object-cover rounded border border-gray-300"
              />
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

// Modal para mostrar imágenes
const ImageModal: React.FC<{ imageUrl: string | null; onClose: () => void }> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded-lg max-w-lg max-h-full overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="float-right text-gray-600 hover:text-gray-900 text-xl font-bold"
          onClick={onClose}
        >
          ×
        </button>
        <img src={imageUrl} alt="Vista previa" className="max-w-full h-auto" />
      </div>
    </div>
  );
};
// ----------------------------------------------------------------------

const IMAGES: Record<string, string> = {
  'Abeja melífera': '/imgs/abeja_melifera.png',
  'Mariposas': '/imgs/mariposas.png',
  'Abejorros': '/imgs/abejorros.png',
  'Avispas': '/imgs/avispas.png',
};

const safeParseArray = (value?: string): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export interface PolinizadoresSectionRef {
  validate: () => boolean;
  getFiles: () => Map<string, File[]>;
}

interface PolinizadoresSectionProps {
  plantas: PlantaBase[];
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

export const PolinizadoresSection = forwardRef<PolinizadoresSectionRef, PolinizadoresSectionProps>(
  ({ plantas, caracterizacion, onCampoChange }, ref) => {
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [filesMap, setFilesMap] = useState<Map<string, File[]>>(new Map());
    const initialized = useRef<Set<string>>(new Set());

    const updateFiles = useCallback((prefix: string, files: File[]) => {
      setFilesMap(prev => new Map(prev).set(prefix, files));
    }, []);

    const clearErrorsForPrefix = (prefix: string) => {
      setErrores(prev => {
        const newErrores = { ...prev };
        Object.keys(newErrores).forEach(key => {
          if (key.startsWith(prefix)) delete newErrores[key];
        });
        return newErrores;
      });
    };

    const handleChange = (clave: string, valor: string | boolean) => {
      onCampoChange(clave, String(valor));
      clearErrorsForPrefix(clave + '_error');
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
      return caracterizacion[`polinizadores_${codigo}_noAplica`] === 'true';
    };

    const handleNoAplicaChange = (codigo: string, checked: boolean) => {
      const prefix = `polinizadores_${codigo}`;
      handleChange(`${prefix}_noAplica`, checked);
      if (checked) {
        handleChange(`${prefix}_polinizadores`, '');
        handleChange(`${prefix}_polinizadores_otro`, '');
        handleChange(`${prefix}_polinizadores_otro_fotos`, '');
        handleChange(`${prefix}_actividad`, '');
      }
    };

    // Inicialización por defecto
    useEffect(() => {
      plantas.forEach((planta) => {
        const codigo = planta.codigo;
        const key = `polinizadores_${codigo}_polinizadores`;
        const current = safeParseArray(caracterizacion[key]);
        if (current.length === 0 && !initialized.current.has(key)) {
          initialized.current.add(key);
          handleChange(key, JSON.stringify(['No se observaron']));
        }
      });
    }, [plantas, caracterizacion]);

    // Validación
    const validate = (): boolean => {
      const nuevosErrores: Record<string, string> = {};
      let isValid = true;

      plantas.forEach((planta) => {
        const codigo = planta.codigo;
        const baseKey = `polinizadores_${codigo}`;
        const noAplica = getNoAplica(codigo);
        if (noAplica) return;

        const polinizadoresKey = `${baseKey}_polinizadores`;
        const polinizadores = safeParseArray(caracterizacion[polinizadoresKey]);

        if (polinizadores.length === 0) {
          nuevosErrores[`${polinizadoresKey}_error`] = 'Debe seleccionar al menos una opción.';
          isValid = false;
        } else if (polinizadores.includes('Otro')) {
          const otroTexto = caracterizacion[`${baseKey}_polinizadores_otro`] || '';
          if (!otroTexto.trim()) {
            nuevosErrores[`${baseKey}_polinizadores_otro_error`] = 'Debe especificar el otro polinizador.';
            isValid = false;
          }
          const fotosPrefix = `${baseKey}_polinizadores_otro_fotos`;
          const fotos = filesMap.get(fotosPrefix) || [];
          if (fotos.length === 0) {
            nuevosErrores[`${fotosPrefix}_error`] = 'Debe subir al menos una foto del polinizador observado.';
            isValid = false;
          }
        }

        const actividad = caracterizacion[`${baseKey}_actividad`] || '';
        if (!actividad) {
          nuevosErrores[`${baseKey}_actividad_error`] = 'Debe seleccionar el nivel de actividad promedio.';
          isValid = false;
        }
      });

      setErrores(nuevosErrores);
      if (!isValid) toast.error('Complete los campos obligatorios (incluyendo "Otro" y sus fotos).');
      return isValid;
    };

    useImperativeHandle(ref, () => ({
      validate,
      getFiles: () => filesMap,
    }));

    const opcionesPolinizadores = [
      'Abeja melífera', 'Mariposas', 'Abejorros', 'Avispas',
      'No se observaron', 'Otro'
    ];
    const opcionNinguno = 'No se observaron';

    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Monitoreo de Polinizadores
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Por cada planta, revise 4 brotes por punto cardinal (16 brotes en total) durante 1 minuto.
          Registre la presencia de polinizadores.
        </p>

        {plantas.map((planta) => {
          const codigo = planta.codigo;
          const noAplica = getNoAplica(codigo);
          const baseKey = `polinizadores_${codigo}`;
          const polinizadores = safeParseArray(caracterizacion[`${baseKey}_polinizadores`]);
          const actividad = caracterizacion[`${baseKey}_actividad`] || '';
          const tieneNinguno = polinizadores.includes(opcionNinguno);
          const tieneOtro = polinizadores.includes('Otro');

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
                  <div className="border p-3 rounded bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Polinizadores observados *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {opcionesPolinizadores.map((opcion) => (
                        <div key={opcion} className="flex items-center gap-2">
                          <label className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={polinizadores.includes(opcion)}
                              onChange={(e) =>
                                handleGrupoChange(baseKey, 'polinizadores', opcion, e.target.checked, opcionNinguno)
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
                    {errores[`${baseKey}_polinizadores_error`] && (
                      <p className="text-red-600 text-xs mt-1">{errores[`${baseKey}_polinizadores_error`]}</p>
                    )}

                    {tieneOtro && (
                      <div className="mt-3">
                        <label className="block text-sm text-gray-600 mb-1">Otro (especifique) *</label>
                        <input
                          type="text"
                          value={caracterizacion[`${baseKey}_polinizadores_otro`] || ''}
                          onChange={(e) =>
                            handleOtroChange(baseKey, 'polinizadores', e.target.value, opcionNinguno)
                          }
                          disabled={tieneNinguno}
                          className={`border rounded px-2 py-1 w-full text-sm ${
                            tieneNinguno ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          placeholder="Otro polinizador"
                        />
                        {errores[`${baseKey}_polinizadores_otro_error`] && (
                          <p className="text-red-600 text-xs mt-1">{errores[`${baseKey}_polinizadores_otro_error`]}</p>
                        )}
                        <RealFotosSection
                          prefix={`${baseKey}_polinizadores_otro_fotos`}
                          onCampoChange={onCampoChange}
                          onFilesChange={updateFiles}
                          disabled={tieneNinguno}
                          label='Subir imágenes del polinizador en "Otro" *'
                          onOpenImage={(url) => setModalImage(url)}
                        />
                        {errores[`${baseKey}_polinizadores_otro_fotos_error`] && (
                          <p className="text-red-600 text-xs mt-1">{errores[`${baseKey}_polinizadores_otro_fotos_error`]}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border p-3 rounded bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Actividad promedio de polinizadores *
                    </label>
                    <div className="flex flex-col space-y-1">
                      {[
                        { value: 'alta', label: 'Alta (≥5 visitas/min)' },
                        { value: 'media', label: 'Media (2–4 visitas/min)' },
                        { value: 'baja', label: 'Baja (1 visita/min)' },
                        { value: 'sin_actividad', label: 'Sin actividad' },
                      ].map((opcion) => (
                        <label key={opcion.value} className="flex items-center text-sm">
                          <input
                            type="radio"
                            name={`${baseKey}_actividad`}
                            value={opcion.value}
                            checked={actividad === opcion.value}
                            onChange={(e) => handleChange(`${baseKey}_actividad`, e.target.value)}
                            className="mr-2"
                          />
                          {opcion.label}
                        </label>
                      ))}
                    </div>
                    {errores[`${baseKey}_actividad_error`] && (
                      <p className="text-red-600 text-xs mt-1">{errores[`${baseKey}_actividad_error`]}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
      </div>
    );
  }
);