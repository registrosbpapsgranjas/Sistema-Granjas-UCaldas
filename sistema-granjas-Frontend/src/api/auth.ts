/* eslint-disable @typescript-eslint/no-explicit-any */

// src/api/auth.ts
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const AUTH_URL = `${API_URL}/auth`;

// Interfaces
export interface ProgramaAsignado {
  id: number;
  nombre: string;
  tipo: string;
  activo: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  nombre: string;
  rol: string;
  rol_id: number;
  email: string;
  programas?: ProgramaAsignado[];  // 👈 NUEVO: programas del usuario
  message?: string;
}

export interface RolesResponse {
  roles: { id: number; nombre: string; descripcion: string }[];
}

export interface UserData {
  id: number;
  nombre: string;
  rol: string;
  email: string;
  rol_id: number;
  programas: ProgramaAsignado[];  // 👈 NUEVO: programas del usuario
}

// --- Helper genérico ---
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(options.body && { "Content-Type": "application/json" }),
        ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.detail || `Error ${response.status}: ${response.statusText}`
      );
    }

    return data;
  } catch (error: any) {
    if (error.message.includes("fetch")) {
      throw new Error("No se pudo conectar al servidor");
    }
    throw error;
  }
}

// ================== AUTH ==================

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await request<LoginResponse>(`${AUTH_URL}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  
  // Guardar programas en localStorage después del login
  if (response.programas) {
    localStorage.setItem('user_programas', JSON.stringify(response.programas));
  }
  
  return response;
}

export async function register(
  nombre: string,
  email: string,
  password: string,
  rol_id: number
): Promise<LoginResponse> {
  const response = await request<LoginResponse>(`${AUTH_URL}/register`, {
    method: "POST",
    body: JSON.stringify({ nombre, email, password, rol_id }),
  });
  
  // Guardar programas en localStorage después del registro (si aplica)
  if (response.programas) {
    localStorage.setItem('user_programas', JSON.stringify(response.programas));
  }
  
  return response;
}

export async function loginWithGoogle(token: string): Promise<LoginResponse> {
  const response = await request<LoginResponse>(`${AUTH_URL}/google/login`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  
  // Guardar programas en localStorage después del login con Google
  if (response.programas) {
    localStorage.setItem('user_programas', JSON.stringify(response.programas));
  }
  
  return response;
}

export async function forgotPassword(email: string): Promise<{ message: string; detail?: string }> {
  return request(`${AUTH_URL}/forgot-password`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyResetCode(email: string, code: string): Promise<{ message: string; detail?: string }> {
  return request(`${AUTH_URL}/verify-reset-code`, {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function resetPassword(
  email: string,
  code: string,
  new_password: string,
  confirm_password: string
): Promise<{ message: string; detail?: string }> {
  return request(`${AUTH_URL}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ email, code, new_password, confirm_password }),
  });
}

export async function logout() {
  await request(`${AUTH_URL}/logout`, { method: "POST" });
  clearAuthData();
  return { message: "Sesión cerrada correctamente" };
}

export function getRolesDisponibles() {
  return request<RolesResponse>(`${AUTH_URL}/roles-disponibles`);
}

// ================== STORAGE ==================

export function saveToken(token: string) {
  localStorage.setItem("token", token);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearAuthData() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_programas");  // 👈 Limpiar programas también
}

// ================== USER ==================

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Date.now() < payload.exp * 1000;
  } catch {
    return false;
  }
}

export function getUserData(): UserData | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (!payload.nombre || !payload.rol || !payload.sub) {
      return null;
    }

    // Obtener programas almacenados
    const programasStr = localStorage.getItem('user_programas');
    const programas = programasStr ? JSON.parse(programasStr) : [];

    return {
      id: payload.id,
      nombre: payload.nombre,
      rol: payload.rol,
      email: payload.sub,
      rol_id: payload.rol_id,
      programas: programas,  // 👈 NUEVO: incluir programas
    };
  } catch {
    return null;
  }
}

// Función para actualizar programas manualmente (si es necesario)
export function setUserProgramas(programas: ProgramaAsignado[]) {
  localStorage.setItem('user_programas', JSON.stringify(programas));
}

// Función para obtener solo los programas del usuario
export function getUserProgramas(): ProgramaAsignado[] {
  const programasStr = localStorage.getItem('user_programas');
  return programasStr ? JSON.parse(programasStr) : [];
}

// === Verificación de conexión ===
export async function checkBackendConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(`${API_URL}/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    return response.ok;
  } catch {
    return false;
  }
}