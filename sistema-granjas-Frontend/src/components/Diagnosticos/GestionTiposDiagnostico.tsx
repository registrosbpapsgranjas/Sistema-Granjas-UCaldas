import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  diagnosticoDinamicoService,
  type DiagnosticoTipo,
  type DiagnosticoCampo,
  type CampoRecomendacion,
} from '../../services/diagnosticoDinamicoService';
import { monitoreoService, type Monitoreo } from '../../services/monitoreoService';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  programaId: number;
  programaNombre?: string;
  monitoreosIniciales?: Monitoreo[];
}

const TIPOS_DATO_LABELS: Record<string, string> = {
  text: 'Texto corto',
  textarea: 'Texto largo',
  number: 'Número',
  date: 'Fecha',
  select: 'Lista (Opción única)',
  multiselect: 'Lista (Múltiple)',
  boolean: 'Sí / No',
  matrix: 'Matriz (Tabla de evaluación)',
};

type CampoTab = 'diagnostico' | 'recomendacion';

const GestionTiposDiagnostico: React.FC<Props> = ({ programaId, programaNombre, monitoreosIniciales = [] }) => {
  const { user } = useAuth();
  
  // Esperar a que user esté cargado
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user !== undefined) {
      setLoading(false);
    }
  }, [user]);
  
  const esAdmin = user?.rol_id === 1;
  const esDocente = user?.rol_id === 2 || user?.rol_id === 5;
  const programasDocente = user?.programas?.map((p: any) => p.id) || [];
  
  // Verificar permisos después de que user esté cargado
  const puedeGestionarPrograma = esAdmin || (esDocente && programasDocente.includes(programaId));
  
  // ── Monitoreos (usar los que vienen del padre) ────────────────────────────
  const [monitoreos] = useState<Monitoreo[]>(monitoreosIniciales);
  const [monitoreoSel, setMonitoreoSel] = useState<Monitoreo | null>(null);
  const [modalMonitoreo, setModalMonitoreo] = useState(false);
  const [editMonitoreo, setEditMonitoreo] = useState<Monitoreo | null>(null);
  const [formMonitoreo, setFormMonitoreo] = useState({ nombre: '' });

  // ── Subtipos (nivel 2) ────────────────────────────────────────────────────
  const [subtipos, setSubtipos] = useState<DiagnosticoTipo[]>([]);
  const [loadingSubtipos, setLoadingSubtipos] = useState(false);
  const [subtipoSel, setSubtipoSel] = useState<DiagnosticoTipo | null>(null);
  const [modalSubtipo, setModalSubtipo] = useState(false);
  const [editSubtipo, setEditSubtipo] = useState<DiagnosticoTipo | null>(null);
  const [formSubtipo, setFormSubtipo] = useState({ nombre: '', descripcion: '', orden: 0, activo: true });

  // ── Campos (nivel 3) ──────────────────────────────────────────────────────
  const [campoTab, setCampoTab] = useState<CampoTab>('diagnostico');
  const [camposDiag, setCamposDiag] = useState<DiagnosticoCampo[]>([]);
  const [camposRec, setCamposRec] = useState<CampoRecomendacion[]>([]);
  const [loadingCampos, setLoadingCampos] = useState(false);
  const [camposPadre, setCamposPadre] = useState<(DiagnosticoCampo | CampoRecomendacion)[]>([]);

  const [modalCampo, setModalCampo] = useState(false);
  const [editCampo, setEditCampo] = useState<DiagnosticoCampo | CampoRecomendacion | null>(null);
  const [formCampo, setFormCampo] = useState<{
    nombre_campo: string;
    etiqueta: string;
    tipo_dato: string;
    requerido: boolean;
    opciones_texto: string;
    filas_texto: string;
    tipo_celda: string;
    orden: number;
    campo_padre_id: number | null;
    opciones_padre_texto: string;
  }>({
    nombre_campo: '', etiqueta: '', tipo_dato: 'text', requerido: false,
    opciones_texto: '', filas_texto: '', tipo_celda: 'boolean',
    orden: 0, campo_padre_id: null, opciones_padre_texto: '',
  });

  // Mostrar loading mientras se verifica usuario
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Verificando permisos...</span>
      </div>
    );
  }

  // Si el usuario no puede gestionar este programa
  if (!puedeGestionarPrograma) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <i className="fas fa-lock text-4xl text-yellow-600 mb-3 block"></i>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Acceso restringido</h3>
        <p className="text-yellow-700">
          No tiene permisos para gestionar los tipos de diagnóstico de este programa.
          {esDocente && (
            <span className="block text-sm mt-2">
              Solo puede gestionar los programas asignados a su cuenta.
            </span>
          )}
        </p>
      </div>
    );
  }

  // ── Actualizar lista de campos padre disponibles ──────────────────────────
  useEffect(() => {
    if (subtipoSel) {
      const currentFields = campoTab === 'diagnostico' ? camposDiag : camposRec;
      setCamposPadre(currentFields.filter(c => c.tipo_dato === 'select' || c.tipo_dato === 'multiselect'));
    } else {
      setCamposPadre([]);
    }
  }, [camposDiag, camposRec, campoTab, subtipoSel]);

  const seleccionarMonitoreo = async (m: Monitoreo) => {
    setMonitoreoSel(m);
    setSubtipoSel(null);
    setCamposDiag([]);
    setCamposRec([]);
    setLoadingSubtipos(true);
    try {
      const data = await diagnosticoDinamicoService.listarSubtiposPorMonitoreo(m.id);
      setSubtipos(data);
    } catch { toast.error('Error al cargar subtipos'); }
    finally { setLoadingSubtipos(false); }
  };

  // ── Monitoreo CRUD ────────────────────────────────────────────────────────
  const abrirModalMonitoreo = (m?: Monitoreo) => {
    setEditMonitoreo(m || null);
    setFormMonitoreo({ nombre: m?.nombre || '' });
    setModalMonitoreo(true);
  };

  const guardarMonitoreo = async () => {
    if (!formMonitoreo.nombre.trim()) { toast.warning('El nombre es requerido'); return; }
    try {
      if (editMonitoreo) {
        await monitoreoService.actualizarMonitoreo(editMonitoreo.id, { nombre: formMonitoreo.nombre, programa_id: programaId });
        toast.success('Tipo de monitoreo actualizado');
      } else {
        await monitoreoService.crearMonitoreo({ nombre: formMonitoreo.nombre, programa_id: programaId });
        toast.success('Tipo de monitoreo creado');
      }
      setModalMonitoreo(false);
      // Recargar monitoreos desde el padre no es necesario, pero actualizamos la UI localmente
      toast.info('Recargue la página para ver los cambios en la lista de monitoreos');
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Error al guardar'); }
  };

  const eliminarMonitoreo = async (m: Monitoreo) => {
    if (!confirm(`¿Eliminar el tipo de monitoreo "${m.nombre}"?`)) return;
    try {
      await monitoreoService.eliminarMonitoreo(m.id);
      toast.success('Eliminado');
      if (monitoreoSel?.id === m.id) { setMonitoreoSel(null); setSubtipos([]); setSubtipoSel(null); }
      toast.info('Recargue la página para ver los cambios en la lista de monitoreos');
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Error al eliminar'); }
  };

  // ── Subtipos CRUD ─────────────────────────────────────────────────────────
  const abrirModalSubtipo = (s?: DiagnosticoTipo) => {
    setEditSubtipo(s || null);
    setFormSubtipo({ nombre: s?.nombre || '', descripcion: s?.descripcion || '', orden: s?.orden || 0, activo: s?.activo ?? true });
    setModalSubtipo(true);
  };

  const guardarSubtipo = async () => {
    if (!formSubtipo.nombre.trim()) { toast.warning('El nombre es requerido'); return; }
    if (!monitoreoSel) return;
    try {
      if (editSubtipo) {
        await diagnosticoDinamicoService.actualizarTipo(editSubtipo.id, formSubtipo);
        toast.success('Subtipo actualizado');
      } else {
        await diagnosticoDinamicoService.crearTipo({
          ...formSubtipo,
          programa_id: programaId,
          monitoreo_id: monitoreoSel.id,
        });
        toast.success('Subtipo creado');
      }
      setModalSubtipo(false);
      // Recargar subtipos
      const data = await diagnosticoDinamicoService.listarSubtiposPorMonitoreo(monitoreoSel.id);
      setSubtipos(data);
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Error al guardar'); }
  };

  const eliminarSubtipo = async (s: DiagnosticoTipo) => {
    if (!confirm(`¿Eliminar el subtipo "${s.nombre}"? Se eliminarán todos sus campos.`)) return;
    try {
      await diagnosticoDinamicoService.eliminarTipo(s.id);
      toast.success('Subtipo eliminado');
      if (subtipoSel?.id === s.id) { setSubtipoSel(null); setCamposDiag([]); setCamposRec([]); }
      if (monitoreoSel) {
        const data = await diagnosticoDinamicoService.listarSubtiposPorMonitoreo(monitoreoSel.id);
        setSubtipos(data);
      }
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Error al eliminar'); }
  };

  // ── Campos ────────────────────────────────────────────────────────────────
  const cargarCampos = async (subtipoId: number) => {
    setLoadingCampos(true);
    try {
      const [diag, rec] = await Promise.all([
        diagnosticoDinamicoService.listarCampos(subtipoId),
        diagnosticoDinamicoService.listarCamposRecomendacion(subtipoId),
      ]);
      setCamposDiag(diag);
      setCamposRec(rec);
    } catch { toast.error('Error al cargar campos'); }
    finally { setLoadingCampos(false); }
  };

  const seleccionarSubtipo = (s: DiagnosticoTipo) => {
    setSubtipoSel(s);
    cargarCampos(s.id);
  };

  const abrirModalCampo = (campo?: DiagnosticoCampo | CampoRecomendacion) => {
    setEditCampo(campo || null);
    if (campo) {
      const opciones = campo.opciones || [];
      if (campo.tipo_dato === 'matrix' && typeof opciones === 'object' && !Array.isArray(opciones)) {
        const matrixData = opciones as { filas: string[]; columnas: string[]; tipo_celda: string };
        setFormCampo({
          nombre_campo: campo.nombre_campo,
          etiqueta: campo.etiqueta,
          tipo_dato: campo.tipo_dato,
          requerido: campo.requerido,
          opciones_texto: matrixData.columnas?.join(', ') || '',
          filas_texto: matrixData.filas?.join('\n') || '',
          tipo_celda: matrixData.tipo_celda || 'boolean',
          orden: campo.orden,
          campo_padre_id: campo.campo_padre_id ?? null,
          opciones_padre_texto: campo.opciones_padre ? campo.opciones_padre.join(', ') : '',
        });
      } else {
        const opcionesArr = Array.isArray(opciones) ? opciones : [];
        setFormCampo({
          nombre_campo: campo.nombre_campo,
          etiqueta: campo.etiqueta,
          tipo_dato: campo.tipo_dato,
          requerido: campo.requerido,
          opciones_texto: opcionesArr.join(', '),
          filas_texto: '',
          tipo_celda: 'boolean',
          orden: campo.orden,
          campo_padre_id: campo.campo_padre_id ?? null,
          opciones_padre_texto: campo.opciones_padre ? campo.opciones_padre.join(', ') : '',
        });
      }
    } else {
      setFormCampo({
        nombre_campo: '', etiqueta: '', tipo_dato: 'text', requerido: false,
        opciones_texto: '', filas_texto: '', tipo_celda: 'boolean',
        orden: 0, campo_padre_id: null, opciones_padre_texto: '',
      });
    }
    setModalCampo(true);
  };

  const guardarCampo = async () => {
    if (!subtipoSel) return;
    if (!formCampo.etiqueta.trim()) { toast.warning('La etiqueta es requerida'); return; }

    const esTipoLista = formCampo.tipo_dato === 'select' || formCampo.tipo_dato === 'multiselect';
    const esMatriz = formCampo.tipo_dato === 'matrix';
    let opciones: any = undefined;

    if (esMatriz) {
      const filas = formCampo.filas_texto.split('\n').map(s => s.trim()).filter(Boolean);
      const columnas = formCampo.opciones_texto.split(',').map(s => s.trim()).filter(Boolean);
      if (filas.length === 0) { toast.warning('Agrega al menos una fila'); return; }
      if (columnas.length === 0) { toast.warning('Agrega al menos una columna'); return; }
      opciones = { filas, columnas, tipo_celda: formCampo.tipo_celda || 'boolean' };
    } else if (esTipoLista) {
      opciones = formCampo.opciones_texto.split(',').map(s => s.trim()).filter(Boolean);
      if (!opciones || opciones.length === 0) {
        toast.warning('Agrega al menos una opción'); return;
      }
    }

    let opciones_padre: string[] | null = null;
    if (formCampo.campo_padre_id && formCampo.opciones_padre_texto.trim()) {
      const parsed = formCampo.opciones_padre_texto.split(',').map(s => s.trim()).filter(Boolean);
      if (parsed.length === 0) {
        toast.warning('Debe especificar al menos un valor del padre para mostrar este campo');
        return;
      }
      opciones_padre = parsed;
    }

    const nombre = formCampo.nombre_campo.trim() ||
      formCampo.etiqueta.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    try {
      const payload = {
        nombre_campo: nombre,
        etiqueta: formCampo.etiqueta,
        tipo_dato: formCampo.tipo_dato,
        requerido: formCampo.requerido,
        opciones: (esTipoLista || esMatriz) ? opciones : undefined,
        orden: formCampo.orden,
        campo_padre_id: formCampo.campo_padre_id || null,
        opciones_padre: opciones_padre,
      };

      if (campoTab === 'diagnostico') {
        if (editCampo && 'tipo_id' in editCampo) {
          await diagnosticoDinamicoService.actualizarCampo(editCampo.id, payload);
        } else {
          await diagnosticoDinamicoService.crearCampo({ ...payload, tipo_id: subtipoSel.id } as any);
        }
      } else {
        if (editCampo && 'subtipo_id' in editCampo) {
          await diagnosticoDinamicoService.actualizarCampoRecomendacion(editCampo.id, payload);
        } else {
          await diagnosticoDinamicoService.crearCampoRecomendacion({ ...payload, subtipo_id: subtipoSel.id } as any);
        }
      }
      toast.success('Campo guardado');
      setModalCampo(false);
      cargarCampos(subtipoSel.id);
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Error al guardar campo'); }
  };

  const eliminarCampo = async (campo: DiagnosticoCampo | CampoRecomendacion, tab: CampoTab) => {
    if (!confirm(`¿Eliminar el campo "${campo.etiqueta}"?`)) return;
    try {
      if (tab === 'diagnostico') {
        await diagnosticoDinamicoService.eliminarCampo(campo.id);
      } else {
        await diagnosticoDinamicoService.eliminarCampoRecomendacion(campo.id);
      }
      toast.success('Campo eliminado');
      if (subtipoSel) cargarCampos(subtipoSel.id);
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Error al eliminar campo'); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getNombrePadre = (campo: DiagnosticoCampo | CampoRecomendacion): string | null => {
    if (!campo.campo_padre_id) return null;
    const lista = campoTab === 'diagnostico' ? camposDiag : camposRec;
    const padre = lista.find(c => c.id === campo.campo_padre_id);
    return padre ? padre.etiqueta : `Campo #${campo.campo_padre_id}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const renderCampoCard = (campo: DiagnosticoCampo | CampoRecomendacion, tab: CampoTab) => {
    const nombrePadre = getNombrePadre(campo);
    return (
      <div key={campo.id} className="border border-gray-200 rounded-lg p-3 bg-white flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-800">{campo.etiqueta}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{TIPOS_DATO_LABELS[campo.tipo_dato] || campo.tipo_dato}</span>
            {campo.requerido && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Requerido</span>}
            {(campo.tipo_dato === 'select' || campo.tipo_dato === 'multiselect') && campo.opciones && (
              <span className="text-xs text-gray-500">{campo.opciones.length} opciones</span>
            )}
            {campo.tipo_dato === 'matrix' && campo.opciones && typeof campo.opciones === 'object' && !Array.isArray(campo.opciones) && (
              <span className="text-xs text-gray-500">
                {(campo.opciones as any).filas?.length || 0} filas × {(campo.opciones as any).columnas?.length || 0} columnas
              </span>
            )}
            {nombrePadre && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded" title={`Si "${nombrePadre}" = ${campo.opciones_padre?.join(' o ')}`}>
                <i className="fas fa-code-branch mr-1"></i>Condicional
              </span>
            )}
          </div>
          {nombrePadre && (
            <p className="text-xs text-gray-400 mt-0.5">
              Visible cuando <span className="font-medium">{nombrePadre}</span> = {campo.opciones_padre?.join(', ')}
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-2 flex-shrink-0">
          <button onClick={() => abrirModalCampo(campo)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded"><i className="fas fa-edit text-sm"></i></button>
          <button onClick={() => eliminarCampo(campo, tab)} className="text-red-500 hover:text-red-700 p-1.5 rounded"><i className="fas fa-trash text-sm"></i></button>
        </div>
      </div>
    );
  };

  const esTipoListaActual = formCampo.tipo_dato === 'select' || formCampo.tipo_dato === 'multiselect';
  const camposPadreFiltrados = camposPadre.filter(c => editCampo ? c.id !== editCampo.id : true);
  const campoPadreSeleccionado = camposPadre.find(c => c.id === formCampo.campo_padre_id);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Tipos de Diagnóstico</h2>
          <p className="text-sm text-gray-500 mt-1">
            <i className="fas fa-info-circle mr-1"></i>
            Define la jerarquía de monitoreo para <strong>{programaNombre}</strong>: Tipos → Subtipos → Campos (Diagnóstico y Recomendación).
          </p>
        </div>
        {!esAdmin && esDocente && (
          <div className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
            <i className="fas fa-chalkboard-teacher"></i>
            Gestión limitada a su programa
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── PANEL 1: Tipos de Monitoreo ────────────────────────────────── */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-sm">
              <i className="fas fa-leaf text-green-500 mr-1"></i> Tipos de Monitoreo
            </h3>
            <button onClick={() => abrirModalMonitoreo()}
              className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1">
              <i className="fas fa-plus"></i> Nuevo
            </button>
          </div>
          {monitoreos.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <i className="fas fa-seedling text-2xl mb-2 block"></i>
              Sin tipos.<br/>
              <button onClick={() => abrirModalMonitoreo()} className="text-green-600 hover:underline mt-1">Crear el primero</button>
            </div>
          ) : (
            <div className="space-y-2">
              {monitoreos.map(m => (
                <div key={m.id} onClick={() => seleccionarMonitoreo(m)}
                  className={`border rounded-lg p-3 cursor-pointer transition ${monitoreoSel?.id === m.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-gray-800">{m.nombre}</p>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => abrirModalMonitoreo(m)} className="text-blue-500 hover:text-blue-700 p-1"><i className="fas fa-edit text-xs"></i></button>
                      <button onClick={() => eliminarMonitoreo(m)} className="text-red-400 hover:text-red-600 p-1"><i className="fas fa-trash text-xs"></i></button>
                    </div>
                  </div>
                  {monitoreoSel?.id !== m.id && <p className="text-xs text-gray-400 mt-1">Click para ver subtipos</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── PANEL 2: Subtipos ─────────────────────────────────────────────── */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-sm">
              <i className="fas fa-sitemap text-blue-500 mr-1"></i>
              {monitoreoSel ? <>Subtipos: <span className="text-blue-600">{monitoreoSel.nombre}</span></> : 'Subtipos'}
            </h3>
            {monitoreoSel && (
              <button onClick={() => abrirModalSubtipo()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1">
                <i className="fas fa-plus"></i> Nuevo
              </button>
            )}
          </div>
          {!monitoreoSel ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm text-center">
              <div><i className="fas fa-hand-pointer text-2xl mb-2 block"></i>Selecciona un tipo de monitoreo</div>
            </div>
          ) : loadingSubtipos ? (
            <div className="flex justify-center py-6"><div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div></div>
          ) : subtipos.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <i className="fas fa-clipboard-list text-2xl mb-2 block"></i>
              Sin subtipos.<br/>
              <button onClick={() => abrirModalSubtipo()} className="text-blue-600 hover:underline mt-1">Crear el primero</button>
            </div>
          ) : (
            <div className="space-y-2">
              {subtipos.map(s => (
                <div key={s.id} onClick={() => seleccionarSubtipo(s)}
                  className={`border rounded-lg p-3 cursor-pointer transition ${subtipoSel?.id === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{s.nombre}</p>
                      {s.descripcion && <p className="text-xs text-gray-500 mt-0.5">{s.descripcion}</p>}
                      <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${s.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => abrirModalSubtipo(s)} className="text-blue-500 hover:text-blue-700 p-1"><i className="fas fa-edit text-xs"></i></button>
                      <button onClick={() => eliminarSubtipo(s)} className="text-red-400 hover:text-red-600 p-1"><i className="fas fa-trash text-xs"></i></button>
                    </div>
                  </div>
                  {subtipoSel?.id !== s.id && <p className="text-xs text-gray-400 mt-1">Click para ver campos</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── PANEL 3: Campos ───────────────────────────────────────────────── */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-sm">
              <i className="fas fa-th-list text-purple-500 mr-1"></i>
              {subtipoSel ? <>Campos: <span className="text-purple-600">{subtipoSel.nombre}</span></> : 'Campos'}
            </h3>
            {subtipoSel && (
              <button onClick={() => abrirModalCampo()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1">
                <i className="fas fa-plus"></i> Nuevo
              </button>
            )}
          </div>

          {!subtipoSel ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm text-center">
              <div><i className="fas fa-hand-pointer text-2xl mb-2 block"></i>Selecciona un subtipo</div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-3">
                <button onClick={() => setCampoTab('diagnostico')}
                  className={`flex-1 py-1.5 text-xs font-medium border-b-2 transition ${campoTab === 'diagnostico' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
                  <i className="fas fa-microscope mr-1"></i>Diagnóstico
                </button>
                <button onClick={() => setCampoTab('recomendacion')}
                  className={`flex-1 py-1.5 text-xs font-medium border-b-2 transition ${campoTab === 'recomendacion' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}>
                  <i className="fas fa-lightbulb mr-1"></i>Recomendación
                </button>
              </div>

              {loadingCampos ? (
                <div className="flex justify-center py-6"><div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div></div>
              ) : campoTab === 'diagnostico' ? (
                camposDiag.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <i className="fas fa-inbox text-2xl mb-2 block"></i>
                    Sin campos de diagnóstico.<br/>
                    <button onClick={() => abrirModalCampo()} className="text-blue-600 hover:underline mt-1">Agregar campo</button>
                  </div>
                ) : (
                  <div className="space-y-2">{camposDiag.map(c => renderCampoCard(c, 'diagnostico'))}</div>
                )
              ) : (
                camposRec.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <i className="fas fa-inbox text-2xl mb-2 block"></i>
                    Sin campos de recomendación.<br/>
                    <button onClick={() => abrirModalCampo()} className="text-orange-600 hover:underline mt-1">Agregar campo</button>
                  </div>
                ) : (
                  <div className="space-y-2">{camposRec.map(c => renderCampoCard(c, 'recomendacion'))}</div>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Modales (se mantienen igual) */}
      {modalMonitoreo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg mb-4">{editMonitoreo ? 'Editar Tipo de Monitoreo' : 'Nuevo Tipo de Monitoreo'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input value={formMonitoreo.nombre} onChange={e => setFormMonitoreo({ nombre: e.target.value })}
                  className="w-full border rounded-lg p-2.5" placeholder="Ej: Cítricos, Plátano, Aguacate..." autoFocus />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardarMonitoreo} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium">
                {editMonitoreo ? 'Guardar' : 'Crear'}
              </button>
              <button onClick={() => setModalMonitoreo(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-medium">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalSubtipo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">{editSubtipo ? 'Editar Subtipo' : 'Nuevo Subtipo'}</h3>
            <p className="text-xs text-gray-500 mb-4">Subtipo de <strong>{monitoreoSel?.nombre}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input value={formSubtipo.nombre} onChange={e => setFormSubtipo(p => ({ ...p, nombre: e.target.value }))}
                  className="w-full border rounded-lg p-2.5" placeholder="Ej: Fenológico, Arvenses, Plagas..." autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea value={formSubtipo.descripcion} onChange={e => setFormSubtipo(p => ({ ...p, descripcion: e.target.value }))}
                  className="w-full border rounded-lg p-2.5" rows={2} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Orden</label>
                  <input type="number" value={formSubtipo.orden} onChange={e => setFormSubtipo(p => ({ ...p, orden: parseInt(e.target.value) || 0 }))}
                    className="w-full border rounded-lg p-2.5" min={0} />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <input type="checkbox" id="activo_sub" checked={formSubtipo.activo} onChange={e => setFormSubtipo(p => ({ ...p, activo: e.target.checked }))} className="w-4 h-4" />
                  <label htmlFor="activo_sub" className="text-sm">Activo</label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardarSubtipo} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium">
                {editSubtipo ? 'Guardar' : 'Crear'}
              </button>
              <button onClick={() => setModalSubtipo(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-medium">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalCampo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-1">
              {editCampo ? 'Editar Campo' : 'Nuevo Campo'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {campoTab === 'diagnostico' ? 'Campo de Diagnóstico' : 'Campo de Recomendación'} — {subtipoSel?.nombre}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Etiqueta (visible al usuario) *</label>
                <input value={formCampo.etiqueta} onChange={e => setFormCampo(p => ({ ...p, etiqueta: e.target.value }))}
                  className="w-full border rounded-lg p-2.5" placeholder="Ej: Número de ácaros..." autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de dato *</label>
                <select value={formCampo.tipo_dato} onChange={e => setFormCampo(p => ({ ...p, tipo_dato: e.target.value, campo_padre_id: null, opciones_padre_texto: '' }))}
                  className="w-full border rounded-lg p-2.5">
                  {Object.entries(TIPOS_DATO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              {esTipoListaActual && (
                <div>
                  <label className="block text-sm font-medium mb-1">Opciones (separadas por coma) *</label>
                  <input value={formCampo.opciones_texto} onChange={e => setFormCampo(p => ({ ...p, opciones_texto: e.target.value }))}
                    className="w-full border rounded-lg p-2.5" placeholder="Ej: Alto, Medio, Bajo" />
                </div>
              )}

              {formCampo.tipo_dato === 'matrix' && (
                <div className="space-y-3 border border-purple-200 bg-purple-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                    <i className="fas fa-table"></i> Configuración de Matriz
                  </p>
                  <div>
                    <label className="block text-sm font-medium mb-1">Filas (una por línea) *</label>
                    <textarea
                      value={formCampo.filas_texto}
                      onChange={e => setFormCampo(p => ({ ...p, filas_texto: e.target.value }))}
                      className="w-full border rounded-lg p-2.5 text-sm"
                      rows={6}
                      placeholder={"Hyptis atrorubens\nSpermacoce alata\nDrymaria cordata\n..."}
                    />
                    <p className="text-xs text-gray-500 mt-1">Cada línea será una fila de la tabla.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Columnas (separadas por coma) *</label>
                    <input
                      value={formCampo.opciones_texto}
                      onChange={e => setFormCampo(p => ({ ...p, opciones_texto: e.target.value }))}
                      className="w-full border rounded-lg p-2.5 text-sm"
                      placeholder="<5%, 5-20%, 20-50%, 50-80%, >80%, Sin presencia"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo de celda *</label>
                    <select
                      value={formCampo.tipo_celda}
                      onChange={e => setFormCampo(p => ({ ...p, tipo_celda: e.target.value }))}
                      className="w-full border rounded-lg p-2.5 text-sm"
                    >
                      <option value="boolean">Presencia (Checkbox)</option>
                      <option value="number">Número</option>
                      <option value="text">Texto</option>
                      <option value="radio">Selección única por fila (Radio)</option>
                    </select>
                  </div>
                </div>
              )}

              {true && (
                <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 space-y-3">
                  <p className="text-xs font-semibold text-yellow-700 flex items-center gap-1">
                    <i className="fas fa-code-branch"></i> Visibilidad condicional (opcional)
                  </p>
                  <div>
                    <label className="block text-sm font-medium mb-1">Depende del campo</label>
                    {camposPadreFiltrados.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">
                        No hay campos de tipo Lista en este subtipo. Crea uno primero para poder definir dependencias.
                      </p>
                    ) : (
                      <select
                        value={formCampo.campo_padre_id?.toString() || ''}
                        onChange={e => setFormCampo(p => ({
                          ...p,
                          campo_padre_id: e.target.value ? parseInt(e.target.value) : null,
                          opciones_padre_texto: '',
                        }))}
                        className="w-full border rounded-lg p-2.5 text-sm"
                      >
                        <option value="">Ninguno (siempre visible)</option>
                        {camposPadreFiltrados.map(c => (
                          <option key={c.id} value={c.id.toString()}>
                            {c.etiqueta} ({c.opciones?.length || 0} opciones)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {formCampo.campo_padre_id && campoPadreSeleccionado && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Mostrar este campo cuando el valor sea *
                      </label>
                      <input
                        value={formCampo.opciones_padre_texto}
                        onChange={e => setFormCampo(p => ({ ...p, opciones_padre_texto: e.target.value }))}
                        placeholder={`Ej: ${campoPadreSeleccionado.opciones?.slice(0, 2).join(', ') || 'Opción A, Opción B'}`}
                        className="w-full border rounded-lg p-2.5 text-sm"
                      />
                      {campoPadreSeleccionado.opciones && campoPadreSeleccionado.opciones.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <span className="text-xs text-gray-400 mr-1">Opciones disponibles:</span>
                          {campoPadreSeleccionado.opciones.map(op => (
                            <button
                              key={op}
                              type="button"
                              onClick={() => {
                                const current = formCampo.opciones_padre_texto
                                  .split(',').map(s => s.trim()).filter(Boolean);
                                if (!current.includes(op)) {
                                  setFormCampo(p => ({
                                    ...p,
                                    opciones_padre_texto: [...current, op].join(', '),
                                  }));
                                }
                              }}
                              className="text-xs bg-white border border-gray-300 hover:border-yellow-500 hover:bg-yellow-50 px-2 py-0.5 rounded transition"
                            >
                              {op}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Este campo solo aparecerá cuando el campo padre tenga uno de estos valores.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Orden</label>
                  <input type="number" value={formCampo.orden} onChange={e => setFormCampo(p => ({ ...p, orden: parseInt(e.target.value) || 0 }))}
                    className="w-full border rounded-lg p-2.5" min={0} />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <input type="checkbox" id="req_campo" checked={formCampo.requerido} onChange={e => setFormCampo(p => ({ ...p, requerido: e.target.checked }))} className="w-4 h-4" />
                  <label htmlFor="req_campo" className="text-sm">Requerido</label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardarCampo} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium">
                {editCampo ? 'Guardar cambios' : 'Crear campo'}
              </button>
              <button onClick={() => setModalCampo(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-medium">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionTiposDiagnostico;