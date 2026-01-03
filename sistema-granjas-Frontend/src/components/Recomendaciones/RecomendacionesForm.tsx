// src/components/Recomendaciones/RecomendacionForm.tsx
import React, { useState, useEffect } from 'react';
import type { Recomendacion } from '../../types/recomendacionTypes';

interface RecomendacionFormProps {
    recomendacion?: Recomendacion;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    lotes: any[];
    docentes: any[];
    currentUser: any;
    esEdicion?: boolean;
}

const RecomendacionForm: React.FC<RecomendacionFormProps> = ({
    recomendacion,
    onSubmit,
    onCancel,
    lotes,
    docentes,
    currentUser,
    esEdicion = false
}) => {
    // Hooks al inicio siempre
    const [formData, setFormData] = useState({
        titulo: recomendacion?.titulo || '',
        descripcion: recomendacion?.descripcion || '',
        tipo: recomendacion?.tipo || '',
        estado: recomendacion?.estado || 'pendiente',
        docente_id: recomendacion?.docente_id || (currentUser?.rol_id === 2 || currentUser?.rol_id === 5 ? currentUser.id : ''),
        lote_id: recomendacion?.lote_id || '',
        diagnostico_id: recomendacion?.diagnostico_id || '',
    });

    // Estados para evidencias (igual que diagnóstico)
    const [archivos, setArchivos] = useState<File[]>([]);
    const [descripcionesEvidencias, setDescripcionesEvidencias] = useState<string[]>([]);
    const [tiposEvidencia, setTiposEvidencia] = useState<string[]>([]);

    // Roles
    const esAdmin = currentUser?.rol_id === 1;
    const esDocente = currentUser?.rol_id === 2 || currentUser?.rol_id === 5;

    // Auto-seleccionar docente si es docente
    useEffect(() => {
        if (!esEdicion && esDocente && !formData.docente_id) {
            setFormData(prev => ({ ...prev, docente_id: currentUser.id }));
        }
    }, [currentUser, esEdicion, esDocente, formData.docente_id]);

    // Resetear form cuando se cambia recomendacion
    useEffect(() => {
        if (recomendacion) {
            setFormData({
                titulo: recomendacion.titulo || '',
                descripcion: recomendacion.descripcion || '',
                tipo: recomendacion.tipo || '',
                estado: recomendacion.estado || 'pendiente',
                docente_id: recomendacion.docente_id || (esDocente ? currentUser.id : ''),
                lote_id: recomendacion.lote_id || '',
                diagnostico_id: recomendacion.diagnostico_id || '',
            });
        } else if (!esEdicion) {
            // Reset para creación
            setFormData({
                titulo: '',
                descripcion: '',
                tipo: '',
                estado: 'pendiente',
                docente_id: esDocente ? currentUser.id : '',
                lote_id: '',
                diagnostico_id: '',
            });
        }
    }, [recomendacion, esEdicion, esDocente, currentUser]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Funciones para manejar evidencias (igual que diagnóstico)
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

        // Preparar evidencias para enviar
        const evidencias = archivos
            .map((file, index) => ({
                file,
                descripcion: descripcionesEvidencias[index],
                tipo: tiposEvidencia[index]
            }))
            .filter(ev => ev.file);

        // Preparar datos para enviar
        const datosSubmit: any = {
            titulo: formData.titulo,
            descripcion: formData.descripcion,
            tipo: formData.tipo,
            lote_id: parseInt(formData.lote_id as string) || 0,
        };

        // Solo incluir docente_id si no es estudiante auto-asignándose
        if (formData.docente_id) {
            datosSubmit.docente_id = parseInt(formData.docente_id as string);
        }

        // Incluir estado solo en edición
        if (esEdicion) {
            datosSubmit.estado = formData.estado;
        }

        // Incluir diagnostico_id si existe
        if (formData.diagnostico_id) {
            datosSubmit.diagnostico_id = parseInt(formData.diagnostico_id as string);
        }

        // Incluir evidencias si hay
        if (evidencias.length > 0) {
            datosSubmit.evidencias = evidencias;
        }

        console.log("📤 Enviando datos:", datosSubmit);
        onSubmit(datosSubmit);
    };

    const tiposRecomendacion = [
        'Aplicación al suelo', 'Aplicación foliar', 'podas', 'Cosecha y saneamiento', 'Manejo de arvenses', 'Censo poblacional', 'Hormiga arriera', 'otro'
    ];

    const estadosRecomendacion = [
        { value: 'pendiente', label: 'Pendiente', color: 'text-yellow-600' },
        { value: 'aprobada', label: 'Aprobada', color: 'text-green-600' },
        { value: 'en_ejecucion', label: 'En Progreso', color: 'text-blue-600' },
        { value: 'completada', label: 'Completada', color: 'text-purple-600' },
        { value: 'cancelada', label: 'Cancelada', color: 'text-red-600' },
    ];

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 border-b pb-3">
                {esEdicion ? 'Editar Recomendación' : 'Nueva Recomendación'}
            </h2>

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">

                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: Recomendación de riego para café Caturra"
                            required
                        />
                    </div>

                    {/* Tipo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo *
                        </label>
                        <select
                            name="tipo"
                            value={formData.tipo}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Seleccionar tipo</option>
                            {tiposRecomendacion.map(tipo => (
                                <option key={tipo} value={tipo}>
                                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Lote */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lote *
                        </label>
                        <select
                            name="lote_id"
                            value={formData.lote_id}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Seleccionar lote</option>
                            {lotes.map(lote => (
                                <option key={lote.id} value={lote.id}>
                                    {lote.nombre} - {lote.granja_nombre || 'Sin granja'}
                                    {lote.cultivo?.nombre ? ` (${lote.cultivo.nombre})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Docente */}
                    {(esAdmin || !esDocente) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Docente *
                            </label>
                            <select
                                name="docente_id"
                                value={formData.docente_id}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Seleccionar docente</option>
                                {docentes.map(doc => (
                                    <option key={doc.id} value={doc.id}>
                                        {doc.nombre} ({doc.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Docente lectura (si es docente) */}
                    {esDocente && !esAdmin && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Docente
                            </label>
                            <div className="border border-gray-300 p-3 rounded bg-gray-50">
                                {currentUser.nombre} ({currentUser.email})
                            </div>
                        </div>
                    )}

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción *
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows={4}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Describe detalladamente la recomendación..."
                            required
                        />
                    </div>

                    {/* Diagnóstico (opcional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Diagnóstico Asociado (Opcional)
                        </label>
                        <input
                            type="number"
                            name="diagnostico_id"
                            value={formData.diagnostico_id}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ID del diagnóstico (si aplica)"
                            min="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Si esta recomendación está asociada a un diagnóstico específico
                        </p>
                    </div>

                    {/* Estado (solo en edición) */}
                    {esEdicion && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estado
                            </label>
                            <select
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {estadosRecomendacion.map(estado => (
                                    <option key={estado.value} value={estado.value} className={estado.color}>
                                        {estado.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* SECCIÓN DE EVIDENCIAS (igual que diagnóstico) */}
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

                        {archivos.length === 0 && (
                            <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded">
                                <i className="fas fa-image text-3xl text-gray-300 mb-2"></i>
                                <p className="text-gray-500">No hay evidencias agregadas</p>
                                <p className="text-sm text-gray-400 mt-1">Agrega fotografías, documentos u otros archivos como evidencia</p>
                            </div>
                        )}
                    </div>

                </div>

                <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        {esEdicion ? (
                            <>
                                <i className="fas fa-save mr-2"></i>
                                Actualizar Recomendación
                            </>
                        ) : (
                            <>
                                <i className="fas fa-plus mr-2"></i>
                                Crear Recomendación
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RecomendacionForm;