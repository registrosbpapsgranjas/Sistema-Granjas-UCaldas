import React, { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { PlantaBase } from "../types";
import { toast } from "react-toastify";

interface Props {
  plantas: PlantaBase[];
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

export interface ArthropodSectionRef {
  validate: () => boolean;
}

// Componente para subir fotos (simulado con input de texto) — usado en insectos/ácaros listados
const FotosSection: React.FC<{
  prefix: string;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}> = ({ prefix, caracterizacion, onCampoChange }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Fotos tomadas en campo de síntomas o del artrópodo
    </label>
    <p className="text-xs text-gray-500 mb-2">
      Sube hasta 5 archivos compatibles. Tamaño máximo por archivo: 10 MB.
    </p>
    <input
      type="text"
      value={caracterizacion[prefix] || ""}
      onChange={(e) => onCampoChange(prefix, e.target.value)}
      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
      placeholder="Ruta de la foto (simulado)"
    />
  </div>
);

// Componente de subida REAL de fotos — usado en "Otro artrópodo"
const RealFotosSection: React.FC<{
  prefix: string;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}> = ({ prefix, caracterizacion, onCampoChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 5;
  const MAX_SIZE_MB = 10;

  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
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
    onCampoChange(prefix, files.map((f) => f.name).join(","));
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onCampoChange(prefix, updated.map((p) => p.name).join(","));
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

      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}

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

// ── Subsecciones para cada tipo de insecto ──────────────────────────────────

const CompsusSection: React.FC<{
  basePrefix: string; cuadrante: number; rama: number;
  caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void;
}> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_compsus`;
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Monitoreo de <em>Compsus sp.</em> - Picudo</h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Seleccione preferiblemente árboles de los linderos, de los bordes de carretera o los que están cerca de los centros de acopio de frutas. Sacuda de forma suave las ramas de arriba hacia abajo, dándole la vuelta al árbol. Observe en el suelo la presencia de adultos.
      </p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Adultos de <em>Compsus sp.</em> encontrados *</label>
        <input type="number" min="0" step="1"
          value={caracterizacion[`${prefix}_adultos`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_adultos`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 3 (0 si no hay)" required />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia del insecto, colocar 0</p>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de daño en hojas *</label>
        <input type="number" min="0" max="100" step="1"
          value={caracterizacion[`${prefix}_dano_hojas`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_dano_hojas`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay daño)" required />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse daño del insecto, colocar 0</p>
      </div>
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

const DiaphorinaSection: React.FC<{
  basePrefix: string; cuadrante: number; rama: number;
  caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void;
}> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_diaphorina`;
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Monitoreo de <em>Diaphorina citri</em> - Psílido asiático</h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Revisar brotes nuevos, que son los preferidos por el insecto.
        {caracterizacion['lote_seleccionado'] && ['l5', 'l6', 'l8', 'l9'].includes(caracterizacion['lote_seleccionado']) &&
          " NOTA: Este lote tiene variedad Swingle. Debe monitorear mínimo 2 árboles adicionales."}
      </p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Número de <em>Diaphorina citri</em> encontrados *</label>
        <input type="number" min="0" step="1"
          value={caracterizacion[`${prefix}_adultos`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_adultos`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 3 (0 si no hay)" required />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia del insecto, colocar 0</p>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Estados del insecto observados *</label>
        <div className="flex flex-wrap gap-4">
          {["Huevo", "Ninfa", "Adulto", "No se observaron"].map((estado) => (
            <label key={estado} className="inline-flex items-center">
              <input type="checkbox" value={estado}
                checked={caracterizacion[`${prefix}_estados`]?.includes(estado) || false}
                onChange={(e) => {
                  const current = caracterizacion[`${prefix}_estados`] || "";
                  const values = current ? current.split(",") : [];
                  if (e.target.checked) { if (!values.includes(estado)) values.push(estado); }
                  else { const i = values.indexOf(estado); if (i > -1) values.splice(i, 1); }
                  onCampoChange(`${prefix}_estados`, values.join(","));
                }}
                className="mr-2" required />
              {estado}
            </label>
          ))}
        </div>
      </div>
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

const PhyllocnistisSection: React.FC<{
  basePrefix: string; cuadrante: number; rama: number;
  caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void;
}> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_phyllocnistis`;
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Monitoreo de <em>Phyllocnistis sp.</em> - Minador de los cítricos</h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Revisar brotes nuevos. Observar: Galerías serpenteantes plateadas en el envés de la hoja, enrollamiento del borde foliar, presencia de larvas o pupa al final de la galería.
      </p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Galerías activas hechas por <em>Phyllocnistis sp.</em> *</label>
        <input type="number" min="0" step="1"
          value={caracterizacion[`${prefix}_galerias`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_galerias`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 3 (0 si no hay)" required />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia del insecto, colocar 0</p>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de daño *</label>
        <input type="number" min="0" max="100" step="1"
          value={caracterizacion[`${prefix}_dano_hojas`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_dano_hojas`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay daño)" required />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse daño del insecto, colocar 0</p>
      </div>
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

const ToxopteraSection: React.FC<{
  basePrefix: string; cuadrante: number; rama: number;
  caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void;
}> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_toxoptera`;
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Monitoreo de <em>Toxoptera citricidus</em> - Pulgón negro</h6>
      <p className="text-xs text-gray-600 mb-2 italic">Revisar brotes nuevos, que son los preferidos por el insecto.</p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Adultos de <em>Toxoptera citricidus</em> encontrados *</label>
        <input type="number" min="0" step="1"
          value={caracterizacion[`${prefix}_adultos`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_adultos`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 3 (0 si no hay)" required />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia del insecto, colocar 0</p>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">¿Se observó presencia de mielecilla y fumagina? *</label>
        <div className="flex gap-4">
          {["Si", "No"].map((opcion) => (
            <label key={opcion} className="inline-flex items-center">
              <input type="radio" name={`${prefix}_mielecilla`} value={opcion}
                checked={caracterizacion[`${prefix}_mielecilla`] === opcion}
                onChange={(e) => onCampoChange(`${prefix}_mielecilla`, e.target.value)}
                className="mr-2" required />
              {opcion}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de Fumagina o Mielecilla observada *</label>
        <input type="number" min="0" max="100" step="1"
          value={caracterizacion[`${prefix}_dano_fumagina`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_dano_fumagina`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay)" required />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse daño, colocar 0</p>
      </div>
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

// ── Subsecciones para ácaros ─────────────────────────────────────────────────

const PolyphagotarsonemusSection: React.FC<{
  basePrefix: string; cuadrante: number; rama: number;
  caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void;
}> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_polyphagotarsonemus`;
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Monitoreo de <em>Polyphagotarsonemus sp.</em> - Ácaro blanco</h6>
      <p className="text-xs text-gray-600 mb-2 italic">Revisar brotes tiernos y frutos en formación. Observar: Coloración plateada, enrollamiento de hojas jóvenes.</p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Número de frutos afectados por <em>Polyphagotarsonemus sp</em> *</label>
        <input type="number" min="0" step="1"
          value={caracterizacion[`${prefix}_frutos_afectados`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_frutos_afectados`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 3 (0 si no hay)" required />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia del ácaro, colocar 0</p>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de daño en frutos observado *</label>
        <input type="number" min="0" max="100" step="1"
          value={caracterizacion[`${prefix}_dano_frutos`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_dano_frutos`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay daño)" required />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse daño, colocar 0</p>
      </div>
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

const PhyllocoptrutaSection: React.FC<{
  basePrefix: string; cuadrante: number; rama: number;
  caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void;
}> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_phyllocoptruta`;
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Monitoreo de <em>Phyllocoptruta</em> sp. - Ácaro tostador</h6>
      <p className="text-xs text-gray-600 mb-2 italic">Revisar brotes tiernos y frutos en formación. Observar: Bronceado café oscuro, enrollamiento de hojas jóvenes, rugosidad y corchosidad en frutos.</p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Número de frutos afectados por <em>Phyllocoptruta</em> sp. *</label>
        <input type="number" min="0" step="1"
          value={caracterizacion[`${prefix}_frutos_afectados`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_frutos_afectados`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 3 (0 si no hay)" required />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia del ácaro, colocar 0</p>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de daño en frutos observado *</label>
        <input type="number" min="0" max="100" step="1"
          value={caracterizacion[`${prefix}_dano_frutos`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_dano_frutos`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay daño)" required />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse daño, colocar 0</p>
      </div>
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

// ── Sección "Otro artrópodo" con subida REAL de fotos ────────────────────────

const OtroArthropodSection: React.FC<{
  basePrefix: string; cuadrante: number; rama: number;
  caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void;
}> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro`;
  const claseSeleccionada = caracterizacion[`${prefix}_clase`] || "";

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Otro artrópodo observado</h6>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas observados *</label>
        <input type="text"
          value={caracterizacion[`${prefix}_sintomas`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_sintomas`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          placeholder="Describa los síntomas observados" required />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Clase de artrópodo observado *</label>
        <div className="flex gap-4">
          {["Insecto", "Ácaro"].map((opcion) => (
            <label key={opcion} className="inline-flex items-center">
              <input type="radio" name={`${prefix}_clase`} value={opcion}
                checked={claseSeleccionada === opcion}
                onChange={(e) => onCampoChange(`${prefix}_clase`, e.target.value)}
                className="mr-2" required />
              {opcion}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del artrópodo observado (mínimo hasta género) *
        </label>
        <input type="text"
          value={caracterizacion[`${prefix}_nombre`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_nombre`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          placeholder="Ej: Atta sp." required />
      </div>

      <RealFotosSection
        prefix={`${prefix}_fotos`}
        caracterizacion={caracterizacion}
        onCampoChange={onCampoChange}
      />
    </div>
  );
};

// ── Cuadrante ────────────────────────────────────────────────────────────────

const CuadranteArthropod: React.FC<{
  plantaIdx: number; cuadrante: number; rama: number; planta: PlantaBase;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
  onOpenImage: (imageName: string) => void;
  errores?: Record<string, string>;
}> = ({ plantaIdx, cuadrante, rama, planta, caracterizacion, onCampoChange, onOpenImage, errores = {} }) => {
  const basePrefix = `artropodo_planta_${plantaIdx + 1}`;
  const presenciaKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_presencia`;
  const presencia = caracterizacion[presenciaKey] || "no"; // "si" o "no"

  const claseKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_clase`;
  const claseString = caracterizacion[claseKey] || ""; // valores separados por coma: "insecto", "aracnido", o ambos
  const isInsecto = claseString.includes('insecto');
  const isAracnido = claseString.includes('aracnido');

  // Función para limpiar todos los campos de una clase (insecto o ácaro)
  const clearClassData = (tipo: 'insecto' | 'aracnido') => {
    const tipoPrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_${tipo === 'insecto' ? 'insecto' : 'acaro'}`;
    Object.keys(caracterizacion).forEach(k => {
      if (k.startsWith(tipoPrefix)) {
        onCampoChange(k, "");
      }
    });
    const tiposKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_${tipo === 'insecto' ? 'insecto_tipos' : 'acaro_tipos'}`;
    onCampoChange(tiposKey, "");
  };

  // Manejo del cambio de presencia
  const handlePresenciaChange = (valor: string) => {
    onCampoChange(presenciaKey, valor);
    if (valor === "no") {
      // Limpiar todas las clases y datos asociados
      onCampoChange(claseKey, "");
      clearClassData('insecto');
      clearClassData('aracnido');
      // Limpiar "otro artrópodo"
      const otroActivoKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro_activo`;
      onCampoChange(otroActivoKey, "false");
      const otroPrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro`;
      Object.keys(caracterizacion).forEach(k => {
        if (k.startsWith(otroPrefix)) onCampoChange(k, "");
      });
    }
  };

  // Manejo de checkboxes de clase
  const handleClassToggle = (clase: 'insecto' | 'aracnido') => {
    let newClases = claseString ? claseString.split(',') : [];
    const index = newClases.indexOf(clase);
    if (index === -1) {
      newClases.push(clase);
    } else {
      newClases.splice(index, 1);
      clearClassData(clase);
    }
    onCampoChange(claseKey, newClases.join(','));
  };

  // Insectos
  const insectoTiposKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_insecto_tipos`;
  const insectoTiposArray = (caracterizacion[insectoTiposKey] || "").split(",").filter(Boolean);

  const handleInsectoTipoChange = (tipo: string, checked: boolean) => {
    let arr = [...insectoTiposArray];
    if (checked) {
      if (!arr.includes(tipo)) arr.push(tipo);
    } else {
      arr = arr.filter(t => t !== tipo);
      const p = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_insecto_${tipo}`;
      Object.keys(caracterizacion).forEach(k => {
        if (k.startsWith(p)) onCampoChange(k, "");
      });
    }
    onCampoChange(insectoTiposKey, arr.join(","));
  };

  // Ácaros
  const acaroTiposKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_acaro_tipos`;
  const acaroTiposArray = (caracterizacion[acaroTiposKey] || "").split(",").filter(Boolean);

  const handleAcaroTipoChange = (tipo: string, checked: boolean) => {
    let arr = [...acaroTiposArray];
    if (checked) {
      if (!arr.includes(tipo)) arr.push(tipo);
    } else {
      arr = arr.filter(t => t !== tipo);
      const p = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_acaro_${tipo}`;
      Object.keys(caracterizacion).forEach(k => {
        if (k.startsWith(p)) onCampoChange(k, "");
      });
    }
    onCampoChange(acaroTiposKey, arr.join(","));
  };

  const insectoTiposDisponibles = [
    { value: 'compsus',     label: <><em>Compsus sp.</em> – Picudo</>,                  image: 'compsussp.png' },
    { value: 'diaphorina',  label: <><em>Diaphorina citri</em> - Psílido asiático</>,   image: 'diaphorinacitri.png' },
    { value: 'phyllocnistis',label: <><em>Phyllocnistis sp.</em> - Minador de la hoja</>,image: 'phyllocnistissp.png' },
    { value: 'toxoptera',   label: <><em>Toxoptera citricidus</em> - Pulgón negro</>,   image: 'toxopteracitricidus.png' },
  ];

  const acaroTiposDisponibles = [
    { value: 'polyphagotarsonemus', label: <><em>Polyphago- tarsonemus sp.</em> - Ácaro blanco</>,  image: 'polyphagotarsonemussp.png' },
    { value: 'phyllocoptruta',      label: <><em>Phyllocoptruta sp.</em> - Ácaro tostador</>,     image: 'phyllocoptrutasp.png' },
  ];

  // Errores
  const errorPresenciaKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_presencia_error`;
  const errorInsectoKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_insecto_error`;
  const errorAcaroKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_acaro_error`;

  return (
    <div className="ml-6 mb-6 p-4 border-l-4 border-blue-200 bg-gray-50 rounded">
      <h5 className="font-medium text-md text-gray-700 mb-3">Rama {rama} - Cuadrante {cuadrante}</h5>

      {/* Presencia de artrópodos */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Hay presencia de artrópodos en la RAMA {rama} del CUADRANTE {cuadrante}? *
        </label>
        <div className="flex gap-6">
          <label className="inline-flex items-center">
            <input type="radio" name={presenciaKey} value="si"
              checked={presencia === "si"}
              onChange={(e) => handlePresenciaChange(e.target.value)}
              className="mr-2" required />
            Sí
          </label>
          <label className="inline-flex items-center">
            <input type="radio" name={presenciaKey} value="no"
              checked={presencia === "no"}
              onChange={(e) => handlePresenciaChange(e.target.value)}
              className="mr-2" required />
            Ninguno
          </label>
        </div>
        {errores[errorPresenciaKey] && (
          <p className="text-red-600 text-xs mt-1">{errores[errorPresenciaKey]}</p>
        )}
      </div>

      {presencia === "si" && (
        <>
          {/* Clases de artrópodo - checkboxes múltiples */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clase(s) de artrópodo observado (puede seleccionar ambos) *
            </label>
            <div className="flex gap-6">
              <label className="inline-flex items-center">
                <input type="checkbox"
                  checked={isInsecto}
                  onChange={() => handleClassToggle('insecto')}
                  className="mr-2" />
                Insecto
              </label>
              <label className="inline-flex items-center">
                <input type="checkbox"
                  checked={isAracnido}
                  onChange={() => handleClassToggle('aracnido')}
                  className="mr-2" />
                Arácnido
              </label>
            </div>
            {errores[errorPresenciaKey] && (
              <p className="text-red-600 text-xs mt-1">{errores[errorPresenciaKey]}</p>
            )}
          </div>

          {/* Insectos */}
          {isInsecto && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccione el insecto observado en la RAMA {rama} del CUADRANTE {cuadrante} (Selección múltiple)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {insectoTiposDisponibles.map(tipo => (
                  <div key={tipo.value} className="flex items-center gap-2">
                    <label className="inline-flex items-center">
                      <input type="checkbox" checked={insectoTiposArray.includes(tipo.value)}
                        onChange={(e) => handleInsectoTipoChange(tipo.value, e.target.checked)} className="mr-2" />
                      {tipo.label}
                    </label>
                    <button type="button" onClick={() => onOpenImage(tipo.image)}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">
                      Ver imagen
                    </button>
                  </div>
                ))}
              </div>
              {errores[errorInsectoKey] && (
                <p className="text-red-600 text-xs mt-1">{errores[errorInsectoKey]}</p>
              )}

              {insectoTiposArray.includes('compsus') && <CompsusSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />}
              {insectoTiposArray.includes('diaphorina') && <DiaphorinaSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />}
              {insectoTiposArray.includes('phyllocnistis') && <PhyllocnistisSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />}
              {insectoTiposArray.includes('toxoptera') && <ToxopteraSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />}
            </div>
          )}

          {/* Ácaros */}
          {isAracnido && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccione el ácaro que ocasionó el daño en los frutos de la RAMA {rama} del CUADRANTE {cuadrante} (Selección múltiple)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {acaroTiposDisponibles.map(tipo => (
                  <div key={tipo.value} className="flex items-center gap-2">
                    <label className="inline-flex items-center">
                      <input type="checkbox" checked={acaroTiposArray.includes(tipo.value)}
                        onChange={(e) => handleAcaroTipoChange(tipo.value, e.target.checked)} className="mr-2" />
                      {tipo.label}
                    </label>
                    <button type="button" onClick={() => onOpenImage(tipo.image)}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">
                      Ver imagen
                    </button>
                  </div>
                ))}
              </div>
              {errores[errorAcaroKey] && (
                <p className="text-red-600 text-xs mt-1">{errores[errorAcaroKey]}</p>
              )}

              {acaroTiposArray.includes('polyphagotarsonemus') && <PolyphagotarsonemusSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />}
              {acaroTiposArray.includes('phyllocoptruta') && <PhyllocoptrutaSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />}
            </div>
          )}

          {/* Otro artrópodo */}
          <div className="mt-4">
            <label className="inline-flex items-center mb-2">
              <input type="checkbox"
                checked={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro_activo`] === 'true'}
                onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro_activo`, e.target.checked ? 'true' : 'false')}
                className="mr-2" />
              <span className="text-sm font-medium text-gray-700">Registrar otro artrópodo no listado</span>
            </label>

            {caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro_activo`] === 'true' && (
              <OtroArthropodSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Planta ───────────────────────────────────────────────────────────────────

const PlantaArthropod: React.FC<{
  index: number; planta: PlantaBase;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
  onOpenImage: (imageName: string) => void;
  errores: Record<string, string>;
}> = ({ index, planta, caracterizacion, onCampoChange, onOpenImage, errores }) => (
  <div className="border rounded-lg p-4 mb-8 bg-white shadow-sm">
    <h4 className="font-semibold text-lg text-gray-800 mb-2">
      {planta.label} (Código: {planta.codigo})
    </h4>
    <p className="text-sm text-gray-500 mb-4">
      El árbol se divide en 4 cuadrantes. Seleccione una rama al azar de cada cuadrante y observe: daño en hojas, frutos, puntos de crecimiento y presencia de artrópodos.
    </p>
    {[1, 2, 3, 4].map((cuadrante) => (
      <CuadranteArthropod
        key={`${planta.codigo}-cuadrante-${cuadrante}`}
        plantaIdx={index} cuadrante={cuadrante} rama={cuadrante}
        planta={planta} caracterizacion={caracterizacion}
        onCampoChange={onCampoChange} onOpenImage={onOpenImage}
        errores={errores}
      />
    ))}
  </div>
);

// ── Componente principal ─────────────────────────────────────────────────────

export const ArthropodSection = forwardRef<ArthropodSectionRef, Props>(
  ({ plantas, caracterizacion, onCampoChange }, ref) => {
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [errores, setErrores] = useState<Record<string, string>>({});

    const validate = (): boolean => {
      const nuevosErrores: Record<string, string> = {};
      let isValid = true;

      plantas.forEach((planta, idx) => {
        const basePrefix = `artropodo_planta_${idx + 1}`;
        for (let cuadrante = 1; cuadrante <= 4; cuadrante++) {
          const presenciaKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_presencia`;
          const presencia = caracterizacion[presenciaKey] || "";
          const errorPresenciaKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_presencia_error`;

          if (!presencia) {
            nuevosErrores[errorPresenciaKey] = `Seleccione si hay presencia de artrópodos en el cuadrante ${cuadrante} de la planta ${planta.label}.`;
            isValid = false;
          } else if (presencia === "si") {
            // Verificar que al menos una clase esté seleccionada
            const claseKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_clase`;
            const claseString = caracterizacion[claseKey] || "";
            if (!claseString) {
              nuevosErrores[errorPresenciaKey] = `Debe seleccionar al menos una clase (Insecto o Arácnido) en el cuadrante ${cuadrante} de la planta ${planta.label}.`;
              isValid = false;
            } else {
              // Validar insectos si están seleccionados
              if (claseString.includes('insecto')) {
                const insectoTiposKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_insecto_tipos`;
                const insectoTipos = (caracterizacion[insectoTiposKey] || "").split(",").filter(Boolean);
                const otroActivoKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_otro_activo`;
                const otroActivo = caracterizacion[otroActivoKey] === "true";
                if (insectoTipos.length === 0 && !otroActivo) {
                  const errorKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_insecto_error`;
                  nuevosErrores[errorKey] = `Debe seleccionar al menos un insecto o marcar "Registrar otro artrópodo no listado" en el cuadrante ${cuadrante} de la planta ${planta.label}.`;
                  isValid = false;
                }
              }
              // Validar ácaros si están seleccionados
              if (claseString.includes('aracnido')) {
                const acaroTiposKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_acaro_tipos`;
                const acaroTipos = (caracterizacion[acaroTiposKey] || "").split(",").filter(Boolean);
                const otroActivoKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_otro_activo`;
                const otroActivo = caracterizacion[otroActivoKey] === "true";
                if (acaroTipos.length === 0 && !otroActivo) {
                  const errorKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}_acaro_error`;
                  nuevosErrores[errorKey] = `Debe seleccionar al menos un ácaro o marcar "Registrar otro artrópodo no listado" en el cuadrante ${cuadrante} de la planta ${planta.label}.`;
                  isValid = false;
                }
              }
            }
          }
        }
      });

      setErrores(nuevosErrores);
      if (!isValid) {
        toast.error("Por favor complete los campos obligatorios según las opciones seleccionadas.");
      }
      return isValid;
    };

    useImperativeHandle(ref, () => ({
      validate
    }));

    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Monitoreo de Artrópodos</h2>

        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
          <p className="text-sm text-gray-700">
            <span className="font-bold">Metodología de monitoreo:</span> Para cada árbol seleccionado, divida la copa en 4 cuadrantes.
            Seleccione una rama al azar de cada cuadrante. Observe: daño en hojas, frutos, puntos de crecimiento y presencia de artrópodos.
          </p>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-4">Árboles seleccionados para monitoreo</h3>
        <p className="text-sm text-gray-600 mb-6">
          Se han generado {plantas.length} árbol(es) para monitoreo. Para cada uno, evalúe los 4 cuadrantes de forma independiente.
        </p>

        {plantas.map((planta, idx) => (
          <PlantaArthropod key={planta.codigo} index={idx} planta={planta}
            caracterizacion={caracterizacion} onCampoChange={onCampoChange}
            onOpenImage={(name) => setModalImage(`/imgs/${name}`)}
            errores={errores} />
        ))}

        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700">
          <p className="font-medium mb-1">📝 Nota importante - Variedad Swingle:</p>
          <p>
            Si el lote monitoreado tiene o linda con plantas de la variedad Swingle (Lotes: 5, 6, 8 y 9),
            debe monitorear mínimo 2 árboles adicionales de esta variedad para el monitoreo de <em>Diaphorina citri</em>.
          </p>
        </div>

        <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
      </div>
    );
  }
);