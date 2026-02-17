import React, { useState, useEffect, useCallback } from 'react';
import type { DiagnosticoItem } from '../../types/diagnosticoTypes';
// Importar componentes de la encuesta
import { CensoSection } from './CensoSection'; // Ajusta la ruta
import { FenologicoSection } from './FenologicoSection'; // Ajusta la ruta
import { ArthropodSection } from './ArthropodSection'; // Ajusta la ruta

// Tipos de monitoreo disponibles
const TIPOS_MONITOREO = [
    { value: 'citricos', label: 'MONITOREO EN CÍTRICOS' },
    { value: 'aguacate', label: 'MONITOREO EN AGUACATE' }
];

// Interfaz para planta base (similar a la de encuesta)
interface PlantaBase {
    codigo: string;
    label: string;
}

interface DiagnosticoFormProps {
    diagnostico?: DiagnosticoItem;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    lotes: any[];
    docentes: any[];
    estudiantes: any[];
    tipos: string[];
    estados?: string[];
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
    estados = ['abierto', 'en_revision', 'cerrado'],
    currentUser,
    esEdicion = false
}) => {
    // Estados del wizard
    const [paso, setPaso] = useState(1);
    const [tipoMonitoreo, setTipoMonitoreo] = useState<string>('');
    const [loteSeleccionado, setLoteSeleccionado] = useState<string>('');
    const [plantasSeleccionadas, setPlantasSeleccionadas] = useState<PlantaBase[]>([]);
    const [caracterizacion, setCaracterizacion] = useState<Record<string, string>>({});

    // Estados originales del formulario
    const [formData, setFormData] = useState({
        tipo: diagnostico?.tipo || '',
        descripcion: diagnostico?.descripcion || '',
        observaciones: diagnostico?.observaciones || '',
        estado: diagnostico?.estado || 'abierto',
        lote_id: diagnostico?.lote_id || '',
        estudiante_id: diagnostico?.estudiante_id || '',
        docente_id: diagnostico?.docente_id || '',
    });

    // Evidencias
    const [archivos, setArchivos] = useState<File[]>([]);
    const [descripcionesEvidencias, setDescripcionesEvidencias] = useState<string[]>([]);
    const [tiposEvidencia, setTiposEvidencia] = useState<string[]>([]);

    // Roles
    const esAdmin = currentUser?.rol_id === 1;
    const esDocente = currentUser?.rol_id === 2 || currentUser?.rol_id === 5;
    const esEstudiante = currentUser?.rol_id === 4;

    // Si es edición, cargar en paso 2 con datos existentes
    useEffect(() => {
        if (esEdicion && diagnostico) {
            setPaso(2);
            // Si el diagnóstico tuviera campos específicos de monitoreo, los cargaríamos aquí
            // Por ahora, solo cargamos lo básico
        }
    }, [esEdicion, diagnostico]);

    // Auto-seleccionar lote si solo hay uno
    useEffect(() => {
        if (lotes.length === 1 && !formData.lote_id) {
            setFormData(prev => ({ ...prev, lote_id: lotes[0].id }));
            setLoteSeleccionado(lotes[0].id.toString());
        }
    }, [lotes]);

    // Autoseleccionar estudiante según rol
    useEffect(() => {
        if (!formData.estudiante_id && esEstudiante) {
            setFormData(prev => ({ ...prev, estudiante_id: currentUser.id }));
        }
    }, [currentUser, esEdicion]);

    // Generar plantas aleatorias (función copiada de useEncuestaState)
    const generarPlantas = useCallback((cantidad: number): PlantaBase[] => {
        const pares = new Set<string>();
        while (pares.size < cantidad) {
            const surco = Math.floor(Math.random() * 20) + 1;
            const planta = Math.floor(Math.random() * 20) + 1;
            pares.add(`${surco}-${planta}`);
        }
        return Array.from(pares).map((par) => {
            const [surco, planta] = par.split("-");
            return {
                codigo: par,
                label: `Surco ${surco}, Planta ${planta}`,
            };
        });
    }, []);

    // Manejar cambio de lote en paso 1
    const handleLoteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const loteId = e.target.value;
        setLoteSeleccionado(loteId);
        setFormData(prev => ({ ...prev, lote_id: loteId }));
        // Generar plantas al seleccionar lote
        if (loteId) {
            const nuevas = generarPlantas(5);
            setPlantasSeleccionadas(nuevas);
        } else {
            setPlantasSeleccionadas([]);
        }
    };

    // Ir al paso 2
    const handleSiguiente = () => {
        if (!tipoMonitoreo) {
            alert('Debe seleccionar un tipo de monitoreo');
            return;
        }
        if (!loteSeleccionado) {
            alert('Debe seleccionar un lote');
            return;
        }
        setPaso(2);
    };

    // Volver al paso 1
    const handleAtras = () => {
        setPaso(1);
    };

    // Manejar cambios en campos básicos
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Manejar cambios en caracterización (para censo, fenológico, etc.)
    const handleCaracterizacionChange = (campo: string, valor: string) => {
        setCaracterizacion(prev => ({ ...prev, [campo]: valor }));
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

    // Función para obtener el color del estado
    const getEstadoColor = (estado: string) => {
        const colores: Record<string, string> = {
            abierto: 'bg-green-100 text-green-800 border-green-200',
            en_revision: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            cerrado: 'bg-red-100 text-red-800 border-red-200'
        };
        return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Función para obtener el icono del estado
    const getEstadoIcon = (estado: string) => {
        const iconos: Record<string, string> = {
            abierto: 'fas fa-circle',
            en_revision: 'fas fa-clock',
            cerrado: 'fas fa-check-circle'
        };
        return iconos[estado] || 'fas fa-question-circle';
    };

    // Manejar envío final
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const estadoFinal = esEdicion ? formData.estado : 'abierto';

        const evidencias = archivos.map((file, index) => ({
            file,
            descripcion: descripcionesEvidencias[index],
            tipo: tiposEvidencia[index]
        })).filter(ev => ev.file);

        // Construir datos finales, incluyendo caracterización y plantas si aplica
        const datosSubmit = {
            ...formData,
            estado: estadoFinal,
            lote_id: parseInt(formData.lote_id as string),
            estudiante_id: formData.estudiante_id ? parseInt(formData.estudiante_id as string) : undefined,
            docente_id: formData.docente_id ? parseInt(formData.docente_id as string) : undefined,
            tipo_monitoreo: tipoMonitoreo, // Agregar el tipo de monitoreo
            plantas: plantasSeleccionadas, // Las plantas generadas
            caracterizacion: caracterizacion, // Datos específicos de censo/fenologico/artropodos
            evidencias: evidencias.length > 0 ? evidencias : undefined
        };

        console.log("📤 Enviando datos:", datosSubmit);
        onSubmit(datosSubmit);
    };

    // Renderizado condicional por pasos
    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 border-b pb-3">
                {esEdicion ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico'}
            </h2>

            {/* Indicador de pasos */}
            <div className="flex mb-6">
                <div className={`flex-1 text-center py-2 ${paso === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    Paso 1: Seleccionar tipo y lote
                </div>
                <div className={`flex-1 text-center py-2 ${paso === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    Paso 2: Completar formulario
                </div>
            </div>

            {paso === 1 && (
                <div className="space-y-6">
                    {/* Selección de tipo de monitoreo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Monitoreo *
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {TIPOS_MONITOREO.map(tipo => (
                                <button
                                    key={tipo.value}
                                    type="button"
                                    onClick={() => setTipoMonitoreo(tipo.value)}
                                    className={`p-4 border-2 rounded-lg text-center transition ${
                                        tipoMonitoreo === tipo.value
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <span className="font-medium">{tipo.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selección de lote */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lote *
                        </label>
                        <select
                            value={loteSeleccionado}
                            onChange={handleLoteChange}
                            className="w-full border rounded-lg p-3"
                            required
                        >
                            <option value="">Seleccionar lote</option>
                            {lotes.map(lote => (
                                <option key={lote.id} value={lote.id}>
                                    {lote.nombre} ({lote.granja_nombre || 'Sin granja'})
                                </option>
                            ))}
                        </select>
                        {loteSeleccionado && plantasSeleccionadas.length > 0 && (
                            <p className="text-sm text-green-600 mt-2">
                                Se han generado 5 plantas aleatorias para el lote seleccionado.
                            </p>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleSiguiente}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {paso === 2 && (
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Mostrar resumen de selección */}
                        <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Tipo monitoreo:</span> {
                                        TIPOS_MONITOREO.find(t => t.value === tipoMonitoreo)?.label
                                    }
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Lote:</span> {
                                        lotes.find(l => l.id.toString() === loteSeleccionado)?.nombre
                                    }
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAtras}
                                className="text-blue-600 hover:underline text-sm"
                            >
                                Cambiar selección
                            </button>
                        </div>

                        {/* Sección de estado (solo edición) */}
                        {esEdicion && (esAdmin || esDocente) && (
                            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Estado del Diagnóstico
                                    </label>
                                    {diagnostico && (
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(diagnostico.estado)}`}>
                                            <i className={`${getEstadoIcon(diagnostico.estado)} mr-2`}></i>
                                            {diagnostico.estado.charAt(0).toUpperCase() + diagnostico.estado.slice(1)}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {estados.map(estado => (
                                        <div key={estado} className="flex items-center">
                                            <input
                                                type="radio"
                                                id={`estado_${estado}`}
                                                name="estado"
                                                value={estado}
                                                checked={formData.estado === estado}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            <label
                                                htmlFor={`estado_${estado}`}
                                                className="flex items-center text-sm cursor-pointer"
                                            >
                                                <span className={`w-3 h-3 rounded-full mr-2 ${getEstadoColor(estado)}`}></span>
                                                {estado === 'abierto' && 'Abierto'}
                                                {estado === 'en_revision' && 'En Revisión'}
                                                {estado === 'cerrado' && 'Cerrado'}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tipo (campo original) */}
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
                                        {tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Secciones específicas según tipo de monitoreo */}
                        {tipoMonitoreo === 'citricos' && (
                            <div>
                                {/* Aquí puedes poner los componentes específicos para cítricos */}
                                <p className="text-sm text-gray-500">Sección para monitoreo en cítricos (pendiente de definir)</p>
                                {/* Ejemplo de uso de CensoSection */}
                                <CensoSection
                                    plantas={plantasSeleccionadas}
                                    caracterizacion={caracterizacion}
                                    onCampoChange={handleCaracterizacionChange}
                                />
                                {/* Podrías también mostrar FenologicoSection o ArthropodSection según algún sub-tipo */}
                            </div>
                        )}

                        {tipoMonitoreo === 'aguacate' && (
                            <div>
                                <p className="text-sm text-gray-500">Sección para monitoreo en aguacate (pendiente de definir)</p>
                                {/* Similar */}
                                <FenologicoSection
                                    plantas={plantasSeleccionadas.map(p => ({ ...p, fase: '' }))}
                                    caracterizacion={caracterizacion}
                                    onCampoChange={handleCaracterizacionChange}
                                    onFaseChange={(idx, fase) => {
                                        // Manejar cambio de fase si es necesario
                                        // Por simplicidad, aquí no implementamos
                                    }}
                                />
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

                        {/* Observaciones */}
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
                        </div>

                        {/* Estudiante y Docente (mantener igual que original) */}
                        {(esAdmin || esEstudiante) && (
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

                        {esEstudiante && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Estudiante</label>
                                <div className="border p-3 rounded bg-gray-50">
                                    {currentUser.nombre} ({currentUser.email})
                                </div>
                            </div>
                        )}

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

                    {/* Botones de acción */}
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
            )}
        </div>
    );
};

export default DiagnosticoForm;