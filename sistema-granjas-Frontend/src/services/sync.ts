import { getAllPending, deletePending, getAllOfflineActions, deleteOfflineAction } from './indexedDB';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const syncPendingData = async () => {
  try {
    // 1. Sync offline labor actions
    const acciones = await getAllOfflineActions();
    if (acciones.length > 0) {
      let synced = 0;
      for (const accion of acciones) {
        try {
          let url = '';
          let body: any = {};
          if (accion.tipo === 'avance') {
            url = `${API_BASE}/labores/${accion.labor_id}/avance`;
            body = { avance_porcentaje: accion.avance, comentario: accion.comentario };
          } else if (accion.tipo === 'completar') {
            url = `${API_BASE}/labores/${accion.labor_id}/completar`;
          }
          if (!url) continue;
          const res = await fetch(url, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
          if (res.ok) {
            await deleteOfflineAction(accion.id!);
            synced++;
          }
        } catch { /* skip */ }
      }
      if (synced > 0) console.log(`✅ ${synced} acción(es) offline sincronizada(s)`);
    }

    // 2. Sync legacy pending_sync store (kept for backward compat)
    const pendientes = await getAllPending();
    if (pendientes.length === 0) return;
    for (const item of pendientes) {
      try {
        const res = await fetch(`${API_BASE}/sync`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(item),
        });
        if (res.ok) await deletePending(item.id as number);
      } catch { /* skip */ }
    }
  } catch (error) {
    console.error('Error en sincronización:', error);
  }
};
