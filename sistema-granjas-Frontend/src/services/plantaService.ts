// src/services/plantaService.ts
import api from './api';
import { PlantaCreate, PlantaUpdate, PlantaResponse, GenerarPlantasResponse } from '../types/plantaTypes';

const plantaService = {
  // Obtener todas las plantas (opcional: filtrar por lote)
  obtenerPlantas: async (loteId?: number): Promise<PlantaResponse[]> => {
    const params = loteId ? { lote_id: loteId } : {};
    const response = await api.get('/plantas', { params });
    return response.data;
  },

  // Obtener una planta por ID
  obtenerPlantaPorId: async (id: number): Promise<PlantaResponse> => {
    const response = await api.get(`/plantas/${id}`);
    return response.data;
  },

  // Crear una planta individual
  crearPlanta: async (data: PlantaCreate): Promise<PlantaResponse> => {
    const response = await api.post('/plantas', data);
    return response.data;
  },

  // Actualizar una planta
  actualizarPlanta: async (id: number, data: PlantaUpdate): Promise<PlantaResponse> => {
    const response = await api.put(`/plantas/${id}`, data);
    return response.data;
  },

  // Eliminar (cambiar estado a eliminada)
  eliminarPlanta: async (id: number): Promise<void> => {
    await api.delete(`/plantas/${id}`);
  },

  // Generar plantas masivas para un lote
  generarPlantasParaLote: async (loteId: number): Promise<GenerarPlantasResponse> => {
    const response = await api.post(`/plantas/generar-para-lote/${loteId}`);
    return response.data;
  },
};

export default plantaService;