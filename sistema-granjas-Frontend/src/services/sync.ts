import { getAllPending, deletePending } from './indexedDB';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/sync`; // Ajusta según tu backend real

export const syncPendingData = async () => {
  try {
    const pendientes = await getAllPending();
    if (pendientes.length === 0) {
      console.log('✅ No hay datos pendientes para sincronizar.');
      return;
    }

    console.log(`🔄 Sincronizando ${pendientes.length} registros...`);

    for (const item of pendientes) {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (response.ok) {
        await deletePending(item.id);
        console.log(`✅ Registro sincronizado y eliminado localmente: ${item.id}`);
      } else {
        console.warn(`⚠️ Error al sincronizar el registro ${item.id}`);
      }
    }
  } catch (error) {
    console.error('❌ Error en la sincronización:', error);
  }
};
