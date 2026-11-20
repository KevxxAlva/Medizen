/**
 * Base de datos local IndexedDB para el modo Offline-First de Medizen.
 * Almacena:
 *  - queryCache: Caché persistente L2 sin límite de 5MB (pacientes, citas, consultas, facturas, etc.)
 *  - syncOutbox: Cola FIFO de operaciones pendientes por sincronizar con Supabase
 *  - idMap: Mapa de IDs temporales generados offline -> IDs reales devueltos por Supabase
 *  - kv: Metadatos de sincronización (última sincronización, etc.)
 */

const DB_NAME = "medizen_offline_db";
const DB_VERSION = 1;

export const STORE_QUERY_CACHE = "queryCache";
export const STORE_SYNC_OUTBOX = "syncOutbox";
export const STORE_ID_MAP = "idMap";
export const STORE_KV = "kv";

export interface CachedQueryRecord {
  queryHash: string;
  queryKey: readonly unknown[];
  data: unknown;
  dataUpdatedAt: number;
}

export interface TempIdInfo {
  column: string;
  value: string | number;
}

export interface OutboxItem {
  id: string;
  createdAt: number;
  kind: "rest";
  table: string;
  method: "POST" | "PATCH" | "PUT" | "DELETE";
  url: string;
  headers: Record<string, string>;
  body: string | null;
  label: string;
  tempId?: TempIdInfo;
  status: "pending" | "syncing" | "failed";
  retryCount: number;
  lastError: string | null;
}

export interface IdMappingRecord {
  tempKey: string;
  realValue: string | number;
  table: string;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

export function openOfflineDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_QUERY_CACHE)) {
          db.createObjectStore(STORE_QUERY_CACHE, { keyPath: "queryHash" });
        }
        if (!db.objectStoreNames.contains(STORE_SYNC_OUTBOX)) {
          const outbox = db.createObjectStore(STORE_SYNC_OUTBOX, { keyPath: "id" });
          outbox.createIndex("byCreatedAt", "createdAt", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_ID_MAP)) {
          db.createObjectStore(STORE_ID_MAP, { keyPath: "tempKey" });
        }
        if (!db.objectStoreNames.contains(STORE_KV)) {
          db.createObjectStore(STORE_KV, { keyPath: "key" });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        console.warn("[OfflineDB] No se pudo abrir IndexedDB:", request.error);
        dbPromise = null;
        resolve(null);
      };
    } catch (err) {
      console.warn("[OfflineDB] Error inicializando IndexedDB:", err);
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

function runTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return openOfflineDb().then((db) => {
    if (!db) return null;
    return new Promise<T | null>((resolve) => {
      try {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const req = executor(store);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => {
          console.warn(`[OfflineDB] Error en ${storeName}:`, req.error);
          resolve(null);
        };
      } catch (err) {
        console.warn(`[OfflineDB] Excepción en ${storeName}:`, err);
        resolve(null);
      }
    });
  });
}

// ─── Query Cache Store ────────────────────────────────────────────────────────

export async function loadAllCachedQueries(): Promise<CachedQueryRecord[]> {
  const result = await runTx<CachedQueryRecord[]>(STORE_QUERY_CACHE, "readonly", (store) =>
    store.getAll(),
  );
  return Array.isArray(result) ? result : [];
}

export async function saveCachedQueriesBatch(records: CachedQueryRecord[]): Promise<void> {
  const db = await openOfflineDb();
  if (!db || records.length === 0) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_QUERY_CACHE, "readwrite");
      const store = tx.objectStore(STORE_QUERY_CACHE);
      for (const rec of records) {
        store.put(rec);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function clearCachedQueries(): Promise<void> {
  await runTx(STORE_QUERY_CACHE, "readwrite", (store) => store.clear());
}

// ─── Sync Outbox Store ────────────────────────────────────────────────────────

export async function enqueueOutboxItem(item: OutboxItem): Promise<void> {
  await runTx(STORE_SYNC_OUTBOX, "readwrite", (store) => store.put(item));
}

export async function getAllOutboxItems(): Promise<OutboxItem[]> {
  const result = await runTx<OutboxItem[]>(STORE_SYNC_OUTBOX, "readonly", (store) =>
    store.getAll(),
  );
  if (!Array.isArray(result)) return [];
  return result.sort((a, b) => a.createdAt - b.createdAt);
}

export async function updateOutboxItem(item: OutboxItem): Promise<void> {
  await runTx(STORE_SYNC_OUTBOX, "readwrite", (store) => store.put(item));
}

export async function removeOutboxItem(id: string): Promise<void> {
  await runTx(STORE_SYNC_OUTBOX, "readwrite", (store) => store.delete(id));
}

export async function clearAllOutboxItems(): Promise<void> {
  await runTx(STORE_SYNC_OUTBOX, "readwrite", (store) => store.clear());
}

// ─── ID Mapping Store ─────────────────────────────────────────────────────────

export async function saveIdMapping(
  tempValue: string | number,
  realValue: string | number,
  table: string,
): Promise<void> {
  const record: IdMappingRecord = {
    tempKey: String(tempValue),
    realValue,
    table,
    createdAt: Date.now(),
  };
  await runTx(STORE_ID_MAP, "readwrite", (store) => store.put(record));
}

export async function getAllIdMappings(): Promise<Map<string, string | number>> {
  const result = await runTx<IdMappingRecord[]>(STORE_ID_MAP, "readonly", (store) =>
    store.getAll(),
  );
  const map = new Map<string, string | number>();
  if (Array.isArray(result)) {
    for (const rec of result) {
      map.set(rec.tempKey, rec.realValue);
    }
  }
  return map;
}

export async function clearIdMappings(): Promise<void> {
  await runTx(STORE_ID_MAP, "readwrite", (store) => store.clear());
}

// ─── Key-Value Store ──────────────────────────────────────────────────────────

export async function setKvValue<T>(key: string, value: T): Promise<void> {
  await runTx(STORE_KV, "readwrite", (store) => store.put({ key, value }));
}

export async function getKvValue<T>(key: string): Promise<T | null> {
  const res = await runTx<{ key: string; value: T }>(STORE_KV, "readonly", (store) =>
    store.get(key),
  );
  return res ? res.value : null;
}
