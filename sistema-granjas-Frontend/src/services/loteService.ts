const API_BASE_URL = import.meta.env.VITE_API_URL;

export const loteService = {
  // Obtener todos los lotes
  async obtenerLotes(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/lotes/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Error al obtener lotes');
    return response.json();
  },

  // Obtener un lote específico
  async obtenerLote(id: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/lotes/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Error al obtener lote');
    return response.json();
  },

  // Crear lote
  async crearLote(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/lotes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear lote');
    return response.json();
  },

  // Actualizar lote
  async actualizarLote(id: number, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/lotes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar lote');
    return response.json();
  },

  // Eliminar lote
  async eliminarLote(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/lotes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Error al eliminar lote');
  },

  // Obtener tipos de lote
  async obtenerTiposLote(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/tipos-lote/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Error al obtener tipos de lote');
    return response.json();
  },

  // Crear tipo de lote
  async crearTipoLote(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tipos-lote/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear tipo de lote');
    return response.json();
  },

  // Actualizar tipo de lote
  async actualizarTipoLote(id: number, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tipos-lote/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar tipo de lote');
    return response.json();
  },

  // Eliminar tipo de lote
  async eliminarTipoLote(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tipos-lote/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Error al eliminar tipo de lote');
  }
};