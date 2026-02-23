import React from 'react';
import { PlantaBase } from '../../types/diagnosticoTypes';

interface ControladoresSectionProps {
  plantas: PlantaBase[];
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

export const ControladoresSection: React.FC<ControladoresSectionProps> = ({
  plantas,
  caracterizacion,
  onCampoChange,
}) => {
  const prefix = 'controladores';

  const handleChange = (clave: string, valor: any) => {
    const valorString = typeof valor === 'boolean' ? String(valor) : String(valor);
    onCampoChange(clave, valorString);
  };

  // Maneja cambios en un grupo de checkboxes con lógica de "No se observaron"
  const handleGrupoChange = (
    baseKey: string,
    campo: string,
    opcion: string,
    checked: boolean,
    opciones: string[],
    opcionNinguno: string
  ) => {
    const key = `${baseKey}_${campo}`;
    const current = caracterizacion[key] ? JSON.parse(caracterizacion[key]) : [];

    let nuevos: string[];

    if (opcion === opcionNinguno) {
      if (checked) {
        nuevos = [opcionNinguno];
        // Limpiar el campo "otro" asociado
        handleChange(`${baseKey}_${campo}_otro`, '');
      } else {
        nuevos = [];
      }
    } else {
      if (checked) {
        nuevos = current.filter((o: string) => o !== opcionNinguno);
        if (!nuevos.includes(opcion)) {
          nuevos.push(opcion);
        }
      } else {
        nuevos = current.filter((o: string) => o !== opcion);
      }
    }

    handleChange(key, JSON.stringify(nuevos));
  };

  // Maneja el campo "Otro" evitando escritura si "No se observaron" está seleccionado
  const handleOtroChange = (baseKey: string, campo: string, valor: string, opcionNinguno: string) => {
    const key = `${baseKey}_${campo}`;
    const current = caracterizacion[key] ? JSON.parse(caracterizacion[key]) : [];
    if (current.includes(opcionNinguno)) {
      return; // No permitir escribir
    }
    handleChange(`${baseKey}_${campo}_otro`, valor);
  };

  const getNoAplica = (codigo: string): boolean => {
    return caracterizacion[`${prefix}_${codigo}_noAplica`] === 'true';
  };

  const handleNoAplicaChange = (codigo: string, checked: boolean) => {
    handleChange(`${prefix}_${codigo}_noAplica`, checked);
    if (checked) {
      const campos = [
        'insectos',
        'insectos_otro',
        'microbianos',
        'microbianos_otro',
        'evidencias',
        'evidencias_otro',
        'nivel',
        'foto'
      ];
      campos.forEach(campo => {
        handleChange(`${prefix}_${codigo}_${campo}`, '');
      });
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Monitoreo de Controladores Biológicos
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Por cada planta, revise 4 brotes por punto cardinal (16 brotes en total). Registre la presencia de controladores biológicos.
      </p>

      {plantas.map((planta) => {
        const codigo = planta.codigo;
        const noAplica = getNoAplica(codigo);
        const baseKey = `${prefix}_${codigo}`;

        const insectos = caracterizacion[`${baseKey}_insectos`]
          ? JSON.parse(caracterizacion[`${baseKey}_insectos`])
          : [];
        const microbianos = caracterizacion[`${baseKey}_microbianos`]
          ? JSON.parse(caracterizacion[`${baseKey}_microbianos`])
          : [];
        const evidencias = caracterizacion[`${baseKey}_evidencias`]
          ? JSON.parse(caracterizacion[`${baseKey}_evidencias`])
          : [];
        const nivel = caracterizacion[`${baseKey}_nivel`] || '';

        const insectosOpciones = [
          'Coccinélidos',
          'Crisopas',
          'Avispas parasitoides',
          'Tamarixia radiata',
          'Fidiobia sp.',
          'No se observaron',
        ];
        const microbianosOpciones = [
          'Beauveria',
          'Lecanicillium',
          'Metarhizium',
          'Bacillus',
          'No se observaron',
        ];
        const evidenciasOpciones = [
          'Huevos de artrópodos benéficos',
          'Larvas depredando',
          'Plagas parasitadas',
          'Micelio en insectos',
          'Insectos benéficos en estados inmaduros',
          'Insectos benéficos adultos',
          'No se observaron evidencias',
        ];

        const opcionNingunoInsectos = 'No se observaron';
        const opcionNingunoMicrobianos = 'No se observaron';
        const opcionNingunoEvidencias = 'No se observaron evidencias';

        const tieneNingunoInsectos = insectos.includes(opcionNingunoInsectos);
        const tieneNingunoMicrobianos = microbianos.includes(opcionNingunoMicrobianos);
        const tieneNingunoEvidencias = evidencias.includes(opcionNingunoEvidencias);

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
                  <div className="grid grid-cols-2 gap-2">
                    {insectosOpciones.map(opcion => (
                      <label key={opcion} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={insectos.includes(opcion)}
                          onChange={(e) =>
                            handleGrupoChange(
                              baseKey,
                              'insectos',
                              opcion,
                              e.target.checked,
                              insectosOpciones,
                              opcionNingunoInsectos
                            )
                          }
                          className="mr-2"
                        />
                        {opcion}
                      </label>
                    ))}
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm text-gray-600">Otro (especifique)</label>
                    <input
                      type="text"
                      value={caracterizacion[`${baseKey}_insectos_otro`] || ''}
                      onChange={(e) =>
                        handleOtroChange(baseKey, 'insectos', e.target.value, opcionNingunoInsectos)
                      }
                      disabled={tieneNingunoInsectos}
                      className={`border rounded px-2 py-1 w-full text-sm ${tieneNingunoInsectos ? 'bg-gray-100' : ''}`}
                      placeholder="Otro insecto benéfico"
                    />
                  </div>
                </div>

                {/* Controladores microbianos */}
                <div className="border p-3 rounded bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Controladores microbianos observados *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {microbianosOpciones.map(opcion => (
                      <label key={opcion} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={microbianos.includes(opcion)}
                          onChange={(e) =>
                            handleGrupoChange(
                              baseKey,
                              'microbianos',
                              opcion,
                              e.target.checked,
                              microbianosOpciones,
                              opcionNingunoMicrobianos
                            )
                          }
                          className="mr-2"
                        />
                        {opcion}
                      </label>
                    ))}
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm text-gray-600">Otro (especifique)</label>
                    <input
                      type="text"
                      value={caracterizacion[`${baseKey}_microbianos_otro`] || ''}
                      onChange={(e) =>
                        handleOtroChange(baseKey, 'microbianos', e.target.value, opcionNingunoMicrobianos)
                      }
                      disabled={tieneNingunoMicrobianos}
                      className={`border rounded px-2 py-1 w-full text-sm ${tieneNingunoMicrobianos ? 'bg-gray-100' : ''}`}
                      placeholder="Otro microbiano"
                    />
                  </div>
                </div>

                {/* Evidencia de presencia */}
                <div className="border p-3 rounded bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidencia de presencia observada *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {evidenciasOpciones.map(opcion => (
                      <label key={opcion} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={evidencias.includes(opcion)}
                          onChange={(e) =>
                            handleGrupoChange(
                              baseKey,
                              'evidencias',
                              opcion,
                              e.target.checked,
                              evidenciasOpciones,
                              opcionNingunoEvidencias
                            )
                          }
                          className="mr-2"
                        />
                        {opcion}
                      </label>
                    ))}
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm text-gray-600">Otro (especifique)</label>
                    <input
                      type="text"
                      value={caracterizacion[`${baseKey}_evidencias_otro`] || ''}
                      onChange={(e) =>
                        handleOtroChange(baseKey, 'evidencias', e.target.value, opcionNingunoEvidencias)
                      }
                      disabled={tieneNingunoEvidencias}
                      className={`border rounded px-2 py-1 w-full text-sm ${tieneNingunoEvidencias ? 'bg-gray-100' : ''}`}
                      placeholder="Otra evidencia"
                    />
                  </div>
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
                    ].map(opcion => (
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

                {/* Foto */}
                <div className="border p-3 rounded bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto tomada en campo como evidencia
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert('El archivo no debe superar los 10 MB.');
                          return;
                        }
                        handleChange(`${baseKey}_foto`, file.name);
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">Máximo 10 MB, solo una imagen.</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};