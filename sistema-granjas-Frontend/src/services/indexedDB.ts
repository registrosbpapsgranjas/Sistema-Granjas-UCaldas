import { openDB } from 'idb';

const DB_NAME = 'granjasDB';
const STORE_NAME = 'pending_sync';

// 📌 Definimos el tipo que vamos a guardar en la DB
export interface PendingData {
  [key: string]: unknown;
}

export const getDB = async () => {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

// ✅ Ahora data es un objeto tipado
export const addPending = async (data: PendingData) => {
  const db = await getDB();
  const record = {
    ...data,
    synced: false,
    createdAt: new Date(),
  };
  await db.add(STORE_NAME, record);
};

export const getAllPending = async () => {
  const db = await getDB();
  return await db.getAll(STORE_NAME);
};

export const deletePending = async (id: number) => {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
};

export const clearAll = async () => {
  const db = await getDB();
  await db.clear(STORE_NAME);
};
