import React from 'react';
import Modal from '../components/Modal';

interface LoteFormProps {
    isOpen: boolean;
    onClose: () => void;
    datosFormulario: any;
    setDatosFormulario: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: (e: React.FormEvent) => void;
    editando: boolean;
    tiposLote: any[];
    granjas: any[];
    programas: any[];
}

const LoteForm: React.FC<LoteFormProps> = ({
    isOpen,
    onClose,
    datosFormulario,
    setDatosFormulario,
    onSubmit,
    editando,
    tiposLote,
    granjas,
    programas
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        setDatosFormulario(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    // Opciones de tipo de gestión
    const tiposGestion = ['Convencional', 'Orgánico', 'Integrado', 'Precisión', 'Tradicional'];

    // Opciones de estado
    const estados = [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'completado', label: 'Completado' }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editando ? 'Editar Lote' : 'Nuevo Lote'}
            size="lg"
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Lote *
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={datosFormulario.nombre}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                            placeholder="Ej: Lote Norte, Parcela 1"
                        />
                    </div>

                    {/* Tipo de Lote */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Lote *
                        </label>
                        <select
                            name="tipo_lote_id"
                            value={datosFormulario.tipo_lote_id || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        >
                            <option value="">Seleccionar tipo</option>
                            {tiposLote.map(tipo => (
                                <option key={tipo.id} value={tipo.id}>
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado *
                        </label>
                        <select
                            name="estado"
                            value={datosFormulario.estado}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        >
                            {estados.map(estado => (
                                <option key={estado.value} value={estado.value}>
                                    {estado.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Granja */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Granja *
                        </label>
                        <select
                            name="granja_id"
                            value={datosFormulario.granja_id || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        >
                            <option value="">Seleccionar granja</option>
                            {granjas.map(granja => (
                                <option key={granja.id} value={granja.id}>
                                    {granja.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Programa */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Programa *
                        </label>
                        <select
                            name="programa_id"
                            value={datosFormulario.programa_id || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        >
                            <option value="">Seleccionar programa</option>
                            {programas.map(programa => (
                                <option key={programa.id} value={programa.id}>
                                    {programa.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Nombre Cultivo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Cultivo *
                        </label>
                        <input
                            type="text"
                            name="nombre_cultivo"
                            value={datosFormulario.nombre_cultivo}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                            placeholder="Ej: Café, Maíz, Papa"
                        />
                    </div>

                    {/* Tipo de Gestión */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Gestión *
                        </label>
                        <select
                            name="tipo_gestion"
                            value={datosFormulario.tipo_gestion}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        >
                            {tiposGestion.map(tipo => (
                                <option key={tipo} value={tipo}>
                                    {tipo}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fecha Inicio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de Inicio *
                        </label>
                        <input
                            type="date"
                            name="fecha_inicio"
                            value={datosFormulario.fecha_inicio}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    {/* Duración en días */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duración (días) *
                        </label>
                        <input
                            type="number"
                            name="duracion_dias"
                            min="1"
                            max="365"
                            value={datosFormulario.duracion_dias}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        {editando ? 'Actualizar Lote' : 'Crear Lote'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default LoteForm;