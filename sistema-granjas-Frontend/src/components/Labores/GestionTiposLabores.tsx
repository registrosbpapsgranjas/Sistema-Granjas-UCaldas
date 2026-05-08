import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import tipoLaborService from '../../services/tipoLaboresService';
import {
  diagnosticoDinamicoService,
  type DiagnosticoTipo,
  type CampoLabor,
} from '../../services/diagnosticoDinamicoService';
import { monitoreoService, type Monitoreo } from '../../services/monitoreoService';
import { programaService } from '../../services/programaService';
import type { Programa } from '../../types/granjaTypes';

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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const getToken = () => localStorage.getItem('token');

const emptyFormCampo = {
  nombre_campo: '', etiqueta: '', tipo_dato: 'text', requerido: false,
  opciones_texto: '', filas_texto: '', tipo_celda: 'boolean',
  orden: 0, campo_padre_id: null as number | null, opciones_padre_texto: '',
};

type MainTab = 'tipos' | 'estructura';

const GestionTiposLabores: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTab>('tipos');

  // ── Tab 1: TipoLabor CRUD ────────────────────────────────────────────────
  const [tipos, setTipos] = useState<any[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [showFormTipo, setShowFormTipo] = useState(false);
  const [formTipo, setFormTipo] = useState({ nombre: '', descripcion: '' });
  const [guardandoTipo, setGuardandoTipo] = useState(false);

  // ── Tab 2: Estructura por subtipo ────────────────────────────────────────
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [programaSel, setProgramaSel] = useState<Programa | null>(null);
  const [monitoreos, setMonitoreos] = useState<Monitoreo[]>([]);
  const [monitoreoSel, setMonitoreoSel] = useState<Monitoreo | null>(null);
  const [subtipos, setSubtipos] = useState<DiagnosticoTipo[]>([]);
  const [subtipoSel, setSubtipoSel] = useState<DiagnosticoTipo | null>(null);
  const [campos, setCampos] = useState<CampoLabor[]>([]);

  const [loadingProgramas, setLoadingProgramas] = useState(false);
  const [loadingMonitoreos, setLoadingMonitoreos] = useState(false);
  const [loadingSubtipos, setLoadingSubtipos] = useState(false);
  const [loadingCampos, setLoadingCampos] = useState(false);

  const [modalCampo, setModalCampo] = useState(false);
  const [editCampo, setEditCampo] = useState<CampoLabor | null>(null);
  const [formCampo, setFormCampo] = useState(emptyFormCampo);
  const [guardandoCampo, setGuardandoCampo] = useState(false);

  useEffect(() => { cargarTipos(); }, []);

  useEffect(() => {
    if (mainTab === 'estructura' && programas.length === 0) cargarProgramas();
  }, [mainTab]);

  // ── TipoLabor CRUD ────────────────────────────────────────────────────────

  const cargarTipos = async () => {
    setLoadingTipos(true);
    try {
      const data = await tipoLaborService.obtenerTiposLabor();
      setTipos(Array.isArray(data) ? data : []);
    } catch { toast.error('Error al cargar tipos de labor'); }
    finally { setLoadingTipos(false); }
  };

  const abrirCrearTipo = () => {
    setEditandoId(null);
    setFormTipo({ nombre: '', descripcion: '' });
    setShowFormTipo(true);
  };

  const abrirEditarTipo = (tipo: any) => {
    setEditandoId(tipo.id);
    setFormTipo({ nombre: tipo.nombre || '', descripcion: tipo.descripcion || '' });
    setShowFormTipo(true);
  };

  const cancelarTipo = () => {
    setShowFormTipo(false);
    setEditandoId(null);
    setFormTipo({ nombre: '', descripcion: '' });
  };

  const guardarTipo = async () => {
    if (!formTipo.nombre.trim() || formTipo.nombre.trim().length < 3) {
      toast.error('El nombre debe tener al menos 3 caracteres');
      return;
    }
    setGuardandoTipo(true);
    try {
      const payload = {
        nombre: formTipo.nombre.trim(),
        descripcion: formTipo.descripcion.trim() || undefined,
      };
      if (editandoId) {
        const res = await fetch(`${API_BASE_URL}/tipos-labor/${editandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `Error ${res.status}`);
        }
        toast.success('Tipo de labor actualizado');
      } else {
        await tipoLaborService.crearTipoLabor(payload);
        toast.success('Tipo de labor creado');
      }
      await cargarTipos();
      cancelarTipo();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    } finally { setGuardandoTipo(false); }
  };

  const eliminarTipo = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar el tipo de labor "${nombre}"? Las labores asociadas quedarán sin tipo.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tipos-labor/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
      }
      setTipos(prev => prev.filter(t => t.id !== id));
      toast.success('Tipo de labor eliminado');
    } catch (e: any) { toast.error(e.message || 'Error al eliminar'); }
  };

  // ── Estructura por subtipo ────────────────────────────────────────────────

  const cargarProgramas = async () => {
    setLoadingProgramas(true);
    try {
      const data = await programaService.obtenerProgramas();
      setProgramas(Array.isArray(data) ? data : []);
    } catch { toast.error('Error al cargar programas'); }
    finally { setLoadingProgramas(false); }
  };

  const seleccionarPrograma = async (p: Programa) => {
    setProgramaSel(p);
    setMonitoreoSel(null);
    setSubtipoSel(null);
    setMonitoreos([]);
    setSubtipos([]);
    setCampos([]);
    setLoadingMonitoreos(true);
    try {
      const data = await monitoreoService.obtenerMonitoreosPorPrograma(p.id);
      setMonitoreos(Array.isArray(data) ? data : []);
    } catch { toast.error('Error al cargar monitoreos'); }
    finally { setLoadingMonitoreos(false); }
  };

  const seleccionarMonitoreo = async (m: Monitoreo) => {
    setMonitoreoSel(m);
    setSubtipoSel(null);
    setSubtipos([]);
    setCampos([]);
    setLoadingSubtipos(true);
    try {
      const data = await diagnosticoDinamicoService.listarSubtiposPorMonitoreo(m.id);
      setSubtipos(Array.isArray(data) ? data : []);
    } catch { toast.error('Error al cargar subtipos'); }
    finally { setLoadingSubtipos(false); }
  };

  const seleccionarSubtipo = async (s: DiagnosticoTipo) => {
    setSubtipoSel(s);
    await cargarCampos(s.id);
  };

  const cargarCampos = async (subtipoId: number) => {
    setLoadingCampos(true);
    try {
      const data = await diagnosticoDinamicoService.listarCamposLabor(subtipoId);
      setCampos(Array.isArray(data) ? data : []);
    } catch { toast.error('Error al cargar campos de labor'); }
    finally { setLoadingCampos(false); }
  };

  const abrirModalCampo = (campo?: CampoLabor) => {
    setEditCampo(campo || null);
    if (campo) {
      const opciones = campo.opciones || [];
      if (campo.tipo_dato === 'matrix' && typeof opciones === 'object' && !Array.isArray(opciones)) {
        const m = opciones as any;
        setFormCampo({
          nombre_campo: campo.nombre_campo, etiqueta: campo.etiqueta,
          tipo_dato: campo.tipo_dato, requerido: campo.requerido,
          opciones_texto: m.columnas?.join(', ') || '',
          filas_texto: m.filas?.join('\n') || '',
          tipo_celda: m.tipo_celda || 'boolean',
          orden: campo.orden,
          campo_padre_id: campo.campo_padre_id ?? null,
          opciones_padre_texto: campo.opciones_padre ? campo.opciones_padre.join(', ') : '',
        });
      } else {
        setFormCampo({
          nombre_campo: campo.nombre_campo, etiqueta: campo.etiqueta,
          tipo_dato: campo.tipo_dato, requerido: campo.requerido,
          opciones_texto: Array.isArray(opciones) ? opciones.join(', ') : '',
          filas_texto: '', tipo_celda: 'boolean',
          orden: campo.orden,
          campo_padre_id: campo.campo_padre_id ?? null,
          opciones_padre_texto: campo.opciones_padre ? campo.opciones_padre.join(', ') : '',
        });
      }
    } else {
      setFormCampo(emptyFormCampo);
    }
    setModalCampo(true);
  };

  const guardarCampo = async () => {
    if (!subtipoSel) return;
    if (!formCampo.etiqueta.trim()) { toast.error('La etiqueta es requerida'); return; }
    const esTipoLista = formCampo.tipo_dato === 'select' || formCampo.tipo_dato === 'multiselect';
    const esMatriz = formCampo.tipo_dato === 'matrix';
    let opciones: any = undefined;
    if (esMatriz) {
      const filas = formCampo.filas_texto.split('\n').map(s => s.trim()).filter(Boolean);
      const columnas = formCampo.opciones_texto.split(',').map(s => s.trim()).filter(Boolean);
      if (!filas.length) { toast.error('Agrega al menos una fila'); return; }
      if (!columnas.length) { toast.error('Agrega al menos una columna'); return; }
      opciones = { filas, columnas, tipo_celda: formCampo.tipo_celda || 'boolean' };
    } else if (esTipoLista) {
      opciones = formCampo.opciones_texto.split(',').map(s => s.trim()).filter(Boolean);
      if (!opciones.length) { toast.error('Agrega al menos una opción'); return; }
    }
    let opciones_padre: string[] | null = null;
    if (formCampo.campo_padre_id && formCampo.opciones_padre_texto.trim()) {
      const parsed = formCampo.opciones_padre_texto.split(',').map(s => s.trim()).filter(Boolean);
      if (!parsed.length) { toast.error('Especifica al menos un valor del padre'); return; }
      opciones_padre = parsed;
    }
    const nombre = formCampo.nombre_campo.trim() ||
      formCampo.etiqueta.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setGuardandoCampo(true);
    try {
      const payload = {
        nombre_campo: nombre,
        etiqueta: formCampo.etiqueta,
        tipo_dato: formCampo.tipo_dato,
        requerido: formCampo.requerido,
        opciones: (esTipoLista || esMatriz) ? opciones : undefined,
        orden: formCampo.orden,
        campo_padre_id: formCampo.campo_padre_id || null,
        opciones_padre,
      };
      if (editCampo) {
        await diagnosticoDinamicoService.actualizarCampoLabor(editCampo.id, payload);
        toast.success('Campo actualizado');
      } else {
        await diagnosticoDinamicoService.crearCampoLabor({ ...payload, subtipo_id: subtipoSel.id } as any);
        toast.success('Campo creado');
      }
      setModalCampo(false);
      await cargarCampos(subtipoSel.id);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e.message || 'Error al guardar campo');
    } finally { setGuardandoCampo(false); }
  };

  const eliminarCampo = async (campo: CampoLabor) => {
    if (!confirm(`¿Eliminar el campo "${campo.etiqueta}"?`)) return;
    try {
      await diagnosticoDinamicoService.eliminarCampoLabor(campo.id);
      toast.success('Campo eliminado');
      if (subtipoSel) await cargarCampos(subtipoSel.id);
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Error al eliminar'); }
  };

  const camposPadre = campos.filter(c =>
    c.tipo_dato === 'select' || c.tipo_dato === 'multiselect'
  ).filter(c => editCampo ? c.id !== editCampo.id : true);

  const campoPadreSeleccionado = camposPadre.find(c => c.id === formCampo.campo_padre_id);
  const esTipoListaActual = formCampo.tipo_dato === 'select' || formCampo.tipo_dato === 'multiselect';

  const getNombrePadre = (campo: CampoLabor): string | null => {
    if (!campo.campo_padre_id) return null;
    const padre = campos.find(c => c.id === campo.campo_padre_id);
    return padre ? padre.etiqueta : `Campo #${campo.campo_padre_id}`;
  };

  return (
    <div className="space-y-4">
      {/* Tabs principales */}
      <div className="flex border-b border-gray-200">
        <button onClick={() => setMainTab('tipos')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${mainTab === 'tipos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <i className="fas fa-tags mr-1.5"></i> Tipos de Labor
        </button>
        <button onClick={() => setMainTab('estructura')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${mainTab === 'estructura' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <i className="fas fa-layer-group mr-1.5"></i> Estructura por Subtipo
        </button>
      </div>

      {/* ── TAB 1: Tipos de Labor ─────────────────────────────────────────── */}
      {mainTab === 'tipos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Tipos de Labor</h2>
              <p className="text-sm text-gray-500">Categorías disponibles para clasificar las labores del sistema.</p>
            </div>
            <button onClick={abrirCrearTipo}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
              <i className="fas fa-plus"></i> Nuevo Tipo
            </button>
          </div>

          {showFormTipo && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-semibold text-blue-800 mb-4 text-sm">
                {editandoId ? 'Editar tipo de labor' : 'Nuevo tipo de labor'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input type="text" value={formTipo.nombre}
                    onChange={e => setFormTipo(p => ({ ...p, nombre: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Ej: Fumigación, Poda, Riego..." autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <input type="text" value={formTipo.descripcion}
                    onChange={e => setFormTipo(p => ({ ...p, descripcion: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Descripción opcional..." />
                </div>
              </div>
              <div className="flex gap-3 mt-4 justify-end">
                <button onClick={cancelarTipo} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={guardarTipo} disabled={guardandoTipo}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {guardandoTipo ? 'Guardando...' : (editandoId ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </div>
          )}

          {loadingTipos ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-500 text-sm">Cargando...</span>
            </div>
          ) : tipos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <i className="fas fa-tags text-3xl text-gray-300 block mb-3"></i>
              <p className="text-gray-500 font-medium">No hay tipos de labor registrados</p>
              <p className="text-gray-400 text-sm mt-1">Crea el primer tipo haciendo clic en "Nuevo Tipo"</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tipos.map(tipo => (
                    <tr key={tipo.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm font-mono text-gray-400">#{tipo.id}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                          <i className="fas fa-tag text-blue-500 text-xs"></i>
                          {tipo.nombre}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {tipo.descripcion || <span className="italic text-gray-300">Sin descripción</span>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => abrirEditarTipo(tipo)}
                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors" title="Editar">
                            <i className="fas fa-edit text-xs"></i>
                          </button>
                          <button onClick={() => eliminarTipo(tipo.id, tipo.nombre)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors" title="Eliminar">
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                {tipos.length} tipo(s) de labor registrado(s)
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Estructura por subtipo ────────────────────────────────── */}
      {mainTab === 'estructura' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Estructura de Labores por Subtipo</h2>
            <p className="text-sm text-gray-500 mt-1">
              <i className="fas fa-info-circle mr-1 text-blue-400"></i>
              Define campos adicionales que aparecerán en el formulario de labor para cada subtipo de diagnóstico específico.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

            {/* Panel 1: Programas */}
            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                <i className="fas fa-graduation-cap text-indigo-500"></i> Programa
              </h3>
              {loadingProgramas ? (
                <div className="flex justify-center py-6"><div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div></div>
              ) : programas.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No hay programas</p>
              ) : (
                <div className="space-y-1.5">
                  {programas.map(p => (
                    <button key={p.id} onClick={() => seleccionarPrograma(p)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition border ${programaSel?.id === p.id ? 'bg-indigo-50 border-indigo-400 font-medium text-indigo-700' : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 text-gray-700'}`}>
                      {p.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Panel 2: Monitoreos */}
            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                <i className="fas fa-leaf text-green-500"></i> Tipo de Monitoreo
              </h3>
              {!programaSel ? (
                <div className="text-center py-6 text-gray-400 text-xs"><i className="fas fa-hand-pointer text-xl block mb-1"></i>Selecciona un programa</div>
              ) : loadingMonitoreos ? (
                <div className="flex justify-center py-6"><div className="animate-spin h-5 w-5 border-2 border-green-500 border-t-transparent rounded-full"></div></div>
              ) : monitoreos.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Sin monitoreos definidos</p>
              ) : (
                <div className="space-y-1.5">
                  {monitoreos.map(m => (
                    <button key={m.id} onClick={() => seleccionarMonitoreo(m)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition border ${monitoreoSel?.id === m.id ? 'bg-green-50 border-green-400 font-medium text-green-700' : 'border-gray-100 hover:border-green-200 hover:bg-green-50 text-gray-700'}`}>
                      {m.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Panel 3: Subtipos */}
            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
                <i className="fas fa-sitemap text-blue-500"></i> Subtipo
              </h3>
              {!monitoreoSel ? (
                <div className="text-center py-6 text-gray-400 text-xs"><i className="fas fa-hand-pointer text-xl block mb-1"></i>Selecciona un monitoreo</div>
              ) : loadingSubtipos ? (
                <div className="flex justify-center py-6"><div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div></div>
              ) : subtipos.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Sin subtipos definidos</p>
              ) : (
                <div className="space-y-1.5">
                  {subtipos.map(s => (
                    <button key={s.id} onClick={() => seleccionarSubtipo(s)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition border ${subtipoSel?.id === s.id ? 'bg-blue-50 border-blue-400 font-medium text-blue-700' : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-gray-700'}`}>
                      <span>{s.nombre}</span>
                      {!s.activo && <span className="text-xs text-gray-400 ml-1">(inactivo)</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Panel 4: Campos de labor */}
            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-1.5">
                  <i className="fas fa-tools text-blue-500"></i>
                  {subtipoSel ? <span className="text-blue-600">{subtipoSel.nombre}</span> : 'Campos'}
                </h3>
                {subtipoSel && (
                  <button onClick={() => abrirModalCampo()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1">
                    <i className="fas fa-plus"></i> Nuevo
                  </button>
                )}
              </div>
              {!subtipoSel ? (
                <div className="text-center py-6 text-gray-400 text-xs"><i className="fas fa-hand-pointer text-xl block mb-1"></i>Selecciona un subtipo</div>
              ) : loadingCampos ? (
                <div className="flex justify-center py-6"><div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div></div>
              ) : campos.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs">
                  <i className="fas fa-inbox text-xl block mb-1"></i>
                  Sin campos adicionales.<br />
                  <button onClick={() => abrirModalCampo()} className="text-blue-500 hover:underline mt-1">Agregar campo</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {campos.map(campo => {
                    const nombrePadre = getNombrePadre(campo);
                    return (
                      <div key={campo.id} className="border border-gray-200 rounded-lg p-2.5 bg-white">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-800 truncate">{campo.etiqueta}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{TIPOS_DATO_LABELS[campo.tipo_dato] || campo.tipo_dato}</span>
                              {campo.requerido && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Requerido</span>}
                              {nombrePadre && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded"><i className="fas fa-code-branch mr-0.5"></i>Condicional</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => abrirModalCampo(campo)} className="text-blue-500 hover:text-blue-700 p-1 rounded"><i className="fas fa-edit text-xs"></i></button>
                            <button onClick={() => eliminarCampo(campo)} className="text-red-500 hover:text-red-700 p-1 rounded"><i className="fas fa-trash text-xs"></i></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-gray-400 text-center pt-1">{campos.length} campo(s) adicional(es)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal campo */}
      {modalCampo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-1">{editCampo ? 'Editar Campo' : 'Nuevo Campo'}</h3>
            <p className="text-xs text-gray-500 mb-4">
              <i className="fas fa-tools text-blue-400 mr-1"></i>
              Campo de labor — <span className="font-medium">{subtipoSel?.nombre}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Etiqueta (visible al usuario) *</label>
                <input value={formCampo.etiqueta} onChange={e => setFormCampo(p => ({ ...p, etiqueta: e.target.value }))}
                  className="w-full border rounded-lg p-2.5 text-sm" placeholder="Ej: Producto utilizado, Área aplicada..." autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de dato *</label>
                <select value={formCampo.tipo_dato} onChange={e => setFormCampo(p => ({ ...p, tipo_dato: e.target.value, campo_padre_id: null, opciones_padre_texto: '' }))}
                  className="w-full border rounded-lg p-2.5 text-sm">
                  {Object.entries(TIPOS_DATO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {esTipoListaActual && (
                <div>
                  <label className="block text-sm font-medium mb-1">Opciones (separadas por coma) *</label>
                  <input value={formCampo.opciones_texto} onChange={e => setFormCampo(p => ({ ...p, opciones_texto: e.target.value }))}
                    className="w-full border rounded-lg p-2.5 text-sm" placeholder="Ej: Alto, Medio, Bajo" />
                </div>
              )}
              {formCampo.tipo_dato === 'matrix' && (
                <div className="space-y-3 border border-purple-200 bg-purple-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-purple-700"><i className="fas fa-table mr-1"></i>Configuración de Matriz</p>
                  <div>
                    <label className="block text-sm font-medium mb-1">Filas (una por línea) *</label>
                    <textarea value={formCampo.filas_texto} onChange={e => setFormCampo(p => ({ ...p, filas_texto: e.target.value }))}
                      className="w-full border rounded-lg p-2.5 text-sm" rows={4} placeholder="Fila 1&#10;Fila 2&#10;Fila 3" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Columnas (separadas por coma) *</label>
                    <input value={formCampo.opciones_texto} onChange={e => setFormCampo(p => ({ ...p, opciones_texto: e.target.value }))}
                      className="w-full border rounded-lg p-2.5 text-sm" placeholder="Col A, Col B, Col C" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo de celda *</label>
                    <select value={formCampo.tipo_celda} onChange={e => setFormCampo(p => ({ ...p, tipo_celda: e.target.value }))}
                      className="w-full border rounded-lg p-2.5 text-sm">
                      <option value="boolean">Presencia (Checkbox)</option>
                      <option value="number">Número</option>
                      <option value="text">Texto</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 space-y-3">
                <p className="text-xs font-semibold text-yellow-700"><i className="fas fa-code-branch mr-1"></i>Visibilidad condicional (opcional)</p>
                <div>
                  <label className="block text-sm font-medium mb-1">Depende del campo</label>
                  {camposPadre.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No hay campos de tipo Lista en este subtipo aún.</p>
                  ) : (
                    <select value={formCampo.campo_padre_id?.toString() || ''}
                      onChange={e => setFormCampo(p => ({ ...p, campo_padre_id: e.target.value ? parseInt(e.target.value) : null, opciones_padre_texto: '' }))}
                      className="w-full border rounded-lg p-2.5 text-sm">
                      <option value="">Ninguno (siempre visible)</option>
                      {camposPadre.map(c => (
                        <option key={c.id} value={c.id.toString()}>{c.etiqueta}</option>
                      ))}
                    </select>
                  )}
                </div>
                {formCampo.campo_padre_id && campoPadreSeleccionado && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Mostrar cuando el valor sea *</label>
                    <input value={formCampo.opciones_padre_texto}
                      onChange={e => setFormCampo(p => ({ ...p, opciones_padre_texto: e.target.value }))}
                      placeholder={`Ej: ${Array.isArray(campoPadreSeleccionado.opciones) ? campoPadreSeleccionado.opciones.slice(0, 2).join(', ') : ''}`}
                      className="w-full border rounded-lg p-2.5 text-sm" />
                    {campoPadreSeleccionado.opciones && Array.isArray(campoPadreSeleccionado.opciones) && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {campoPadreSeleccionado.opciones.map((op: string) => (
                          <button key={op} type="button"
                            onClick={() => {
                              const current = formCampo.opciones_padre_texto.split(',').map(s => s.trim()).filter(Boolean);
                              if (!current.includes(op)) setFormCampo(p => ({ ...p, opciones_padre_texto: [...current, op].join(', ') }));
                            }}
                            className="text-xs bg-white border border-gray-300 hover:border-yellow-500 px-2 py-0.5 rounded transition">
                            {op}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Orden</label>
                  <input type="number" value={formCampo.orden} onChange={e => setFormCampo(p => ({ ...p, orden: parseInt(e.target.value) || 0 }))}
                    className="w-full border rounded-lg p-2.5 text-sm" min={0} />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <input type="checkbox" id="req_labor" checked={formCampo.requerido} onChange={e => setFormCampo(p => ({ ...p, requerido: e.target.checked }))} className="w-4 h-4" />
                  <label htmlFor="req_labor" className="text-sm">Requerido</label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardarCampo} disabled={guardandoCampo}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium disabled:opacity-50">
                {guardandoCampo ? 'Guardando...' : (editCampo ? 'Guardar cambios' : 'Crear campo')}
              </button>
              <button onClick={() => setModalCampo(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-medium">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionTiposLabores;
