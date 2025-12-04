import type { CultivoEspecie, CultivoFormData, CultivoStats } from '../types/cultivoTypes';

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

  // CREAR cultivo
  async crearCultivo(datosCultivo: CultivoFormData): Promise<CultivoEspecie> {
    const response = await fetch(`${API_BASE_URL}/cultivos/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(datosCultivo)
    });
    return handleResponse(response);
  },

  // ACTUALIZAR cultivo
  async actualizarCultivo(id: number, datosCultivo: Partial<CultivoFormData>): Promise<CultivoEspecie> {
    const response = await fetch(`${API_BASE_URL}/cultivos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(datosCultivo)
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
  
  // OBTENER estadísticas de cultivos
  async obtenerEstadisticas(): Promise<CultivoStats> {
    // Si tu backend no tiene este endpoint, lo podemos calcular en el frontend
    const cultivos = await this.obtenerCultivos();
    
    return {
      total: cultivos.length,
      agricolas: cultivos.filter(c => c.tipo === 'agricola').length,
      pecuarios: cultivos.filter(c => c.tipo === 'pecuario').length,
      activos: cultivos.filter(c => c.estado === 'activo').length,
      completados: cultivos.filter(c => c.estado === 'completado').length
    };
  },

  // ========== FILTROS ESPECIALES ==========
  
  // OBTENER cultivos por granja
  async obtenerCultivosPorGranja(granjaId: number): Promise<CultivoEspecie[]> {
    const response = await fetch(`${API_BASE_URL}/cultivos/?granja_id=${granjaId}`, {
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