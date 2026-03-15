import React from "react";
import { PlantaBase } from "../types";

interface Props {
  plantas: PlantaBase[]; // Plantas seleccionadas (cada una con 4 cuadrantes)
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

// Subsecciones para cada tipo de insecto (POR CUADRANTE)
const CompsusSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ 
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange 
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_compsus`;
  
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">
        Monitoreo de <em>Compsus</em> sp. - Picudo
      </h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Seleccione preferiblemente árboles de los linderos, de los bordes de carretera o los que están cerca de los centros de acopio de frutas. Sacuda de forma suave las ramas de arriba hacia abajo, dándole la vuelta al árbol. Observe en el suelo la presencia de adultos.
      </p>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adultos de <em>Compsus</em> sp. encontrados *
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={caracterizacion[`${prefix}_adultos`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_adultos`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 3 (0 si no hay)"
          required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia del insecto, colocar 0</p>
      </div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          % de daño en hojas *
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={caracterizacion[`${prefix}_dano_hojas`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_dano_hojas`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay daño)"
          required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse daño del insecto, colocar 0</p>
      </div>
      
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

const DiaphorinaSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ 
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange 
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_diaphorina`;
  
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">
        Monitoreo de <em>Diaphorina citri</em> - Psílido asiático
      </h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Revisar brotes nuevos, que son los preferidos por el insecto.
        {caracterizacion['lote_seleccionado'] && ['l5', 'l6', 'l8', 'l9'].includes(caracterizacion['lote_seleccionado']) && 
          " NOTA: Este lote tiene variedad Swingle. Debe monitorear mínimo 2 árboles adicionales."
        }
      </p>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de <em>Diaphorina citri</em> encontrados *
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={caracterizacion[`${prefix}_adultos`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_adultos`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 3 (0 si no hay)"
          required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia del insecto, colocar 0</p>
      </div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estados del insecto observados *
        </label>
        <div className="flex flex-wrap gap-4">
          {["Huevo", "Ninfa", "Adulto", "No se observaron"].map((estado) => (
            <label key={estado} className="inline-flex items-center">
              <input
                type="checkbox"
                value={estado}
                checked={caracterizacion[`${prefix}_estados`]?.includes(estado) || false}
                onChange={(e) => {
                  const current = caracterizacion[`${prefix}_estados`] || "";
                  const values = current ? current.split(",") : [];
                  if (e.target.checked) {
                    if (!values.includes(estado)) values.push(estado);
                  } else {
                    const index = values.indexOf(estado);
                    if (index > -1) values.splice(index, 1);
                  }
                  onCampoChange(`${prefix}_estados`, values.join(","));
                }}
                className="mr-2"
              />
              {estado}
            </label>
          ))}
        </div>
      </div>
      
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

const PhyllocnistisSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ 
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange 
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_phyllocnistis`;
  
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">
        Monitoreo de <em>Phyllocnistis</em> sp. - Minador de los cítricos
      </h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Revisar brotes nuevos. Observar: Galerías serpenteantes plateadas en el envés de la hoja, enrollamiento del borde foliar, presencia de larvas o pupa al final de la galería.
      </p>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Galerías activas hechas por <em>Phyllocnistis</em> sp. *
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={caracterizacion[`${prefix}_galerias`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_galerias`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 3 (0 si no hay)"
          required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia del insecto, colocar 0</p>
      </div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          % de daño *
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={caracterizacion[`${prefix}_dano_hojas`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_dano_hojas`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay daño)"
          required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse daño del insecto, colocar 0</p>
      </div>
      
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

const ToxopteraSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ 
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange 
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_toxoptera`;
  
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">
        Monitoreo de <em>Toxoptera citricidus</em> - Pulgón negro
      </h6>
      <p className="text-xs text-gray-600 mb-2 italic">Revisar brotes nuevos, que son los preferidos por el insecto.</p>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adultos de <em>Toxoptera citricidus</em> encontrados *
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={caracterizacion[`${prefix}_adultos`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_adultos`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 3 (0 si no hay)"
          required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia del insecto, colocar 0</p>
      </div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Se observó presencia de mielecilla y fumagina? *
        </label>
        <div className="flex gap-4">
          {["Si", "No"].map((opcion) => (
            <label key={opcion} className="inline-flex items-center">
              <input
                type="radio"
                name={`${prefix}_mielecilla`}
                value={opcion}
                checked={caracterizacion[`${prefix}_mielecilla`] === opcion}
                onChange={(e) => onCampoChange(`${prefix}_mielecilla`, e.target.value)}
                className="mr-2"
              />
              {opcion}
            </label>
          ))}
        </div>
      </div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          % de Fumagina o Mielecilla observada *
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={caracterizacion[`${prefix}_dano_fumagina`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_dano_fumagina`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay)"
          required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse daño, colocar 0</p>
      </div>
      
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

// Subsecciones para ácaros (POR CUADRANTE)
const PolyphagotarsonemusSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ 
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange 
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_polyphagotarsonemus`;
  
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">
        Monitoreo de <em>Polyphagotarsonemus</em> sp. - Ácaro blanco
      </h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Revisar brotes tiernos y frutos en formación. Observar: Coloración plateada, enrollamiento de hojas jóvenes.
      </p>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de frutos afectados por <em>Polyphagotarsonemus</em> sp. *
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={caracterizacion[`${prefix}_frutos_afectados`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_frutos_afectados`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 3 (0 si no hay)"
          required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia del ácaro, colocar 0</p>
      </div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          % de daño en frutos observado *
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={caracterizacion[`${prefix}_dano_frutos`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_dano_frutos`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay daño)"
          required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse daño, colocar 0</p>
      </div>
      
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

const PhyllocoptrutaSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ 
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange 
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_phyllocoptruta`;
  
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">
        Monitoreo de <em>Phyllocoptruta</em> sp. - Ácaro tostador
      </h6>
      <p className="text-xs text-gray-600 mb-2 italic">
        Revisar brotes tiernos y frutos en formación. Observar: Bronceado café oscuro, enrollamiento de hojas jóvenes, rugosidad y corchosidad en frutos.
      </p>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de frutos afectados por <em>Phyllocoptruta</em> sp. *
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={caracterizacion[`${prefix}_frutos_afectados`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_frutos_afectados`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 3 (0 si no hay)"
          required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse presencia del ácaro, colocar 0</p>
      </div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          % de daño en frutos observado *
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={caracterizacion[`${prefix}_dano_frutos`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_dano_frutos`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
          placeholder="Ej: 30 (0 si no hay daño)"
          required
        />
        <p className="text-xs text-gray-500 mt-1">De no encontrarse daño, colocar 0</p>
      </div>
      
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

// Sección para "Otro artrópodo"
const OtroArthropodSection: React.FC<{ basePrefix: string; cuadrante: number; rama: number; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ 
  basePrefix, cuadrante, rama, caracterizacion, onCampoChange 
}) => {
  const prefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro`;
  const claseSeleccionada = caracterizacion[`${prefix}_clase`] || "";
  
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h6 className="font-semibold mb-2 text-sm">Otro artrópodo observado</h6>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Síntomas observados
        </label>
        <input
          type="text"
          value={caracterizacion[`${prefix}_sintomas`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_sintomas`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          placeholder="Describa los síntomas observados"
        />
      </div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Clase de artrópodo observado *
        </label>
        <div className="flex gap-4">
          {["Insecto", "Ácaro"].map((opcion) => (
            <label key={opcion} className="inline-flex items-center">
              <input
                type="radio"
                name={`${prefix}_clase`}
                value={opcion}
                checked={claseSeleccionada === opcion}
                onChange={(e) => onCampoChange(`${prefix}_clase`, e.target.value)}
                className="mr-2"
              />
              {opcion}
            </label>
          ))}
        </div>
      </div>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del artrópodo observado (mínimo hasta género)
        </label>
        <input
          type="text"
          value={caracterizacion[`${prefix}_nombre`] || ""}
          onChange={(e) => onCampoChange(`${prefix}_nombre`, e.target.value)}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          placeholder="Ej: Atta sp."
        />
      </div>
      
      <FotosSection prefix={`${prefix}_fotos`} caracterizacion={caracterizacion} onCampoChange={onCampoChange} />
    </div>
  );
};

// Componente para un cuadrante de una planta
const CuadranteArthropod: React.FC<{ 
  plantaIdx: number; 
  cuadrante: number; 
  rama: number; 
  planta: PlantaBase; 
  caracterizacion: Record<string, string>; 
  onCampoChange: (campo: string, valor: string) => void 
}> = ({ plantaIdx, cuadrante, rama, planta, caracterizacion, onCampoChange }) => {
  const basePrefix = `artropodo_planta_${plantaIdx + 1}`;
  
  // Clases seleccionadas para este cuadrante/rama
  const clasesKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_clases`;
  const clasesSeleccionadas = caracterizacion[clasesKey] || "";
  const clasesArray = clasesSeleccionadas ? clasesSeleccionadas.split(",") : [];

  const handleClaseChange = (clase: string, checked: boolean) => {
    let nuevasClases = [...clasesArray];
    if (checked) {
      if (!nuevasClases.includes(clase)) nuevasClases.push(clase);
    } else {
      nuevasClases = nuevasClases.filter(c => c !== clase);
      // Limpiar todos los campos de esa clase para este cuadrante/rama
      const clasePrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_${clase}`;
      Object.keys(caracterizacion).forEach(key => {
        if (key.startsWith(clasePrefix)) {
          onCampoChange(key, "");
        }
      });
    }
    onCampoChange(clasesKey, nuevasClases.join(","));
  };

  // Tipos de insecto seleccionados para este cuadrante/rama
  const insectoTiposKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_insecto_tipos`;
  const insectoTipos = caracterizacion[insectoTiposKey] || "";
  const insectoTiposArray = insectoTipos ? insectoTipos.split(",") : [];

  const handleInsectoTipoChange = (tipo: string, checked: boolean) => {
    let nuevosTipos = [...insectoTiposArray];
    if (checked) {
      if (!nuevosTipos.includes(tipo)) nuevosTipos.push(tipo);
    } else {
      nuevosTipos = nuevosTipos.filter(t => t !== tipo);
      // Limpiar campos de ese tipo para este cuadrante/rama
      const tipoPrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_insecto_${tipo}`;
      Object.keys(caracterizacion).forEach(key => {
        if (key.startsWith(tipoPrefix)) {
          onCampoChange(key, "");
        }
      });
    }
    onCampoChange(insectoTiposKey, nuevosTipos.join(","));
  };

  // Tipos de ácaro seleccionados para este cuadrante/rama
  const acaroTiposKey = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_acaro_tipos`;
  const acaroTipos = caracterizacion[acaroTiposKey] || "";
  const acaroTiposArray = acaroTipos ? acaroTipos.split(",") : [];

  const handleAcaroTipoChange = (tipo: string, checked: boolean) => {
    let nuevosTipos = [...acaroTiposArray];
    if (checked) {
      if (!nuevosTipos.includes(tipo)) nuevosTipos.push(tipo);
    } else {
      nuevosTipos = nuevosTipos.filter(t => t !== tipo);
      // Limpiar campos de ese tipo para este cuadrante/rama
      const tipoPrefix = `${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_acaro_${tipo}`;
      Object.keys(caracterizacion).forEach(key => {
        if (key.startsWith(tipoPrefix)) {
          onCampoChange(key, "");
        }
      });
    }
    onCampoChange(acaroTiposKey, nuevosTipos.join(","));
  };

  const insectoTiposDisponibles = [
    { value: 'compsus', label: <><em>Compsus</em> sp. – Picudo</> },
    { value: 'diaphorina', label: <><em>Diaphorina citri</em> - Psílido asiático</> },
    { value: 'phyllocnistis', label: <><em>Phyllocnistis</em> sp. - Minador de la hoja</> },
    { value: 'toxoptera', label: <><em>Toxoptera citricidus</em> - Pulgón negro</> },
  ];

  const acaroTiposDisponibles = [
    { value: 'polyphagotarsonemus', label: <><em>Polyphagotarsonemus</em> sp. - Ácaro blanco</> },
    { value: 'phyllocoptruta', label: <><em>Phyllocoptruta</em> sp. - Ácaro tostador</> },
  ];

  return (
    <div className="ml-6 mb-6 p-4 border-l-4 border-blue-200 bg-gray-50 rounded">
      <h5 className="font-medium text-md text-gray-700 mb-3">
        Rama {rama} - Cuadrante {cuadrante}
      </h5>

      {/* Pregunta inicial: Clase de artrópodo */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Clase de artrópodo observado en la RAMA {rama} del CUADRANTE {cuadrante}? (Selección múltiple)
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
      </div>

      {/* Insectos */}
      {clasesArray.includes('insecto') && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccione el insecto observado en campo en la RAMA {rama} del CUADRANTE {cuadrante} (Selección múltiple)
          </label>
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
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={insectoTiposArray.includes('otro')}
                onChange={(e) => handleInsectoTipoChange('otro', e.target.checked)}
                className="mr-2"
              />
              Otro
            </label>
          </div>

          {insectoTiposArray.includes('compsus') && (
            <CompsusSection 
              basePrefix={basePrefix} 
              cuadrante={cuadrante} 
              rama={rama} 
              caracterizacion={caracterizacion} 
              onCampoChange={onCampoChange} 
            />
          )}
          
          {insectoTiposArray.includes('diaphorina') && (
            <DiaphorinaSection 
              basePrefix={basePrefix} 
              cuadrante={cuadrante} 
              rama={rama} 
              caracterizacion={caracterizacion} 
              onCampoChange={onCampoChange} 
            />
          )}
          
          {insectoTiposArray.includes('phyllocnistis') && (
            <PhyllocnistisSection 
              basePrefix={basePrefix} 
              cuadrante={cuadrante} 
              rama={rama} 
              caracterizacion={caracterizacion} 
              onCampoChange={onCampoChange} 
            />
          )}
          
          {insectoTiposArray.includes('toxoptera') && (
            <ToxopteraSection 
              basePrefix={basePrefix} 
              cuadrante={cuadrante} 
              rama={rama} 
              caracterizacion={caracterizacion} 
              onCampoChange={onCampoChange} 
            />
          )}
        </div>
      )}

      {/* Ácaros */}
      {clasesArray.includes('aracnido') && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccione el ácaro que ocasionó el daño observado en los frutos de la RAMA {rama} del CUADRANTE {cuadrante} (Selección múltiple)
          </label>
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
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={acaroTiposArray.includes('no_aplica')}
                onChange={(e) => handleAcaroTipoChange('no_aplica', e.target.checked)}
                className="mr-2"
              />
              No aplica
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={acaroTiposArray.includes('otro')}
                onChange={(e) => handleAcaroTipoChange('otro', e.target.checked)}
                className="mr-2"
              />
              Otro
            </label>
          </div>

          {acaroTiposArray.includes('polyphagotarsonemus') && (
            <PolyphagotarsonemusSection 
              basePrefix={basePrefix} 
              cuadrante={cuadrante} 
              rama={rama} 
              caracterizacion={caracterizacion} 
              onCampoChange={onCampoChange} 
            />
          )}
          
          {acaroTiposArray.includes('phyllocoptruta') && (
            <PhyllocoptrutaSection 
              basePrefix={basePrefix} 
              cuadrante={cuadrante} 
              rama={rama} 
              caracterizacion={caracterizacion} 
              onCampoChange={onCampoChange} 
            />
          )}
        </div>
      )}

      {/* Sección para "Otro artrópodo" (independiente de las clases) */}
      <div className="mt-4">
        <label className="inline-flex items-center mb-2">
          <input
            type="checkbox"
            checked={caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro_activo`] === 'true'}
            onChange={(e) => onCampoChange(`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro_activo`, e.target.checked ? 'true' : 'false')}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">Registrar otro artrópodo no listado</span>
        </label>
        
        {caracterizacion[`${basePrefix}_cuadrante_${cuadrante}_rama_${rama}_otro_activo`] === 'true' && (
          <OtroArthropodSection 
            basePrefix={basePrefix} 
            cuadrante={cuadrante} 
            rama={rama} 
            caracterizacion={caracterizacion} 
            onCampoChange={onCampoChange} 
          />
        )}
      </div>
    </div>
  );
};

// Componente para una planta completa (4 cuadrantes)
const PlantaArthropod: React.FC<{ index: number; planta: PlantaBase; caracterizacion: Record<string, string>; onCampoChange: (campo: string, valor: string) => void }> = ({ 
  index, planta, caracterizacion, onCampoChange 
}) => {
  return (
    <div className="border rounded-lg p-4 mb-8 bg-white shadow-sm">
      <h4 className="font-semibold text-lg text-gray-800 mb-2">
        {planta.label} (Código: {planta.codigo})
      </h4>
      <p className="text-sm text-gray-500 mb-4">
        El árbol se divide en 4 cuadrantes. Seleccione una rama al azar de cada cuadrante y observe: daño en hojas, frutos, puntos de crecimiento y presencia de artrópodos.
      </p>

      {/* Renderizar los 4 cuadrantes */}
      {[1, 2, 3, 4].map((cuadrante) => (
        <CuadranteArthropod
          key={`${planta.codigo}-cuadrante-${cuadrante}`}
          plantaIdx={index}
          cuadrante={cuadrante}
          rama={cuadrante} // Una rama por cuadrante
          planta={planta}
          caracterizacion={caracterizacion}
          onCampoChange={onCampoChange}
        />
      ))}
    </div>
  );
};

// Componente principal
export const ArthropodSection: React.FC<Props> = ({ plantas, caracterizacion, onCampoChange }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Monitoreo de Artrópodos
      </h2>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <p className="text-sm text-gray-700">
          <span className="font-bold">Metodología de monitoreo:</span> Para cada árbol seleccionado, divida la copa en 4 cuadrantes. 
          Seleccione una rama al azar de cada cuadrante. Observe: daño en hojas, frutos, puntos de crecimiento y presencia de artrópodos.
        </p>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Árboles seleccionados para monitoreo
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Se han generado {plantas.length} árbol(es) para monitoreo. Para cada uno, evalúe los 4 cuadrantes de forma independiente.
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

      {/* Nota sobre lotes con Swingle */}
      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700">
        <p className="font-medium mb-1">📝 Nota importante - Variedad Swingle:</p>
        <p>
          Si el lote monitoreado tiene o linda con plantas de la variedad Swingle (Lotes: 5, 6, 8 y 9), 
          debe monitorear mínimo 2 árboles adicionales de esta variedad para el monitoreo de <em>Diaphorina citri</em>.
        </p>
      </div>
    </div>
  );
};