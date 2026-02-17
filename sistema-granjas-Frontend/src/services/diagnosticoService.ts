import type { 
  DiagnosticoItem, 
  CrearDiagnosticoDTO, 
  ActualizarDiagnosticoDTO,
  EstadisticasDiagnostico,
  DiagnosticoFiltros,
  Evidencia,
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

  async crearDiagnostico(datos: CrearDiagnosticoDTO, user: any): Promise<DiagnosticoItem> {
    try {
    
    // 1. Primero crea el diagnóstico
    const response = await fetch(`${API_BASE_URL}/diagnosticos/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(datos)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status} creando diagnóstico`);
    }

    const diagnosticoCreado: DiagnosticoItem = await response.json();

    // 2. Si hay evidencias iniciales, subirlas y crear registros de evidencias
    if (datos.evidencias?.length) {
      await Promise.all(
        datos.evidencias.map(async (ev) => {
          try {
            // Subir archivo
            const formData = new FormData();
            formData.append('file', ev.file);

            const uploadRes = await fetch(`${API_BASE_URL}/files/upload`, {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
              },
              body: formData
            });

            if (!uploadRes.ok) {
              const errorText = await uploadRes.text();
              console.error(`❌ Error subiendo archivo ${ev.file.name}:`, errorText);
              throw new Error(`Error subiendo archivo ${ev.file.name}`);
            }

            const fileData = await uploadRes.json();

            // Crear registro de evidencia
            const evidenciaPayload = {
              tipo: ev.tipo || 'imagen',
              descripcion: ev.descripcion || `Evidencia para diagnóstico ${diagnosticoCreado.id}`,
              url_archivo: fileData.url || fileData.filename || fileData.file_url,
              tipo_entidad: 'diagnostico',
              entidad_id: diagnosticoCreado.id,
              usuario_id: user.id || 1 // Usar ID del usuario autenticado
            };

            const evidenciaRes = await fetch(`${API_BASE_URL}/evidencias/`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify(evidenciaPayload)
            });

            if (!evidenciaRes.ok) {
              const errorData = await evidenciaRes.json().catch(() => ({}));
              console.error(`❌ Error creando evidencia:`, errorData);
              throw new Error(`Error creando registro de evidencia`);
            }

            const evidenciaCreada = await evidenciaRes.json();
            console.log('✅ Evidencia creada:', evidenciaCreada);

            return evidenciaCreada;
          } catch (error) {
            console.error(`❌ Error procesando evidencia:`, error);
            // Continuar con las demás evidencias aunque falle una
            return null;
          }
        })
      );
      
      console.log('✅ Todas las evidencias procesadas');
    }

    return diagnosticoCreado;

  } catch (error) {
    console.error('❌ Error en crearDiagnostico:', error);
    throw error;
  }
  },

  async actualizarDiagnostico(id: number, datos: ActualizarDiagnosticoDTO, user: any): Promise<DiagnosticoItem> {
    try {
    // 1. Actualizar diagnóstico
    const response = await fetch(`${API_BASE_URL}/diagnosticos/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(datos),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Error ${response.status} actualizando diagnóstico`
      );
    }
    
    const diagnosticoActualizado: DiagnosticoItem = await response.json();
    // 2. Procesar evidencias nuevas si vienen
    if (datos.evidencias?.length) {
      console.log("📂 Procesando evidencias nuevas para actualización...");
      await Promise.all(
        datos.evidencias.map(async (ev) => {
          try {
            // Subir archivo
            const formData = new FormData();
            formData.append("file", ev.file);

            const uploadRes = await fetch(`${API_BASE_URL}/files/upload`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: formData,
            });

            if (!uploadRes.ok) {
              const errorText = await uploadRes.text();
              console.error(`ACTUALIZACION Error subiendo archivo ${ev.file.name}:`, errorText);
              throw new Error(`Error subiendo archivo ${ev.file.name}`);
            }

            const fileData = await uploadRes.json();

            // Crear registro de evidencia
            const evidenciaPayload = {
              tipo: ev.tipo || "imagen",
              descripcion:
                ev.descripcion ||
                `Evidencia actualizada para diagnóstico ${diagnosticoActualizado.id}`,
              url_archivo:
                fileData.url || fileData.filename || fileData.file_url,
              tipo_entidad: "diagnostico",
              entidad_id: diagnosticoActualizado.id,
              usuario_id: user.id || 1,
            };
            console.log("📄 Payload de evidencia (actualización):", evidenciaPayload);
            const evidenciaRes = await fetch(`${API_BASE_URL}/evidencias/`, {
              method: "POST",
              headers: getHeaders(),
              body: JSON.stringify(evidenciaPayload),
            });

            if (!evidenciaRes.ok) {
              const errorData = await evidenciaRes.json().catch(() => ({}));
              console.error(`❌ Error creando evidencia:`, errorData);
              throw new Error("Error creando registro de evidencia");
            }

            const evidenciaCreada = await evidenciaRes.json();
            console.log("✅ Evidencia creada (actualización):", evidenciaCreada);

            return evidenciaCreada;
          } catch (error) {
            console.error("❌ Error procesando evidencia:", error);
            return null;
          }
        })
      );

      console.log("✅ Todas las evidencias procesadas en actualización");
    }

    return diagnosticoActualizado;
  } catch (error) {
    console.error("❌ Error en actualizarDiagnostico:", error);
    throw error;
  }
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

  async cerrarDiagnostico(id: number, observaciones: string = ''): Promise<DiagnosticoItem> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/${id}/cerrar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ observaciones })
    });

    return handleResponse(response);
  },

  async obtenerEstadisticas(): Promise<EstadisticasDiagnostico> {
    const response = await fetch(`${API_BASE_URL}/diagnosticos/estadisticas/resumen`, {
      headers: getHeaders()
    });
    return handleResponse(response);
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
    return ['nutricional', 'controladores_biológicos', 'fenología', 'plagas', 'censo_poblacional'];
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
