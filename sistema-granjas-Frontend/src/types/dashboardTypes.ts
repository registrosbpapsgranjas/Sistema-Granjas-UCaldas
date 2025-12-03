// types/dashboard.ts

console.log("TYPES LOADED OK");

// =========================
// Usuario
// =========================
export interface Usuario {
  id: number;
  username: string;
  email: string;
  role: string;
  nombre: string;
  apellido: string;
}

// =========================
// Granja
// =========================
// Nota: Se recomienda usar "activo" como boolean, 
// porque así lo envía tu backend en granjaService.
export interface Granja {
  id: number;
  nombre: string;
  ubicacion: string;
  activo: boolean;      // CORREGIDO: tu backend usa "activo"
  area_total: number;   // O "area" según cómo lo devuelva el API
}

// =========================
// Programa
// =========================
export interface Programa {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;       // CORREGIDO: estado → activo para ser coherente
  fecha_inicio: string;  // Fecha ISO del backend
}

// =========================
// Labor / Tarea asignada
// =========================
export interface Labor {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;             // Puede ser "pendiente", "completada", etc.
  fecha_asignacion: string;
  fecha_vencimiento: string;
  granja_id: number;
}

// =========================
// Estadísticas del Dashboard
// =========================
export interface DashboardStats {
  granjasActivas: number;
  usuariosRegistrados: number;
  programasActivos: number;
  laboresMes: number;
}
