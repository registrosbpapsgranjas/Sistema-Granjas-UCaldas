import type { Granja, Usuario, Programa } from '../types/granjaTypes';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Función para obtener headers con token
const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  
  console.log('🔑 DEBUG granjaService - Token en localStorage:', token);
  console.log('🔑 DEBUG granjaService - Token length:', token?.length);
  console.log('🔑 DEBUG granjaService - Token primeros 20 chars:', token?.substring(0, 20));
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 DEBUG granjaService - Headers con token:', headers);
  } else {
    console.warn('⚠️ DEBUG granjaService: No hay token en localStorage');
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

export const granjaService = {
  // ========== OPERACIONES CRUD BÁSICAS ==========
  
  // OBTENER todas las granjas
  async obtenerGranjas(): Promise<Granja[]> {
    try {
      console.log('🔍 DEBUG Iniciando obtenerGranjas...');
      const url = `${API_BASE_URL}/granjas`;
      console.log('📤 DEBUG URL granjas:', url);
      
      const headers = getHeaders();
      console.log('📋 DEBUG Headers granjas:', headers);
      console.log('🔑 DEBUG Token para granjas:', localStorage.getItem('authToken'));
      
      const response = await fetch(url, {
        headers: headers
      });
      
      console.log('📊 DEBUG Response status granjas:', response.status);
      console.log('📊 DEBUG Response headers granjas:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ DEBUG Error response granjas:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ DEBUG Granjas obtenidas:', data);
      return data;
    } catch (error) {
      console.error('❌ DEBUG Error completo obteniendo granjas:', error);
      throw error;
    }
  },

  // OBTENER granja por ID
  async obtenerGranjaPorId(id: number): Promise<Granja> {
    const response = await fetch(`${API_BASE_URL}/granjas/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // CREAR granja
  async crearGranja(datosGranja: Omit<Granja, 'id' | 'fecha_creacion'>): Promise<Granja> {
    const response = await fetch(`${API_BASE_URL}/granjas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(datosGranja)
    });
    return handleResponse(response);
  },

  // ACTUALIZAR granja
  async actualizarGranja(id: number, datosGranja: Partial<Granja>): Promise<Granja> {
    const response = await fetch(`${API_BASE_URL}/granjas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(datosGranja)
    });
    return handleResponse(response);
  },

  // ELIMINAR granja
  async eliminarGranja(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/granjas/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // ========== GESTIÓN DE USUARIOS ==========

  // OBTENER todos los usuarios
  async obtenerUsuarios(): Promise<Usuario[]> {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // OBTENER usuarios por granja
  async obtenerUsuariosPorGranja(granjaId: number): Promise<Usuario[]> {
    const url = `${API_BASE_URL}/granjas/${granjaId}/usuarios`;
    console.log('🔗 DEBUG URL obtenerUsuariosPorGranja:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DEBUG Error response obtenerUsuariosPorGranja:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // ASIGNAR usuario a granja
  async asignarUsuario(granjaId: number, usuarioId: number): Promise<void> {
    const url = `${API_BASE_URL}/granjas/${granjaId}/usuarios`;
    console.log('🔗 DEBUG URL asignarUsuario:', url);
    console.log('📤 DEBUG Body asignarUsuario:', { usuario_id: usuarioId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ usuario_id: usuarioId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DEBUG Error response asignarUsuario:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // REMOVER usuario de granja - CORREGIDO: id en URL
  async removerUsuario(granjaId: number, usuarioId: number): Promise<void> {
    const url = `${API_BASE_URL}/granjas/${granjaId}/usuarios/${usuarioId}`; // <-- USUARIO_ID EN URL
    console.log('🔗 DEBUG URL removerUsuario (CORREGIDO):', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
      // SIN BODY - el usuarioId está en la URL
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DEBUG Error response removerUsuario:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // ========== GESTIÓN DE PROGRAMAS ==========

  // OBTENER todos los programas
  async obtenerProgramas(): Promise<Programa[]> {
    const response = await fetch(`${API_BASE_URL}/programas`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // OBTENER programas por granja
  async obtenerProgramasPorGranja(granjaId: number): Promise<Programa[]> {
    const url = `${API_BASE_URL}/granjas/${granjaId}/programas`;
    console.log('🔗 DEBUG URL obtenerProgramasPorGranja:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DEBUG Error response obtenerProgramasPorGranja:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // ASIGNAR programa a granja
  async asignarPrograma(granjaId: number, programaId: number): Promise<void> {
    const url = `${API_BASE_URL}/granjas/${granjaId}/programas`;
    console.log('🔗 DEBUG URL asignarPrograma:', url);
    console.log('📤 DEBUG Body asignarPrograma:', { programa_id: programaId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ programa_id: programaId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DEBUG Error response asignarPrograma:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // REMOVER programa de granja - CORREGIDO: id en URL
  async removerPrograma(granjaId: number, programaId: number): Promise<void> {
    const url = `${API_BASE_URL}/granjas/${granjaId}/programas/${programaId}`; // <-- PROGRAMA_ID EN URL
    console.log('🔗 DEBUG URL removerPrograma (CORREGIDO):', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
      // SIN BODY - el programaId está en la URL
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DEBUG Error response removerPrograma:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  }
};

// ========== ALIAS PARA MANTENER COMPATIBILIDAD ==========

// Alias para las funciones existentes
export const getGranjas = granjaService.obtenerGranjas;
export const getGranjaById = granjaService.obtenerGranjaPorId;
export const createGranja = granjaService.crearGranja;
export const updateGranja = granjaService.actualizarGranja;
export const deleteGranja = granjaService.eliminarGranja;

// Alias para usuarios
export const getUsuarios = granjaService.obtenerUsuarios;
export const getUsuariosPorGranja = granjaService.obtenerUsuariosPorGranja;
export const asignarUsuarioAGranja = granjaService.asignarUsuario;
export const desasignarUsuarioDeGranja = granjaService.removerUsuario;

// Alias para programas
export const getProgramas = granjaService.obtenerProgramas;
export const getProgramasPorGranja = granjaService.obtenerProgramasPorGranja;
export const asignarProgramaAGranja = granjaService.asignarPrograma;
export const desasignarProgramaDeGranja = granjaService.removerPrograma;

export default granjaService;