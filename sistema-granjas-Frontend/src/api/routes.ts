// Define la URL base de tu backend (FastAPI)
export const BASE_URL = "http://127.0.0.1:8000";

// Define los endpoints específicos
export const ENDPOINTS = {
    // Ruta completa para el login de Google
    googleLogin: `${BASE_URL}/api/auth/google`,
    // Aquí puedes añadir más rutas como:
    createGranja: `${BASE_URL}/api/granjas/`,
    // profile: `${BASE_URL}/api/users/profile`,
};