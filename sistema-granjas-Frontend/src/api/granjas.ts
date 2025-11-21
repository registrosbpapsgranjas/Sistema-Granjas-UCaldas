// Importa el header de autenticación desde tu módulo auth
import { getAuthHeader } from "./auth"; 
// Importa la ruta de creación
import { ENDPOINTS } from "./routes";

// --- TIPOS ---
// Define la estructura de datos que se enviará al backend
interface CreateGranjaRequest {
    nombre: string;
    ubicacion: string;
    programa_id: number;
    // otros campos requeridos por tu esquema Pydantic de Granja
}

// Define la estructura de datos que la API devuelve (la granja creada)
interface GranjaResponse {
    id: number;
    nombre: string;
    ubicacion: string;
    asesor_id: number;
    // otros campos...
}
// -------------
// Función para crear una nueva granja
export const createGranja = async (data: CreateGranjaRequest): Promise<GranjaResponse> => {
    try {
        const headers = getAuthHeader(); // ⬅️ OBTENEMOS EL TOKEN DE AUTORIZACIÓN

        const res = await fetch(ENDPOINTS.createGranja, {
            method: "POST",
            headers: headers, // ⬅️ USAMOS LAS CABECERAS (incluyendo el token)
            body: JSON.stringify(data), 
        });

        if (!res.ok) {
            // Manejo de errores 401 (No autorizado) o 403 (Prohibido)
            const errorData = await res.json();
            // Esto capturará los errores de FastAPI, incluyendo si el token es inválido
            throw new Error(errorData.detail || `Error ${res.status} al crear la granja.`);
        }
        const granjaCreada: GranjaResponse = await res.json();
        return granjaCreada;

    } catch (err) {
        console.error("❌ Error en la llamada a la API de creación de granja:", err);
        // Puedes relanzar el error para que el componente que llama lo maneje
        throw err;
    }
};