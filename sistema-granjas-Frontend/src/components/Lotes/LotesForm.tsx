import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../Common/Modal';
import cultivoService from '../../services/cultivoService';
import CultivosMultiSelect from './CultivosMultiSelect';

interface LoteFormProps {
    isOpen: boolean;
    onClose: () => void;
    datosFormulario: any;
    setDatosFormulario: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    editando: boolean;
    tiposLote: any[];
    granjas: any[];
    programas: any[];
    programaIdFijo?: number;
}

const LoteForm: React.FC<LoteFormProps> = ({
    isOpen,
    onClose,
    datosFormulario,
    setDatosFormulario,
    onSubmit,
    editando,
    tiposLote,
    granjas,
    programas,
    programaIdFijo
}) => {
    const [cultivos, setCultivos] = useState<any[]>([]);
    const [cargandoCultivos, setCargandoCultivos] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [totalPlantas, setTotalPlantas] = useState<number | null>(null);
    const cultivosCargadosRef = useRef(false);
    const granjaAnteriorRef = useRef<number | null>(null);

    // Calcular total de plantas cuando cambian surcos o plantas_por_surco
    useEffect(() => {
        const surcos = datosFormulario.surcos;
        const plantasPorSurco = datosFormulario.plantas_por_surco;
        
        if (surcos && plantasPorSurco && surcos > 0 && plantasPorSurco > 0) {
            const total = surcos * plantasPorSurco;
            setTotalPlantas(total);
        } else {
            setTotalPlantas(null);
        }
    }, [datosFormulario.surcos, datosFormulario.plantas_por_surco]);

    // Cargar cultivos cuando cambia la granja o se abre el modal
    useEffect(() => {
        const cargarCultivosDeGranja = async () => {
            const granjaId = datosFormulario.granja_id;
            
            if (!granjaId) {
                setCultivos([]);
                granjaAnteriorRef.current = null;
                cultivosCargadosRef.current = false;
                return;
            }

            // Si ya cargamos los cultivos para esta granja, no recargar
            if (cultivosCargadosRef.current && granjaAnteriorRef.current === granjaId) {
                return;
            }

            setCargandoCultivos(true);
            granjaAnteriorRef.current = granjaId;

            try {
                const cultivosData = await cultivoService.obtenerCultivosPorGranja(granjaId);
                setCultivos(cultivosData);
                cultivosCargadosRef.current = true;

                if (cultivosData.length > 0 && isOpen) {
                    toast.success(`${cultivosData.length} cultivo(s) cargado(s)`, {
                        duration: 2000,
                        position: 'top-right'
                    });
                }

                // Si estamos editando, validar que los cultivos seleccionados sigan existiendo
                if (editando && datosFormulario.cultivos_ids?.length > 0) {
                    const idsValidos = datosFormulario.cultivos_ids.filter((id: number) =>
                        cultivosData.some(c => c.id === id)
                    );
                    
                    if (idsValidos.length !== datosFormulario.cultivos_ids.length) {
                        setDatosFormulario((prev: any) => ({
                            ...prev,
                            cultivos_ids: idsValidos
                        }));
                        
                        toast('Algunos cultivos ya no están disponibles', {
                            duration: 3000,
                            icon: '⚠️',
                            position: 'top-right'
                        });
                    }
                }
            } catch (error: any) {
                console.error('Error cargando cultivos:', error);
                setCultivos([]);
                cultivosCargadosRef.current = false;

                if (isOpen) {
                    toast.error('Error al cargar los cultivos de la granja', {
                        duration: 4000,
                        position: 'top-right'
                    });
                }
            } finally {
                setCargandoCultivos(false);
            }
        };

        if (isOpen) {
            cargarCultivosDeGranja();
        }
    }, [datosFormulario.granja_id, isOpen, editando, setDatosFormulario]);

    // Resetear el ref cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            cultivosCargadosRef.current = false;
            granjaAnteriorRef.current = null;
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        let parsedValue: any = value;
        
        // Manejar campos numéricos
        if (type === 'number') {
            parsedValue = value === '' ? null : parseInt(value);
            // Validar que no sean números negativos
            if (parsedValue !== null && parsedValue < 0) {
                toast.error(`El campo no puede ser negativo`, {
                    duration: 3000,
                    position: 'top-right'
                });
                return;
            }
        }

        setDatosFormulario((prev: any) => ({
            ...prev,
            [name]: parsedValue
        }));

        // Si cambia la granja, resetear los cultivos seleccionados
        if (name === 'granja_id') {
            setDatosFormulario((prev: any) => ({
                ...prev,
                cultivos_ids: []
            }));
            cultivosCargadosRef.current = false;
        }
    };

    // Manejar cambio de cultivos seleccionados
    const handleCultivosChange = (selectedIds: number[]) => {
        setDatosFormulario((prev: any) => ({
            ...prev,
            cultivos_ids: selectedIds
        }));
    };

    // Opciones de estado
    const estados = [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
        { value: 'pendiente', label: 'En descanso' }
    ];

    // Manejar envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (enviando) return;

        // Validaciones
        if (!datosFormulario.nombre?.trim()) {
            toast.error('Por favor ingresa un nombre para el lote', {
                duration: 4000,
                position: 'top-right'
            });
            return;
        }

        if (!datosFormulario.granja_id) {
            toast.error('Por favor selecciona una granja', {
                duration: 4000,
                position: 'top-right'
            });
            return;
        }

        if (!datosFormulario.tipo_lote_id) {
            toast.error('Por favor selecciona un tipo de lote', {
                duration: 4000,
                position: 'top-right'
            });
            return;
        }

        if (!datosFormulario.programa_id && !programaIdFijo) {
            toast.error('Por favor selecciona un programa', {
                duration: 4000,
                position: 'top-right'
            });
            return;
        }

        setEnviando(true);

        try {
            await onSubmit(e);
            toast.success(
                editando ? '¡Lote actualizado exitosamente!' : '¡Lote creado exitosamente!',
                { duration: 3000, position: 'top-right' }
            );
            setTimeout(() => {
                onClose();
            }, 500);
        } catch (error: any) {
            console.error('Error en handleSubmit del formulario:', error);

            if (error.response?.data?.detail) {
                const errores = error.response.data.detail;
                if (Array.isArray(errores)) {
                    errores.forEach((err: any) => {
                        toast.error(`Error: ${err.msg || 'Error desconocido'}`, {
                            duration: 5000,
                            position: 'top-right'
                        });
                    });
                } else {
                    toast.error(`Error: ${errores}`, {
                        duration: 5000,
                        position: 'top-right'
                    });
                }
            } else if (error.message) {
                toast.error(`Error: ${error.message}`, {
                    duration: 5000,
                    position: 'top-right'
                });
            }
        } finally {
            setEnviando(false);
        }
    };

    // Determinar si el campo programa debe estar deshabilitado
    const programaDeshabilitado = !!programaIdFijo || enviando;

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (enviando) {
                    toast.error('Por favor espera a que termine la operación actual');
                    return;
                }
                onClose();
            }}
            title={editando ? 'Editar Lote' : 'Nuevo Lote'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4 px-1 md:px-2">
                <div className="space-y-4 px-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Lote *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={datosFormulario.nombre || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                                placeholder="Ej: Lote Norte, Parcela 1"
                                disabled={enviando}
                            />
                        </div>

                        {/* Tipo de Lote */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Lote *
                            </label>
                            <select
                                name="tipo_lote_id"
                                value={datosFormulario.tipo_lote_id || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                                disabled={enviando}
                            >
                                <option value="">Seleccionar tipo</option>
                                {tiposLote.map(tipo => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Estado */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado *
                            </label>
                            <select
                                name="estado"
                                value={datosFormulario.estado || 'activo'}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                                disabled={enviando}
                            >
                                {estados.map(estado => (
                                    <option key={estado.value} value={estado.value}>
                                        {estado.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Granja */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Granja *
                            </label>
                            <select
                                name="granja_id"
                                value={datosFormulario.granja_id || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                                disabled={enviando}
                            >
                                <option value="">Seleccionar granja</option>
                                {granjas.map(granja => (
                                    <option key={granja.id} value={granja.id}>
                                        {granja.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Programa */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Programa *
                            </label>
                            <select
                                name="programa_id"
                                value={programaIdFijo || datosFormulario.programa_id || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                                disabled={programaDeshabilitado}
                            >
                                <option value="">Seleccionar programa</option>
                                {programas.map(programa => (
                                    <option key={programa.id} value={programa.id}>
                                        {programa.nombre}
                                    </option>
                                ))}
                            </select>
                            {programaIdFijo && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Programa fijo para este lote
                                </p>
                            )}
                        </div>

                        {/* Surcos */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Número de Surcos
                            </label>
                            <input
                                type="number"
                                name="surcos"
                                value={datosFormulario.surcos ?? ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Ej: 50"
                                min="0"
                                step="1"
                                disabled={enviando}
                            />
                        </div>

                        {/* Plantas por Surco */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Plantas por Surco
                            </label>
                            <input
                                type="number"
                                name="plantas_por_surco"
                                value={datosFormulario.plantas_por_surco ?? ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Ej: 100"
                                min="0"
                                step="1"
                                disabled={enviando}
                            />
                        </div>

                        {/* Total de Plantas (solo lectura) */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total de Plantas (calculado)
                            </label>
                            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                                {totalPlantas !== null ? (
                                    <span className="font-semibold text-green-600">
                                        {totalPlantas.toLocaleString('es-ES')} plantas
                                    </span>
                                ) : (
                                    <span className="text-gray-400 italic">
                                        Ingrese surcos y plantas por surco para calcular el total
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Cultivos Múltiples */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cultivos (puede seleccionar varios)
                            </label>
                            <CultivosMultiSelect
                                cultivos={cultivos}
                                selectedIds={datosFormulario.cultivos_ids || []}
                                onChange={handleCultivosChange}
                                disabled={enviando || !datosFormulario.granja_id}
                                cargando={cargandoCultivos}
                            />
                        </div>

                        {/* Fecha Inicio */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Inicio *
                            </label>
                            <input
                                type="date"
                                name="fecha_inicio"
                                value={datosFormulario.fecha_inicio || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                                disabled={enviando}
                            />
                        </div>
                    </div>

                    {/* Nota informativa - Sin cultivos */}
                    {datosFormulario.granja_id && cultivos.length === 0 && !cargandoCultivos && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        Esta granja no tiene cultivos registrados.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 px-1">
                    <button
                        type="button"
                        onClick={() => {
                            if (enviando) {
                                toast.error('Por favor espera a que termine la operación actual');
                                return;
                            }
                            onClose();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={enviando}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[120px] justify-center"
                        disabled={
                            !datosFormulario.nombre?.trim() ||
                            !datosFormulario.tipo_lote_id ||
                            !datosFormulario.granja_id ||
                            (!datosFormulario.programa_id && !programaIdFijo) ||
                            enviando
                        }
                    >
                        {enviando ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {editando ? 'Actualizando...' : 'Creando...'}
                            </>
                        ) : (
                            editando ? 'Actualizar Lote' : 'Crear Lote'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default LoteForm;