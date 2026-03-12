export interface CultivoEspecie {
  id: number;
  nombre: string;
  tipo: 'agricola' | 'pecuario'; // Usamos literal types para mayor precisión
  descripcion?: string;
  estado: 'activo' | 'inactivo'; // Eliminado 'completado'
  granja_id: number;
  granja_nombre?: string;
  // Eliminados: fecha_inicio, duracion_dias, fecha_creacion
}

export interface CultivoFormData {
  nombre: string;
  tipo: 'agricola' | 'pecuario';
  descripcion?: string;
  estado: 'activo' | 'inactivo';
  granja_id: number;
  // Eliminados: fecha_inicio, duracion_dias
}

export interface CultivoStats {
  total: number;
  agricolas: number;
  pecuarios: number;
  activos: number;
  // Eliminado: completados
}