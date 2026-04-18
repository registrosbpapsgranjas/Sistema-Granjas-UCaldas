// src/components/Recomendaciones/RecomendacionForm.tsx
import React, { useState, useEffect } from 'react';
import diagnosticoService from '../../services/diagnosticoService'; // Importar servicio de diagnósticos
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

    // Estados para diagnósticos
    const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
    const [loadingDiagnosticos, setLoadingDiagnosticos] = useState(false);
    const [diagnosticosFiltrados, setDiagnosticosFiltrados] = useState<any[]>([]);

    // Estados para evidencias
    const [archivos, setArchivos] = useState<File[]>([]);
    const [descripcionesEvidencias, setDescripcionesEvidencias] = useState<string[]>([]);
    const [tiposEvidencia, setTiposEvidencia] = useState<string[]>([]);

    // Roles
    const esAdmin = currentUser?.rol_id === 1;
    const esDocente = currentUser?.rol_id === 2 || currentUser?.rol_id === 5;

    // Cargar diagnósticos cuando cambie el lote seleccionado o al montar
    useEffect(() => {
        const cargarDiagnosticos = async () => {
            if (!formData.lote_id) {
                setDiagnosticos([]);
                setDiagnosticosFiltrados([]);
                return;
            }

            try {
                setLoadingDiagnosticos(true);
                console.log('🔍 Cargando diagnósticos para lote:', formData.lote_id);

                // Cargar diagnósticos con filtro por lote
                const datosDiagnosticos = await diagnosticoService.obtenerDiagnosticos({
                    lote_id: parseInt(formData.lote_id as string)
                });

                // Procesar la respuesta (puede ser array o { items: [] })
                const diagnosticosData = Array.isArray(datosDiagnosticos)
                    ? datosDiagnosticos
                    : (datosDiagnosticos?.items || []);

                console.log('✅ Diagnósticos cargados:', diagnosticosData);

                // Filtrar diagnósticos abiertos o en revisión (suelen ser los más relevantes)
                const diagnosticosDisponibles = diagnosticosData.filter((d: any) =>
                    d.estado === 'abierto' || d.estado === 'en_revision'
                );

                setDiagnosticos(diagnosticosData);
                setDiagnosticosFiltrados(diagnosticosDisponibles);

            } catch (error) {
                console.error('❌ Error cargando diagnósticos:', error);
                setDiagnosticos([]);
                setDiagnosticosFiltrados([]);
            } finally {
                setLoadingDiagnosticos(false);
            }
        };

        cargarDiagnosticos();
    }, [formData.lote_id]);

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

    // Cuando se selecciona un diagnóstico específico, verificar si pertenece al lote seleccionado
    useEffect(() => {
        if (formData.diagnostico_id && formData.lote_id) {
            const diagnosticoSeleccionado = diagnosticos.find(d => d.id === parseInt(formData.diagnostico_id as string));
            if (diagnosticoSeleccionado && diagnosticoSeleccionado.lote_id !== parseInt(formData.lote_id as string)) {
                console.warn('⚠️ El diagnóstico seleccionado no pertenece al lote actual');
                // Opcional: Mostrar advertencia o limpiar selección
            }
        }
    }, [formData.diagnostico_id, formData.lote_id, diagnosticos]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Funciones para manejar evidencias
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

    // Función para formatear fecha
    const formatearFecha = (fechaString: string) => {
        try {
            const fecha = new Date(fechaString);
            return fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return fechaString;
        }
    };

    // Función para obtener el color del estado del diagnóstico
    const getColorEstado = (estado: string) => {
        switch (estado?.toLowerCase()) {
            case 'abierto': return 'text-yellow-600 bg-yellow-50';
            case 'en_revision': return 'text-blue-600 bg-blue-50';
            case 'cerrado': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
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

                    {/* Diagnóstico Asociado - NUEVA IMPLEMENTACIÓN */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Diagnóstico Asociado (Opcional)
                        </label>

                        {!formData.lote_id ? (
                            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
                                <i className="fas fa-info-circle mr-2"></i>
                                Selecciona un lote primero para ver los diagnósticos disponibles
                            </div>
                        ) : loadingDiagnosticos ? (
                            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded border">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-sm text-gray-600">Cargando diagnósticos...</span>
                            </div>
                        ) : diagnosticosFiltrados.length === 0 ? (
                            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded border">
                                <i className="fas fa-search mr-2"></i>
                                No hay diagnósticos disponibles para este lote
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <select
                                    name="diagnostico_id"
                                    value={formData.diagnostico_id}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Seleccionar diagnóstico (opcional)</option>
                                    {diagnosticosFiltrados.map((diagnostico) => (
                                        <option key={diagnostico.id} value={diagnostico.id}>
                                            {diagnostico.tipo} - {formatearFecha(diagnostico.fecha_creacion)}
                                            {diagnostico.descripcion && diagnostico.descripcion.length > 30
                                                ? ` - ${diagnostico.descripcion.substring(0, 30)}...`
                                                : diagnostico.descripcion
                                                    ? ` - ${diagnostico.descripcion}`
                                                    : ''}
                                        </option>
                                    ))}
                                </select>

                                {/* Información del diagnóstico seleccionado */}
                                {formData.diagnostico_id && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                                            <i className="fas fa-info-circle mr-2"></i>
                                            Información del diagnóstico seleccionado
                                        </h4>
                                        {(() => {
                                            const diagnosticoSeleccionado = diagnosticos.find(d =>
                                                d.id === parseInt(formData.diagnostico_id as string)
                                            );
                                            if (!diagnosticoSeleccionado) return null;

                                            return (
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Tipo:</span>
                                                        <span className="font-medium">{diagnosticoSeleccionado.tipo}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Estado:</span>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getColorEstado(diagnosticoSeleccionado.estado)}`}>
                                                            {diagnosticoSeleccionado.estado || 'Desconocido'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Fecha:</span>
                                                        <span>{formatearFecha(diagnosticoSeleccionado.fecha_creacion)}</span>
                                                    </div>
                                                    {diagnosticoSeleccionado.descripcion && (
                                                        <div>
                                                            <span className="text-gray-600 block mb-1">Descripción:</span>
                                                            <p className="text-gray-800">{diagnosticoSeleccionado.descripcion}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        <p className="text-xs text-gray-500 mt-1">
                            Si esta recomendación está asociada a un diagnóstico específico
                        </p>
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

                    {/* SECCIÓN DE EVIDENCIAS */}
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