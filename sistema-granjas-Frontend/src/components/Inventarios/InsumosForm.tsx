import React from 'react';
import Modal from '../Common/Modal';
import type { InsumoFormData } from '../../types/Inventariotypes';

interface InsumoFormProps {
    isOpen: boolean;
    onClose: () => void;
    datosFormulario: InsumoFormData;
    setDatosFormulario: React.Dispatch<React.SetStateAction<InsumoFormData>>;
    onSubmit: (e: React.FormEvent) => void;
    editando: boolean;
    programas: any[];
}

const InsumoForm: React.FC<InsumoFormProps> = ({
    isOpen,
    onClose,
    datosFormulario,
    setDatosFormulario,
    onSubmit,
    editando,
    programas
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        setDatosFormulario(prev => ({
            ...prev,
            [name]: type === 'number' || type === 'float' ? parseFloat(value) || 0 : value
        }));
    };

    const estados = [
        { value: 'disponible', label: 'Disponible' },
        { value: 'agotado', label: 'Agotado' },
        { value: 'bajo_stock', label: 'Bajo Stock' },
        { value: 'vencido', label: 'Vencido' },
        { value: 'inactivo', label: 'Inactivo' }
    ];

    const unidades = [
        'kg', 'g', 'lb', 'ton', 'l', 'ml', 'gal', 'm³',
        'unidades', 'paquetes', 'cajas', 'sacos', 'bolsas'
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
                        {editando ? 'Editar Insumo' : 'Nuevo Insumo'}
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                            placeholder="Ej: Fertilizante NPK, Semillas de Maíz"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            rows={3}
                            placeholder="Descripción del insumo..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Programa *
                            </label>
                            <select
                                name="programa_id"
                                value={datosFormulario.programa_id || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unidad de Medida *
                            </label>
                            <select
                                name="unidad_medida"
                                value={datosFormulario.unidad_medida}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            >
                                {unidades.map(unidad => (
                                    <option key={unidad} value={unidad}>
                                        {unidad}
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
                                step="0.01"
                                name="cantidad_total"
                                min="0"
                                value={datosFormulario.cantidad_total}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad Disponible *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="cantidad_disponible"
                                min="0"
                                max={datosFormulario.cantidad_total}
                                value={datosFormulario.cantidad_disponible}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nivel de Alerta
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="nivel_alerta"
                                min="0"
                                value={datosFormulario.nivel_alerta}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado *
                            </label>
                            <select
                                name="estado"
                                value={datosFormulario.estado}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            >
                                {estados.map(estado => (
                                    <option key={estado.value} value={estado.value}>
                                        {estado.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            {editando ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default InsumoForm;