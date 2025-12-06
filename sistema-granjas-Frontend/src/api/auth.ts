/* eslint-disable @typescript-eslint/no-explicit-any */

// src/api/auth.ts
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const AUTH_URL = `${API_URL}/auth`;

// Interfaces
export interface LoginResponse {
  access_token: string;
  token_type: string;
  nombre: string;
  rol: string;
  rol_id: number;
  email: string;
  message?: string;
}

export interface RolesResponse {
  roles: { id: number; nombre: string; descripcion: string }[];
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

// ================== AUTHS ==================

export function login(email: string, password: string) {
  return request<LoginResponse>(`${AUTH_URL}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(
  nombre: string,
  email: string,
  password: string,
  rol_id: number
) {
  return request<LoginResponse>(`${AUTH_URL}/register`, {
    method: "POST",
    body: JSON.stringify({ nombre, email, password, rol_id }),
  });
}

export function loginWithGoogle(token: string) {
  return request<LoginResponse>(`${AUTH_URL}/google/login`, {
    method: "POST",
    body: JSON.stringify({ token }),
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

export function clearAuthData() {
  localStorage.removeItem("token");
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

export function getUserData() {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (!payload.nombre || !payload.rol || !payload.sub) {
      return null;
    }

    return {
      nombre: payload.nombre,
      rol: payload.rol,
      email: payload.sub,
      rol_id: payload.rol_id,
    };
  } catch {
    return null;
  }
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
