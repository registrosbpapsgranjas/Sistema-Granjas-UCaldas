import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { PlantaBase } from '../types';
import { toast } from 'react-toastify';

interface EnfermedadesSectionProps {
  plantas: PlantaBase[];
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

export interface EnfermedadesSectionRef {
  validate: () => boolean;
}

// ── Utilidades ──────────────────────────────────────────────────────────────
const splitValues = (value?: string): string[] => {
  if (!value) return [];
  return value.split(',').map(v => v.trim()).filter(Boolean);
};

const joinValues = (values: string[]): string => values.join(',');

const toggleOptionWithNoAplica = (
  currentValue: string | undefined,
  option: string,
  checked: boolean,
  noAplicaValue = 'No aplica'
): string[] => {
  const current = splitValues(currentValue);
  if (option === noAplicaValue) {
    return checked ? [noAplicaValue] : [];
  }
  if (checked) {
    return [...current.filter(v => v !== noAplicaValue && v !== option), option];
  }
  return current.filter(v => v !== option);
};

// ── Modal para imágenes ────────────────────────────────────────────────────
const ImageModal: React.FC<{ imageUrl: string | null; onClose: () => void }> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-4 rounded-lg max-w-lg max-h-full overflow-auto" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="float-right text-gray-600 hover:text-gray-900 text-xl font-bold" onClick={onClose}>×</button>
        <img src={imageUrl} alt="Vista previa" className="max-w-full h-auto" />
      </div>
    </div>
  );
};

// ── Componente de subida REAL de fotos ─────────────────────────────────────
const RealFotosSection: React.FC<{
  prefix: string;
  onCampoChange: (campo: string, valor: string) => void;
  errores?: Record<string, string>;
  clearErrorsForPrefix?: (prefix: string) => void;
}> = ({ prefix, onCampoChange, errores, clearErrorsForPrefix }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const MAX_FILES = 5;
  const MAX_SIZE_MB = 10;
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    return () => previews.forEach(p => URL.revokeObjectURL(p.url));
  }, [previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = Array.from(e.target.files || []);
    if (files.length > MAX_FILES) {
      setError(`Máximo ${MAX_FILES} fotos permitidas.`);
      return;
    }
    const oversized = files.filter(f => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`Algunos archivos superan el límite de ${MAX_SIZE_MB} MB.`);
      return;
    }
    previews.forEach(p => URL.revokeObjectURL(p.url));
    const newPreviews = files.map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
    setPreviews(newPreviews);
    onCampoChange(prefix, files.map(f => f.name).join(','));
    if (clearErrorsForPrefix) clearErrorsForPrefix(prefix);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onCampoChange(prefix, updated.map(p => p.name).join(','));
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Fotos de los síntomas observados</label>
      <p className="text-xs text-gray-500 mb-2">Sube hasta {MAX_FILES} fotos. Tamaño máximo {MAX_SIZE_MB} MB.</p>
      <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-sm transition-colors">
        Seleccionar fotos
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {previews.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {previews.map((preview, idx) => (
            <div key={idx} className="relative group w-24">
              <img src={preview.url} alt={preview.name} className="w-24 h-24 object-cover rounded border border-gray-300" />
              <button type="button" onClick={() => removePhoto(idx)} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow">×</button>
              <p className="text-xs text-gray-500 truncate mt-1 max-w-[6rem]">{preview.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Constantes ──────────────────────────────────────────────────────────────
const AGENTES = [
  { value: 'hongo', label: 'Hongo' },
  { value: 'bacteria', label: 'Bacteria' },
  { value: 'virus', label: 'Virus' },
  { value: 'nematodo', label: 'Nematodo' },
  { value: 'oomiceto', label: 'Oomiceto' },
];

const ENFERMEDADES_POR_AGENTE = {
  hongo: [
    { id: 'antracnosis', label: <><em>Colletotrichum gloeosporioides</em> – Antracnosis</>, image: 'antracnosis.png' },
    { id: 'mancha_grasienta', label: <><em>Mycosphaerella citri</em> - Mancha grasienta de los cítricos</>, image: 'manchagrasienta.png' },
  ],
  bacteria: [
    { id: 'hlb', label: <>Huanglongbing (HLB) – Enverdecimiento</>, image: 'hlb.png' },
    { id: 'xylella', label: <><em>Xylella fastidiosa</em> - Clorosis de los cítricos</>, image: 'xylella.png' },
  ],
  oomiceto: [
    { id: 'phytophthora', label: <><em>Phytophthora</em> sp. - Gomosis o pudrición radicular</>, image: 'phytophthorasp.png' },
  ],
  virus: [
    { id: 'ctv', label: <>Virus de la Tristeza de los Cítricos (CTV)</>, image: 'ctv.png' },
  ],
  nematodo: [
    { id: 'nematodos', label: <>Nematodos</>, image: 'nematodos.png' },
  ],
};

const SINTOMAS_POR_ENFERMEDAD = {
  antracnosis: ['Manchas necróticas en hojas', 'Lesiones oscuras en frutos', 'Caída de flores o frutos', 'Secamiento de brotes', 'Sin síntomas', 'No aplica'],
  mancha_grasienta: ['Puntos negros en hojas', 'Manchas grasientas', 'Defoliación', 'Sin síntomas', 'No aplica'],
  hlb: ['Amarillamiento irregular', 'Frutos deformes', 'Brotes cloróticos', 'Presencia del vector Diaphorina citri', 'Sin síntomas', 'No aplica'],
  xylella: ['Lesiones necróticas en envés de las hojas', 'Lesiones cloróticas en el haz de las hojas', 'Marchitez', 'Reducción en el tamaño de los frutos', 'Endurecimiento de la cáscara', 'Sin síntomas', 'No aplica'],
  phytophthora: ['Exudado de goma', 'Pudrición de cuello', 'Raíces oscuras', 'Sin síntomas', 'No aplica'],
  ctv: ['Aclaramiento de nervaduras en hojas', 'Declive general', 'Amarillamiento', 'Sin síntomas', 'No aplica'],
};

// ── Subcomponentes con validación ──────────────────────────────────────────

interface SectionProps {
  basePrefix: string;
  cuadrante: number;
  rama: number;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
  errores: Record<string, string>;
  clearErrorsForPrefix: (prefix: string) => void;
}

const AntracnosisSection: React.FC<SectionProps> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange, errores, clearErrorsForPrefix }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_hongo_antracnosis`;
  const sintomasKey = `${prefix}_sintomas`;
  const hojasKey = `${prefix}_hojas`;

  const handleChange = (key: string, value: string) => {
    onCampoChange(key, value);
    clearErrorsForPrefix(key + '_error');
  };

  const sintomasActuales = splitValues(caracterizacion[sintomasKey]);

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm"><em>Colletotrichum gloeosporioides</em> — Antracnosis</h6>
      <p className="text-xs text-gray-600 mb-2 italic">Síntomas: Manchas cloróticas irregulares... Umbral: &gt;5% de árboles con síntomas activos.</p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de hojas afectadas *</label>
        <input type="number" min="0" max="100" step="1" value={caracterizacion[hojasKey] || ''}
          onChange={(e) => handleChange(hojasKey, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs" placeholder="Ej: 30" required />
        {errores[`${hojasKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${hojasKey}_error`]}</p>}
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Síntomas observados *</label>
        {SINTOMAS_POR_ENFERMEDAD.antracnosis.map(sintoma => (
          <label key={sintoma} className="flex items-center text-sm">
            <input type="checkbox" value={sintoma} checked={sintomasActuales.includes(sintoma)}
              onChange={(e) => {
                const nuevos = toggleOptionWithNoAplica(caracterizacion[sintomasKey], sintoma, e.target.checked);
                handleChange(sintomasKey, joinValues(nuevos));
              }} className="mr-2" />
            {sintoma}
          </label>
        ))}
        {errores[`${sintomasKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${sintomasKey}_error`]}</p>}
      </div>
    </div>
  );
};

const ManchaGrasientaSection: React.FC<SectionProps> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange, errores, clearErrorsForPrefix }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_hongo_mancha_grasienta`;
  const sintomasKey = `${prefix}_sintomas`;
  const hojasKey = `${prefix}_hojas`;

  const handleChange = (key: string, value: string) => {
    onCampoChange(key, value);
    clearErrorsForPrefix(key + '_error');
  };

  const sintomasActuales = splitValues(caracterizacion[sintomasKey]);

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm"><em>Mycosphaerella citri</em> - Mancha grasienta</h6>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de hojas afectadas *</label>
        <input type="number" min="0" max="100" step="1" value={caracterizacion[hojasKey] || ''}
          onChange={(e) => handleChange(hojasKey, e.target.value)} className="border rounded px-3 py-2 w-full max-w-xs" required />
        {errores[`${hojasKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${hojasKey}_error`]}</p>}
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Síntomas observados *</label>
        {SINTOMAS_POR_ENFERMEDAD.mancha_grasienta.map(sintoma => (
          <label key={sintoma} className="flex items-center text-sm">
            <input type="checkbox" value={sintoma} checked={sintomasActuales.includes(sintoma)}
              onChange={(e) => {
                const nuevos = toggleOptionWithNoAplica(caracterizacion[sintomasKey], sintoma, e.target.checked);
                handleChange(sintomasKey, joinValues(nuevos));
              }} className="mr-2" />
            {sintoma}
          </label>
        ))}
        {errores[`${sintomasKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${sintomasKey}_error`]}</p>}
      </div>
    </div>
  );
};

const HLBSection: React.FC<SectionProps> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange, errores, clearErrorsForPrefix }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_bacteria_hlb`;
  const sintomasKey = `${prefix}_sintomas`;
  const hojasKey = `${prefix}_hojas`;
  const vectorKey = `${prefix}_vector`;

  const handleChange = (key: string, value: string) => {
    onCampoChange(key, value);
    clearErrorsForPrefix(key + '_error');
  };

  const sintomasActuales = splitValues(caracterizacion[sintomasKey]);

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Huanglongbing - HLB</h6>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de hojas afectadas *</label>
        <input type="number" min="0" max="100" step="1" value={caracterizacion[hojasKey] || ''}
          onChange={(e) => handleChange(hojasKey, e.target.value)} className="border rounded px-3 py-2 w-full max-w-xs" required />
        {errores[`${hojasKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${hojasKey}_error`]}</p>}
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Síntomas observados *</label>
        {SINTOMAS_POR_ENFERMEDAD.hlb.map(sintoma => (
          <label key={sintoma} className="flex items-center text-sm">
            <input type="checkbox" value={sintoma} checked={sintomasActuales.includes(sintoma)}
              onChange={(e) => {
                const nuevos = toggleOptionWithNoAplica(caracterizacion[sintomasKey], sintoma, e.target.checked);
                handleChange(sintomasKey, joinValues(nuevos));
              }} className="mr-2" />
            {sintoma}
          </label>
        ))}
        {errores[`${sintomasKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${sintomasKey}_error`]}</p>}
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">¿Presencia del vector <em>Diaphorina citri</em>? *</label>
        <div className="flex gap-4">
          {['Si', 'No'].map(op => (
            <label key={op} className="inline-flex items-center">
              <input type="radio" name={vectorKey} value={op} checked={caracterizacion[vectorKey] === op}
                onChange={(e) => handleChange(vectorKey, e.target.value)} className="mr-2" />
              {op}
            </label>
          ))}
        </div>
        {errores[`${vectorKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${vectorKey}_error`]}</p>}
      </div>
    </div>
  );
};

const XylellaSection: React.FC<SectionProps> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange, errores, clearErrorsForPrefix }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_bacteria_xylella`;
  const sintomasKey = `${prefix}_sintomas`;
  const hojasKey = `${prefix}_hojas`;

  const handleChange = (key: string, value: string) => {
    onCampoChange(key, value);
    clearErrorsForPrefix(key + '_error');
  };

  const sintomasActuales = splitValues(caracterizacion[sintomasKey]);

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm"><em>Xylella fastidiosa</em> - Clorosis de los cítricos</h6>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de hojas afectadas *</label>
        <input type="number" min="0" max="100" step="1" value={caracterizacion[hojasKey] || ''}
          onChange={(e) => handleChange(hojasKey, e.target.value)} className="border rounded px-3 py-2 w-full max-w-xs" required />
        {errores[`${hojasKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${hojasKey}_error`]}</p>}
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Síntomas observados *</label>
        {SINTOMAS_POR_ENFERMEDAD.xylella.map(sintoma => (
          <label key={sintoma} className="flex items-center text-sm">
            <input type="checkbox" value={sintoma} checked={sintomasActuales.includes(sintoma)}
              onChange={(e) => {
                const nuevos = toggleOptionWithNoAplica(caracterizacion[sintomasKey], sintoma, e.target.checked);
                handleChange(sintomasKey, joinValues(nuevos));
              }} className="mr-2" />
            {sintoma}
          </label>
        ))}
        {errores[`${sintomasKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${sintomasKey}_error`]}</p>}
      </div>
    </div>
  );
};

const PhytophthoraSection: React.FC<SectionProps> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange, errores, clearErrorsForPrefix }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_oomiceto_phytophthora`;
  const sintomasKey = `${prefix}_sintomas`;
  const afectacionKey = `${prefix}_afectacion`;

  const handleChange = (key: string, value: string) => {
    onCampoChange(key, value);
    clearErrorsForPrefix(key + '_error');
  };

  const sintomasActuales = splitValues(caracterizacion[sintomasKey]);

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm"><em>Phytophthora</em> sp. - Gomosis o pudrición radicular</h6>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de afectación (lesiones en collar/raíces) *</label>
        <input type="number" min="0" max="100" step="1" value={caracterizacion[afectacionKey] || ''}
          onChange={(e) => handleChange(afectacionKey, e.target.value)} className="border rounded px-3 py-2 w-full max-w-xs" required />
        {errores[`${afectacionKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${afectacionKey}_error`]}</p>}
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Síntomas observados *</label>
        {SINTOMAS_POR_ENFERMEDAD.phytophthora.map(sintoma => (
          <label key={sintoma} className="flex items-center text-sm">
            <input type="checkbox" value={sintoma} checked={sintomasActuales.includes(sintoma)}
              onChange={(e) => {
                const nuevos = toggleOptionWithNoAplica(caracterizacion[sintomasKey], sintoma, e.target.checked);
                handleChange(sintomasKey, joinValues(nuevos));
              }} className="mr-2" />
            {sintoma}
          </label>
        ))}
        {errores[`${sintomasKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${sintomasKey}_error`]}</p>}
      </div>
    </div>
  );
};

const CTVSection: React.FC<SectionProps> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange, errores, clearErrorsForPrefix }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_virus_ctv`;
  const sintomasKey = `${prefix}_sintomas`;
  const presenteKey = `${prefix}_presente`;
  const vectorKey = `${prefix}_vector`;
  const danoKey = `${prefix}_dano`;

  const handleChange = (key: string, value: string) => {
    onCampoChange(key, value);
    clearErrorsForPrefix(key + '_error');
  };

  const sintomasActuales = splitValues(caracterizacion[sintomasKey]);

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Virus de la Tristeza de los Cítricos (CTV)</h6>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">¿Hay presencia de síntomas de CTV? *</label>
        <div className="flex gap-4">
          {['Si', 'No'].map(op => (
            <label key={op} className="inline-flex items-center">
              <input type="radio" name={presenteKey} value={op} checked={caracterizacion[presenteKey] === op}
                onChange={(e) => handleChange(presenteKey, e.target.value)} className="mr-2" />
              {op}
            </label>
          ))}
        </div>
        {errores[`${presenteKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${presenteKey}_error`]}</p>}
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">¿Presencia del vector <em>Toxoptera citricidus</em>? *</label>
        <div className="flex gap-4">
          {['Si', 'No'].map(op => (
            <label key={op} className="inline-flex items-center">
              <input type="radio" name={vectorKey} value={op} checked={caracterizacion[vectorKey] === op}
                onChange={(e) => handleChange(vectorKey, e.target.value)} className="mr-2" />
              {op}
            </label>
          ))}
        </div>
        {errores[`${vectorKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${vectorKey}_error`]}</p>}
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de daño del virus CTV *</label>
        <input type="number" min="0" max="100" step="1" value={caracterizacion[danoKey] || ''}
          onChange={(e) => handleChange(danoKey, e.target.value)} className="border rounded px-3 py-2 w-full max-w-xs" required />
        {errores[`${danoKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${danoKey}_error`]}</p>}
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Síntomas observados *</label>
        {SINTOMAS_POR_ENFERMEDAD.ctv.map(sintoma => (
          <label key={sintoma} className="flex items-center text-sm">
            <input type="checkbox" value={sintoma} checked={sintomasActuales.includes(sintoma)}
              onChange={(e) => {
                const nuevos = toggleOptionWithNoAplica(caracterizacion[sintomasKey], sintoma, e.target.checked);
                handleChange(sintomasKey, joinValues(nuevos));
              }} className="mr-2" />
            {sintoma}
          </label>
        ))}
        {errores[`${sintomasKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${sintomasKey}_error`]}</p>}
      </div>
    </div>
  );
};

const OtraEnfermedadSection: React.FC<SectionProps> = ({ basePrefix, cuadrante, rama, caracterizacion, onCampoChange, errores, clearErrorsForPrefix }) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otra_enfermedad`;
  const activoKey = `${prefix}_activo`;
  const sintomasKey = `${prefix}_sintomas`;
  const agenteKey = `${prefix}_agente`;
  const fotoKey = `${prefix}_fotos`;

  const handleChange = (key: string, value: string) => {
    onCampoChange(key, value);
    clearErrorsForPrefix(key + '_error');
  };

  const isActive = caracterizacion[activoKey] === 'true';

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <label className="flex items-center mb-3">
        <input type="checkbox" checked={isActive} onChange={(e) => {
          const checked = e.target.checked;
          handleChange(activoKey, checked ? 'true' : 'false');
          if (!checked) {
            handleChange(sintomasKey, '');
            handleChange(agenteKey, '');
            handleChange(fotoKey, '');
          }
        }} className="mr-2" />
        <span className="text-sm font-medium text-gray-700">Registrar otra enfermedad no listada</span>
      </label>

      {isActive && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas de la enfermedad observada *</label>
            <textarea value={caracterizacion[sintomasKey] || ''} onChange={(e) => handleChange(sintomasKey, e.target.value)}
              className="border rounded px-3 py-2 w-full" rows={2} placeholder="Describa los síntomas" required />
            {errores[`${sintomasKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${sintomasKey}_error`]}</p>}
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Agente causal (si se conoce) *</label>
            <input type="text" value={caracterizacion[agenteKey] || ''} onChange={(e) => handleChange(agenteKey, e.target.value)}
              className="border rounded px-3 py-2 w-full" placeholder="Ej: Hongo, bacteria, etc." required />
            {errores[`${agenteKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${agenteKey}_error`]}</p>}
          </div>
          <RealFotosSection prefix={fotoKey} onCampoChange={onCampoChange} errores={errores} clearErrorsForPrefix={clearErrorsForPrefix} />
        </>
      )}
    </div>
  );
};

// ── CuadranteEnfermedades ───────────────────────────────────────────────────
interface CuadranteEnfermedadesProps {
  plantaIdx: number;
  cuadrante: number;
  rama: number;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
  onOpenImage: (imageName: string) => void;
  errores: Record<string, string>;
  clearErrorsForPrefix: (prefix: string) => void;
}

const CuadranteEnfermedades: React.FC<CuadranteEnfermedadesProps> = ({
  plantaIdx, cuadrante, rama, caracterizacion, onCampoChange, onOpenImage, errores, clearErrorsForPrefix
}) => {
  const basePrefix = `enfermedades_planta_${plantaIdx + 1}`;
  const quadrantPrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}`;
  const agentesKey = `${quadrantPrefix}_agentes`;
  const agentesSeleccionados = splitValues(caracterizacion[agentesKey]);

  const clearKeysStartingWith = (prefix: string, exceptKeys: string[] = []) => {
    Object.keys(caracterizacion).forEach(key => {
      if (key.startsWith(prefix) && !exceptKeys.includes(key)) {
        onCampoChange(key, '');
        clearErrorsForPrefix(key);
      }
    });
  };

  const handleAgenteToggle = (agente: string, checked: boolean) => {
    const current = splitValues(caracterizacion[agentesKey]);
    let nuevos: string[] = [];

    if (agente === 'no_aplica') {
      if (checked) {
        clearKeysStartingWith(quadrantPrefix, [agentesKey]);
        nuevos = ['no_aplica'];
      } else {
        nuevos = [];
      }
      onCampoChange(agentesKey, joinValues(nuevos));
      clearErrorsForPrefix(quadrantPrefix);
      return;
    }

    if (checked) {
      nuevos = current.filter(a => a !== 'no_aplica');
      if (!nuevos.includes(agente)) nuevos.push(agente);
    } else {
      nuevos = current.filter(a => a !== agente);
      clearKeysStartingWith(`${quadrantPrefix}_${agente}`);
    }
    onCampoChange(agentesKey, joinValues(nuevos));
    if (nuevos.length > 0) clearErrorsForPrefix(agentesKey + '_error');
  };

  const handleGroupNoAplica = (grupo: string, checked: boolean) => {
    const noAplicaKey = `${quadrantPrefix}_${grupo}_no_aplica`;
    if (checked) {
      clearKeysStartingWith(`${quadrantPrefix}_${grupo}_`, [noAplicaKey]);
      onCampoChange(noAplicaKey, 'true');
    } else {
      onCampoChange(noAplicaKey, '');
    }
    clearErrorsForPrefix(`${quadrantPrefix}_${grupo}`);
  };

  const handleDiseaseToggle = (grupo: string, enfermedadId: string, checked: boolean) => {
    const noAplicaKey = `${quadrantPrefix}_${grupo}_no_aplica`;
    const enfKey = `${quadrantPrefix}_${grupo}_${enfermedadId}_activo`;
    const diseasePrefix = `${quadrantPrefix}_${grupo}_${enfermedadId}`;

    if (checked && caracterizacion[noAplicaKey] === 'true') {
      onCampoChange(noAplicaKey, '');
    }
    if (checked) {
      onCampoChange(enfKey, 'true');
    } else {
      clearKeysStartingWith(diseasePrefix);
      onCampoChange(enfKey, '');
    }
  };

  const handleOtherToggle = (grupo: 'oomiceto' | 'virus', checked: boolean) => {
    const noAplicaKey = `${quadrantPrefix}_${grupo}_no_aplica`;
    const otherKey = `${quadrantPrefix}_${grupo}_otro`;
    const otherNameKey = `${quadrantPrefix}_${grupo}_otro_nombre`;

    if (checked && caracterizacion[noAplicaKey] === 'true') {
      onCampoChange(noAplicaKey, '');
    }
    onCampoChange(otherKey, checked ? 'true' : '');
    if (!checked) {
      onCampoChange(otherNameKey, '');
      clearErrorsForPrefix(`${quadrantPrefix}_${grupo}_otro`);
    }
  };

  const hongoNoAplica = caracterizacion[`${quadrantPrefix}_hongo_no_aplica`] === 'true';
  const bacteriaNoAplica = caracterizacion[`${quadrantPrefix}_bacteria_no_aplica`] === 'true';
  const oomicetoNoAplica = caracterizacion[`${quadrantPrefix}_oomiceto_no_aplica`] === 'true';
  const virusNoAplica = caracterizacion[`${quadrantPrefix}_virus_no_aplica`] === 'true';
  const nematodoNoAplica = caracterizacion[`${quadrantPrefix}_nematodo_no_aplica`] === 'true';

  return (
    <div className="ml-6 mb-6 p-4 border-l-4 border-blue-200 bg-gray-50 rounded">
      <h5 className="font-medium text-md text-gray-700 mb-3">Rama {rama} - Cuadrante {cuadrante}</h5>

      {/* Agentes causales */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Agente(s) causal de las enfermedades vistas en campo (Selección múltiple)</label>
        <div className="flex flex-wrap gap-4">
          {AGENTES.map(agente => (
            <label key={agente.value} className="inline-flex items-center">
              <input type="checkbox" checked={agentesSeleccionados.includes(agente.value)}
                onChange={(e) => handleAgenteToggle(agente.value, e.target.checked)} className="mr-2" />
              {agente.label}
            </label>
          ))}
          <label className="inline-flex items-center">
            <input type="checkbox" checked={agentesSeleccionados.includes('no_aplica')}
              onChange={(e) => handleAgenteToggle('no_aplica', e.target.checked)} className="mr-2" />
            No aplica
          </label>
        </div>
        {errores[`${agentesKey}_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${agentesKey}_error`]}</p>}
      </div>

      {/* Hongos */}
      {agentesSeleccionados.includes('hongo') && !agentesSeleccionados.includes('no_aplica') && (
        <div className="mb-4 border-l-2 border-green-300 pl-3">
          <h6 className="font-medium text-sm text-gray-700 mb-2">Enfermedades causadas por hongos</h6>
          {ENFERMEDADES_POR_AGENTE.hongo.map(enf => {
            const activo = caracterizacion[`${quadrantPrefix}_hongo_${enf.id}_activo`] === 'true';
            return (
              <div key={enf.id}>
                <div className="flex items-center gap-2 mb-1">
                  <label className="inline-flex items-center text-sm">
                    <input type="checkbox" checked={activo} onChange={(e) => handleDiseaseToggle('hongo', enf.id, e.target.checked)} className="mr-2" />
                    {enf.label}
                  </label>
                  <button type="button" onClick={() => onOpenImage(enf.image)} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">Ver imagen</button>
                </div>
                {activo && enf.id === 'antracnosis' && <AntracnosisSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} errores={errores} clearErrorsForPrefix={clearErrorsForPrefix} />}
                {activo && enf.id === 'mancha_grasienta' && <ManchaGrasientaSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} errores={errores} clearErrorsForPrefix={clearErrorsForPrefix} />}
              </div>
            );
          })}
          <label className="flex items-center text-sm mt-2">
            <input type="checkbox" checked={hongoNoAplica} onChange={(e) => handleGroupNoAplica('hongo', e.target.checked)} className="mr-2" />
            No aplica
          </label>
          {errores[`${quadrantPrefix}_hongo_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${quadrantPrefix}_hongo_error`]}</p>}
        </div>
      )}

      {/* Bacterias */}
      {agentesSeleccionados.includes('bacteria') && !agentesSeleccionados.includes('no_aplica') && (
        <div className="mb-4 border-l-2 border-blue-300 pl-3">
          <h6 className="font-medium text-sm text-gray-700 mb-2">Enfermedades causadas por bacterias</h6>
          {ENFERMEDADES_POR_AGENTE.bacteria.map(enf => {
            const activo = caracterizacion[`${quadrantPrefix}_bacteria_${enf.id}_activo`] === 'true';
            return (
              <div key={enf.id}>
                <div className="flex items-center gap-2 mb-1">
                  <label className="inline-flex items-center text-sm">
                    <input type="checkbox" checked={activo} onChange={(e) => handleDiseaseToggle('bacteria', enf.id, e.target.checked)} className="mr-2" />
                    {enf.label}
                  </label>
                  <button type="button" onClick={() => onOpenImage(enf.image)} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">Ver imagen</button>
                </div>
                {activo && enf.id === 'hlb' && <HLBSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} errores={errores} clearErrorsForPrefix={clearErrorsForPrefix} />}
                {activo && enf.id === 'xylella' && <XylellaSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} errores={errores} clearErrorsForPrefix={clearErrorsForPrefix} />}
              </div>
            );
          })}
          <label className="flex items-center text-sm mt-2">
            <input type="checkbox" checked={bacteriaNoAplica} onChange={(e) => handleGroupNoAplica('bacteria', e.target.checked)} className="mr-2" />
            No aplica
          </label>
          {errores[`${quadrantPrefix}_bacteria_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${quadrantPrefix}_bacteria_error`]}</p>}
        </div>
      )}

      {/* Oomicetos */}
      {agentesSeleccionados.includes('oomiceto') && !agentesSeleccionados.includes('no_aplica') && (
        <div className="mb-4 border-l-2 border-yellow-300 pl-3">
          <h6 className="font-medium text-sm text-gray-700 mb-2">Enfermedades causadas por oomicetos</h6>
          {ENFERMEDADES_POR_AGENTE.oomiceto.map(enf => {
            const activo = caracterizacion[`${quadrantPrefix}_oomiceto_${enf.id}_activo`] === 'true';
            return (
              <div key={enf.id}>
                <div className="flex items-center gap-2 mb-1">
                  <label className="inline-flex items-center text-sm">
                    <input type="checkbox" checked={activo} onChange={(e) => handleDiseaseToggle('oomiceto', enf.id, e.target.checked)} className="mr-2" />
                    {enf.label}
                  </label>
                  <button type="button" onClick={() => onOpenImage(enf.image)} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">Ver imagen</button>
                </div>
                {activo && enf.id === 'phytophthora' && <PhytophthoraSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} errores={errores} clearErrorsForPrefix={clearErrorsForPrefix} />}
              </div>
            );
          })}
          <label className="flex items-center text-sm mt-2">
            <input type="checkbox" checked={oomicetoNoAplica} onChange={(e) => handleGroupNoAplica('oomiceto', e.target.checked)} className="mr-2" />
            No aplica
          </label>
          <label className="flex items-center text-sm mt-2">
            <input type="checkbox" checked={caracterizacion[`${quadrantPrefix}_oomiceto_otro`] === 'true'} onChange={(e) => handleOtherToggle('oomiceto', e.target.checked)} className="mr-2" />
            Otro
          </label>
          {caracterizacion[`${quadrantPrefix}_oomiceto_otro`] === 'true' && (
            <div className="mt-2">
              <input type="text" value={caracterizacion[`${quadrantPrefix}_oomiceto_otro_nombre`] || ''} onChange={(e) => onCampoChange(`${quadrantPrefix}_oomiceto_otro_nombre`, e.target.value)} className="border rounded px-2 py-1 w-full text-sm" placeholder="Especifique otro oomiceto" />
            </div>
          )}
          {errores[`${quadrantPrefix}_oomiceto_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${quadrantPrefix}_oomiceto_error`]}</p>}
        </div>
      )}

      {/* Virus */}
      {agentesSeleccionados.includes('virus') && !agentesSeleccionados.includes('no_aplica') && (
        <div className="mb-4 border-l-2 border-purple-300 pl-3">
          <h6 className="font-medium text-sm text-gray-700 mb-2">Enfermedades causadas por virus</h6>
          {ENFERMEDADES_POR_AGENTE.virus.map(enf => {
            const activo = caracterizacion[`${quadrantPrefix}_virus_${enf.id}_activo`] === 'true';
            return (
              <div key={enf.id}>
                <div className="flex items-center gap-2 mb-1">
                  <label className="inline-flex items-center text-sm">
                    <input type="checkbox" checked={activo} onChange={(e) => handleDiseaseToggle('virus', enf.id, e.target.checked)} className="mr-2" />
                    {enf.label}
                  </label>
                  <button type="button" onClick={() => onOpenImage(enf.image)} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">Ver imagen</button>
                </div>
                {activo && enf.id === 'ctv' && <CTVSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} errores={errores} clearErrorsForPrefix={clearErrorsForPrefix} />}
              </div>
            );
          })}
          <label className="flex items-center text-sm mt-2">
            <input type="checkbox" checked={virusNoAplica} onChange={(e) => handleGroupNoAplica('virus', e.target.checked)} className="mr-2" />
            No aplica
          </label>
          <label className="flex items-center text-sm mt-2">
            <input type="checkbox" checked={caracterizacion[`${quadrantPrefix}_virus_otro`] === 'true'} onChange={(e) => handleOtherToggle('virus', e.target.checked)} className="mr-2" />
            Otro
          </label>
          {caracterizacion[`${quadrantPrefix}_virus_otro`] === 'true' && (
            <div className="mt-2">
              <input type="text" value={caracterizacion[`${quadrantPrefix}_virus_otro_nombre`] || ''} onChange={(e) => onCampoChange(`${quadrantPrefix}_virus_otro_nombre`, e.target.value)} className="border rounded px-2 py-1 w-full text-sm" placeholder="Especifique otro virus" />
            </div>
          )}
          {errores[`${quadrantPrefix}_virus_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${quadrantPrefix}_virus_error`]}</p>}
        </div>
      )}

      {/* Nematodos */}
      {agentesSeleccionados.includes('nematodo') && !agentesSeleccionados.includes('no_aplica') && (
        <div className="mb-4 border-l-2 border-orange-300 pl-3">
          <h6 className="font-medium text-sm text-gray-700 mb-2">Nematodos</h6>
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <label className="inline-flex items-center text-sm">
                <input type="checkbox" checked={caracterizacion[`${quadrantPrefix}_nematodo_presente`] === 'true'}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (checked && nematodoNoAplica) onCampoChange(`${quadrantPrefix}_nematodo_no_aplica`, '');
                    onCampoChange(`${quadrantPrefix}_nematodo_presente`, checked ? 'true' : '');
                    if (!checked) clearKeysStartingWith(`${quadrantPrefix}_nematodo_`);
                  }} className="mr-2" />
                Presencia de nematodos
              </label>
              <button type="button" onClick={() => onOpenImage(ENFERMEDADES_POR_AGENTE.nematodo[0].image)} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">Ver imagen</button>
            </div>
            {caracterizacion[`${quadrantPrefix}_nematodo_presente`] === 'true' && (
              <>
                <div className="mt-2">
                  <label className="block text-sm text-gray-600 mb-1">Posible nematodo *</label>
                  <select value={caracterizacion[`${quadrantPrefix}_nematodo_tipo`] || ''} onChange={(e) => {
                    if (nematodoNoAplica) onCampoChange(`${quadrantPrefix}_nematodo_no_aplica`, '');
                    onCampoChange(`${quadrantPrefix}_nematodo_tipo`, e.target.value);
                    if (e.target.value !== 'otro') onCampoChange(`${quadrantPrefix}_nematodo_otro_nombre`, '');
                  }} className="border rounded px-2 py-1 w-full text-sm">
                    <option value="">-- Seleccione --</option>
                    <option value="meloidogyne">Meloidogyne sp. / Tylenchulus sp.</option>
                    <option value="otro">Otro</option>
                  </select>
                  {errores[`${quadrantPrefix}_nematodo_tipo_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${quadrantPrefix}_nematodo_tipo_error`]}</p>}
                </div>
                {caracterizacion[`${quadrantPrefix}_nematodo_tipo`] === 'otro' && (
                  <div className="mt-2">
                    <input type="text" value={caracterizacion[`${quadrantPrefix}_nematodo_otro_nombre`] || ''} onChange={(e) => onCampoChange(`${quadrantPrefix}_nematodo_otro_nombre`, e.target.value)} className="border rounded px-2 py-1 w-full text-sm" placeholder="Especifique el nematodo" />
                  </div>
                )}
                {/* Síntomas en planta */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas observados en la planta *</label>
                  {['Clorosis general', 'Reducción de crecimiento', 'Marchitez con suelo húmedo', 'Frutos pequeños', 'Defoliación', 'Sin síntomas visibles'].map(sintoma => {
                    const key = `${quadrantPrefix}_nematodo_sintomas_planta`;
                    const actuales = splitValues(caracterizacion[key]);
                    return (
                      <label key={sintoma} className="flex items-center text-sm">
                        <input type="checkbox" value={sintoma} checked={actuales.includes(sintoma)} onChange={(e) => {
                          const nuevos = e.target.checked ? [...actuales, sintoma] : actuales.filter(s => s !== sintoma);
                          onCampoChange(key, joinValues(nuevos));
                        }} className="mr-2" />
                        {sintoma}
                      </label>
                    );
                  })}
                  <label className="flex items-center text-sm">
                    <input type="checkbox" checked={caracterizacion[`${quadrantPrefix}_nematodo_sintomas_planta_otro_activo`] === 'true'} onChange={(e) => onCampoChange(`${quadrantPrefix}_nematodo_sintomas_planta_otro_activo`, e.target.checked ? 'true' : '')} className="mr-2" />
                    Otro:
                  </label>
                  {caracterizacion[`${quadrantPrefix}_nematodo_sintomas_planta_otro_activo`] === 'true' && (
                    <input type="text" value={caracterizacion[`${quadrantPrefix}_nematodo_sintomas_planta_otro`] || ''} onChange={(e) => onCampoChange(`${quadrantPrefix}_nematodo_sintomas_planta_otro`, e.target.value)} className="border rounded px-2 py-1 w-full text-sm ml-6" placeholder="Especifique" />
                  )}
                  {errores[`${quadrantPrefix}_nematodo_sintomas_planta_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${quadrantPrefix}_nematodo_sintomas_planta_error`]}</p>}
                </div>
                {/* Síntomas en raíces */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas observados en raíces *</label>
                  {['Presencia de agallas o nudos', 'Raíces con aspecto "sucio" o necrosado', 'Pocas raíces absorbentes', 'Sin síntomas visibles'].map(sintoma => {
                    const key = `${quadrantPrefix}_nematodo_sintomas_raices`;
                    const actuales = splitValues(caracterizacion[key]);
                    return (
                      <label key={sintoma} className="flex items-center text-sm">
                        <input type="checkbox" value={sintoma} checked={actuales.includes(sintoma)} onChange={(e) => {
                          const nuevos = e.target.checked ? [...actuales, sintoma] : actuales.filter(s => s !== sintoma);
                          onCampoChange(key, joinValues(nuevos));
                        }} className="mr-2" />
                        {sintoma}
                      </label>
                    );
                  })}
                  <label className="flex items-center text-sm">
                    <input type="checkbox" checked={caracterizacion[`${quadrantPrefix}_nematodo_sintomas_raices_otro_activo`] === 'true'} onChange={(e) => onCampoChange(`${quadrantPrefix}_nematodo_sintomas_raices_otro_activo`, e.target.checked ? 'true' : '')} className="mr-2" />
                    Otro:
                  </label>
                  {caracterizacion[`${quadrantPrefix}_nematodo_sintomas_raices_otro_activo`] === 'true' && (
                    <input type="text" value={caracterizacion[`${quadrantPrefix}_nematodo_sintomas_raices_otro`] || ''} onChange={(e) => onCampoChange(`${quadrantPrefix}_nematodo_sintomas_raices_otro`, e.target.value)} className="border rounded px-2 py-1 w-full text-sm ml-6" placeholder="Especifique" />
                  )}
                  {errores[`${quadrantPrefix}_nematodo_sintomas_raices_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${quadrantPrefix}_nematodo_sintomas_raices_error`]}</p>}
                </div>
              </>
            )}
            <label className="flex items-center text-sm mt-3">
              <input type="checkbox" checked={nematodoNoAplica} onChange={(e) => {
                const checked = e.target.checked;
                if (checked) clearKeysStartingWith(`${quadrantPrefix}_nematodo_`, [`${quadrantPrefix}_nematodo_no_aplica`]);
                onCampoChange(`${quadrantPrefix}_nematodo_no_aplica`, checked ? 'true' : '');
              }} className="mr-2" />
              No aplica
            </label>
          </div>
          {errores[`${quadrantPrefix}_nematodo_error`] && <p className="text-red-600 text-xs mt-1">{errores[`${quadrantPrefix}_nematodo_error`]}</p>}
        </div>
      )}

      {/* Otra enfermedad */}
      <OtraEnfermedadSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} errores={errores} clearErrorsForPrefix={clearErrorsForPrefix} />
    </div>
  );
};

// ── PlantaEnfermedades ──────────────────────────────────────────────────────
interface PlantaEnfermedadesProps {
  index: number;
  planta: PlantaBase;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
  onOpenImage: (imageName: string) => void;
  errores: Record<string, string>;
  clearErrorsForPrefix: (prefix: string) => void;
}

const PlantaEnfermedades: React.FC<PlantaEnfermedadesProps> = ({ index, planta, caracterizacion, onCampoChange, onOpenImage, errores, clearErrorsForPrefix }) => {
  return (
    <div className="border rounded-lg p-4 mb-8 bg-white shadow-sm">
      <h4 className="font-semibold text-lg text-gray-800 mb-2">{planta.label} (Código: {planta.codigo})</h4>
      <p className="text-sm text-gray-500 mb-4">El árbol se divide en 4 cuadrantes. Seleccione una rama al azar de cada cuadrante y observe: daño en hojas, frutos, puntos de crecimiento, ramas, tronco y raíces.</p>
      {[1, 2, 3, 4].map(cuadrante => (
        <CuadranteEnfermedades key={`${planta.codigo}-cuadrante-${cuadrante}`} plantaIdx={index} cuadrante={cuadrante} rama={cuadrante}
          caracterizacion={caracterizacion} onCampoChange={onCampoChange} onOpenImage={onOpenImage} errores={errores} clearErrorsForPrefix={clearErrorsForPrefix} />
      ))}
    </div>
  );
};

// ── Componente principal con forwardRef y validación ────────────────────────
export const EnfermedadesSection = forwardRef<EnfermedadesSectionRef, EnfermedadesSectionProps>(
  ({ plantas, caracterizacion, onCampoChange }, ref) => {
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [errores, setErrores] = useState<Record<string, string>>({});

    const clearErrorsForPrefix = (prefix: string) => {
      setErrores(prev => {
        const newErrores = { ...prev };
        Object.keys(newErrores).forEach(key => {
          if (key.startsWith(prefix)) delete newErrores[key];
        });
        return newErrores;
      });
    };

    const validate = (): boolean => {
      const nuevosErrores: Record<string, string> = {};
      let isValid = true;

      plantas.forEach((planta, idx) => {
        const basePrefix = `enfermedades_planta_${idx + 1}`;
        for (let cuadrante = 1; cuadrante <= 4; cuadrante++) {
          const quadrantPrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}`;
          const agentesKey = `${quadrantPrefix}_agentes`;
          const agentes = splitValues(caracterizacion[agentesKey]);

          // Verificar si "Otra enfermedad" está activa en este cuadrante
          const otraActivo = caracterizacion[`${quadrantPrefix}_otra_enfermedad_activo`] === 'true';

          // Si no hay agentes seleccionados y no es "no_aplica", error (a menos que otraActivo sea true)
          if (agentes.length === 0 && !otraActivo) {
            nuevosErrores[`${agentesKey}_error`] = 'Debe seleccionar al menos un agente causal o "No aplica".';
            isValid = false;
            continue; // No seguir validando grupos si no hay agentes y tampoco otra enfermedad
          }

          // Si seleccionó "no_aplica" o "otra enfermedad" está activa, omitimos la validación de grupos
          if (agentes.includes('no_aplica') || otraActivo) continue;

          // Validar hongos
          if (agentes.includes('hongo')) {
            const hongoNoAplica = caracterizacion[`${quadrantPrefix}_hongo_no_aplica`] === 'true';
            const tieneAntracnosis = caracterizacion[`${quadrantPrefix}_hongo_antracnosis_activo`] === 'true';
            const tieneMancha = caracterizacion[`${quadrantPrefix}_hongo_mancha_grasienta_activo`] === 'true';
            if (!hongoNoAplica && !tieneAntracnosis && !tieneMancha) {
              nuevosErrores[`${quadrantPrefix}_hongo_error`] = 'Debe seleccionar al menos una enfermedad de hongo o marcar "No aplica".';
              isValid = false;
            } else {
              // Validar antracnosis
              if (tieneAntracnosis) {
                const hojasKey = `${quadrantPrefix}_hongo_antracnosis_hojas`;
                const sintomasKey = `${quadrantPrefix}_hongo_antracnosis_sintomas`;
                if (!caracterizacion[hojasKey] && caracterizacion[hojasKey] !== '0') {
                  nuevosErrores[`${hojasKey}_error`] = 'Campo obligatorio. Ingrese 0 si no hay.';
                  isValid = false;
                }
                if (!caracterizacion[sintomasKey]) {
                  nuevosErrores[`${sintomasKey}_error`] = 'Debe seleccionar al menos un síntoma.';
                  isValid = false;
                }
              }
              if (tieneMancha) {
                const hojasKey = `${quadrantPrefix}_hongo_mancha_grasienta_hojas`;
                const sintomasKey = `${quadrantPrefix}_hongo_mancha_grasienta_sintomas`;
                if (!caracterizacion[hojasKey] && caracterizacion[hojasKey] !== '0') {
                  nuevosErrores[`${hojasKey}_error`] = 'Campo obligatorio. Ingrese 0 si no hay.';
                  isValid = false;
                }
                if (!caracterizacion[sintomasKey]) {
                  nuevosErrores[`${sintomasKey}_error`] = 'Debe seleccionar al menos un síntoma.';
                  isValid = false;
                }
              }
            }
          }

          // Validar bacterias
          if (agentes.includes('bacteria')) {
            const bacteriaNoAplica = caracterizacion[`${quadrantPrefix}_bacteria_no_aplica`] === 'true';
            const tieneHLB = caracterizacion[`${quadrantPrefix}_bacteria_hlb_activo`] === 'true';
            const tieneXylella = caracterizacion[`${quadrantPrefix}_bacteria_xylella_activo`] === 'true';
            if (!bacteriaNoAplica && !tieneHLB && !tieneXylella) {
              nuevosErrores[`${quadrantPrefix}_bacteria_error`] = 'Debe seleccionar al menos una enfermedad de bacteria o marcar "No aplica".';
              isValid = false;
            } else {
              if (tieneHLB) {
                const hojasKey = `${quadrantPrefix}_bacteria_hlb_hojas`;
                const sintomasKey = `${quadrantPrefix}_bacteria_hlb_sintomas`;
                const vectorKey = `${quadrantPrefix}_bacteria_hlb_vector`;
                if (!caracterizacion[hojasKey] && caracterizacion[hojasKey] !== '0') {
                  nuevosErrores[`${hojasKey}_error`] = 'Campo obligatorio. Ingrese 0 si no hay.';
                  isValid = false;
                }
                if (!caracterizacion[sintomasKey]) {
                  nuevosErrores[`${sintomasKey}_error`] = 'Debe seleccionar al menos un síntoma.';
                  isValid = false;
                }
                if (!caracterizacion[vectorKey]) {
                  nuevosErrores[`${vectorKey}_error`] = 'Debe indicar si hay presencia del vector.';
                  isValid = false;
                }
              }
              if (tieneXylella) {
                const hojasKey = `${quadrantPrefix}_bacteria_xylella_hojas`;
                const sintomasKey = `${quadrantPrefix}_bacteria_xylella_sintomas`;
                if (!caracterizacion[hojasKey] && caracterizacion[hojasKey] !== '0') {
                  nuevosErrores[`${hojasKey}_error`] = 'Campo obligatorio. Ingrese 0 si no hay.';
                  isValid = false;
                }
                if (!caracterizacion[sintomasKey]) {
                  nuevosErrores[`${sintomasKey}_error`] = 'Debe seleccionar al menos un síntoma.';
                  isValid = false;
                }
              }
            }
          }

          // Validar oomicetos
          if (agentes.includes('oomiceto')) {
            const oomicetoNoAplica = caracterizacion[`${quadrantPrefix}_oomiceto_no_aplica`] === 'true';
            const tienePhytophthora = caracterizacion[`${quadrantPrefix}_oomiceto_phytophthora_activo`] === 'true';
            const tieneOtro = caracterizacion[`${quadrantPrefix}_oomiceto_otro`] === 'true';
            if (!oomicetoNoAplica && !tienePhytophthora && !tieneOtro) {
              nuevosErrores[`${quadrantPrefix}_oomiceto_error`] = 'Debe seleccionar al menos una enfermedad de oomiceto, "Otro" o marcar "No aplica".';
              isValid = false;
            }
            if (tienePhytophthora) {
              const afectacionKey = `${quadrantPrefix}_oomiceto_phytophthora_afectacion`;
              const sintomasKey = `${quadrantPrefix}_oomiceto_phytophthora_sintomas`;
              if (!caracterizacion[afectacionKey] && caracterizacion[afectacionKey] !== '0') {
                nuevosErrores[`${afectacionKey}_error`] = 'Campo obligatorio. Ingrese 0 si no hay.';
                isValid = false;
              }
              if (!caracterizacion[sintomasKey]) {
                nuevosErrores[`${sintomasKey}_error`] = 'Debe seleccionar al menos un síntoma.';
                isValid = false;
              }
            }
            if (tieneOtro && !caracterizacion[`${quadrantPrefix}_oomiceto_otro_nombre`]) {
              nuevosErrores[`${quadrantPrefix}_oomiceto_otro_error`] = 'Debe especificar el nombre del oomiceto.';
              isValid = false;
            }
          }

          // Validar virus
          if (agentes.includes('virus')) {
            const virusNoAplica = caracterizacion[`${quadrantPrefix}_virus_no_aplica`] === 'true';
            const tieneCTV = caracterizacion[`${quadrantPrefix}_virus_ctv_activo`] === 'true';
            const tieneOtro = caracterizacion[`${quadrantPrefix}_virus_otro`] === 'true';
            if (!virusNoAplica && !tieneCTV && !tieneOtro) {
              nuevosErrores[`${quadrantPrefix}_virus_error`] = 'Debe seleccionar al menos una enfermedad de virus, "Otro" o marcar "No aplica".';
              isValid = false;
            }
            if (tieneCTV) {
              const presenteKey = `${quadrantPrefix}_virus_ctv_presente`;
              const vectorKey = `${quadrantPrefix}_virus_ctv_vector`;
              const danoKey = `${quadrantPrefix}_virus_ctv_dano`;
              const sintomasKey = `${quadrantPrefix}_virus_ctv_sintomas`;
              if (!caracterizacion[presenteKey]) {
                nuevosErrores[`${presenteKey}_error`] = 'Debe indicar si hay presencia de síntomas.';
                isValid = false;
              }
              if (!caracterizacion[vectorKey]) {
                nuevosErrores[`${vectorKey}_error`] = 'Debe indicar si hay presencia del vector.';
                isValid = false;
              }
              if (!caracterizacion[danoKey] && caracterizacion[danoKey] !== '0') {
                nuevosErrores[`${danoKey}_error`] = 'Campo obligatorio. Ingrese 0 si no hay.';
                isValid = false;
              }
              if (!caracterizacion[sintomasKey]) {
                nuevosErrores[`${sintomasKey}_error`] = 'Debe seleccionar al menos un síntoma.';
                isValid = false;
              }
            }
            if (tieneOtro && !caracterizacion[`${quadrantPrefix}_virus_otro_nombre`]) {
              nuevosErrores[`${quadrantPrefix}_virus_otro_error`] = 'Debe especificar el nombre del virus.';
              isValid = false;
            }
          }

          // Validar nematodos
          if (agentes.includes('nematodo')) {
            const nematodoNoAplica = caracterizacion[`${quadrantPrefix}_nematodo_no_aplica`] === 'true';
            const tienePresente = caracterizacion[`${quadrantPrefix}_nematodo_presente`] === 'true';
            if (!nematodoNoAplica && !tienePresente) {
              nuevosErrores[`${quadrantPrefix}_nematodo_error`] = 'Debe indicar presencia de nematodos o marcar "No aplica".';
              isValid = false;
            }
            if (tienePresente) {
              const tipo = caracterizacion[`${quadrantPrefix}_nematodo_tipo`];
              if (!tipo) {
                nuevosErrores[`${quadrantPrefix}_nematodo_tipo_error`] = 'Debe seleccionar el tipo de nematodo.';
                isValid = false;
              }
              const sintomasPlanta = caracterizacion[`${quadrantPrefix}_nematodo_sintomas_planta`];
              if (!sintomasPlanta) {
                nuevosErrores[`${quadrantPrefix}_nematodo_sintomas_planta_error`] = 'Debe seleccionar al menos un síntoma en planta.';
                isValid = false;
              }
              const sintomasRaices = caracterizacion[`${quadrantPrefix}_nematodo_sintomas_raices`];
              if (!sintomasRaices) {
                nuevosErrores[`${quadrantPrefix}_nematodo_sintomas_raices_error`] = 'Debe seleccionar al menos un síntoma en raíces.';
                isValid = false;
              }
            }
          }
        }
      });

      // Validación de "Otra enfermedad" (ya se validan sus campos independientemente)
      // Nota: La validación de los campos de "otra enfermedad" se hace dentro de OtraEnfermedadSection,
      // pero también podemos agregar una validación global aquí si es necesario. Por ahora, confiamos en
      // que la sección muestra sus propios errores. Sin embargo, para que el formulario no permita
      // enviar si falta algún campo de "otra enfermedad", ya se incluye en la validación de la sección
      // porque esos campos tienen el atributo "required" y la función validate de cada subcomponente
      // no se llama explícitamente, pero el formulario padre llama a validate() de EnfermedadesSection
      // y aquí no estamos validando esos campos específicos. Para asegurar, deberíamos recorrer
      // los cuadrantes y si otraActivo está true, validar síntomas y agente. Lo añadimos:

      plantas.forEach((planta, idx) => {
        const basePrefix = `enfermedades_planta_${idx + 1}`;
        for (let cuadrante = 1; cuadrante <= 4; cuadrante++) {
          const quadrantPrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${cuadrante}`;
          const otraActivo = caracterizacion[`${quadrantPrefix}_otra_enfermedad_activo`] === 'true';
          if (otraActivo) {
            const sintomasKey = `${quadrantPrefix}_otra_enfermedad_sintomas`;
            const agenteKey = `${quadrantPrefix}_otra_enfermedad_agente`;
            if (!caracterizacion[sintomasKey]) {
              nuevosErrores[`${sintomasKey}_error`] = 'Debe describir los síntomas de la otra enfermedad.';
              isValid = false;
            }
            if (!caracterizacion[agenteKey]) {
              nuevosErrores[`${agenteKey}_error`] = 'Debe indicar el agente causal (aunque sea desconocido).';
              isValid = false;
            }
          }
        }
      });

      setErrores(nuevosErrores);
      if (!isValid) {
        toast.error('Por favor complete los campos obligatorios en la sección de Enfermedades.');
      }
      return isValid;
    };

    useImperativeHandle(ref, () => ({ validate }));

    const openImage = (imageName: string) => setModalImage(`/imgs/${imageName}`);
    const closeModal = () => setModalImage(null);

    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Monitoreo de Enfermedades</h2>
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
          <p className="text-sm text-gray-700">
            <span className="font-bold">Metodología de monitoreo:</span> Para cada árbol seleccionado, divida la copa en 4 cuadrantes. Seleccione una rama al azar de cada cuadrante. Observe: daño en hojas, frutos, puntos de crecimiento, ramas, tronco y raíces.
          </p>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Árboles seleccionados para monitoreo</h3>
        <p className="text-sm text-gray-600 mb-6">Se han generado {plantas.length} árbol(es) para monitoreo. Para cada uno, evalúe los 4 cuadrantes de forma independiente.</p>
        {plantas.map((planta, idx) => (
          <PlantaEnfermedades key={planta.codigo} index={idx} planta={planta} caracterizacion={caracterizacion} onCampoChange={onCampoChange} onOpenImage={openImage} errores={errores} clearErrorsForPrefix={clearErrorsForPrefix} />
        ))}
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700">
          <p className="font-medium mb-1">📝 Umbrales de acción:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-medium">Antracnosis y Mancha grasienta:</span> &gt;5% de árboles con síntomas activos</li>
            <li><span className="font-medium"><em>Xylella fastidiosa</em>:</span> Cualquier árbol positivo requiere manejo cuarentenario</li>
            <li><span className="font-medium"><em>Phytophthora</em>:</span> &gt;5% de árboles con lesiones activas</li>
            <li><span className="font-medium">CTV:</span> Cualquier árbol positivo requiere manejo cuarentenario</li>
          </ul>
        </div>
        <ImageModal imageUrl={modalImage} onClose={closeModal} />
      </div>
    );
  }
);