import React from 'react';
import { PlantaBase } from '../../types/diagnosticoTypes';

// Constantes (igual que antes)
const AGENTES = [
  { value: 'hongo', label: 'Hongo' },
  { value: 'bacteria', label: 'Bacteria' },
  { value: 'virus', label: 'Virus' },
  { value: 'nematodos', label: 'Nematodos' },
  { value: 'oomicetos', label: 'Oomicetos' },
];

const ENFERMEDADES_POR_AGENTE = {
  hongo: [
    { id: 'antracnosis', label: 'Colletotrichum gloeosporioides - Antracnosis' },
    { id: 'mancha_grasienta', label: 'Mycosphaerella citri - Mancha grasienta de los cítricos' },
  ],
  bacteria: [
    { id: 'hlb', label: 'Huanglongbing (HLB) - Enverdecimiento' },
    { id: 'xylella', label: 'Xylella fastidiosa - Clorosis de los cítricos' },
  ],
  oomicetos: [
    { id: 'phytophthora', label: 'Phytophthora sp. - Gomosis o pudrición radicular' },
  ],
  virus: [
    { id: 'ctv', label: 'Virus de la Tristeza de los Cítricos (CTV)' },
  ],
  nematodos: [
    { id: 'nematodos', label: 'Nematodos (Meloidogyne sp. / Tylenchulus sp.)' },
  ],
};

const SINTOMAS_POR_ENFERMEDAD = {
  antracnosis: [
    'Manchas necróticas en hojas',
    'Lesiones oscuras en frutos',
    'Caída de flores o frutos',
    'Secamiento de brotes',
    'Sin síntomas',
  ],
  mancha_grasienta: [
    'Puntos negros en hojas',
    'Manchas grasientas',
    'Defoliación',
    'Sin síntomas',
  ],
  hlb: [
    'Amarillamiento irregular',
    'Frutos deformes',
    'Brotes cloróticos',
    'Presencia del vector Diaphorina citri',
    'Sin síntomas',
  ],
  xylella: [
    'Lesiones necróticas en envés de las hojas',
    'Lesiones cloróticas en el haz de las hojas',
    'Marchitez',
    'Reducción en el tamaño de los frutos',
    'Endurecimiento de la cáscara',
    'Sin síntomas',
  ],
  phytophthora: [
    'Exudado de goma',
    'Pudrición de cuello',
    'Raíces oscuras',
  ],
  ctv: [
    'Aclaramiento de nervaduras en hojas',
    'Declive general',
    'Amarillamiento',
    'Sin síntomas',
  ],
  nematodos: {
    planta: [
      'Clorosis general',
      'Reducción de crecimiento',
      'Marchitez con suelo húmedo',
      'Frutos pequeños',
      'Defoliación',
      'Sin síntomas visibles',
    ],
    raiz: [
      'Presencia de agallas o nudos',
      'Raíces con aspecto “sucio” o necrosado',
      'Pocas raíces absorbentes',
      'Sin síntomas visibles',
    ],
  },
};

const POSIBLES_NEMATODOS = [
  { value: 'meloidogyne', label: 'Meloidogyne spp. – Nemátodos del nudo o agallas' },
  { value: 'tylenchulus', label: 'Tylenchulus sp – Nemátodo de la raíz cítrica' },
  { value: 'indiferenciado', label: 'No es posible diferenciar' },
  { value: 'otro', label: 'Otro' },
];

interface EnfermedadesSectionProps {
  plantas: PlantaBase[]; // plantas seleccionadas (con codigo y label)
  caracterizacion: Record<string, string>; // objeto plano con todos los valores
  onCampoChange: (campo: string, valor: string) => void;
}

export const EnfermedadesSection: React.FC<EnfermedadesSectionProps> = ({
  plantas,
  caracterizacion,
  onCampoChange,
}) => {
  // Prefijo para todas las claves de esta sección
  const prefix = 'enfermedades';

  // Obtener el agente seleccionado desde caracterizacion
  const agente = caracterizacion[`${prefix}_agente`] || '';

  // Obtener enfermedades seleccionadas (como array de ids)
  const enfermedadesSeleccionadas = caracterizacion[`${prefix}_enfermedades`]
    ? JSON.parse(caracterizacion[`${prefix}_enfermedades`] || '[]')
    : [];

  // Función auxiliar para actualizar un campo
  const handleChange = (clave: string, valor: any) => {
    // Si el valor es un array u objeto, lo convertimos a JSON para guardarlo como string
    const valorString = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
    onCampoChange(clave, valorString);
  };

  // Manejar cambio de agente
  const handleAgenteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoAgente = e.target.value;
    handleChange(`${prefix}_agente`, nuevoAgente);
    // Limpiar enfermedades seleccionadas al cambiar agente
    handleChange(`${prefix}_enfermedades`, []);
  };

  // Manejar toggle de enfermedad
  const handleEnfermedadToggle = (enfermedadId: string, checked: boolean) => {
    const nuevas = checked
      ? [...enfermedadesSeleccionadas, enfermedadId]
      : enfermedadesSeleccionadas.filter((id: string) => id !== enfermedadId);
    handleChange(`${prefix}_enfermedades`, nuevas);
  };

  // Manejar checkboxes de síntomas (múltiples)
  const handleSintomasChange = (enfermedadId: string, sintoma: string, checked: boolean) => {
    const clave = `${prefix}_${enfermedadId}_sintomas`;
    const current = caracterizacion[clave] ? JSON.parse(caracterizacion[clave]) : [];
    const nuevos = checked
      ? [...current, sintoma]
      : current.filter((s: string) => s !== sintoma);
    handleChange(clave, nuevos);
  };

  // Manejar campo de texto para "Otro"
  const handleOtroChange = (clave: string, valor: string) => {
    handleChange(clave, valor);
  };

  // Manejar fotos (archivos) - Nota: esto debería integrarse con el manejo de archivos del padre
  // Por simplicidad, aquí solo guardamos los nombres de los archivos o los manejamos de forma separada
  const handleFotosChange = (enfermedadId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Aquí deberías subir los archivos y obtener URLs, o guardar los File objects en un estado global
      // Por ahora, solo guardamos los nombres como ejemplo (no recomendado)
      const nombres = Array.from(files).map(f => f.name);
      handleChange(`${prefix}_${enfermedadId}_fotos`, nombres.join(', '));
    }
  };

  // Obtener lista de códigos de plantas para mostrar como ayuda
  const codigosValidos = plantas.map(p => p.codigo).join(', ');

  // Renderizar campos para una enfermedad
  const renderEnfermedadFields = (enfermedadId: string, enfermedadLabel: string) => {
    const baseClave = `${prefix}_${enfermedadId}`;
    const plantasClave = `${baseClave}_plantasAfectadas`;

    // Para nematodos
    if (enfermedadId === 'nematodos') {
      const sintomasPlantaClave = `${baseClave}_sintomasPlanta`;
      const sintomasRaizClave = `${baseClave}_sintomasRaiz`;
      const posibleNematodoClave = `${baseClave}_posibleNematodo`;
      const otroNematodoClave = `${baseClave}_otroNematodo`;

      // Valores actuales
      const plantasAfectadas = caracterizacion[plantasClave] || '';
      const sintomasPlanta = caracterizacion[sintomasPlantaClave]
        ? JSON.parse(caracterizacion[sintomasPlantaClave])
        : [];
      const sintomasRaiz = caracterizacion[sintomasRaizClave]
        ? JSON.parse(caracterizacion[sintomasRaizClave])
        : [];
      const posibleNematodo = caracterizacion[posibleNematodoClave] || '';
      const otroNematodo = caracterizacion[otroNematodoClave] || '';

      return (
        <div key={enfermedadId} className="border p-4 rounded-lg bg-white shadow-sm mb-4">
          <h4 className="font-semibold text-lg mb-2">{enfermedadLabel}</h4>

          {/* Plantas afectadas */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plantas afectadas por NEMATODOS
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Formato: SURCO - PLANTA (separados por coma). Ej: 4-6, 2-4
            </p>
            <input
              type="text"
              value={plantasAfectadas}
              onChange={(e) => handleChange(plantasClave, e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 4-6, 2-4"
            />
            {codigosValidos && (
              <p className="text-xs text-gray-400 mt-1">
                Códigos válidos: {codigosValidos}
              </p>
            )}
          </div>

          {/* Síntomas en la planta */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Síntomas observados en la planta
            </label>
            <div className="space-y-1">
              {SINTOMAS_POR_ENFERMEDAD.nematodos.planta.map((sintoma) => (
                <label key={sintoma} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sintomasPlanta.includes(sintoma)}
                    onChange={(e) => {
                      const nuevos = e.target.checked
                        ? [...sintomasPlanta, sintoma]
                        : sintomasPlanta.filter((s: string) => s !== sintoma);
                      handleChange(sintomasPlantaClave, nuevos);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{sintoma}</span>
                </label>
              ))}
            </div>
            <div className="mt-2">
              <label className="block text-sm text-gray-600">Otro (especifique)</label>
              <input
                type="text"
                value={caracterizacion[`${baseClave}_otroSintomaPlanta`] || ''}
                onChange={(e) => handleChange(`${baseClave}_otroSintomaPlanta`, e.target.value)}
                className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Otro síntoma"
              />
            </div>
          </div>

          {/* Síntomas en raíces */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Síntomas observados en raíces
            </label>
            <div className="space-y-1">
              {SINTOMAS_POR_ENFERMEDAD.nematodos.raiz.map((sintoma) => (
                <label key={sintoma} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sintomasRaiz.includes(sintoma)}
                    onChange={(e) => {
                      const nuevos = e.target.checked
                        ? [...sintomasRaiz, sintoma]
                        : sintomasRaiz.filter((s: string) => s !== sintoma);
                      handleChange(sintomasRaizClave, nuevos);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{sintoma}</span>
                </label>
              ))}
            </div>
            <div className="mt-2">
              <label className="block text-sm text-gray-600">Otro (especifique)</label>
              <input
                type="text"
                value={caracterizacion[`${baseClave}_otroSintomaRaiz`] || ''}
                onChange={(e) => handleChange(`${baseClave}_otroSintomaRaiz`, e.target.value)}
                className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Otro síntoma en raíces"
              />
            </div>
          </div>

          {/* Posible nematodo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Según los síntomas, el posible nematodo es:
            </label>
            <select
              value={posibleNematodo}
              onChange={(e) => handleChange(posibleNematodoClave, e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleccione --</option>
              {POSIBLES_NEMATODOS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {posibleNematodo === 'otro' && (
              <input
                type="text"
                value={otroNematodo}
                onChange={(e) => handleChange(otroNematodoClave, e.target.value)}
                className="border rounded px-3 py-2 w-full mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Especifique otro nematodo"
              />
            )}
          </div>

          {/* Fotos */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fotos tomadas en campo de síntomas
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFotosChange(enfermedadId, e)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-400 mt-1">Hasta 5 archivos, máximo 10 MB cada uno.</p>
          </div>
        </div>
      );
    }

    // Para enfermedades con síntomas simples
    const sintomas = SINTOMAS_POR_ENFERMEDAD[enfermedadId as keyof typeof SINTOMAS_POR_ENFERMEDAD];
    if (Array.isArray(sintomas)) {
      const plantasAfectadas = caracterizacion[plantasClave] || '';
      const sintomasSeleccionados = caracterizacion[`${baseClave}_sintomas`]
        ? JSON.parse(caracterizacion[`${baseClave}_sintomas`])
        : [];

      return (
        <div key={enfermedadId} className="border p-4 rounded-lg bg-white shadow-sm mb-4">
          <h4 className="font-semibold text-lg mb-2">{enfermedadLabel}</h4>

          {/* Plantas afectadas */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plantas afectadas por {enfermedadLabel}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Formato: SURCO - PLANTA - # HOJAS AFECTADAS (separados por coma). Ej: 4-6-2 Hojas afectadas, 2-4-4 Hojas afectadas
            </p>
            <input
              type="text"
              value={plantasAfectadas}
              onChange={(e) => handleChange(plantasClave, e.target.value)}
              className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 4-6-2 Hojas afectadas, 2-4-4 Hojas afectadas"
            />
            {codigosValidos && (
              <p className="text-xs text-gray-400 mt-1">
                Códigos válidos: {codigosValidos}
              </p>
            )}
          </div>

          {/* Síntomas */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Síntomas observados
            </label>
            <div className="space-y-1">
              {sintomas.map((sintoma) => (
                <label key={sintoma} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sintomasSeleccionados.includes(sintoma)}
                    onChange={(e) => {
                      const nuevos = e.target.checked
                        ? [...sintomasSeleccionados, sintoma]
                        : sintomasSeleccionados.filter((s: string) => s !== sintoma);
                      handleChange(`${baseClave}_sintomas`, nuevos);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{sintoma}</span>
                </label>
              ))}
            </div>
            <div className="mt-2">
              <label className="block text-sm text-gray-600">Otro (especifique)</label>
              <input
                type="text"
                value={caracterizacion[`${baseClave}_otro`] || ''}
                onChange={(e) => handleChange(`${baseClave}_otro`, e.target.value)}
                className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Otro síntoma"
              />
            </div>
          </div>

          {/* Campo adicional para HLB */}
          {enfermedadId === 'hlb' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Hay presencia del vector Diaphorina citri en el cultivo?
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`${baseClave}_vector`}
                    value="si"
                    checked={caracterizacion[`${baseClave}_vector`] === 'si'}
                    onChange={(e) => handleChange(`${baseClave}_vector`, e.target.value)}
                    className="mr-1"
                  />
                  Sí
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`${baseClave}_vector`}
                    value="no"
                    checked={caracterizacion[`${baseClave}_vector`] === 'no'}
                    onChange={(e) => handleChange(`${baseClave}_vector`, e.target.value)}
                    className="mr-1"
                  />
                  No
                </label>
              </div>
            </div>
          )}

          {/* Fotos */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fotos tomadas en campo de síntomas
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFotosChange(enfermedadId, e)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-400 mt-1">Hasta 5 archivos, máximo 10 MB cada uno.</p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Monitoreo de Enfermedades en Cítricos
      </h2>

      {/* Selector de agente causal */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Agente(s) causal de las enfermedades vistas en campo *
        </label>
        <select
          value={agente}
          onChange={handleAgenteChange}
          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">-- Seleccione un agente --</option>
          {AGENTES.map(a => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      {/* Enfermedades según agente */}
      {agente && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enfermedades monitoreadas en campo {
              agente === 'hongo' ? 'causadas por hongos' :
              agente === 'bacteria' ? 'causadas por bacterias' :
              agente === 'virus' ? 'causadas por virus' :
              agente === 'nematodos' ? 'causadas por nematodos' :
              agente === 'oomicetos' ? 'causadas por oomicetos' : ''
            }
          </label>
          <div className="space-y-2">
            {ENFERMEDADES_POR_AGENTE[agente as keyof typeof ENFERMEDADES_POR_AGENTE]?.map(enf => (
              <label key={enf.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={enfermedadesSeleccionadas.includes(enf.id)}
                  onChange={(e) => handleEnfermedadToggle(enf.id, e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">{enf.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Campos para cada enfermedad seleccionada */}
      {enfermedadesSeleccionadas.map((enfermedadId: string) => {
        const enfermedad = ENFERMEDADES_POR_AGENTE[agente as keyof typeof ENFERMEDADES_POR_AGENTE]?.find(e => e.id === enfermedadId);
        if (!enfermedad) return null;
        return renderEnfermedadFields(enfermedadId, enfermedad.label);
      })}
    </div>
  );
};