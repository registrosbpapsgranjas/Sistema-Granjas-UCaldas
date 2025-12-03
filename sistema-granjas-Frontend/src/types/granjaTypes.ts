// src/types/granjaTypes.ts
export interface Granja {
  id: number;
  nombre: string;
  ubicacion: string;
  activo: boolean;
  fecha_creacion: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol_id: number;
  rol_nombre: string; // Agregar este campo
  activo: boolean;
  fecha_creacion: string;
}
export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Programa {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  fecha_creacion?: string;
}

export interface AsignacionUsuario {
  usuario_id: number;
  granja_id: number;
  fecha_asignacion: string;
}

export interface AsignacionPrograma {
  programa_id: number;
  granja_id: number;
  fecha_asignacion: string;
}