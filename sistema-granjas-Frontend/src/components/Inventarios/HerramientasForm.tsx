import React from 'react';
import Modal from '../Common/Modal';
import type { HerramientaFormData } from '../../types/Inventariotypes';

interface HerramientaFormProps {
    isOpen: boolean;
    onClose: () => void;
    datosFormulario: HerramientaFormData;
    setDatosFormulario: React.Dispatch<React.SetStateAction<HerramientaFormData>>;
    onSubmit: (e: React.FormEvent) => void;
    editando: boolean;
    categorias: any[];
}

const HerramientaForm: React.FC<HerramientaFormProps> = ({
    isOpen,
    onClose,
    datosFormulario,
    setDatosFormulario,
    onSubmit,
    editando,
    categorias
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        setDatosFormulario(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const estados = [
        { value: 'disponible', label: 'Disponible' },
        { value: 'no_disponible', label: 'No Disponible' },
        { value: 'en_mantenimiento', label: 'En Mantenimiento' },
        { value: 'dada_de_baja', label: 'Dada de Baja' }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            width="max-w-lg"
        >
            <div className="space-y-4">
                <div className="border-b pb-3">
                    <h3 className="text-xl font-bold text-gray-800">
                        {editando ? 'Editar Herramienta' : 'Nueva Herramienta'}
                    </h3>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={datosFormulario.nombre}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            placeholder="Ej: Pala, Rastrillo, Manguera"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="descripcion"
                            value={datosFormulario.descripcion}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Descripción de la herramienta..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Categoría
                            </label>
                            <select
                                name="categoria_id"
                                value={datosFormulario.categoria_id || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Seleccionar categoría</option>
                                {categorias.map(categoria => (
                                    <option key={categoria.id} value={categoria.id}>
                                        {categoria.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado *
                            </label>
                            <select
                                name="estado"
                                value={datosFormulario.estado}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                {estados.map(estado => (
                                    <option key={estado.value} value={estado.value}>
                                        {estado.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad Total *
                            </label>
                            <input
                                type="number"
                                name="cantidad_total"
                                min="0"
                                value={datosFormulario.cantidad_total}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad Disponible *
                            </label>
                            <input
                                type="number"
                                name="cantidad_disponible"
                                min="0"
                                max={datosFormulario.cantidad_total}
                                value={datosFormulario.cantidad_disponible}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {editando ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default HerramientaForm;