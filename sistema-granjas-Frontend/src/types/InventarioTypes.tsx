// ========== CATEGORÍAS ==========
export interface CategoriaInventario {
    id: number;
    nombre: string;
    descripcion?: string;
}

export interface CategoriaFormData {
    nombre: string;
    descripcion: string;
}

// ========== HERRAMIENTAS ==========
export interface Herramienta {
    id: number;
    nombre: string;
    descripcion?: string;
    categoria_id: number;
    categoria_nombre?: string;
    cantidad_total: number;
    cantidad_disponible: number;
    estado: 'disponible' | 'no_disponible' | 'en_mantenimiento' | 'dada_de_baja' | "agotado";
    fecha_creacion?: string;
}

export interface HerramientaFormData {
    nombre: string;
    descripcion: string;
    categoria_id: number;
    cantidad_total: number;
    cantidad_disponible: number;
    estado: 'disponible' | 'no_disponible' | 'en_mantenimiento' | 'dada_de_baja';
}

// ========== INSUMOS ==========
export interface Insumo {
    id: number;
    nombre: string;
    descripcion?: string;
    programa_id: number;
    programa_nombre?: string;
    cantidad_total: number;
    cantidad_disponible: number;
    unidad_medida: string;
    nivel_alerta: number;
    estado: 'disponible' | 'agotado' | 'bajo_stock' | 'vencido' | 'inactivo';
    fecha_creacion?: string;
}

export interface InsumoFormData {
    nombre: string;
    descripcion: string;
    programa_id: number;
    cantidad_total: number;
    cantidad_disponible: number;
    unidad_medida: string;
    nivel_alerta: number;
    estado: 'disponible' | 'agotado' | 'bajo_stock' | 'vencido' | 'inactivo';
}

// ========== MOVIMIENTOS ==========
export interface MovimientoHerramienta {
    id: number;
    herramienta_id: number;
    herramienta_nombre?: string;
    labor_id?: number;
    labor_descripcion?: string;
    cantidad: number;
    tipo_movimiento: 'entrada' | 'salida';
    fecha_movimiento: string;
    observaciones?: string;
}

export interface MovimientoInsumo {
    id: number;
    insumo_id: number;
    insumo_nombre?: string;
    labor_id?: number;
    labor_descripcion?: string;
    cantidad: number;
    tipo_movimiento: 'entrada' | 'salida' | 'ajuste' | 'asignacion' | 'devolucion';
    fecha_movimiento: string;
    observaciones?: string;
}

// ========== ESTADÍSTICAS ==========
export interface InventarioStats {
    total_herramientas: number;
    total_insumos: number;
    herramientas_disponibles: number;
    insumos_disponibles: number;
    herramientas_agotadas: number;
    insumos_agotados: number;
    bajo_stock_insumos: number;
    movimientos_recientes: number;
}