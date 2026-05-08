// src/types/laboresTypes.ts

export interface Labor {
    id: number;
    estado: string;
    tipo_labor: string;
    tipo_labor_id: number;
    avance_porcentaje: number;
    comentario: string | null;
    formulario_labor?: Record<string, any> | null;
    fecha_asignacion: string;
    fecha_finalizacion: string | null;
    fecha_creacion: string;
    
    // Relaciones
    recomendacion_id: number;
    trabajador_id: number;
    lote_id: number;
    
    // Información relacionada (puede venir de joins)
    trabajador_nombre?: string;
    trabajador_email?: string;
    lote_nombre?: string;
    granja_nombre?: string;
    recomendacion_titulo?: string;
    tipo_labor_nombre?: string;
    
    // Detalles expandidos (para vista completa)
    recomendacion?: any;
    lote?: any;
    trabajador?: any;
    tipo_labor_detalle?: any;
    evidencias?: Evidencia[];
    herramientas_asignadas?: HerramientaAsignada[];
    insumos_utilizados?: InsumoUtilizado[];
}

export interface TipoLabor {
    id: number;
    nombre: string;
    descripcion: string;
}

export interface HerramientaAsignada {
    id: number;
    herramienta_id: number;
    herramienta_nombre: string;
    cantidad: number;
    cantidad_asignada?: number;
    cantidad_devuelta?: number;
    fecha_asignacion: string;
    estado: string;
    movimiento_id?: number;
}

export interface InsumoUtilizado {
    id: number;
    insumo_id: number;
    insumo_nombre: string;
    cantidad: number;
    unidad_medida: string;
    fecha_movimiento: string;
    tipo_movimiento: string;
}

export interface Evidencia {
    id: number;
    tipo: string;
    descripcion: string;
    url_archivo: string;
    fecha_creacion: string;
    usuario_nombre?: string;
}

export interface MovimientoHerramienta {
    id: number;
    herramienta_id: number;
    labor_id: number;
    cantidad: number;
    tipo_movimiento: string;
    fecha_movimiento: string;
    observaciones: string;
    herramienta_nombre?: string;
}

export interface CreateLaborDto {
    tipo_labor_id: number;
    recomendacion_id: number;
    trabajador_id: number;
    lote_id: number;
    comentario?: string;
    evidencias?: {
        file: File;
        descripcion: string;
        tipo: string;
    }[];
}

export interface UpdateLaborDto {
    tipo_labor_id?: number;
    trabajador_id?: number;
    lote_id?: number;
    estado?: string;
    avance_porcentaje?: number;
    comentario?: string;
}

export interface LaborFilters {
    estado?: string;
    trabajador_id?: number;
    lote_id?: number;
    recomendacion_id?: number;
    tipo_labor_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    skip?: number;
    limit?: number;
}

export interface EstadisticasLabores {
    total: number;
    pendientes: number;
    en_progreso: number;
    completadas: number;
    canceladas: number;
    por_tipo: Array<{ tipo: string; cantidad: number }>;
    por_trabajador: Array<{ trabajador: string; cantidad: number }>;
}