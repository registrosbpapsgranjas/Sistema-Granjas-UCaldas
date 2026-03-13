import React, { useEffect } from 'react';
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
    erroresValidacion?: Record<string, string>;
}

const CultivoForm: React.FC<CultivoFormProps> = ({
    isOpen,
    onClose,
    datosFormulario,
    setDatosFormulario,
    onSubmit,
    editando,
    granjas,
    erroresValidacion = {}
}) => {
    // Log para ver qué errores llegan
    useEffect(() => {
        if (Object.keys(erroresValidacion).length > 0) {
            console.log('📌 Errores en formulario:', erroresValidacion);
        }
    }, [erroresValidacion]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        setDatosFormulario(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const tipos = [
        { value: 'agricola', label: 'Agrícola' },
        { value: 'pecuario', label: 'Pecuario' }
    ];

    const estados = [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' }
    ];

    // Función para obtener el mensaje de error de un campo
    const getError = (campo: string) => {
        return erroresValidacion[campo] || '';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            width="max-w-2xl"
        >
            <div className="space-y-4">
                <div className="border-b pb-3">
                    <h3 className="text-xl font-bold text-gray-800">
                        {editando ? 'Editar Cultivo/Especie' : 'Nuevo Cultivo/Especie'}
                    </h3>
                </div>

                {/* Mostrar resumen de errores si hay varios */}
                {Object.keys(erroresValidacion).length > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="font-bold mb-2">Por favor corrige los siguientes errores:</p>
                        <ul className="list-disc pl-5 text-sm">
                            {Object.entries(erroresValidacion).map(([campo, mensaje]) => {
                                // Limpiar el mensaje para mostrarlo más amigable
                                const mensajeLimpio = mensaje.replace('Value error, ', '');
                                return (
                                    <li key={campo}>
                                        <span className="font-medium capitalize">{campo}:</span> {mensajeLimpio}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                    getError('nombre') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                                required
                                placeholder="Ej: Café Caturra, Ganado Lechero Holstein"
                            />
                            {getError('nombre') && (
                                <p className="text-red-500 text-xs mt-1">{getError('nombre').replace('Value error, ', '')}</p>
                            )}
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                    getError('tipo') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                                required
                            >
                                <option value="">Seleccionar tipo</option>
                                {tipos.map(tipo => (
                                    <option key={tipo.value} value={tipo.value}>
                                        {tipo.label}
                                    </option>
                                ))}
                            </select>
                            {getError('tipo') && (
                                <p className="text-red-500 text-xs mt-1">{getError('tipo').replace('Value error, ', '')}</p>
                            )}
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                    getError('estado') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                                required
                            >
                                {estados.map(estado => (
                                    <option key={estado.value} value={estado.value}>
                                        {estado.label}
                                    </option>
                                ))}
                            </select>
                            {getError('estado') && (
                                <p className="text-red-500 text-xs mt-1">{getError('estado').replace('Value error, ', '')}</p>
                            )}
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                    getError('granja_id') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                                required
                            >
                                <option value="">Seleccionar granja</option>
                                {granjas.map(granja => (
                                    <option key={granja.id} value={granja.id}>
                                        {granja.nombre}
                                    </option>
                                ))}
                            </select>
                            {getError('granja_id') && (
                                <p className="text-red-500 text-xs mt-1">{getError('granja_id').replace('Value error, ', '')}</p>
                            )}
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                    getError('descripcion') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                                rows={3}
                                placeholder="Descripción del cultivo o especie (mínimo 10 caracteres)..."
                            />
                            {getError('descripcion') && (
                                <p className="text-red-500 text-xs mt-1">{getError('descripcion').replace('Value error, ', '')}</p>
                            )}
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