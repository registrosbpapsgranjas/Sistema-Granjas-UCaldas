// src/types/inventarioDinamicoTypes.ts
export interface Campo {
  id: number;
  tipo_id: number;
  nombre_campo: string;
  tipo_dato: 'text' | 'number' | 'date' | 'select' | 'boolean';
  requerido: boolean;
  opciones?: string[];
  orden: number;
  ancho: string;
  created_at: string;
}

export interface TipoInventario {
  id: number;
  programa_id: number;
  nombre: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  campos?: Campo[];
}

export interface ItemInventario {
  id: number;
  tipo_id: number;
  fecha_inventario: string;
  cantidad_disponible: number;
  unidad_medida?: string;
  valores: Record<string, any>;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface TipoConCampos extends TipoInventario {
  campos: Campo[];
}

export interface TipoConItems extends TipoInventario {
  campos: Campo[];
  items: ItemInventario[];
}