import React, { useState } from 'react';
import Modal from '../components/Modal';
import { loteService } from '../services/loteService';

interface TiposLoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    tiposLote: any[];
    onRefresh: () => void;
}

const TiposLoteModal: React.FC<TiposLoteModalProps> = ({
    isOpen,
    onClose,
    tiposLote,
    onRefresh
}) => {
    const [editandoTipo, setEditandoTipo] = useState(false);
    const [tipoSeleccionado, setTipoSeleccionado] = useState<any>(null);
    const [formTipo, setFormTipo] = useState({
        nombre: '',
        descripcion: ''
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormTipo(prev => ({ ...prev, [name]: value }));
    };

    const abrirEditarTipo = (tipo: any) => {
        setFormTipo({
            nombre: tipo.nombre,
            descripcion: tipo.descripcion || ''
        });
        setTipoSeleccionado(tipo);
        setEditandoTipo(true);
    };

    const manejarGuardarTipo = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setError(null);

            if (editandoTipo && tipoSeleccionado) {
                await loteService.actualizarTipoLote(tipoSeleccionado.id, formTipo);
                console.log('✅ Tipo de lote actualizado');
            } else {
                await loteService.crearTipoLote(formTipo);
                console.log('✅ Tipo de lote creado');
            }

            await onRefresh();
            resetFormTipo();
        } catch (error: any) {
            console.error('❌ Error guardando tipo:', error);
            setError(error.message || 'Error al guardar el tipo');
        }
    };

    const manejarEliminarTipo = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este tipo de lote?")) return;

        try {
            setError(null);
            await loteService.eliminarTipoLote(id);
            console.log('✅ Tipo de lote eliminado');
            await onRefresh();
        } catch (error: any) {
            console.error('❌ Error eliminando tipo:', error);
            setError(error.message || 'Error al eliminar el tipo');
        }
    };

    const resetFormTipo = () => {
        setFormTipo({ nombre: '', descripcion: '' });
        setEditandoTipo(false);
        setTipoSeleccionado(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                onClose();
                resetFormTipo();
            }}
            title="Tipos de Lote"
            size="xl"
        >
            <div className="space-y-6">
                {/* Error */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <div className="flex items-center">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            <strong>Error:</strong> {error}
                        </div>
                    </div>
                )}

                {/* Formulario para tipos */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">
                        {editandoTipo ? 'Editar Tipo' : 'Nuevo Tipo de Lote'}
                    </h3>
                    <form onSubmit={manejarGuardarTipo} className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={formTipo.nombre}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                                placeholder="Ej: Parcela, Invernadero, Corral"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                            </label>
                            <textarea
                                name="descripcion"
                                value={formTipo.descripcion}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows={2}
                                placeholder="Descripción del tipo de lote..."
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            {editandoTipo && (
                                <button
                                    type="button"
                                    onClick={resetFormTipo}
                                    className="px-3 py-1 text-gray-600 hover:text-gray-800"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {editandoTipo ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Lista de tipos existentes */}
                <div>
                    <h3 className="text-lg font-medium mb-3">Tipos de Lote Registrados</h3>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {tiposLote.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {tiposLote.map(tipo => (
                                    <div key={tipo.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium">{tipo.nombre}</p>
                                            {tipo.descripcion && (
                                                <p className="text-sm text-gray-500">{tipo.descripcion}</p>
                                            )}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => abrirEditarTipo(tipo)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Editar"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={() => manejarEliminarTipo(tipo.id)}
                                                className="text-red-600 hover:text-red-800"
                                                title="Eliminar"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-500">
                                <p>No hay tipos de lote registrados</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default TiposLoteModal;