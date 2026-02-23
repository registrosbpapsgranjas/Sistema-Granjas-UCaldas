import React from 'react';
import { PlantaBase } from '../types/index';

interface PolinizadoresSectionProps {
  plantas: PlantaBase[];
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

export const PolinizadoresSection: React.FC<PolinizadoresSectionProps> = ({
  plantas,
  caracterizacion,
  onCampoChange,
}) => {
  const prefix = 'polinizadores';

  const handleChange = (clave: string, valor: any) => {
    const valorString = typeof valor === 'boolean' ? String(valor) : String(valor);
    onCampoChange(clave, valorString);
  };

  // Manejar checkboxes múltiples con exclusión de "No se observaron"
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
        'polinizadores',
        'polinizadores_otro',
        'actividad',
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
        Monitoreo de Polinizadores
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Por cada planta, revise 4 brotes por punto cardinal (16 brotes en total) durante 1 minuto. Registre la presencia de polinizadores.
      </p>

      {plantas.map((planta) => {
        const codigo = planta.codigo;
        const noAplica = getNoAplica(codigo);
        const baseKey = `${prefix}_${codigo}`;

        const polinizadores = caracterizacion[`${baseKey}_polinizadores`]
          ? JSON.parse(caracterizacion[`${baseKey}_polinizadores`])
          : [];
        const actividad = caracterizacion[`${baseKey}_actividad`] || '';

        const opcionesPolinizadores = [
          'Abeja melífera',
          'Mariposas',
          'Abejorros',
          'Avispas',
          'No se observaron',
        ];
        const opcionNinguno = 'No se observaron';
        const tieneNinguno = polinizadores.includes(opcionNinguno);

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
                {/* Polinizadores observados */}
                <div className="border p-3 rounded bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Polinizadores observados *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {opcionesPolinizadores.map(opcion => (
                      <label key={opcion} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={polinizadores.includes(opcion)}
                          onChange={(e) =>
                            handleGrupoChange(
                              baseKey,
                              'polinizadores',
                              opcion,
                              e.target.checked,
                              opcionesPolinizadores,
                              opcionNinguno
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
                      value={caracterizacion[`${baseKey}_polinizadores_otro`] || ''}
                      onChange={(e) =>
                        handleOtroChange(baseKey, 'polinizadores', e.target.value, opcionNinguno)
                      }
                      disabled={tieneNinguno}
                      className={`border rounded px-2 py-1 w-full text-sm ${tieneNinguno ? 'bg-gray-100' : ''}`}
                      placeholder="Otro polinizador"
                    />
                  </div>
                </div>

                {/* Actividad promedio */}
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
                    ].map(opcion => (
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