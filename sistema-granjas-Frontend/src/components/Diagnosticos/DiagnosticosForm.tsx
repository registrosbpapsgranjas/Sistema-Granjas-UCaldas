import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { DiagnosticoItem } from '../../types/diagnosticoTypes';
import { monitoreoService, type Monitoreo } from '../../services/monitoreoService';
import { loteService, type EstructuraLote } from '../../services/loteService';
import { CensoSection } from './CensoSection';
import { FenologicoSection, type FenologicoSectionRef } from './FenologicoSection';
import { ArthropodSection, type ArthropodSectionRef } from './ArthropodSection';
import { ArvensesSection, type ArvensesSectionRef } from './ArvensesSection';
import { EnfermedadesSection, type EnfermedadesSectionRef } from './EnfermedadesSection';
import { ControladoresSection } from './ControladoresSection';
import { PolinizadoresSection } from './PolinizadoresSection';
import { toast } from 'react-toastify';

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface PlantaBase {
    codigo: string;
    label: string;
    surco: number;
    planta: number;
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
    surcos?: number | null;
    plantas_por_surco?: number | null;
}

// El payload ahora es FormData para enviar archivos
interface DiagnosticoFormProps {
    isOpen?: boolean;
    diagnostico?: DiagnosticoItem;
    onSubmit: (data: FormData) => void;
    onCancel: () => void;
    lotes: Lote[];
    programas: Programa[];
    monitoreos?: Monitoreo[];
    condiciones_dia: string[];
    currentUser: any;
    esEdicion?: boolean;
    porcentajeMuestreo?: number;
}

const TIPOS_DIAGNOSTICO = [
    { value: 'censo_poblacional', label: 'Censo Poblacional' },
    { value: 'monitoreo_fenologico', label: 'Monitoreo Fenológico' },
    { value: 'artropodos', label: 'Artrópodos' },
    { value: 'enfermedades', label: 'Enfermedades' },
    { value: 'arvenses', label: 'Arvenses' },
    { value: 'controladores_biologicos', label: 'Controladores Biológicos' },
    { value: 'polinizadores', label: 'Polinizadores' },
];

const DiagnosticoForm: React.FC<DiagnosticoFormProps> = ({
    isOpen,
    diagnostico,
    onSubmit,
    onCancel,
    lotes = [],
    programas = [],
    monitoreos: externalMonitoreos,
    condiciones_dia = ['Soleado', 'Nublado', 'Lluvia'],
    currentUser,
    esEdicion = false,
    porcentajeMuestreo = 10,
}) => {
    const [paso, setPaso] = useState(1);

    // Paso 1
    const [programaId, setProgramaId] = useState<number | null>(null);
    const [tipoMonitoreoId, setTipoMonitoreoId] = useState<number | null>(null);
    const [loteId, setLoteId] = useState<number | null>(null);
    const [monitoreos, setMonitoreos] = useState<Monitoreo[]>(externalMonitoreos || []);
    const [estructuraLote, setEstructuraLote] = useState<EstructuraLote | null>(null);
    const [cargandoEstructura, setCargandoEstructura] = useState(false);

    const [plantas, setPlantas] = useState<PlantaBase[]>([]);
    const [plantasOriginales, setPlantasOriginales] = useState<PlantaBase[]>([]);

    // Paso 2
    const [tipoDiagnostico, setTipoDiagnostico] = useState('');
    const [condicionesDia, setCondicionesDia] = useState('');
    const [caracterizacion, setCaracterizacion] = useState<Record<string, string>>({});

    // Referencias
    const arthropodRef = useRef<ArthropodSectionRef>(null);
    const arvensesRef = useRef<ArvensesSectionRef>(null);
    const fenologicoRef = useRef<FenologicoSectionRef>(null);
    const enfermedadesRef = useRef<EnfermedadesSectionRef>(null);

    // ── Helper para cambios en caracterización ────────────────────────────────
    const handleCaracterizacionChange = (campo: string, valor: string | string[]) => {
        if (Array.isArray(valor)) {
            setCaracterizacion(prev => ({ ...prev, [campo]: JSON.stringify(valor) }));
        } else {
            setCaracterizacion(prev => ({ ...prev, [campo]: valor }));
        }
    };

    // ── Parsear caracterización al cargar edición ────────────────────────────
    const parseCaracterizacion = (raw: Record<string, any>): Record<string, string> => {
        const parsed: Record<string, string> = {};
        Object.entries(raw).forEach(([key, value]) => {
            if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                try {
                    parsed[key] = value;
                } catch {
                    parsed[key] = value;
                }
            } else if (Array.isArray(value)) {
                parsed[key] = JSON.stringify(value);
            } else {
                parsed[key] = String(value);
            }
        });
        return parsed;
    };

    // ── Selección aleatoria de plantas (muestreo) ────────────────────────────
    const seleccionarPlantasAleatorias = useCallback((todas: PlantaBase[], porcentaje: number): PlantaBase[] => {
        if (!todas.length) return [];
        const cantidad = Math.max(1, Math.floor(todas.length * (porcentaje / 100)));
        const copia = [...todas];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia.slice(0, cantidad).sort((a, b) => {
            if (a.surco !== b.surco) return a.surco - b.surco;
            return a.planta - b.planta;
        });
    }, []);

    const regenerarSeleccionPlantas = useCallback(() => {
        if (plantasOriginales.length) {
            const nuevas = seleccionarPlantasAleatorias(plantasOriginales, porcentajeMuestreo);
            setPlantas(nuevas);
            toast.info(`Se han seleccionado ${nuevas.length} plantas (${porcentajeMuestreo}% de ${plantasOriginales.length})`);
        }
    }, [plantasOriginales, porcentajeMuestreo, seleccionarPlantasAleatorias]);

    // ── Cargar monitoreos ────────────────────────────────────────────────────
    useEffect(() => {
        if (!programaId) { setMonitoreos([]); return; }
        monitoreoService.obtenerMonitoreosPorPrograma(programaId)
            .then(setMonitoreos)
            .catch(() => toast.error('Error al cargar tipos de monitoreo'));
    }, [programaId]);

    // ── Cargar estructura del lote ───────────────────────────────────────────
    useEffect(() => {
        const cargar = async () => {
            if (!loteId) {
                setEstructuraLote(null);
                setPlantasOriginales([]);
                setPlantas([]);
                return;
            }
            setCargandoEstructura(true);
            try {
                const estructura = await loteService.obtenerEstructuraLote(loteId);
                setEstructuraLote(estructura);
                if (estructura.plantas?.length) {
                    setPlantasOriginales(estructura.plantas);
                    const seleccionadas = seleccionarPlantasAleatorias(estructura.plantas, porcentajeMuestreo);
                    setPlantas(seleccionadas);
                    toast.success(`Lote cargado: ${estructura.total_plantas.toLocaleString()} plantas. Muestreadas ${seleccionadas.length} (${porcentajeMuestreo}%)`);
                } else {
                    toast.warning('Lote sin surcos/plantas configurados');
                    setPlantasOriginales([]);
                    setPlantas([]);
                }
            } catch (error) {
                console.error(error);
                toast.error('Error al cargar estructura del lote');
                setPlantasOriginales([]);
                setPlantas([]);
            } finally {
                setCargandoEstructura(false);
            }
        };
        cargar();
    }, [loteId, porcentajeMuestreo, seleccionarPlantasAleatorias]);

    const resetearPaso2 = () => {
        setTipoDiagnostico('');
        setCondicionesDia('');
        setCaracterizacion({});
    };

    const lotesFiltrados = useMemo(
        () => (programaId ? lotes.filter(l => l.programa_id === programaId) : []),
        [lotes, programaId]
    );

    const programaSeleccionado = useMemo(() => programas.find(p => p.id === programaId) || null, [programas, programaId]);
    const loteSeleccionado = useMemo(() => lotesFiltrados.find(l => l.id === loteId) || null, [lotesFiltrados, loteId]);
    const monitoreoSeleccionado = useMemo(() => monitoreos.find(m => m.id === tipoMonitoreoId) || null, [monitoreos, tipoMonitoreoId]);

    // Cargar edición
    useEffect(() => {
        if (!esEdicion || !diagnostico) return;
        setPaso(2);
        const d = diagnostico as any;
        if (d.programa_id) setProgramaId(d.programa_id);
        if (d.tipo_monitoreo_id) setTipoMonitoreoId(d.tipo_monitoreo_id);
        if (d.lote_id) setLoteId(d.lote_id);
        if (d.tipo_diagnostico) setTipoDiagnostico(d.tipo_diagnostico);
        if (d.condiciones_dia) setCondicionesDia(d.condiciones_dia);
        if (d.formulario?.plantas) setPlantas(d.formulario.plantas);
        if (d.formulario?.caracterizacion) {
            setCaracterizacion(parseCaracterizacion(d.formulario.caracterizacion));
        }
    }, [esEdicion, diagnostico]);

    // Auto‑selección lote único
    useEffect(() => {
        if (!esEdicion && lotesFiltrados.length === 1 && !loteId && isOpen) {
            setLoteId(lotesFiltrados[0].id);
            toast.info(`Lote seleccionado automáticamente: ${lotesFiltrados[0].nombre}`);
        }
    }, [lotesFiltrados, esEdicion, loteId, isOpen]);

    const handleProgramaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value ? parseInt(e.target.value) : null;
        setProgramaId(id);
        setTipoMonitoreoId(null);
        setLoteId(null);
        setEstructuraLote(null);
        setPlantasOriginales([]);
        setPlantas([]);
        resetearPaso2();
    };

    const handleLoteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value ? parseInt(e.target.value) : null;
        setLoteId(id);
        resetearPaso2();
    };

    const handleSiguiente = () => {
        if (!programaId) { toast.warning('Selecciona programa'); return; }
        if (!tipoMonitoreoId) { toast.warning('Selecciona tipo de monitoreo'); return; }
        if (!loteId) { toast.warning('Selecciona lote'); return; }
        if (!lotesFiltrados.find(l => l.id === loteId)) {
            toast.error('El lote no pertenece al programa elegido');
            return;
        }
        if (!estructuraLote || estructuraLote.total_plantas === 0) {
            toast.error('Lote sin plantas configuradas');
            return;
        }
        if (plantas.length === 0) {
            toast.error('No hay plantas seleccionadas');
            return;
        }
        setPaso(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!tipoDiagnostico) { toast.error('Selecciona un tipo de diagnóstico'); return; }
        if (!condicionesDia) { toast.error('Selecciona condiciones del día'); return; }

        // Para arvenses no se usan las plantas aleatorias, sino todas las plantas del lote
        // y puntos fijos. Por eso la validación de plantas.length no aplica a arvenses.
        if (tipoDiagnostico !== 'arvenses' && plantas.length === 0) {
            toast.error('No hay plantas seleccionadas');
            return;
        }

        // Validaciones específicas
        if (tipoDiagnostico === 'artropodos' && arthropodRef.current) {
            if (!arthropodRef.current.validate()) return;
        }
        if (tipoDiagnostico === 'arvenses' && arvensesRef.current) {
            if (!arvensesRef.current.validate()) return;
        }
        if (tipoDiagnostico === 'monitoreo_fenologico' && fenologicoRef.current) {
            if (!fenologicoRef.current.validate()) return;
        }
        if (tipoDiagnostico === 'enfermedades' && enfermedadesRef.current) {
            if (!enfermedadesRef.current.validate()) return;
        }

        const formData = new FormData();

        // Datos básicos
        formData.append('programa_id', String(programaId));
        formData.append('tipo_monitoreo_id', String(tipoMonitoreoId));
        formData.append('lote_id', String(loteId));
        formData.append('usuario_id', String(currentUser?.id));
        formData.append('tipo_diagnostico', tipoDiagnostico);
        formData.append('condiciones_dia', condicionesDia);

        // Construir el objeto formulario (para todas las secciones excepto arvenses, que se maneja con sus propias claves)
        const formulario = {
            plantas: tipoDiagnostico !== 'arvenses' ? plantas : [],  // arvenses no usa plantas aleatorias
            caracterizacion,
            porcentaje_muestreo: porcentajeMuestreo,
            total_plantas_lote: estructuraLote?.total_plantas || 0,
            plantas_totales_lote: plantasOriginales.length,
        };
        formData.append('formulario', JSON.stringify(formulario));

        // Archivos de artrópodos
        if (tipoDiagnostico === 'artropodos' && arthropodRef.current) {
            const filesMap = arthropodRef.current.getFiles();
            for (const [prefix, files] of filesMap.entries()) {
                files.forEach((file, idx) => {
                    formData.append(`files[${prefix}][${idx}]`, file);
                });
            }
        }

        // Archivos de enfermedades
        if (tipoDiagnostico === 'enfermedades' && enfermedadesRef.current) {
            const filesMap = enfermedadesRef.current.getFiles();
            for (const [prefix, files] of filesMap.entries()) {
                files.forEach((file, idx) => {
                    formData.append(`files[${prefix}][${idx}]`, file);
                });
            }
        }

        // Archivos de arvenses
        if (tipoDiagnostico === 'arvenses' && arvensesRef.current) {
            const filesMap = arvensesRef.current.getFiles();
            for (const [prefix, files] of filesMap.entries()) {
                files.forEach((file, idx) => {
                    formData.append(`files[${prefix}][${idx}]`, file);
                });
            }
        }

        onSubmit(formData);
        toast.success(esEdicion ? 'Diagnóstico actualizado' : 'Diagnóstico creado');

        if (!esEdicion) resetearPaso2();
        else onCancel();
    };

    // Determinar método de muestreo para arvenses según total de plantas
    const metodoMuestreo = useMemo(() => {
        const total = estructuraLote?.total_plantas || 0;
        // Lógica: menos de 1000 plantas -> X, más de 1000 -> W (ajustable)
        return total < 1000 ? 'X' : 'W';
    }, [estructuraLote?.total_plantas]);

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 border-b pb-3">
                {esEdicion ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico'}
            </h2>

            <div className="flex mb-6">
                <div className={`flex-1 text-center py-2 rounded-l-lg text-sm font-medium ${paso === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    Paso 1: Programa, monitoreo y lote
                </div>
                <div className={`flex-1 text-center py-2 rounded-r-lg text-sm font-medium ${paso === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    Paso 2: Formulario de diagnóstico
                </div>
            </div>

            {/* PASO 1 */}
            {paso === 1 && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Programa *</label>
                        <select value={programaId?.toString() || ''} onChange={handleProgramaChange} className="w-full border rounded-lg p-3" disabled={esEdicion}>
                            <option value="">Seleccionar programa</option>
                            {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                        {programaSeleccionado && <p className="text-sm text-green-600 mt-1">✓ {programaSeleccionado.nombre}</p>}
                    </div>

                    {programaId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Monitoreo *</label>
                            {monitoreos.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {monitoreos.map(m => (
                                        <button key={m.id} type="button" onClick={() => setTipoMonitoreoId(m.id)}
                                            className={`p-4 border-2 rounded-lg text-center transition ${tipoMonitoreoId === m.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}
                                            disabled={esEdicion}>
                                            <i className="fas fa-chart-line mr-2"></i>
                                            <span className="font-medium">{m.nombre}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <p className="text-sm text-yellow-700">Este programa no tiene tipos de monitoreo configurados.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {tipoMonitoreoId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Lote *</label>
                            {lotesFiltrados.length > 0 ? (
                                <>
                                    <select value={loteId?.toString() || ''} onChange={handleLoteChange} className="w-full border rounded-lg p-3" disabled={cargandoEstructura || esEdicion}>
                                        <option value="">Seleccionar lote</option>
                                        {lotesFiltrados.map(l => (
                                            <option key={l.id} value={l.id}>
                                                {l.nombre}{l.granja_nombre ? ` (${l.granja_nombre})` : ''}
                                                {l.surcos && l.plantas_por_surco ? ` - ${l.surcos} surcos, ${l.plantas_por_surco} plantas/surco` : ' - Sin configurar'}
                                            </option>
                                        ))}
                                    </select>

                                    {loteSeleccionado && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                            {cargandoEstructura ? (
                                                <div className="flex items-center text-gray-600"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>Cargando estructura...</div>
                                            ) : estructuraLote ? (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-sm text-gray-700"><strong>Configuración:</strong> {estructuraLote.surcos} surcos × {estructuraLote.plantas_por_surco} plantas/surco</p>
                                                            <p className="text-sm text-green-600"><strong>Total plantas:</strong> {estructuraLote.total_plantas.toLocaleString()}</p>
                                                            <p className="text-sm text-blue-600"><strong>Plantas a muestrear:</strong> {plantas.length} ({porcentajeMuestreo}%)</p>
                                                        </div>
                                                        {plantasOriginales.length > 0 && (
                                                            <button type="button" onClick={regenerarSeleccionPlantas} className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg">
                                                                <i className="fas fa-random"></i> Regenerar muestra
                                                            </button>
                                                        )}
                                                    </div>
                                                    {!estructuraLote.muestra_completa && <p className="text-xs text-amber-600">Muestra representativa (total {estructuraLote.total_plantas.toLocaleString()} plantas)</p>}
                                                </div>
                                            ) : <p className="text-sm text-red-600">Lote sin surcos o plantas configurados</p>}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-yellow-50 p-4 rounded-lg">No hay lotes disponibles para este programa.</div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button type="button" onClick={handleSiguiente} disabled={!programaId || !tipoMonitoreoId || !loteId || !estructuraLote?.total_plantas || plantas.length === 0}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                            Siguiente <i className="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* PASO 2 */}
            {paso === 2 && (
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Resumen */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Resumen</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                        <span><strong>Programa:</strong> {programaSeleccionado?.nombre || '—'}</span>
                                        <span><strong>Monitoreo:</strong> {monitoreoSeleccionado?.nombre || tipoMonitoreoId || '—'}</span>
                                        <span><strong>Lote:</strong> {loteSeleccionado?.nombre || '—'}</span>
                                    </div>
                                    {estructuraLote && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            {estructuraLote.surcos} surcos × {estructuraLote.plantas_por_surco} plantas/surco = {estructuraLote.total_plantas.toLocaleString()} plantas
                                            {tipoDiagnostico !== 'arvenses' && (
                                                <span className="ml-2 text-blue-600">| Muestreando: {plantas.length} ({porcentajeMuestreo}%)</span>
                                            )}
                                            {tipoDiagnostico === 'arvenses' && (
                                                <span className="ml-2 text-green-600">| Muestreo en {metodoMuestreo} (5 puntos fijos)</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {tipoDiagnostico !== 'arvenses' && (
                                        <button type="button" onClick={regenerarSeleccionPlantas} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 px-2 py-1 bg-blue-50 rounded">
                                            <i className="fas fa-random"></i> Nueva muestra
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setPaso(1)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                                        <i className="fas fa-edit"></i> Cambiar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tipo de diagnóstico */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Diagnóstico *</label>
                            <select
                                value={tipoDiagnostico}
                                onChange={e => {
                                    setTipoDiagnostico(e.target.value);
                                    setCaracterizacion({});
                                }}
                                className="w-full border rounded-lg p-3"
                                required
                            >
                                <option value="">Seleccionar tipo</option>
                                {TIPOS_DIAGNOSTICO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>

                        {/* Condiciones del día */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Condiciones del día *</label>
                            <select value={condicionesDia} onChange={e => setCondicionesDia(e.target.value)} className="w-full border rounded-lg p-3" required>
                                <option value="">Seleccionar condiciones</option>
                                {condiciones_dia.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Secciones específicas */}
                        {tipoDiagnostico && (
                            <div>
                                {tipoDiagnostico !== 'arvenses' && plantas.length === 0 && (
                                    <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-4">
                                        No hay plantas seleccionadas. Regresa al paso 1.
                                    </div>
                                )}
                                <div className="mb-3 text-sm text-gray-600">
                                    <i className="fas fa-info-circle mr-1"></i>
                                    {tipoDiagnostico === 'arvenses' 
                                        ? `Evaluando ${metodoMuestreo === 'X' ? '5 puntos en X' : '5 puntos en W'} (árboles de referencia del lote)`
                                        : `Evaluando ${plantas.length} plantas`}
                                </div>
                                {tipoDiagnostico === 'censo_poblacional' && <CensoSection plantas={plantas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />}
                                {tipoDiagnostico === 'monitoreo_fenologico' && <FenologicoSection ref={fenologicoRef} plantas={plantas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />}
                                {tipoDiagnostico === 'artropodos' && <ArthropodSection ref={arthropodRef} plantas={plantas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />}
                                {tipoDiagnostico === 'enfermedades' && <EnfermedadesSection ref={enfermedadesRef} plantas={plantas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />}
                                {tipoDiagnostico === 'arvenses' && (
                                    <ArvensesSection
                                        ref={arvensesRef}
                                        todasLasPlantas={plantasOriginales}
                                        metodoMuestreo={metodoMuestreo}
                                        surcos={estructuraLote?.surcos || 1}
                                        plantasPorSurco={estructuraLote?.plantas_por_surco || 1}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {tipoDiagnostico === 'controladores_biologicos' && <ControladoresSection plantas={plantas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />}
                                {tipoDiagnostico === 'polinizadores' && <PolinizadoresSection plantas={plantas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />}
                            </div>
                        )}

                        {/* Advertencia si no hay diagnóstico o condiciones */}
                        {(!tipoDiagnostico || !condicionesDia) && (
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                {!tipoDiagnostico ? 'Selecciona un tipo de diagnóstico.' : 'Selecciona las condiciones del día.'}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-5 border-t">
                        <button type="button" onClick={onCancel} className="px-5 py-2.5 border rounded-lg hover:bg-gray-100">Cancelar</button>
                        <button type="submit" disabled={!tipoDiagnostico || !condicionesDia || (tipoDiagnostico !== 'arvenses' && plantas.length === 0)}
                            className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                            <i className="fas fa-save"></i> {esEdicion ? 'Actualizar' : 'Crear'} Diagnóstico
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default DiagnosticoForm;