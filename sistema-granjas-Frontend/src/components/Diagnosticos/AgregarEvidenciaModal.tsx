import React, { useState } from 'react';
import type { DiagnosticoItem } from '../../types/diagnosticoTypes';
import Modal from '../Common/Modal';

interface AgregarEvidenciaModalProps {
    isOpen: boolean;
    diagnostico: DiagnosticoItem | null;
    onSubmit: (file: File, descripcion: string, tipo: string) => void;
    onClose: () => void;
}

const AgregarEvidenciaModal: React.FC<AgregarEvidenciaModalProps> = ({
    isOpen,
    diagnostico,
    onSubmit,
    onClose
}) => {

    // Si no hay diagnóstico seleccionado no renderizar
    if (!diagnostico) return null;

    const [file, setFile] = useState<File | null>(null);
    const [descripcion, setDescripcion] = useState('');
    const [tipo, setTipo] = useState('imagen');
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            alert('Por favor selecciona un archivo');
            return;
        }

        if (!descripcion.trim()) {
            alert('Por favor agrega una descripción');
            return;
        }

        setUploading(true);

        try {
            await onSubmit(file, descripcion, tipo);

            // Limpiar formulario
            setFile(null);
            setDescripcion('');
            setTipo('imagen');

        } catch (error) {
            console.error('Error al agregar evidencia:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validar tamaño (máx 10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                alert('El archivo es demasiado grande. Máximo 10MB.');
                return;
            }

            setFile(selectedFile);
        }
    };

    const tiposEvidencia = [
        { value: 'imagen', label: 'Imagen', icon: 'fas fa-image' },
        { value: 'video', label: 'Video', icon: 'fas fa-video' },
        { value: 'documento', label: 'Documento', icon: 'fas fa-file-alt' },
        { value: 'audio', label: 'Audio', icon: 'fas fa-volume-up' },
        { value: 'otro', label: 'Otro', icon: 'fas fa-file' }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-2xl">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            Agregar Evidencia
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Diagnóstico: <span className="font-medium">{diagnostico.tipo}</span> (ID: #{diagnostico.id})
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">

                        {/* Tipo de evidencia */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Tipo de evidencia *
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {tiposEvidencia.map((item) => (
                                    <button
                                        type="button"
                                        key={item.value}
                                        onClick={() => setTipo(item.value)}
                                        className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${tipo === item.value
                                            ? 'bg-blue-50 border-blue-500 text-blue-600 ring-2 ring-blue-500 ring-opacity-50'
                                            : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <i className={`${item.icon} text-xl mb-2`}></i>
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción *
                            </label>
                            <textarea
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                placeholder="Describe esta evidencia. Ej: 'Fotografía de hojas afectadas', 'Análisis de suelo en PDF', etc."
                                required
                            />
                        </div>

                        {/* Selección de archivo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Archivo *
                            </label>

                            <div className={`border-2 ${file ? 'border-green-500' : 'border-gray-300'} border-dashed rounded-xl p-8 text-center transition-colors`}>
                                {file ? (
                                    <div className="space-y-3">
                                        <div className="text-green-600">
                                            <i className="fas fa-check-circle text-3xl mb-2"></i>
                                            <p className="font-medium">Archivo seleccionado</p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <i className="fas fa-file text-gray-400 mr-3 text-xl"></i>
                                                    <div>
                                                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setFile(null)}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center justify-center"
                                        >
                                            <i className="fas fa-times mr-1"></i>
                                            Quitar archivo
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                                        <p className="text-gray-500 mb-2">Arrastra o haz clic para seleccionar un archivo</p>
                                        <p className="text-sm text-gray-400 mb-4">Máximo 10MB</p>

                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="file-upload"
                                            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.mp3,.wav"
                                        />

                                        <label
                                            htmlFor="file-upload"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium cursor-pointer inline-flex items-center"
                                        >
                                            <i className="fas fa-upload mr-2"></i>
                                            Seleccionar Archivo
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                            disabled={uploading}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={!file || !descripcion.trim() || uploading}
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Subiendo...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check mr-2"></i>
                                    Agregar Evidencia
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AgregarEvidenciaModal;
