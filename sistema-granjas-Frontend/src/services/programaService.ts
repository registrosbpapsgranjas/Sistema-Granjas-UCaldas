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

  // Obtener programas con sus granjas
  async obtenerProgramasConGranjas(skip: number = 0, limit: number = 100): Promise<Programa[]> {
    try {
      const programas = await this.obtenerProgramas(skip, limit);
      
      const programasConGranjas = await Promise.all(
        programas.map(async (programa) => {
          try {
            const granjas = await this.obtenerGranjasPorPrograma(programa.id);
            return {
              ...programa,
              granjas: granjas || []
            };
          } catch (error) {
            console.error(`Error al obtener granjas para programa ${programa.id}:`, error);
            return {
              ...programa,
              granjas: []
            };
          }
        })
      );
      
      return programasConGranjas;
    } catch (error) {
      console.error("Error al obtener programas con granjas:", error);
      throw error;
    }
  },

  // Obtener programas filtrados por granja con sus granjas
  async obtenerProgramasPorGranjaConGranjas(granjaId: number): Promise<Programa[]> {
    try {
      // Intentar usar el endpoint filtrado si existe
      let programas: Programa[];
      try {
        programas = await this.obtenerProgramasPorGranja(granjaId);
      } catch (error) {
        console.log("Endpoint filtrado no disponible, usando filtrado manual");
        const todosProgramas = await this.obtenerProgramas();
        programas = todosProgramas;
      }

      // Obtener granjas para cada programa
      const programasConGranjas = await Promise.all(
        programas.map(async (programa) => {
          try {
            const granjas = await this.obtenerGranjasPorPrograma(programa.id);
            return {
              ...programa,
              granjas: granjas || []
            };
          } catch (error) {
            console.error(`Error al obtener granjas para programa ${programa.id}:`, error);
            return {
              ...programa,
              granjas: []
            };
          }
        })
      );

      // Si no hay endpoint filtrado, filtrar manualmente
      if (!programas.length || programas.length === (await this.obtenerProgramas()).length) {
        const asignaciones = await this.obtenerTodasLasAsignaciones();
        const programasFiltrados = programasConGranjas.filter(programa =>
          asignaciones.some(a => a.programa_id === programa.id && a.granja_id === granjaId)
        );
        return programasFiltrados;
      }

      return programasConGranjas;
    } catch (error) {
      console.error("Error al obtener programas por granja con granjas:", error);
      throw error;
    }
  },

  // Obtener todas las asignaciones programa-granja
  async obtenerTodasLasAsignaciones(): Promise<{ programa_id: number; granja_id: number }[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/asignaciones/programas-granjas`, {
        headers: getHeaders()
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Error al obtener asignaciones:", error);
      return [];
    }
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