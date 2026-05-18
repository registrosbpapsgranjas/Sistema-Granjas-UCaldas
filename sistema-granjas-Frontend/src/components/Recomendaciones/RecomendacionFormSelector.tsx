// src/components/Recomendaciones/RecomendacionFormSelector.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { Recomendacion } from '../../types/recomendacionTypes';
import {
    diagnosticoDinamicoService,
    type CampoRecomendacion,
} from '../../services/diagnosticoDinamicoService';
import { monitoreoService, type Monitoreo } from '../../services/monitoreoService';
import { diagnosticoService } from '../../services/diagnosticoService';
import { inventarioDinamicoService } from '../../services/inventarioDinamicoService';
import type { TipoInventario, ItemInventario } from '../../types/inventarioDinamicoTypes';
import type { DiagnosticoTipo } from '../../services/diagnosticoDinamicoService';
import tipoLaborService from '../../services/tipoLaboresService';
import usuarioService from '../../services/usuarioService';
import { useAuth } from '../../hooks/useAuth';

// ── Interfaces ──────────────────────────────────────────────────────────────────
interface ProductoSugerido {
    tipo_inventario_id: number | null;
    inventario_item_id: number | null;
    dosis: string;
    unidad: string;
    items: any[];
    loadingItems: boolean;
}

interface LaborRow {
    id?: number;
    tipo_labor_id: number | null;
    trabajador_id: number | null;
    comentario: string;
    productos: ProductoSugerido[];
}

const newLaborRow = (): LaborRow => ({
    tipo_labor_id: null,
    trabajador_id: null,
    comentario: '',
    productos: [],
});

const newProductoRow = (): ProductoSugerido => ({
    tipo_inventario_id: null,
    inventario_item_id: null,
    dosis: '',
    unidad: '',
    items: [],
    loadingItems: false,
});

interface Props {
    recomendacion?: Recomendacion;
    onSubmit: (data: any) => Promise<void> | void;
    onCancel: () => void;
    lotes: any[];
    docentes: any[];
    currentUser: any;
    esEdicion?: boolean;
    programas?: any[];
    programaInicial?: any;
    diagnosticoIdInicial?: number;
    loteIdInicial?: number;
}

const TIPOS_DATO_LABELS: Record<string, string> = {
    text: 'Texto', textarea: 'Texto largo', number: 'Número',
    date: 'Fecha', select: 'Selección', boolean: 'Sí / No',
};

// ── Componente auxiliar: Selector de items del inventario ──────────────────────
const InventarioItemSelect: React.FC<{
    items: any[];
    loading: boolean;
    value: number | null;
    onChange: (id: number | null) => void;
    label?: string;
}> = ({ items, loading, value, onChange, label = "Producto" }) => {
    const getItemNombre = (item: any) => {
        const v = item.valores || {};
        return (v['Nombre Comercial'] || v['nombre_comercial'] || v.Nombre || v.nombre || v.producto || `Producto #${item.id}`) +
            (item.unidad_medida ? ` (${item.unidad_medida})` : '');
    };

    if (loading) {
        return (
            <div className="flex items-center text-gray-500 text-xs gap-2 py-2">
                <div className="animate-spin h-3 w-3 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                Cargando...
            </div>
        );
    }

    if (items.length === 0) {
        return <p className="text-xs text-yellow-600">No hay productos disponibles en este tipo de inventario</p>;
    }

    return (
        <select
            value={value || ''}
            onChange={e => onChange(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full border border-gray-300 rounded p-2 text-sm"
        >
            <option value="">Seleccionar {label.toLowerCase()}...</option>
            {items.map(item => (
                <option key={item.id} value={item.id}>
                    {getItemNombre(item)} — Stock: {item.cantidad_disponible || 0} {item.unidad_medida || ''}
                </option>
            ))}
        </select>
    );
};

// ── Componente auxiliar: Fila de Producto ──────────────────────────────────────
const ProductoRow: React.FC<{
    producto: ProductoSugerido;
    tiposInventario: any[];
    onUpdate: (updates: Partial<ProductoSugerido>) => void;
    onRemove: () => void;
}> = ({ producto, tiposInventario, onUpdate, onRemove }) => {

    // Cargar items cuando cambia el tipo de inventario de este producto
    useEffect(() => {
        if (!producto.tipo_inventario_id) {
            onUpdate({ items: [], inventario_item_id: null, loadingItems: false });
            return;
        }
        
        const cargarItems = async () => {
            onUpdate({ loadingItems: true });
            try {
                const data = await inventarioDinamicoService.listarItems(producto.tipo_inventario_id);
                const itemsConStock = data.filter((i: any) => (i.cantidad_disponible || 0) > 0);
                onUpdate({
                    items: itemsConStock,
                    loadingItems: false,
                    inventario_item_id: null
                });
            } catch (error) {
                console.error('Error cargando items:', error);
                onUpdate({ items: [], loadingItems: false, inventario_item_id: null });
            }
        };
        
        cargarItems();
    }, [producto.tipo_inventario_id]);

    return (
        <div className="flex gap-2 items-start bg-white border border-purple-200 rounded-lg p-3">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo inventario</label>
                    <select
                        value={producto.tipo_inventario_id || ''}
                        onChange={e => {
                            const newTipoId = e.target.value ? parseInt(e.target.value) : null;
                            onUpdate({ 
                                tipo_inventario_id: newTipoId, 
                                inventario_item_id: null,
                                items: [],
                                loadingItems: false
                            });
                        }}
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                    >
                        <option value="">Seleccionar tipo...</option>
                        {tiposInventario.map(t => (
                            <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Producto</label>
                    <InventarioItemSelect
                        items={producto.items}
                        loading={producto.loadingItems}
                        value={producto.inventario_item_id}
                        onChange={(id) => onUpdate({ inventario_item_id: id })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Dosis</label>
                    <input 
                        type="number" 
                        value={producto.dosis} 
                        onChange={e => onUpdate({ dosis: e.target.value })}
                        className="w-full border border-gray-300 rounded p-2 text-sm" 
                        placeholder="Ej: 2.5" 
                        min="0" 
                        step="any" 
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unidad</label>
                    <input 
                        type="text" 
                        value={producto.unidad} 
                        onChange={e => onUpdate({ unidad: e.target.value })}
                        className="w-full border border-gray-300 rounded p-2 text-sm" 
                        placeholder="L/ha, kg, ml..." 
                    />
                </div>
            </div>
            <button type="button" onClick={onRemove}
                className="text-red-500 hover:text-red-700 mt-5 p-1">
                <i className="fas fa-trash text-xs"></i>
            </button>
        </div>
    );
};

// ── Modo A: Vinculada a diagnóstico ────────────────────────────────────────────
const FormVinculadaDiagnostico: React.FC<{
    diagnosticoId: number;
    lotes: any[];
    programas: any[];
    currentUser: any;
    onSubmit: (data: any) => Promise<void> | void;
    onCancel: () => void;
    submitting: boolean;
    setSubmitting: (v: boolean) => void;
    docentes: any[];
}> = ({ diagnosticoId, lotes, programas, currentUser, onSubmit, onCancel, submitting, setSubmitting, docentes }) => {
    const [diagnostico, setDiagnostico] = useState<any>(null);
    const [campos, setCampos] = useState<CampoRecomendacion[]>([]);
    const [formulario, setFormulario] = useState<Record<string, any>>({});
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [loading, setLoading] = useState(true);

    const [productosRecomendacion, setProductosRecomendacion] = useState<ProductoSugerido[]>([]);
    const [tiposInventario, setTiposInventario] = useState<TipoInventario[]>([]);
    const [tiposLabor, setTiposLabor] = useState<any[]>([]);
    const [laboresToCrear, setLaboresToCrear] = useState<LaborRow[]>([]);
    const [trabajadores, setTrabajadores] = useState<any[]>([]);

    useEffect(() => {
        const cargarTrabajadores = async () => {
            try {
                const usuarios = await usuarioService.obtenerUsuarios();
                const arr = Array.isArray(usuarios) ? usuarios : (usuarios?.items || []);
                setTrabajadores(arr.filter((u: any) => u.rol_id === 3 || u.rol_id === 4));
            } catch { setTrabajadores([]); }
        };
        cargarTrabajadores();
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const diag = await diagnosticoService.obtenerDiagnosticoPorId(diagnosticoId);
                setDiagnostico(diag);
                const monNombre = (diag as any).tipo_monitoreo_nombre || (diag as any).tipo_diagnostico || '';
                const loteNombre = (diag as any).lote_nombre || '';
                setTitulo(`Recomendación - ${monNombre}${loteNombre ? ` (${loteNombre})` : ''}`);
                const subtipoId = (diag as any).diagnostico_tipo_id;
                if (subtipoId) {
                    const camposData = await diagnosticoDinamicoService.listarCamposRecomendacion(subtipoId);
                    setCampos([...camposData].sort((a, b) => a.orden - b.orden));
                }
                const programaId = (diag as any).programa_id;
                if (programaId) {
                    const tipos = await inventarioDinamicoService.listarTipos(programaId);
                    const tiposActivos = tipos.filter(t => t.activo);
                    console.log('Tipos de inventario cargados:', tiposActivos);
                    setTiposInventario(tiposActivos);
                }
            } catch (e) {
                console.error('Error:', e);
                toast.error('Error al cargar el diagnóstico');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [diagnosticoId]);

    useEffect(() => {
        tipoLaborService.obtenerTiposLabor()
            .then(data => setTiposLabor(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, []);

    const handleSubmit = async () => {
        if (!titulo.trim()) { toast.warning('El título es requerido'); return; }
        if (!descripcion.trim() || descripcion.trim().length < 10) { toast.warning('La descripción debe tener al menos 10 caracteres'); return; }
        for (const campo of campos) {
            if (campo.requerido && !formulario[campo.nombre_campo]) {
                toast.warning(`El campo "${campo.etiqueta}" es requerido`);
                return;
            }
        }

        const laboresValidas = laboresToCrear.filter(l => l.tipo_labor_id !== null);
        for (const labor of laboresValidas) {
            if (!labor.trabajador_id) {
                toast.warning('Cada labor debe tener un trabajador asignado');
                return;
            }
        }

        const docenteId = currentUser?.id;
        if (!docenteId) { toast.error('No se pudo determinar el autor'); return; }

        const loteId = (diagnostico as any)?.lote_id;
        if (!loteId) { toast.error('El diagnóstico no tiene lote'); return; }

        setSubmitting(true);
        try {
            await onSubmit({
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                estado: 'pendiente',
                lote_id: loteId,
                diagnostico_id: diagnosticoId,
                subtipo_id: (diagnostico as any)?.diagnostico_tipo_id || null,
                formulario_recomendacion: Object.keys(formulario).length > 0 ? formulario : null,
                docente_id: docenteId,
                items_sugeridos: productosRecomendacion.filter(p => p.inventario_item_id).map(p => ({
                    inventario_item_id: p.inventario_item_id,
                    cantidad_sugerida: p.dosis ? parseFloat(p.dosis) : null,
                    unidad_dosis: p.unidad || null,
                })),
                labores_a_crear: laboresValidas.map(l => ({
                    tipo_labor_id: l.tipo_labor_id,
                    trabajador_id: l.trabajador_id,
                    comentario: l.comentario,
                    productos: l.productos.filter(p => p.inventario_item_id).map(p => ({
                        inventario_item_id: p.inventario_item_id,
                        cantidad_sugerida: p.dosis ? parseFloat(p.dosis) : null,
                        unidad_dosis: p.unidad || null,
                    })),
                })),
            });
        } catch (e: any) {
            toast.error(e?.message || 'Error al crear la recomendación');
        } finally {
            setSubmitting(false);
        }
    };

    const renderCampo = (campo: CampoRecomendacion) => {
        const val = formulario[campo.nombre_campo] ?? '';
        const base = "w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm";
        switch (campo.tipo_dato) {
            case 'textarea': return <textarea value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} rows={3} required={campo.requerido} />;
            case 'number': return <input type="number" value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido} />;
            case 'date': return <input type="date" value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido} />;
            case 'select': return (
                <select value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido}>
                    <option value="">Seleccionar...</option>
                    {(Array.isArray(campo.opciones) ? campo.opciones : []).map((op: string) => (<option key={op} value={op}>{op}</option>))}
                </select>
            );
            case 'boolean': return (
                <select value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido}>
                    <option value="">Seleccionar...</option><option value="si">Sí</option><option value="no">No</option>
                </select>
            );
            default: return <input type="text" value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido} />;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="text-gray-500 text-sm">Cargando diagnóstico...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-microscope text-blue-600"></i>
                    <span className="font-semibold text-blue-800 text-sm">Diagnóstico #{diagnosticoId}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-700">
                    <span><strong>Tipo:</strong> {(diagnostico as any)?.tipo_diagnostico?.replace(/_/g, ' ') || '—'}</span>
                    <span><strong>Monitoreo:</strong> {(diagnostico as any)?.tipo_monitoreo_nombre || '—'}</span>
                    <span><strong>Lote:</strong> {(diagnostico as any)?.lote_nombre || '—'}</span>
                    <span><strong>Fecha:</strong> {diagnostico?.fecha_creacion ? new Date((diagnostico as any).fecha_creacion).toLocaleDateString('es-CO') : '—'}</span>
                </div>
            </div>

            {campos.length > 0 && (
                <div className="border border-orange-200 rounded-xl p-4 bg-orange-50">
                    <h4 className="font-semibold text-orange-800 mb-4 text-sm"><i className="fas fa-wpforms mr-1"></i>Formulario de recomendación</h4>
                    <div className="space-y-4">
                        {campos.map(campo => (
                            <div key={campo.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {campo.etiqueta}{campo.requerido && <span className="text-red-500 ml-1">*</span>}
                                    <span className="ml-2 text-xs text-gray-400">({TIPOS_DATO_LABELS[campo.tipo_dato] || campo.tipo_dato})</span>
                                </label>
                                {renderCampo(campo)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="border border-purple-200 rounded-xl p-4 bg-purple-50">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-purple-800 text-sm"><i className="fas fa-boxes mr-1"></i>Productos sugeridos</h4>
                    <button type="button" onClick={() => setProductosRecomendacion(prev => [...prev, newProductoRow()])}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <i className="fas fa-plus"></i> Agregar producto
                    </button>
                </div>
                {tiposInventario.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 text-xs text-yellow-700">
                        <i className="fas fa-exclamation-triangle mr-1"></i> No hay tipos de inventario configurados para este programa.
                    </div>
                )}
                {productosRecomendacion.length === 0 ? (
                    <p className="text-xs text-purple-600">No hay productos sugeridos.</p>
                ) : (
                    <div className="space-y-3">
                        {productosRecomendacion.map((prod, idx) => (
                            <ProductoRow
                                key={idx}
                                producto={prod}
                                tiposInventario={tiposInventario}
                                onUpdate={(updates) => setProductosRecomendacion(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p))}
                                onRemove={() => setProductosRecomendacion(prev => prev.filter((_, i) => i !== idx))}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Título de la recomendación..." required />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Observaciones *</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" rows={4}
                    placeholder="Describe las acciones a realizar, hallazgos y justificación..." required />
                <p className="text-xs text-gray-400 mt-1">{descripcion.length} / mín. 10 caracteres</p>
            </div>

            <div className="border border-green-200 rounded-xl p-4 bg-green-50">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-800 text-sm"><i className="fas fa-tasks mr-1"></i>Labores a crear (opcional)</h4>
                    <button type="button" onClick={() => setLaboresToCrear(prev => [...prev, newLaborRow()])}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <i className="fas fa-plus"></i> Agregar labor
                    </button>
                </div>
                {laboresToCrear.length === 0 ? (
                    <p className="text-xs text-green-600">No hay labores programadas.</p>
                ) : (
                    <div className="space-y-4">
                        {laboresToCrear.map((labor, idx) => (
                            <div key={idx} className="bg-white border border-green-200 rounded-lg p-3">
                                <div className="flex gap-2 items-start">
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
                                                {trabajadores.map((trab: any) => (<option key={trab.id} value={trab.id}>{trab.nombre} ({trab.email})</option>))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Comentario</label>
                                            <input type="text" value={labor.comentario} onChange={e => setLaboresToCrear(prev => prev.map((l, i) => i === idx ? { ...l, comentario: e.target.value } : l))}
                                                className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="Instrucciones..." />
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setLaboresToCrear(prev => prev.filter((_, i) => i !== idx))}
                                        className="text-red-500 hover:text-red-700 mt-5 p-1"><i className="fas fa-trash text-xs"></i></button>
                                </div>

                                <div className="mt-3 pl-2 border-l-2 border-green-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-green-700">Productos para esta labor</span>
                                        <button type="button" onClick={() => setLaboresToCrear(prev => prev.map((l, i) => i === idx ? { ...l, productos: [...l.productos, newProductoRow()] } : l))}
                                            className="text-xs text-green-600 hover:text-green-800 underline">+ Agregar producto</button>
                                    </div>
                                    {labor.productos.length === 0 ? (
                                        <p className="text-xs text-gray-400">Sin productos (opcional)</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {labor.productos.map((prod, pIdx) => (
                                                <ProductoRow
                                                    key={pIdx}
                                                    producto={prod}
                                                    tiposInventario={tiposInventario}
                                                    onUpdate={(updates) => setLaboresToCrear(prev => prev.map((l, i) => i === idx ? {
                                                        ...l, productos: l.productos.map((p, pi) => pi === pIdx ? { ...p, ...updates } : p)
                                                    } : l))}
                                                    onRemove={() => setLaboresToCrear(prev => prev.map((l, i) => i === idx ? {
                                                        ...l, productos: l.productos.filter((_, pi) => pi !== pIdx)
                                                    } : l))}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancelar</button>
                <button type="button" onClick={handleSubmit}
                    disabled={submitting || !titulo || !descripcion}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:bg-gray-400 transition-colors">
                    {submitting ? (<span className="flex items-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>Guardando...</span>) : 'Crear Recomendación'}
                </button>
            </div>
        </div>
    );
};

// ── Modo B: Formulario general (sin diagnóstico) ────────────────────────────────
const FormGeneral: React.FC<{
    recomendacion?: Recomendacion;
    lotes: any[];
    docentes: any[];
    programas: any[];
    currentUser: any;
    esEdicion: boolean;
    onSubmit: (data: any) => Promise<void> | void;
    onCancel: () => void;
    submitting: boolean;
    setSubmitting: (v: boolean) => void;
}> = ({ recomendacion, lotes, docentes, programas, currentUser, esEdicion, onSubmit, onCancel, submitting, setSubmitting }) => {
    const { user } = useAuth();
    const esAdmin = user?.rol_id === 1;
    const esDocente = user?.rol_id === 2 || user?.rol_id === 5;
    const programasDocente = user?.programas?.map((p: any) => p.id) || [];

    // Filtrar programas según rol del usuario
    const programasDisponibles = esAdmin 
        ? programas 
        : programas.filter(p => programasDocente.includes(p.id));

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
    const [tiposLabor, setTiposLabor] = useState<any[]>([]);
    const [labores, setLabores] = useState<LaborRow[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);

    const [diagnosticoSeleccionadoId, setDiagnosticoSeleccionadoId] = useState<number | null>(null);
    const [diagnosticosPendientes, setDiagnosticosPendientes] = useState<any[]>([]);
    const [loadingDiagnosticos, setLoadingDiagnosticos] = useState(false);

    const [productosRecomendacion, setProductosRecomendacion] = useState<ProductoSugerido[]>([]);
    const [tiposInventario, setTiposInventario] = useState<any[]>([]);
    const [trabajadores, setTrabajadores] = useState<any[]>([]);

    const lotesFiltrados = lotes.filter(l => l.programa_id === programaId);

    // Validar acceso
    if (esDocente && programasDocente.length === 0) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <i className="fas fa-exclamation-triangle text-yellow-400 text-xl"></i>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                            Sin programas asignados
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                            No tienes programas asignados para crear recomendaciones.
                            Contacta con un administrador para obtener acceso.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (programasDisponibles.length === 0 && !esEdicion) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <i className="fas fa-exclamation-triangle text-yellow-400 text-xl"></i>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                            No hay programas disponibles
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                            No hay programas disponibles para crear recomendaciones.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    useEffect(() => {
        const cargarTrabajadores = async () => {
            try {
                const usuarios = await usuarioService.obtenerUsuarios();
                const arr = Array.isArray(usuarios) ? usuarios : (usuarios?.items || []);
                setTrabajadores(arr.filter((u: any) => u.rol_id === 3 || u.rol_id === 4));
            } catch { setTrabajadores([]); }
        };
        cargarTrabajadores();
    }, []);

    useEffect(() => {
        if (!programaId) { 
            setTiposInventario([]); 
            return; 
        }
        const cargarTiposInventario = async () => {
            try {
                const data = await inventarioDinamicoService.listarTipos(programaId);
                const tiposActivos = data.filter(t => t.activo);
                console.log('Tipos de inventario para programa', programaId, ':', tiposActivos);
                setTiposInventario(tiposActivos);
            } catch (error) {
                console.error('Error cargando tipos de inventario:', error);
                setTiposInventario([]);
            }
        };
        cargarTiposInventario();
    }, [programaId]);

    useEffect(() => {
        if (!loteId || !subtipoId || esEdicion) {
            setDiagnosticosPendientes([]);
            if (!esEdicion) setDiagnosticoSeleccionadoId(null);
            return;
        }
        const cargarDiagnosticos = async () => {
            setLoadingDiagnosticos(true);
            try {
                const data = await diagnosticoService.obtenerDiagnosticos({
                    lote_id: loteId, diagnostico_tipo_id: subtipoId, estado_revision: 'pendiente_revision',
                } as any);
                const diagnosticosData = Array.isArray(data) ? data : (data?.items || []);
                setDiagnosticosPendientes(diagnosticosData);
                if (diagnosticosData.length === 0) setDiagnosticoSeleccionadoId(null);
            } catch { setDiagnosticosPendientes([]); }
            finally { setLoadingDiagnosticos(false); }
        };
        cargarDiagnosticos();
    }, [loteId, subtipoId, esEdicion]);

    useEffect(() => {
        if (!esEdicion || !recomendacion) { setInitialLoading(false); return; }

        const init = async () => {
            setInitialLoading(true);
            try {
                const rec = recomendacion as any;
                setTitulo(rec.titulo || '');
                setDescripcion(rec.descripcion || '');
                setEstado(rec.estado || 'pendiente');
                setLoteId(rec.lote_id || null);
                setDiagnosticoSeleccionadoId(rec.diagnostico_id || null);
                if (rec.formulario_recomendacion) setFormulario(rec.formulario_recomendacion);

                if (rec.items_sugeridos?.length > 0) {
                    setProductosRecomendacion(rec.items_sugeridos.map((item: any) => ({
                        ...newProductoRow(),
                        inventario_item_id: item.inventario_item_id,
                        dosis: item.cantidad_sugerida ? String(item.cantidad_sugerida) : '',
                        unidad: item.unidad_dosis || '',
                    })));
                }

                if (rec.labores?.length > 0) {
                    setLabores(rec.labores.map((lab: any) => ({
                        id: lab.id,
                        tipo_labor_id: lab.tipo_labor_id,
                        trabajador_id: lab.trabajador_id,
                        comentario: lab.comentario || '',
                        productos: lab.items_sugeridos?.map((item: any) => ({
                            ...newProductoRow(),
                            inventario_item_id: item.inventario_item_id,
                            dosis: item.cantidad_sugerida ? String(item.cantidad_sugerida) : '',
                            unidad: item.unidad_dosis || '',
                        })) || [],
                    })));
                }

                if (rec.lote_id) {
                    const lote = lotes.find(l => l.id === rec.lote_id);
                    if (lote?.programa_id) {
                        setProgramaId(lote.programa_id);
                        const mons = await monitoreoService.obtenerMonitoreosPorPrograma(lote.programa_id);
                        const monitoreosArr = Array.isArray(mons) ? mons : [];
                        setMonitoreos(monitoreosArr);
                        if (rec.subtipo_id) {
                            for (const mon of monitoreosArr) {
                                const subtiposData = await diagnosticoDinamicoService.listarSubtiposPorMonitoreo(mon.id);
                                const encontrado = subtiposData.find(s => s.id === rec.subtipo_id);
                                if (encontrado) { setMonitoreoId(mon.id); setSubtipoId(rec.subtipo_id); break; }
                            }
                        }
                    }
                }
            } catch (e) { console.error('Error inicializando edición:', e); }
            finally { setInitialLoading(false); }
        };
        init();
    }, [esEdicion, recomendacion, lotes]);

    useEffect(() => { if (!programaId) { setMonitoreos([]); return; } monitoreoService.obtenerMonitoreosPorPrograma(programaId).then(data => setMonitoreos(Array.isArray(data) ? data : [])).catch(() => { }); }, [programaId]);
    useEffect(() => { if (!monitoreoId) { setSubtipos([]); if (!esEdicion) setSubtipoId(null); return; } if (!esEdicion) setSubtipoId(null); diagnosticoDinamicoService.listarSubtiposPorMonitoreo(monitoreoId).then(data => setSubtipos(data.filter(s => s.activo))).catch(() => setSubtipos([])); }, [monitoreoId, esEdicion]);
    useEffect(() => { if (!subtipoId) { setCampos([]); return; } diagnosticoDinamicoService.listarCamposRecomendacion(subtipoId).then(data => { setCampos([...data].sort((a, b) => a.orden - b.orden)); if (!esEdicion) setFormulario({}); }).catch(() => setCampos([])); }, [subtipoId, esEdicion]);
    useEffect(() => { tipoLaborService.obtenerTiposLabor().then(data => setTiposLabor(Array.isArray(data) ? data : [])).catch(() => { }); }, []);

    const renderCampo = (campo: CampoRecomendacion) => {
        const val = formulario[campo.nombre_campo] ?? '';
        const base = "w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm";
        switch (campo.tipo_dato) {
            case 'textarea': return <textarea value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} rows={3} required={campo.requerido} />;
            case 'number': return <input type="number" value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido} />;
            case 'date': return <input type="date" value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido} />;
            case 'select': return (<select value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido}><option value="">Seleccionar...</option>{(Array.isArray(campo.opciones) ? campo.opciones : []).map((op: string) => (<option key={op} value={op}>{op}</option>))}</select>);
            case 'boolean': return (<select value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido}><option value="">Seleccionar...</option><option value="si">Sí</option><option value="no">No</option></select>);
            default: return <input type="text" value={val} onChange={e => setFormulario(prev => ({ ...prev, [campo.nombre_campo]: e.target.value }))} className={base} required={campo.requerido} />;
        }
    };

    const handleSubmit = async () => {
        if (!loteId) { toast.warning('Selecciona un lote'); return; }
        if (!titulo.trim()) { toast.warning('El título es requerido'); return; }
        if (!descripcion.trim() || descripcion.trim().length < 10) { toast.warning('La descripción debe tener al menos 10 caracteres'); return; }
        for (const campo of campos) { if (campo.requerido && !formulario[campo.nombre_campo]) { toast.warning(`El campo "${campo.etiqueta}" es requerido`); return; } }
        const laboresValidas = labores.filter(l => l.tipo_labor_id !== null);
        for (const labor of laboresValidas) { if (!labor.trabajador_id) { toast.warning('Cada labor debe tener un trabajador asignado'); return; } }
        const docenteId = currentUser?.id || docentes[0]?.id;
        if (!docenteId) { toast.error('No se pudo determinar el autor'); return; }
        setSubmitting(true);
        try {
            await onSubmit({
                titulo: titulo.trim(), descripcion: descripcion.trim(), estado,
                lote_id: loteId, subtipo_id: subtipoId || null,
                formulario_recomendacion: Object.keys(formulario).length > 0 ? formulario : null,
                docente_id: docenteId, diagnostico_id: diagnosticoSeleccionadoId || null,
                items_sugeridos: productosRecomendacion.filter(p => p.inventario_item_id).map(p => ({
                    inventario_item_id: p.inventario_item_id,
                    cantidad_sugerida: p.dosis ? parseFloat(p.dosis) : null,
                    unidad_dosis: p.unidad || null,
                })),
                labores: labores.map(l => ({
                    id: l.id, tipo_labor_id: l.tipo_labor_id, trabajador_id: l.trabajador_id, comentario: l.comentario,
                    items_sugeridos: l.productos.filter(p => p.inventario_item_id).map(p => ({
                        inventario_item_id: p.inventario_item_id,
                        cantidad_sugerida: p.dosis ? parseFloat(p.dosis) : null,
                        unidad_dosis: p.unidad || null,
                    })),
                })),
            });
        } catch (e: any) { toast.error(e?.message || 'Error'); }
        finally { setSubmitting(false); }
    };

    if (initialLoading) return (<div className="flex flex-col items-center justify-center py-12 gap-3"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div><p className="text-gray-500 text-sm">Cargando recomendación...</p></div>);

    return (
        <div className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Programa *</label>
                <select value={programaId || ''} onChange={e => { setProgramaId(e.target.value ? parseInt(e.target.value) : null); setMonitoreoId(null); setSubtipoId(null); setLoteId(null); setDiagnosticoSeleccionadoId(null); }}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm" disabled={esEdicion}>
                    <option value="">Seleccionar programa...</option>
                    {programasDisponibles.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
            </div>
            {programaId && monitoreos.length > 0 && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Monitoreo</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {monitoreos.map(m => (
                            <button key={m.id} type="button" onClick={() => { setMonitoreoId(m.id); setSubtipoId(null); setDiagnosticoSeleccionadoId(null); }}
                                className={`p-3 border-2 rounded-lg text-sm text-center transition ${monitoreoId === m.id ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium' : 'border-gray-200 hover:border-orange-300'}`} disabled={esEdicion}>
                                <i className="fas fa-leaf block text-lg mb-1"></i>{m.nombre}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {monitoreoId && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subtipo</label>
                    {subtipos.length === 0 ? (<p className="text-sm text-gray-500">No hay subtipos disponibles</p>) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {subtipos.map(s => (
                                <button key={s.id} type="button" onClick={() => { setSubtipoId(s.id); setDiagnosticoSeleccionadoId(null); }}
                                    className={`p-3 border-2 rounded-lg text-sm text-center transition ${subtipoId === s.id ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium' : 'border-gray-200 hover:border-orange-300'}`} disabled={esEdicion}>
                                    {s.nombre}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lote *</label>
                <select value={loteId || ''} onChange={e => { setLoteId(e.target.value ? parseInt(e.target.value) : null); setDiagnosticoSeleccionadoId(null); }}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" required disabled={esEdicion}>
                    <option value="">Seleccionar lote...</option>
                    {lotesFiltrados.map(l => <option key={l.id} value={l.id}>{l.nombre}{l.granja_nombre ? ` (${l.granja_nombre})` : ''}</option>)}
                </select>
            </div>
            {subtipoId && loteId && !esEdicion && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1"><i className="fas fa-microscope mr-1 text-blue-500"></i>Diagnóstico asociado (opcional)</label>
                    {loadingDiagnosticos ? (<div className="flex items-center text-gray-500 text-sm gap-2 py-2"><div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>Cargando...</div>)
                    : diagnosticosPendientes.length === 0 ? (<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700"><i className="fas fa-info-circle mr-2"></i>No hay diagnósticos pendientes.</div>)
                    : (<select value={diagnosticoSeleccionadoId || ''} onChange={e => setDiagnosticoSeleccionadoId(e.target.value ? parseInt(e.target.value) : null)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                        <option value="">Sin diagnóstico (recomendación general)</option>
                        {diagnosticosPendientes.map(diag => (<option key={diag.id} value={diag.id}>#{diag.id} - {(diag as any).tipo_diagnostico?.replace(/_/g, ' ') || 'Sin tipo'} - {new Date(diag.fecha_creacion).toLocaleDateString('es-CO')}</option>))}
                    </select>)}
                </div>
            )}
            {campos.length > 0 && (
                <div className="border border-orange-200 rounded-xl p-4 bg-orange-50 space-y-4">
                    <h4 className="text-sm font-semibold text-orange-800"><i className="fas fa-wpforms mr-1"></i>Formulario dinámico</h4>
                    {campos.map(campo => (
                        <div key={campo.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{campo.etiqueta}{campo.requerido && <span className="text-red-500 ml-1">*</span>}<span className="ml-2 text-xs text-gray-400">({TIPOS_DATO_LABELS[campo.tipo_dato] || campo.tipo_dato})</span></label>
                            {renderCampo(campo)}
                        </div>
                    ))}
                </div>
            )}
            <div className="border border-purple-200 rounded-xl p-4 bg-purple-50">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-purple-800 text-sm"><i className="fas fa-boxes mr-1"></i>Productos sugeridos</h4>
                    <button type="button" onClick={() => setProductosRecomendacion(prev => [...prev, newProductoRow()])}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><i className="fas fa-plus"></i> Agregar producto</button>
                </div>
                {tiposInventario.length === 0 && programaId && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 text-xs text-yellow-700">
                        <i className="fas fa-exclamation-triangle mr-1"></i> No hay tipos de inventario configurados para este programa.
                    </div>
                )}
                {productosRecomendacion.length === 0 ? (<p className="text-xs text-purple-600">No hay productos sugeridos.</p>) : (
                    <div className="space-y-3">
                        {productosRecomendacion.map((prod, idx) => (
                            <ProductoRow key={idx} producto={prod} tiposInventario={tiposInventario}
                                onUpdate={(updates) => setProductosRecomendacion(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p))}
                                onRemove={() => setProductosRecomendacion(prev => prev.filter((_, i) => i !== idx))} />
                        ))}
                    </div>
                )}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Título *</label><input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label><textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" rows={4} required /><p className="text-xs text-gray-400 mt-1">{descripcion.length} / mín. 10 caracteres</p></div>
            {esEdicion && (<div><label className="block text-sm font-medium text-gray-700 mb-1">Estado</label><select value={estado} onChange={e => setEstado(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"><option value="pendiente">Pendiente</option><option value="aprobada">Aprobada</option><option value="en_ejecucion">En ejecución</option><option value="completada">Completada</option><option value="cancelada">Cancelada</option></select></div>)}
            <div className="border border-green-200 rounded-xl p-4 bg-green-50">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-800 text-sm"><i className="fas fa-tasks mr-1"></i>Labores {esEdicion ? '' : 'a crear (opcional)'}</h4>
                    <button type="button" onClick={() => setLabores(prev => [...prev, newLaborRow()])}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><i className="fas fa-plus"></i> Agregar labor</button>
                </div>
                {labores.length === 0 ? (<p className="text-xs text-green-600">No hay labores programadas.</p>) : (
                    <div className="space-y-4">
                        {labores.map((labor, idx) => (
                            <div key={idx} className="bg-white border border-green-200 rounded-lg p-3">
                                <div className="flex gap-2 items-start">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo de labor *</label>
                                            <select value={labor.tipo_labor_id || ''} onChange={e => setLabores(prev => prev.map((l, i) => i === idx ? { ...l, tipo_labor_id: e.target.value ? parseInt(e.target.value) : null } : l))} className="w-full border border-gray-300 rounded p-2 text-sm">
                                                <option value="">Seleccionar...</option>{tiposLabor.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}</select></div>
                                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Trabajador *</label>
                                            <select value={labor.trabajador_id || ''} onChange={e => setLabores(prev => prev.map((l, i) => i === idx ? { ...l, trabajador_id: e.target.value ? parseInt(e.target.value) : null } : l))} className="w-full border border-gray-300 rounded p-2 text-sm">
                                                <option value="">Seleccionar...</option>{trabajadores.map((trab: any) => (<option key={trab.id} value={trab.id}>{trab.nombre} ({trab.email})</option>))}</select></div>
                                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Comentario</label>
                                            <input type="text" value={labor.comentario} onChange={e => setLabores(prev => prev.map((l, i) => i === idx ? { ...l, comentario: e.target.value } : l))} className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="Instrucciones..." /></div>
                                    </div>
                                    <button type="button" onClick={() => setLabores(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 mt-5 p-1"><i className="fas fa-trash text-xs"></i></button>
                                </div>
                                <div className="mt-3 pl-2 border-l-2 border-green-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-green-700">Productos para esta labor</span>
                                        <button type="button" onClick={() => setLabores(prev => prev.map((l, i) => i === idx ? { ...l, productos: [...l.productos, newProductoRow()] } : l))} className="text-xs text-green-600 hover:text-green-800 underline">+ Agregar producto</button>
                                    </div>
                                    {labor.productos.length === 0 ? (<p className="text-xs text-gray-400">Sin productos (opcional)</p>) : (
                                        <div className="space-y-2">
                                            {labor.productos.map((prod, pIdx) => (
                                                <ProductoRow key={pIdx} producto={prod} tiposInventario={tiposInventario}
                                                    onUpdate={(updates) => setLabores(prev => prev.map((l, i) => i === idx ? { ...l, productos: l.productos.map((p, pi) => pi === pIdx ? { ...p, ...updates } : p) } : l))}
                                                    onRemove={() => setLabores(prev => prev.map((l, i) => i === idx ? { ...l, productos: l.productos.filter((_, pi) => pi !== pIdx) } : l))} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancelar</button>
                <button type="button" onClick={handleSubmit} disabled={submitting || !loteId || !titulo || !descripcion}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:bg-gray-400">
                    {submitting ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear Recomendación')}
                </button>
            </div>
        </div>
    );
};

// ── Main component ──────────────────────────────────────────────────────────────
const RecomendacionFormSelector: React.FC<Props> = ({
    recomendacion, onSubmit, onCancel, lotes, docentes, currentUser,
    esEdicion = false, programas = [], programaInicial, diagnosticoIdInicial, loteIdInicial,
}) => {
    const [submitting, setSubmitting] = useState(false);
    const modoVinculado = Boolean(diagnosticoIdInicial);
    const handleSubmit = async (data: any) => { await (onSubmit as (data: any) => Promise<void>)(data); };

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{esEdicion ? 'Editar Recomendación' : 'Nueva Recomendación'}</h2>
                {modoVinculado && (<span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200"><i className="fas fa-link mr-1"></i>Vinculada al Diagnóstico #{diagnosticoIdInicial}</span>)}
            </div>
            <p className="text-sm text-gray-500 mb-6">{modoVinculado ? 'Completa el formulario de recomendación para este diagnóstico.' : 'Selecciona el programa, tipo de monitoreo y subtipo para cargar el formulario.'}</p>
            {modoVinculado ? (
                <FormVinculadaDiagnostico diagnosticoId={diagnosticoIdInicial!} lotes={lotes} programas={programas} currentUser={currentUser} onSubmit={handleSubmit} onCancel={onCancel} submitting={submitting} setSubmitting={setSubmitting} docentes={docentes} />
            ) : (
                <FormGeneral recomendacion={recomendacion} lotes={lotes} docentes={docentes} programas={programas} currentUser={currentUser} esEdicion={esEdicion} onSubmit={handleSubmit} onCancel={onCancel} submitting={submitting} setSubmitting={setSubmitting} />
            )}
        </div>
    );
};

export default RecomendacionFormSelector;