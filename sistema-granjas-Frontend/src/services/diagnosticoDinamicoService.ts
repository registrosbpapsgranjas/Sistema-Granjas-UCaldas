import { api } from './api';

export interface DiagnosticoTipo {
  id: number;
  programa_id: number;
  monitoreo_id?: number | null;
  nombre: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
  patron_arvenses: boolean;
  created_at: string;
  campos?: DiagnosticoCampo[];
  campos_recomendacion?: CampoRecomendacion[];
}

export interface DiagnosticoCampo {
  id: number;
  tipo_id: number;
  nombre_campo: string;
  etiqueta: string;
  tipo_dato: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'textarea';
  requerido: boolean;
  opciones?: string[];
  orden: number;
  campo_padre_id?: number | null;
  opciones_padre?: string[] | null;
}

export interface CampoRecomendacion {
  id: number;
  subtipo_id: number;
  nombre_campo: string;
  etiqueta: string;
  tipo_dato: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'textarea';
  requerido: boolean;
  opciones?: string[];
  orden: number;
  campo_padre_id?: number | null;
  opciones_padre?: string[] | null;
}

export interface CampoLabor {
  id: number;
  subtipo_id: number;
  nombre_campo: string;
  etiqueta: string;
  tipo_dato: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'textarea' | 'matrix';
  requerido: boolean;
  opciones?: string[] | any;
  orden: number;
  campo_padre_id?: number | null;
  opciones_padre?: string[] | null;
}

export const diagnosticoDinamicoService = {
  // ── Tipos (subtipos de monitoreo) ──────────────────────────────────────────

  listarTiposPorPrograma: async (programaId: number): Promise<DiagnosticoTipo[]> => {
    const res = await api.get(`/diagnosticos-dinamico/programas/${programaId}/tipos`);
    return res.data;
  },

  listarSubtiposPorMonitoreo: async (monitoreoId: number): Promise<DiagnosticoTipo[]> => {
    const res = await api.get(`/diagnosticos-dinamico/monitoreos/${monitoreoId}/subtipos`);
    return res.data;
  },

  obtenerTipo: async (tipoId: number): Promise<DiagnosticoTipo> => {
    const res = await api.get(`/diagnosticos-dinamico/tipos/${tipoId}`);
    return res.data;
  },

  crearTipo: async (data: Omit<DiagnosticoTipo, 'id' | 'created_at'>): Promise<DiagnosticoTipo> => {
    const res = await api.post('/diagnosticos-dinamico/tipos', data);
    return res.data;
  },

  actualizarTipo: async (tipoId: number, data: Partial<DiagnosticoTipo>): Promise<DiagnosticoTipo> => {
    const res = await api.put(`/diagnosticos-dinamico/tipos/${tipoId}`, data);
    return res.data;
  },

  eliminarTipo: async (tipoId: number): Promise<void> => {
    await api.delete(`/diagnosticos-dinamico/tipos/${tipoId}`);
  },

  // ── Campos de diagnóstico ──────────────────────────────────────────────────

  listarCampos: async (tipoId: number): Promise<DiagnosticoCampo[]> => {
    const res = await api.get(`/diagnosticos-dinamico/tipos/${tipoId}/campos`);
    return res.data;
  },

  crearCampo: async (data: Omit<DiagnosticoCampo, 'id'>): Promise<DiagnosticoCampo> => {
    const res = await api.post('/diagnosticos-dinamico/campos', data);
    return res.data;
  },

  actualizarCampo: async (campoId: number, data: Partial<DiagnosticoCampo>): Promise<DiagnosticoCampo> => {
    const res = await api.put(`/diagnosticos-dinamico/campos/${campoId}`, data);
    return res.data;
  },

  eliminarCampo: async (campoId: number): Promise<void> => {
    await api.delete(`/diagnosticos-dinamico/campos/${campoId}`);
  },

  // ── Campos de recomendación ────────────────────────────────────────────────

  listarCamposRecomendacion: async (subtipoId: number): Promise<CampoRecomendacion[]> => {
    const res = await api.get(`/diagnosticos-dinamico/tipos/${subtipoId}/campos-recomendacion`);
    return res.data;
  },

  crearCampoRecomendacion: async (data: Omit<CampoRecomendacion, 'id'>): Promise<CampoRecomendacion> => {
    const res = await api.post('/diagnosticos-dinamico/campos-recomendacion', data);
    return res.data;
  },

  actualizarCampoRecomendacion: async (campoId: number, data: Partial<CampoRecomendacion>): Promise<CampoRecomendacion> => {
    const res = await api.put(`/diagnosticos-dinamico/campos-recomendacion/${campoId}`, data);
    return res.data;
  },

  eliminarCampoRecomendacion: async (campoId: number): Promise<void> => {
    await api.delete(`/diagnosticos-dinamico/campos-recomendacion/${campoId}`);
  },

  // ── Campos de labor ────────────────────────────────────────────────────────

  listarCamposLabor: async (subtipoId: number): Promise<CampoLabor[]> => {
    const res = await api.get(`/diagnosticos-dinamico/tipos/${subtipoId}/campos-labor`);
    return res.data;
  },

  crearCampoLabor: async (data: Omit<CampoLabor, 'id'>): Promise<CampoLabor> => {
    const res = await api.post('/diagnosticos-dinamico/campos-labor', data);
    return res.data;
  },

  actualizarCampoLabor: async (campoId: number, data: Partial<CampoLabor>): Promise<CampoLabor> => {
    const res = await api.put(`/diagnosticos-dinamico/campos-labor/${campoId}`, data);
    return res.data;
  },

  eliminarCampoLabor: async (campoId: number): Promise<void> => {
    await api.delete(`/diagnosticos-dinamico/campos-labor/${campoId}`);
  },
};
