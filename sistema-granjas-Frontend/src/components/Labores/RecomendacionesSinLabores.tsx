// src/components/Labores/RecomendacionesSinLabores.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import recomendacionService from '../../services/recomendacionService';
import laborService from '../../services/laboresService';
import trabajadorService from '../../services/usuarioService';
import loteService from '../../services/loteService';
import Modal from '../Common/Modal';
import type { Recomendacion } from '../../types/recomendacionTypes';
import { useAuth } from '../../hooks/useAuth';

interface RecomendacionesSinLaboresProps {
    onLaborCreada: () => void;
}

interface LaborFormData {
    trabajador_id: number | null;
    fecha_programada: string;
    prioridad: 'alta' | 'media' | 'baja';
    comentarios?: string;
    formulario_labor?: Record<string, any>;
}

const RecomendacionesSinLabores: React.FC<RecomendacionesSinLaboresProps> = ({ onLaborCreada }) => {
    const { user } = useAuth();
    const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecomendacion, setSelectedRecomendacion] = useState<Recomendacion | null>(null);
    const [showCrearLaboresModal, setShowCrearLaboresModal] = useState(false);
    const [laboresForm, setLaboresForm] = useState<LaborFormData[]>([getEmptyLaborForm()]);
    const [trabajadores, setTrabajadores] = useState<any[]>([]);
    const [lotes, setLotes] = useState<any[]>([]);
    const [camposDinamicos, setCamposDinamicos] = useState<Record<number, any[]>>({});
    const [loadingForm, setLoadingForm] = useState(false);
    const [mostrarDetallesCompletos, setMostrarDetallesCompletos] = useState(false);

    function getEmptyLaborForm(): LaborFormData {
        return {
            trabajador_id: null,
            fecha_programada: new Date().toISOString().split('T')[0],
            prioridad: 'media',
            comentarios: '',
            formulario_labor: {},
        };
    }

    useEffect(() => {
        cargarRecomendaciones();
        cargarDatosMaestros();
    }, []);

    const cargarRecomendaciones = async () => {
        setLoading(true);
        try {
            const data = await recomendacionService.obtenerRecomendaciones({ estado: 'pendiente' });
            let recs = Array.isArray(data) ? data : (data?.items || []);
            
            const recsConLabores = await Promise.all(
                recs.map(async (rec: Recomendacion) => {
                    try {
                        const labores = await laborService.obtenerLabores({ recomendacion_id: rec.id });
                        const tieneLabores = Array.isArray(labores) ? labores.length > 0 : (labores?.items?.length > 0);
                        return { ...rec, tieneLabores };
                    } catch {
                        return { ...rec, tieneLabores: false };
                    }
                })
            );
            
            const sinLabores = recsConLabores.filter(rec => !rec.tieneLabores);
            setRecomendaciones(sinLabores);
        } catch (error) {
            console.error('Error cargando recomendaciones:', error);
            toast.error('Error al cargar recomendaciones');
        } finally {
            setLoading(false);
        }
    };

    const cargarDatosMaestros = async () => {
        try {
            const [trabajadoresData, lotesData] = await Promise.all([
                trabajadorService.obtenerTrabajadores(),
                loteService.obtenerLotes()
            ]);
            setTrabajadores(Array.isArray(trabajadoresData) ? trabajadoresData : (trabajadoresData?.items || []));
            setLotes(Array.isArray(lotesData) ? lotesData : (lotesData?.items || []));
        } catch (error) {
            console.error('Error cargando datos maestros:', error);
        }
    };

    const cargarCamposDinamicosPorSubtipo = async (subtipoId: number, index: number) => {
        try {
            const { diagnosticoDinamicoService } = await import('../../services/diagnosticoDinamicoService');
            const campos = await diagnosticoDinamicoService.listarCamposLabor(subtipoId);
            setCamposDinamicos(prev => ({ ...prev, [index]: campos }));
        } catch (error) {
            console.error('Error cargando campos dinámicos:', error);
        }
    };

    const abrirModalCrearLabores = async (recomendacion: Recomendacion) => {
        setSelectedRecomendacion(recomendacion);
        setLaboresForm([getEmptyLaborForm()]);
        setCamposDinamicos({});
        setMostrarDetallesCompletos(false);
        
        if (recomendacion.subtipo_id) {
            await cargarCamposDinamicosPorSubtipo(recomendacion.subtipo_id, 0);
        }
        
        setShowCrearLaboresModal(true);
    };

    const agregarLaborForm = async () => {
        const newIndex = laboresForm.length;
        setLaboresForm([...laboresForm, getEmptyLaborForm()]);
        
        if (selectedRecomendacion?.subtipo_id) {
            await cargarCamposDinamicosPorSubtipo(selectedRecomendacion.subtipo_id, newIndex);
        }
    };

    const removerLaborForm = (index: number) => {
        if (laboresForm.length === 1) {
            toast.error('Debe haber al menos una labor');
            return;
        }
        setLaboresForm(laboresForm.filter((_, i) => i !== index));
        setCamposDinamicos(prev => {
            const newObj = { ...prev };
            delete newObj[index];
            return newObj;
        });
    };

    const actualizarLaborForm = (index: number, field: keyof LaborFormData, value: any) => {
        setLaboresForm(prev => prev.map((lab, i) => 
            i === index ? { ...lab, [field]: value } : lab
        ));
    };

    const actualizarFormularioDinamico = (index: number, campoNombre: string, value: any) => {
        setLaboresForm(prev => prev.map((lab, i) => 
            i === index ? { 
                ...lab, 
                formulario_labor: { ...lab.formulario_labor, [campoNombre]: value } 
            } : lab
        ));
    };

    // Función para renderizar el formulario_recomendacion de forma legible
    const renderFormularioRecomendacion = (formulario: Record<string, any> | null | undefined) => {
        if (!formulario || Object.keys(formulario).length === 0) {
            return (
                <div className="text-gray-400 italic text-sm">
                    No hay información adicional en esta recomendación
                </div>
            );
        }

        const formatKey = (key: string) => {
            return key
                .replace(/_/g, ' ')
                .replace(/([A-Z])/g, ' $1')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
                .trim();
        };

        const formatValue = (value: any): string => {
            if (value === null || value === undefined) return '—';
            if (typeof value === 'boolean') return value ? 'Sí' : 'No';
            if (Array.isArray(value)) return value.join(', ');
            if (typeof value === 'object') return JSON.stringify(value, null, 2);
            return String(value);
        };

        return (
            <div className="space-y-3">
                {Object.entries(formulario).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-100 pb-2 last:border-0">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {formatKey(key)}
                        </div>
                        <div className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">
                            {formatValue(value)}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const handleSubmit = async () => {
        if (!selectedRecomendacion) return;
        
        for (let i = 0; i < laboresForm.length; i++) {
            const labor = laboresForm[i];
            if (!labor.fecha_programada) {
                toast.error(`Labor #${i + 1}: Seleccione una fecha programada`);
                return;
            }
            
            const campos = camposDinamicos[i] || [];
            for (const campo of campos) {
                if (campo.requerido && (!labor.formulario_labor?.[campo.nombre_campo] || labor.formulario_labor[campo.nombre_campo] === '')) {
                    toast.error(`Labor #${i + 1}: El campo "${campo.etiqueta}" es requerido`);
                    return;
                }
            }
        }
        
        setLoadingForm(true);
        let creadas = 0;
        let errores = 0;
        
        try {
            for (const labor of laboresForm) {
                try {
                    // Usar el tipo_labor_id de la recomendación o un valor por defecto
                    const tipoLaborId = (selectedRecomendacion as any).tipo_labor_id || 1;
                    
                    await laborService.crearLabor(
                        {
                            tipo_labor_id: tipoLaborId,
                            trabajador_id: labor.trabajador_id || undefined,
                            fecha_programada: labor.fecha_programada,
                            prioridad: labor.prioridad,
                            comentarios: labor.comentarios,
                            recomendacion_id: selectedRecomendacion.id,
                            lote_id: selectedRecomendacion.lote_id,
                            formulario_labor: labor.formulario_labor,
                            productos: selectedRecomendacion.items_sugeridos?.map((item: any) => ({
                                inventario_item_id: item.inventario_item_id,
                                cantidad_sugerida: item.cantidad_sugerida,
                                unidad_dosis: item.unidad_dosis,
                                descripcion: item.descripcion
                            })) || [],
                        },
                        user
                    );
                    creadas++;
                } catch (error) {
                    console.error('Error creando labor:', error);
                    errores++;
                }
            }
            
            if (creadas > 0) {
                try {
                    await recomendacionService.actualizarRecomendacion(
                        selectedRecomendacion.id,
                        { estado: 'aprobada' },
                        user
                    );
                    toast.success(`Recomendación "${selectedRecomendacion.titulo}" aprobada automáticamente`);
                } catch (error) {
                    console.error('Error actualizando estado de recomendación:', error);
                    toast.warning('Las labores se crearon pero no se pudo actualizar el estado de la recomendación');
                }
                
                toast.success(`${creadas} labor(es) creada(s) exitosamente`);
                if (errores > 0) {
                    toast.warning(`${errores} labor(es) no se pudieron crear`);
                }
                setShowCrearLaboresModal(false);
                setSelectedRecomendacion(null);
                await cargarRecomendaciones();
                onLaborCreada();
            } else {
                toast.error('No se pudo crear ninguna labor');
            }
        } catch (error: any) {
            toast.error(`Error al crear labores: ${error.message}`);
        } finally {
            setLoadingForm(false);
        }
    };

    const renderCampoDinamico = (campo: any, index: number) => {
        const value = laboresForm[index]?.formulario_labor?.[campo.nombre_campo] || '';
        const baseClass = "w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
        
        switch (campo.tipo_dato) {
            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={e => actualizarFormularioDinamico(index, campo.nombre_campo, e.target.value)}
                        className={baseClass}
                        rows={3}
                        required={campo.requerido}
                    />
                );
            case 'number':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={e => actualizarFormularioDinamico(index, campo.nombre_campo, parseFloat(e.target.value) || undefined)}
                        className={baseClass}
                        required={campo.requerido}
                    />
                );
            case 'date':
                return (
                    <input
                        type="date"
                        value={value}
                        onChange={e => actualizarFormularioDinamico(index, campo.nombre_campo, e.target.value)}
                        className={baseClass}
                        required={campo.requerido}
                    />
                );
            case 'select':
                const opciones = Array.isArray(campo.opciones) ? campo.opciones : [];
                return (
                    <select
                        value={value}
                        onChange={e => actualizarFormularioDinamico(index, campo.nombre_campo, e.target.value)}
                        className={baseClass}
                        required={campo.requerido}
                    >
                        <option value="">Seleccionar...</option>
                        {opciones.map((op: string) => (
                            <option key={op} value={op}>{op}</option>
                        ))}
                    </select>
                );
            case 'multiselect':
                const multiselectOptions = Array.isArray(campo.opciones) ? campo.opciones : [];
                const selectedValues = Array.isArray(value) ? value : [];
                return (
                    <select
                        multiple
                        value={selectedValues}
                        onChange={e => {
                            const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                            actualizarFormularioDinamico(index, campo.nombre_campo, selected);
                        }}
                        className={baseClass}
                        required={campo.requerido}
                        size={Math.min(multiselectOptions.length, 5)}
                    >
                        {multiselectOptions.map((op: string) => (
                            <option key={op} value={op}>{op}</option>
                        ))}
                    </select>
                );
            case 'boolean':
                return (
                    <select
                        value={value.toString()}
                        onChange={e => actualizarFormularioDinamico(index, campo.nombre_campo, e.target.value === 'true')}
                        className={baseClass}
                        required={campo.requerido}
                    >
                        <option value="">Seleccionar...</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                    </select>
                );
            default:
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={e => actualizarFormularioDinamico(index, campo.nombre_campo, e.target.value)}
                        className={baseClass}
                        required={campo.requerido}
                    />
                );
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Cargando recomendaciones pendientes...</span>
                </div>
            </div>
        );
    }

    if (recomendaciones.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <i className="fas fa-check-circle text-4xl text-green-400 mb-3"></i>
                <p className="text-gray-600 font-medium">No hay recomendaciones pendientes</p>
                <p className="text-gray-400 text-sm mt-1">Todas las recomendaciones pendientes ya tienen labores asociadas</p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                    <div className="flex items-center gap-3">
                        <i className="fas fa-clock text-amber-600 text-xl"></i>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Recomendaciones Pendientes sin Labores</h2>
                            <p className="text-sm text-gray-500">Selecciona una recomendación para crear una o más labores</p>
                        </div>
                    </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                    {recomendaciones.map((recomendacion) => (
                        <div key={recomendacion.id} className="p-5 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-mono text-gray-400">#{recomendacion.id}</span>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                            Pendiente
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-800 mb-1">{recomendacion.titulo}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">{recomendacion.descripcion}</p>
                                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                                        <span><i className="fas fa-tag mr-1"></i>Lote: {recomendacion.lote_nombre || `#${recomendacion.lote_id}`}</span>
                                        <span><i className="fas fa-calendar mr-1"></i>Creada: {new Date(recomendacion.fecha_creacion).toLocaleDateString()}</span>
                                        {recomendacion.items_sugeridos && recomendacion.items_sugeridos.length > 0 && (
                                            <span><i className="fas fa-boxes mr-1"></i>{recomendacion.items_sugeridos.length} producto(s) sugerido(s)</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => abrirModalCrearLabores(recomendacion)}
                                    className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                >
                                    <i className="fas fa-plus-circle"></i>
                                    Crear Labores
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
                    Total: {recomendaciones.length} recomendación(es) pendiente(s) sin labores
                </div>
            </div>

            {/* Modal para crear múltiples labores */}
            <Modal
                isOpen={showCrearLaboresModal}
                onClose={() => setShowCrearLaboresModal(false)}
                width="max-w-4xl"
            >
                <div className="p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <i className="fas fa-tasks text-blue-600 text-2xl"></i>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Crear Labores para Recomendación</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-gray-500">
                                    #{selectedRecomendacion?.id} - {selectedRecomendacion?.titulo}
                                </p>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                    Pendiente
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Al crear las labores, la recomendación pasará automáticamente a estado "Aprobada"
                            </p>
                        </div>
                    </div>

                    {/* Información completa de la recomendación */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-info-circle text-blue-600"></i>
                                <h3 className="font-semibold text-blue-800">Información completa de la recomendación</h3>
                            </div>
                            <button
                                onClick={() => setMostrarDetallesCompletos(!mostrarDetallesCompletos)}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <i className={`fas fa-chevron-${mostrarDetallesCompletos ? 'up' : 'down'}`}></i>
                                {mostrarDetallesCompletos ? 'Ocultar detalles' : 'Ver todos los detalles'}
                            </button>
                        </div>

                        {/* Información básica siempre visible */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-xs font-semibold text-blue-700 uppercase">Título</span>
                                <p className="text-gray-800">{selectedRecomendacion?.titulo}</p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-blue-700 uppercase">Estado</span>
                                <p className="text-gray-800">
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                        {selectedRecomendacion?.estado}
                                    </span>
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <span className="text-xs font-semibold text-blue-700 uppercase">Descripción</span>
                                <p className="text-gray-700">{selectedRecomendacion?.descripcion}</p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-blue-700 uppercase">Lote</span>
                                <p className="text-gray-800">{selectedRecomendacion?.lote_nombre || `#${selectedRecomendacion?.lote_id}`}</p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-blue-700 uppercase">Fecha de creación</span>
                                <p className="text-gray-800">{selectedRecomendacion?.fecha_creacion && new Date(selectedRecomendacion.fecha_creacion).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Detalles completos (toggle) */}
                        {mostrarDetallesCompletos && (
                            <div className="mt-4 pt-4 border-t border-blue-200">
                                {/* Formulario de recomendación */}
                                {selectedRecomendacion?.formulario_recomendacion && (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <i className="fas fa-clipboard-list text-blue-600 text-sm"></i>
                                            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                                Formulario de recomendación
                                            </span>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                                            {renderFormularioRecomendacion(selectedRecomendacion.formulario_recomendacion as Record<string, any>)}
                                        </div>
                                    </div>
                                )}

                                {/* Productos sugeridos */}
                                {selectedRecomendacion?.items_sugeridos && selectedRecomendacion.items_sugeridos.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <i className="fas fa-boxes text-blue-600 text-sm"></i>
                                            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                                Productos sugeridos
                                            </span>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                                            <div className="space-y-2">
                                                {selectedRecomendacion.items_sugeridos.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                                                        <span className="text-sm text-gray-700">
                                                            Producto #{item.inventario_item_id}
                                                        </span>
                                                        <span className="text-sm font-medium text-blue-600">
                                                            {item.cantidad_sugerida} {item.unidad_dosis || 'unidades'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Otros metadatos */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="bg-white rounded p-2 border border-blue-100">
                                        <span className="text-gray-500">ID Recomendación</span>
                                        <p className="font-mono text-gray-700">#{selectedRecomendacion?.id}</p>
                                    </div>
                                    <div className="bg-white rounded p-2 border border-blue-100">
                                        <span className="text-gray-500">Docente que la creó</span>
                                        <p className="text-gray-700">{selectedRecomendacion?.docente_nombre || 'No especificado'}</p>
                                    </div>
                                    {selectedRecomendacion?.subtipo_id && (
                                        <div className="bg-white rounded p-2 border border-blue-100">
                                            <span className="text-gray-500">Subtipo ID</span>
                                            <p className="font-mono text-gray-700">{selectedRecomendacion.subtipo_id}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {laboresForm.map((labor, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-xl p-5 relative">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-800">
                                        <i className="fas fa-hammer text-blue-500 mr-2"></i>
                                        Labor #{idx + 1}
                                    </h3>
                                    {laboresForm.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removerLaborForm(idx)}
                                            className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                                        >
                                            <i className="fas fa-trash"></i> Eliminar
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Trabajador Asignado
                                        </label>
                                        <select
                                            value={labor.trabajador_id || ''}
                                            onChange={e => actualizarLaborForm(idx, 'trabajador_id', parseInt(e.target.value) || null)}
                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                                        >
                                            <option value="">No asignar</option>
                                            {trabajadores.map(trab => (
                                                <option key={trab.id} value={trab.id}>{trab.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Fecha Programada *
                                        </label>
                                        <input
                                            type="date"
                                            value={labor.fecha_programada}
                                            onChange={e => actualizarLaborForm(idx, 'fecha_programada', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Prioridad
                                        </label>
                                        <select
                                            value={labor.prioridad}
                                            onChange={e => actualizarLaborForm(idx, 'prioridad', e.target.value as any)}
                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                                        >
                                            <option value="alta">Alta</option>
                                            <option value="media">Media</option>
                                            <option value="baja">Baja</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Comentarios Adicionales
                                        </label>
                                        <textarea
                                            value={labor.comentarios || ''}
                                            onChange={e => actualizarLaborForm(idx, 'comentarios', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                                            rows={2}
                                            placeholder="Instrucciones adicionales para esta labor..."
                                        />
                                    </div>
                                </div>

                                {/* Campos dinámicos según el subtipo de diagnóstico */}
                                {camposDinamicos[idx] && camposDinamicos[idx].length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <i className="fas fa-wpforms text-blue-500"></i>
                                            Información específica de la labor
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {camposDinamicos[idx].map(campo => (
                                                <div key={campo.id} className={campo.tipo_dato === 'textarea' || campo.tipo_dato === 'multiselect' ? 'md:col-span-2' : ''}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {campo.etiqueta}
                                                        {campo.requerido && <span className="text-red-500 ml-1">*</span>}
                                                    </label>
                                                    {renderCampoDinamico(campo, idx)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                        <button
                            type="button"
                            onClick={agregarLaborForm}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <i className="fas fa-plus"></i>
                            Agregar otra labor
                        </button>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCrearLaboresModal(false)}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loadingForm}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {loadingForm ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save"></i>
                                        Crear {laboresForm.length} Labor(es) y Aprobar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default RecomendacionesSinLabores;