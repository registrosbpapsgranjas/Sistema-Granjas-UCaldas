import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DiagnosticoItem, CrearDiagnosticoDTO, ArchivoEvidencia } from '../../types/diagnosticoTypes';
import { monitoreoService, type Monitoreo } from '../../services/monitoreoService';
import { CensoSection } from './CensoSection';
import { FenologicoSection } from './FenologicoSection';
import { ArthropodSection } from './ArthropodSection';
import { EnfermedadesSection } from './EnfermedadesSection';
import { ArvensesSection } from './ArvensesSection';
import { ControladoresSection } from './ControladoresSection';
import { PolinizadoresSection } from './PolinizadoresSection';
import { toast } from 'react-toastify';

interface PlantaBase {
    codigo: string;
    label: string;
}

interface Programa {
    id: number;
    nombre: string;
    tipo?: string;
    descripcion?: string;
    activo?: boolean;
}

interface Lote {
    id: number;
    nombre: string;
    granja_id?: number;
    granja_nombre?: string;
    programa_id: number;
    estado?: string;
    fecha_inicio?: string;
    cultivos_ids?: number[];
}

interface DiagnosticoFormProps {
    diagnostico?: DiagnosticoItem;
    onSubmit: (data: CrearDiagnosticoDTO & { 
        programa_id?: number; 
        tipo_monitoreo?: number;  // ID del monitoreo
        plantas?: PlantaBase[];
        caracterizacion?: Record<string, string>;
    }) => void;
    onCancel: () => void;
    lotes: Lote[];
    programas: Programa[];
    monitoreos?: Monitoreo[];  // opcional, se cargarán internamente si no se proveen
    docentes: any[];
    estudiantes: any[];
    tipos: string[];
    estados?: string[];
    condiciones_dia: string[];
    currentUser: any;
    esEdicion?: boolean;
}

const DiagnosticoForm: React.FC<DiagnosticoFormProps> = ({
    diagnostico,
    onSubmit,
    onCancel,
    lotes = [],
    programas = [],
    monitoreos: externalMonitoreos,
    docentes = [],
    estudiantes = [],
    tipos = [],
    estados = ['abierto', 'en_revision', 'cerrado'],
    condiciones_dia = ['Soleado', 'Nublado', 'Lluvia'],
    currentUser,
    esEdicion = false
}) => {
    // Estados del wizard
    const [paso, setPaso] = useState(1);
    const [programaSeleccionadoId, setProgramaSeleccionadoId] = useState<number | null>(null);
    const [tipoMonitoreoId, setTipoMonitoreoId] = useState<number | null>(null);
    const [loteSeleccionadoId, setLoteSeleccionadoId] = useState<number | null>(null);
    const [plantasSeleccionadas, setPlantasSeleccionadas] = useState<PlantaBase[]>([]);
    const [caracterizacion, setCaracterizacion] = useState<Record<string, string>>({});
    
    // Estado para monitoreos (cargados desde backend)
    const [monitoreos, setMonitoreos] = useState<Monitoreo[]>(externalMonitoreos || []);

    // Estados originales del formulario
    const [formData, setFormData] = useState({
        tipo: diagnostico?.tipo || '',
        condiciones_dia: diagnostico?.condiciones_dia || '',
        descripcion: diagnostico?.descripcion || '',
        observaciones: diagnostico?.observaciones || '',
        estado: diagnostico?.estado || 'abierto',
        lote_id: diagnostico?.lote_id || '',
        estudiante_id: diagnostico?.estudiante_id || '',
        docente_id: diagnostico?.docente_id || '',
    });

    // Evidencias
    const [evidencias, setEvidencias] = useState<ArchivoEvidencia[]>([]);

    // Roles
    const esAdmin = currentUser?.rol_id === 1;
    const esDocente = currentUser?.rol_id === 2 || currentUser?.rol_id === 5;
    const esEstudiante = currentUser?.rol_id === 4;

    // Cargar monitoreos cuando cambia el programa seleccionado
    useEffect(() => {
        const cargarMonitoreos = async () => {
            if (!programaSeleccionadoId) {
                setMonitoreos([]);
                return;
            }
            try {
                const data = await monitoreoService.obtenerMonitoreosPorPrograma(programaSeleccionadoId);
                setMonitoreos(data);
            } catch (error) {
                console.error('Error cargando monitoreos:', error);
                setMonitoreos([]);
                toast.error('Error al cargar tipos de monitoreo');
            }
        };
        cargarMonitoreos();
    }, [programaSeleccionadoId]);

    // Filtrar lotes por programa seleccionado
    const lotesFiltrados = useMemo(() => {
        if (!programaSeleccionadoId || !lotes || lotes.length === 0) return [];
        return lotes.filter(lote => lote.programa_id === programaSeleccionadoId);
    }, [lotes, programaSeleccionadoId]);

    const programaSeleccionado = useMemo(() => {
        if (!programaSeleccionadoId || !programas || programas.length === 0) return null;
        return programas.find(p => p.id === programaSeleccionadoId);
    }, [programas, programaSeleccionadoId]);

    const loteSeleccionado = useMemo(() => {
        if (!loteSeleccionadoId || !lotesFiltrados.length) return null;
        return lotesFiltrados.find(l => l.id === loteSeleccionadoId);
    }, [lotesFiltrados, loteSeleccionadoId]);

    const monitoreoSeleccionado = useMemo(() => {
        if (!tipoMonitoreoId || !monitoreos.length) return null;
        return monitoreos.find(m => m.id === tipoMonitoreoId);
    }, [monitoreos, tipoMonitoreoId]);

    // Cargar datos en modo edición
    useEffect(() => {
        if (esEdicion && diagnostico) {
            setPaso(2);
            if (diagnostico.lote_id) {
                setLoteSeleccionadoId(diagnostico.lote_id);
                const lote = lotes.find(l => l.id === diagnostico.lote_id);
                if (lote?.programa_id) setProgramaSeleccionadoId(lote.programa_id);
            }
            if ((diagnostico as any).tipo_monitoreo_id) {
                setTipoMonitoreoId((diagnostico as any).tipo_monitoreo_id);
            } else if ((diagnostico as any).tipo_monitoreo && typeof (diagnostico as any).tipo_monitoreo === 'number') {
                setTipoMonitoreoId((diagnostico as any).tipo_monitoreo);
            }
            if ((diagnostico as any).plantas?.length > 0) {
                setPlantasSeleccionadas((diagnostico as any).plantas);
            } else if (diagnostico.lote_id) {
                const nuevas = generarPlantas(5);
                setPlantasSeleccionadas(nuevas);
            }
            if ((diagnostico as any).caracterizacion) {
                setCaracterizacion((diagnostico as any).caracterizacion);
            }
        }
    }, [esEdicion, diagnostico, lotes]);

    // Auto‑selección de lote si solo hay uno
    useEffect(() => {
        if (!esEdicion && lotesFiltrados.length === 1 && !loteSeleccionadoId && !formData.lote_id) {
            const loteUnico = lotesFiltrados[0];
            setLoteSeleccionadoId(loteUnico.id);
            setFormData(prev => ({ ...prev, lote_id: loteUnico.id.toString() }));
            const nuevas = generarPlantas(5);
            setPlantasSeleccionadas(nuevas);
            toast.info(`Se ha seleccionado automáticamente el lote: ${loteUnico.nombre}`);
        }
    }, [lotesFiltrados, esEdicion]);

    // Autoseleccionar estudiante según rol
    useEffect(() => {
        if (!esEdicion && !formData.estudiante_id && esEstudiante && currentUser?.id) {
            setFormData(prev => ({ ...prev, estudiante_id: currentUser.id }));
        }
    }, [currentUser, esEstudiante, esEdicion]);

    const generarPlantas = useCallback((cantidad: number): PlantaBase[] => {
        try {
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
        } catch (err) {
            console.error("Error al generar plantas:", err);
            return [];
        }
    }, []);

    const handleLoteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        try {
            const loteId = e.target.value ? parseInt(e.target.value) : null;
            setLoteSeleccionadoId(loteId);
            setFormData(prev => ({ ...prev, lote_id: loteId?.toString() || '' }));
            if (loteId) {
                const nuevas = generarPlantas(5);
                setPlantasSeleccionadas(nuevas);
            } else {
                setPlantasSeleccionadas([]);
            }
        } catch (err) {
            console.error("Error al cambiar lote:", err);
            toast.error("Error al seleccionar el lote");
        }
    };

    const handleProgramaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        try {
            const programaId = e.target.value ? parseInt(e.target.value) : null;
            setProgramaSeleccionadoId(programaId);
            setTipoMonitoreoId(null);
            setLoteSeleccionadoId(null);
            setFormData(prev => ({ ...prev, lote_id: '' }));
            setPlantasSeleccionadas([]);
            if (programaId) {
                toast.info(`Programa seleccionado: ${programas.find(p => p.id === programaId)?.nombre}`);
            }
        } catch (err) {
            console.error("Error al cambiar programa:", err);
            toast.error("Error al seleccionar el programa");
        }
    };

    const handleSiguiente = () => {
        if (!programaSeleccionadoId) {
            toast.warning('Debe seleccionar un programa');
            return;
        }
        if (!tipoMonitoreoId) {
            toast.warning('Debe seleccionar un tipo de monitoreo');
            return;
        }
        if (!loteSeleccionadoId) {
            toast.warning('Debe seleccionar un lote');
            return;
        }
        const loteValido = lotesFiltrados.find(l => l.id === loteSeleccionadoId);
        if (!loteValido) {
            toast.error('El lote seleccionado no pertenece al programa elegido');
            return;
        }
        setPaso(2);
    };

    const handleAtras = () => setPaso(1);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCaracterizacionChange = (campo: string, valor: string) => {
        setCaracterizacion(prev => ({ ...prev, [campo]: valor }));
    };

    // Evidencias
    const agregarEvidencia = () => {
        setEvidencias(prev => [...prev, { file: null as any, descripcion: '', tipo: 'imagen' }]);
    };

    const eliminarEvidencia = (index: number) => {
        setEvidencias(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileChange = (index: number, file: File | null) => {
        const copia = [...evidencias];
        copia[index] = { ...copia[index], file: file as File };
        setEvidencias(copia);
    };

    const handleDescripcionChange = (index: number, value: string) => {
        const copia = [...evidencias];
        copia[index] = { ...copia[index], descripcion: value };
        setEvidencias(copia);
    };

    const handleTipoEvidenciaChange = (index: number, value: string) => {
        const copia = [...evidencias];
        copia[index] = { ...copia[index], tipo: value };
        setEvidencias(copia);
    };

    const getEstadoColor = (estado: string) => {
        const colores: Record<string, string> = {
            abierto: 'bg-green-100 text-green-800 border-green-200',
            en_revision: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            cerrado: 'bg-red-100 text-red-800 border-red-200'
        };
        return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getEstadoIcon = (estado: string) => {
        const iconos: Record<string, string> = {
            abierto: 'fas fa-circle',
            en_revision: 'fas fa-clock',
            cerrado: 'fas fa-check-circle'
        };
        return iconos[estado] || 'fas fa-question-circle';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (!formData.tipo) {
                toast.error('Debe seleccionar un tipo de diagnóstico');
                return;
            }
            if (!formData.descripcion) {
                toast.error('Debe ingresar una descripción');
                return;
            }
            if (!loteSeleccionadoId) {
                toast.error('Debe seleccionar un lote');
                return;
            }
            if (!tipoMonitoreoId) {
                toast.error('Debe seleccionar un tipo de monitoreo');
                return;
            }

            const evidenciasValidas = evidencias.filter(ev => ev.file !== null && ev.file !== undefined);

            const datosSubmit: CrearDiagnosticoDTO & {
                programa_id?: number;
                tipo_monitoreo?: number;
                plantas?: PlantaBase[];
                caracterizacion?: Record<string, string>;
                condiciones_dia?: string;
            } = {
                tipo: formData.tipo,
                descripcion: `${formData.descripcion}\n\nCondiciones del día: ${formData.condiciones_dia}\n\nCaracterización: ${JSON.stringify(caracterizacion)}`,
                lote_id: loteSeleccionadoId,
                estudiante_id: formData.estudiante_id ? parseInt(formData.estudiante_id as string) : undefined,
                docente_id: formData.docente_id ? parseInt(formData.docente_id as string) : undefined,
                evidencias: evidenciasValidas.length > 0 ? evidenciasValidas : undefined,
                programa_id: programaSeleccionadoId || undefined,
                tipo_monitoreo: tipoMonitoreoId,
                plantas: plantasSeleccionadas,
                caracterizacion: caracterizacion,
                condiciones_dia: formData.condiciones_dia
            };

            if (esEdicion && diagnostico) {
                (datosSubmit as any).id = diagnostico.id;
                (datosSubmit as any).estado = formData.estado;
                (datosSubmit as any).observaciones = formData.observaciones;
            }

            console.log("📤 Enviando datos:", datosSubmit);
            onSubmit(datosSubmit);
            toast.success(esEdicion ? 'Diagnóstico actualizado' : 'Diagnóstico creado');
        } catch (err) {
            console.error("Error al enviar formulario:", err);
            toast.error("Error al guardar el diagnóstico");
        }
    };

    console.log('🔍 Debug - DiagnosticoForm:', {
        programas: programas.length,
        lotes: lotes.length,
        monitoreos: monitoreos.length,
        programaSeleccionadoId,
        tipoMonitoreoId,
        lotesFiltrados: lotesFiltrados.length
    });

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 border-b pb-3">
                {esEdicion ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico'}
            </h2>

            <div className="flex mb-6">
                <div className={`flex-1 text-center py-2 rounded-l-lg ${paso === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    Paso 1: Seleccionar programa, monitoreo y lote
                </div>
                <div className={`flex-1 text-center py-2 rounded-r-lg ${paso === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    Paso 2: Completar formulario
                </div>
            </div>

            {paso === 1 && (
                <div className="space-y-6">
                    {/* Programa */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Programa *</label>
                        <select
                            value={programaSeleccionadoId?.toString() || ''}
                            onChange={handleProgramaChange}
                            className="w-full border rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Seleccionar programa</option>
                            {programas.map(programa => (
                                <option key={programa.id} value={programa.id}>
                                    {programa.nombre}
                                </option>
                            ))}
                        </select>
                        {programaSeleccionado && (
                            <p className="text-sm text-green-600 mt-2">✓ Programa seleccionado: {programaSeleccionado.nombre}</p>
                        )}
                    </div>

                    {/* Monitoreos */}
                    {programaSeleccionadoId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Monitoreo *</label>
                            {monitoreos.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {monitoreos.map(monitoreo => (
                                        <button
                                            key={monitoreo.id}
                                            type="button"
                                            onClick={() => setTipoMonitoreoId(monitoreo.id)}
                                            className={`p-4 border-2 rounded-lg text-center transition ${
                                                tipoMonitoreoId === monitoreo.id
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                            }`}
                                        >
                                            <i className="fas fa-chart-line mr-2"></i>
                                            <span className="font-medium">{monitoreo.nombre}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <p className="text-sm text-yellow-700">
                                        <i className="fas fa-info-circle mr-2"></i>
                                        Este programa no tiene tipos de monitoreo configurados.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Lote */}
                    {tipoMonitoreoId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Lote *</label>
                            {lotesFiltrados.length > 0 ? (
                                <>
                                    <select
                                        value={loteSeleccionadoId?.toString() || ''}
                                        onChange={handleLoteChange}
                                        className="w-full border rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Seleccionar lote</option>
                                        {lotesFiltrados.map(lote => (
                                            <option key={lote.id} value={lote.id}>
                                                {lote.nombre} {lote.granja_nombre ? `(${lote.granja_nombre})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {loteSeleccionado && (
                                        <div className="mt-2 space-y-1">
                                            <p className="text-sm text-green-600">✓ Lote seleccionado: {loteSeleccionado.nombre}</p>
                                            {plantasSeleccionadas.length > 0 && (
                                                <p className="text-sm text-blue-600">
                                                    <i className="fas fa-seedling mr-1"></i>
                                                    Se han generado {plantasSeleccionadas.length} plantas aleatorias
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <p className="text-sm text-yellow-700">
                                        <i className="fas fa-exclamation-triangle mr-2"></i>
                                        No hay lotes disponibles para el programa {programaSeleccionado?.nombre}.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={handleSiguiente}
                            disabled={!programaSeleccionadoId || !tipoMonitoreoId || !loteSeleccionadoId}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            <span>Siguiente</span>
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            )}

            {paso === 2 && (
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Resumen */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Resumen de selección</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-tag text-blue-500"></i>
                                            <span className="text-sm text-gray-600">
                                                <strong>Programa:</strong> {programaSeleccionado?.nombre || 'No seleccionado'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-chart-line text-green-500"></i>
                                            <span className="text-sm text-gray-600">
                                                <strong>Tipo monitoreo:</strong> {monitoreoSeleccionado?.nombre || tipoMonitoreoId || 'No seleccionado'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-map-marker-alt text-purple-500"></i>
                                            <span className="text-sm text-gray-600">
                                                <strong>Lote:</strong> {loteSeleccionado?.nombre || 'No seleccionado'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAtras}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                >
                                    <i className="fas fa-edit"></i> Cambiar selección
                                </button>
                            </div>
                        </div>

                        {/* Estado (solo edición) */}
                        {esEdicion && (esAdmin || esDocente) && (
                            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-medium text-gray-700">Estado del Diagnóstico</label>
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
                                            <label htmlFor={`estado_${estado}`} className="flex items-center text-sm cursor-pointer">
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

                        {/* Campos principales */}
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Diagnóstico *</label>
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Condiciones del día *</label>
                                <select
                                    name="condiciones_dia"
                                    value={formData.condiciones_dia}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg p-3"
                                    required
                                >
                                    <option value="">Seleccionar condiciones</option>
                                    {condiciones_dia.map(cond => (
                                        <option key={cond} value={cond}>{cond}</option>
                                    ))}
                                </select>
                            </div>

                            {esEdicion && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                                    <textarea
                                        name="observaciones"
                                        value={formData.observaciones}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full border rounded-lg p-3"
                                        placeholder="Observaciones adicionales..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* Secciones específicas por tipo */}
                        {formData.tipo && plantasSeleccionadas.length > 0 && (
                            <div className="mt-4">
                                {formData.tipo === 'censo_poblacional' && (
                                    <CensoSection plantas={plantasSeleccionadas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />
                                )}
                                {formData.tipo === 'monitoreo_fenologico' && (
                                    <FenologicoSection plantas={plantasSeleccionadas.map(p => ({ ...p, fase: '' }))} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} onFaseChange={() => {}} />
                                )}
                                {formData.tipo === 'artropodos' && (
                                    <ArthropodSection plantas={plantasSeleccionadas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />
                                )}
                                {formData.tipo === 'enfermedades' && (
                                    <EnfermedadesSection plantas={plantasSeleccionadas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />
                                )}
                                {formData.tipo === 'arvenses' && (
                                    <ArvensesSection plantas={plantasSeleccionadas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />
                                )}
                                {formData.tipo === 'controladores_biologicos' && (
                                    <ControladoresSection plantas={plantasSeleccionadas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />
                                )}
                                {formData.tipo === 'polinizadores' && (
                                    <PolinizadoresSection plantas={plantasSeleccionadas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />
                                )}
                            </div>
                        )}

                        {/* Mensajes de advertencia */}
                        {(!formData.tipo || !formData.condiciones_dia) && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                                <p className="text-sm text-yellow-700">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    {!formData.tipo && !formData.descripcion
                                        ? "Selecciona un tipo de diagnóstico y las condiciones del día"
                                        : !formData.tipo
                                            ? "Selecciona un tipo de diagnóstico": "Selecciona las condiciones del día"}
                                </p>
                            </div>
                        )}
                        {formData.tipo && plantasSeleccionadas.length === 0 && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                                <p className="text-sm text-yellow-700">
                                    <i className="fas fa-exclamation-triangle mr-2"></i>
                                    No hay plantas generadas para este lote. Por favor, selecciona un lote válido.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-5 border-t">
                        <button type="button" onClick={onCancel} className="px-5 py-2.5 border rounded-lg hover:bg-gray-100 transition flex items-center gap-2">
                            <i className="fas fa-times"></i> Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!formData.tipo || !formData.descripcion || plantasSeleccionadas.length === 0}
                            className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            <i className="fas fa-save"></i> {esEdicion ? 'Actualizar' : 'Crear'} Diagnóstico
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default DiagnosticoForm;