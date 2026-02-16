import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../Common/Modal';
import cultivoService from '../../services/cultivoService';

interface LoteFormProps {
    isOpen: boolean;
    onClose: () => void;
    datosFormulario: any;
    setDatosFormulario: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: (e: React.FormEvent) => Promise<void>; // Cambié a Promise<void>
    editando: boolean;
    tiposLote: any[];
    granjas: any[];
    programas: any[];
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
    programas
}) => {
    const [cultivos, setCultivos] = useState<any[]>([]);
    const [cargandoCultivos, setCargandoCultivos] = useState(false);
    const [enviando, setEnviando] = useState(false);

    // Efecto para cargar cultivos cuando cambia la granja seleccionada
    useEffect(() => {
        const cargarCultivosDeGranja = async () => {
            if (datosFormulario.granja_id) {
                setCargandoCultivos(true);

                // Mostrar toast de carga si toma más de 500ms
                const loadingTimeout = setTimeout(() => {
                    toast.loading('Cargando cultivos de la granja...', {
                        id: 'cargando-cultivos'
                    });
                }, 500);

                try {
                    const cultivosData = await cultivoService.obtenerCultivosPorGranja(datosFormulario.granja_id);
                    setCultivos(cultivosData);

                    clearTimeout(loadingTimeout);
                    toast.dismiss('cargando-cultivos');

                    if (cultivosData.length > 0) {
                        toast.success(`${cultivosData.length} cultivo(s) cargado(s)`, {
                            duration: 2000,
                            position: 'top-right'
                        });
                    }

                    // Si estamos editando y el cultivo_id existe en la lista, mantenerlo
                    // Si no, resetear el cultivo_id
                    if (datosFormulario.cultivo_id) {
                        const cultivoExiste = cultivosData.some(c => c.id === datosFormulario.cultivo_id);
                        if (!cultivoExiste) {
                            setDatosFormulario(prev => ({
                                ...prev,
                                cultivo_id: null,
                                nombre_cultivo: ''
                            }));

                            // Usar toast() en lugar de toast.info()
                            toast('El cultivo anterior ya no está disponible', {
                                duration: 3000,
                                position: 'top-right'
                            });
                        }
                    }
                } catch (error: any) {
                    console.error('Error cargando cultivos:', error);
                    setCultivos([]);

                    clearTimeout(loadingTimeout);
                    toast.dismiss('cargando-cultivos');

                    toast.error('Error al cargar los cultivos de la granja', {
                        duration: 4000,
                        position: 'top-right'
                    });
                } finally {
                    setCargandoCultivos(false);
                }
            } else {
                setCultivos([]);
                // Resetear cultivo_id si no hay granja seleccionada
                setDatosFormulario(prev => ({
                    ...prev,
                    cultivo_id: null,
                    nombre_cultivo: ''
                }));
            }
        };

        if (isOpen) {
            cargarCultivosDeGranja();
        }
    }, [datosFormulario.granja_id, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        setDatosFormulario(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        }));

        // Si cambia la granja, resetear el cultivo_id
        if (name === 'granja_id') {
            setDatosFormulario(prev => ({
                ...prev,
                cultivo_id: null,
                nombre_cultivo: ''
            }));

            // Notificación cuando se selecciona una granja
            const granjaSeleccionada = granjas.find(g => g.id === parseInt(value));
            if (granjaSeleccionada) {
                toast.success(`Granja "${granjaSeleccionada.nombre}" seleccionada`, {
                    duration: 2000,
                    position: 'top-right'
                });
            }
        }

        // Notificación cuando se selecciona un tipo de lote
        if (name === 'tipo_lote_id') {
            const tipoLoteSeleccionado = tiposLote.find(t => t.id === parseInt(value));
            if (tipoLoteSeleccionado) {
                // Usar toast() en lugar de toast.info()
                toast(`Tipo de lote: ${tipoLoteSeleccionado.nombre}`, {
                    duration: 2000,
                    position: 'top-right'
                });
            }
        }

        // Notificación cuando se selecciona un programa
        if (name === 'programa_id') {
            const programaSeleccionado = programas.find(p => p.id === parseInt(value));
            if (programaSeleccionado) {
                toast.success(`Programa: ${programaSeleccionado.nombre}`, {
                    duration: 2000,
                    position: 'top-right'
                });
            }
        }
    };

    // Manejar cambio de cultivo seleccionado
    const handleCultivoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cultivoId = parseInt(e.target.value);
        const cultivoSeleccionado = cultivos.find(c => c.id === cultivoId);

        setDatosFormulario(prev => ({
            ...prev,
            cultivo_id: cultivoId,
            nombre_cultivo: cultivoSeleccionado ? cultivoSeleccionado.nombre : ''
        }));

        if (cultivoSeleccionado) {
            toast.success(`Cultivo seleccionado: ${cultivoSeleccionado.nombre}`, {
                duration: 2000,
                position: 'top-right'
            });
        }
    };

    // Opciones de estado
    const estados = [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'completado', label: 'Completado' }
    ];

    // Manejar envío del formulario con toasts CORREGIDO
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (enviando) return; // Evitar múltiples envíos

        // Validación adicional
        if (!datosFormulario.cultivo_id) {
            toast.error('Por favor selecciona un cultivo', {
                duration: 4000,
                position: 'top-right'
            });
            return;
        }

        if (!datosFormulario.nombre.trim()) {
            toast.error('Por favor ingresa un nombre para el lote', {
                duration: 4000,
                position: 'top-right'
            });
            return;
        }

        // Validar nombre del lote
        const nombreLote = datosFormulario.nombre.trim();
        const regexValido = /^[\p{L}0-9\s\-.,()]+$/u;

        if (!regexValido.test(nombreLote)) {
            toast.error('El nombre del lote contiene caracteres no permitidos. Solo letras, números y espacios', {
                duration: 5000,
                position: 'top-right'
            });
            return;
        }

        // Validar que el nombre no empiece o termine con caracteres especiales
        if (/^[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/.test(nombreLote) || /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]$/.test(nombreLote)) {
            toast.error('El nombre no puede empezar o terminar con caracteres especiales', {
                duration: 5000,
                position: 'top-right'
            });
            return;
        }

        setEnviando(true);

        try {
            // Mostrar toast de carga
            const loadingToast = toast.loading(
                editando ? 'Actualizando lote...' : 'Creando lote...',
                {
                    id: 'enviando-lote'
                }
            );

            // Llamar al onSubmit original - DEBE devolver una Promise
            await onSubmit(e);

            // Cerrar toast de carga
            toast.dismiss(loadingToast);

            // Mostrar éxito SOLO si onSubmit no lanzó error
            toast.success(
                editando ? '¡Lote actualizado exitosamente!' : '¡Lote creado exitosamente!',
                {
                    duration: 3000,
                    position: 'top-right'
                }
            );

            // Cerrar el modal después de un breve delay
            setTimeout(() => {
                onClose();
            }, 500);

        } catch (error: any) {
            // El error ya debería haber sido manejado por el componente padre
            // Pero por si acaso, manejamos errores específicos aquí
            console.error('Error en handleSubmit del formulario:', error);

            // Cerrar toast de carga si aún está abierto
            toast.dismiss('enviando-lote');

            // Si el error tiene detalles específicos, mostrarlos
            if (error.response?.data?.detail) {
                const errores = error.response.data.detail;
                errores.forEach((err: any) => {
                    toast.error(`Error: ${err.msg || 'Error desconocido'}`, {
                        duration: 5000,
                        position: 'top-right'
                    });
                });
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (enviando) {
                    toast.error('Por favor espera a que termine la operación actual');
                    return;
                }

                // Toast de confirmación al cancelar
                if (datosFormulario.nombre || datosFormulario.granja_id) {
                    const confirmar = window.confirm('¿Estás seguro de cancelar? Los cambios no guardados se perderán.');
                    if (!confirmar) return;
                }

                toast('Formulario cancelado', {
                    duration: 2000,
                    position: 'top-right'
                });
                onClose();
            }}
            title={editando ? 'Editar Lote' : 'Nuevo Lote'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4 px-1 md:px-2">
                {/* Contenedor con padding mejorado */}
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
                                value={datosFormulario.nombre}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                                placeholder="Ej: Lote Norte, Parcela 1"
                                disabled={enviando}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Solo letras, números y espacios. No se permiten caracteres especiales como #, @, !, etc.
                            </p>
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
                                value={datosFormulario.estado}
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
                                value={datosFormulario.programa_id || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                                disabled={enviando}
                            >
                                <option value="">Seleccionar programa</option>
                                {programas.map(programa => (
                                    <option key={programa.id} value={programa.id}>
                                        {programa.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Cultivo (dropdown con los cultivos de la granja) */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cultivo *
                            </label>
                            <div className="flex items-center space-x-2">
                                <select
                                    name="cultivo_id"
                                    value={datosFormulario.cultivo_id || ''}
                                    onChange={handleCultivoChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                    disabled={cargandoCultivos || !datosFormulario.granja_id || enviando}
                                >
                                    <option value="">{
                                        !datosFormulario.granja_id
                                            ? 'Primero seleccione una granja'
                                            : cargandoCultivos
                                                ? 'Cargando cultivos...'
                                                : 'Seleccionar cultivo'
                                    }</option>
                                    {cultivos.map(cultivo => (
                                        <option key={cultivo.id} value={cultivo.id}>
                                            {cultivo.nombre} ({cultivo.tipo})
                                        </option>
                                    ))}
                                </select>
                                {cargandoCultivos && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                )}
                            </div>
                            {/* Input oculto para nombre_cultivo que se autocompleta */}
                            <input
                                type="hidden"
                                name="nombre_cultivo"
                                value={datosFormulario.nombre_cultivo || ''}
                            />
                            {datosFormulario.nombre_cultivo && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Cultivo seleccionado: <strong>{datosFormulario.nombre_cultivo}</strong>
                                </p>
                            )}
                        </div>

                        {/* Fecha Inicio */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Inicio *
                            </label>
                            <input
                                type="date"
                                name="fecha_inicio"
                                value={datosFormulario.fecha_inicio}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                                disabled={enviando}
                            />
                        </div>
                    </div>

                    {/* Nota informativa */}
                    {datosFormulario.granja_id && cultivos.length === 0 && !cargandoCultivos && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        Esta granja no tiene cultivos registrados.
                                        <a
                                            href="/gestion-cultivos"
                                            className="ml-1 text-yellow-700 underline hover:text-yellow-600"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => {
                                                toast('Redirigiendo a gestión de cultivos...', {
                                                    duration: 2000,
                                                    position: 'top-right'
                                                });
                                            }}
                                        >
                                            Crear un cultivo primero.
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botones con mejor padding */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 px-1">
                    <button
                        type="button"
                        onClick={() => {
                            if (enviando) {
                                toast.error('Por favor espera a que termine la operación actual');
                                return;
                            }

                            // Toast de confirmación al cancelar
                            if (datosFormulario.nombre || datosFormulario.granja_id) {
                                const confirmar = window.confirm('¿Estás seguro de cancelar? Los cambios no guardados se perderán.');
                                if (!confirmar) return;
                            }

                            toast('Formulario cancelado', {
                                duration: 2000,
                                position: 'top-right'
                            });
                            onClose();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={enviando}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        disabled={!datosFormulario.cultivo_id || !datosFormulario.nombre.trim() || enviando}
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