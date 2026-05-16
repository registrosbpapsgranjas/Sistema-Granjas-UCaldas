// src/components/Recomendaciones/GestionRecomendaciones.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import recomendacionService from '../../services/recomendacionService';
import usuarioService from '../../services/usuarioService';
import loteService from '../../services/loteService';
import programaService from '../../services/programaService';
import { diagnosticoService } from '../../services/diagnosticoService';
import { laborService } from '../../services/laboresService';
import type { Recomendacion, RecomendacionFilters } from '../../types/recomendacionTypes';
import type { DiagnosticoItem } from '../../types/diagnosticoTypes';
import Modal from '../Common/Modal';
import RecomendacionesTable from './RecomendacionesTable';
import RecomendacionFormSelector from './RecomendacionFormSelector';
import DetallesRecomendacionModal from './DetallesRecomendaciones';
import EstadisticasModal from './Estadisticas';
import AprobarRecomendacionModal from './AprobarRecomendacion';
import { useAuth } from '../../hooks/useAuth';
import granjaService from '../../services/granjaService';
import exportService from '../../services/exportService';
import GestionTiposRecomendaciones from './GestionTiposRecomendaciones';

type MainTab = 'recomendaciones' | 'pendientes' | 'tipos';

const GestionRecomendaciones: React.FC = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // Main tab
    const [tabActivo, setTabActivo] = useState<MainTab>('recomendaciones');

    const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pending diagnoses tab state
    const [pendientes, setPendientes] = useState<DiagnosticoItem[]>([]);
    const [loadingPendientes, setLoadingPendientes] = useState(false);

    // Modal states
    const [showCrearModal, setShowCrearModal] = useState(false);
    const [showEditarModal, setShowEditarModal] = useState(false);
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
    const [showAprobarModal, setShowAprobarModal] = useState(false);

    const [selectedRecomendacion, setSelectedRecomendacion] = useState<Recomendacion | null>(null);
    const [recomendacionAAprobarId, setRecomendacionAAprobarId] = useState<number | null>(null);
    const [recomendacionAAprobarTitulo, setRecomendacionAAprobarTitulo] = useState<string>('');

    const [lotes, setLotes] = useState<any[]>([]);
    const [docentes, setDocentes] = useState<any[]>([]);
    const [programas, setProgramas] = useState<any[]>([]);
    const [filtros, setFiltros] = useState<RecomendacionFilters>({});
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');

    const rolesPermitidos = [1, 2, 5, 6];

    const [urlDiagnosticoId, setUrlDiagnosticoId] = useState<number | undefined>(undefined);
    const [urlLoteId, setUrlLoteId] = useState<number | undefined>(undefined);

    // Load programs + check URL params on mount
    useEffect(() => {
        const cargarProgramas = async () => {
            try {
                const data = await programaService.obtenerProgramas();
                setProgramas(Array.isArray(data) ? data : ((data as any)?.items || []));
            } catch (err) {
                console.error('Error cargando programas:', err);
            }
        };
        cargarProgramas();

        const diagId = searchParams.get('diagnostico_id');
        const loteId = searchParams.get('lote_id');
        if (diagId) {
            setUrlDiagnosticoId(parseInt(diagId));
            setUrlLoteId(loteId ? parseInt(loteId) : undefined);
            setShowCrearModal(true);
            setSearchParams({}, { replace: true });
        }
    }, []);

    // Load pending diagnoses when tab activates
    const cargarPendientes = useCallback(async () => {
        setLoadingPendientes(true);
        try {
            const data = await diagnosticoService.obtenerDiagnosticos({ estado_revision: 'pendiente_revision' } as any);
            const items = Array.isArray(data) ? data : ((data as any)?.items || []);
            setPendientes(items);
        } catch (e) {
            toast.error('Error al cargar diagnósticos pendientes');
        } finally {
            setLoadingPendientes(false);
        }
    }, []);

    useEffect(() => {
        if (tabActivo === 'pendientes') {
            cargarPendientes();
        }
    }, [tabActivo, cargarPendientes]);

    const handleExportRecomendaciones = async () => {
        if (exporting) return;
        setExporting(true);
        setExportMessage('Exportando recomendaciones...');
        try {
            const result = await exportService.exportarRecomendaciones();
            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error) {
            console.error('Error exportando:', error);
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
            const data = await recomendacionService.obtenerRecomendaciones(filtros);
            setRecomendaciones(Array.isArray(data) ? data : (data?.items || data || []));

            if (lotes.length === 0) {
                try {
                    const lotesData = await loteService.obtenerLotes();
                    let lotesArray = Array.isArray(lotesData) ? lotesData : (lotesData?.items || []);
                    lotesArray = await Promise.all(
                        lotesArray.map(async (lote: any) => {
                            try {
                                if (lote.granja_id) {
                                    const granja = await granjaService.obtenerGranjaPorId(lote.granja_id);
                                    return { ...lote, granja_nombre: granja.nombre || 'Sin nombre' };
                                }
                                return { ...lote, granja_nombre: 'Sin granja' };
                            } catch {
                                return { ...lote, granja_nombre: 'Error al cargar' };
                            }
                        })
                    );
                    setLotes(lotesArray);
                } catch { setLotes([]); }
            }

            if (docentes.length === 0) {
                try {
                    const usuarios = await usuarioService.obtenerUsuarios();
                    const arr = Array.isArray(usuarios) ? usuarios : (usuarios?.items || []);
                    setDocentes(arr.filter((u: any) => u.rol_id === 2 || u.rol_id === 5));
                } catch { setDocentes([]); }
            }
        } catch (err: any) {
            setError(err.message || 'Error al cargar recomendaciones');
            toast.error(`Error al cargar datos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // CRUD handlers
    const handleCrearRecomendacion = async (data: any) => {
        try {
            const laboresACrear: any[] = data.labores_a_crear || [];
            const { labores_a_crear: _, ...submitData } = data;

            const nueva = await recomendacionService.crearRecomendacion(submitData, user);
            setRecomendaciones(prev => [...prev, nueva]);
            toast.success('Recomendación creada exitosamente');
            setShowCrearModal(false);
            setUrlDiagnosticoId(undefined);
            setUrlLoteId(undefined);

            if (laboresACrear.length > 0) {
                let creadas = 0;
                await Promise.allSettled(
                    laboresACrear.map(async (labor: any) => {
                        try {
                            await laborService.crearLabor({
                                tipo_labor_id: labor.tipo_labor_id,
                                recomendacion_id: nueva.id,
                                lote_id: nueva.lote_id,
                                trabajador_id: labor.trabajador_id,
                                comentario: labor.comentario || '',
                                productos: (labor.productos || []).filter((p: any) => p.inventario_item_id).map((p: any) => ({
                                    inventario_item_id: p.inventario_item_id,
                                    cantidad_usada: p.cantidad_sugerida ?? null,
                                    unidad_dosis: p.unidad_dosis ?? null,
                                })),
                            } as any, user);
                            creadas++;
                        } catch (e: any) {
                            console.error('Error creando labor:', e);
                        }
                    })
                );
                if (creadas > 0) toast.success(`${creadas} labor(es) creada(s) correctamente`);
                if (creadas < laboresACrear.length) toast.error(`${laboresACrear.length - creadas} labor(es) no pudieron crearse`);
            }

            if (tabActivo === 'pendientes') cargarPendientes();
        } catch (err: any) {
            toast.error(`Error al crear recomendación: ${err.message}`);
        }
    };

    const handleActualizarRecomendacion = async (id: number, data: any) => {
        try {
            const actualizado = await recomendacionService.actualizarRecomendacion(id, data, user);
            setRecomendaciones(prev => prev.map(r => r.id === id ? actualizado : r));
            toast.success(`Recomendación #${id} actualizada`);
            setShowEditarModal(false);
        } catch (err: any) {
            toast.error(`Error al actualizar: ${err.message || 'Error desconocido'}`);
        }
    };

    const handleEliminarRecomendacion = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta recomendación?')) return;
        try {
            await recomendacionService.eliminarRecomendacion(id);
            setRecomendaciones(prev => prev.filter(r => r.id !== id));
            toast.success('Recomendación eliminada');
        } catch (err: any) {
            toast.error(`Error al eliminar: ${err.message}`);
        }
    };

    const handleAprobarRecomendacion = async (observaciones: string = '') => {
        if (!recomendacionAAprobarId) return;
        try {
            const aprobada = await recomendacionService.aprobarRecomendacion(recomendacionAAprobarId, observaciones);
            setRecomendaciones(prev => prev.map(r => r.id === recomendacionAAprobarId ? aprobada : r));
            toast.success('Recomendación aprobada');
            setShowAprobarModal(false);
            setRecomendacionAAprobarId(null);
            setRecomendacionAAprobarTitulo('');
        } catch (err: any) {
            toast.error(`Error al aprobar: ${err.message}`);
        }
    };

    const openEditarModal = (r: Recomendacion) => { setSelectedRecomendacion(r); setShowEditarModal(true); };
    const openDetallesModal = (r: Recomendacion) => { setSelectedRecomendacion(r); setShowDetallesModal(true); };
    const openAprobarModal = (r: Recomendacion) => {
        setRecomendacionAAprobarId(r.id);
        setRecomendacionAAprobarTitulo(r.titulo || `Recomendación #${r.id}`);
        setShowAprobarModal(true);
    };

    const openCrearDesdeDiagnostico = (diag: DiagnosticoItem) => {
        setUrlDiagnosticoId(diag.id);
        setUrlLoteId(diag.lote_id);
        setShowCrearModal(true);
    };

    const closeCrearModal = () => {
        setShowCrearModal(false);
        setUrlDiagnosticoId(undefined);
        setUrlLoteId(undefined);
    };

    const recomendacionesFiltradas = Array.isArray(recomendaciones) ? recomendaciones.filter(r => {
        if (!user) return false;
        if (user.rol_id === 1) return true;
        if (user.rol_id === 2 || user.rol_id === 5) return r.docente_id === user.id;
        return true;
    }) : [];

    const esPermitido = user && rolesPermitidos.includes(user.rol_id);

    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Recomendaciones</h1>
                    <div className="flex items-center gap-3">
                        {exportMessage && (
                            <span className={`text-sm px-3 py-1 rounded ${exportMessage.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {exportMessage}
                            </span>
                        )}
                        {user?.rol_id === 1 && (
                            <button onClick={handleExportRecomendaciones} disabled={exporting}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">
                                <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                                {exporting ? 'Exportando...' : 'Exportar a Excel'}
                            </button>
                        )}
                        <button onClick={() => setShowEstadisticasModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                            <i className="fas fa-chart-bar"></i> Estadísticas
                        </button>
                        {esPermitido && tabActivo === 'recomendaciones' && (
                            <button onClick={() => setShowCrearModal(true)}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                <i className="fas fa-plus"></i> Nueva Recomendación
                            </button>
                        )}
                    </div>
                </div>

                {/* TABS */}
                <div className="flex border-b border-gray-200">
                    <button onClick={() => setTabActivo('recomendaciones')}
                        className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${tabActivo === 'recomendaciones' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <i className="fas fa-clipboard-list mr-2"></i>Recomendaciones
                    </button>
                    {esPermitido && (
                        <button onClick={() => setTabActivo('pendientes')}
                            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-2 ${tabActivo === 'pendientes' ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            <i className="fas fa-clock"></i>
                            Diagnósticos Pendientes
                            {pendientes.length > 0 && (
                                <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                                    {pendientes.length}
                                </span>
                            )}
                        </button>
                    )}
                    {esPermitido && (
                        <button onClick={() => setTabActivo('tipos')}
                            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${tabActivo === 'tipos' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            <i className="fas fa-bookmark mr-2"></i>Tipos de Recomendación
                        </button>
                    )}
                </div>
            </div>

            {/* TAB: Recomendaciones */}
            {tabActivo === 'recomendaciones' && (
                <>
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <h3 className="font-semibold mb-3 text-sm text-gray-700">Filtros</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <select className="border rounded p-2 text-sm" value={filtros.estado || ''}
                                onChange={e => setFiltros({ ...filtros, estado: e.target.value || undefined })}>
                                <option value="">Todos los estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="aprobada">Aprobada</option>
                                <option value="rechazada">Rechazada</option>
                                <option value="en_ejecucion">En Ejecución</option>
                                <option value="completada">Completada</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                            <select className="border rounded p-2 text-sm" value={filtros.lote_id || ''}
                                onChange={e => setFiltros({ ...filtros, lote_id: e.target.value ? parseInt(e.target.value) : undefined })}>
                                <option value="">Todos los lotes</option>
                                {lotes.map(lote => (
                                    <option key={lote.id} value={lote.id}>{lote.nombre} ({lote.granja_nombre || 'Sin granja'})</option>
                                ))}
                            </select>
                            <button onClick={() => setFiltros({})} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm">
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <i className="fas fa-spinner fa-spin text-2xl text-orange-500"></i>
                            <p className="mt-2 text-gray-600">Cargando recomendaciones...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                            <p>Error: {error}</p>
                            <button onClick={cargarDatos} className="mt-2 text-blue-600 hover:text-blue-800 underline">Reintentar</button>
                        </div>
                    ) : (
                        <RecomendacionesTable
                            recomendaciones={recomendacionesFiltradas}
                            onEditar={openEditarModal}
                            onEliminar={handleEliminarRecomendacion}
                            onAprobar={openAprobarModal}
                            onVerDetalles={openDetallesModal}
                            currentUser={user}
                        />
                    )}
                </>
            )}

            {/* TAB: Diagnósticos Pendientes */}
            {tabActivo === 'pendientes' && (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Diagnósticos pendientes de revisión</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Diagnósticos sin recomendación asignada aún. Haz clic en "Crear Rec." para revisarlos.</p>
                        </div>
                        <button onClick={cargarPendientes} disabled={loadingPendientes}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
                            <i className={`fas fa-sync-alt ${loadingPendientes ? 'fa-spin' : ''}`}></i>
                            Actualizar
                        </button>
                    </div>

                    {loadingPendientes ? (
                        <div className="flex items-center justify-center py-12 gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                            <span className="text-gray-500 text-sm">Cargando diagnósticos pendientes...</span>
                        </div>
                    ) : pendientes.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fas fa-check-circle text-4xl text-green-400 block mb-3"></i>
                            <p className="text-gray-700 font-medium">¡Todo al día!</p>
                            <p className="text-gray-400 text-sm mt-1">No hay diagnósticos pendientes de revisión.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-amber-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo / Monitoreo</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Programa</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Lote / Granja</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pendientes.map(diag => (
                                        <tr key={diag.id} className="hover:bg-amber-50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-mono text-gray-500">#{diag.id}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium text-gray-900">{(diag as any).tipo_diagnostico?.replace(/_/g, ' ') || diag.tipo?.replace(/_/g, ' ') || '—'}</div>
                                                <div className="text-xs text-gray-500">{(diag as any).tipo_monitoreo_nombre || ''}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{(diag as any).programa_nombre || '—'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium">{(diag as any).lote_nombre || `Lote ${diag.lote_id}`}</div>
                                                <div className="text-xs text-gray-500">{(diag as any).granja_nombre || ''}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{(diag as any).usuario_nombre || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(diag.fecha_creacion).toLocaleDateString('es-CO')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => openCrearDesdeDiagnostico(diag)}
                                                    className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                                    <i className="fas fa-plus-circle"></i>
                                                    Crear Rec.
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: Tipos de Recomendación */}
            {tabActivo === 'tipos' && (
                <GestionTiposRecomendaciones />
            )}

            {/* MODAL CREAR */}
            <Modal isOpen={showCrearModal} onClose={closeCrearModal} width="max-w-4xl">
                <RecomendacionFormSelector
                    onSubmit={handleCrearRecomendacion}
                    onCancel={closeCrearModal}
                    lotes={lotes}
                    docentes={docentes}
                    currentUser={user}
                    programas={programas}
                    esEdicion={false}
                    diagnosticoIdInicial={urlDiagnosticoId}
                    loteIdInicial={urlLoteId}
                />
            </Modal>

            {/* MODAL EDITAR */}
            <Modal isOpen={showEditarModal} onClose={() => setShowEditarModal(false)} width="max-w-4xl">
                {selectedRecomendacion && (
                    <RecomendacionFormSelector
                        recomendacion={selectedRecomendacion}
                        onSubmit={(data) => handleActualizarRecomendacion(selectedRecomendacion.id, data)}
                        onCancel={() => setShowEditarModal(false)}
                        lotes={lotes}
                        docentes={docentes}
                        currentUser={user}
                        programas={programas}
                        esEdicion={true}
                    />
                )}
            </Modal>

            {/* MODAL DETALLES */}
            {selectedRecomendacion && (
                <DetallesRecomendacionModal
                    isOpen={showDetallesModal}
                    onClose={() => { setShowDetallesModal(false); setSelectedRecomendacion(null); }}
                    recomendacion={selectedRecomendacion}
                />
            )}

            {/* MODAL ESTADÍSTICAS */}
            <EstadisticasModal isOpen={showEstadisticasModal} onClose={() => setShowEstadisticasModal(false)} />

            {/* MODAL APROBAR */}
            {recomendacionAAprobarId && (
                <AprobarRecomendacionModal
                    isOpen={showAprobarModal}
                    onClose={() => { setShowAprobarModal(false); setRecomendacionAAprobarId(null); setRecomendacionAAprobarTitulo(''); }}
                    onAprobar={handleAprobarRecomendacion}
                    tituloRecomendacion={recomendacionAAprobarTitulo}
                />
            )}
        </div>
    );
};

export default GestionRecomendaciones;