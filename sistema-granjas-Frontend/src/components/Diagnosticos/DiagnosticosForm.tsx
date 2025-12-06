import React, { useState, useEffect } from 'react';
import type { DiagnosticoItem } from '../../types/diagnosticoTypes';

interface DiagnosticoFormProps {
    diagnostico?: DiagnosticoItem;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    lotes: any[];
    docentes: any[];
    estudiantes: any[];
    tipos: string[];
    currentUser: any;
    esEdicion?: boolean;
}

const DiagnosticoForm: React.FC<DiagnosticoFormProps> = ({
    diagnostico,
    onSubmit,
    onCancel,
    lotes,
    docentes,
    estudiantes,
    tipos,
    currentUser,
    esEdicion = false
}) => {

    const [formData, setFormData] = useState({
        tipo: diagnostico?.tipo || '',
        descripcion: diagnostico?.descripcion || '',
        observaciones: diagnostico?.observaciones || '', // 👈 AÑADE ESTA LINEA
        lote_id: diagnostico?.lote_id || '',
        estudiante_id: diagnostico?.estudiante_id || '',
        docente_id: diagnostico?.docente_id || '',
    });

    // Evidencias (solo en creación o edición si quieres permitirlo)
    const [archivos, setArchivos] = useState<File[]>([]);
    const [descripcionesEvidencias, setDescripcionesEvidencias] = useState<string[]>([]);
    const [tiposEvidencia, setTiposEvidencia] = useState<string[]>([]);

    // Roles
    const esAdmin = currentUser?.rol_id === 1;
    const esDocente = currentUser?.rol_id === 2 || currentUser?.rol_id === 3;
    const esEstudiante = currentUser?.rol_id === 4;

    // Auto-seleccionar lote si solo hay uno
    useEffect(() => {
        if (lotes.length === 1 && !formData.lote_id) {
            setFormData(prev => ({ ...prev, lote_id: lotes[0].id }));
        }
    }, [lotes]);

    // Autoseleccionar estudiante según rol
    useEffect(() => {
        if (!formData.estudiante_id && esEstudiante) {
            setFormData(prev => ({ ...prev, estudiante_id: currentUser.id }));
        }
    }, [currentUser, esEdicion]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Evidencias
    const agregarEvidencia = () => {
        setArchivos(prev => [...prev, null as any]);
        setDescripcionesEvidencias(prev => [...prev, '']);
        setTiposEvidencia(prev => [...prev, 'imagen']);
    };

    const eliminarEvidencia = (index: number) => {
        setArchivos(prev => prev.filter((_, i) => i !== index));
        setDescripcionesEvidencias(prev => prev.filter((_, i) => i !== index));
        setTiposEvidencia(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileChange = (index: number, file: File | null) => {
        const copia = [...archivos];
        copia[index] = file as any;
        setArchivos(copia);
    };

    const handleDescripcionChange = (index: number, value: string) => {
        const copia = [...descripcionesEvidencias];
        copia[index] = value;
        setDescripcionesEvidencias(copia);
    };

    const handleTipoEvidenciaChange = (index: number, value: string) => {
        const copia = [...tiposEvidencia];
        copia[index] = value;
        setTiposEvidencia(copia);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const evidencias = archivos.map((file, index) => ({
            file,
            descripcion: descripcionesEvidencias[index],
            tipo: tiposEvidencia[index]
        })).filter(ev => ev.file);

        const datosSubmit = {
            ...formData,
            lote_id: parseInt(formData.lote_id as any),
            estudiante_id: formData.estudiante_id ? parseInt(formData.estudiante_id as any) : undefined,
            docente_id: formData.docente_id ? parseInt(formData.docente_id as any) : undefined,
            evidencias: evidencias.length > 0 ? evidencias : undefined
        };

        console.log("📤 Enviando datos:", datosSubmit);
        onSubmit(datosSubmit);
    };

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 border-b pb-3">
                {esEdicion ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico'}
            </h2>

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">

                    {/* Tipo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                        <select
                            name="tipo"
                            value={formData.tipo}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-3"
                            required
                        >
                            <option value="">Seleccionar tipo</option>
                            {tipos.map(tipo => (
                                <option key={tipo} value={tipo}>
                                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Lote */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lote *</label>
                        <select
                            name="lote_id"
                            value={formData.lote_id}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-3"
                            required
                        >
                            <option value="">Seleccionar lote</option>
                            {lotes.map(lote => (
                                <option key={lote.id} value={lote.id}>
                                    {lote.nombre} - {lote.cultivo?.nombre || 'Sin cultivo'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Estudiante */}
                    {(esAdmin || esDocente) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Estudiante *</label>
                            <select
                                name="estudiante_id"
                                value={formData.estudiante_id}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-3"
                                required
                            >
                                <option value="">Seleccionar estudiante</option>
                                {estudiantes.map(est => (
                                    <option key={est.id} value={est.id}>
                                        {est.nombre} ({est.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Estudiante lectura */}
                    {esEstudiante && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Estudiante</label>
                            <div className="border p-3 rounded bg-gray-50">
                                {currentUser.nombre} ({currentUser.email})
                            </div>
                        </div>
                    )}

                    {/* Docente opcional */}
                    {(esAdmin || esEstudiante) && (
                        <div className="bg-blue-50 border rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Asignar Docente</label>
                            <select
                                name="docente_id"
                                value={formData.docente_id}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-3"
                            >
                                <option value="">No asignar</option>
                                {docentes.map(doc => (
                                    <option key={doc.id} value={doc.id}>
                                        {doc.nombre} ({doc.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows={4}
                            className="w-full border rounded-lg p-3"
                            placeholder="Describe el problema o situación encontrada..."
                            required
                        />
                    </div>

                    {/* 👇 AÑADE ESTA SECCIÓN - OBSERVACIONES */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observaciones (Opcional)
                        </label>
                        <textarea
                            name="observaciones"
                            value={formData.observaciones}
                            onChange={handleChange}
                            rows={3}
                            className="w-full border rounded-lg p-3"
                            placeholder="Notas adicionales, consideraciones o comentarios..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Puedes agregar observaciones adicionales, recomendaciones o comentarios relevantes
                        </p>
                    </div>

                    {/* Evidencias */}
                    <div className="mt-4">
                        <div className="flex justify-between mb-2">
                            <label className="font-medium text-gray-700">Evidencias</label>
                            <button
                                type="button"
                                onClick={agregarEvidencia}
                                className="text-blue-600 text-sm"
                            >
                                + Agregar evidencia
                            </button>
                        </div>

                        {archivos.map((_, index) => (
                            <div key={index} className="border rounded-lg p-4 mb-3">

                                <div className="flex justify-between mb-2">
                                    <span className="font-medium text-sm">Evidencia {index + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => eliminarEvidencia(index)}
                                        className="text-red-500"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-sm text-gray-600">Tipo</label>
                                        <select
                                            value={tiposEvidencia[index]}
                                            onChange={(e) => handleTipoEvidenciaChange(index, e.target.value)}
                                            className="w-full border rounded p-2"
                                        >
                                            <option value="imagen">Imagen</option>
                                            <option value="video">Video</option>
                                            <option value="documento">Documento</option>
                                            <option value="audio">Audio</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-sm text-gray-600">Descripción</label>
                                        <input
                                            type="text"
                                            value={descripcionesEvidencias[index]}
                                            onChange={(e) => handleDescripcionChange(index, e.target.value)}
                                            className="w-full border rounded p-2"
                                            placeholder="Describe esta evidencia"
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="text-sm text-gray-600">Archivo</label>
                                        <input
                                            type="file"
                                            className="w-full"
                                            accept="image/*,video/*,.pdf,.doc,.docx"
                                            onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                                        />
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-5 border-t">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2.5 border rounded-lg hover:bg-gray-100"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700"
                    >
                        {esEdicion ? 'Actualizar' : 'Crear'} Diagnóstico
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DiagnosticoForm;