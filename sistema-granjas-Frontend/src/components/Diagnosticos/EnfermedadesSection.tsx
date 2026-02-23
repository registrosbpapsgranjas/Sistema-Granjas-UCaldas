import React from 'react';
import { PlantaBase } from '../types/index';

// Constantes
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
  const prefix = 'enfermedades';

  // Función auxiliar para actualizar un campo (maneja arrays/objetos como JSON)
  const handleChange = (clave: string, valor: any) => {
    const valorString = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
    onCampoChange(clave, valorString);
  };

  // Obtener agentes seleccionados para una planta
  const getAgentesPlanta = (codigo: string): string[] => {
    const key = `${prefix}_${codigo}_agentes`;
    return caracterizacion[key] ? JSON.parse(caracterizacion[key]) : [];
  };

  // Obtener enfermedades seleccionadas para una planta y agente
  const getEnfermedadesPlantaAgente = (codigo: string, agente: string): string[] => {
    const key = `${prefix}_${codigo}_${agente}_enfermedades`;
    return caracterizacion[key] ? JSON.parse(caracterizacion[key]) : [];
  };

  // Manejar toggle de agente para una planta
  const handleAgenteToggle = (codigo: string, agente: string, checked: boolean) => {
    const key = `${prefix}_${codigo}_agentes`;
    const actuales = getAgentesPlanta(codigo);
    const nuevos = checked
      ? [...actuales, agente]
      : actuales.filter((a: string) => a !== agente);
    handleChange(key, nuevos);

    // Si se deselecciona un agente, limpiar todas las enfermedades y datos asociados
    if (!checked) {
      // Eliminar todas las claves que comiencen con `${prefix}_${codigo}_${agente}_`
      Object.keys(caracterizacion).forEach(k => {
        if (k.startsWith(`${prefix}_${codigo}_${agente}_`)) {
          // No podemos eliminar directamente de caracterizacion, pero podemos setear a vacío?
          // onCampoChange(k, ''); // Esto dejaría claves vacías, mejor no hacer nada por ahora
          // Nota: Como caracterizacion es un objeto controlado por el padre, no podemos eliminar propiedades directamente.
          // En su lugar, podemos setearlas a vacío o a un valor por defecto.
          handleChange(k, '');
        }
      });
    }
  };

  // Manejar toggle de enfermedad para una planta y agente
  const handleEnfermedadToggle = (codigo: string, agente: string, enfermedadId: string, checked: boolean) => {
    const key = `${prefix}_${codigo}_${agente}_enfermedades`;
    const actuales = getEnfermedadesPlantaAgente(codigo, agente);
    const nuevos = checked
      ? [...actuales, enfermedadId]
      : actuales.filter((e: string) => e !== enfermedadId);
    handleChange(key, nuevos);

    // Si se deselecciona una enfermedad, limpiar sus campos específicos
    if (!checked) {
      const baseKey = `${prefix}_${codigo}_${agente}_${enfermedadId}`;
      // Eliminar todas las claves que comiencen con baseKey + '_'
      Object.keys(caracterizacion).forEach(k => {
        if (k.startsWith(baseKey + '_')) {
          handleChange(k, '');
        }
      });
    }
  };

  // Renderizar campos para una enfermedad específica en una planta
  const renderEnfermedadFields = (codigo: string, agente: string, enfermedadId: string, enfermedadLabel: string) => {
    const baseKey = `${prefix}_${codigo}_${agente}_${enfermedadId}`;

    // Campos comunes
    const hojasKey = `${baseKey}_hojas`; // para enfermedades que requieren número de hojas
    const presenteKey = `${baseKey}_presente`; // para enfermedades que solo requieren presencia (check)
    const sintomasKey = `${baseKey}_sintomas`;
    const otroKey = `${baseKey}_otro`;
    const vectorKey = `${baseKey}_vector`; // para HLB

    // Valores actuales
    const hojas = caracterizacion[hojasKey] || '';
    const presente = caracterizacion[presenteKey] === 'true';
    const sintomas = caracterizacion[sintomasKey] ? JSON.parse(caracterizacion[sintomasKey]) : [];
    const otro = caracterizacion[otroKey] || '';
    const vector = caracterizacion[vectorKey] || '';

    // Definir qué tipo de campos mostrar según la enfermedad
    if (enfermedadId === 'nematodos') {
      // Nematodos tiene estructura compleja
      const sintomasPlantaKey = `${baseKey}_sintomasPlanta`;
      const sintomasRaizKey = `${baseKey}_sintomasRaiz`;
      const posibleNematodoKey = `${baseKey}_posibleNematodo`;
      const otroNematodoKey = `${baseKey}_otroNematodo`;

      const sintomasPlanta = caracterizacion[sintomasPlantaKey] ? JSON.parse(caracterizacion[sintomasPlantaKey]) : [];
      const sintomasRaiz = caracterizacion[sintomasRaizKey] ? JSON.parse(caracterizacion[sintomasRaizKey]) : [];
      const posibleNematodo = caracterizacion[posibleNematodoKey] || '';
      const otroNematodo = caracterizacion[otroNematodoKey] || '';

      return (
        <div key={enfermedadId} className="ml-4 mt-2 p-3 border-l-2 border-gray-300">
          <h5 className="font-medium text-sm text-gray-700 mb-2">{enfermedadLabel}</h5>

          {/* Checkbox de presencia (ya que es por planta) */}
          <div className="mb-2">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={presente}
                onChange={(e) => handleChange(presenteKey, e.target.checked)}
                className="mr-2"
              />
              <span>¿Presente en esta planta?</span>
            </label>
          </div>

          {presente && (
            <>
              {/* Síntomas en la planta */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-600 mb-1">Síntomas en la planta</label>
                <div className="space-y-1">
                  {SINTOMAS_POR_ENFERMEDAD.nematodos.planta.map((sintoma) => (
                    <label key={sintoma} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={sintomasPlanta.includes(sintoma)}
                        onChange={(e) => {
                          const nuevos = e.target.checked
                            ? [...sintomasPlanta, sintoma]
                            : sintomasPlanta.filter((s: string) => s !== sintoma);
                          handleChange(sintomasPlantaKey, nuevos);
                        }}
                        className="mr-2"
                      />
                      {sintoma}
                    </label>
                  ))}
                </div>
                <div className="mt-1">
                  <input
                    type="text"
                    value={caracterizacion[`${baseKey}_otroSintomaPlanta`] || ''}
                    onChange={(e) => handleChange(`${baseKey}_otroSintomaPlanta`, e.target.value)}
                    className="border rounded px-2 py-1 w-full text-sm"
                    placeholder="Otro síntoma en planta"
                  />
                </div>
              </div>

              {/* Síntomas en raíces */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-600 mb-1">Síntomas en raíces</label>
                <div className="space-y-1">
                  {SINTOMAS_POR_ENFERMEDAD.nematodos.raiz.map((sintoma) => (
                    <label key={sintoma} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={sintomasRaiz.includes(sintoma)}
                        onChange={(e) => {
                          const nuevos = e.target.checked
                            ? [...sintomasRaiz, sintoma]
                            : sintomasRaiz.filter((s: string) => s !== sintoma);
                          handleChange(sintomasRaizKey, nuevos);
                        }}
                        className="mr-2"
                      />
                      {sintoma}
                    </label>
                  ))}
                </div>
                <div className="mt-1">
                  <input
                    type="text"
                    value={caracterizacion[`${baseKey}_otroSintomaRaiz`] || ''}
                    onChange={(e) => handleChange(`${baseKey}_otroSintomaRaiz`, e.target.value)}
                    className="border rounded px-2 py-1 w-full text-sm"
                    placeholder="Otro síntoma en raíz"
                  />
                </div>
              </div>

              {/* Posible nematodo */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-600 mb-1">Posible nematodo</label>
                <select
                  value={posibleNematodo}
                  onChange={(e) => handleChange(posibleNematodoKey, e.target.value)}
                  className="border rounded px-2 py-1 w-full text-sm"
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
                    onChange={(e) => handleChange(otroNematodoKey, e.target.value)}
                    className="border rounded px-2 py-1 w-full mt-1 text-sm"
                    placeholder="Especifique otro nematodo"
                  />
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    // Enfermedades que requieren número de hojas (la mayoría)
    if (['antracnosis', 'mancha_grasienta', 'hlb', 'xylella', 'ctv'].includes(enfermedadId)) {
      return (
        <div key={enfermedadId} className="ml-4 mt-2 p-3 border-l-2 border-gray-300">
          <h5 className="font-medium text-sm text-gray-700 mb-2">{enfermedadLabel}</h5>
          <div className="mb-2">
            <label className="block text-sm text-gray-600">Número de hojas afectadas</label>
            <input
              type="number"
              min="0"
              value={hojas}
              onChange={(e) => handleChange(hojasKey, e.target.value)}
              className="border rounded px-2 py-1 w-32 text-sm"
              placeholder="0"
            />
          </div>

          {/* Síntomas */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">Síntomas observados</label>
            <div className="space-y-1">
              {SINTOMAS_POR_ENFERMEDAD[enfermedadId as keyof typeof SINTOMAS_POR_ENFERMEDAD]?.map((sintoma: string) => (
                <label key={sintoma} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={sintomas.includes(sintoma)}
                    onChange={(e) => {
                      const nuevos = e.target.checked
                        ? [...sintomas, sintoma]
                        : sintomas.filter((s: string) => s !== sintoma);
                      handleChange(sintomasKey, nuevos);
                    }}
                    className="mr-2"
                  />
                  {sintoma}
                </label>
              ))}
            </div>
            <div className="mt-1">
              <input
                type="text"
                value={otro}
                onChange={(e) => handleChange(otroKey, e.target.value)}
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="Otro síntoma"
              />
            </div>
          </div>

          {/* Campo adicional para HLB */}
          {enfermedadId === 'hlb' && (
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Vector Diaphorina citri</label>
              <div className="flex space-x-4">
                <label className="flex items-center text-sm">
                  <input
                    type="radio"
                    name={`${baseKey}_vector`}
                    value="si"
                    checked={vector === 'si'}
                    onChange={(e) => handleChange(vectorKey, e.target.value)}
                    className="mr-1"
                  />
                  Sí
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="radio"
                    name={`${baseKey}_vector`}
                    value="no"
                    checked={vector === 'no'}
                    onChange={(e) => handleChange(vectorKey, e.target.value)}
                    className="mr-1"
                  />
                  No
                </label>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Para phytophthora (oomicetos) que solo requiere presencia y síntomas
    if (enfermedadId === 'phytophthora') {
      return (
        <div key={enfermedadId} className="ml-4 mt-2 p-3 border-l-2 border-gray-300">
          <h5 className="font-medium text-sm text-gray-700 mb-2">{enfermedadLabel}</h5>
          <div className="mb-2">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={presente}
                onChange={(e) => handleChange(presenteKey, e.target.checked)}
                className="mr-2"
              />
              <span>¿Presente en esta planta?</span>
            </label>
          </div>

          {presente && (
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Síntomas observados</label>
              <div className="space-y-1">
                {SINTOMAS_POR_ENFERMEDAD.phytophthora.map((sintoma) => (
                  <label key={sintoma} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={sintomas.includes(sintoma)}
                      onChange={(e) => {
                        const nuevos = e.target.checked
                          ? [...sintomas, sintoma]
                          : sintomas.filter((s: string) => s !== sintoma);
                        handleChange(sintomasKey, nuevos);
                      }}
                      className="mr-2"
                    />
                    {sintoma}
                  </label>
                ))}
              </div>
              <div className="mt-1">
                <input
                  type="text"
                  value={otro}
                  onChange={(e) => handleChange(otroKey, e.target.value)}
                  className="border rounded px-2 py-1 w-full text-sm"
                  placeholder="Otro síntoma"
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Monitoreo de Enfermedades por Planta
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Para cada planta, seleccione los agentes causales observados y luego las enfermedades específicas.
      </p>

      {plantas.map((planta) => {
        const codigo = planta.codigo;
        const agentesSeleccionados = getAgentesPlanta(codigo);

        return (
          <div key={codigo} className="border rounded-lg p-4 mb-6 bg-white shadow-sm">
            <h3 className="font-semibold text-lg text-gray-800 mb-3">
              {planta.label} (Código: {codigo})
            </h3>

            {/* Selector de agentes (múltiple) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agentes causales presentes *
              </label>
              <div className="flex flex-wrap gap-4">
                {AGENTES.map(agente => (
                  <label key={agente.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={agentesSeleccionados.includes(agente.value)}
                      onChange={(e) => handleAgenteToggle(codigo, agente.value, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">{agente.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Por cada agente seleccionado, mostrar sus enfermedades */}
            {agentesSeleccionados.map(agente => {
              const enfermedades = ENFERMEDADES_POR_AGENTE[agente as keyof typeof ENFERMEDADES_POR_AGENTE] || [];
              const enfermedadesSeleccionadas = getEnfermedadesPlantaAgente(codigo, agente);

              return (
                <div key={agente} className="ml-2 mb-4 p-3 border rounded bg-gray-50">
                  <h4 className="font-medium text-md text-gray-700 mb-2">
                    {AGENTES.find(a => a.value === agente)?.label}
                  </h4>

                  {/* Checkboxes de enfermedades para este agente */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Enfermedades observadas
                    </label>
                    <div className="space-y-1">
                      {enfermedades.map(enf => (
                        <label key={enf.id} className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={enfermedadesSeleccionadas.includes(enf.id)}
                            onChange={(e) => handleEnfermedadToggle(codigo, agente, enf.id, e.target.checked)}
                            className="mr-2"
                          />
                          {enf.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Campos para cada enfermedad seleccionada */}
                  {enfermedadesSeleccionadas.map(enfermedadId => {
                    const enfermedad = enfermedades.find(e => e.id === enfermedadId);
                    if (!enfermedad) return null;
                    return renderEnfermedadFields(codigo, agente, enfermedadId, enfermedad.label);
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};