import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
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
import GestionTiposDiagnostico from './GestionTiposDiagnostico';
import { useAuth } from '../../hooks/useAuth';
import granjaService from '../../services/granjaService';
import exportService from '../../services/exportService';

const GestionDiagnosticos: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showEvidenciaModal, setShowEvidenciaModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);

  const [selectedDiagnostico, setSelectedDiagnostico] = useState<DiagnosticoItem | null>(null);

  const [lotes, setLotes] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [monitoreos, setMonitoreos] = useState<any[]>([]);

  const [filtros, setFiltros] = useState<DiagnosticoFiltros>({});
  const [estadisticas, setEstadisticas] = useState<any>(null);

  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Tabs
  const [tabActivo, setTabActivo] = useState<'diagnosticos' | 'tipos'>('diagnosticos');
  const [programaSeleccionadoTipos, setProgramaSeleccionadoTipos] = useState<number | null>(null);

  const esAdminODocente = user && (user.rol_id === 1 || user.rol_id === 2 || user.rol_id === 5);

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

      const data = await diagnosticoService.obtenerDiagnosticos(filtros);
      const diagnosticosData = Array.isArray(data) ? data : (data?.items || []);
      setDiagnosticos(diagnosticosData);

      try {
        const programasData = await programaService.obtenerProgramas();
        const lista = Array.isArray(programasData) ? programasData : (programasData?.items || []);
        setProgramas(lista);
        if (lista.length > 0 && !programaSeleccionadoTipos) setProgramaSeleccionadoTipos(lista[0].id);
      } catch { setProgramas([]); }

      try {
        const monitoreosData = await monitoreoService.obtenerMonitoreos();
        setMonitoreos(Array.isArray(monitoreosData) ? monitoreosData : (monitoreosData?.items || []));
      } catch { setMonitoreos([]); }

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

  const handleCrearDiagnostico = async (formData: FormData) => {
    try {
      if (!user?.id) throw new Error('Usuario no autenticado');
      formData.append('usuario_id', String(user.id));
      const nuevo = await diagnosticoService.crearDiagnostico(formData);
      setDiagnosticos(prev => [nuevo, ...prev]);
      toast.success('Diagnóstico creado exitosamente');
      setShowCrearModal(false);
      cargarEstadisticas();
    } catch (err: any) {
      toast.error(`Error al crear diagnóstico: ${err.message}`);
    }
  };

  const handleActualizarDiagnostico = async (id: number, formData: FormData) => {
    try {
      const actualizado = await diagnosticoService.actualizarDiagnostico(id, formData);
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
      if (diagnosticoService.agregarEvidencia) {
        await diagnosticoService.agregarEvidencia(selectedDiagnostico.id, file, descripcion, tipo, user);
      }
      toast.success('Evidencia agregada');
      setShowEvidenciaModal(false);
      const actualizado = await diagnosticoService.obtenerDiagnosticoPorId(selectedDiagnostico.id);
      setDiagnosticos(prev => prev.map(d => d.id === selectedDiagnostico.id ? actualizado : d));
    } catch (err: any) {
      toast.error(`Error al agregar evidencia: ${err.message}`);
    }
  };

  const openEditarModal = (diag: DiagnosticoItem) => { setSelectedDiagnostico(diag); setShowEditarModal(true); };
  const openEvidenciaModal = (diag: DiagnosticoItem) => { setSelectedDiagnostico(diag); setShowEvidenciaModal(true); };
  const openDetallesModal = (diag: DiagnosticoItem) => { setSelectedDiagnostico(diag); setShowDetallesModal(true); };

  const crearRecomendacionDesdeDiagnostico = (diag: DiagnosticoItem) => {
    const params = new URLSearchParams({
      diagnostico_id: String(diag.id),
      lote_id: String((diag as any).lote_id || ''),
    });
    navigate(`/gestion/recomendaciones?${params.toString()}`);
  };

  const esDocenteOAdmin = user && (user.rol_id === 1 || user.rol_id === 2 || user.rol_id === 5);

  const diagnosticosFiltrados = diagnosticos.filter(d => {
    if (!user) return false;
    if (user.rol_id === 1) return true;
    if (user.rol_id === 2 || user.rol_id === 5) return true;
    if (user.rol_id === 4) return (d as any).usuario_id === user.id;
    return false;
  });

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Diagnósticos</h1>
          <div className="flex gap-2">
            {tabActivo === 'diagnosticos' && (
              <button onClick={() => setShowCrearModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <i className="fas fa-plus"></i> Nuevo Diagnóstico
              </button>
            )}
            {exportMessage && (
              <span className={`px-3 py-2 rounded text-sm ${exportMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {exportMessage}
              </span>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setTabActivo('diagnosticos')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tabActivo === 'diagnosticos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <i className="fas fa-microscope mr-2"></i>Diagnósticos
          </button>
          {esAdminODocente && (
            <button
              onClick={() => setTabActivo('tipos')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tabActivo === 'tipos' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <i className="fas fa-cogs mr-2"></i>Tipos de Diagnóstico
            </button>
          )}
        </div>
      </div>

      {/* TAB: Diagnósticos */}
      {tabActivo === 'diagnosticos' && (
        <>
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h3 className="font-semibold mb-3 text-sm text-gray-700">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select className="border rounded p-2 text-sm" value={(filtros as any).tipo_diagnostico || ''} onChange={(e) => setFiltros({ ...filtros, tipo_diagnostico: e.target.value || undefined } as any)}>
                <option value="">Todos los tipos</option>
                <option value="censo_poblacional">Censo Poblacional</option>
                <option value="monitoreo_fenologico">Monitoreo Fenológico</option>
                <option value="artropodos">Artrópodos</option>
                <option value="enfermedades">Enfermedades</option>
                <option value="arvenses">Arvenses</option>
                <option value="controladores_biologicos">Controladores Biológicos</option>
                <option value="polinizadores">Polinizadores</option>
              </select>
              <select className="border rounded p-2 text-sm" value={(filtros as any).programa_id || ''} onChange={(e) => setFiltros({ ...filtros, programa_id: e.target.value ? parseInt(e.target.value) : undefined } as any)}>
                <option value="">Todos los programas</option>
                {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <select className="border rounded p-2 text-sm" value={(filtros as any).estado_revision || ''} onChange={(e) => setFiltros({ ...filtros, estado_revision: e.target.value || undefined } as any)}>
                <option value="">Todos (revisión)</option>
                <option value="pendiente_revision">⏳ Pendientes</option>
                <option value="revisado">✅ Revisados</option>
              </select>
              <button onClick={() => setFiltros({})} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm">Limpiar Filtros</button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8"><i className="fas fa-spinner fa-spin text-2xl"></i><p className="mt-2 text-gray-600">Cargando...</p></div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded text-red-700"><p>{error}</p><button onClick={cargarDatos} className="mt-2 text-blue-600 underline">Reintentar</button></div>
          ) : (
            <DiagnosticosTable
              diagnosticos={diagnosticosFiltrados}
              onEditar={openEditarModal}
              onEliminar={handleEliminarDiagnostico}
              onAgregarEvidencia={openEvidenciaModal}
              onVerDetalles={openDetallesModal}
              currentUser={user}
              onCrearRecomendacion={esDocenteOAdmin ? crearRecomendacionDesdeDiagnostico : undefined}
            />
          )}
        </>
      )}

      {/* TAB: Tipos de Diagnóstico */}
      {tabActivo === 'tipos' && esAdminODocente && (
        <div className="bg-white rounded-lg shadow p-6">
          {programas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay programas disponibles.</div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Programa</label>
                <select
                  value={programaSeleccionadoTipos || ''}
                  onChange={e => setProgramaSeleccionadoTipos(e.target.value ? parseInt(e.target.value) : null)}
                  className="border rounded-lg p-2.5 text-sm w-full md:w-auto min-w-[260px]"
                >
                  {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              {programaSeleccionadoTipos && (
                <GestionTiposDiagnostico
                  programaId={programaSeleccionadoTipos}
                  programaNombre={programas.find(p => p.id === programaSeleccionadoTipos)?.nombre}
                />
              )}
            </>
          )}
        </div>
      )}

      <Modal isOpen={showCrearModal} onClose={() => setShowCrearModal(false)} width="max-w-2xl">
        <DiagnosticoForm onSubmit={handleCrearDiagnostico} onCancel={() => setShowCrearModal(false)} lotes={lotes} programas={programas} monitoreos={monitoreos} condiciones_dia={['Soleado', 'Nublado', 'Lluvia']} currentUser={user} />
      </Modal>

      <Modal isOpen={showEditarModal} onClose={() => setShowEditarModal(false)} width="max-w-2xl">
        {selectedDiagnostico && <DiagnosticoForm diagnostico={selectedDiagnostico} onSubmit={(data) => handleActualizarDiagnostico(selectedDiagnostico.id, data)} onCancel={() => setShowEditarModal(false)} lotes={lotes} programas={programas} monitoreos={monitoreos} condiciones_dia={['Soleado', 'Nublado', 'Lluvia']} currentUser={user} esEdicion />}
      </Modal>

      {showEvidenciaModal && selectedDiagnostico && <AgregarEvidenciaModal isOpen={showEvidenciaModal} onClose={() => setShowEvidenciaModal(false)} diagnostico={selectedDiagnostico} onSubmit={handleAgregarEvidencia} />}
      {showDetallesModal && selectedDiagnostico && <DetallesDiagnosticoModal isOpen={showDetallesModal} onClose={() => setShowDetallesModal(false)} diagnostico={selectedDiagnostico} />}
    </div>
  );
};

export default GestionDiagnosticos;
