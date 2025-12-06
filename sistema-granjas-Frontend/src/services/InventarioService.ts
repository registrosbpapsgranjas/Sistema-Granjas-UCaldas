import type {
  CategoriaInventario, CategoriaFormData,
  Herramienta, HerramientaFormData,
  Insumo, InsumoFormData,
  MovimientoHerramienta, MovimientoInsumo,
  InventarioStats
} from '../types/Inventariotypes';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.message || `Error ${response.status}: ${response.statusText}`
    );
  }
  return response.json();
};

export const inventarioService = {
  // ========== CATEGORÍAS ==========
  
  // OBTENER todas las categorías
  async obtenerCategorias(): Promise<CategoriaInventario[]> {
    const response = await fetch(`${API_BASE_URL}/categorias`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // CREAR categoría
  async crearCategoria(data: CategoriaFormData): Promise<CategoriaInventario> {
    const response = await fetch(`${API_BASE_URL}/categorias`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // ACTUALIZAR categoría
  async actualizarCategoria(id: number, data: Partial<CategoriaFormData>): Promise<CategoriaInventario> {
    const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // ELIMINAR categoría
  async eliminarCategoria(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // ========== HERRAMIENTAS ==========
  
  // OBTENER todas las herramientas
  async obtenerHerramientas(): Promise<Herramienta[]> {
    const response = await fetch(`${API_BASE_URL}/herramientas`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // OBTENER herramienta por ID
  async obtenerHerramientaPorId(id: number): Promise<Herramienta> {
    const response = await fetch(`${API_BASE_URL}/herramientas/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // CREAR herramienta
  async crearHerramienta(data: HerramientaFormData): Promise<Herramienta> {
    const response = await fetch(`${API_BASE_URL}/herramientas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // ACTUALIZAR herramienta
  async actualizarHerramienta(id: number, data: Partial<HerramientaFormData>): Promise<Herramienta> {
    const response = await fetch(`${API_BASE_URL}/herramientas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // ELIMINAR herramienta
  async eliminarHerramienta(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/herramientas/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // ========== INSUMOS ==========
  
  // OBTENER todos los insumos
  async obtenerInsumos(): Promise<Insumo[]> {
    const response = await fetch(`${API_BASE_URL}/insumos`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // OBTENER insumo por ID
  async obtenerInsumoPorId(id: number): Promise<Insumo> {
    const response = await fetch(`${API_BASE_URL}/insumos/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // CREAR insumo
  async crearInsumo(data: InsumoFormData): Promise<Insumo> {
    const response = await fetch(`${API_BASE_URL}/insumos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // ACTUALIZAR insumo
  async actualizarInsumo(id: number, data: Partial<InsumoFormData>): Promise<Insumo> {
    const response = await fetch(`${API_BASE_URL}/insumos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // ELIMINAR insumo
  async eliminarInsumo(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/insumos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  },

  // ========== MOVIMIENTOS ==========
  
  // OBTENER movimientos de herramientas
  async obtenerMovimientosHerramientas(params?: { skip?: number; limit?: number }): Promise<MovimientoHerramienta[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/movimientos/herramientas${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // OBTENER movimientos de insumos
  async obtenerMovimientosInsumos(params?: { skip?: number; limit?: number }): Promise<MovimientoInsumo[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/movimientos/insumos${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // OBTENER movimiento específico de herramienta
  async obtenerMovimientoHerramienta(id: number): Promise<MovimientoHerramienta> {
    const response = await fetch(`${API_BASE_URL}/movimientos/herramientas/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // OBTENER movimiento específico de insumo
  async obtenerMovimientoInsumo(id: number): Promise<MovimientoInsumo> {
    const response = await fetch(`${API_BASE_URL}/movimientos/insumos/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // ========== ESTADÍSTICAS ==========
  
  // OBTENER estadísticas del inventario
  async obtenerEstadisticas(dias: number = 30): Promise<InventarioStats> {
    const response = await fetch(`${API_BASE_URL}/movimientos/estadisticas/resumen?dias=${dias}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      // Si el endpoint no existe, calcular estadísticas manualmente
      return this.calcularEstadisticasManuales();
    }
    
    return handleResponse(response);
  },

  // Calcular estadísticas manualmente si el endpoint no existe
  async calcularEstadisticasManuales(): Promise<InventarioStats> {
    const [herramientas, insumos] = await Promise.all([
      this.obtenerHerramientas(),
      this.obtenerInsumos()
    ]);

    return {
      total_herramientas: herramientas.length,
      total_insumos: insumos.length,
      herramientas_disponibles: herramientas.filter(h => h.estado === 'disponible').length,
      insumos_disponibles: insumos.filter(i => i.estado === 'disponible').length,
      herramientas_agotadas: herramientas.filter(h => h.estado === 'agotado').length,
      insumos_agotados: insumos.filter(i => i.estado === 'agotado').length,
      bajo_stock_insumos: insumos.filter(i => 
        i.estado !== 'agotado' && i.cantidad_disponible < i.nivel_alerta
      ).length,
      movimientos_recientes: 0 // No podemos calcular esto sin endpoint
    };
  }
};

// Alias para compatibilidad
export default inventarioService;