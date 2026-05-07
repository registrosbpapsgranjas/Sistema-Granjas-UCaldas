import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { DiagnosticoItem } from '../../types/diagnosticoTypes';
import { monitoreoService, type Monitoreo } from '../../services/monitoreoService';
import { loteService, type EstructuraLote } from '../../services/loteService';
import { api } from '../../services/api';
import { diagnosticoDinamicoService, type DiagnosticoTipo, type DiagnosticoCampo } from '../../services/diagnosticoDinamicoService';
import { CensoSection } from './CensoSection';
import { FenologicoSection, type FenologicoSectionRef } from './FenologicoSection';
import { ArthropodSection, type ArthropodSectionRef } from './ArthropodSection';
import { ArvensesSection, type ArvensesSectionRef } from './ArvensesSection';
import { EnfermedadesSection, type EnfermedadesSectionRef } from './EnfermedadesSection';
import { ControladoresSection } from './ControladoresSection';
import { PolinizadoresSection } from './PolinizadoresSection';
import GenericDynamicSection from './GenericDynamicSection';
import FormularioDinamicoSection from './FormularioDinamicoSection';
import { toast } from 'react-toastify';

// ── Normaliza el nombre de un monitoreo al tipo de sección interno ────────────
const normalizarTipo = (nombre: string): string => {
    const n = (nombre || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .trim();
    if (n.includes('artropod')) return 'artropodos';
    if (n.includes('fenolog')) return 'monitoreo_fenologico';
    if (n.includes('enfermedad')) return 'enfermedades';
    if (n.includes('censo') || n.includes('poblacional')) return 'censo_poblacional';
    if (n.includes('arvense')) return 'arvenses';
    if (n.includes('controlador')) return 'controladores_biologicos';
    if (n.includes('polinizador')) return 'polinizadores';
    return 'generico';
};

// ── Tipos locales ─────────────────────────────────────────────────────────────
interface PlantaBase {
    id: number;
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

interface DiagnosticoFormProps {
    isOpen?: boolean;
    diagnostico?: DiagnosticoItem;
    onSubmit: (data: FormData) => Promise<void>; // 👈 Cambiado a Promise para esperar
    onCancel: () => void;
    lotes: Lote[];
    programas: Programa[];
    monitoreos?: Monitoreo[];
    condiciones_dia: string[];
    currentUser: any;
    esEdicion?: boolean;
    porcentajeMuestreo?: number;
}


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
    const [subtipoId, setSubtipoId] = useState<number | null>(null);
    const [loteId, setLoteId] = useState<number | null>(null);
    const [monitoreos, setMonitoreos] = useState<Monitoreo[]>(externalMonitoreos || []);
    const [subtipos, setSubtipos] = useState<DiagnosticoTipo[]>([]);
    const [camposDinamicos, setCamposDinamicos] = useState<DiagnosticoCampo[]>([]);
    const [loadingSubtipos, setLoadingSubtipos] = useState(false);
    const [estructuraLote, setEstructuraLote] = useState<EstructuraLote | null>(null);
    const [cargandoEstructura, setCargandoEstructura] = useState(false);

    const [plantasOriginales, setPlantasOriginales] = useState<PlantaBase[]>([]);
    const [plantas, setPlantas] = useState<PlantaBase[]>([]);
    const [cargandoPlantas, setCargandoPlantas] = useState(false);
    const [errorPlantas, setErrorPlantas] = useState<string | null>(null);
    const loadingPlantsRef = useRef(false);
    const [submitting, setSubmitting] = useState(false); // 👈 Prevenir envíos múltiples

    // Paso 2
    const [tipoDiagnostico, setTipoDiagnostico] = useState('');
    const [condicionesDia, setCondicionesDia] = useState('');
    const [caracterizacion, setCaracterizacion] = useState<Record<string, string>>({});
    const [formulariosPorPlanta, setFormulariosPorPlanta] = useState<Record<number, Record<string, string>>>({});

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

    // ── Helper para cambios por planta (formulario dinámico) ─────────────────
    const handleCambioPorPlanta = (plantaId: number, campo: string, valor: string) => {
        setFormulariosPorPlanta(prev => ({
            ...prev,
            [plantaId]: { ...(prev[plantaId] || {}), [campo]: valor },
        }));
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

    // ── Función para obtener plantas elegibles ────────────────────────────────
    const cargarPlantasElegibles = async () => {
        const tipoSeccion = normalizarTipo(tipoDiagnostico);
        if (!loteId || !tipoDiagnostico || tipoSeccion === 'arvenses' || tipoSeccion === 'generico') {
            setPlantas([]);
            setErrorPlantas(null);
            return;
        }
        if (!estructuraLote?.total_plantas) return;
        if (loadingPlantsRef.current) return;

        loadingPlantsRef.current = true;
        setCargandoPlantas(true);
        setErrorPlantas(null);

        const cantidad = Math.max(1, Math.floor(estructuraLote.total_plantas * porcentajeMuestreo / 100));
        try {
            const response = await api.post('/diagnosticos/generar-plantas', {
                lote_id: loteId,
                tipo_diagnostico: tipoDiagnostico,
                cantidad: cantidad,
            });
            const data = response.data;
            if (data.plantas && data.plantas.length > 0) {
                const plantasFormateadas: PlantaBase[] = data.plantas.map((p: any) => ({
                    id: p.id,
                    codigo: p.codigo,
                    label: `Surco ${p.surco}, Planta ${p.numero}`,
                    surco: p.surco,
                    planta: p.numero,
                }));
                setPlantas(plantasFormateadas);
                setFormulariosPorPlanta({});
                if (data.advertencias && data.advertencias.length) {
                    toast.warning(data.advertencias.join(' '));
                } else {
                    toast.success(`Se generaron ${plantasFormateadas.length} plantas elegibles (${porcentajeMuestreo}% de ${estructuraLote.total_plantas})`);
                }
            } else {
                setPlantas([]);
                const msg = data.advertencias?.[0] || 'No se encontraron plantas que cumplan los criterios';
                setErrorPlantas(msg);
                toast.error(msg);
            }
        } catch (error) {
            console.error('Error generando plantas:', error);
            setErrorPlantas('Error al conectar con el servidor');
            toast.error('Error al generar plantas elegibles');
            setPlantas([]);
        } finally {
            setCargandoPlantas(false);
            loadingPlantsRef.current = false;
        }
    };

    // ── Cargar monitoreos ────────────────────────────────────────────────────
    useEffect(() => {
        if (!programaId) { setMonitoreos([]); return; }
        monitoreoService.obtenerMonitoreosPorPrograma(programaId)
            .then(setMonitoreos)
            .catch(() => toast.error('Error al cargar tipos de monitoreo'));
    }, [programaId]);

    // ── Cargar subtipos cuando cambia el monitoreo ───────────────────────────
    useEffect(() => {
        if (!tipoMonitoreoId) { setSubtipos([]); setSubtipoId(null); return; }
        setLoadingSubtipos(true);
        setSubtipoId(null);
        diagnosticoDinamicoService.listarSubtiposPorMonitoreo(tipoMonitoreoId)
            .then(data => setSubtipos(data.filter(s => s.activo)))
            .catch(() => toast.error('Error al cargar subtipos'))
            .finally(() => setLoadingSubtipos(false));
    }, [tipoMonitoreoId]);

    // ── Cargar campos dinámicos cuando cambia el subtipo ─────────────────────
    useEffect(() => {
        if (!subtipoId) { setCamposDinamicos([]); return; }
        diagnosticoDinamicoService.listarCampos(subtipoId)
            .then(data => setCamposDinamicos([...data].sort((a, b) => a.orden - b.orden)))
            .catch(() => setCamposDinamicos([]));
    }, [subtipoId]);

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
                    toast.success(`Lote cargado: ${estructura.total_plantas.toLocaleString()} plantas.`);
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
    }, [loteId]);

    // ── Cargar plantas elegibles cuando cambia tipoDiagnostico ────────────────
    useEffect(() => {
        const tipoSeccion = normalizarTipo(tipoDiagnostico);
        if (paso === 2 && loteId && tipoDiagnostico && tipoSeccion !== 'arvenses' && tipoSeccion !== 'generico' && estructuraLote?.total_plantas) {
            cargarPlantasElegibles();
        } else if (tipoSeccion === 'arvenses' || tipoSeccion === 'generico') {
            setPlantas([]);
            setErrorPlantas(null);
        }
    }, [tipoDiagnostico, paso, loteId, estructuraLote]);

    // ── Regenerar manual ─────────────────────────────────────────────────────
    const regenerarSeleccionPlantas = () => {
        const tipoSeccion = normalizarTipo(tipoDiagnostico);
        if (tipoSeccion === 'arvenses') {
            toast.info('Arvenses usa puntos fijos, no se regeneran plantas aleatorias');
            return;
        }
        cargarPlantasElegibles();
    };

    const resetearPaso2 = () => {
        setTipoDiagnostico('');
        setCondicionesDia('');
        setCaracterizacion({});
        setFormulariosPorPlanta({});
        setPlantas([]);
        setErrorPlantas(null);
    };

    const lotesFiltrados = useMemo(
        () => (programaId ? lotes.filter(l => l.programa_id === programaId) : []),
        [lotes, programaId]
    );

    const programaSeleccionado = useMemo(() => programas.find(p => p.id === programaId) || null, [programas, programaId]);
    const loteSeleccionado = useMemo(() => lotesFiltrados.find(l => l.id === loteId) || null, [lotesFiltrados, loteId]);
    const monitoreoSeleccionado = useMemo(() => monitoreos.find(m => m.id === tipoMonitoreoId) || null, [monitoreos, tipoMonitoreoId]);
    const subtipoSeleccionado = useMemo(() => subtipos.find(s => s.id === subtipoId) || null, [subtipos, subtipoId]);

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
        setSubtipoId(null);
        setSubtipos([]);
        setCamposDinamicos([]);
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
        if (!subtipoId) { toast.warning('Selecciona un subtipo de monitoreo'); return; }
        if (!loteId) { toast.warning('Selecciona lote'); return; }
        if (!lotesFiltrados.find(l => l.id === loteId)) {
            toast.error('El lote no pertenece al programa elegido');
            return;
        }
        if (!estructuraLote || estructuraLote.total_plantas === 0) {
            toast.error('Lote sin plantas configuradas');
            return;
        }
        // Use subtipo name as tipo_diagnostico (for backward-compat + normalizarTipo)
        const nombreSubtipo = subtipoSeleccionado?.nombre || monitoreoSeleccionado?.nombre || '';
        setTipoDiagnostico(nombreSubtipo);
        setCaracterizacion({});
        setPlantas([]);
        setErrorPlantas(null);
        setPaso(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        if (!tipoDiagnostico) { toast.error('No se pudo determinar el tipo de diagnóstico'); return; }
        if (!condicionesDia) { toast.error('Selecciona condiciones del día'); return; }

        const tipoSeccion = normalizarTipo(tipoDiagnostico);

        if (tipoSeccion !== 'arvenses' && tipoSeccion !== 'generico' && plantas.length === 0) {
            toast.error('No hay plantas elegibles para este diagnóstico');
            return;
        }

        // Validaciones específicas por sección conocida
        if (tipoSeccion === 'artropodos' && arthropodRef.current) {
            if (!arthropodRef.current.validate()) return;
        }
        if (tipoSeccion === 'arvenses' && arvensesRef.current) {
            if (!arvensesRef.current.validate()) return;
        }
        if (tipoSeccion === 'monitoreo_fenologico' && fenologicoRef.current) {
            if (!fenologicoRef.current.validate()) return;
        }
        if (tipoSeccion === 'enfermedades' && enfermedadesRef.current) {
            if (!enfermedadesRef.current.validate()) return;
        }

        setSubmitting(true);
        const formData = new FormData();

        formData.append('programa_id', String(programaId));
        formData.append('tipo_monitoreo_id', String(tipoMonitoreoId));
        formData.append('lote_id', String(loteId));
        formData.append('usuario_id', String(currentUser?.id));
        formData.append('tipo_diagnostico', tipoDiagnostico);
        formData.append('condiciones_dia', condicionesDia);
        if (subtipoId) formData.append('diagnostico_tipo_id', String(subtipoId));

        if (tipoSeccion !== 'arvenses' && tipoSeccion !== 'generico' && plantas.length > 0) {
            const plantasIds = plantas.map(p => p.id);
            formData.append('plantas_ids', JSON.stringify(plantasIds));
        }

        const formulario = {
            plantas: tipoSeccion !== 'arvenses' ? plantas : [],
            caracterizacion,
            formularios_por_planta: camposDinamicos.length > 0 ? formulariosPorPlanta : undefined,
            porcentaje_muestreo: porcentajeMuestreo,
            total_plantas_lote: estructuraLote?.total_plantas || 0,
            plantas_totales_lote: plantasOriginales.length,
            tipo_seccion: tipoSeccion,
        };
        formData.append('formulario', JSON.stringify(formulario));

        // Archivos de secciones específicas
        if (tipoSeccion === 'artropodos' && arthropodRef.current) {
            const filesMap = arthropodRef.current.getFiles();
            for (const [prefix, files] of filesMap.entries()) {
                files.forEach((file, idx) => formData.append(`files[${prefix}][${idx}]`, file));
            }
        }
        if (tipoSeccion === 'enfermedades' && enfermedadesRef.current) {
            const filesMap = enfermedadesRef.current.getFiles();
            for (const [prefix, files] of filesMap.entries()) {
                files.forEach((file, idx) => formData.append(`files[${prefix}][${idx}]`, file));
            }
        }
        if (tipoSeccion === 'arvenses' && arvensesRef.current) {
            const filesMap = arvensesRef.current.getFiles();
            for (const [prefix, files] of filesMap.entries()) {
                files.forEach((file, idx) => formData.append(`files[${prefix}][${idx}]`, file));
            }
        }

        try {
            await onSubmit(formData);
            toast.success(esEdicion ? 'Diagnóstico actualizado' : 'Diagnóstico creado');
            if (!esEdicion) resetearPaso2();
            else onCancel();
        } catch (err: any) {
            console.error('Error en submit:', err);
            toast.error(err?.message || 'Error al guardar el diagnóstico');
        } finally {
            setSubmitting(false);
        }
    };

    const metodoMuestreo = useMemo(() => {
        const total = estructuraLote?.total_plantas || 0;
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
                                        <button key={m.id} type="button"
                                            onClick={() => { setTipoMonitoreoId(m.id); setSubtipoId(null); }}
                                            className={`p-4 border-2 rounded-lg text-center transition ${tipoMonitoreoId === m.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}
                                            disabled={esEdicion}>
                                            <i className="fas fa-leaf mr-2"></i>
                                            <span className="font-medium">{m.nombre}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <p className="text-sm text-yellow-700">Este programa no tiene tipos de monitoreo configurados. Agrégalos en la pestaña "Tipos de Diagnóstico".</p>
                                </div>
                            )}
                        </div>
                    )}

                    {tipoMonitoreoId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subtipo de Monitoreo *</label>
                            {loadingSubtipos ? (
                                <div className="flex items-center text-gray-500 text-sm py-2">
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                                    Cargando subtipos...
                                </div>
                            ) : subtipos.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {subtipos.map(s => (
                                        <button key={s.id} type="button" onClick={() => setSubtipoId(s.id)}
                                            className={`p-3 border-2 rounded-lg text-left transition ${subtipoId === s.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-300'}`}
                                            disabled={esEdicion}>
                                            <p className="font-medium text-sm">{s.nombre}</p>
                                            {s.descripcion && <p className="text-xs text-gray-500 mt-0.5">{s.descripcion}</p>}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <p className="text-sm text-yellow-700">
                                        <strong>{monitoreoSeleccionado?.nombre}</strong> no tiene subtipos configurados.
                                        Créalos en la pestaña "Tipos de Diagnóstico".
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {subtipoId && (
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
                                                        </div>
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
                        <button type="button" onClick={handleSiguiente}
                            disabled={!programaId || !tipoMonitoreoId || !subtipoId || !loteId || !estructuraLote?.total_plantas}
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
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <span><strong>Programa:</strong> {programaSeleccionado?.nombre || '—'}</span>
                                        <span><strong>Monitoreo:</strong> {monitoreoSeleccionado?.nombre || '—'}</span>
                                        <span><strong>Subtipo:</strong> {subtipoSeleccionado?.nombre || '—'}</span>
                                        <span><strong>Lote:</strong> {loteSeleccionado?.nombre || '—'}</span>
                                    </div>
                                    {estructuraLote && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            {estructuraLote.surcos} surcos × {estructuraLote.plantas_por_surco} plantas/surco = {estructuraLote.total_plantas.toLocaleString()} plantas
                                            {tipoDiagnostico !== 'arvenses' && (
                                                <span className="ml-2 text-blue-600">| Elegibles: {plantas.length} ({porcentajeMuestreo}%)</span>
                                            )}
                                            {tipoDiagnostico === 'arvenses' && (
                                                <span className="ml-2 text-green-600">| Muestreo en {metodoMuestreo} (5 puntos fijos)</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {tipoDiagnostico !== 'arvenses' && (
                                        <button type="button" onClick={regenerarSeleccionPlantas} disabled={cargandoPlantas}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 px-2 py-1 bg-blue-50 rounded disabled:opacity-50">
                                            <i className="fas fa-random"></i> Nueva muestra
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setPaso(1)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                                        <i className="fas fa-edit"></i> Cambiar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tipo de diagnóstico — auto-derivado del monitoreo seleccionado */}
                        {tipoDiagnostico && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800 flex items-center gap-2">
                                <i className="fas fa-tag"></i>
                                <span><strong>Tipo de diagnóstico:</strong> {tipoDiagnostico}</span>
                            </div>
                        )}

                        {/* Condiciones del día */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Condiciones del día *</label>
                            <select value={condicionesDia} onChange={e => setCondicionesDia(e.target.value)} className="w-full border rounded-lg p-3" required>
                                <option value="">Seleccionar condiciones</option>
                                {condiciones_dia.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Secciones — dinámicas si el subtipo tiene campos, estáticas como fallback */}
                        {tipoDiagnostico && (() => {
                            const tipoSeccion = normalizarTipo(tipoDiagnostico);
                            const mostrarPorPlanta = camposDinamicos.length > 0
                                && tipoSeccion !== 'arvenses'
                                && tipoSeccion !== 'generico';

                            // Si el subtipo tiene campos dinámicos configurados → usarlos
                            if (camposDinamicos.length > 0) {
                                return (
                                    <div className="space-y-4">
                                        {/* Loading / errores de plantas */}
                                        {tipoSeccion !== 'arvenses' && tipoSeccion !== 'generico' && (
                                            <>
                                                {cargandoPlantas && (
                                                    <div className="bg-blue-50 p-4 rounded-lg text-blue-700 flex items-center">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                                        Cargando plantas elegibles...
                                                    </div>
                                                )}
                                                {!cargandoPlantas && errorPlantas && (
                                                    <div className="bg-red-50 p-4 rounded-lg text-red-700">{errorPlantas}</div>
                                                )}
                                                {!cargandoPlantas && plantas.length === 0 && !errorPlantas && (
                                                    <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700">
                                                        No hay plantas elegibles para este diagnóstico.
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Una tarjeta por planta */}
                                        {mostrarPorPlanta && plantas.length > 0 && (
                                            <div className="space-y-4">
                                                <p className="text-sm text-gray-600 font-medium">
                                                    <i className="fas fa-seedling mr-1 text-green-600"></i>
                                                    Evaluando <strong>{plantas.length} plantas</strong> — completa el formulario para cada una:
                                                </p>
                                                {plantas.map((planta, idx) => (
                                                    <div key={planta.id} className="border border-green-200 rounded-xl overflow-hidden shadow-sm">
                                                        <div className="bg-green-100 px-4 py-2 flex items-center gap-2">
                                                            <span className="bg-green-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                                                                {idx + 1}
                                                            </span>
                                                            <span className="font-medium text-sm text-green-900">{planta.label}</span>
                                                            <span className="text-xs text-green-600 ml-auto">Cód: {planta.codigo}</span>
                                                        </div>
                                                        <div className="p-4 bg-green-50">
                                                            <FormularioDinamicoSection
                                                                campos={camposDinamicos}
                                                                valores={formulariosPorPlanta[planta.id] || {}}
                                                                onChange={(campo, valor) => handleCambioPorPlanta(planta.id, campo, valor)}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Sin plantas → formulario global (arvenses / generico) */}
                                        {!mostrarPorPlanta && (
                                            <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
                                                <p className="text-xs text-blue-700 font-semibold mb-3">
                                                    <i className="fas fa-wpforms mr-1"></i>
                                                    Formulario dinámico: {subtipoSeleccionado?.nombre}
                                                </p>
                                                <FormularioDinamicoSection
                                                    campos={camposDinamicos}
                                                    valores={caracterizacion}
                                                    onChange={handleCaracterizacionChange}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            // Fallback: secciones estáticas basadas en normalizarTipo
                            return (
                                <div>
                                    {tipoSeccion !== 'arvenses' && tipoSeccion !== 'generico' && (
                                        <>
                                            {cargandoPlantas && (
                                                <div className="bg-blue-50 p-4 rounded-lg text-blue-700 mb-4 flex items-center">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                                    Cargando plantas elegibles...
                                                </div>
                                            )}
                                            {errorPlantas && !cargandoPlantas && (
                                                <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-4">{errorPlantas}</div>
                                            )}
                                            {!cargandoPlantas && plantas.length === 0 && !errorPlantas && (
                                                <div className="bg-yellow-50 p-4 rounded-lg text-yellow-700 mb-4">
                                                    No hay plantas elegibles para este diagnóstico.
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {tipoSeccion !== 'generico' && (
                                        <div className="mb-3 text-sm text-gray-600">
                                            <i className="fas fa-info-circle mr-1"></i>
                                            {tipoSeccion === 'arvenses'
                                                ? `Evaluando 5 árboles de referencia del lote`
                                                : `Evaluando ${plantas.length} plantas (productivas y sin diagnóstico reciente)`}
                                        </div>
                                    )}
                                    {tipoSeccion === 'censo_poblacional' && <CensoSection plantas={plantas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />}
                                    {tipoSeccion === 'monitoreo_fenologico' && <FenologicoSection ref={fenologicoRef} plantas={plantas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />}
                                    {tipoSeccion === 'artropodos' && <ArthropodSection ref={arthropodRef} plantas={plantas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />}
                                    {tipoSeccion === 'enfermedades' && <EnfermedadesSection ref={enfermedadesRef} plantas={plantas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />}
                                    {tipoSeccion === 'arvenses' && (
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
                                    {tipoSeccion === 'controladores_biologicos' && <ControladoresSection plantas={plantas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />}
                                    {tipoSeccion === 'polinizadores' && <PolinizadoresSection plantas={plantas} caracterizacion={caracterizacion} onCampoChange={handleCaracterizacionChange} />}
                                    {tipoSeccion === 'generico' && (
                                        <GenericDynamicSection
                                            tipoNombre={tipoDiagnostico}
                                            caracterizacion={caracterizacion}
                                            onCampoChange={handleCaracterizacionChange}
                                        />
                                    )}
                                </div>
                            );
                        })()}

                        {!condicionesDia && tipoDiagnostico && (
                            <div className="bg-yellow-50 p-4 rounded-lg">Selecciona las condiciones del día.</div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-5 border-t">
                        <button type="button" onClick={onCancel} className="px-5 py-2.5 border rounded-lg hover:bg-gray-100">Cancelar</button>
                        <button type="submit"
                            disabled={
                                !tipoDiagnostico || !condicionesDia ||
                                (normalizarTipo(tipoDiagnostico) !== 'arvenses' && normalizarTipo(tipoDiagnostico) !== 'generico' && (cargandoPlantas || plantas.length === 0)) ||
                                submitting
                            }
                            className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                            {submitting ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default DiagnosticoForm;