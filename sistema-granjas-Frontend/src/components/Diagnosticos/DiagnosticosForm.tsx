import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DiagnosticoItem } from '../../types/diagnosticoTypes';
import { CensoSection } from './CensoSection';
import { FenologicoSection } from './FenologicoSection';
import { ArthropodSection } from './ArthropodSection';
import { EnfermedadesSection } from './EnfermedadesSection';
import { ArvensesSection } from './ArvensesSection';
import { ControladoresSection } from './ControladoresSection';
import { PolinizadoresSection } from './PolinizadoresSection';

// 👇 MAPEO DE MONITOREOS POR PROGRAMA (esto podría venir de BD también)
const MONITOREOS_POR_PROGRAMA: Record<string, { value: string; label: string }[]> = {
    // Estos IDs deberían coincidir con los programa_id de la BD
    // Ejemplo: si en BD el programa Frutales de Clima Cálido tiene id 5
    5: [  // ID del programa FCC
        { value: 'citricos', label: 'MONITOREO EN CÍTRICOS' },
        { value: 'aguacate', label: 'MONITOREO EN AGUACATE' }
    ],
    6: [  // ID del programa FCF
        { value: 'manzano', label: 'MONITOREO EN MANZANO' },
        { value: 'peral', label: 'MONITOREO EN PERAL' },
        { value: 'durazno', label: 'MONITOREO EN DURAZNO' }
    ]
};

interface PlantaBase {
    codigo: string;
    label: string;
}

interface Programa {
    id: number;
    nombre: string;
    codigo?: string;
}

interface Lote {
    id: number;
    nombre: string;
    granja_nombre?: string;
    programa_id: number; // 👈 Ahora es un número que referencia al programa
}

interface DiagnosticoFormProps {
    diagnostico?: DiagnosticoItem;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    lotes: Lote[];
    programas: Programa[]; // 👈 NUEVO: Recibir programas desde la BD
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
    lotes,
    programas, // 👈 Recibimos programas desde la BD
    docentes,
    estudiantes,
    tipos,
    estados = ['abierto', 'en_revision', 'cerrado'],
    condiciones_dia = ['Soleado', 'Nublado', 'Lluvia'],
    currentUser,
    esEdicion = false
}) => {
    // Estados del wizard
    const [paso, setPaso] = useState(1);
    const [programaSeleccionadoId, setProgramaSeleccionadoId] = useState<number | null>(null);
    const [tipoMonitoreo, setTipoMonitoreo] = useState<string>('');
    const [loteSeleccionado, setLoteSeleccionado] = useState<string>('');
    const [plantasSeleccionadas, setPlantasSeleccionadas] = useState<PlantaBase[]>([]);
    const [caracterizacion, setCaracterizacion] = useState<Record<string, string>>({});

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
    const [archivos, setArchivos] = useState<File[]>([]);
    const [descripcionesEvidencias, setDescripcionesEvidencias] = useState<string[]>([]);
    const [tiposEvidencia, setTiposEvidencia] = useState<string[]>([]);

    // Roles
    const esAdmin = currentUser?.rol_id === 1;
    const esDocente = currentUser?.rol_id === 2 || currentUser?.rol_id === 5;
    const esEstudiante = currentUser?.rol_id === 4;

    // 👇 Filtrar lotes por programa seleccionado
    const lotesFiltrados = useMemo(() => {
        if (!programaSeleccionadoId) return [];
        
        return lotes.filter(lote => lote.programa_id === programaSeleccionadoId);
    }, [lotes, programaSeleccionadoId]);

    // Obtener monitoreos disponibles según el programa seleccionado
    const monitoreosDisponibles = programaSeleccionadoId
        ? MONITOREOS_POR_PROGRAMA[programaSeleccionadoId.toString()] || []
        : [];

    // Obtener el programa seleccionado
    const programaSeleccionado = programas.find(p => p.id === programaSeleccionadoId);

    // Si es edición, cargar en paso 2 con datos existentes
    useEffect(() => {
        if (esEdicion && diagnostico) {
            setPaso(2);
            // Si el diagnóstico tiene programa_id, lo seleccionamos
            if (diagnostico.programa_id) {
                setProgramaSeleccionadoId(diagnostico.programa_id);
            }
            if (diagnostico.tipo_monitoreo) {
                setTipoMonitoreo(diagnostico.tipo_monitoreo);
            }
        }
    }, [esEdicion, diagnostico]);

    // Auto-seleccionar lote si solo hay uno disponible después del filtro
    useEffect(() => {
        if (lotesFiltrados.length === 1 && !formData.lote_id && !loteSeleccionado) {
            const loteUnico = lotesFiltrados[0];
            setFormData(prev => ({ ...prev, lote_id: loteUnico.id.toString() }));
            setLoteSeleccionado(loteUnico.id.toString());
            const nuevas = generarPlantas(5);
            setPlantasSeleccionadas(nuevas);
        }
    }, [lotesFiltrados]);

    // Autoseleccionar estudiante según rol
    useEffect(() => {
        if (!formData.estudiante_id && esEstudiante) {
            setFormData(prev => ({ ...prev, estudiante_id: currentUser.id }));
        }
    }, [currentUser, esEdicion]);

    // Generar plantas aleatorias
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

    // Manejar cambio de lote
    const handleLoteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const loteId = e.target.value;
        setLoteSeleccionado(loteId);
        setFormData(prev => ({ ...prev, lote_id: loteId }));
        if (loteId) {
            const nuevas = generarPlantas(5);
            setPlantasSeleccionadas(nuevas);
        } else {
            setPlantasSeleccionadas([]);
        }
    };

    // Manejar cambio de programa
    const handleProgramaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const programaId = e.target.value ? parseInt(e.target.value) : null;
        setProgramaSeleccionadoId(programaId);
        setTipoMonitoreo(''); // Resetear tipo de monitoreo al cambiar programa
        setLoteSeleccionado(''); // Resetear lote seleccionado al cambiar programa
        setFormData(prev => ({ ...prev, lote_id: '' })); // Resetear lote en formData
        setPlantasSeleccionadas([]); // Resetear plantas
    };

    // Ir al paso 2
    const handleSiguiente = () => {
        if (!programaSeleccionadoId) {
            alert('Debe seleccionar un programa');
            return;
        }
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

    // Manejar cambios en caracterización
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

    // Colores e iconos para estado
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

    // Manejar envío final
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const estadoFinal = esEdicion ? formData.estado : 'abierto';

        const evidencias = archivos.map((file, index) => ({
            file,
            descripcion: descripcionesEvidencias[index],
            tipo: tiposEvidencia[index]
        })).filter(ev => ev.file);

        // Construir datos finales
        const datosSubmit = {
            ...formData,
            estado: estadoFinal,
            lote_id: parseInt(formData.lote_id as string),
            estudiante_id: formData.estudiante_id ? parseInt(formData.estudiante_id as string) : undefined,
            docente_id: formData.docente_id ? parseInt(formData.docente_id as string) : undefined,
            programa_id: programaSeleccionadoId, // 👈 Guardamos el ID del programa
            tipo_monitoreo: tipoMonitoreo,
            plantas: plantasSeleccionadas,
            caracterizacion: caracterizacion,
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

            {/* Indicador de pasos */}
            <div className="flex mb-6">
                <div className={`flex-1 text-center py-2 ${paso === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    Paso 1: Seleccionar programa, monitoreo y lote
                </div>
                <div className={`flex-1 text-center py-2 ${paso === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    Paso 2: Completar formulario
                </div>
            </div>

            {paso === 1 && (
                <div className="space-y-6">
                    {/* 1. Selección de Programa - DESDE BASE DE DATOS */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Programa *
                        </label>
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
                            <p className="text-sm text-green-600 mt-2">
                                Programa seleccionado: {programaSeleccionado.nombre}
                            </p>
                        )}
                    </div>

                    {/* 2. Selección de Tipo de Monitoreo (solo visible si hay programa) */}
                    {programaSeleccionadoId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Monitoreo *
                            </label>
                            {monitoreosDisponibles.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {monitoreosDisponibles.map(monitoreo => (
                                        <button
                                            key={monitoreo.value}
                                            type="button"
                                            onClick={() => setTipoMonitoreo(monitoreo.value)}
                                            className={`p-4 border-2 rounded-lg text-center transition ${tipoMonitoreo === monitoreo.value
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <span className="font-medium">{monitoreo.label}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-yellow-600 bg-yellow-50 p-4 rounded-lg">
                                    Este programa no tiene tipos de monitoreo configurados.
                                </p>
                            )}
                        </div>
                    )}

                    {/* 3. Selección de Lote (solo visible si hay monitoreo y hay lotes disponibles) */}
                    {tipoMonitoreo && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lote *
                            </label>
                            {lotesFiltrados.length > 0 ? (
                                <>
                                    <select
                                        value={loteSeleccionado}
                                        onChange={handleLoteChange}
                                        className="w-full border rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Seleccionar lote</option>
                                        {lotesFiltrados.map(lote => (
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
                                </>
                            ) : (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <p className="text-sm text-yellow-700">
                                        No hay lotes disponibles para el programa {programaSeleccionado?.nombre}. 
                                        Por favor, contacta al administrador para registrar lotes en este programa.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleSiguiente}
                            disabled={!programaSeleccionadoId || !tipoMonitoreo || !loteSeleccionado}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {paso === 2 && (
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Resumen de selección */}
                        <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Programa:</span> {programaSeleccionado?.nombre}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Tipo monitoreo:</span> {
                                        monitoreosDisponibles.find(m => m.value === tipoMonitoreo)?.label
                                    }
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Lote:</span> {
                                        lotesFiltrados.find(l => l.id.toString() === loteSeleccionado)?.nombre
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

                        {/* Tipo y Condiciones del día en grid de 2 columnas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            {tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Condiciones del día */}
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
                                        <option key={cond} value={cond}>
                                            {cond}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Secciones específicas según el tipo de diagnóstico */}
                        {formData.tipo && (
                            <div className="mt-4">
                                {formData.tipo === 'censo_poblacional' && (
                                    <CensoSection
                                        plantas={plantasSeleccionadas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {formData.tipo === 'monitoreo_fenologico' && (
                                    <FenologicoSection
                                        plantas={plantasSeleccionadas.map(p => ({ ...p, fase: '' }))}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                        onFaseChange={(idx, fase) => { }}
                                    />
                                )}
                                {formData.tipo === 'artropodos' && (
                                    <ArthropodSection
                                        plantas={plantasSeleccionadas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {formData.tipo === 'enfermedades' && (
                                    <EnfermedadesSection
                                        plantas={plantasSeleccionadas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {formData.tipo === 'arvenses' && (
                                    <ArvensesSection
                                        plantas={plantasSeleccionadas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange} />
                                )}
                                {formData.tipo === 'controladores_biologicos' && (
                                    <ControladoresSection
                                        plantas={plantasSeleccionadas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {formData.tipo == 'polinizadores' && (
                                    <PolinizadoresSection
                                        plantas={plantasSeleccionadas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange} />
                                )}
                            </div>
                        )}

                        {(!formData.tipo || !formData.condiciones_dia) && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                                <p className="text-sm text-yellow-700">
                                    {!formData.tipo && !formData.condiciones_dia
                                        ? "Selecciona un tipo de diagnóstico y las condiciones del día"
                                        : !formData.tipo
                                            ? "Selecciona un tipo de diagnóstico"
                                            : "Selecciona las condiciones del día"}
                                </p>
                            </div>
                        )}
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