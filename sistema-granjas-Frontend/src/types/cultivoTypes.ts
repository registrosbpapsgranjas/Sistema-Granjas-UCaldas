export interface CultivoEspecie {
  id: number;
  nombre: string;
  tipo: string; // 'agricola' | 'pecuario'
  fecha_inicio?: string;
  duracion_dias?: number;
  descripcion?: string;
  estado: string; // 'activo' | 'inactivo' | 'completado'
  granja_id: number;
  granja_nombre?: string;
  fecha_creacion?: string;
}

export interface CultivoFormData {
  nombre: string;
  tipo: string;
  fecha_inicio: string;
  duracion_dias: number;
  descripcion: string;
  estado: string;
  granja_id: number;
}

export interface CultivoStats {
  total: number;
  agricolas: number;
  pecuarios: number;
  activos: number;
  completados: number;
}