// src/types/recomendacionTypes.ts
export interface ProductoRecomendacionDto {
    inventario_item_id: number | null;
    cantidad_sugerida?: number | null;
    descripcion?: string | null;
}

export interface Recomendacion {
  id: number;
  titulo: "Gestión de Recomendaciones";
  descripcion: string;
  tipo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'en_ejecucion' | 'completada' | 'cancelada';
  docente_id: number;
  docente_nombre?: string;
  lote_id: number;
  lote_nombre?: string;
  granja_nombre?: string;
  programa_nombre?: string;
  diagnostico_id?: number;
  inventario_item_id?: number;
  inventario_item_nombre?: string;
  inventario_item_unidad?: string;
  inventario_item_disponible?: number;
  cantidad_sugerida?: number;
  fecha_creacion: string;
  fecha_aprobacion?: string;
  evidencias?: Evidencia[];
  labores_count?: number;
  productos?: ProductoRecomendacionDto[];
  items_sugeridos?: ProductoRecomendacionDto[];
}

export interface Evidencia {
  id: number;
  tipo: string;
  descripcion: string;
  url_archivo: string;
  recomendacion_id?: number;
  usuario_id: number;
  usuario_nombre?: string;
  fecha_creacion: string;
}

export interface Diagnostico {
  id: number;
  tipo: string;
  descripcion: string;
  estudiante_id: number;
  docente_id?: number;
  lote_id: number;
  estado: string;
  fecha_creacion: string;
}

export interface ItemSugeridoDto {
  inventario_item_id: number | null;
  cantidad_sugerida?: number | null;
  unidad_dosis?: string | null;
  descripcion?: string | null;
}

export interface CreateRecomendacionDto {
  titulo: string;
  descripcion: string;
  tipo?: string;
  estado?: string;
  docente_id: number;
  lote_id: number;
  diagnostico_id?: number;
  subtipo_id?: number | null;
  formulario_recomendacion?: Record<string, any> | null;
  inventario_item_id?: number;
  cantidad_sugerida?: number;
  items_sugeridos?: ItemSugeridoDto[];
}

export interface UpdateRecomendacionDto {
  titulo?: string;
  descripcion?: string;
  tipo?: string;
  estado?: string;
}

export interface EstadisticasRecomendaciones {
  total: number;
  pendientes: number;
  aprobadas: number;
  en_ejecucion: number;
  completadas: number;
  canceladas: number;
  rechazadas: number;
  por_tipo: { tipo: string; cantidad: number }[];
  por_lote: { lote_nombre: string; cantidad: number }[];
}

export interface RecomendacionFilters {
  estado?: string;
  tipo?: string;
  lote_id?: number;
  docente_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  skip?: number;
  limit?: number;
}

export interface RecomendacionResponse {
  items: Recomendacion[];
  total: number;
  skip: number;
  limit: number;
}