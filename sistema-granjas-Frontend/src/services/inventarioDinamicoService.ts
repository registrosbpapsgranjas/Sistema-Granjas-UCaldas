// src/services/inventarioDinamicoService.ts
import { api } from './api';
import type {
  TipoInventario,
  Campo,
  ItemInventario,
  TipoConCampos,
  TipoConItems,
} from '../types/inventarioDinamicoTypes';

const BASE = '/inventario-dinamico';

export const inventarioDinamicoService = {
  // Tipos de inventario
  async listarTipos(programaId: number): Promise<TipoInventario[]> {
    const res = await api.get(`${BASE}/programas/${programaId}/tipos`);
    return res.data;
  },
  async crearTipo(data: { programa_id: number; nombre: string; descripcion?: string; orden?: number }): Promise<TipoInventario> {
    const res = await api.post(`${BASE}/tipos`, data);
    return res.data;
  },
  async actualizarTipo(id: number, data: Partial<TipoInventario>): Promise<TipoInventario> {
    const res = await api.put(`${BASE}/tipos/${id}`, data);
    return res.data;
  },
  async eliminarTipo(id: number): Promise<void> {
    await api.delete(`${BASE}/tipos/${id}`);
  },

  // Campos
  async listarCampos(tipoId: number): Promise<Campo[]> {
    const res = await api.get(`${BASE}/tipos/${tipoId}/campos`);
    return res.data;
  },
  async crearCampo(data: {
    tipo_id: number;
    nombre_campo: string;
    tipo_dato: Campo['tipo_dato'];
    requerido?: boolean;
    opciones?: string[];
    orden?: number;
    ancho?: string;
  }): Promise<Campo> {
    const res = await api.post(`${BASE}/campos`, data);
    return res.data;
  },
  async actualizarCampo(id: number, data: Partial<Campo>): Promise<Campo> {
    const res = await api.put(`${BASE}/campos/${id}`, data);
    return res.data;
  },
  async eliminarCampo(id: number): Promise<void> {
    await api.delete(`${BASE}/campos/${id}`);
  },

  // Items
  async listarItems(tipoId: number, skip = 0, limit = 500): Promise<ItemInventario[]> {
    const res = await api.get(`${BASE}/tipos/${tipoId}/items`, { params: { skip, limit } });
    return res.data;
  },

  async listarTodosItemsPrograma(programaId: number): Promise<ItemInventario[]> {
    const res = await api.get(`${BASE}/programas/${programaId}/items-planos`);
    return res.data;
  },
  async obtenerTipoCompleto(tipoId: number): Promise<TipoConItems> {
    const res = await api.get(`${BASE}/tipos/${tipoId}/completo`);
    return res.data;
  },
  async crearItem(data: {
    tipo_id: number;
    fecha_inventario: string;
    cantidad_disponible: number;
    unidad_medida?: string;
    valores: Record<string, any>;
    observaciones?: string;
  }): Promise<ItemInventario> {
    const res = await api.post(`${BASE}/items`, data);
    return res.data;
  },
  async actualizarItem(id: number, data: Partial<ItemInventario>): Promise<ItemInventario> {
    const res = await api.put(`${BASE}/items/${id}`, data);
    return res.data;
  },
  async eliminarItem(id: number): Promise<void> {
    await api.delete(`${BASE}/items/${id}`);
  },
};