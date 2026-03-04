import type { Programa, Usuario, Granja } from '../types/granjaTypes';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'accept': 'application/json'
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

export const programaService = {
  async obtenerProgramas(skip: number = 0, limit: number = 100): Promise<Programa[]> {
    const response = await fetch(`${API_BASE_URL}/programas/?skip=${skip}&limit=${limit}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async obtenerProgramaPorId(id: number): Promise<Programa> {
    const response = await fetch(`${API_BASE_URL}/programas/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async crearPrograma(datosPrograma: Omit<Programa, 'id' | 'fecha_creacion'> & { granjas_ids?: number[] }): Promise<Programa> {
    const response = await fetch(`${API_BASE_URL}/programas/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(datosPrograma)
    });
    return handleResponse(response);
  },

  async actualizarPrograma(id: number, datosPrograma: Partial<Programa> & { granjas_ids?: number[] }): Promise<Programa> {
    const response = await fetch(`${API_BASE_URL}/programas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(datosPrograma)
    });
    return handleResponse(response);
  },

  async eliminarPrograma(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/programas/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
  },

  // Usuarios
  async asignarUsuario(programaId: number, usuarioId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/programas/${programaId}/usuarios`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ usuario_id: usuarioId })
    });
    if (!response.ok) throw new Error('Error al asignar usuario');
  },

  async obtenerUsuariosPorPrograma(programaId: number): Promise<Usuario[]> {
    const response = await fetch(`${API_BASE_URL}/programas/${programaId}/usuarios`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async removerUsuario(programaId: number, usuarioId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/programas/${programaId}/usuarios/${usuarioId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Error al remover usuario');
  },

  // Granjas
  async asignarGranja(programaId: number, granjaId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/programas/${programaId}/granjas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ granja_id: granjaId })
    });
    if (!response.ok) throw new Error('Error al asignar granja');
  },

  async obtenerGranjasPorPrograma(programaId: number): Promise<Granja[]> {
    const response = await fetch(`${API_BASE_URL}/programas/${programaId}/granjas`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Nuevo: Obtener programas filtrados por granja
  async obtenerProgramasPorGranja(granjaId: number): Promise<Programa[]> {
    const response = await fetch(`${API_BASE_URL}/programas/?granja_id=${granjaId}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async removerGranja(programaId: number, granjaId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/programas/${programaId}/granjas/${granjaId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Error al remover granja');
  }
};

export default programaService;