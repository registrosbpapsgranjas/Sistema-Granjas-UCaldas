// src/components/Labores/AsignarRecursosModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import type { Labor } from '../../types/laboresTypes';
import Modal from '../Common/Modal';
import herramientaService from '../../services/herramientasService';
import insumoService from '../../services/insumoService';
import laborService from '../../services/laboresService';
import loteService from '../../services/loteService';
import { toast } from 'react-hot-toast';
import programaService from '../../services/programaService';

interface AsignarRecursosModalProps {
    isOpen: boolean;
    labor: Labor | null;
    onClose: () => void;
    onSuccess: () => void;
}

const AsignarRecursosModal: React.FC<AsignarRecursosModalProps> = ({
    isOpen,
    labor,
    onClose,
    onSuccess
}) => {
    const [herramientas, setHerramientas] = useState<any[]>([]);
    const [insumos, setInsumos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Nuevo estado para el programa del lote
    const [programaLote, setProgramaLote] = useState<any>(null);
    const [cargandoPrograma, setCargandoPrograma] = useState(false);

    // Estados para asignación
    const [selectedHerramienta, setSelectedHerramienta] = useState('');
    const [cantidadHerramienta, setCantidadHerramienta] = useState(1);
    const [selectedInsumo, setSelectedInsumo] = useState('');
    const [cantidadInsumo, setCantidadInsumo] = useState(0);

    // Estados para devolución de herramientas
    const [selectedMovimientoHerramienta, setSelectedMovimientoHerramienta] = useState('');
    const [cantidadDevolverHerramienta, setCantidadDevolverHerramienta] = useState(0);
    const [herramientasAsignadas, setHerramientasAsignadas] = useState<any[]>([]);

    // Estados para devolución de insumos
    const [selectedMovimientoInsumo, setSelectedMovimientoInsumo] = useState('');
    const [cantidadDevolverInsumo, setCantidadDevolverInsumo] = useState(0);
    const [insumosConsumidos, setInsumosConsumidos] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && labor) {
            cargarDatos();
        } else {
            resetEstados();
        }
    }, [isOpen, labor]);

    const resetEstados = () => {
        setProgramaLote(null);
        setHerramientas([]);
        setInsumos([]);
        setHerramientasAsignadas([]);
        setInsumosConsumidos([]);
        resetForm();
    };

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setCargandoPrograma(true);

            // 1. Primero obtener información del lote y su programa
            if (labor?.lote_id) {
                try {
                    const loteInfo = await loteService.obtenerLote(labor.lote_id);
                    console.log('Lote info:', loteInfo);
                    if (loteInfo?.programa_id) {
                        const ProgramaInfo = await programaService.obtenerProgramaPorId(loteInfo.programa_id);
                        console.log('Programa info:', ProgramaInfo);
                        setProgramaLote({ id: ProgramaInfo.id, nombre: ProgramaInfo.nombre });
                    } else {
                        setProgramaLote({ id: loteInfo.programa_id, nombre: 'Programa cargando...' });
                    }
                } catch (error) {
                    console.warn('No se pudo obtener información del programa del lote:', error);
                }
            }

            // 2. Cargar herramientas disponibles
            try {
                const herramientasData = await herramientaService.obtenerHerramientas();
                setHerramientas(Array.isArray(herramientasData) ? herramientasData : []);
            } catch (error) {
                console.error('Error cargando herramientas:', error);
                toast.error('Error al cargar herramientas');
            }

            // 3. Cargar insumos disponibles
            try {
                const insumosData = await insumoService.obtenerInsumos();
                const todosInsumos = Array.isArray(insumosData) ? insumosData : [];
                setInsumos(todosInsumos);
            } catch (error) {
                console.error('Error cargando insumos:', error);
                toast.error('Error al cargar insumos');
            }

            // 4. Cargar recursos ya asignados/consumidos en esta labor
            if (labor?.id) {
                try {
                    // Obtener labor con recursos
                    const laborConRecursos = await laborService.obtenerLabor(labor.id);

                    // Cargar herramientas asignadas
                    const herramientasInfo = laborConRecursos?.herramientas_asignadas || [];
                    const movimientosHerramientas = laborConRecursos?.movimientos_herramientas || [];

                    // Combinar información
                    const herramientasCombinadas = herramientasInfo.map(herramienta => {
                        const movimientos = movimientosHerramientas.filter((m: any) => m.herramienta_id === herramienta.herramienta_id);
                        return {
                            ...herramienta,
                            movimientos,
                            movimiento_id: movimientos.length > 0 ? movimientos[0].movimiento_id : null
                        };
                    });

                    setHerramientasAsignadas(herramientasCombinadas);

                    // Cargar insumos consumidos
                    const insumosInfo = laborConRecursos?.insumos_asignados || [];
                    const movimientosInsumos = laborConRecursos?.movimientos_insumos || [];

                    // Combinar información
                    const insumosCombinados = insumosInfo.map(insumo => {
                        const movimientos = movimientosInsumos.filter((m: any) => m.insumo_id === insumo.insumo_id);
                        return {
                            ...insumo,
                            movimientos,
                            movimiento_id: movimientos.length > 0 ? movimientos[0].movimiento_id : null
                        };
                    });

                    setInsumosConsumidos(insumosCombinados);

                } catch (error) {
                    console.error('Error cargando recursos asignados:', error);
                }
            }

        } catch (err) {
            console.error('Error cargando datos:', err);
            toast.error('Error al cargar recursos');
        } finally {
            setLoading(false);
            setCargandoPrograma(false);
        }
    };

    // Filtrar herramientas disponibles (cantidad > 0)
    const herramientasDisponibles = useMemo(() => {
        return herramientas.filter(h => h.cantidad_disponible > 0);
    }, [herramientas]);

    // Filtrar insumos disponibles según el programa del lote
    const insumosDisponibles = useMemo(() => {
        return insumos.filter(insumo => {
            if (insumo.cantidad_disponible <= 0) return false;

            if (programaLote?.id) {
                return insumo.programa_id === programaLote.id;
            }

            return true;
        });
    }, [insumos, programaLote]);

    const handleAsignarHerramienta = async () => {
        if (!labor || !selectedHerramienta || cantidadHerramienta <= 0) {
            toast.error('Selecciona una herramienta y cantidad válida');
            return;
        }

        try {
            setSubmitting(true);

            const herramientaSeleccionada = herramientasDisponibles.find(
                h => h.id === parseInt(selectedHerramienta)
            );

            if (!herramientaSeleccionada) {
                toast.error('Herramienta no disponible');
                return;
            }

            if (cantidadHerramienta > herramientaSeleccionada.cantidad_disponible) {
                toast.error(`Cantidad no disponible. Solo hay ${herramientaSeleccionada.cantidad_disponible} unidades disponibles.`);
                return;
            }

            await laborService.asignarHerramienta(
                labor.id,
                parseInt(selectedHerramienta),
                cantidadHerramienta
            );

            toast.success('Herramienta asignada correctamente');
            resetForm();
            cargarDatos();
            onSuccess();

        } catch (error: any) {
            console.error('Error asignando herramienta:', error);
            toast.error(error.response?.data?.detail || error.message || 'Error al asignar herramienta');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAsignarInsumo = async () => {
        if (!labor || !selectedInsumo || cantidadInsumo <= 0) {
            toast.error('Selecciona un insumo y cantidad válida');
            return;
        }

        try {
            setSubmitting(true);

            const insumoSeleccionado = insumosDisponibles.find(
                i => i.id === parseInt(selectedInsumo)
            );

            if (!insumoSeleccionado) {
                toast.error('Insumo no disponible');
                return;
            }

            if (cantidadInsumo > insumoSeleccionado.cantidad_disponible) {
                toast.error(`Cantidad no disponible. Solo hay ${insumoSeleccionado.cantidad_disponible} ${insumoSeleccionado.unidad_medida} disponibles.`);
                return;
            }

            await laborService.asignarInsumo(
                labor.id,
                parseInt(selectedInsumo),
                cantidadInsumo
            );

            toast.success('Insumo asignado correctamente');
            resetForm();
            onSuccess();
            cargarDatos(); // Recargar datos para mostrar cambios

        } catch (error: any) {
            console.error('Error asignando insumo:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Error al asignar insumo';

            if (errorMessage.includes('pertenece al programa') || errorMessage.includes('programa de esta labor')) {
                toast.error(
                    <div>
                        <p className="font-semibold">Error: Programa incompatible</p>
                        <p className="text-sm mt-1">{errorMessage}</p>
                        {programaLote && (
                            <p className="text-sm mt-1">
                                Esta labor pertenece al programa: <strong>{programaLote.nombre}</strong>
                            </p>
                        )}
                    </div>,
                    { duration: 6000 }
                );
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDevolverHerramienta = async () => {
        if (!selectedMovimientoHerramienta || cantidadDevolverHerramienta <= 0) {
            toast.error('Selecciona un movimiento y cantidad válida');
            return;
        }

        try {
            setSubmitting(true);

            const movimientoSeleccionado = herramientasAsignadas.find(
                a => (a.movimiento_id || a.id) === parseInt(selectedMovimientoHerramienta)
            );

            if (!movimientoSeleccionado) {
                toast.error('Movimiento no encontrado');
                return;
            }

            if (cantidadDevolverHerramienta > (movimientoSeleccionado.cantidad_actual || movimientoSeleccionado.cantidad)) {
                toast.error(`No puede devolver más de lo asignado. Asignado: ${movimientoSeleccionado.cantidad_actual || movimientoSeleccionado.cantidad}`);
                return;
            }

            await laborService.devolverHerramienta(
                labor?.id || 0,
                parseInt(selectedMovimientoHerramienta),
                cantidadDevolverHerramienta
            );

            toast.success('Herramienta devuelta correctamente');
            setSelectedMovimientoHerramienta('');
            setCantidadDevolverHerramienta(0);
            cargarDatos();
            onSuccess();

        } catch (error: any) {
            console.error('Error devolviendo herramienta:', error);
            toast.error(error.response?.data?.detail || error.message || 'Error al devolver herramienta');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDevolverInsumo = async () => {
        if (!selectedMovimientoInsumo || cantidadDevolverInsumo <= 0) {
            toast.error('Selecciona un insumo y cantidad válida');
            return;
        }

        try {
            setSubmitting(true);

            const movimientoSeleccionado = insumosConsumidos.find(
                c => (c.movimiento_id || c.id) === parseInt(selectedMovimientoInsumo)
            );

            if (!movimientoSeleccionado) {
                toast.error('Movimiento no encontrado');
                return;
            }

            if (cantidadDevolverInsumo > (movimientoSeleccionado.cantidad_consumida || movimientoSeleccionado.cantidad)) {
                toast.error(`No puede devolver más de lo consumido. Consumido: ${movimientoSeleccionado.cantidad_consumida || movimientoSeleccionado.cantidad}`);
                return;
            }

            await laborService.devolverInsumo(
                labor?.id || 0,
                parseInt(selectedMovimientoInsumo),
                cantidadDevolverInsumo
            );

            toast.success('Insumo devuelta correctamente');
            setSelectedMovimientoInsumo('');
            setCantidadDevolverInsumo(0);
            cargarDatos();
            onSuccess();

        } catch (error: any) {
            console.error('Error devolviendo insumo:', error);
            toast.error(error.response?.data?.detail || error.message || 'Error al devolver insumo');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedHerramienta('');
        setCantidadHerramienta(1);
        setSelectedInsumo('');
        setCantidadInsumo(0);
        setSelectedMovimientoHerramienta('');
        setCantidadDevolverHerramienta(0);
        setSelectedMovimientoInsumo('');
        setCantidadDevolverInsumo(0);
    };

    if (!isOpen || !labor) return null;
    console.log("Programas del lote", programaLote);

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-4xl" maxHeight="85vh">
            {/* Cabecera fija */}
            <div className='p-6 max-h-[90vh] overflow-y-auto'>
                <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
                    <h2 className="text-xl font-bold">
                        Asignar Recursos a Labor #{labor.id}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">{labor.tipo_labor_nombre}</p>
                </div>

                {/* Contenido principal con scroll */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Información del programa */}
                    {programaLote && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center">
                                <i className="fas fa-info-circle text-blue-500 mr-2"></i>
                                <p className="text-sm text-blue-800">
                                    Esta labor pertenece al lote <span className="font-semibold">{labor.lote_nombre}</span>
                                    del programa <span className="font-semibold">{programaLote.nombre}</span>.
                                    Solo se pueden asignar insumos de este programa.
                                </p>
                            </div>
                        </div>
                    )}

                    {!programaLote && labor.lote_id && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center">
                                <i className="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                                <p className="text-sm text-yellow-800">
                                    No se pudo obtener información del programa del lote.
                                    Se mostrarán todos los insumos disponibles.
                                </p>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-8">
                            <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                            <p className="mt-2 text-gray-600">Cargando recursos disponibles...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* SECCIÓN ASIGNAR HERRAMIENTA */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-bold text-lg mb-3 text-gray-800 flex items-center">
                                    <i className="fas fa-tools mr-2 text-yellow-500"></i>
                                    Asignar Herramienta
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Herramienta *
                                        </label>
                                        <select
                                            value={selectedHerramienta}
                                            onChange={(e) => setSelectedHerramienta(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                            disabled={herramientasDisponibles.length === 0 || submitting}
                                        >
                                            <option value="">Seleccionar herramienta</option>
                                            {herramientasDisponibles.length === 0 ? (
                                                <option value="" disabled>No hay herramientas disponibles</option>
                                            ) : (
                                                herramientasDisponibles.map(herramienta => (
                                                    <option key={herramienta.id} value={herramienta.id}>
                                                        {herramienta.nombre} (Disponibles: {herramienta.cantidad_disponible})
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        {herramientasDisponibles.length === 0 && (
                                            <p className="text-xs text-gray-500 mt-1">No hay herramientas disponibles</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Cantidad *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={herramientasDisponibles.find(h => h.id === parseInt(selectedHerramienta))?.cantidad_disponible || 1}
                                            value={cantidadHerramienta}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value) || 1;
                                                const max = herramientasDisponibles.find(h => h.id === parseInt(selectedHerramienta))?.cantidad_disponible || 1;
                                                setCantidadHerramienta(Math.min(Math.max(1, value), max));
                                            }}
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                            disabled={!selectedHerramienta || submitting}
                                        />
                                    </div>

                                    <div className="flex items-end">
                                        <button
                                            onClick={handleAsignarHerramienta}
                                            disabled={!selectedHerramienta || submitting}
                                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded-lg disabled:opacity-50 transition-colors text-sm"
                                        >
                                            {submitting ? (
                                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                            ) : (
                                                <i className="fas fa-plus mr-2"></i>
                                            )}
                                            Asignar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN ASIGNAR INSUMO */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-bold text-lg mb-3 text-gray-800 flex items-center">
                                    <i className="fas fa-seedling mr-2 text-green-500"></i>
                                    Asignar Insumo
                                </h3>

                                {programaLote && (
                                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-xs text-green-800">
                                            <i className="fas fa-filter mr-1"></i>
                                            Mostrando solo insumos del programa: <strong>{programaLote.nombre}</strong>
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Insumo *
                                        </label>
                                        <select
                                            value={selectedInsumo}
                                            onChange={(e) => setSelectedInsumo(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                            disabled={insumosDisponibles.length === 0 || submitting}
                                        >
                                            <option value="">Seleccionar insumo</option>
                                            {insumosDisponibles.length === 0 ? (
                                                <option value="" disabled>No hay insumos disponibles para este programa</option>
                                            ) : (
                                                insumosDisponibles.map(insumo => (
                                                    <option key={insumo.id} value={insumo.id}>
                                                        {insumo.nombre} ({insumo.cantidad_disponible} {insumo.unidad_medida})
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        {insumosDisponibles.length === 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {programaLote
                                                    ? `No hay insumos disponibles para el programa ${programaLote.nombre}`
                                                    : 'No hay insumos disponibles'}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Cantidad *
                                        </label>
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            max={insumosDisponibles.find(i => i.id === parseInt(selectedInsumo))?.cantidad_disponible || 0}
                                            value={cantidadInsumo}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value) || 0;
                                                const max = insumosDisponibles.find(i => i.id === parseInt(selectedInsumo))?.cantidad_disponible || 0;
                                                setCantidadInsumo(Math.min(value, max));
                                            }}
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                            disabled={!selectedInsumo || submitting}
                                        />
                                        {selectedInsumo && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Máx: {insumosDisponibles.find(i => i.id === parseInt(selectedInsumo))?.cantidad_disponible || 0}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-end">
                                        <button
                                            onClick={handleAsignarInsumo}
                                            disabled={!selectedInsumo || submitting || cantidadInsumo <= 0}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg disabled:opacity-50 transition-colors text-sm"
                                        >
                                            {submitting ? (
                                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                            ) : (
                                                <i className="fas fa-plus mr-2"></i>
                                            )}
                                            Asignar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN DEVOLVER HERRAMIENTA */}
                            {herramientasAsignadas.length > 0 && (
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-bold text-lg mb-3 text-gray-800 flex items-center">
                                        <i className="fas fa-undo mr-2 text-blue-500"></i>
                                        Devolver Herramienta
                                    </h3>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Herramienta Asignada *
                                            </label>
                                            <select
                                                value={selectedMovimientoHerramienta}
                                                onChange={(e) => setSelectedMovimientoHerramienta(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                                disabled={submitting}
                                            >
                                                <option value="">Seleccionar herramienta asignada</option>
                                                {herramientasAsignadas.map(asignada => (
                                                    <option key={asignada.herramienta_id || asignada.id} value={asignada.movimiento_id || asignada.id}>
                                                        {asignada.herramienta_nombre} (Asignadas: {asignada.cantidad_actual || asignada.cantidad})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Cantidad a Devolver *
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={herramientasAsignadas.find(a => (a.movimiento_id || a.id) === parseInt(selectedMovimientoHerramienta))?.cantidad_actual || 0}
                                                    value={cantidadDevolverHerramienta}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value) || 0;
                                                        const max = herramientasAsignadas.find(a => (a.movimiento_id || a.id) === parseInt(selectedMovimientoHerramienta))?.cantidad_actual || 0;
                                                        setCantidadDevolverHerramienta(Math.min(value, max));
                                                    }}
                                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                                    disabled={!selectedMovimientoHerramienta || submitting}
                                                />
                                            </div>

                                            <div className="flex items-end">
                                                <button
                                                    onClick={handleDevolverHerramienta}
                                                    disabled={!selectedMovimientoHerramienta || submitting || cantidadDevolverHerramienta <= 0}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg disabled:opacity-50 transition-colors text-sm"
                                                >
                                                    {submitting ? (
                                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                                    ) : (
                                                        <i className="fas fa-undo mr-2"></i>
                                                    )}
                                                    Devolver
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SECCIÓN DEVOLVER INSUMO */}
                            {insumosConsumidos.length > 0 && (
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-bold text-lg mb-3 text-gray-800 flex items-center">
                                        <i className="fas fa-undo mr-2 text-purple-500"></i>
                                        Devolver Insumo
                                    </h3>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Insumo Consumido *
                                            </label>
                                            <select
                                                value={selectedMovimientoInsumo}
                                                onChange={(e) => setSelectedMovimientoInsumo(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                                disabled={submitting}
                                            >
                                                <option value="">Seleccionar insumo consumido</option>
                                                {insumosConsumidos.map(consumido => (
                                                    <option key={consumido.insumo_id || consumido.id} value={consumido.movimiento_id || consumido.id}>
                                                        {consumido.insumo_nombre} (Consumido: {consumido.cantidad_consumida || consumido.cantidad} {consumido.unidad_medida})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Cantidad a Devolver *
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    step="0.1"
                                                    max={insumosConsumidos.find(c => (c.movimiento_id || c.id) === parseInt(selectedMovimientoInsumo))?.cantidad_consumida || 0}
                                                    value={cantidadDevolverInsumo}
                                                    onChange={(e) => {
                                                        const value = parseFloat(e.target.value) || 0;
                                                        const max = insumosConsumidos.find(c => (c.movimiento_id || c.id) === parseInt(selectedMovimientoInsumo))?.cantidad_consumida || 0;
                                                        setCantidadDevolverInsumo(Math.min(value, max));
                                                    }}
                                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                                    disabled={!selectedMovimientoInsumo || submitting}
                                                />
                                            </div>

                                            <div className="flex items-end">
                                                <button
                                                    onClick={handleDevolverInsumo}
                                                    disabled={!selectedMovimientoInsumo || submitting || cantidadDevolverInsumo <= 0}
                                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg disabled:opacity-50 transition-colors text-sm"
                                                >
                                                    {submitting ? (
                                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                                    ) : (
                                                        <i className="fas fa-undo mr-2"></i>
                                                    )}
                                                    Devolver
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* RESUMEN DE RECURSOS ACTUALES */}
                            {(herramientasAsignadas.length > 0 || insumosConsumidos.length > 0) && (
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-bold text-lg mb-3 text-gray-800 flex items-center">
                                        <i className="fas fa-list mr-2 text-gray-500"></i>
                                        Recursos Actuales de la Labor
                                    </h3>

                                    <div className="space-y-3">
                                        {herramientasAsignadas.length > 0 && (
                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-1 text-sm">Herramientas asignadas:</h4>
                                                <ul className="space-y-1">
                                                    {herramientasAsignadas.map(herramienta => (
                                                        <li key={herramienta.herramienta_id} className="flex justify-between items-center text-sm">
                                                            <span className="truncate">{herramienta.herramienta_nombre}</span>
                                                            <span className="font-semibold whitespace-nowrap ml-2">{herramienta.cantidad_actual || herramienta.cantidad} unidades</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {insumosConsumidos.length > 0 && (
                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-1 text-sm">Insumos consumidos:</h4>
                                                <ul className="space-y-1">
                                                    {insumosConsumidos.map(insumo => (
                                                        <li key={insumo.insumo_id} className="flex justify-between items-center text-sm">
                                                            <span className="truncate">{insumo.insumo_nombre}</span>
                                                            <span className="font-semibold whitespace-nowrap ml-2">{insumo.cantidad_consumida || insumo.cantidad} {insumo.unidad_medida}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer fijo */}
                <div className="sticky bottom-0 bg-white border-t px-6 py-4">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors text-sm"
                            disabled={submitting}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AsignarRecursosModal;