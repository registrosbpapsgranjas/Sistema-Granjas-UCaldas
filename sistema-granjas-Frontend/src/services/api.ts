import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor para agregar el token a cada request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Error de API:', error.response?.data);
        
        // Si el error es 401 (no autenticado), podrías redirigir al login
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            // window.location.href = '/login'; // Descomenta si quieres redirigir
        }
        
        return Promise.reject(error);
    }
);