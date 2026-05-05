import React, { useState } from 'react';

interface GenericDynamicSectionProps {
    caracterizacion: Record<string, string>;
    onCampoChange: (campo: string, valor: string) => void;
    tipoNombre: string;
}

const GenericDynamicSection: React.FC<GenericDynamicSectionProps> = ({
    caracterizacion,
    onCampoChange,
    tipoNombre,
}) => {
    const [campos, setCampos] = useState<string[]>(() => {
        const existentes = Object.keys(caracterizacion).filter(k => !k.startsWith('__'));
        return existentes.length > 0 ? existentes : ['observacion_general'];
    });
    const [nuevoCampo, setNuevoCampo] = useState('');

    const agregarCampo = () => {
        const nombre = nuevoCampo.trim().toLowerCase().replace(/\s+/g, '_');
        if (!nombre || campos.includes(nombre)) return;
        setCampos(prev => [...prev, nombre]);
        setNuevoCampo('');
    };

    const eliminarCampo = (campo: string) => {
        setCampos(prev => prev.filter(c => c !== campo));
        onCampoChange(campo, '');
    };

    const formatLabel = (campo: string) =>
        campo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                <strong>Monitoreo:</strong> {tipoNombre} — Formulario dinámico.
                Agrega los campos que necesites para registrar los datos de este tipo de monitoreo.
            </div>

            {campos.map(campo => (
                <div key={campo} className="flex gap-2 items-start">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {formatLabel(campo)}
                        </label>
                        <textarea
                            rows={2}
                            value={caracterizacion[campo] || ''}
                            onChange={e => onCampoChange(campo, e.target.value)}
                            className="w-full border rounded-lg p-2 text-sm"
                            placeholder={`Ingresa ${formatLabel(campo).toLowerCase()}...`}
                        />
                    </div>
                    {campo !== 'observacion_general' && (
                        <button
                            type="button"
                            onClick={() => eliminarCampo(campo)}
                            className="mt-6 text-red-500 hover:text-red-700 p-1"
                            title="Eliminar campo"
                        >
                            <i className="fas fa-times-circle"></i>
                        </button>
                    )}
                </div>
            ))}

            <div className="flex gap-2 items-center border-t pt-3">
                <input
                    type="text"
                    value={nuevoCampo}
                    onChange={e => setNuevoCampo(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarCampo(); } }}
                    placeholder="Nombre del nuevo campo (ej: temperatura, humedad)"
                    className="flex-1 border rounded-lg p-2 text-sm"
                />
                <button
                    type="button"
                    onClick={agregarCampo}
                    disabled={!nuevoCampo.trim()}
                    className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:bg-gray-300"
                >
                    <i className="fas fa-plus mr-1"></i> Agregar campo
                </button>
            </div>
        </div>
    );
};

export default GenericDynamicSection;
