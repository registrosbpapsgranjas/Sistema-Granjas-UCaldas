// src/services/programaService.ts
import type { Programa, Usuario, Granja } from '../types/granjaTypes';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Función para obtener headers con token
const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  
  console.log('🔑 DEBUG programaService - Token:', token?.substring(0, 20) + '...');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'accept': 'application/json'
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

export const programaService = {
  // ========== OPERACIONES CRUD BÁSICAS ==========
  
  // OBTENER todos los programas
  async obtenerProgramas(skip: number = 0, limit: number = 100): Promise<Programa[]> {
    try {
      console.log('🔍 Obteniendo programas...');
      const url = `${API_BASE_URL}/programas/?skip=${skip}&limit=${limit}`;
      console.log('📤 URL:', url);
      
      const response = await fetch(url, {
        headers: getHeaders()
      });
      
      console.log('📊 Status programas:', response.status);
      const data = await handleResponse(response);
      console.log('✅ Programas obtenidos:', data);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo programas:', error);
      throw error;
    }
  },

  // OBTENER programa por ID
  async obtenerProgramaPorId(id: number): Promise<Programa> {
    const response = await fetch(`${API_BASE_URL}/programas/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // CREAR programa
  async crearPrograma(datosPrograma: Omit<Programa, 'id' | 'fecha_creacion'>): Promise<Programa> {
    const response = await fetch(`${API_BASE_URL}/programas/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(datosPrograma)
    });
    return handleResponse(response);
  },

  // ACTUALIZAR programa
  async actualizarPrograma(id: number, datosPrograma: Partial<Programa>): Promise<Programa> {
    const response = await fetch(`${API_BASE_URL}/programas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(datosPrograma)
    });
    return handleResponse(response);
  },

  // ELIMINAR programa
  async eliminarPrograma(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/programas/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // ========== GESTIÓN DE USUARIOS ==========

  // ASIGNAR usuario a programa
  async asignarUsuario(programaId: number, usuarioId: number): Promise<void> {
    const url = `${API_BASE_URL}/programas/${programaId}/usuarios`;
    console.log('🔗 URL asignarUsuario:', url);
    console.log('📤 Body asignarUsuario:', { usuario_id: usuarioId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ usuario_id: usuarioId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response asignarUsuario:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // OBTENER usuarios del programa
  async obtenerUsuariosPorPrograma(programaId: number): Promise<Usuario[]> {
    const url = `${API_BASE_URL}/programas/${programaId}/usuarios`;
    console.log('🔗 URL obtenerUsuariosPorPrograma:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response obtenerUsuariosPorPrograma:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // DESASIGNAR usuario del programa
  async removerUsuario(programaId: number, usuarioId: number): Promise<void> {
    const url = `${API_BASE_URL}/programas/${programaId}/usuarios/${usuarioId}`;
    console.log('🔗 URL removerUsuario:', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response removerUsuario:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // ========== GESTIÓN DE GRANJAS ==========

  // ASIGNAR granja a programa
  async asignarGranja(programaId: number, granjaId: number): Promise<void> {
    const url = `${API_BASE_URL}/programas/${programaId}/granjas`;
    console.log('🔗 URL asignarGranja:', url);
    console.log('📤 Body asignarGranja:', { granja_id: granjaId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ granja_id: granjaId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response asignarGranja:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // OBTENER granjas del programa
  async obtenerGranjasPorPrograma(programaId: number): Promise<Granja[]> {
    const url = `${API_BASE_URL}/programas/${programaId}/granjas`;
    console.log('🔗 URL obtenerGranjasPorPrograma:', url);
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response obtenerGranjasPorPrograma:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // DESASIGNAR granja del programa
  async removerGranja(programaId: number, granjaId: number): Promise<void> {
    const url = `${API_BASE_URL}/programas/${programaId}/granjas/${granjaId}`;
    console.log('🔗 URL removerGranja:', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response removerGranja:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  }
};

// ========== ALIAS PARA MANTENER COMPATIBILIDAD ==========

// Alias para las funciones existentes
export const getProgramas = programaService.obtenerProgramas;
export const getPrograma = programaService.obtenerProgramaPorId;
export const createPrograma = programaService.crearPrograma;
export const updatePrograma = programaService.actualizarPrograma;
export const deletePrograma = programaService.eliminarPrograma;

// Alias para usuarios
export const asignarUsuarioAPrograma = programaService.asignarUsuario;
export const getUsuariosPorPrograma = programaService.obtenerUsuariosPorPrograma;
export const desasignarUsuarioDePrograma = programaService.removerUsuario;

// Alias para granjas
export const asignarGranjaAPrograma = programaService.asignarGranja;
export const getGranjasPorPrograma = programaService.obtenerGranjasPorPrograma;
export const desasignarGranjaDePrograma = programaService.removerGranja;

export default programaService;