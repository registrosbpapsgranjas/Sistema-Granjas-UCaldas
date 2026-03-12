import type { CultivoEspecie, CultivoFormData, CultivoStats } from '../types/cultivoTypes';
import loteService from './loteService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.message || `Error ${response.status}: ${response.statusText}`
    );
  }
  return response.json();
};

export const cultivoService = {
  // ========== CRUD OPERACIONES ==========

  // OBTENER todos los cultivos
  async obtenerCultivos(): Promise<CultivoEspecie[]> {
    const response = await fetch(`${API_BASE_URL}/cultivos/`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // OBTENER cultivo por ID
  async obtenerCultivoPorId(id: number): Promise<CultivoEspecie> {
    const response = await fetch(`${API_BASE_URL}/cultivos/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // CREAR cultivo - SIN fecha_inicio NI duracion_dias
  async crearCultivo(datosCultivo: CultivoFormData): Promise<CultivoEspecie> {
    const payload = {
      nombre: datosCultivo.nombre,
      tipo: datosCultivo.tipo,
      descripcion: datosCultivo.descripcion || null,
      estado: datosCultivo.estado,
      granja_id: datosCultivo.granja_id
      // No se envían fecha_inicio ni duracion_dias
    };

    const response = await fetch(`${API_BASE_URL}/cultivos/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },

  // ✅ NUEVA FUNCIÓN: Obtener cultivos por programa (a través de lotes)
  async obtenerCultivosPorPrograma(programaId: number): Promise<CultivoEspecie[]> {
    try {
      // 1. Obtener todos los lotes del programa
      const lotes = await loteService.obtenerLotesPorPrograma(programaId);

      // 2. Extraer IDs únicos de cultivos de esos lotes
      const cultivoIds = [...new Set(lotes.map(lote => lote.cultivo_id).filter(Boolean))];

      if (cultivoIds.length === 0) return [];

      // 3. Obtener los cultivos por sus IDs
      const promesas = cultivoIds.map(id => this.obtenerCultivoPorId(id));
      const cultivos = await Promise.all(promesas);

      return cultivos;
    } catch (error) {
      console.error('Error obteniendo cultivos por programa:', error);
      return [];
    }
  },

  // ACTUALIZAR cultivo - SIN fecha_inicio NI duracion_dias
  async actualizarCultivo(id: number, datosCultivo: Partial<CultivoFormData>): Promise<CultivoEspecie> {
    const payload: any = {};
    
    if (datosCultivo.nombre !== undefined) payload.nombre = datosCultivo.nombre;
    if (datosCultivo.tipo !== undefined) payload.tipo = datosCultivo.tipo;
    if (datosCultivo.descripcion !== undefined) payload.descripcion = datosCultivo.descripcion;
    if (datosCultivo.estado !== undefined) payload.estado = datosCultivo.estado;
    if (datosCultivo.granja_id !== undefined) payload.granja_id = datosCultivo.granja_id;
    // No se incluyen fecha_inicio ni duracion_dias

    const response = await fetch(`${API_BASE_URL}/cultivos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },

  // ELIMINAR cultivo
  async eliminarCultivo(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/cultivos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // ========== ESTADÍSTICAS ==========

  // OBTENER estadísticas de cultivos - SIN completados
  async obtenerEstadisticas(): Promise<CultivoStats> {
    const cultivos = await this.obtenerCultivos();

    return {
      total: cultivos.length,
      agricolas: cultivos.filter(c => c.tipo === 'agricola').length,
      pecuarios: cultivos.filter(c => c.tipo === 'pecuario').length,
      activos: cultivos.filter(c => c.estado === 'activo').length
      // Eliminado: completados
    };
  },

  // ========== FILTROS ESPECIALES ==========

  // OBTENER cultivos por granja (usando endpoint específico)
  async obtenerCultivosPorGranja(granjaId: number): Promise<CultivoEspecie[]> {
    const response = await fetch(`${API_BASE_URL}/cultivos/granja/${granjaId}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // OBTENER cultivos por tipo
  async obtenerCultivosPorTipo(tipo: string): Promise<CultivoEspecie[]> {
    const response = await fetch(`${API_BASE_URL}/cultivos/?tipo=${tipo}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

// Alias para compatibilidad
export const getCultivos = cultivoService.obtenerCultivos;
export const getCultivoById = cultivoService.obtenerCultivoPorId;
export const createCultivo = cultivoService.crearCultivo;
export const updateCultivo = cultivoService.actualizarCultivo;
export const deleteCultivo = cultivoService.eliminarCultivo;
export const getCultivosPorGranja = cultivoService.obtenerCultivosPorGranja;
export const getEstadisticasCultivos = cultivoService.obtenerEstadisticas;

export default cultivoService;