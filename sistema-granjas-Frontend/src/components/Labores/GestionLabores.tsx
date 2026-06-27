// src/pages/Labores/GestionLaboresPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import laborService from '../../services/laboresService';
import usuarioService from '../../services/usuarioService';
import loteService from '../../services/loteService';
import recomendacionService from '../../services/recomendacionService';

import granjaService from '../../services/granjaService';
import type { Labor, LaborFilters } from '../../types/laboresTypes';
import Modal from '../../components/Common/Modal';
import LaboresTable from '../../components/Labores/LaboresTable';
import LaborForm from '../../components/Labores/LaboresForm';
import DetallesLaborModal from '../../components/Labores/DetallesLabores';
import EstadisticasLaboresModal from '../../components/Labores/Estadisticas';
import AsignarRecursosModal from '../../components/Labores/AsignarRecursos';
import CompletarLaborModal from '../../components/Labores/CompletarLabores';
import RecomendacionesSinLabores from '../../components/Labores/RecomendacionesSinLabores';
import { useAuth } from '../../hooks/useAuth';
import exportService from '../../services/exportService';
import ExportButton from '../Common/ExportButton';
import GestionTiposLabores from './GestionTiposLabores';

type LaboresTab = 'labores' | 'tipos' | 'recomendaciones-pendientes';

const GestionLaboresPage: React.FC = () => {
    const [tabActivo, setTabActivo] = useState<LaboresTab>('labores');
    const { user } = useAuth();
    const [labores, setLabores] = useState<Labor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para modales
    const [showCrearModal, setShowCrearModal] = useState(false);
    const [showEditarModal, setShowEditarModal] = useState(false);
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
    const [showAsignarRecursosModal, setShowAsignarRecursosModal] = useState(false);
    const [showCompletarModal, setShowCompletarModal] = useState(false);

    const [selectedLabor, setSelectedLabor] = useState<Labor | null>(null);
    const [laborACompletar, setLaborACompletar] = useState<Labor | null>(null);
    const [productosRecomendados, setProductosRecomendados] = useState<any[]>([]);

    // Datos para formularios
    const [lotes, setLotes] = useState<any[]>([]);
    const [lotesFiltrados, setLotesFiltrados] = useState<any[]>([]);
    const [trabajadores, setTrabajadores] = useState<any[]>([]);
    const [trabajadoresFiltrados, setTrabajadoresFiltrados] = useState<any[]>([]);
    const [recomendaciones, setRecomendaciones] = useState<any[]>([]);
    const [tiposLabor, setTiposLabor] = useState<any[]>([]);

    const [filtros, setFiltros] = useState<LaborFilters>({});

    // Verificar si el usuario es Talento Humano o Jefe Talento Humano
    const esTalentoHumano = user?.rol_id === 6 || user?.rol_id === 7 || user?.rol === 'jefe_talento_humano';

    // 👇 DETERMINAR ROL Y PROGRAMAS DEL USUARIO
    const esAdmin = user?.rol_id === 1;
    const esDocente = user?.rol_id === 2 || user?.rol_id === 5;
    const programasUsuario = useMemo(
        () => user?.programas?.map((p: any) => p.id) || [],
        [user?.id]
    );

    // 👇 FUNCIÓN PARA FILTRAR LOTES POR PROGRAMAS DEL DOCENTE
    const filtrarLotesPorDocente = useCallback((lotesArray: any[]) => {
        if (esAdmin) {
            return lotesArray; // Admin ve todos
        }
        if (esDocente) {
            if (programasUsuario.length === 0) {
                return []; // Docente sin programas no ve lotes
            }
            return lotesArray.filter(lote => programasUsuario.includes(lote.programa_id));
        }
        return lotesArray; // Otros roles ven todos
    }, [esAdmin, esDocente, programasUsuario]);

    // 👇 FUNCIÓN PARA FILTRAR TRABAJADORES (solo docentes con programas)
    const filtrarTrabajadores = useCallback((trabajadoresArray: any[]) => {
        if (esAdmin) {
            return trabajadoresArray; // Admin ve todos
        }
        if (esDocente) {
            if (programasUsuario.length === 0) {
                return []; // Docente sin programas no ve trabajadores
            }
            return trabajadoresArray; // Docente con programas ve todos los trabajadores
        }
        return trabajadoresArray; // Otros roles ven todos
    }, [esAdmin, esDocente, programasUsuario]);

    useEffect(() => {
        cargarDatos();
    }, [filtros]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);

            // Cargar labores - El backend ya filtra según el rol del usuario autenticado
            const data = await laborService.obtenerLabores(filtros);
            const laboresData = Array.isArray(data) ? data : (data?.items || data || []);
            setLabores(laboresData);

            // Cargar lotes y filtrar según rol
            if (lotes.length === 0) {
                try {
                    const lotesData = await loteService.obtenerLotes();
                    let lotesArray = Array.isArray(lotesData) ? lotesData : (lotesData?.items || []);

                    // Obtener nombres de granjas para cada lote
                    lotesArray = await Promise.all(
                        lotesArray.map(async (lote) => {
                            try {
                                if (lote.granja_id) {
                                    const granja = await granjaService.obtenerGranjaPorId(lote.granja_id);
                                    return {
                                        ...lote,
                                        granja_nombre: granja.nombre || 'Sin nombre'
                                    };
                                }
                                return {
                                    ...lote,
                                    granja_nombre: 'Sin granja'
                                };
                            } catch (error) {
                                console.error(`Error obteniendo granja ${lote.granja_id}:`, error);
                                return {
                                    ...lote,
                                    granja_nombre: 'Error al cargar'
                                };
                            }
                        })
                    );

                    setLotes(lotesArray);
                    
                    // 👇 Filtrar lotes según rol
                    const lotesFiltradosPorRol = filtrarLotesPorDocente(lotesArray);
                    setLotesFiltrados(lotesFiltradosPorRol);
                    
                } catch (loteError) {
                    console.error('Error cargando lotes:', loteError);
                    toast.error('Error al cargar los lotes');
                    setLotes([]);
                    setLotesFiltrados([]);
                }
            }

            // Cargar trabajadores y filtrar según rol
            if (trabajadores.length === 0) {
                try {
                    const trabajadoresData = await usuarioService.obtenerTrabajadores();
                    setTrabajadores(trabajadoresData);
                    
                    // 👇 Filtrar trabajadores según rol
                    const trabajadoresFiltradosPorRol = filtrarTrabajadores(trabajadoresData);
                    setTrabajadoresFiltrados(trabajadoresFiltradosPorRol);
                    
                } catch (userError) {
                    console.error('Error cargando trabajadores:', userError);
                    setTrabajadores([]);
                    setTrabajadoresFiltrados([]);
                }
            }

            if (recomendaciones.length === 0) {
                try {
                    const recData = await recomendacionService.obtenerRecomendaciones();
                    const recArray = Array.isArray(recData) ? recData : (recData?.items || []);
                    setRecomendaciones(recArray);
                } catch (recError) {
                    console.error('Error cargando recomendaciones:', recError);
                    setRecomendaciones([]);
                }
            }

            // Cargar tipos de labor
            if (tiposLabor.length === 0) {
                try {
                    // Intentar cargar tipos de labor desde el servicio
                    const tipos = await laborService.obtenerTiposLabor?.() || [];
                    setTiposLabor(tipos);
                } catch (error) {
                    console.error('Error cargando tipos de labor:', error);
                    setTiposLabor([]);
                }
            }

        } catch (err: any) {
            console.error('Error en cargarDatos:', err);
            setError(err.message || 'Error al cargar labores');
            toast.error(`Error al cargar datos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // CRUD HANDLERS
    const handleCrearLabor = async (data: any) => {
        try {
            const nueva = await laborService.crearLabor(data, user);
            setLabores(prev => [...prev, nueva]);
            toast.success('Labor creada exitosamente');
            setShowCrearModal(false);
        } catch (err: any) {
            console.error('Error al crear labor:', err);
            toast.error(`Error al crear labor: ${err.message}`);
        }
    };

    const handleActualizarLabor = async (id: number, data: any) => {
        try {
            const actualizado = await laborService.actualizarLabor(id, data, user);
            setLabores(prev => prev.map(l => l.id === id ? actualizado : l));
            toast.success(`Labor #${id} actualizada exitosamente`);
            setShowEditarModal(false);
        } catch (err: any) {
            console.error('Error al actualizar labor:', err);
            toast.error(`Error al actualizar labor: ${err.message || 'Error desconocido'}`);
        }
    };

    const handleEliminarLabor = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar esta labor?")) return;

        try {
            await laborService.eliminarLabor(id);
            setLabores(prev => prev.filter(l => l.id !== id));
            toast.success("Labor eliminada exitosamente");
        } catch (err: any) {
            toast.error(`Error al eliminar: ${err.message}`);
        }
    };

    const handleCompletarLabor = async (datos: {
        comentario?: string;
        inventario_item_id?: number;
        cantidad_usada?: number;
        dosis_aplicada?: number;
        unidad_dosis?: string;
    }) => {
        if (!laborACompletar) return;

        try {
            const completada = await laborService.completarLabor(laborACompletar.id, datos);
            setLabores(prev => prev.map(l =>
                l.id === laborACompletar.id ? completada : l
            ));
            toast.success('Labor completada exitosamente');
            setShowCompletarModal(false);
            setLaborACompletar(null);
        } catch (err: any) {
            console.error('Error al completar labor:', err);
            toast.error(`Error al completar labor: ${err.message}`);
        }
    };

    // OPEN MODAL HANDLERS
    const openEditarModal = (labor: Labor) => {
        setSelectedLabor(labor);
        setShowEditarModal(true);
    };

    const openDetallesModal = (labor: Labor) => {
        setSelectedLabor(labor);
        setShowDetallesModal(true);
    };

    const openAsignarRecursosModal = (labor: Labor) => {
        setSelectedLabor(labor);
        setShowAsignarRecursosModal(true);
    };

    const openCompletarModal = async (labor: Labor) => {
        setLaborACompletar(labor);
        setProductosRecomendados([]);
        setShowCompletarModal(true);
        // Load recommended products from the recomendacion
        if ((labor as any).recomendacion_id) {
            try {
                const rec = await recomendacionService.obtenerRecomendacionPorId((labor as any).recomendacion_id);
                const items = (rec as any).items_sugeridos || [];
                if (items.length > 0) {
                    setProductosRecomendados(items);
                } else if ((rec as any).inventario_item_id) {
                    setProductosRecomendados([{
                        id: (rec as any).inventario_item_id,
                        inventario_item_id: (rec as any).inventario_item_id,
                        inventario_item_nombre: (rec as any).inventario_item_nombre,
                        inventario_item_unidad: (rec as any).inventario_item_unidad,
                        cantidad_sugerida: (rec as any).cantidad_sugerida,
                    }]);
                }
            } catch { /* no products */ }
        }
    };

    // ✅ EL BACKEND YA FILTRA POR ROL AUTOMÁTICAMENTE
    const laboresFiltradas = Array.isArray(labores) ? labores : [];

    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Labores</h1>
                    <div className="flex items-center space-x-3 m-2">
                        <ExportButton onExport={() => exportService.exportarLabores()} />
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowEstadisticasModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
                        >
                            <i className="fas fa-chart-bar mr-2"></i>
                            Estadísticas
                        </button>

                        {(user && ([1, 6, 7].includes(user.rol_id) || user.rol === 'jefe_talento_humano')) && (
                            <button
                                onClick={() => setShowCrearModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Nueva Labor
                            </button>
                        )}
                    </div>
                </div>

                {/* TABS */}
                <div className="flex border-b border-gray-200 mb-4">
                    <button 
                        onClick={() => setTabActivo('labores')}
                        className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${tabActivo === 'labores' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <i className="fas fa-tasks mr-2"></i>Labores
                    </button>
                    {user && ([1, 2, 5, 6, 7].includes(user.rol_id) || user.rol === 'jefe_talento_humano') && (
                        <button 
                            onClick={() => setTabActivo('tipos')}
                            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${tabActivo === 'tipos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <i className="fas fa-tag mr-2"></i>Tipos de Labor
                        </button>
                    )}
                    {/* Nueva pestaña para Talento Humano */}
                    {esTalentoHumano && (
                        <button 
                            onClick={() => setTabActivo('recomendaciones-pendientes')}
                            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-2 ${tabActivo === 'recomendaciones-pendientes' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <i className="fas fa-clipboard-list"></i>
                            Recomendaciones sin labores
                        </button>
                    )}
                </div>

                {/* Filtros */}
                {tabActivo === 'labores' && (
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <h3 className="font-semibold mb-3">Filtros</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <select
                                className="border rounded p-2"
                                value={filtros.estado || ''}
                                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value || undefined })}
                            >
                                <option value="">Todos los estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="en_progreso">En Progreso</option>
                                <option value="completada">Completada</option>
                                <option value="cancelada">Cancelada</option>
                            </select>

                            <select
                                className="border rounded p-2"
                                value={filtros.trabajador_id || ''}
                                onChange={(e) => setFiltros({ ...filtros, trabajador_id: e.target.value ? parseInt(e.target.value) : undefined })}
                            >
                                <option value="">Todos los trabajadores</option>
                                {Array.isArray(trabajadoresFiltrados) && trabajadoresFiltrados.map(trab => (
                                    <option key={trab.id} value={trab.id}>
                                        {trab.nombre}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="border rounded p-2"
                                value={filtros.lote_id || ''}
                                onChange={(e) => setFiltros({ ...filtros, lote_id: e.target.value ? parseInt(e.target.value) : undefined })}
                            >
                                <option value="">Todos los lotes</option>
                                {Array.isArray(lotesFiltrados) && lotesFiltrados.map(lote => (
                                    <option key={lote.id} value={lote.id}>
                                        {lote.nombre} ({lote.granja_nombre || 'Sin granja'})
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => setFiltros({})}
                                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                        {/* 👇 Mensaje informativo para docentes */}
                        {esDocente && (
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    <i className="fas fa-info-circle mr-1"></i>
                                    Mostrando {lotesFiltrados.length} lote(s) de tus programas asignados
                                </span>
                                {programasUsuario.length === 0 && (
                                    <span className="text-xs text-red-500">
                                        <i className="fas fa-exclamation-triangle mr-1"></i>
                                        No tienes programas asignados
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* TAB: Tipos de Labor */}
            {tabActivo === 'tipos' && (
                <GestionTiposLabores />
            )}

            {/* TAB: Recomendaciones sin labores (Talento Humano) */}
            {tabActivo === 'recomendaciones-pendientes' && esTalentoHumano && (
                <RecomendacionesSinLabores onLaborCreada={cargarDatos} />
            )}

            {/* TAB: Labores tabla */}
            {tabActivo === 'labores' && (
                <>
                    {loading ? (
                        <div className="text-center py-8">
                            <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                            <p className="mt-2 text-gray-600">Cargando labores...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                            <p>Error: {error}</p>
                            <button onClick={cargarDatos} className="mt-2 text-blue-600 hover:text-blue-800">
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <LaboresTable
                            labores={laboresFiltradas}
                            onEditar={openEditarModal}
                            onEliminar={handleEliminarLabor}
                            onVerDetalles={openDetallesModal}
                            onAsignarRecursos={openAsignarRecursosModal}
                            onCompletar={openCompletarModal}
                            currentUser={user}
                        />
                    )}
                </>
            )}

            {/* MODALES */}

            {/* MODAL CREAR */}
            <Modal isOpen={showCrearModal} onClose={() => setShowCrearModal(false)} width="max-w-2xl">
                <LaborForm
                    onSubmit={handleCrearLabor}
                    onCancel={() => setShowCrearModal(false)}
                    tiposLabor={tiposLabor}
                    trabajadores={trabajadoresFiltrados}
                    lotes={lotesFiltrados}
                    recomendaciones={recomendaciones}
                    currentUser={user}
                />
            </Modal>

            {/* MODAL EDITAR */}
            <Modal isOpen={showEditarModal} onClose={() => setShowEditarModal(false)} width="max-w-2xl">
                {selectedLabor && (
                    <LaborForm
                        labor={selectedLabor}
                        onSubmit={(data) => handleActualizarLabor(selectedLabor.id, data)}
                        onCancel={() => setShowEditarModal(false)}
                        tiposLabor={tiposLabor}
                        trabajadores={trabajadoresFiltrados}
                        lotes={lotesFiltrados}
                        recomendaciones={recomendaciones}
                        currentUser={user}
                        esEdicion={true}
                    />
                )}
            </Modal>

            {/* MODAL DETALLES */}
            {selectedLabor && (
                <DetallesLaborModal
                    isOpen={showDetallesModal}
                    onClose={() => {
                        setShowDetallesModal(false);
                        setSelectedLabor(null);
                    }}
                    labor={selectedLabor}
                />
            )}

            {/* MODAL ESTADÍSTICAS */}
            <EstadisticasLaboresModal
                isOpen={showEstadisticasModal}
                onClose={() => setShowEstadisticasModal(false)}
            />

            {/* MODAL ASIGNAR RECURSOS */}
            {selectedLabor && (
                <AsignarRecursosModal
                    isOpen={showAsignarRecursosModal}
                    onClose={() => {
                        setShowAsignarRecursosModal(false);
                        setSelectedLabor(null);
                    }}
                    onSuccess={cargarDatos}
                    labor={selectedLabor}
                />
            )}

            {/* MODAL COMPLETAR LABOR */}
            {laborACompletar && (
                <CompletarLaborModal
                    isOpen={showCompletarModal}
                    onClose={() => {
                        setShowCompletarModal(false);
                        setLaborACompletar(null);
                    }}
                    onCompletar={handleCompletarLabor}
                    tituloLabor={`Labor #${laborACompletar.id}`}
                    productosRecomendados={productosRecomendados}
                />
            )}
        </div>
    );
};

export default GestionLaboresPage;