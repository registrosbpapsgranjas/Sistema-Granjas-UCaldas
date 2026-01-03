// src/pages/Labores/GestionLaboresPage.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import laborService from '../../services/laboresService';
import usuarioService from '../../services/usuarioService';
import loteService from '../../services/loteService';
import recomendacionService from '../../services/recomendacionService';
import tipoLaborService from '../../services/tipoLaboresService';
import granjaService from '../../services/granjaService';
import type { Labor, LaborFilters } from '../../types/laboresTypes';
import Modal from '../../components/Common/Modal';
import LaboresTable from '../../components/Labores/LaboresTable';
import LaborForm from '../../components/Labores/LaboresForm';
import DetallesLaborModal from '../../components/Labores/DetallesLabores';
import EstadisticasLaboresModal from '../../components/Labores/Estadisticas';
import AsignarRecursosModal from '../../components/Labores/AsignarRecursos';
import CompletarLaborModal from '../../components/Labores/CompletarLabores';
import { useAuth } from '../../hooks/useAuth';
import exportService from '../../services/exportService';

const GestionLaboresPage: React.FC = () => {
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

    // Datos para formularios
    const [lotes, setLotes] = useState<any[]>([]);
    const [trabajadores, setTrabajadores] = useState<any[]>([]);
    const [recomendaciones, setRecomendaciones] = useState<any[]>([]);
    const [tiposLabor, setTiposLabor] = useState<any[]>([]);

    const [filtros, setFiltros] = useState<LaborFilters>({});
    // Estados específicos para exportación
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');

    // Handler para exportar labores
    const handleExportLabores = async () => {
        if (exporting) return;
        setExporting(true);
        setExportMessage('Exportando labores...');

        try {
            const result = await exportService.exportarLabores();
            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error) {
            console.error('❌ Error exportando labores:', error);
            setExportMessage('Error al exportar.');
            setTimeout(() => setExportMessage(''), 5000);
        } finally {
            setExporting(false);
        }
    };
    useEffect(() => {
        cargarDatos();
    }, [filtros]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);

            // Cargar labores
            const data = await laborService.obtenerLabores(filtros);
            const laboresData = Array.isArray(data) ? data : (data?.items || data || []);
            setLabores(laboresData);

            // Cargar lotes si no se han cargado
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

                    console.log('Lotes cargados con nombres de granja:', lotesArray);
                    setLotes(lotesArray);
                } catch (loteError) {
                    console.error('Error cargando lotes:', loteError);
                    toast.error('Error al cargar los lotes');
                    setLotes([]);
                }
            }

            if (trabajadores.length === 0) {
                try {
                    const usuarios = await usuarioService.obtenerUsuarios();
                    const usuariosArray = Array.isArray(usuarios) ? usuarios : (usuarios?.items || []);
                    // Trabajadores son rol_id = 3 (estudiantes/trabajadores)
                    const trabajadoresData = usuariosArray.filter((u: any) => u.rol_id === 3);
                    setTrabajadores(trabajadoresData);
                } catch (userError) {
                    console.error('Error cargando trabajadores:', userError);
                    setTrabajadores([]);
                }
            }

            if (tiposLabor.length === 0) {
                try {
                    const tiposData = await tipoLaborService.obtenerTiposLabor();
                    const tiposArray = Array.isArray(tiposData) ? tiposData : (tiposData?.items || []);
                    setTiposLabor(tiposArray);
                } catch (tipoError) {
                    console.error('Error cargando tipos de labor:', tipoError);
                    setTiposLabor([]);
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

    const handleCompletarLabor = async (comentario: string = '') => {
        if (!laborACompletar) return;

        try {
            const completada = await laborService.completarLabor(laborACompletar.id, comentario);
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

    const openCompletarModal = (labor: Labor) => {
        setLaborACompletar(labor);
        setShowCompletarModal(true);
    };

    // FILTRO POR ROL
    const laboresFiltradas = Array.isArray(labores) ? labores.filter(l => {
        if (!user) return false;
        if (user.rol_id === 1) return true; // Admin ve todo
        if (user.rol_id === 2 || user?.rol_id === 5) return true; // Docentes ven todo
        if (user.rol_id === 3) return l.trabajador_id === user.id; // Trabajador ve las suyas
        return true;
    }) : [];

    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Labores</h1>
                    <div className="flex items-center space-x-3 m-2">
                        {exportMessage && (
                            <span className={`text-sm px-3 py-1 rounded ${exportMessage.includes('Error')
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-green-600'
                                }`}>
                                {exportMessage}
                            </span>
                        )}

                        <button
                            onClick={handleExportLabores}
                            disabled={exporting}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
                        >
                            <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                            <span>{exporting ? 'Exportando...' : 'Exportar a Excel'}</span>
                        </button>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowEstadisticasModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
                        >
                            <i className="fas fa-chart-bar mr-2"></i>
                            Estadísticas
                        </button>

                        {(user?.rol_id === 1 || user?.rol_id === 2 || user?.rol_id === 5) && (
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

                {/* Filtros - Actualizado para mostrar nombres de granja */}
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
                            {Array.isArray(trabajadores) && trabajadores.map(trab => (
                                <option key={trab.id} value={trab.id}>
                                    {trab.nombre}
                                </option>
                            ))}
                        </select>

                        {/* Filtro de lotes - ahora los lotes ya tienen granja_nombre */}
                        <select
                            className="border rounded p-2"
                            value={filtros.lote_id || ''}
                            onChange={(e) => setFiltros({ ...filtros, lote_id: e.target.value ? parseInt(e.target.value) : undefined })}
                        >
                            <option value="">Todos los lotes</option>
                            {Array.isArray(lotes) && lotes.map(lote => (
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
                </div>
            </div>

            {/* TABLA */}
            {loading ? (
                <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                    <p className="mt-2 text-gray-600">Cargando labores...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                    <p>Error: {error}</p>
                    <button
                        onClick={cargarDatos}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                    >
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

            {/* MODALES */}

            {/* MODAL CREAR - NO pasamos granjasMap, los lotes ya tienen granja_nombre */}
            <Modal isOpen={showCrearModal} onClose={() => setShowCrearModal(false)} width="max-w-2xl">
                <LaborForm
                    onSubmit={handleCrearLabor}
                    onCancel={() => setShowCrearModal(false)}
                    tiposLabor={tiposLabor}
                    trabajadores={trabajadores}
                    lotes={lotes}
                    recomendaciones={recomendaciones}
                    currentUser={user}
                />
            </Modal>

            {/* MODAL EDITAR - NO pasamos granjasMap */}
            <Modal isOpen={showEditarModal} onClose={() => setShowEditarModal(false)} width="max-w-2xl">
                {selectedLabor && (
                    <LaborForm
                        labor={selectedLabor}
                        onSubmit={(data) => handleActualizarLabor(selectedLabor.id, data)}
                        onCancel={() => setShowEditarModal(false)}
                        tiposLabor={tiposLabor}
                        trabajadores={trabajadores}
                        lotes={lotes}
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
                />
            )}
        </div>
    );
};

export default GestionLaboresPage;