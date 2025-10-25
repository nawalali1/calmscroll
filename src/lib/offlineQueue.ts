import { INDEXEDDB_CONFIG } from "@/config/constants";

const DB_NAME = INDEXEDDB_CONFIG.NAME;
const DB_VERSION = INDEXEDDB_CONFIG.VERSION;
const STORE_NAME = INDEXEDDB_CONFIG.QUEUE_STORE_NAME;

export type QueueItem<T = unknown> = {
  id: string;
  type: string;
  payload: T;
  createdAt: number;
};

function withDb<T>(callback: (db: IDBDatabase) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const { result } = request;
      if (!result.objectStoreNames.contains(STORE_NAME)) {
        result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = async () => {
      const db = request.result;
      try {
        const output = await callback(db);
        resolve(output);
      } catch (error) {
        reject(error);
      } finally {
        db.close();
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function enqueue<T>(item: QueueItem<T>) {
  return withDb(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(item);
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error);
      })
  );
}

export async function listQueue<T>(): Promise<QueueItem<T>[]> {
  return withDb(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve((request.result as QueueItem<T>[]) ?? []);
        request.onerror = () => reject(request.error);
      })
  );
}

export async function deleteFromQueue(id: string) {
  return withDb(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error);
      })
  );
}

export async function clearQueue() {
  return withDb(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error);
      })
  );
}

export async function syncQueue<T>(
  handler: (item: QueueItem<T>) => Promise<void>,
  options: { onSuccess?: (item: QueueItem<T>) => void; onError?: (item: QueueItem<T>, error: unknown) => void } = {}
) {
  const items = await listQueue<T>();
  for (const item of items.sort((a, b) => a.createdAt - b.createdAt)) {
    try {
      await handler(item);
      await deleteFromQueue(item.id);
      options.onSuccess?.(item);
    } catch (error) {
      options.onError?.(item, error);
    }
  }
}
