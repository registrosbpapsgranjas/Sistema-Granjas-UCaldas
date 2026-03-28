import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import diagnosticoService from '../../services/diagnosticoService';
import usuarioService from '../../services/usuarioService';
import loteService from '../../services/loteService';
import programaService from '../../services/programaService'; // 👈 NUEVO
import type { DiagnosticoItem, DiagnosticoFiltros } from '../../types/diagnosticoTypes';
import Modal from '../Common/Modal';
import DiagnosticosTable from './DiagnosticosTable';
import DiagnosticoForm from './DiagnosticoForm';
import AsignarDocenteModal from './AsignarDocenteModal';
import AgregarEvidenciaModal from './AgregarEvidenciaModal';
import DetallesDiagnosticoModal from './DetallesDiagnosticoModal';
import { useAuth } from '../../hooks/useAuth';
import cultivoService from '../../services/cultivoService';
import granjaService from '../../services/granjaService';
import exportService from '../../services/exportService';

const GestionDiagnosticos: React.FC = () => {
    const { user } = useAuth();
    const [diagnosticos, setDiagnosticos] = useState<DiagnosticoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para modales
    const [showCrearModal, setShowCrearModal] = useState(false);
    const [showEditarModal, setShowEditarModal] = useState(false);
    const [showAsignarDocenteModal, setShowAsignarDocenteModal] = useState(false);
    const [showEvidenciaModal, setShowEvidenciaModal] = useState(false);
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [showCerrarModal, setShowCerrarModal] = useState(false);

    const [selectedDiagnostico, setSelectedDiagnostico] = useState<DiagnosticoItem | null>(null);

    const [lotes, setLotes] = useState<any[]>([]);
    const [programas, setProgramas] = useState<any[]>([]); // 👈 NUEVO estado para programas
    const [docentes, setDocentes] = useState<any[]>([]);
    const [estudiantes, setEstudiantes] = useState<any[]>([]);
    const [tiposDiagnostico, setTiposDiagnostico] = useState<string[]>([]);

    const [filtros, setFiltros] = useState<DiagnosticoFiltros>({});
    const [estadisticas, setEstadisticas] = useState<any>(null);
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');

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

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Cargando datos de diagnósticos...');

            // Cargar diagnósticos
            const data = await diagnosticoService.obtenerDiagnosticos(filtros);
            console.log('✅ Response de diagnosticos:', data);
            const diagnosticosData = Array.isArray(data) ? data : (data?.items || data || []);
            setDiagnosticos(diagnosticosData);

            // 👇 Cargar programas
            try {
                const programasData = await programaService.obtenerProgramas();
                console.log('✅ Programas cargados:', programasData);
                const programasArray = Array.isArray(programasData) ? programasData : (programasData?.items || []);
                setProgramas(programasArray);
            } catch (programaError) {
                console.error('❌ Error cargando programas:', programaError);
                setProgramas([]);
            }

            // Cargar lotes (con sus granjas)
            try {
                const lotesData = await loteService.obtenerLotes();
                let lotesArray = Array.isArray(lotesData) ? lotesData : (lotesData?.items || []);

                // Enriquecer con nombres de granja
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
                console.log('✅ Lotes cargados con nombres de granja:', lotesArray);
                setLotes(lotesArray);
            } catch (loteError) {
                console.error('❌ Error cargando lotes:', loteError);
                setLotes([]);
            }

            // Cargar usuarios (docentes y estudiantes)
            try {
                const usuarios = await usuarioService.obtenerUsuarios();
                const usuariosArray = Array.isArray(usuarios) ? usuarios : (usuarios?.items || []);
                setDocentes(usuariosArray.filter((u: any) => u.rol_id === 2 || u.rol_id === 5));
                setEstudiantes(usuariosArray.filter((u: any) => u.rol_id === 4));
            } catch (userError) {
                console.error('❌ Error cargando usuarios:', userError);
                setDocentes([]);
                setEstudiantes([]);
            }

            // Cargar tipos de diagnóstico
            try {
                const tipos = await diagnosticoService.obtenerTiposDiagnostico();
                setTiposDiagnostico(Array.isArray(tipos) ? tipos : []);
            } catch (tipoError) {
                console.error('❌ Error cargando tipos:', tipoError);
                setTiposDiagnostico([]);
            }

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

    // Handlers CRUD
    const handleCrearDiagnostico = async (data: any) => {
        try {
            if (user?.rol_id === 4) data.estudiante_id = user.id;
            if ((user?.rol_id === 1 || user?.rol_id === 2 || user?.rol_id === 5) && !data.docente_id) {
                data.docente_id = user.id;
            }
            const nuevo = await diagnosticoService.crearDiagnostico(data, user);
            setDiagnosticos(prev => [...prev, nuevo]);
            toast.success('Diagnóstico creado exitosamente');
            setShowCrearModal(false);
            cargarEstadisticas();
        } catch (err: any) {
            toast.error(`Error al crear diagnóstico: ${err.message}`);
        }
    };

    const handleActualizarDiagnostico = async (id: number, data: any) => {
        try {
            const actualizado = await diagnosticoService.actualizarDiagnostico(id, data, user);
            setDiagnosticos(prev => prev.map(d => d.id === id ? actualizado : d));
            toast.success('Diagnóstico actualizado');
            setShowEditarModal(false);
        } catch (err: any) {
            toast.error(`Error al actualizar: ${err.message}`);
        }
    };

    const handleEliminarDiagnostico = async (id: number) => {
        if (!window.confirm("¿Eliminar este diagnóstico?")) return;
        try {
            await diagnosticoService.eliminarDiagnostico(id);
            setDiagnosticos(prev => prev.filter(d => d.id !== id));
            toast.success('Diagnóstico eliminado');
            cargarEstadisticas();
        } catch (err: any) {
            toast.error(`Error al eliminar: ${err.message}`);
        }
    };

    const handleAsignarDocente = async (diagnosticoId: number, docenteId: number) => {
        try {
            const actualizado = await diagnosticoService.asignarDocente(diagnosticoId, docenteId);
            setDiagnosticos(prev => prev.map(d => d.id === diagnosticoId ? actualizado : d));
            toast.success('Docente asignado');
            setShowAsignarDocenteModal(false);
        } catch (err: any) {
            toast.error(`Error: ${err.message}`);
        }
    };

    const handleCerrarDiagnostico = async (id: number) => {
        const observaciones = prompt("Observaciones de cierre (opcional):");
        try {
            const cerrado = await diagnosticoService.cerrarDiagnostico(id, observaciones || '');
            setDiagnosticos(prev => prev.map(d => d.id === id ? cerrado : d));
            toast.success('Diagnóstico cerrado');
            setShowCerrarModal(false);
            cargarEstadisticas();
        } catch (err: any) {
            toast.error(`Error: ${err.message}`);
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
            toast.error(`Error: ${err.message}`);
        }
    };

    // Open modals
    const openEditarModal = (diag: DiagnosticoItem) => { setSelectedDiagnostico(diag); setShowEditarModal(true); };
    const openAsignarDocenteModal = (diag: DiagnosticoItem) => { setSelectedDiagnostico(diag); setShowAsignarDocenteModal(true); };
    const openEvidenciaModal = (diag: DiagnosticoItem) => { setSelectedDiagnostico(diag); setShowEvidenciaModal(true); };
    const openDetallesModal = (diag: DiagnosticoItem) => { setSelectedDiagnostico(diag); setShowDetallesModal(true); };
    const openCerrarModal = (diag: DiagnosticoItem) => { setSelectedDiagnostico(diag); setShowCerrarModal(true); };

    // Filtro por rol
    const diagnosticosFiltrados = diagnosticos.filter(d => {
        if (!user) return false;
        if (user.rol_id === 1) return true;
        if (user.rol_id === 2 || user.rol_id === 5) return d.docente_id === user.id || d.estudiante_id === user.id;
        if (user.rol_id === 4) return d.estudiante_id === user.id;
        return false;
    });

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
                        <button
                            onClick={() => setShowCrearModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <i className="fas fa-plus"></i> Nuevo Diagnóstico
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h3 className="font-semibold mb-3">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select
                            className="border rounded p-2"
                            value={filtros.estado || ''}
                            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value || undefined })}
                        >
                            <option value="">Todos los estados</option>
                            <option value="abierto">Abierto</option>
                            <option value="en_revision">En Revisión</option>
                            <option value="cerrado">Cerrado</option>
                        </select>

                        <select
                            className="border rounded p-2"
                            value={filtros.tipo || ''}
                            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value || undefined })}
                        >
                            <option value="">Todos los tipos</option>
                            {tiposDiagnostico.map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                        </select>

                        <select
                            className="border rounded p-2"
                            value={filtros.lote_id || ''}
                            onChange={(e) => setFiltros({ ...filtros, lote_id: e.target.value ? parseInt(e.target.value) : undefined })}
                        >
                            <option value="">Todos los lotes</option>
                            {lotes.map(lote => (
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

            {loading ? (
                <div className="text-center py-8"><i className="fas fa-spinner fa-spin text-2xl"></i><p>Cargando...</p></div>
            ) : error ? (
                <div className="bg-red-50 p-4 rounded text-red-700"><p>{error}</p><button onClick={cargarDatos} className="mt-2 text-blue-600">Reintentar</button></div>
            ) : (
                <DiagnosticosTable
                    diagnosticos={diagnosticosFiltrados}
                    onEditar={openEditarModal}
                    onEliminar={handleEliminarDiagnostico}
                    onAsignarDocente={openAsignarDocenteModal}
                    onAgregarEvidencia={openEvidenciaModal}
                    onVerDetalles={openDetallesModal}
                    onCerrar={openCerrarModal}
                    currentUser={user}
                />
            )}

            {/* MODAL CREAR */}
            <Modal isOpen={showCrearModal} onClose={() => setShowCrearModal(false)} width="max-w-2xl">
                <DiagnosticoForm
                    onSubmit={handleCrearDiagnostico}
                    onCancel={() => setShowCrearModal(false)}
                    lotes={lotes}
                    programas={programas}  // 👈 PASAMOS PROGRAMAS
                    docentes={docentes}
                    estudiantes={estudiantes}
                    tipos={tiposDiagnostico}
                    estados={['abierto', 'en_revision', 'cerrado']}
                    condiciones_dia={['Soleado', 'Nublado', 'Lluvia', 'Ventoso', 'Nevado']}
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
                        programas={programas}  // 👈 PASAMOS PROGRAMAS
                        docentes={docentes}
                        estudiantes={estudiantes}
                        tipos={tiposDiagnostico}
                        condiciones_dia={['Soleado', 'Nublado', 'Lluvia', 'Ventoso', 'Nevado']}
                        currentUser={user}
                        esEdicion={true}
                    />
                )}
            </Modal>

            {/* MODAL ASIGNAR DOCENTE */}
            {showAsignarDocenteModal && selectedDiagnostico && (
                <AsignarDocenteModal
                    isOpen={showAsignarDocenteModal}
                    onClose={() => setShowAsignarDocenteModal(false)}
                    diagnostico={selectedDiagnostico}
                    docentes={docentes}
                    onSubmit={(docenteId) => handleAsignarDocente(selectedDiagnostico.id, docenteId)}
                />
            )}

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

            {/* MODAL CERRAR */}
            <Modal isOpen={showCerrarModal} onClose={() => setShowCerrarModal(false)}>
                {selectedDiagnostico && (
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4">Cerrar Diagnóstico</h2>
                        <p className="mb-6">¿Estás seguro de cerrar el diagnóstico "{selectedDiagnostico.tipo}"?</p>
                        <div className="flex justify-end gap-3">
                            <button className="px-4 py-2 border rounded" onClick={() => setShowCerrarModal(false)}>Cancelar</button>
                            <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => handleCerrarDiagnostico(selectedDiagnostico.id)}>Cerrar</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default GestionDiagnosticos;