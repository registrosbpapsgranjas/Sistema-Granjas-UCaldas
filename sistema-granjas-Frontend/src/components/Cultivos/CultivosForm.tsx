import React from 'react';
import Modal from '../Common/Modal';
import type { CultivoFormData } from '../../types/cultivoTypes';

interface CultivoFormProps {
    isOpen: boolean;
    onClose: () => void;
    datosFormulario: CultivoFormData;
    setDatosFormulario: React.Dispatch<React.SetStateAction<CultivoFormData>>;
    onSubmit: (e: React.FormEvent) => void;
    editando: boolean;
    granjas: any[];
}

const CultivoForm: React.FC<CultivoFormProps> = ({
    isOpen,
    onClose,
    datosFormulario,
    setDatosFormulario,
    onSubmit,
    editando,
    granjas
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        setDatosFormulario(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    // Opciones de tipo
    const tipos = [
        { value: 'agricola', label: 'Agrícola' },
        { value: 'pecuario', label: 'Pecuario' }
    ];

    // Opciones de estado
    const estados = [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            width="max-w-2xl"
        >
            <div className="space-y-4">
                {/* Título */}
                <div className="border-b pb-3">
                    <h3 className="text-xl font-bold text-gray-800">
                        {editando ? 'Editar Cultivo/Especie' : 'Nuevo Cultivo/Especie'}
                    </h3>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={datosFormulario.nombre}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                                placeholder="Ej: Café Caturra, Ganado Lechero Holstein"
                            />
                        </div>

                        {/* Tipo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo *
                            </label>
                            <select
                                name="tipo"
                                value={datosFormulario.tipo}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            >
                                <option value="">Seleccionar tipo</option>
                                {tipos.map(tipo => (
                                    <option key={tipo.value} value={tipo.value}>
                                        {tipo.label}
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

                        {/* Fecha Inicio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Inicio
                            </label>
                            <input
                                type="date"
                                name="fecha_inicio"
                                value={datosFormulario.fecha_inicio}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Duración en días */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duración (días)
                            </label>
                            <input
                                type="number"
                                name="duracion_dias"
                                min="1"
                                value={datosFormulario.duracion_dias}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {/* Descripción */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                            </label>
                            <textarea
                                name="descripcion"
                                value={datosFormulario.descripcion}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                rows={3}
                                placeholder="Descripción del cultivo o especie..."
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
                            {editando ? 'Actualizar Cultivo' : 'Crear Cultivo'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default CultivoForm;