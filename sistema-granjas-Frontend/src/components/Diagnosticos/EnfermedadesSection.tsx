import React, { useState } from 'react';
import { PlantaBase } from '../types';

interface EnfermedadesSectionProps {
  plantas: PlantaBase[];
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

// Modal para mostrar imágenes (igual que en ArthropodSection)
const ImageModal: React.FC<{ imageUrl: string | null; onClose: () => void }> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-4 rounded-lg max-w-lg max-h-full overflow-auto" onClick={(e) => e.stopPropagation()}>
        <button className="float-right text-gray-600 hover:text-gray-900 text-xl font-bold" onClick={onClose}>×</button>
        <img src={imageUrl} alt="Vista previa" className="max-w-full h-auto" />
      </div>
    </div>
  );
};

// Constantes
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
  antracnosis: [
    'Manchas necróticas en hojas',
    'Lesiones oscuras en frutos',
    'Caída de flores o frutos',
    'Secamiento de brotes',
    'Sin síntomas',
    'No aplica',
  ],
  mancha_grasienta: [
    'Puntos negros en hojas',
    'Manchas grasientas',
    'Defoliación',
    'Sin síntomas',
    'No aplica',
  ],
  hlb: [
    'Amarillamiento irregular',
    'Frutos deformes',
    'Brotes cloróticos',
    'Presencia del vector Diaphorina citri',
    'Sin síntomas',
    'No aplica',
  ],
  xylella: [
    'Lesiones necróticas en envés de las hojas',
    'Lesiones cloróticas en el haz de las hojas',
    'Marchitez',
    'Reducción en el tamaño de los frutos',
    'Endurecimiento de la cáscara',
    'Sin síntomas',
    'No aplica',
  ],
  phytophthora: [
    'Exudado de goma',
    'Pudrición de cuello',
    'Raíces oscuras',
    'Sin síntomas',
    'No aplica',
  ],
  ctv: [
    'Aclaramiento de nervaduras en hojas',
    'Declive general',
    'Amarillamiento',
    'Sin síntomas',
    'No aplica',
  ],
};

// Subcomponente para Antracnosis (Hongo)
const AntracnosisSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_hongo_antracnosis`;
  const sintomasKey = `${prefix}_sintomas`;
  const sintomasActuales = caracterizacion[sintomasKey] ? caracterizacion[sintomasKey].split(',') : [];
  const hojasKey = `${prefix}_hojas`;

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">
        <em>Colletotrichum gloeosporioides</em> — Antracnosis
      </h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Síntomas: Manchas cloróticas irregulares, de bordes definidos con halo clorótico; coalescen, provocan quemado de ápices y defoliación cuando hay alta humedad. Sobre hojas y ramas afectadas pueden verse puntos/velos oscuros (masas de esporas) en tejido muerto.
        Umbral de acción: &gt;5% de árboles con síntomas activos.
      </p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de hojas afectadas *</label>
        <input
          type="number" min="0" max="100" step="1"
          value={caracterizacion[hojasKey] || ''}
          onChange={(e) => onCampoChange(hojasKey, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay)" required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia de la enfermedad, colocar 0</p>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Síntomas observados *</label>
        <div className="space-y-1">
          {SINTOMAS_POR_ENFERMEDAD.antracnosis.map((sintoma) => (
            <label key={sintoma} className="flex items-center text-sm">
              <input
                type="checkbox" value={sintoma}
                checked={sintomasActuales.includes(sintoma)}
                onChange={(e) => {
                  const nuevos = e.target.checked ? [...sintomasActuales, sintoma] : sintomasActuales.filter(s => s !== sintoma);
                  onCampoChange(sintomasKey, nuevos.join(','));
                }}
                className="mr-2"
              />
              {sintoma}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// Subcomponente para Mancha Grasienta (Hongo)
const ManchaGrasientaSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_hongo_mancha_grasienta`;
  const sintomasKey = `${prefix}_sintomas`;
  const sintomasActuales = caracterizacion[sintomasKey] ? caracterizacion[sintomasKey].split(',') : [];
  const hojasKey = `${prefix}_hojas`;

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">
        <em>Mycosphaerella citri</em> - Mancha grasienta de los cítricos
      </h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Síntomas: En el envés de hojas maduras, manchas irregulares café claro con zona clorótica; al avanzar, se oscurecen y toman apariencia grasienta.
        Umbral de acción: &gt;5% de árboles con lesiones activas.
      </p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de hojas afectadas *</label>
        <input
          type="number" min="0" max="100" step="1"
          value={caracterizacion[hojasKey] || ''}
          onChange={(e) => onCampoChange(hojasKey, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay)" required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia de la enfermedad, colocar 0</p>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Síntomas observados *</label>
        <div className="space-y-1">
          {SINTOMAS_POR_ENFERMEDAD.mancha_grasienta.map((sintoma) => (
            <label key={sintoma} className="flex items-center text-sm">
              <input
                type="checkbox" value={sintoma}
                checked={sintomasActuales.includes(sintoma)}
                onChange={(e) => {
                  const nuevos = e.target.checked ? [...sintomasActuales, sintoma] : sintomasActuales.filter(s => s !== sintoma);
                  onCampoChange(sintomasKey, nuevos.join(','));
                }}
                className="mr-2"
              />
              {sintoma}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// Subcomponente para HLB (Bacteria)
const HLBSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_bacteria_hlb`;
  const sintomasKey = `${prefix}_sintomas`;
  const sintomasActuales = caracterizacion[sintomasKey] ? caracterizacion[sintomasKey].split(',') : [];
  const hojasKey = `${prefix}_hojas`;
  const vectorKey = `${prefix}_vector`;

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Huanglongbing - HLB de los cítricos</h6>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          % de hojas afectadas (amarillamiento irregular, brotes cloróticos) *
        </label>
        <input
          type="number" min="0" max="100" step="1"
          value={caracterizacion[hojasKey] || ''}
          onChange={(e) => onCampoChange(hojasKey, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay)" required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia de la enfermedad, colocar 0</p>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Síntomas observados *</label>
        <div className="space-y-1">
          {SINTOMAS_POR_ENFERMEDAD.hlb.map((sintoma) => (
            <label key={sintoma} className="flex items-center text-sm">
              <input
                type="checkbox" value={sintoma}
                checked={sintomasActuales.includes(sintoma)}
                onChange={(e) => {
                  const nuevos = e.target.checked ? [...sintomasActuales, sintoma] : sintomasActuales.filter(s => s !== sintoma);
                  onCampoChange(sintomasKey, nuevos.join(','));
                }}
                className="mr-2"
              />
              {sintoma}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Hay presencia del vector <em>Diaphorina citri</em>? *
        </label>
        <div className="flex gap-4">
          {["Si", "No"].map((opcion) => (
            <label key={opcion} className="inline-flex items-center">
              <input
                type="radio" name={vectorKey} value={opcion}
                checked={caracterizacion[vectorKey] === opcion}
                onChange={(e) => onCampoChange(vectorKey, e.target.value)}
                className="mr-2"
              />
              {opcion}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// Subcomponente para Xylella (Bacteria)
const XylellaSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_bacteria_xylella`;
  const sintomasKey = `${prefix}_sintomas`;
  const sintomasActuales = caracterizacion[sintomasKey] ? caracterizacion[sintomasKey].split(',') : [];
  const hojasKey = `${prefix}_hojas`;

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">
        <em>Xylella fastidiosa</em> - Clorosis de los cítricos
      </h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Síntomas: Amarilleamiento irregular de hojas ("clorosis variegada"), marchitez y reducción del vigor.
        Umbral de acción: Presencia confirmada de un árbol positivo es umbral crítico para manejo de cuarentena.
      </p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de hojas afectadas *</label>
        <input
          type="number" min="0" max="100" step="1"
          value={caracterizacion[hojasKey] || ''}
          onChange={(e) => onCampoChange(hojasKey, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay)" required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia de la enfermedad, colocar 0</p>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Síntomas observados *</label>
        <div className="space-y-1">
          {SINTOMAS_POR_ENFERMEDAD.xylella.map((sintoma) => (
            <label key={sintoma} className="flex items-center text-sm">
              <input
                type="checkbox" value={sintoma}
                checked={sintomasActuales.includes(sintoma)}
                onChange={(e) => {
                  const nuevos = e.target.checked ? [...sintomasActuales, sintoma] : sintomasActuales.filter(s => s !== sintoma);
                  onCampoChange(sintomasKey, nuevos.join(','));
                }}
                className="mr-2"
              />
              {sintoma}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// Subcomponente para Phytophthora (Oomiceto)
const PhytophthoraSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_oomiceto_phytophthora`;
  const sintomasKey = `${prefix}_sintomas`;
  const sintomasActuales = caracterizacion[sintomasKey] ? caracterizacion[sintomasKey].split(',') : [];
  const afectacionKey = `${prefix}_afectacion`;

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">
        <em>Phytophthora</em> sp. - Gomosis o pudrición radicular
      </h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Síntomas: Goma exudativa de tronco; lesiones oscuras en collar y raíces, necrosis de tejidos, declive general del árbol.
        Umbral de acción: &gt;5% de árboles con lesiones activas.
      </p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          % de afectación (lesiones oscuras en collar, necrosis) *
        </label>
        <input
          type="number" min="0" max="100" step="1"
          value={caracterizacion[afectacionKey] || ''}
          onChange={(e) => onCampoChange(afectacionKey, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay)" required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia de la enfermedad, colocar 0</p>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Síntomas observados *</label>
        <div className="space-y-1">
          {SINTOMAS_POR_ENFERMEDAD.phytophthora.map((sintoma) => (
            <label key={sintoma} className="flex items-center text-sm">
              <input
                type="checkbox" value={sintoma}
                checked={sintomasActuales.includes(sintoma)}
                onChange={(e) => {
                  const nuevos = e.target.checked ? [...sintomasActuales, sintoma] : sintomasActuales.filter(s => s !== sintoma);
                  onCampoChange(sintomasKey, nuevos.join(','));
                }}
                className="mr-2"
              />
              {sintoma}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// Subcomponente para CTV (Virus)
const CTVSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_virus_ctv`;
  const sintomasKey = `${prefix}_sintomas`;
  const sintomasActuales = caracterizacion[sintomasKey] ? caracterizacion[sintomasKey].split(',') : [];
  const presenteKey = `${prefix}_presente`;
  const vectorKey = `${prefix}_vector`;
  const danoKey = `${prefix}_dano`;

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Virus de la Tristeza de los Cítricos (CTV)</h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Síntomas: Declive progresivo del árbol, heridas en corteza, amarilleo y caída de hojas, reducción de producción.
        Umbral de acción: Cualquier confirmación positiva requiere manejo cuarentenario.
      </p>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">¿Hay presencia de síntomas de CTV? *</label>
        <div className="flex gap-4">
          {["Si", "No"].map((opcion) => (
            <label key={opcion} className="inline-flex items-center">
              <input type="radio" name={presenteKey} value={opcion}
                checked={caracterizacion[presenteKey] === opcion}
                onChange={(e) => onCampoChange(presenteKey, e.target.value)}
                className="mr-2"
              />
              {opcion}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Hay presencia del vector <em>Toxoptera citricidus</em>? *
        </label>
        <div className="flex gap-4">
          {["Si", "No"].map((opcion) => (
            <label key={opcion} className="inline-flex items-center">
              <input type="radio" name={vectorKey} value={opcion}
                checked={caracterizacion[vectorKey] === opcion}
                onChange={(e) => onCampoChange(vectorKey, e.target.value)}
                className="mr-2"
              />
              {opcion}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">% de daño del virus CTV *</label>
        <input
          type="number" min="0" max="100" step="1"
          value={caracterizacion[danoKey] || ''}
          onChange={(e) => onCampoChange(danoKey, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay)" required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia de la enfermedad, colocar 0</p>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">Síntomas observados *</label>
        <div className="space-y-1">
          {SINTOMAS_POR_ENFERMEDAD.ctv.map((sintoma) => (
            <label key={sintoma} className="flex items-center text-sm">
              <input
                type="checkbox" value={sintoma}
                checked={sintomasActuales.includes(sintoma)}
                onChange={(e) => {
                  const nuevos = e.target.checked ? [...sintomasActuales, sintoma] : sintomasActuales.filter(s => s !== sintoma);
                  onCampoChange(sintomasKey, nuevos.join(','));
                }}
                className="mr-2"
              />
              {sintoma}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// Subcomponente para Otra Enfermedad
const OtraEnfermedadSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otra_enfermedad`;
  const activoKey = `${prefix}_activo`;
  const sintomasKey = `${prefix}_sintomas`;
  const agenteKey = `${prefix}_agente`;
  const fotoKey = `${prefix}_foto`;

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <label className="flex items-center mb-3">
        <input
          type="checkbox"
          checked={caracterizacion[activoKey] === 'true'}
          onChange={(e) => onCampoChange(activoKey, e.target.checked ? 'true' : 'false')}
          className="mr-2"
        />
        <span className="text-sm font-medium text-gray-700">Registrar otra enfermedad no listada</span>
      </label>

      {caracterizacion[activoKey] === 'true' && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas de la enfermedad observada</label>
            <textarea
              value={caracterizacion[sintomasKey] || ''}
              onChange={(e) => onCampoChange(sintomasKey, e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              rows={2}
              placeholder="Describa los síntomas observados"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Agente causal (si se conoce)</label>
            <input
              type="text"
              value={caracterizacion[agenteKey] || ''}
              onChange={(e) => onCampoChange(agenteKey, e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              placeholder="Ej: Hongo, bacteria, etc."
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto de los síntomas observados</label>
            <input
              type="text"
              value={caracterizacion[fotoKey] || ''}
              onChange={(e) => onCampoChange(fotoKey, e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              placeholder="Ruta de la foto (simulado)"
            />
            <p className="text-xs text-gray-500 mt-1">Sube una foto de los síntomas observados</p>
          </div>
        </>
      )}
    </div>
  );
};

// Cuadrante — ahora recibe onOpenImage
const CuadranteEnfermedades: React.FC<{
  plantaIdx: number;
  cuadrante: number;
  rama: number;
  planta: PlantaBase;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
  onOpenImage: (imageName: string) => void;
}> = ({ plantaIdx, cuadrante, rama, planta, caracterizacion, onCampoChange, onOpenImage }) => {
  const basePrefix = `enfermedades_planta_${plantaIdx + 1}`;

  const agentesKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_agentes`;
  const agentesSeleccionados = caracterizacion[agentesKey] ? caracterizacion[agentesKey].split(',') : [];

  const handleAgenteToggle = (agente: string, checked: boolean) => {
    let nuevos = [...agentesSeleccionados];
    if (checked) {
      if (!nuevos.includes(agente)) nuevos.push(agente);
    } else {
      nuevos = nuevos.filter(a => a !== agente);
      const agentePrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_${agente}`;
      Object.keys(caracterizacion).forEach(key => {
        if (key.startsWith(agentePrefix)) onCampoChange(key, '');
      });
    }
    onCampoChange(agentesKey, nuevos.join(','));
  };

  return (
    <div className="ml-6 mb-6 p-4 border-l-4 border-blue-200 bg-gray-50 rounded">
      <h5 className="font-medium text-md text-gray-700 mb-3">
        Rama {rama} - Cuadrante {cuadrante}
      </h5>

      {/* Agentes causales */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Agente(s) causal de las enfermedades vistas en campo (Selección múltiple)
        </label>
        <div className="flex flex-wrap gap-4">
          {AGENTES.map(agente => (
            <label key={agente.value} className="inline-flex items-center">
              <input
                type="checkbox"
                checked={agentesSeleccionados.includes(agente.value)}
                onChange={(e) => handleAgenteToggle(agente.value, e.target.checked)}
                className="mr-2"
              />
              {agente.label}
            </label>
          ))}
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={agentesSeleccionados.includes('no_aplica')}
              onChange={(e) => handleAgenteToggle('no_aplica', e.target.checked)}
              className="mr-2"
            />
            No aplica
          </label>
        </div>
      </div>

      {/* Hongos */}
      {agentesSeleccionados.includes('hongo') && (
        <div className="mb-4 border-l-2 border-green-300 pl-3">
          <h6 className="font-medium text-sm text-gray-700 mb-2">Enfermedades causadas por hongos</h6>
          <div className="mb-3">
            {ENFERMEDADES_POR_AGENTE.hongo.map(enf => {
              const enfKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_hongo_${enf.id}_activo`;
              const activo = caracterizacion[enfKey] === 'true';
              return (
                <div key={enf.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="inline-flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={activo}
                        onChange={(e) => onCampoChange(enfKey, e.target.checked ? 'true' : 'false')}
                        className="mr-2"
                      />
                      {enf.label}
                    </label>
                    <button
                      type="button"
                      onClick={() => onOpenImage(enf.image)}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                    >
                      Ver imagen
                    </button>
                  </div>
                  {activo && enf.id === 'antracnosis' && (
                    <AntracnosisSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
                  )}
                  {activo && enf.id === 'mancha_grasienta' && (
                    <ManchaGrasientaSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
                  )}
                </div>
              );
            })}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_hongo_no_aplica`] === 'true'}
                onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_hongo_no_aplica`, e.target.checked ? 'true' : 'false')}
                className="mr-2"
              />
              No aplica
            </label>
          </div>
        </div>
      )}

      {/* Bacterias */}
      {agentesSeleccionados.includes('bacteria') && (
        <div className="mb-4 border-l-2 border-blue-300 pl-3">
          <h6 className="font-medium text-sm text-gray-700 mb-2">Enfermedades causadas por bacterias</h6>
          <div className="mb-3">
            {ENFERMEDADES_POR_AGENTE.bacteria.map(enf => {
              const enfKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_bacteria_${enf.id}_activo`;
              const activo = caracterizacion[enfKey] === 'true';
              return (
                <div key={enf.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="inline-flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={activo}
                        onChange={(e) => onCampoChange(enfKey, e.target.checked ? 'true' : 'false')}
                        className="mr-2"
                      />
                      {enf.label}
                    </label>
                    <button
                      type="button"
                      onClick={() => onOpenImage(enf.image)}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                    >
                      Ver imagen
                    </button>
                  </div>
                  {activo && enf.id === 'hlb' && (
                    <HLBSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
                  )}
                  {activo && enf.id === 'xylella' && (
                    <XylellaSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
                  )}
                </div>
              );
            })}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_bacteria_no_aplica`] === 'true'}
                onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_bacteria_no_aplica`, e.target.checked ? 'true' : 'false')}
                className="mr-2"
              />
              No aplica
            </label>
          </div>
        </div>
      )}

      {/* Oomicetos */}
      {agentesSeleccionados.includes('oomiceto') && (
        <div className="mb-4 border-l-2 border-yellow-300 pl-3">
          <h6 className="font-medium text-sm text-gray-700 mb-2">Enfermedades causadas por oomicetos</h6>
          <div className="mb-3">
            {ENFERMEDADES_POR_AGENTE.oomiceto.map(enf => {
              const enfKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_oomiceto_${enf.id}_activo`;
              const activo = caracterizacion[enfKey] === 'true';
              return (
                <div key={enf.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="inline-flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={activo}
                        onChange={(e) => onCampoChange(enfKey, e.target.checked ? 'true' : 'false')}
                        className="mr-2"
                      />
                      {enf.label}
                    </label>
                    <button
                      type="button"
                      onClick={() => onOpenImage(enf.image)}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                    >
                      Ver imagen
                    </button>
                  </div>
                  {activo && enf.id === 'phytophthora' && (
                    <PhytophthoraSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
                  )}
                </div>
              );
            })}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_oomiceto_no_aplica`] === 'true'}
                onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_oomiceto_no_aplica`, e.target.checked ? 'true' : 'false')}
                className="mr-2"
              />
              No aplica
            </label>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_oomiceto_otro`] === 'true'}
                onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_oomiceto_otro`, e.target.checked ? 'true' : 'false')}
                className="mr-2"
              />
              Otro
            </label>
            {caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_oomiceto_otro`] === 'true' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_oomiceto_otro_nombre`] || ''}
                  onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_oomiceto_otro_nombre`, e.target.value)}
                  className="border rounded px-2 py-1 w-full text-sm"
                  placeholder="Especifique otro oomiceto"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Virus */}
      {agentesSeleccionados.includes('virus') && (
        <div className="mb-4 border-l-2 border-purple-300 pl-3">
          <h6 className="font-medium text-sm text-gray-700 mb-2">Enfermedades causadas por virus</h6>
          <div className="mb-3">
            {ENFERMEDADES_POR_AGENTE.virus.map(enf => {
              const enfKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_virus_${enf.id}_activo`;
              const activo = caracterizacion[enfKey] === 'true';
              return (
                <div key={enf.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="inline-flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={activo}
                        onChange={(e) => onCampoChange(enfKey, e.target.checked ? 'true' : 'false')}
                        className="mr-2"
                      />
                      {enf.label}
                    </label>
                    <button
                      type="button"
                      onClick={() => onOpenImage(enf.image)}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                    >
                      Ver imagen
                    </button>
                  </div>
                  {activo && enf.id === 'ctv' && (
                    <CTVSection basePrefix={basePrefix} cuadrante={cuadrante} rama={rama} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
                  )}
                </div>
              );
            })}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_virus_no_aplica`] === 'true'}
                onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_virus_no_aplica`, e.target.checked ? 'true' : 'false')}
                className="mr-2"
              />
              No aplica
            </label>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_virus_otro`] === 'true'}
                onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_virus_otro`, e.target.checked ? 'true' : 'false')}
                className="mr-2"
              />
              Otro
            </label>
            {caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_virus_otro`] === 'true' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_virus_otro_nombre`] || ''}
                  onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_virus_otro_nombre`, e.target.value)}
                  className="border rounded px-2 py-1 w-full text-sm"
                  placeholder="Especifique otro virus"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nematodos */}
      {agentesSeleccionados.includes('nematodo') && (
        <div className="mb-4 border-l-2 border-orange-300 pl-3">
          <h6 className="font-medium text-sm text-gray-700 mb-2">Nematodos</h6>
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <label className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_presente`] === 'true'}
                  onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_presente`, e.target.checked ? 'true' : 'false')}
                  className="mr-2"
                />
                Presencia de nematodos
              </label>
              <button
                type="button"
                onClick={() => onOpenImage(ENFERMEDADES_POR_AGENTE.nematodo[0].image)}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
              >
                Ver imagen
              </button>
            </div>

            {caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_presente`] === 'true' && (
              <>
                <div className="mt-2">
                  <label className="block text-sm text-gray-600 mb-1">Posible nematodo</label>
                  <select
                    value={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_tipo`] || ''}
                    onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_tipo`, e.target.value)}
                    className="border rounded px-2 py-1 w-full text-sm"
                  >
                    <option value="">-- Seleccione --</option>
                    <option value="meloidogyne">Meloidogyne sp. / Tylenchulus sp.</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                {caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_tipo`] === 'otro' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_otro_nombre`] || ''}
                      onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_otro_nombre`, e.target.value)}
                      className="border rounded px-2 py-1 w-full text-sm"
                      placeholder="Especifique el nematodo"
                    />
                  </div>
                )}

                {/* Síntomas en planta */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Síntomas observados en la planta (puede seleccionar varios) *
                  </label>
                  <div className="space-y-1">
                    {['Clorosis general', 'Reducción de crecimiento', 'Marchitez con suelo húmedo', 'Frutos pequeños', 'Defoliación', 'Sin síntomas visibles'].map((sintoma) => {
                      const key = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_sintomas_planta`;
                      const actuales = caracterizacion[key] ? caracterizacion[key].split(',') : [];
                      return (
                        <label key={sintoma} className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            value={sintoma}
                            checked={actuales.includes(sintoma)}
                            onChange={(e) => {
                              const nuevos = e.target.checked
                                ? [...actuales, sintoma]
                                : actuales.filter(s => s !== sintoma);
                              onCampoChange(key, nuevos.join(','));
                            }}
                            className="mr-2"
                          />
                          {sintoma}
                        </label>
                      );
                    })}
                    {/* Otro síntoma en planta */}
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_sintomas_planta_otro_activo`] === 'true'}
                        onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_sintomas_planta_otro_activo`, e.target.checked ? 'true' : 'false')}
                        className="mr-2"
                      />
                      Otro:
                    </label>
                    {caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_sintomas_planta_otro_activo`] === 'true' && (
                      <input
                        type="text"
                        value={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_sintomas_planta_otro`] || ''}
                        onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_sintomas_planta_otro`, e.target.value)}
                        className="border rounded px-2 py-1 w-full text-sm ml-6"
                        placeholder="Especifique el síntoma en planta"
                      />
                    )}
                  </div>
                </div>

                {/* Síntomas en raíces */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Síntomas observados en raíces *
                  </label>
                  <div className="space-y-1">
                    {['Presencia de agallas o nudos', 'Raíces con aspecto "sucio" o necrosado', 'Pocas raíces absorbentes', 'Sin síntomas visibles'].map((sintoma) => {
                      const key = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_sintomas_raices`;
                      const actuales = caracterizacion[key] ? caracterizacion[key].split(',') : [];
                      return (
                        <label key={sintoma} className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            value={sintoma}
                            checked={actuales.includes(sintoma)}
                            onChange={(e) => {
                              const nuevos = e.target.checked
                                ? [...actuales, sintoma]
                                : actuales.filter(s => s !== sintoma);
                              onCampoChange(key, nuevos.join(','));
                            }}
                            className="mr-2"
                          />
                          {sintoma}
                        </label>
                      );
                    })}
                    {/* Otro síntoma en raíces */}
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_sintomas_raices_otro_activo`] === 'true'}
                        onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_sintomas_raices_otro_activo`, e.target.checked ? 'true' : 'false')}
                        className="mr-2"
                      />
                      Otro:
                    </label>
                    {caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_sintomas_raices_otro_activo`] === 'true' && (
                      <input
                        type="text"
                        value={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_sintomas_raices_otro`] || ''}
                        onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_sintomas_raices_otro`, e.target.value)}
                        className="border rounded px-2 py-1 w-full text-sm ml-6"
                        placeholder="Especifique el síntoma en raíces"
                      />
                    )}
                  </div>
                </div>
              </>
            )}
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_no_aplica`] === 'true'}
                onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_nematodo_no_aplica`, e.target.checked ? 'true' : 'false')}
                className="mr-2"
              />
              No aplica
            </label>
          </div>
        </div>
      )}

      {/* Otra enfermedad */}
      <OtraEnfermedadSection
        basePrefix={basePrefix}
        cuadrante={cuadrante}
        rama={rama}
        caracterizacion={caracterizacion}
        onCampoChange={onCampoChange}
      />
    </div>
  );
};

// Planta — ahora pasa onOpenImage al cuadrante
const PlantaEnfermedades: React.FC<{
  index: number;
  planta: PlantaBase;
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
  onOpenImage: (imageName: string) => void;
}> = ({ index, planta, caracterizacion, onCampoChange, onOpenImage }) => {
  return (
    <div className="border rounded-lg p-4 mb-8 bg-white shadow-sm">
      <h4 className="font-semibold text-lg text-gray-800 mb-2">
        {planta.label} (Código: {planta.codigo})
      </h4>
      <p className="text-sm text-gray-500 mb-4">
        El árbol se divide en 4 cuadrantes. Seleccione una rama al azar de cada cuadrante y observe: daño en hojas, frutos, puntos de crecimiento, ramas, tronco y raíces.
      </p>
      {[1, 2, 3, 4].map((cuadrante) => (
        <CuadranteEnfermedades
          key={`${planta.codigo}-cuadrante-${cuadrante}`}
          plantaIdx={index}
          cuadrante={cuadrante}
          rama={cuadrante}
          planta={planta}
          caracterizacion={caracterizacion}
          onCampoChange={onCampoChange}
          onOpenImage={onOpenImage}
        />
      ))}
    </div>
  );
};

// Componente principal
export const EnfermedadesSection: React.FC<EnfermedadesSectionProps> = ({
  plantas,
  caracterizacion,
  onCampoChange,
}) => {
  const [modalImage, setModalImage] = useState<string | null>(null);

  const openImage = (imageName: string) => {
    setModalImage(`/imgs/${imageName}`);
  };

  const closeModal = () => setModalImage(null);

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Monitoreo de Enfermedades
      </h2>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <p className="text-sm text-gray-700">
          <span className="font-bold">Metodología de monitoreo:</span> Para cada árbol seleccionado, divida la copa en 4 cuadrantes.
          Seleccione una rama al azar de cada cuadrante. Observe: daño en hojas, frutos, puntos de crecimiento, ramas, tronco y raíces.
        </p>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Árboles seleccionados para monitoreo
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Se han generado {plantas.length} árbol(es) para monitoreo. Para cada uno, evalúe los 4 cuadrantes de forma independiente.
      </p>

      {plantas.map((planta, idx) => (
        <PlantaEnfermedades
          key={planta.codigo}
          index={idx}
          planta={planta}
          caracterizacion={caracterizacion}
          onCampoChange={onCampoChange}
          onOpenImage={openImage}
        />
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

      {/* Modal de imagen */}
      <ImageModal imageUrl={modalImage} onClose={closeModal} />
    </div>
  );
};