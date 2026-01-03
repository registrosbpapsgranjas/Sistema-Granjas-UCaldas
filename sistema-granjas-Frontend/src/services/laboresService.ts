// src/services/laborService.ts
import type {
    Labor,
    TipoLabor,
    CreateLaborDto,
    UpdateLaborDto,
    LaborFilters,
    EstadisticasLabores,
    HerramientaAsignada,
    InsumoUtilizado,
    MovimientoHerramienta, 
    Evidencia
} from '../types/laboresTypes';

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

// Servicio de Labores
export const laborService = {

    // ===================== CRUD =====================

    async obtenerLabores(filtros?: LaborFilters): Promise<{ items: Labor[], total: number, paginas: number }> {
        const params = new URLSearchParams();

        if (filtros) {
            Object.entries(filtros).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
        }

        const url = `${API_BASE_URL}/labores${params.toString() ? `?${params}` : ''}`;
        const response = await fetch(url, { headers: getHeaders() });
        return handleResponse(response);
    },

    async obtenerLabor(id: number): Promise<Labor> {
        const response = await fetch(`${API_BASE_URL}/labores/${id}`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async obtenerLaborPorId(id: number): Promise<Labor> {
        return this.obtenerLabor(id);
    },

    async crearLabor(datos: CreateLaborDto, user?: any): Promise<Labor> {
        try {
            // 1. Crear la labor
            const response = await fetch(`${API_BASE_URL}/labores/`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Error ${response.status} creando labor`);
            }

            const laborCreada: Labor = await response.json();

            // 2. Si hay evidencias iniciales, procesarlas
            if (datos.evidencias?.length && user) {
                await Promise.all(
                    datos.evidencias.map(async (ev: any) => {
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
                                descripcion: ev.descripcion || `Evidencia para labor ${laborCreada.id}`,
                                url_archivo: fileData.url || fileData.filename || fileData.file_url,
                                tipo_entidad: 'labor',
                                entidad_id: laborCreada.id,
                                usuario_id: user.id || 1
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

                            return await evidenciaRes.json();
                        } catch (error) {
                            console.error(`❌ Error procesando evidencia:`, error);
                            return null;
                        }
                    })
                );

                console.log('✅ Todas las evidencias procesadas para labor');
            }

            return laborCreada;

        } catch (error) {
            console.error('❌ Error en crearLabor:', error);
            throw error;
        }
    },

    async actualizarLabor(id: number, datos: UpdateLaborDto, user?: any): Promise<Labor> {
        try {
            // 1. Actualizar la labor
            const response = await fetch(`${API_BASE_URL}/labores/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Error ${response.status} actualizando labor`);
            }

            const laborActualizada: Labor = await response.json();

            // 2. Si hay evidencias para subir, procesarlas
            if (datos.evidencias?.length && user) {
                const evidenciasParaSubir = datos.evidencias;
                console.log(`🔄 Procesando ${evidenciasParaSubir.length} evidencias para labor ${id}`);

                await Promise.all(
                    evidenciasParaSubir.map(async (ev: any) => {
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
                                descripcion: ev.descripcion || `Evidencia para labor ${id}`,
                                url_archivo: fileData.url || fileData.filename || fileData.file_url,
                                tipo_entidad: 'labor',
                                entidad_id: id,
                                usuario_id: user.id || parseInt(localStorage.getItem('userId') || '1')
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
                            console.log(`✅ Evidencia creada: ${evidenciaCreada.id}`);
                            return evidenciaCreada;
                        } catch (error) {
                            console.error(`❌ Error procesando evidencia:`, error);
                            return null;
                        }
                    })
                );

                console.log('✅ Todas las evidencias procesadas para labor actualizada');
            }

            return laborActualizada;

        } catch (error) {
            console.error('❌ Error en actualizarLabor:', error);
            throw error;
        }
    },

    async eliminarLabor(id: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/labores/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }
    },

    async completarLabor(id: number, comentario?: string): Promise<Labor> {
        const payload = comentario ? { comentario } : {};
        const response = await fetch(`${API_BASE_URL}/labores/${id}/completar`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },

    // ===================== GESTIÓN DE RECURSOS =====================

    async asignarHerramienta(laborId: number, herramientaId: number, cantidad: number): Promise<Labor> {
        const payload = { herramienta_id: herramientaId, cantidad };
        const response = await fetch(`${API_BASE_URL}/labores/${laborId}/asignar-herramienta`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },

    async asignarInsumo(laborId: number, insumoId: number, cantidad: number): Promise<Labor> {
        const payload = { insumo_id: insumoId, cantidad };
        const response = await fetch(`${API_BASE_URL}/labores/${laborId}/asignar-insumo`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },

    async devolverHerramienta(laborId: number, movimientoId: number, cantidad: number): Promise<{ message: string }> {
        const response = await fetch(
            `${API_BASE_URL}/labores/${laborId}/devolver-herramienta/${movimientoId}?cantidad=${cantidad}`, 
            {
                method: 'POST',
                headers: getHeaders()
            }
        );
        return handleResponse(response);
    },

    async devolverInsumo(laborId: number, movimientoId: number, cantidad: number): Promise<{ message: string }> {
        const response = await fetch(
            `${API_BASE_URL}/labores/${laborId}/devolver-insumo/${movimientoId}?cantidad=${cantidad}`, 
            {
                method: 'POST',
                headers: getHeaders()
            }
        );
        return handleResponse(response);
    },

    async registrarAvance(laborId: number, avancePorcentaje: number, comentario?: string): Promise<Labor> {
        const payload = { avance_porcentaje: avancePorcentaje, comentario };
        const response = await fetch(`${API_BASE_URL}/labores/${laborId}/registrar-avance`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },

    // ===================== CONSULTAS =====================

    async obtenerHerramientasAsignadas(laborId: number): Promise<HerramientaAsignada[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/labores/${laborId}`, {
                headers: getHeaders()
            });
            const data = await handleResponse(response);
            return data.herramientas_asignadas || [];
        } catch (error) {
            console.error('Error obteniendo herramientas asignadas:', error);
            return [];
        }
    },

    async obtenerInsumosUtilizados(laborId: number): Promise<InsumoUtilizado[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/labores/${laborId}`, {
                headers: getHeaders()
            });
            const data = await handleResponse(response);
            return data.insumos_asignados || [];
        } catch (error) {
            console.error('Error obteniendo insumos utilizados:', error);
            return [];
        }
    },

    async obtenerInsumosConsumidos(laborId: number): Promise<InsumoUtilizado[]> {
        return this.obtenerInsumosUtilizados(laborId);
    },

    async obtenerEvidencias(laborId: number): Promise<Evidencia[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/labores/${laborId}`, {
                headers: getHeaders()
            });
            const data = await handleResponse(response);
            return data.evidencias || [];
        } catch (error) {
            console.error('Error obteniendo evidencias:', error);
            return [];
        }
    },

    async obtenerMovimientosHerramientas(laborId: number): Promise<MovimientoHerramienta[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/labores/${laborId}`, {
                headers: getHeaders()
            });
            const data = await handleResponse(response);
            return data.movimientos_herramientas || [];
        } catch (error) {
            console.error('Error obteniendo movimientos de herramientas:', error);
            return [];
        }
    },

    async obtenerMovimientosInsumos(laborId: number): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/labores/${laborId}`, {
                headers: getHeaders()
            });
            const data = await handleResponse(response);
            return data.movimientos_insumos || [];
        } catch (error) {
            console.error('Error obteniendo movimientos de insumos:', error);
            return [];
        }
    },

    async obtenerEstadisticas(): Promise<EstadisticasLabores> {
        const response = await fetch(`${API_BASE_URL}/labores/estadisticas/resumen`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    async obtenerTiposLabor(): Promise<TipoLabor[]> {
        const response = await fetch(`${API_BASE_URL}/tipos-labor`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        return Array.isArray(data) ? data : (data.items || []);
    },

    async obtenerLaboresPorTrabajador(trabajadorId: number, filtros?: LaborFilters): Promise<{ items: Labor[], total: number, paginas: number }> {
        const params = new URLSearchParams();
        
        if (filtros) {
            Object.entries(filtros).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
        }

        const url = `${API_BASE_URL}/labores/trabajador/${trabajadorId}${params.toString() ? `?${params}` : ''}`;
        const response = await fetch(url, { headers: getHeaders() });
        return handleResponse(response);
    },

    async obtenerMisLabores(filtros?: LaborFilters): Promise<{ items: Labor[], total: number, paginas: number }> {
        const params = new URLSearchParams();
        
        if (filtros) {
            Object.entries(filtros).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
        }

        const url = `${API_BASE_URL}/labores/trabajador/mis-labores${params.toString() ? `?${params}` : ''}`;
        const response = await fetch(url, { headers: getHeaders() });
        return handleResponse(response);
    },

    async obtenerLaboresPorRecomendacion(recomendacionId: number, filtros?: LaborFilters): Promise<{ items: Labor[], total: number, paginas: number }> {
        const params = new URLSearchParams();
        
        if (filtros) {
            Object.entries(filtros).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
        }

        const url = `${API_BASE_URL}/labores/recomendacion/${recomendacionId}${params.toString() ? `?${params}` : ''}`;
        const response = await fetch(url, { headers: getHeaders() });
        return handleResponse(response);
    },

    // ===================== FUNCIONES ADICIONALES =====================

    async cambiarEstadoLabor(id: number, estado: string, comentario?: string): Promise<Labor> {
        const payload = { estado, comentario };
        const response = await fetch(`${API_BASE_URL}/labores/${id}/estado`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },

    async obtenerResumenPorEstado(): Promise<Record<string, number>> {
        const response = await fetch(`${API_BASE_URL}/labores/resumen-estados`, {
            headers: getHeaders()
        });
        return handleResponse(response);
    }
};

// Aliases para compatibilidad
export const getLabores = laborService.obtenerLabores;
export const getLaborById = laborService.obtenerLabor;
export const createLabor = laborService.crearLabor;
export const updateLabor = laborService.actualizarLabor;
export const deleteLabor = laborService.eliminarLabor;
export const completeLabor = laborService.completarLabor;
export const getLaborStats = laborService.obtenerEstadisticas;

export default laborService;