const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
    }
    return res.json();
};

export const tipoRecomendacionService = {
    async obtenerTipos(): Promise<any[]> {
        const res = await fetch(`${API_BASE_URL}/tipos-recomendacion/`, { headers: getHeaders() });
        return handleResponse(res);
    },
    async crearTipo(data: { nombre: string; descripcion?: string }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/tipos-recomendacion/`, {
            method: 'POST', headers: getHeaders(), body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    async actualizarTipo(id: number, data: { nombre?: string; descripcion?: string }): Promise<any> {
        const res = await fetch(`${API_BASE_URL}/tipos-recomendacion/${id}`, {
            method: 'PUT', headers: getHeaders(), body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    async eliminarTipo(id: number): Promise<void> {
        const res = await fetch(`${API_BASE_URL}/tipos-recomendacion/${id}`, {
            method: 'DELETE', headers: getHeaders(),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Error ${res.status}`);
        }
    },
};

export default tipoRecomendacionService;
