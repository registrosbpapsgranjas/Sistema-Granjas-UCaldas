// src/services/usuarioService.ts - Versión completa
import type { Usuario, Rol } from '../types/granjaTypes';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Función para obtener headers con token
const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'accept': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

// Función para manejar errores de respuesta
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.message || `Error ${response.status}: ${response.statusText}`
        );
    }
    return response.json();
};

export const usuarioService = {
    // ========== OPERACIONES CRUD BÁSICAS ==========

    // OBTENER todos los usuarios
    async obtenerUsuarios(skip: number = 0, limit: number = 100): Promise<Usuario[]> {
        try {
            const url = `${API_BASE_URL}/usuarios/?skip=${skip}&limit=${limit}`;
            console.log('🔍 Obteniendo usuarios:', url);

            const response = await fetch(url, {
                headers: getHeaders()
            });

            const data = await handleResponse(response);
            console.log('✅ Usuarios obtenidos:', data.length);
            return data;
        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error);
            throw error;
        }
    },

    // OBTENER usuario por ID
    async obtenerUsuarioPorId(id: number): Promise<Usuario> {
        const url = `${API_BASE_URL}/usuarios/${id}`;
        console.log('🔍 Obteniendo usuario por ID:', url);

        const response = await fetch(url, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    // CREAR usuario
    async crearUsuario(datosUsuario: {
        nombre: string;
        email: string;
        password: string;
        rol_id: number;
    }): Promise<Usuario> {
        const url = `${API_BASE_URL}/usuarios/`;
        console.log('📤 Creando usuario:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(datosUsuario)
        });
        return handleResponse(response);
    },

    // ACTUALIZAR usuario
    async actualizarUsuario(id: number, datosUsuario: {
        nombre?: string;
        email?: string;
        rol_id?: number;
        activo?: boolean;
        password?: string;
    }): Promise<Usuario> {
        const url = `${API_BASE_URL}/usuarios/${id}`;
        console.log('✏️ Actualizando usuario:', url);

        const response = await fetch(url, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(datosUsuario)
        });
        return handleResponse(response);
    },

    // ELIMINAR usuario
    async eliminarUsuario(id: number): Promise<void> {
        const url = `${API_BASE_URL}/usuarios/${id}`;
        console.log('🗑️ Eliminando usuario:', url);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
    },

    // ========== GESTIÓN DE ROLES ==========

    // OBTENER todos los roles disponibles
    async obtenerRoles(): Promise<Rol[]> {
        const url = `${API_BASE_URL}/roles/`;
        console.log('🎭 Obteniendo roles:', url);

        const response = await fetch(url, {
            headers: getHeaders()
        });
        return handleResponse(response);
    },

    // CAMBIAR ROL de usuario
    async cambiarRolUsuario(id: number, rol_id: number): Promise<Usuario> {
        const url = `${API_BASE_URL}/usuarios/${id}`;
        console.log('🔄 Cambiando rol usuario:', url);

        const response = await fetch(url, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ rol_id })
        });

        return handleResponse(response);
    },

    // ========== ESTADÍSTICAS ==========

    // Obtener conteo de usuarios por rol
    async obtenerConteoUsuariosPorRol(): Promise<Record<string, number>> {
        try {
            const usuarios = await this.obtenerUsuarios();
            const conteo: Record<string, number> = {};

            usuarios.forEach(usuario => {
                const rol = usuario.rol_nombre || 'Sin rol';
                conteo[rol] = (conteo[rol] || 0) + 1;
            });

            return conteo;
        } catch (error) {
            console.error('❌ Error obteniendo conteo por rol:', error);
            return {};
        }
    }
};

export default usuarioService;