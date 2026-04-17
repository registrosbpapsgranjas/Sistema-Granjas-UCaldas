// src/types/plantaTypes.ts

export interface PlantaBase {
  lote_id: number;
  surco: number;
  numero: number;
  estado?: string;
  codigo?: string;
}

export type PlantaCreate = PlantaBase

export interface PlantaUpdate {
  surco?: number;
  numero?: number;
  estado?: string;
}

export interface PlantaResponse extends PlantaBase {
  id: number;
  codigo: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface LoteSimple {
  id: number;
  nombre: string;
  surcos: number;
  plantas_por_surco: number;
}

export interface GenerarPlantasResponse {
  mensaje: string;
  creadas: number;
  total_esperadas: number;
  plantas: PlantaResponse[];
}