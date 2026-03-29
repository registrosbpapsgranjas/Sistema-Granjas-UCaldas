import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import diagnosticoService from '../../services/diagnosticoService';
import loteService from '../../services/loteService';
import programaService from '../../services/programaService';
import monitoreoService from '../../services/monitoreoService';
import type { DiagnosticoItem, DiagnosticoFiltros } from '../../types/diagnosticoTypes';
import Modal from '../Common/Modal';
import DiagnosticosTable from './DiagnosticosTable';
import DiagnosticoForm from './DiagnosticosForm';
import AgregarEvidenciaModal from './AgregarEvidenciaModal';
import DetallesDiagnosticoModal from './DetallesDiagnosticoModal';
import { useAuth } from '../../hooks/useAuth';
import granjaService from '../../services/granjaService';
import exportService from '../../services/exportService';

const GestionDiagnosticos: React.FC = () => {
    const { user } = useAuth();

    const [diagnosticos,    setDiagnosticos]    = useState<DiagnosticoItem[]>([]);
    const [loading,         setLoading]         = useState(true);
    const [error,           setError]           = useState<string | null>(null);

    // Modales
    const [showCrearModal,    setShowCrearModal]    = useState(false);
    const [showEditarModal,   setShowEditarModal]   = useState(false);
    const [showEvidenciaModal,setShowEvidenciaModal]= useState(false);
    const [showDetallesModal, setShowDetallesModal] = useState(false);

    const [selectedDiagnostico, setSelectedDiagnostico] = useState<DiagnosticoItem | null>(null);

    // Datos de referencia
    const [lotes,     setLotes]     = useState<any[]>([]);
    const [programas, setProgramas] = useState<any[]>([]);
    const [monitoreos,setMonitoreos]= useState<any[]>([]);

    // Filtros — ahora usan los campos nuevos del backend
    const [filtros, setFiltros] = useState<DiagnosticoFiltros>({});
    const [estadisticas, setEstadisticas] = useState<any>(null);

    // Export
    const [exporting,      setExporting]      = useState(false);
    const [exportMessage,  setExportMessage]  = useState('');

    const handleExportDiagnosticos = async () => {
        if (exporting) return;
        setExporting(true);
        setExportMessage('Exportando diagnósticos...');
        try {
            const result = await exportService.exportarDiagnosticos();
            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error) {
            console.error('❌ Error exportando diagnósticos:', error);
            setExportMessage('Error al exportar.');
            setTimeout(() => setExportMessage(''), 5000);
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        cargarDatos();
        cargarEstadisticas();
    }, [filtros]);

    // ── Carga de datos ────────────────────────────────────────────────────────
    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);

            // Diagnósticos
            const data = await diagnosticoService.obtenerDiagnosticos(filtros);
            const diagnosticosData = Array.isArray(data) ? data : (data?.items || []);
            setDiagnosticos(diagnosticosData);

            // Programas
            try {
                const programasData = await programaService.obtenerProgramas();
                setProgramas(Array.isArray(programasData) ? programasData : (programasData?.items || []));
            } catch { setProgramas([]); }

            // Monitoreos
            try {
                const monitoreosData = await monitoreoService.obtenerMonitoreos();
                setMonitoreos(Array.isArray(monitoreosData) ? monitoreosData : (monitoreosData?.items || []));
            } catch { setMonitoreos([]); }

            // Lotes enriquecidos con nombre de granja
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

        } catch (err: any) {
            console.error('❌ Error en cargarDatos:', err);
            setError(err.message || 'Error al cargar diagnósticos');
            toast.error(`Error al cargar datos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const cargarEstadisticas = async () => {
        try {
            const stats = await diagnosticoService.obtenerEstadisticas();
            setEstadisticas(stats);
        } catch (err) {
            console.error('❌ Error cargando estadísticas:', err);
        }
    };

    // ── Handlers CRUD ─────────────────────────────────────────────────────────

    const handleCrearDiagnostico = async (data: any) => {
        try {
            // Aseguramos que usuario_id viene del usuario autenticado
            const payload = {
                ...data,
                usuario_id: user?.id,
            };
            const nuevo = await diagnosticoService.crearDiagnostico(payload);
            setDiagnosticos(prev => [nuevo, ...prev]);
            toast.success('Diagnóstico creado exitosamente');
            setShowCrearModal(false);
            cargarEstadisticas();
        } catch (err: any) {
            toast.error(`Error al crear diagnóstico: ${err.message}`);
        }
    };

    const handleActualizarDiagnostico = async (id: number, data: any) => {
        try {
            // Solo se pueden actualizar tipo_diagnostico, condiciones_dia y formulario
            const payload = {
                tipo_diagnostico: data.tipo_diagnostico,
                condiciones_dia:  data.condiciones_dia,
                formulario:       data.formulario,
            };
            const actualizado = await diagnosticoService.actualizarDiagnostico(id, payload);
            setDiagnosticos(prev => prev.map(d => d.id === id ? actualizado : d));
            toast.success('Diagnóstico actualizado');
            setShowEditarModal(false);
        } catch (err: any) {
            toast.error(`Error al actualizar: ${err.message}`);
        }
    };

    const handleEliminarDiagnostico = async (id: number) => {
        if (!window.confirm('¿Eliminar este diagnóstico?')) return;
        try {
            await diagnosticoService.eliminarDiagnostico(id);
            setDiagnosticos(prev => prev.filter(d => d.id !== id));
            toast.success('Diagnóstico eliminado');
            cargarEstadisticas();
        } catch (err: any) {
            toast.error(`Error al eliminar: ${err.message}`);
        }
    };

    const handleAgregarEvidencia = async (file: File, descripcion: string, tipo: string) => {
        if (!selectedDiagnostico) return;
        try {
            await diagnosticoService.agregarEvidencia(selectedDiagnostico.id, file, descripcion, tipo, user);
            toast.success('Evidencia agregada');
            setShowEvidenciaModal(false);
            const actualizado = await diagnosticoService.obtenerDiagnosticoPorId(selectedDiagnostico.id);
            setDiagnosticos(prev => prev.map(d => d.id === selectedDiagnostico.id ? actualizado : d));
        } catch (err: any) {
            toast.error(`Error al agregar evidencia: ${err.message}`);
        }
    };

    // ── Abrir modales ─────────────────────────────────────────────────────────
    const openEditarModal   = (diag: DiagnosticoItem) => { setSelectedDiagnostico(diag); setShowEditarModal(true); };
    const openEvidenciaModal= (diag: DiagnosticoItem) => { setSelectedDiagnostico(diag); setShowEvidenciaModal(true); };
    const openDetallesModal = (diag: DiagnosticoItem) => { setSelectedDiagnostico(diag); setShowDetallesModal(true); };

    // ── Filtro local por rol ──────────────────────────────────────────────────
    const diagnosticosFiltrados = diagnosticos.filter(d => {
        if (!user) return false;
        if (user.rol_id === 1) return true;                          // admin: todos
        if (user.rol_id === 2 || user.rol_id === 5) return true;     // docente/asesor: todos
        if (user.rol_id === 4) return (d as any).usuario_id === user.id; // estudiante: solo los suyos
        return false;
    });

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Diagnósticos</h1>
                    <div className="flex gap-2">
                        {user?.rol_id === 1 && (
                            <button
                                onClick={handleExportDiagnosticos}
                                disabled={exporting}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                                <span>{exporting ? 'Exportando...' : 'Exportar a Excel'}</span>
                            </button>
                        )}
                        {exportMessage && (
                            <span className="text-sm text-gray-600 self-center">{exportMessage}</span>
                        )}
                        <button
                            onClick={() => setShowCrearModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <i className="fas fa-plus"></i> Nuevo Diagnóstico
                        </button>
                    </div>
                </div>

                {/* Filtros — alineados a los nuevos campos del backend */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h3 className="font-semibold mb-3">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                        <select
                            className="border rounded p-2"
                            value={(filtros as any).tipo_diagnostico || ''}
                            onChange={(e) => setFiltros({ ...filtros, tipo_diagnostico: e.target.value || undefined } as any)}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="censo_poblacional">Censo Poblacional</option>
                            <option value="monitoreo_fenologico">Monitoreo Fenológico</option>
                            <option value="artropodos">Artrópodos</option>
                            <option value="enfermedades">Enfermedades</option>
                            <option value="arvenses">Arvenses</option>
                            <option value="controladores_biologicos">Controladores Biológicos</option>
                            <option value="polinizadores">Polinizadores</option>
                        </select>

                        <select
                            className="border rounded p-2"
                            value={(filtros as any).programa_id || ''}
                            onChange={(e) => setFiltros({ ...filtros, programa_id: e.target.value ? parseInt(e.target.value) : undefined } as any)}
                        >
                            <option value="">Todos los programas</option>
                            {programas.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>

                        <select
                            className="border rounded p-2"
                            value={(filtros as any).lote_id || ''}
                            onChange={(e) => setFiltros({ ...filtros, lote_id: e.target.value ? parseInt(e.target.value) : undefined } as any)}
                        >
                            <option value="">Todos los lotes</option>
                            {lotes.map(lote => (
                                <option key={lote.id} value={lote.id}>
                                    {lote.nombre} {lote.granja_nombre ? `(${lote.granja_nombre})` : ''}
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

            {/* Tabla */}
            {loading ? (
                <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl"></i>
                    <p className="mt-2 text-gray-600">Cargando...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 p-4 rounded text-red-700">
                    <p>{error}</p>
                    <button onClick={cargarDatos} className="mt-2 text-blue-600 underline">Reintentar</button>
                </div>
            ) : (
                <DiagnosticosTable
                    diagnosticos={diagnosticosFiltrados}
                    onEditar={openEditarModal}
                    onEliminar={handleEliminarDiagnostico}
                    onAgregarEvidencia={openEvidenciaModal}
                    onVerDetalles={openDetallesModal}
                    currentUser={user}
                />
            )}

            {/* MODAL CREAR */}
            <Modal isOpen={showCrearModal} onClose={() => setShowCrearModal(false)} width="max-w-2xl">
                <DiagnosticoForm
                    onSubmit={handleCrearDiagnostico}
                    onCancel={() => setShowCrearModal(false)}
                    lotes={lotes}
                    programas={programas}
                    monitoreos={monitoreos}
                    condiciones_dia={['Soleado', 'Nublado', 'Lluvia']}
                    currentUser={user}
                />
            </Modal>

            {/* MODAL EDITAR */}
            <Modal isOpen={showEditarModal} onClose={() => setShowEditarModal(false)} width="max-w-2xl">
                {selectedDiagnostico && (
                    <DiagnosticoForm
                        diagnostico={selectedDiagnostico}
                        onSubmit={(data) => handleActualizarDiagnostico(selectedDiagnostico.id, data)}
                        onCancel={() => setShowEditarModal(false)}
                        lotes={lotes}
                        programas={programas}
                        monitoreos={monitoreos}
                        condiciones_dia={['Soleado', 'Nublado', 'Lluvia']}
                        currentUser={user}
                        esEdicion
                    />
                )}
            </Modal>

            {/* MODAL EVIDENCIA */}
            {showEvidenciaModal && selectedDiagnostico && (
                <AgregarEvidenciaModal
                    isOpen={showEvidenciaModal}
                    onClose={() => setShowEvidenciaModal(false)}
                    diagnostico={selectedDiagnostico}
                    onSubmit={handleAgregarEvidencia}
                />
            )}

            {/* MODAL DETALLES */}
            {showDetallesModal && selectedDiagnostico && (
                <DetallesDiagnosticoModal
                    isOpen={showDetallesModal}
                    onClose={() => setShowDetallesModal(false)}
                    diagnostico={selectedDiagnostico}
                />
            )}
        </div>
    );
};

export default GestionDiagnosticos;