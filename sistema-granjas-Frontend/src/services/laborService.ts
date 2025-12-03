// src/services/laborService.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Función para obtener headers con token
const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Función para manejar errores de respuesta
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error ${response.status}: ${response.statusText}`
    );
  }
  return response.json();
};

export const laborService = {
  // ========== OPERACIONES CRUD BÁSICAS ==========
  
  // OBTENER todas las labores
  async obtenerLabores(skip: number = 0, limit: number = 100): Promise<any[]> {
    try {
      console.log('🔍 Obteniendo labores...');
      const response = await fetch(`${API_BASE_URL}/labores/?skip=${skip}&limit=${limit}`, {
        headers: getHeaders()
      });
      
      console.log('📊 Status labores:', response.status);
      const data = await handleResponse(response);
      console.log('✅ Labores obtenidas:', data);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo labores:', error);
      throw error;
    }
  },

  // OBTENER labor por ID
  async obtenerLaborPorId(id: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/labores/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // CREAR labor
  async crearLabor(datosLabor: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/labores/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(datosLabor)
    });
    return handleResponse(response);
  },

  // ACTUALIZAR labor
  async actualizarLabor(id: number, datosLabor: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/labores/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(datosLabor)
    });
    return handleResponse(response);
  },

  // ELIMINAR labor
  async eliminarLabor(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/labores/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  }
};

// ========== ALIAS PARA MANTENER COMPATIBILIDAD ==========

// Alias para las funciones existentes
export const getLabores = laborService.obtenerLabores;
export const getLabor = laborService.obtenerLaborPorId;
export const createLabor = laborService.crearLabor;
export const updateLabor = laborService.actualizarLabor;
export const deleteLabor = laborService.eliminarLabor;

export default laborService;