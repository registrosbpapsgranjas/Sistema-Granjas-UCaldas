import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';

const DB_NAME = 'granjasDB';
const DB_VERSION = 3;

export interface PendingData {
  [key: string]: unknown;
}

export interface OfflineAction {
  id?: number;
  tipo: 'avance' | 'completar';
  labor_id: number;
  avance?: number;
  comentario?: string;
  timestamp: string;
}

let _db: IDBPDatabase | null = null;

export const getDB = async () => {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('labores_cache')) {
        db.createObjectStore('labores_cache', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_actions')) {
        db.createObjectStore('pending_actions', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
  return _db;
};

// ── Legacy pending sync ──────────────────────────────────────────────────────
export const addPending = async (data: PendingData) => {
  const db = await getDB();
  await db.add('pending_sync', { ...data, synced: false, createdAt: new Date() });
};

export const getAllPending = async () => {
  const db = await getDB();
  return db.getAll('pending_sync');
};

export const deletePending = async (id: number) => {
  const db = await getDB();
  await db.delete('pending_sync', id);
};

export const clearAll = async () => {
  const db = await getDB();
  await db.clear('pending_sync');
};

// ── Labores cache ────────────────────────────────────────────────────────────
export const cacheLabores = async (items: any[]) => {
  const db = await getDB();
  const tx = db.transaction('labores_cache', 'readwrite');
  await tx.store.clear();
  for (const item of items) await tx.store.put(item);
  await tx.done;
};

export const getCachedLabores = async (): Promise<any[]> => {
  const db = await getDB();
  return db.getAll('labores_cache');
};

// ── Offline actions ──────────────────────────────────────────────────────────
export const addOfflineAction = async (action: Omit<OfflineAction, 'id'>) => {
  const db = await getDB();
  await db.add('pending_actions', action);
};

export const getAllOfflineActions = async (): Promise<OfflineAction[]> => {
  const db = await getDB();
  return db.getAll('pending_actions');
};

export const deleteOfflineAction = async (id: number) => {
  const db = await getDB();
  await db.delete('pending_actions', id);
};

export const countOfflineActions = async (): Promise<number> => {
  const db = await getDB();
  return db.count('pending_actions');
};
