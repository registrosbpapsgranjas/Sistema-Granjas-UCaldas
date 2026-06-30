// src/utils/permissions.ts
// Fuente única de verdad para la matriz de acceso del sistema

export type Rol = 'admin' | 'docente' | 'asesor' | 'estudiante' | 'trabajador' | 'talento_humano' | 'jefe_talento_humano';

/**
 * Qué roles tienen permiso de ESCRITURA en cada módulo.
 * Escritura = crear / editar / eliminar / asignar.
 * Quien no aparece aquí solo tiene lectura (si tiene acceso a la ruta).
 */
export const ESCRITURA_POR_MODULO: Record<string, Rol[]> = {
  granjas:         ['admin'],
  programas:       ['admin'],
  lotes:           ['admin', 'docente'],
  cultivos:        ['admin', 'docente'],
  plantas:         ['admin', 'docente'],
  labores:         ['admin', 'talento_humano', 'jefe_talento_humano'],
  usuarios:        ['admin'],
  inventario:      ['admin', 'docente'],
  diagnosticos:    ['admin', 'docente', 'asesor', 'estudiante'],
  recomendaciones: ['admin', 'docente', 'asesor'],
  estadisticas:    ['admin', 'docente'],
};

/**
 * Qué roles pueden ACCEDER a cada ruta.
 * Los roles que no aparecen verán la pantalla de "Acceso restringido".
 */
export const ACCESO_POR_RUTA: Record<string, Rol[]> = {
  '/gestion/granjas':         ['admin'],
  '/gestion/programas':       ['admin', 'docente', 'asesor'],
  '/gestion/lotes':           ['admin', 'docente', 'asesor', 'estudiante', 'trabajador'],
  '/lotes':                   ['admin', 'docente', 'asesor', 'estudiante', 'trabajador'],
  '/gestion/cultivos':        ['admin', 'docente', 'asesor', 'estudiante'],
  '/gestion/plantas':         ['admin', 'docente'],
  '/gestion/labores':         ['admin', 'docente', 'talento_humano', 'jefe_talento_humano', 'trabajador', 'asesor'],
  '/tablero':                 ['admin', 'docente', 'talento_humano', 'jefe_talento_humano', 'trabajador'],
  '/gestion/usuarios':        ['admin', 'talento_humano', 'jefe_talento_humano'],
  '/gestion/inventario':      ['admin', 'docente', 'asesor'],
  '/gestion/diagnosticos':    ['admin', 'docente', 'asesor', 'estudiante'],
  '/gestion/recomendaciones': ['admin', 'docente', 'asesor', 'estudiante'],
  '/gestion/estadisticas':    ['admin', 'docente'],
};

/** Verifica si el rol puede realizar escritura en un módulo */
export function puedeEscribir(rol: string | undefined, modulo: string): boolean {
  if (!rol) return false;
  return (ESCRITURA_POR_MODULO[modulo] as string[] ?? []).includes(rol);
}

/** Verifica si el rol tiene acceso a una ruta determinada */
export function tieneAccesoRuta(rol: string | undefined, ruta: string): boolean {
  if (!rol) return false;
  const permitidos = ACCESO_POR_RUTA[ruta] as string[] | undefined;
  if (!permitidos) return true; // rutas no listadas son públicas (ej: /dashboard, /login)
  return permitidos.includes(rol);
}
