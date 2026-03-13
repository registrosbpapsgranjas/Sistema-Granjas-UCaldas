import type { Granja, Usuario, Programa } from '../types/granjaTypes';

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
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (data?.detail) {
      if (Array.isArray(data.detail)) {
        const mensaje = data.detail.map((e: any) => e.msg).join(', ');
        throw new Error(mensaje);
      }

      throw new Error(data.detail);
    }

    throw new Error(data?.message || `Error ${response.status}`);
  }

  return data;
};

export const granjaService = {
  async obtenerGranjas(): Promise<Granja[]> {
    const response = await fetch(`${API_BASE_URL}/granjas`, {
      headers: getHeaders()
    });

    return handleResponse(response);
  },

  async obtenerGranjaPorId(id: number): Promise<Granja> {
    const response = await fetch(`${API_BASE_URL}/granjas/${id}`, {
      headers: getHeaders()
    });

    return handleResponse(response);
  },

  async crearGranja(datos: Omit<Granja, 'id' | 'fecha_creacion'>): Promise<Granja> {
    const response = await fetch(`${API_BASE_URL}/granjas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });

    return handleResponse(response);
  },

  async actualizarGranja(id: number, datos: Partial<Granja>): Promise<Granja> {
    const response = await fetch(`${API_BASE_URL}/granjas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });

    return handleResponse(response);
  },

  async eliminarGranja(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/granjas/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }
  },

  async obtenerUsuarios(): Promise<Usuario[]> {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      headers: getHeaders()
    });

    return handleResponse(response);
  },

  async obtenerUsuariosPorGranja(granjaId: number): Promise<Usuario[]> {
    const response = await fetch(`${API_BASE_URL}/granjas/${granjaId}/usuarios`, {
      headers: getHeaders()
    });

    return handleResponse(response);
  },

  async asignarUsuario(granjaId: number, usuarioId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/granjas/${granjaId}/usuarios`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ usuario_id: usuarioId })
    });

    await handleResponse(response);
  },

  async removerUsuario(granjaId: number, usuarioId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/granjas/${granjaId}/usuarios/${usuarioId}`,
      {
        method: 'DELETE',
        headers: getHeaders()
      }
    );

    if (!response.ok) {
      throw new Error('Error al remover usuario');
    }
  },

  async obtenerProgramas(): Promise<Programa[]> {
    const response = await fetch(`${API_BASE_URL}/programas`, {
      headers: getHeaders()
    });

    return handleResponse(response);
  },

  async obtenerProgramasPorGranja(granjaId: number): Promise<Programa[]> {
    const response = await fetch(`${API_BASE_URL}/granjas/${granjaId}/programas`, {
      headers: getHeaders()
    });

    return handleResponse(response);
  },

  async asignarPrograma(granjaId: number, programaId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/granjas/${granjaId}/programas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ programa_id: programaId })
    });

    await handleResponse(response);
  },

  async removerPrograma(granjaId: number, programaId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/granjas/${granjaId}/programas/${programaId}`,
      {
        method: 'DELETE',
        headers: getHeaders()
      }
    );

    if (!response.ok) {
      throw new Error('Error al remover programa');
    }
  }
};

export default granjaService;