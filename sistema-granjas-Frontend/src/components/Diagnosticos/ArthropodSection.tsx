import React from "react";
import { PlantaBase } from "../types";

interface Props {
  plantas: PlantaBase[];
  caracterizacion: Record<string, string>;
  onCampoChange: (campo: string, valor: string) => void;
}

// Componente para subir fotos (simulado con input de texto)
const FotosSection: React.FC<{ prefix: string; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ prefix, caracterizacion, onCampoChange }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Fotos tomadas en campo de síntomas o del artrópodo
    </label>
    <p className="text-xs text-gray-500 mb-2">Sube hasta 5 archivos compatibles. Tamaño máximo por archivo: 10 MB.</p>
    <input
      type="text"
      value={caracterizacion[prefix] || ""}
      onChange={(e) => onCampoChange(prefix, e.target.value)}
      className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
      placeholder="Ruta de la foto (simulado)"
    />
  </div>
);

// Subsecciones para cada tipo de insecto
const CompsusSection: React.FC<{ basePrefix: string; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ basePrefix, caracterizacion, onCampoChange }) => (
  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
    <h5 className="font-semibold mb-2">Monitoreo de Compsus sp. - Picudo</h5>
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Adultos de Compsus sp. encontrados *</label>
      <input
        type="number"
        min="0"
        value={caracterizacion[`${basePrefix}_adultos`] || ""}
        onChange={(e) => onCampoChange(`${basePrefix}_adultos`, e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        placeholder="Ej: 3"
        required
      />
    </div>
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Daño en hojas *</label>
      <select
        value={caracterizacion[`${basePrefix}_dano_hojas`] || ""}
        onChange={(e) => onCampoChange(`${basePrefix}_dano_hojas`, e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        required
      >
        <option value="" disabled>Seleccione</option>
        <option value="leve">Leve</option>
        <option value="medio">Medio</option>
        <option value="alto">Alto</option>
        <option value="no_dano">No se encontró daño</option>
      </select>
    </div>
    <FotosSection prefix={`${basePrefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
  </div>
);

const DiaphorinaSection: React.FC<{ basePrefix: string; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ basePrefix, caracterizacion, onCampoChange }) => (
  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
    <h5 className="font-semibold mb-2">Monitoreo de Diaphorina citri - Psílido asiático</h5>
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Brotes con presencia *</label>
      <input
        type="number"
        min="0"
        value={caracterizacion[`${basePrefix}_brotes`] || ""}
        onChange={(e) => onCampoChange(`${basePrefix}_brotes`, e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        placeholder="Ej: 5"
        required
      />
    </div>
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Estados del insecto observados *</label>
      <div className="flex flex-wrap gap-4">
        {["Huevo", "Ninfa", "Adulto", "No se observaron"].map((estado) => (
          <label key={estado} className="inline-flex items-center">
            <input
              type="checkbox"
              value={estado}
              checked={caracterizacion[`${basePrefix}_estados`]?.includes(estado) || false}
              onChange={(e) => {
                const current = caracterizacion[`${basePrefix}_estados`] || "";
                const values = current ? current.split(",") : [];
                if (e.target.checked) {
                  values.push(estado);
                } else {
                  const index = values.indexOf(estado);
                  if (index > -1) values.splice(index, 1);
                }
                onCampoChange(`${basePrefix}_estados`, values.join(","));
              }}
              className="mr-2"
            />
            {estado}
          </label>
        ))}
      </div>
    </div>
    <FotosSection prefix={`${basePrefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
  </div>
);

const PhyllocnistisSection: React.FC<{ basePrefix: string; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ basePrefix, caracterizacion, onCampoChange }) => (
  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
    <h5 className="font-semibold mb-2">Monitoreo de Phyllocnistis sp - Minador de los cítricos</h5>
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Galerías encontradas *</label>
      <input
        type="number"
        min="0"
        value={caracterizacion[`${basePrefix}_galerias`] || ""}
        onChange={(e) => onCampoChange(`${basePrefix}_galerias`, e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        placeholder="Ej: 8"
        required
      />
    </div>
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de daño *</label>
      <select
        value={caracterizacion[`${basePrefix}_nivel_dano`] || ""}
        onChange={(e) => onCampoChange(`${basePrefix}_nivel_dano`, e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        required
      >
        <option value="" disabled>Seleccione</option>
        <option value="bajo">Bajo</option>
        <option value="medio">Medio</option>
        <option value="alto">Alto</option>
        <option value="sin_dano">Sin daño observado</option>
      </select>
    </div>
    <FotosSection prefix={`${basePrefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
  </div>
);

const ToxopteraSection: React.FC<{ basePrefix: string; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ basePrefix, caracterizacion, onCampoChange }) => (
  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
    <h5 className="font-semibold mb-2">Monitoreo de Toxoptera citricidus - Pulgón negro</h5>
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Brotes infestados *</label>
      <input
        type="number"
        min="0"
        value={caracterizacion[`${basePrefix}_brotes`] || ""}
        onChange={(e) => onCampoChange(`${basePrefix}_brotes`, e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        placeholder="Ej: 4"
        required
      />
    </div>
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">¿Se observó mielecilla y fumagina? *</label>
      <select
        value={caracterizacion[`${basePrefix}_mielecilla`] || ""}
        onChange={(e) => onCampoChange(`${basePrefix}_mielecilla`, e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        required
      >
        <option value="" disabled>Seleccione</option>
        <option value="si">Sí</option>
        <option value="no">No</option>
      </select>
    </div>
    <FotosSection prefix={`${basePrefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
  </div>
);

const HormigaSection: React.FC<{ basePrefix: string; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ basePrefix, caracterizacion, onCampoChange }) => (
  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
    <h5 className="font-semibold mb-2">Monitoreo de Hormiga Arriera</h5>
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">¿Hay hormigueros activos? *</label>
      <select
        value={caracterizacion[`${basePrefix}_activos`] || ""}
        onChange={(e) => onCampoChange(`${basePrefix}_activos`, e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        required
      >
        <option value="" disabled>Seleccione</option>
        <option value="si">Sí</option>
        <option value="no">No</option>
      </select>
    </div>
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Número de hormigueros encontrados *</label>
      <input
        type="number"
        min="0"
        value={caracterizacion[`${basePrefix}_numero`] || ""}
        onChange={(e) => onCampoChange(`${basePrefix}_numero`, e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        placeholder="Ej: 2"
        required
      />
    </div>
    <FotosSection prefix={`${basePrefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
  </div>
);

// Subsecciones para ácaros
const PhyllocoptrutaSection: React.FC<{ basePrefix: string; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ basePrefix, caracterizacion, onCampoChange }) => (
  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
    <h5 className="font-semibold mb-2">Phyllocoptruta sp. - Ácaro blanco</h5>
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Frutos afectados *</label>
      <input
        type="number"
        min="0"
        value={caracterizacion[`${basePrefix}_frutos`] || ""}
        onChange={(e) => onCampoChange(`${basePrefix}_frutos`, e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        placeholder="Ej: 3"
        required
      />
    </div>
    <FotosSection prefix={`${basePrefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
  </div>
);

const PolyphagotarsonemusSection: React.FC<{ basePrefix: string; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ basePrefix, caracterizacion, onCampoChange }) => (
  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
    <h5 className="font-semibold mb-2">Monitoreo de Polyphagotarsonemus sp. - Ácaro tostador</h5>
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Frutos afectados *</label>
      <input
        type="number"
        min="0"
        value={caracterizacion[`${basePrefix}_frutos`] || ""}
        onChange={(e) => onCampoChange(`${basePrefix}_frutos`, e.target.value)}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        placeholder="Ej: 2"
        required
      />
    </div>
    <FotosSection prefix={`${basePrefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
  </div>
);

// Componente para una planta individual
const PlantaArthropod: React.FC<{ index: number; planta: PlantaBase; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ index, planta, caracterizacion, onCampoChange }) => {
  const prefix = `artropodo_planta_${index + 1}`;
  
  // Clases seleccionadas (insecto/aracnido)
  const clasesSeleccionadas = caracterizacion[`${prefix}_clases`] || "";
  const clasesArray = clasesSeleccionadas ? clasesSeleccionadas.split(",") : [];

  const handleClaseChange = (clase: string, checked: boolean) => {
    let nuevasClases = [...clasesArray];
    if (checked) {
      if (!nuevasClases.includes(clase)) nuevasClases.push(clase);
    } else {
      nuevasClases = nuevasClases.filter(c => c !== clase);
      // Limpiar todos los campos de esa clase
      if (clase === 'insecto') {
        Object.keys(caracterizacion).forEach(key => {
          if (key.startsWith(`${prefix}_insecto`)) onCampoChange(key, "");
        });
      } else if (clase === 'aracnido') {
        Object.keys(caracterizacion).forEach(key => {
          if (key.startsWith(`${prefix}_acaro`)) onCampoChange(key, "");
        });
      }
    }
    onCampoChange(`${prefix}_clases`, nuevasClases.join(","));
  };

  // Tipos de insecto seleccionados
  const insectoTipos = caracterizacion[`${prefix}_insecto_tipos`] || "";
  const insectoTiposArray = insectoTipos ? insectoTipos.split(",") : [];

  const handleInsectoTipoChange = (tipo: string, checked: boolean) => {
    let nuevosTipos = [...insectoTiposArray];
    if (checked) {
      if (!nuevosTipos.includes(tipo)) nuevosTipos.push(tipo);
    } else {
      nuevosTipos = nuevosTipos.filter(t => t !== tipo);
      // Limpiar campos de ese tipo
      const baseKey = `${prefix}_insecto_${tipo}`;
      Object.keys(caracterizacion).forEach(key => {
        if (key.startsWith(baseKey)) onCampoChange(key, "");
      });
      if (tipo === 'otro_insecto') {
        onCampoChange(`${prefix}_insecto_otro_nombre`, "");
      }
    }
    onCampoChange(`${prefix}_insecto_tipos`, nuevosTipos.join(","));
  };

  // Tipos de ácaro seleccionados
  const acaroTipos = caracterizacion[`${prefix}_acaro_tipos`] || "";
  const acaroTiposArray = acaroTipos ? acaroTipos.split(",") : [];

  const handleAcaroTipoChange = (tipo: string, checked: boolean) => {
    let nuevosTipos = [...acaroTiposArray];
    if (checked) {
      if (!nuevosTipos.includes(tipo)) nuevosTipos.push(tipo);
    } else {
      nuevosTipos = nuevosTipos.filter(t => t !== tipo);
      const baseKey = `${prefix}_acaro_${tipo}`;
      Object.keys(caracterizacion).forEach(key => {
        if (key.startsWith(baseKey)) onCampoChange(key, "");
      });
      if (tipo === 'otro_acaro') {
        onCampoChange(`${prefix}_acaro_otro_nombre`, "");
      }
    }
    onCampoChange(`${prefix}_acaro_tipos`, nuevosTipos.join(","));
  };

  const insectoTiposDisponibles = [
    { value: 'compsus', label: 'Compsus sp. - Picudo' },
    { value: 'diaphorina', label: 'Diaphorina citri - Psílido asiático' },
    { value: 'phyllocnistis', label: 'Phyllocnistis sp. - Minador de la hoja' },
    { value: 'toxoptera', label: 'Toxoptera citricidus - Pulgón negro' },
    { value: 'hormiga', label: 'Hormiga arriera' },
    { value: 'otro_insecto', label: 'Otro:' },
  ];

  const acaroTiposDisponibles = [
    { value: 'phyllocoptruta', label: 'Phyllocoptruta sp. - Ácaro blanco' },
    { value: 'polyphagotarsonemus', label: 'Polyphagotarsonemus sp. - Ácaro tostador' },
    { value: 'otro_acaro', label: 'Otro:' },
  ];

  return (
    <div className="border rounded-lg p-4 mb-6 bg-white shadow-sm">
      <h4 className="font-semibold text-lg text-gray-800 mb-3">
        {planta.label} (Código: {planta.codigo})
      </h4>

      {/* Selector de clases */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Clase de artrópodo observado en esta planta (puede seleccionar más de una)
        </label>
        <div className="flex gap-6">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={clasesArray.includes('insecto')}
              onChange={(e) => handleClaseChange('insecto', e.target.checked)}
              className="mr-2"
            />
            Insecto
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={clasesArray.includes('aracnido')}
              onChange={(e) => handleClaseChange('aracnido', e.target.checked)}
              className="mr-2"
            />
            Arácnido
          </label>
        </div>
        {clasesArray.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">No se detectaron artrópodos en esta planta.</p>
        )}
      </div>

      {/* Insectos */}
      {clasesArray.includes('insecto') && (
        <div className="mb-6 border-l-4 border-blue-300 pl-4">
          <h5 className="font-semibold text-md mb-2">Insectos observados</h5>
          <p className="text-sm text-gray-600 mb-2">Seleccione los insectos presentes (puede elegir varios):</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {insectoTiposDisponibles.map(tipo => (
              <label key={tipo.value} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={insectoTiposArray.includes(tipo.value)}
                  onChange={(e) => handleInsectoTipoChange(tipo.value, e.target.checked)}
                  className="mr-2"
                />
                {tipo.label}
              </label>
            ))}
          </div>

          {insectoTiposArray.includes('compsus') && (
            <CompsusSection basePrefix={`${prefix}_insecto_compsus`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
          )}
          {insectoTiposArray.includes('diaphorina') && (
            <DiaphorinaSection basePrefix={`${prefix}_insecto_diaphorina`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
          )}
          {insectoTiposArray.includes('phyllocnistis') && (
            <PhyllocnistisSection basePrefix={`${prefix}_insecto_phyllocnistis`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
          )}
          {insectoTiposArray.includes('toxoptera') && (
            <ToxopteraSection basePrefix={`${prefix}_insecto_toxoptera`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
          )}
          {insectoTiposArray.includes('hormiga') && (
            <HormigaSection basePrefix={`${prefix}_insecto_hormiga`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
          )}
          {insectoTiposArray.includes('otro_insecto') && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especifique el insecto observado
              </label>
              <input
                type="text"
                value={caracterizacion[`${prefix}_insecto_otro_nombre`] || ""}
                onChange={(e) => onCampoChange(`${prefix}_insecto_otro_nombre`, e.target.value)}
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
                placeholder="Nombre del insecto"
              />
            </div>
          )}
        </div>
      )}

      {/* Ácaros */}
      {clasesArray.includes('aracnido') && (
        <div className="mb-6 border-l-4 border-green-300 pl-4">
          <h5 className="font-semibold text-md mb-2">Ácaros observados</h5>
          <p className="text-sm text-gray-600 mb-2">Seleccione los ácaros presentes (puede elegir varios):</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {acaroTiposDisponibles.map(tipo => (
              <label key={tipo.value} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={acaroTiposArray.includes(tipo.value)}
                  onChange={(e) => handleAcaroTipoChange(tipo.value, e.target.checked)}
                  className="mr-2"
                />
                {tipo.label}
              </label>
            ))}
          </div>

          {acaroTiposArray.includes('phyllocoptruta') && (
            <PhyllocoptrutaSection basePrefix={`${prefix}_acaro_phyllocoptruta`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
          )}
          {acaroTiposArray.includes('polyphagotarsonemus') && (
            <PolyphagotarsonemusSection basePrefix={`${prefix}_acaro_polyphagotarsonemus`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
          )}
          {acaroTiposArray.includes('otro_acaro') && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especifique el ácaro observado
              </label>
              <input
                type="text"
                value={caracterizacion[`${prefix}_acaro_otro_nombre`] || ""}
                onChange={(e) => onCampoChange(`${prefix}_acaro_otro_nombre`, e.target.value)}
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
                placeholder="Nombre del ácaro"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente principal
export const ArthropodSection: React.FC<Props> = ({ plantas, caracterizacion, onCampoChange }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Monitoreo de Artrópodos por Planta
      </h2>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <p className="text-sm text-gray-700">
          El monitoreo de plagas en cítricos permite conocer oportunamente la presencia y el nivel de infestación que pueden afectar la producción, favoreciendo el manejo integrado del cultivo y la toma de decisiones técnicas basadas en información real; además, contribuye a la protección de organismos benéficos.
        </p>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Plantas seleccionadas para monitoreo
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Para cada planta, seleccione los artrópodos observados y complete los datos correspondientes. Si no se detectaron artrópodos, deje las casillas sin marcar.
      </p>

      {plantas.map((planta, idx) => (
        <PlantaArthropod
          key={planta.codigo}
          index={idx}
          planta={planta}
          caracterizacion={caracterizacion}
          onCampoChange={onCampoChange}
        />
      ))}
    </div>
  );
};