/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoginResponse } from "./auth"; // Importamos la interfaz base

/**
 * Interfaz para los datos de autenticación que se guardan localmente
 */
export interface OfflineAuthData {
    email: string;
    nombre: string;
    rol: string;
    rol_id: number;
    passwordHash: string | null;
    offline_token: string;
    last_sync: string;
}

// --- LÓGICA OFFLINE LOCAL (Helpers) ---

/**
 * Genera un hash simple (NO CRIPTOGRÁFICO) para verificación local.
 * Esto NO es para seguridad, sino para verificar que el usuario
 * ingrese la misma contraseña que usó por última vez online.
 */
function simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return '0';
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convertir a 32bit integer
    }
    return hash.toString();
}

/**
 * Guarda los datos de autenticación y la contraseña hasheada
 * para permitir el login offline.
 */
export function saveAuthDataForOffline(authData: LoginResponse, password?: string) {
    // Solo guardamos si tenemos la contraseña para generar el hash
    if (!password) return; 

    const offlineAuth: OfflineAuthData = {
        email: authData.email,
        nombre: authData.nombre,
        rol: authData.rol,
        rol_id: authData.rol_id,
        // Guardamos el hash simple de la contraseña
        passwordHash: simpleHash(password), 
        // Usamos el token real como token offline, o uno simulado si es necesario
        offline_token: authData.access_token || `offline_${Date.now()}`,
        last_sync: new Date().toISOString()
    };
    
    localStorage.setItem('offline_auth', JSON.stringify(offlineAuth));
    console.log("Datos de autenticación guardados para modo offline.");
}

/**
 * Intenta autenticar al usuario usando las credenciales guardadas localmente.
 * @returns LoginResponse si el login offline es exitoso.
 * @throws Error si las credenciales son incorrectas o faltan datos.
 */
export function attemptOfflineLogin(email: string, password_input: string): LoginResponse {
    const offlineAuthItem = localStorage.getItem('offline_auth');
    
    if (offlineAuthItem) {
        const authData: OfflineAuthData = JSON.parse(offlineAuthItem);
        const hashedPasswordInput = simpleHash(password_input);
        
        // 1. Verificar si hay hash guardado
        if (!authData.passwordHash) {
            throw new Error("No hay datos de contraseña guardados para modo offline.");
        }

        // 2. Verificar credenciales localmente
        if (authData.email.toLowerCase() === email.toLowerCase() && authData.passwordHash === hashedPasswordInput) {
            console.log("Login exitoso en modo offline.");
            return {
                access_token: authData.offline_token,
                token_type: "bearer",
                nombre: authData.nombre,
                rol: authData.rol,
                rol_id: authData.rol_id,
                email: authData.email,
                message: "✅ Modo offline - Sesión local activa"
            };
        }
    }
    
    throw new Error("Credenciales offline incorrectas o no existe sesión guardada.");
}

/**
 * Retorna los datos de autenticación offline si existen.
 */
export function getOfflineAuthData(): OfflineAuthData | null {
    const offlineAuthItem = localStorage.getItem('offline_auth');
    if (offlineAuthItem) {
        try {
            return JSON.parse(offlineAuthItem);
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Limpia el dato de autenticación offline (Útil para un 'Hard Logout').
 */
export function clearOfflineAuthData(): void {
    localStorage.removeItem("offline_auth");
}
