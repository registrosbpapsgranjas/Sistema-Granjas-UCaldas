import { useEffect } from 'react';
import { addPending, getAllPending } from './services/indexedDB';
import { syncPendingData } from './services/sync';

function App() {
  useEffect(() => {
    // Al reconectarse, intenta sincronizar
    const handleOnline = () => {
      console.log('🌐 Conexión restablecida. Iniciando sincronización...');
      syncPendingData();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
  useEffect(() => {
    const testDB = async () => {
      await addPending({ tipo: 'registro_prueba', data: { nombre: 'Granja 1' } });
      const pendientes = await getAllPending();
      console.log('📦 Datos almacenados en IndexedDB:', pendientes);
    };
    testDB();
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-green-50 text-green-800">
      <h1 className="text-2xl font-bold">🌱 Sistema de Granjas - Modo Offline</h1>
      <p>Revisa la consola para ver si los datos se guardaron en IndexedDB.</p>
    </div>
  );
}

export default App;
