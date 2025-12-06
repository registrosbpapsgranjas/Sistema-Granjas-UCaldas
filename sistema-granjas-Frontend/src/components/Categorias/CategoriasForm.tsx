import React from 'react';
import Modal from '../Common/Modal';
import type { CategoriaFormData } from '../../types/Inventariotypes';

interface CategoriaFormProps {
    isOpen: boolean;
    onClose: () => void;
    datosFormulario: CategoriaFormData;
    setDatosFormulario: React.Dispatch<React.SetStateAction<CategoriaFormData>>;
    onSubmit: (e: React.FormEvent) => void;
    editando: boolean;
}

const CategoriaForm: React.FC<CategoriaFormProps> = ({
    isOpen,
    onClose,
    datosFormulario,
    setDatosFormulario,
    onSubmit,
    editando
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setDatosFormulario(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            width="max-w-md"
        >
            <div className="space-y-4">
                <div className="border-b pb-3">
                    <h3 className="text-xl font-bold text-gray-800">
                        {editando ? 'Editar Categoría' : 'Nueva Categoría'}
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                            placeholder="Ej: Herramientas Manuales, Fertilizantes"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            rows={3}
                            placeholder="Descripción de la categoría..."
                        />
                    </div>

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
                            {editando ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default CategoriaForm;