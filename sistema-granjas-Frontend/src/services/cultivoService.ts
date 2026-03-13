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
    let errorData: any = {};

    try {
      errorData = await response.json();
    } catch {
      throw new Error(`Error ${response.status}`);
    }

    // Manejo de errores de validación de FastAPI
    if (errorData.detail && Array.isArray(errorData.detail)) {
      const erroresPorCampo: Record<string, string> = {};

      errorData.detail.forEach((err: any) => {
        // FastAPI devuelve loc: ["body","campo"]
        const campo = Array.isArray(err.loc) ? err.loc.slice(-1)[0] : 'general';

        let mensaje = err.msg || 'Error de validación';

        // Limpiar el prefijo típico de Pydantic
        mensaje = mensaje.replace('Value error, ', '');

        erroresPorCampo[campo] = mensaje;
      });

      const error = new Error('Error de validación');
      (error as any).erroresValidacion = erroresPorCampo;

      throw error;
    }

    throw new Error(
      errorData.detail ||
      errorData.message ||
      `Error ${response.status}`
    );
  }

  return response.json();
};

export const cultivoService = {

  async obtenerCultivos(): Promise<CultivoEspecie[]> {
    const response = await fetch(`${API_BASE_URL}/cultivos/`, {
      headers: getHeaders()
    });

    return handleResponse(response);
  },

  async obtenerCultivoPorId(id: number): Promise<CultivoEspecie> {
    const response = await fetch(`${API_BASE_URL}/cultivos/${id}`, {
      headers: getHeaders()
    });

    return handleResponse(response);
  },

  async crearCultivo(datosCultivo: CultivoFormData): Promise<CultivoEspecie> {

    const payload = {
      nombre: datosCultivo.nombre,
      tipo: datosCultivo.tipo,
      descripcion: datosCultivo.descripcion || null,
      estado: datosCultivo.estado,
      granja_id: datosCultivo.granja_id
    };

    const response = await fetch(`${API_BASE_URL}/cultivos/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    return handleResponse(response);
  },

  async obtenerCultivosPorPrograma(programaId: number): Promise<CultivoEspecie[]> {
    try {
      const lotes = await loteService.obtenerLotesPorPrograma(programaId);

      const cultivoIds = [
        ...new Set(
          lotes
            .map(lote => lote.cultivo_id)
            .filter(Boolean)
        )
      ];

      if (cultivoIds.length === 0) return [];

      const promesas = cultivoIds.map(id =>
        this.obtenerCultivoPorId(id)
      );

      return await Promise.all(promesas);

    } catch (error) {
      console.error('Error obteniendo cultivos por programa:', error);
      return [];
    }
  },

  async actualizarCultivo(
    id: number,
    datosCultivo: Partial<CultivoFormData>
  ): Promise<CultivoEspecie> {

    const payload: any = {};

    if (datosCultivo.nombre !== undefined) payload.nombre = datosCultivo.nombre;
    if (datosCultivo.tipo !== undefined) payload.tipo = datosCultivo.tipo;
    if (datosCultivo.descripcion !== undefined) payload.descripcion = datosCultivo.descripcion;
    if (datosCultivo.estado !== undefined) payload.estado = datosCultivo.estado;
    if (datosCultivo.granja_id !== undefined) payload.granja_id = datosCultivo.granja_id;

    const response = await fetch(`${API_BASE_URL}/cultivos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    return handleResponse(response);
  },

  async eliminarCultivo(id: number): Promise<void> {

    const response = await fetch(`${API_BASE_URL}/cultivos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      let errorData: any = {};

      try {
        errorData = await response.json();
      } catch {
        throw new Error('Error al eliminar');
      }

      throw new Error(errorData.detail || 'Error al eliminar');
    }
  },

  async obtenerEstadisticas(): Promise<CultivoStats> {

    const cultivos = await this.obtenerCultivos();

    return {
      total: cultivos.length,
      agricolas: cultivos.filter(c => c.tipo === 'agricola').length,
      pecuarios: cultivos.filter(c => c.tipo === 'pecuario').length,
      activos: cultivos.filter(c => c.estado === 'activo').length
    };
  },

  async obtenerCultivosPorGranja(granjaId: number): Promise<CultivoEspecie[]> {

    const response = await fetch(`${API_BASE_URL}/cultivos/granja/${granjaId}`, {
      headers: getHeaders()
    });

    return handleResponse(response);
  },

  async obtenerCultivosPorTipo(tipo: string): Promise<CultivoEspecie[]> {

    const response = await fetch(`${API_BASE_URL}/cultivos/?tipo=${tipo}`, {
      headers: getHeaders()
    });

    return handleResponse(response);
  }

};

export default cultivoService;