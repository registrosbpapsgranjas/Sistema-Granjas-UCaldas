// src/components/Recomendaciones/RecomendacionForm.tsx
import React, { useState, useEffect } from 'react';
import diagnosticoService from '../../services/diagnosticoService';
import { inventarioDinamicoService } from '../../services/inventarioDinamicoService';
import { diagnosticoDinamicoService, type CampoRecomendacion } from '../../services/diagnosticoDinamicoService';
import { monitoreoService, type Monitoreo } from '../../services/monitoreoService';
import type { DiagnosticoTipo } from '../../services/diagnosticoDinamicoService';
import tipoLaborService from '../../services/tipoLaboresService';
import { toast } from 'react-hot-toast';
import type { Recomendacion } from '../../types/recomendacionTypes';

interface LaborRow {
    tipo_labor_id: number | null;
    trabajador_id: number | null;
    comentario: string;
}

interface RecomendacionFormProps {
    recomendacion?: Recomendacion;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    lotes: any[];
    docentes: any[];
    currentUser: any;
    esEdicion?: boolean;
    programas?: any[];
    diagnosticoIdInicial?: number;
    loteIdInicial?: number;
}

const TIPOS_DATO_LABELS: Record<string, string> = {
    text: 'Texto', textarea: 'Texto largo', number: 'Número',
    date: 'Fecha', select: 'Selección', boolean: 'Sí / No',
};

const RecomendacionForm: React.FC<RecomendacionFormProps> = ({
    recomendacion,
    onSubmit,
    onCancel,
    lotes,
    docentes,
    currentUser,
    esEdicion = false,
    programas = [],
    diagnosticoIdInicial,
    loteIdInicial,
}) => {
    // ── Estados del formulario ────────────────────────────────────────────────
    const [programaId, setProgramaId] = useState<number | null>(null);
    const [monitoreoId, setMonitoreoId] = useState<number | null>(null);
    const [subtipoId, setSubtipoId] = useState<number | null>(null);
    const [monitoreos, setMonitoreos] = useState<Monitoreo[]>([]);
    const [subtipos, setSubtipos] = useState<DiagnosticoTipo[]>([]);
    const [campos, setCampos] = useState<CampoRecomendacion[]>([]);
    const [loteId, setLoteId] = useState<number | null>(null);
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [estado, setEstado] = useState('pendiente');
    const [formulario, setFormulario] = useState<Record<string, any>>({});
    const [aplicarProducto, setAplicarProducto] = useState<'si' | 'no' | null>(null);

    // Inventario
    const [tiposInventario, setTiposInventario] = useState<any[]>([]);
    const [tipoInventarioId, setTipoInventarioId] = useState<number | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [itemId, setItemId] = useState<number | null>(null);
    const [dosis, setDosis] = useState('');
    const [unidad, setUnidad] = useState('');
    const [loadingItems, setLoadingItems] = useState(false);

    // Labores
    const [tiposLabor, setTiposLabor] = useState<any[]>([]);
    const [laboresToCrear, setLaboresToCrear] = useState<LaborRow[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    const lotesFiltrados = lotes.filter(l => l.programa_id === programaId);
    const esAdmin = currentUser?.rol_id === 1;
    const esDocente = currentUser?.rol_id === 2 || currentUser?.rol_id === 5;
    const modoVinculado = Boolean(diagnosticoIdInicial);

    // ── Inicializar desde recomendación (modo edición) ────────────────────────
    useEffect(() => {
        if (!esEdicion || !recomendacion) return;

        const init = async () => {
            setLoading(true);
            try {
                const rec = recomendacion as any;

                // 1. Establecer datos básicos
                setTitulo(rec.titulo || '');
                setDescripcion(rec.descripcion || '');
                setEstado(rec.estado || 'pendiente');
                setLoteId(rec.lote_id || null);

                // 2. Cargar formulario guardado
                if (rec.formulario_recomendacion) {
                    setFormulario(rec.formulario_recomendacion);
                }

                // 3. Determinar programa_id desde el lote
                if (rec.lote_id) {
                    const lote = lotes.find(l => l.id === rec.lote_id);
                    if (lote?.programa_id) {
                        setProgramaId(lote.programa_id);

                        // 4. Cargar monitoreos para este programa
                        const monitoreosData = await monitoreoService.obtenerMonitoreosPorPrograma(lote.programa_id);
                        const mons = Array.isArray(monitoreosData) ? monitoreosData : [];
                        setMonitoreos(mons);

                        // 5. Buscar a qué monitoreo pertenece el subtipo Y cargar subtipos
                        const subtipoIdFromRec = rec.subtipo_id;
                        if (subtipoIdFromRec) {
                            setSubtipoId(subtipoIdFromRec);

                            for (const mon of mons) {
                                const subtiposData = await diagnosticoDinamicoService.listarSubtiposPorMonitoreo(mon.id);
                                const encontrado = subtiposData.find(s => s.id === subtipoIdFromRec);
                                if (encontrado) {
                                    setMonitoreoId(mon.id);
                                    setSubtipos(subtiposData.filter(s => s.activo));
                                    break;
                                }
                            }

                            // 6. Cargar los campos de recomendación para este subtipo
                            const camposData = await diagnosticoDinamicoService.listarCamposRecomendacion(subtipoIdFromRec);
                            setCampos([...camposData].sort((a, b) => a.orden - b.orden));
                        }
                    }
                }

                // 7. Cargar inventario si aplica
                if ((rec as any).inventario_item_id) {
                    setItemId((rec as any).inventario_item_id);
                    setAplicarProducto('si');
                    if ((rec as any).cantidad_sugerida) {
                        setDosis(String((rec as any).cantidad_sugerida));
                    }
                }
            } catch (e) {
                console.error('Error inicializando edición:', e);
                toast.error('Error al cargar datos de la recomendación');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [esEdicion, recomendacion, lotes]);

    // ── Inicializar desde diagnóstico vinculado ───────────────────────────────
    useEffect(() => {
        if (!modoVinculado || !diagnosticoIdInicial) return;

        const init = async () => {
            setLoading(true);
            try {
                const diag = await diagnosticoService.obtenerDiagnosticoPorId(diagnosticoIdInicial);
                const d = diag as any;

                if (d.lote_id) setLoteId(d.lote_id);
                if (d.programa_id) setProgramaId(d.programa_id);
                if (d.tipo_monitoreo_id) setTipoMonitoreoId(d.tipo_monitoreo_id);
                if (d.diagnostico_tipo_id) {
                    setSubtipoId(d.diagnostico_tipo_id);
                    const camposData = await diagnosticoDinamicoService.listarCamposRecomendacion(d.diagnostico_tipo_id);
                    setCampos([...camposData].sort((a, b) => a.orden - b.orden));
                }

                const monNombre = d.tipo_monitoreo_nombre || d.tipo_diagnostico || '';
                const loteNombre = d.lote_nombre || '';
                setTitulo(`Recomendación - ${monNombre}${loteNombre ? ` (${loteNombre})` : ''}`);

                if (d.programa_id) {
                    const tipos = await inventarioDinamicoService.listarTipos(d.programa_id);
                    setTiposInventario(tipos.filter(t => t.activo));
                }
            } catch (e) {
                toast.error('Error al cargar el diagnóstico');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [modoVinculado, diagnosticoIdInicial]);

    // ── Cargar monitoreos ────────────────────────────────────────────────────
    useEffect(() => {
        if (!programaId) {
            setMonitoreos([]);
            return;
        }
        // No recargar en modo edición si ya tenemos monitoreos
        if (esEdicion && monitoreos.length > 0) return;
        
        monitoreoService.obtenerMonitoreosPorPrograma(programaId)
            .then(data => setMonitoreos(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, [programaId, esEdicion, monitoreos.length]);

    // ── Cargar subtipos ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!monitoreoId) {
            // No resetear subtipoId ni subtipos en modo edición o vinculado
            if (!esEdicion && !modoVinculado) {
                setSubtipos([]);
                setSubtipoId(null);
            }
            return;
        }
        // En modo edición, no recargar si ya tenemos los subtipos cargados
        if (esEdicion && subtipos.length > 0) return;

        diagnosticoDinamicoService.listarSubtiposPorMonitoreo(monitoreoId)
            .then(data => {
                setSubtipos(data.filter(s => s.activo));
            })
            .catch(() => { });
    }, [monitoreoId, esEdicion, modoVinculado, subtipos.length]);

    // ── Cargar campos dinámicos ──────────────────────────────────────────────
    useEffect(() => {
        if (!subtipoId) {
            if (!esEdicion && !modoVinculado) setCampos([]);
            return;
        }
        // No recargar en modo edición si ya tenemos campos
        if (esEdicion && campos.length > 0) return;

        diagnosticoDinamicoService.listarCamposRecomendacion(subtipoId)
            .then(data => { setCampos([...data].sort((a, b) => a.orden - b.orden)); })
            .catch(() => setCampos([]));
    }, [subtipoId, esEdicion, modoVinculado, campos.length]);

    // ── Cargar tipos de labor ────────────────────────────────────────────────
    useEffect(() => {
        tipoLaborService.obtenerTiposLabor()
            .then(data => setTiposLabor(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, []);

    // ── Cargar inventario ────────────────────────────────────────────────────
    useEffect(() => {
        if (!programaId) { setTiposInventario([]); return; }
        inventarioDinamicoService.listarTipos(programaId)
            .then(data => setTiposInventario(data.filter(t => t.activo)))
            .catch(() => setTiposInventario([]));
    }, [programaId]);

    // ── Cargar items cuando cambia tipoInventarioId ──────────────────────────
    useEffect(() => {
        if (!tipoInventarioId) { setItems([]); setItemId(null); return; }
        setLoadingItems(true);
        inventarioDinamicoService.listarItems(tipoInventarioId)
            .then(data => setItems(data.filter(i => i.cantidad_disponible > 0)))
            .catch(() => toast.error('Error al cargar productos'))
            .finally(() => setLoadingItems(false));
    }, [tipoInventarioId]);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const getItemNombre = (item: any) => {
        const v = item.valores || {};
        return v.nombre || v.producto || v.Nombre || `Producto #${item.id}`;
    };

    const renderCampo = (campo: CampoRecomendacion) => {
        const val = formulario[campo.nombre_campo] ?? '';
        const base = "w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm";
        switch (campo.tipo_dato) {
            case 'textarea':
                return <textarea value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} rows={3} required={campo.requerido} />;
            case 'number':
                return <input type="number" value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido} />;
            case 'date':
                return <input type="date" value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido} />;
            case 'select':
                return (
                    <select value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido}>
                        <option value="">Seleccionar...</option>
                        {(Array.isArray(campo.opciones) ? campo.opciones : []).map((op: string) => (
                            <option key={op} value={op}>{op}</option>
                        ))}
                    </select>
                );
            case 'boolean':
                return (
                    <select value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido}>
                        <option value="">Seleccionar...</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                    </select>
                );
            default:
                return <input type="text" value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido} />;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        if (!loteId) { toast.error('Selecciona un lote'); return; }
        if (!titulo.trim()) { toast.error('El título es requerido'); return; }
        if (!descripcion.trim() || descripcion.trim().length < 10) { toast.error('La descripción debe tener al menos 10 caracteres'); return; }
        if (aplicarProducto === 'si') {
            if (!itemId) { toast.error('Selecciona el producto a aplicar'); return; }
            if (!dosis) { toast.error('Indica la dosis del producto'); return; }
            if (!unidad.trim()) { toast.error('Indica la unidad de la dosis'); return; }
        }
        for (const campo of campos) {
            if (campo.requerido && !formulario[campo.nombre_campo]) {
                toast.error(`El campo "${campo.etiqueta}" es requerido`);
                return;
            }
        }

        const laboresValidas = laboresToCrear.filter(l => l.tipo_labor_id !== null);
        for (const labor of laboresValidas) {
            if (!labor.trabajador_id) {
                toast.error('Cada labor debe tener un trabajador asignado');
                return;
            }
        }

        const docenteId = currentUser?.id || docentes[0]?.id;
        if (!docenteId) { toast.error('No se pudo determinar el autor'); return; }

        setSubmitting(true);
        try {
            const data: any = {
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                estado: esEdicion ? estado : 'pendiente',
                lote_id: loteId,
                subtipo_id: subtipoId || null,
                formulario_recomendacion: Object.keys(formulario).length > 0 ? formulario : null,
                docente_id: docenteId,
                diagnostico_id: modoVinculado ? diagnosticoIdInicial : null,
                inventario_item_id: aplicarProducto === 'si' ? itemId : null,
                cantidad_sugerida: aplicarProducto === 'si' && dosis ? parseFloat(dosis) : null,
                unidad_dosis: aplicarProducto === 'si' ? unidad.trim() : null,
                items_sugeridos: [],
                labores_a_crear: esEdicion ? [] : laboresValidas.map(l => ({
                    tipo_labor_id: l.tipo_labor_id,
                    trabajador_id: l.trabajador_id,
                    comentario: l.comentario,
                })),
            };

            await onSubmit(data);
        } catch (e: any) {
            toast.error(e?.message || 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="p-6 flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="text-gray-500 text-sm">Cargando recomendación...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-gray-900">
                    {esEdicion ? 'Editar Recomendación' : 'Nueva Recomendación'}
                </h2>
                {modoVinculado && (
                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                        <i className="fas fa-link mr-1"></i>Vinculada al Diagnóstico #{diagnosticoIdInicial}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-500 mb-6">
                {modoVinculado
                    ? 'Completa el formulario de recomendación para este diagnóstico.'
                    : 'Selecciona el programa, tipo de monitoreo y subtipo para cargar el formulario.'}
            </p>

            <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                    {/* Programa */}
                    {!modoVinculado && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Programa *</label>
                            <select
                                value={programaId || ''}
                                onChange={e => {
                                    const id = e.target.value ? parseInt(e.target.value) : null;
                                    setProgramaId(id);
                                    setMonitoreoId(null);
                                    setSubtipoId(null);
                                    setLoteId(null);
                                }}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                                disabled={esEdicion || modoVinculado}
                            >
                                <option value="">Seleccionar programa...</option>
                                {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Monitoreo */}
                    {programaId && !modoVinculado && monitoreos.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Monitoreo</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {monitoreos.map(m => (
                                    <button key={m.id} type="button"
                                        onClick={() => { setMonitoreoId(m.id); setSubtipoId(null); }}
                                        className={`p-3 border-2 rounded-lg text-sm text-center transition ${monitoreoId === m.id ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium' : 'border-gray-200 hover:border-orange-300'}`}
                                        disabled={esEdicion || modoVinculado}>
                                        <i className="fas fa-leaf block text-lg mb-1"></i>{m.nombre}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subtipo */}
                    {monitoreoId && !modoVinculado && subtipos.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Subtipo</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {subtipos.map(s => (
                                    <button key={s.id} type="button"
                                        onClick={() => setSubtipoId(s.id)}
                                        className={`p-3 border-2 rounded-lg text-sm text-center transition ${subtipoId === s.id ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium' : 'border-gray-200 hover:border-orange-300'}`}
                                        disabled={esEdicion || modoVinculado}>
                                        {s.nombre}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lote */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lote *</label>
                        <select
                            value={loteId || ''}
                            onChange={e => setLoteId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                            required
                            disabled={esEdicion || modoVinculado}
                        >
                            <option value="">Seleccionar lote...</option>
                            {(programaId ? lotesFiltrados : lotes).map(l => (
                                <option key={l.id} value={l.id}>{l.nombre}{l.granja_nombre ? ` (${l.granja_nombre})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    {/* Campos dinámicos */}
                    {campos.length > 0 && (
                        <div className="border border-orange-200 rounded-xl p-4 bg-orange-50">
                            <h4 className="font-semibold text-orange-800 mb-4 text-sm">
                                <i className="fas fa-wpforms mr-1"></i>
                                Formulario de recomendación
                            </h4>
                            <div className="space-y-4">
                                {campos.map(campo => (
                                    <div key={campo.id}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {campo.etiqueta}
                                            {campo.requerido && <span className="text-red-500 ml-1">*</span>}
                                            <span className="ml-2 text-xs text-gray-400">({TIPOS_DATO_LABELS[campo.tipo_dato] || campo.tipo_dato})</span>
                                        </label>
                                        {renderCampo(campo)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Producto */}
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-800 mb-3">
                            <i className="fas fa-flask mr-2 text-purple-600"></i>
                            ¿Se va a aplicar un producto?
                        </p>
                        <div className="flex gap-4 mb-4">
                            {(['si', 'no'] as const).map(op => (
                                <label key={op} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border-2 transition ${aplicarProducto === op ? 'border-orange-500 bg-orange-50 text-orange-800 font-medium' : 'border-gray-200 bg-white hover:border-orange-300'}`}>
                                    <input type="radio" name="aplicar_producto" value={op} checked={aplicarProducto === op} onChange={() => { setAplicarProducto(op); if (op === 'no') { setTipoInventarioId(null); setItemId(null); setDosis(''); setUnidad(''); } }} className="accent-orange-500" />
                                    {op === 'si' ? 'Sí, se aplicará producto' : 'No, sin aplicación'}
                                </label>
                            ))}
                        </div>

                        {aplicarProducto === 'si' && (
                            <div className="space-y-4 border-t border-gray-200 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de inventario *</label>
                                    {tiposInventario.length === 0 ? (
                                        <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded p-2">
                                            <i className="fas fa-exclamation-triangle mr-1"></i>
                                            No hay tipos de inventario configurados para este programa.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {tiposInventario.map(t => (
                                                <button key={t.id} type="button"
                                                    onClick={() => { setTipoInventarioId(t.id); setItemId(null); }}
                                                    className={`p-2 border-2 rounded-lg text-sm text-center transition ${tipoInventarioId === t.id ? 'border-purple-500 bg-purple-50 text-purple-800 font-medium' : 'border-gray-200 bg-white hover:border-purple-300'}`}>
                                                    <i className="fas fa-boxes block text-base mb-0.5"></i>
                                                    {t.nombre}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {tipoInventarioId && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                                        {loadingItems ? (
                                            <div className="flex items-center text-gray-500 text-sm gap-2">
                                                <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                                                Cargando productos...
                                            </div>
                                        ) : items.length === 0 ? (
                                            <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded p-2">No hay productos disponibles en este tipo de inventario.</p>
                                        ) : (
                                            <select value={itemId || ''} onChange={e => setItemId(e.target.value ? parseInt(e.target.value) : null)}
                                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" required>
                                                <option value="">Seleccionar producto...</option>
                                                {items.map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {getItemNombre(item)} — Disponible: {item.cantidad_disponible} {item.unidad_medida || ''}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                {itemId && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Dosis *</label>
                                            <input type="number" value={dosis} onChange={e => setDosis(e.target.value)} min="0" step="any"
                                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                placeholder="Ej: 2.5" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
                                            <input type="text" value={unidad} onChange={e => setUnidad(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                placeholder="Ej: L/ha, kg, ml" required />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            placeholder="Título de la recomendación..." required />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Observaciones *</label>
                        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            rows={4} placeholder="Describe las acciones a realizar, hallazgos y justificación..." required />
                        <p className="text-xs text-gray-400 mt-1">{descripcion.length} / mín. 10 caracteres</p>
                    </div>

                    {/* Estado (solo edición) */}
                    {esEdicion && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select value={estado} onChange={e => setEstado(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                                <option value="pendiente">Pendiente</option>
                                <option value="aprobada">Aprobada</option>
                                <option value="en_ejecucion">En ejecución</option>
                                <option value="completada">Completada</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                        </div>
                    )}

                    {/* Labores a crear */}
                    {!esEdicion && (
                        <div className="border border-green-200 rounded-xl p-4 bg-green-50">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-green-800 text-sm">
                                    <i className="fas fa-tasks mr-1"></i>
                                    Labores a crear (opcional)
                                </h4>
                                <button type="button" onClick={() => setLaboresToCrear(prev => [...prev, { tipo_labor_id: null, trabajador_id: null, comentario: '' }])}
                                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                                    <i className="fas fa-plus"></i> Agregar labor
                                </button>
                            </div>
                            {laboresToCrear.length === 0 ? (
                                <p className="text-xs text-green-600">No hay labores programadas.</p>
                            ) : (
                                <div className="space-y-3">
                                    {laboresToCrear.map((labor, idx) => (
                                        <div key={idx} className="flex gap-2 items-start bg-white border border-green-200 rounded-lg p-3">
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de labor *</label>
                                                    <select value={labor.tipo_labor_id || ''} onChange={e => setLaboresToCrear(prev => prev.map((l, i) => i === idx ? { ...l, tipo_labor_id: e.target.value ? parseInt(e.target.value) : null } : l))}
                                                        className="w-full border border-gray-300 rounded p-2 text-sm">
                                                        <option value="">Seleccionar...</option>
                                                        {tiposLabor.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Trabajador *</label>
                                                    <select value={labor.trabajador_id || ''} onChange={e => setLaboresToCrear(prev => prev.map((l, i) => i === idx ? { ...l, trabajador_id: e.target.value ? parseInt(e.target.value) : null } : l))}
                                                        className="w-full border border-gray-300 rounded p-2 text-sm">
                                                        <option value="">Seleccionar...</option>
                                                        {docentes.map((doc: any) => (
                                                            <option key={doc.id} value={doc.id}>{doc.nombre} ({doc.email})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Comentario</label>
                                                    <input type="text" value={labor.comentario} onChange={e => setLaboresToCrear(prev => prev.map((l, i) => i === idx ? { ...l, comentario: e.target.value } : l))}
                                                        className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="Instrucciones..." />
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setLaboresToCrear(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-red-500 hover:text-red-700 mt-5 p-1">
                                                <i className="fas fa-trash text-xs"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-5 border-t">
                    <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                        Cancelar
                    </button>
                    <button type="submit" disabled={submitting}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:bg-gray-400 transition-colors">
                        {submitting ? (
                            <span className="flex items-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>Guardando...</span>
                        ) : (esEdicion ? 'Actualizar Recomendación' : 'Crear Recomendación')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RecomendacionForm;