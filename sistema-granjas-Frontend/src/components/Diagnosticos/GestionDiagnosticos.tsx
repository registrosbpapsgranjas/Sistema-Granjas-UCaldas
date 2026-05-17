import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import diagnosticoService from '../../services/diagnosticoService';
import loteService from '../../services/loteService';
import programaService from '../../services/programaService';
import monitoreoService from '../../services/monitoreoService';
import { diagnosticoDinamicoService } from '../../services/diagnosticoDinamicoService';
import type { DiagnosticoTipo } from '../../services/diagnosticoDinamicoService';
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

type TabType = 'diagnosticos' | 'tipos';

const GestionDiagnosticos: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Roles ──────────────────────────────────────────────────────────────────
  const esAdmin = user?.rol_id === 1;
  const esDocente = user?.rol_id === 2 || user?.rol_id === 5;
  const esAsesor = user?.rol_id === 3;
  const esEstudiante = user?.rol_id === 4;

  // Memoizado para evitar loops en useEffect
  const programasDocente = useMemo(
    () => user?.programas?.map((p: any) => p.id) || [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  );

  const puedeCrearDiagnostico = esEstudiante;
  const puedeCrearRecomendacion = esAdmin || esDocente;
  const puedeGestionarTipos = esAdmin || esDocente;

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const [tabActivo, setTabActivo] = useState<TabType>('diagnosticos');

  // ── Estado pestaña Diagnósticos ────────────────────────────────────────────
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoItem[]>([]);
  const [loadingDiag, setLoadingDiag] = useState(true);
  const [errorDiag, setErrorDiag] = useState<string | null>(null);
  const [lotes, setLotes] = useState<any[]>([]);
  const [filtros, setFiltros] = useState<DiagnosticoFiltros>({});
  const [subtiposFiltro, setSubtiposFiltro] = useState<DiagnosticoTipo[]>([]);
  const [cargandoSubtipos, setCargandoSubtipos] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showEvidenciaModal, setShowEvidenciaModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [selectedDiagnostico, setSelectedDiagnostico] = useState<DiagnosticoItem | null>(null);

  // ── Estado pestaña Tipos ───────────────────────────────────────────────────
  const [programas, setProgramas] = useState<any[]>([]);
  const [monitoreos, setMonitoreos] = useState<any[]>([]);
  const [programaSeleccionado, setProgramaSeleccionado] = useState<number | null>(null);
  const [loadingTipos, setLoadingTipos] = useState(false);

  // ── Carga inicial de programas y monitoreos (para pestaña Tipos) ───────────
  const cargarDatosParaTipos = useCallback(async () => {
    if (!user) return;
    setLoadingTipos(true);
    try {
      // Cargar programas
      const programasData = await programaService.obtenerProgramas();
      let listaProgramas = Array.isArray(programasData)
        ? programasData
        : (programasData?.items || []);

      // Docente solo ve sus programas
      if (esDocente && programasDocente.length > 0) {
        listaProgramas = listaProgramas.filter((p: any) =>
          programasDocente.includes(p.id)
        );
      }
      setProgramas(listaProgramas);
      if (listaProgramas.length > 0) {
        setProgramaSeleccionado(prev => prev ?? listaProgramas[0].id);
      }

      // Cargar monitoreos filtrados por programas del docente
      if (esDocente && programasDocente.length > 0) {
        const monitoreosPorPrograma = await Promise.all(
          programasDocente.map(async (pid: number) => {
            try {
              return await monitoreoService.obtenerMonitoreosPorPrograma(pid);
            } catch {
              return [];
            }
          })
        );
        const mapaUnicos = new Map<number, any>();
        monitoreosPorPrograma.flat().forEach((m: any) => {
          if (!mapaUnicos.has(m.id)) mapaUnicos.set(m.id, m);
        });
        setMonitoreos(Array.from(mapaUnicos.values()));
      } else {
        const todos = await monitoreoService.obtenerMonitoreos();
        setMonitoreos(Array.isArray(todos) ? todos : (todos?.items || []));
      }
    } catch (err) {
      console.error('Error cargando datos para tipos:', err);
      toast.error('Error al cargar los tipos de diagnóstico');
    } finally {
      setLoadingTipos(false);
    }
  }, [user?.id, esDocente, programasDocente]);

  // Cargar datos para tipos cuando el usuario esté disponible
  useEffect(() => {
    if (user) cargarDatosParaTipos();
  }, [user?.id]);

  // ── Carga de diagnósticos ──────────────────────────────────────────────────
  const cargarDiagnosticos = useCallback(async () => {
    setLoadingDiag(true);
    setErrorDiag(null);
    try {
      const filtrosActuales = { ...filtros };

      if (esDocente && !filtrosActuales.programa_id && programasDocente.length > 0) {
        filtrosActuales.programa_id = programasDocente[0];
      }

      const data = await diagnosticoService.obtenerDiagnosticos(filtrosActuales);
      let items = Array.isArray(data) ? data : (data?.items || []);

      if (esDocente && programasDocente.length > 0) {
        items = items.filter((d: DiagnosticoItem) =>
          programasDocente.includes(d.programa_id)
        );
      }

      setDiagnosticos(items);

      if (lotes.length === 0) {
        const lotesData = await loteService.obtenerLotes();
        let lotesArr = Array.isArray(lotesData) ? lotesData : (lotesData?.items || []);
        lotesArr = await Promise.all(
          lotesArr.map(async (lote: any) => {
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
        setLotes(lotesArr);
      }
    } catch (err: any) {
      setErrorDiag(err.message || 'Error al cargar diagnósticos');
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoadingDiag(false);
    }
  }, [filtros, esDocente, programasDocente]);

  useEffect(() => {
    if (tabActivo === 'diagnosticos' && user) {
      cargarDiagnosticos();
    }
  }, [filtros, tabActivo, user?.id]);

  // Subtipos para filtro
  useEffect(() => {
    const monitoreoId = filtros.tipo_monitoreo_id;
    if (!monitoreoId) { setSubtiposFiltro([]); return; }
    setCargandoSubtipos(true);
    diagnosticoDinamicoService
      .listarSubtiposPorMonitoreo(monitoreoId)
      .then(data => setSubtiposFiltro(data.filter(s => s.activo)))
      .catch(() => setSubtiposFiltro([]))
      .finally(() => setCargandoSubtipos(false));
  }, [filtros.tipo_monitoreo_id]);

  // ── Handlers CRUD ──────────────────────────────────────────────────────────
  const handleCrearDiagnostico = async (formData: FormData) => {
    if (!puedeCrearDiagnostico) { toast.error('Sin permisos para crear diagnósticos'); return; }
    try {
      if (!user?.id) throw new Error('Usuario no autenticado');
      formData.append('usuario_id', String(user.id));
      const nuevo = await diagnosticoService.crearDiagnostico(formData);
      setDiagnosticos(prev => [nuevo, ...prev]);
      toast.success('Diagnóstico creado exitosamente');
      setShowCrearModal(false);
    } catch (err: any) {
      toast.error(`Error al crear: ${err.message}`);
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

  const handleExportar = async () => {
    if (exporting) return;
    setExporting(true);
    setExportMessage('Exportando diagnósticos...');
    try {
      const result = await exportService.exportarDiagnosticos();
      setExportMessage(`¡Completado! (${result.filename})`);
      setTimeout(() => setExportMessage(''), 5000);
    } catch {
      setExportMessage('Error al exportar.');
      setTimeout(() => setExportMessage(''), 5000);
    } finally {
      setExporting(false);
    }
  };

  const crearRecomendacionDesdeDiagnostico = (diag: DiagnosticoItem) => {
    if (!puedeCrearRecomendacion) { toast.error('Sin permisos'); return; }
    const params = new URLSearchParams({
      diagnostico_id: String(diag.id),
      lote_id: String((diag as any).lote_id || ''),
    });
    navigate(`/gestion/recomendaciones?${params.toString()}`);
  };

  // ── Filtrado final por rol ─────────────────────────────────────────────────
  const diagnosticosFiltrados = diagnosticos.filter(d => {
    if (!user) return false;
    if (esAdmin || esAsesor) return true;
    if (esDocente) return programasDocente.length > 0 && programasDocente.includes(d.programa_id);
    if (esEstudiante) return (d as any).usuario_id === user.id;
    return false;
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Diagnósticos</h1>
          <div className="flex gap-2 items-center">
            {tabActivo === 'diagnosticos' && puedeCrearDiagnostico && (
              <button
                onClick={() => setShowCrearModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
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

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTabActivo('diagnosticos')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tabActivo === 'diagnosticos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <i className="fas fa-microscope mr-2"></i>Diagnósticos
          </button>
          {puedeGestionarTipos && (
            <button
              onClick={() => setTabActivo('tipos')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tabActivo === 'tipos' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <i className="fas fa-cogs mr-2"></i>Tipos de Diagnóstico
            </button>
          )}
        </div>
      </div>

      {/* ── PESTAÑA: DIAGNÓSTICOS ── */}
      {tabActivo === 'diagnosticos' && (
        <>
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h3 className="font-semibold mb-3 text-sm text-gray-700">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                className="border rounded p-2 text-sm"
                value={filtros.tipo_monitoreo_id || ''}
                onChange={e => setFiltros({
                  ...filtros,
                  tipo_monitoreo_id: e.target.value ? parseInt(e.target.value) : undefined,
                  diagnostico_tipo_id: undefined,
                })}
              >
                <option value="">Todos los tipos de monitoreo</option>
                {monitoreos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>

              <select
                className="border rounded p-2 text-sm"
                value={filtros.diagnostico_tipo_id || ''}
                onChange={e => setFiltros({ ...filtros, diagnostico_tipo_id: e.target.value ? parseInt(e.target.value) : undefined })}
                disabled={!filtros.tipo_monitoreo_id || cargandoSubtipos}
              >
                <option value="">
                  {!filtros.tipo_monitoreo_id ? 'Selecciona un monitoreo primero'
                    : cargandoSubtipos ? 'Cargando subtipos...'
                    : subtiposFiltro.length === 0 ? 'Sin subtipos disponibles'
                    : 'Todos los subtipos'}
                </option>
                {subtiposFiltro.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>

              {esAdmin && (
                <select
                  className="border rounded p-2 text-sm"
                  value={filtros.programa_id || ''}
                  onChange={e => setFiltros({ ...filtros, programa_id: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">Todos los programas</option>
                  {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              )}

              <select
                className="border rounded p-2 text-sm"
                value={filtros.estado_revision || ''}
                onChange={e => setFiltros({ ...filtros, estado_revision: (e.target.value as DiagnosticoFiltros['estado_revision']) || undefined })}
              >
                <option value="">Todos (revisión)</option>
                <option value="pendiente_revision">⏳ Pendientes</option>
                <option value="revisado">✅ Revisados</option>
              </select>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => { setFiltros({}); setSubtiposFiltro([]); }}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm flex items-center gap-2"
              >
                <i className="fas fa-times"></i> Limpiar Filtros
              </button>
            </div>
          </div>

          {loadingDiag ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
              <p className="mt-2 text-gray-600">Cargando diagnósticos...</p>
            </div>
          ) : errorDiag ? (
            <div className="bg-red-50 p-4 rounded text-red-700">
              <p>{errorDiag}</p>
              <button onClick={cargarDiagnosticos} className="mt-2 text-blue-600 underline">Reintentar</button>
            </div>
          ) : (
            <DiagnosticosTable
              diagnosticos={diagnosticosFiltrados}
              onEditar={d => { setSelectedDiagnostico(d); setShowEditarModal(true); }}
              onEliminar={handleEliminarDiagnostico}
              onAgregarEvidencia={d => { setSelectedDiagnostico(d); setShowEvidenciaModal(true); }}
              onVerDetalles={d => { setSelectedDiagnostico(d); setShowDetallesModal(true); }}
              currentUser={user}
              onCrearRecomendacion={puedeCrearRecomendacion ? crearRecomendacionDesdeDiagnostico : undefined}
            />
          )}
        </>
      )}

      {/* ── PESTAÑA: TIPOS DE DIAGNÓSTICO ── */}
      {tabActivo === 'tipos' && puedeGestionarTipos && (
        <div className="bg-white rounded-lg shadow p-6">
          {loadingTipos ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Cargando datos...</span>
            </div>
          ) : programas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-info-circle text-3xl mb-3 block text-gray-300"></i>
              {esDocente
                ? 'No tiene programas asignados. Contacte al administrador.'
                : 'No hay programas disponibles.'}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Programa</label>
                <select
                  value={programaSeleccionado || ''}
                  onChange={e => setProgramaSeleccionado(e.target.value ? parseInt(e.target.value) : null)}
                  className="border rounded-lg p-2.5 text-sm w-full md:w-auto min-w-[260px]"
                >
                  {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              {programaSeleccionado && (
                <GestionTiposDiagnostico
                  programaId={programaSeleccionado}
                  programaNombre={programas.find(p => p.id === programaSeleccionado)?.nombre}
                  monitoreosIniciales={monitoreos}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ── MODALES ── */}
      {puedeCrearDiagnostico && (
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
      )}

      <Modal isOpen={showEditarModal} onClose={() => setShowEditarModal(false)} width="max-w-2xl">
        {selectedDiagnostico && (
          <DiagnosticoForm
            diagnostico={selectedDiagnostico}
            onSubmit={data => handleActualizarDiagnostico(selectedDiagnostico.id, data)}
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

      {showEvidenciaModal && selectedDiagnostico && (
        <AgregarEvidenciaModal
          isOpen={showEvidenciaModal}
          onClose={() => setShowEvidenciaModal(false)}
          diagnostico={selectedDiagnostico}
          onSubmit={handleAgregarEvidencia}
        />
      )}

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
