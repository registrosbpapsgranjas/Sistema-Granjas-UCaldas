import type { 
  DiagnosticoItem, 
  Diagnostico,
  CrearDiagnosticoDTO, 
  AsignarDocenteDTO, 
  ActualizarDiagnosticoDTO,
  EstadisticasDiagnostico,
  DiagnosticoFiltros,
  ArchivoEvidencia,
  Evidencia,
  CrearEvidenciaDTO,
  DiagnosticoDetalle
} from '../types/diagnosticoTypes';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Headers con token
const getHeaders = (multipart = false): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {};
  
  if (!multipart) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return headers;
};

// Manejo de errores
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.message || `Error ${response.status}: ${response.statusText}`
    );
  }
  return response.json();
};

// Servicio general
export const diagnosticoService = {

  // ===================== CRUD =====================

  async obtenerDiagnosticos(filtros?: DiagnosticoFiltros): Promise<DiagnosticoItem[]> {
    const params = new URLSearchParams();
    
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const url = `${API_BASE_URL}/diagnosticos${params.toString() ? `?${params}` : ''}`;
    
    const response = await fetch(url, { headers: getHeaders() });    
    return handleResponse(response);
  },

  async obtenerDiagnosticoPorId(id: number): Promise<DiagnosticoDetalle> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async crearDiagnostico(datos: CrearDiagnosticoDTO): Promise<DiagnosticoItem> {
    // Si trae evidencias iniciales, subirlas primero
    if (datos.evidencias?.length) {
      const evidenciasSubidas = await Promise.all(
        datos.evidencias.map(async (ev) => {
          const formData = new FormData();
          formData.append('file', ev.file);

          const uploadRes = await fetch(`${API_BASE_URL}/files/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
          });

          const fileData = await handleResponse(uploadRes);

          return {
            tipo: ev.tipo,
            descripcion: ev.descripcion,
            url_archivo: fileData.url
          };
        })
      );

      datos = { ...datos, evidencias: evidenciasSubidas as any };
    }

    const response = await fetch(`${API_BASE_URL}/diagnosticos/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });

    return handleResponse(response);
  },

  async actualizarDiagnostico(id: number, datos: ActualizarDiagnosticoDTO): Promise<DiagnosticoItem> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });
    return handleResponse(response);
  },

  async eliminarDiagnostico(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Error eliminando diagnóstico');
    }
  },

  // ===================== ACCIONES ESPECIALES =====================

  async asignarDocente(id: number, docenteId: number): Promise<DiagnosticoItem> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/${id}/asignar-docente`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ docente_id: docenteId })
    });
    return handleResponse(response);
  },

  async cerrarDiagnostico(id: number): Promise<DiagnosticoItem> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/${id}/cerrar`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async obtenerEstadisticas(): Promise<EstadisticasDiagnostico> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/estadisticas/resumen`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // ===================== EVIDENCIAS =====================

  async agregarEvidencia(
    diagnosticoId: number, 
    file: File, 
    descripcion: string,
    tipo: string = 'imagen'
  ): Promise<Evidencia> {
    try {
      // 1. Subir archivo
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const err = await uploadResponse.json();
        throw new Error(err.detail || 'Error subiendo archivo');
      }

      const uploadResult = await uploadResponse.json();

      // 2. Crear evidencia
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const evidenciaData: CrearEvidenciaDTO = {
        tipo,
        descripcion,
        url_archivo: uploadResult.url || uploadResult.filename || uploadResult.file_url,
        tipo_entidad: 'diagnostico',
        entidad_id: diagnosticoId,
        usuario_id: user.id
      };

      const evidenciaResponse = await fetch(`${API_BASE_URL}/evidencias/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(evidenciaData)
      });

      return handleResponse(evidenciaResponse);

    } catch (e) {
      console.error("❌ Error en agregarEvidencia:", e);
      throw e;
    }
  },

  // En el servicio, modifica el método obtenerEvidencias:

  async obtenerEvidencias(diagnosticoId: number): Promise<Evidencia[]> {
    try {
      console.log(`📂 Obteniendo evidencias para diagnóstico ID: ${diagnosticoId}`);
      
      // Usa el endpoint específico para evidencias de diagnóstico
      const response = await fetch(`${API_BASE_URL}/evidencias/diagnostico/${diagnosticoId}`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error HTTP ${response.status}:`, errorText);
        throw new Error(`Error ${response.status} obteniendo evidencias`);
      }

      const data = await response.json();
      console.log('📄 Respuesta de evidencias:', data);
      
      // Asegúrate de devolver un array
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.items)) {
        return data.items;
      } else if (data && Array.isArray(data.evidencias)) {
        return data.evidencias;
      } else {
        console.warn('⚠️ Formato de respuesta inesperado para evidencias:', data);
        return [];
      }

    } catch (e) {
      console.error("❌ Error en obtenerEvidencias:", e);
      return [];
    }
  },

  async eliminarEvidencia(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/evidencias/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // ===================== AUXILIARES =====================

  async obtenerTiposDiagnostico(): Promise<string[]> {
    return ['nutricional', 'biológico', 'fenología', 'plagas'];
  },

  async obtenerEstadosDiagnostico(): Promise<string[]> {
    return ['abierto', 'en_revision', 'cerrado'];
  }
};

// Aliases
export const getDiagnosticos = diagnosticoService.obtenerDiagnosticos;
export const getDiagnosticoById = diagnosticoService.obtenerDiagnosticoPorId;
export const createDiagnostico = diagnosticoService.crearDiagnostico;
export const updateDiagnostico = diagnosticoService.actualizarDiagnostico;
export const deleteDiagnostico = diagnosticoService.eliminarDiagnostico;
export const assignDocente = diagnosticoService.asignarDocente;
export const closeDiagnostico = diagnosticoService.cerrarDiagnostico;
export const getDiagnosticoStats = diagnosticoService.obtenerEstadisticas;

export default diagnosticoService;
