// src/services/exportService.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Función para obtener headers con token
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

// Función para manejar la descarga de archivos Excel
const handleExcelDownload = async (response: Response, filename: string) => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error response export:', errorText);
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${filename}_${today}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  
  return { success: true, filename: `${filename}_${today}.xlsx` };
};

export const exportService = {
  // ========== EXPORTACIONES ESPECÍFICAS ==========
  
  async exportarBackupCompleto(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/backup/excel`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, 'backup_completo');
  },

  async exportarGranjas(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/granjas/excel`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, 'granjas');
  },

  async exportarLotes(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/lotes/excel`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, 'lotes');
  },

  // ✅ NUEVO: Exportar lotes filtrados por programa
  async exportarLotesPorPrograma(programaId: number): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/lotes?programa_id=${programaId}`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, `lotes_programa_${programaId}`);
  },

  async exportarDiagnosticos(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/diagnosticos/excel`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, 'diagnosticos');
  },

  async exportarRecomendaciones(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/recomendaciones/excel`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, 'recomendaciones');
  },

  async exportarLabores(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/labores/excel`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, 'labores');
  },

  async exportarInventario(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/inventario/excel`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, 'inventario');
  },

  async exportarUsuarios(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/usuarios/excel`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, 'usuarios');
  },

  async exportarProgramas(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/programas/excel`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, 'programas');
  },

  // Exportar programas filtrados por granja
  async exportarProgramasPorGranja(granjaId: number): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/programas?granja_id=${granjaId}`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, `programas_granja_${granjaId}`);
  },

  async exportarCultivos(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/cultivos/excel`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, 'cultivos');
  },

  async exportarMovimientos(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/movimientos/excel`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, 'movimientos');
  },

  async exportarResumen(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/resumen/excel`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, 'resumen_general');
  },

  // ========== EXPORTACIONES GENÉRICAS ==========
  
  async exportarRecurso(recurso: string): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/${recurso.toLowerCase()}/excel`;
    const response = await fetch(url, { method: 'GET', headers: getHeaders() });
    return handleExcelDownload(response, recurso.toLowerCase());
  }
};

// ========== ALIAS PARA MANTENER COMPATIBILIDAD ==========

export const exportBackup = exportService.exportarBackupCompleto;
export const exportGranjas = exportService.exportarGranjas;
export const exportLotes = exportService.exportarLotes;
export const exportLotesPorPrograma = exportService.exportarLotesPorPrograma; // ✅ Nuevo alias
export const exportDiagnosticos = exportService.exportarDiagnosticos;
export const exportRecomendaciones = exportService.exportarRecomendaciones;
export const exportLabores = exportService.exportarLabores;
export const exportInventario = exportService.exportarInventario;
export const exportUsuarios = exportService.exportarUsuarios;
export const exportProgramas = exportService.exportarProgramas;
export const exportProgramasPorGranja = exportService.exportarProgramasPorGranja;
export const exportCultivos = exportService.exportarCultivos;
export const exportMovimientos = exportService.exportarMovimientos;
export const exportResumen = exportService.exportarResumen;
export const exportResource = exportService.exportarRecurso;

export default exportService;