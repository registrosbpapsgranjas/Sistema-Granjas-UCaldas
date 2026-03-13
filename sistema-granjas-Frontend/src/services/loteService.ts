// src/services/loteService.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Función auxiliar para manejar errores
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.detail || errorData.message || `Error ${response.status}: ${response.statusText}`
        );
    }
    return response.json();
};

// Headers con token
const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

export const loteService = {
    // ===================== CRUD Lotes =====================

    // Obtener todos los lotes
    async obtenerLotes(): Promise<any[]> {
        const response = await fetch(`${API_BASE_URL}/lotes/`, {
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // Obtener todos los lotes con filtros
    async obtenerLotesConFiltros(filtros?: any): Promise<any> {
        try {
            let url = `${API_BASE_URL}/lotes/`;

            // Agregar filtros si existen
            if (filtros) {
                const params = new URLSearchParams();
                if (filtros.granja_id) params.append('granja_id', filtros.granja_id.toString());
                if (filtros.programa_id) params.append('programa_id', filtros.programa_id.toString());
                if (filtros.estado) params.append('estado', filtros.estado);
                if (filtros.tipo_lote_id) params.append('tipo_lote_id', filtros.tipo_lote_id.toString());
                if (filtros.skip !== undefined) params.append('skip', filtros.skip.toString());
                if (filtros.limit !== undefined) params.append('limit', filtros.limit.toString());

                const queryString = params.toString();
                if (queryString) {
                    url += `?${queryString}`;
                }
            }

            const response = await fetch(url, {
                headers: getHeaders(),
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error al obtener lotes:', error);
            throw error;
        }
    },

    // Obtener un lote específico
    async obtenerLote(id: number): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/lotes/${id}`, {
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // Obtener lote con información del programa
    async obtenerLoteConPrograma(id: number): Promise<any> {
        try {
            // Primero obtenemos el lote
            const lote = await this.obtenerLote(id);

            // Si ya incluye información del programa, retornarlo
            if (lote.programa) {
                return lote;
            }

            // Si no, intentar obtener el programa por separado si hay programa_id
            if (lote.programa_id) {
                try {
                    const programaResponse = await fetch(`${API_BASE_URL}/programas/${lote.programa_id}`, {
                        headers: getHeaders(),
                    });

                    if (programaResponse.ok) {
                        const programaData = await programaResponse.json();
                        lote.programa = programaData;
                    }
                } catch (programaError) {
                    console.warn('No se pudo obtener información del programa:', programaError);
                    lote.programa = {
                        id: lote.programa_id,
                        nombre: 'Programa no disponible'
                    };
                }
            }

            return lote;
        } catch (error) {
            console.error('Error al obtener lote con programa:', error);
            throw error;
        }
    },

    // Crear lote
    async crearLote(data: any): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/lotes/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    // Actualizar lote
    async actualizarLote(id: number, data: any): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/lotes/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    // Eliminar lote
    async eliminarLote(id: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/lotes/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }
    },

    // ===================== Tipos de Lote =====================

    // Obtener tipos de lote
    async obtenerTiposLote(): Promise<any[]> {
        const response = await fetch(`${API_BASE_URL}/tipos-lote/`, {
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // Crear tipo de lote
    async crearTipoLote(data: any): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/tipos-lote/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    // Actualizar tipo de lote
    async actualizarTipoLote(id: number, data: any): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/tipos-lote/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    // Eliminar tipo de lote
    async eliminarTipoLote(id: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/tipos-lote/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }
    },

    // ===================== Consultas Específicas =====================

    // Obtener lotes por granja
    async obtenerLotesPorGranja(granjaId: number): Promise<any[]> {
        const response = await fetch(`${API_BASE_URL}/lotes/?granja_id=${granjaId}`, {
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // Obtener lotes por programa
    async obtenerLotesPorPrograma(programaId: number): Promise<any[]> {
        const response = await fetch(`${API_BASE_URL}/lotes/?programa_id=${programaId}`, {
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // ===================== Funciones Adicionales =====================

    // Obtener estadísticas de lotes
    async obtenerEstadisticasLotes(): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/lotes/estadisticas/`, {
                headers: getHeaders(),
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error al obtener estadísticas de lotes:', error);
            throw error;
        }
    },

    // src/services/loteService.ts - Agregar este método
    async obtenerLotesPorCultivo(cultivoId: number): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/lotes?cultivo_id=${cultivoId}`, {
                headers: getHeaders()
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error obteniendo lotes por cultivo:', error);
            return [];
        }
    },

    // Buscar lotes por nombre
    async buscarLotesPorNombre(nombre: string): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/lotes/buscar?nombre=${encodeURIComponent(nombre)}`, {
                headers: getHeaders(),
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error al buscar lotes por nombre:', error);
            throw error;
        }
    },

    // Obtener cultivos disponibles para un lote
    async obtenerCultivosDisponibles(granjaId?: number): Promise<any[]> {
        try {
            let url = `${API_BASE_URL}/cultivos/`;
            if (granjaId) {
                url += `?granja_id=${granjaId}`;
            }

            const response = await fetch(url, {
                headers: getHeaders(),
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error al obtener cultivos disponibles:', error);
            throw error;
        }
    },

    // Obtener programas disponibles
    async obtenerProgramasDisponibles(): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/programas/`, {
                headers: getHeaders(),
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error al obtener programas disponibles:', error);
            throw error;
        }
    },

    // Obtener granjas disponibles
    async obtenerGranjasDisponibles(): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/granjas`, {
                headers: getHeaders(),
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error al obtener granjas disponibles:', error);
            throw error;
        }
    },

    // Cambiar estado de lote
    async cambiarEstadoLote(id: number, estado: string, observaciones?: string): Promise<any> {
        try {
            const payload: any = { estado };
            if (observaciones) {
                payload.observaciones = observaciones;
            }

            const response = await fetch(`${API_BASE_URL}/lotes/${id}/estado`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(payload),
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Error al cambiar estado de lote:', error);
            throw error;
        }
    }
};

// Exportación por defecto para compatibilidad
export default loteService;