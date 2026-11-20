import type { QueryClient } from "@tanstack/react-query";
import {
  clearCachedQueries,
  loadAllCachedQueries,
  saveCachedQueriesBatch,
  type CachedQueryRecord,
} from "@/lib/offline/offlineDb";

const L2_FAST_STORAGE_KEY = "medizen_l2_query_cache_v2";
const L2_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 días de retención offline en IndexedDB
const SAVE_DEBOUNCE_MS = 600;

/**
 * Claves livianas que también se guardan en localStorage para hidratación síncrona en 0 ms.
 */
const FAST_SYNC_KEYS = new Set<string>([
  "clinic_info",
  "my_profile",
  "profile",
  "user_roles",
  "current_clinic_id",
  "roles",
  "audit_logs",
]);

/**
 * Prefijos de Query Keys que se persisten en IndexedDB para funcionamiento completo Offline-First.
 */
const PERSISTABLE_ROOT_KEYS = new Set<string>([
  "clinic_info",
  "my_profile",
  "profile",
  "user_roles",
  "current_clinic_id",
  "roles",
  "audit_logs",
  "doctors",
  "profiles_with_roles",
  "patients",
  "patient",
  "patients_count",
  "patients_growth",
  "patients_count_range",
  "patients_recent",
  "patients_paginated",
  "appointments",
  "consultations",
  "consultation",
  "patient_consultations",
  "consultation_by_appointment",
  "clinical_notes",
  "services",
  "specialties",
  "payment_methods",
  "financial_accounts",
  "accounts",
  "facturas",
  "sales_invoices",
  "stocks",
  "inventory_stocks",
  "purchases",
  "financial_purchases",
  "dashboard_stats",
  "dashboard_trends",
  "dashboard_top_treatments",
  "monthly_payments",
  "daily_goals",
  "support_tickets",
  "global_announcement",
]);

interface PersistedFastPayload {
  version: 2;
  savedAt: number;
  entries: Record<string, CachedQueryRecord>;
}

function shouldPersistKey(queryKey: readonly unknown[]): boolean {
  if (!Array.isArray(queryKey) || queryKey.length === 0) return false;
  const root = String(queryKey[0]);
  return PERSISTABLE_ROOT_KEYS.has(root);
}

function isFastSyncKey(queryKey: readonly unknown[]): boolean {
  if (!Array.isArray(queryKey) || queryKey.length === 0) return false;
  return FAST_SYNC_KEYS.has(String(queryKey[0]));
}

/**
 * Hidrata la Caché L1 (RAM de TanStack Query) desde:
 *  1) localStorage síncrono (0 ms para perfil/clínica/roles)
 *  2) IndexedDB asíncrono (sin límite de 5MB para pacientes, citas, consultas, facturas, inventario, etc.)
 * y mantiene sincronizada la persistencia con escritura diferida (debounced).
 */
export function setupPersistentQueryCache(queryClient: QueryClient): void {
  if (typeof window === "undefined") return;

  const now = Date.now();

  // 1. Hidratación síncrona rápida desde localStorage (claves livianas)
  try {
    const raw = window.localStorage.getItem(L2_FAST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedFastPayload;
      if (parsed && parsed.version === 2 && parsed.entries) {
        for (const entry of Object.values(parsed.entries)) {
          if (
            entry &&
            entry.data !== undefined &&
            now - entry.dataUpdatedAt < L2_MAX_AGE_MS &&
            shouldPersistKey(entry.queryKey)
          ) {
            queryClient.setQueryData(entry.queryKey, entry.data, {
              updatedAt: entry.dataUpdatedAt,
            });
          }
        }
      }
    }
  } catch {
    try {
      window.localStorage.removeItem(L2_FAST_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  // Limpiar llave heredada v1 si existía para liberar espacio de localStorage
  try {
    window.localStorage.removeItem("medizen_l2_query_cache_v1");
  } catch {
    // ignore
  }

  // 2. Hidratación completa desde IndexedDB (pacientes, citas, consultas, facturas, etc.)
  void loadAllCachedQueries().then((records) => {
    const currentTime = Date.now();
    for (const entry of records) {
      if (
        !entry ||
        entry.data === undefined ||
        currentTime - entry.dataUpdatedAt >= L2_MAX_AGE_MS ||
        !shouldPersistKey(entry.queryKey)
      ) {
        continue;
      }

      const existing = queryClient.getQueryState(entry.queryKey);
      // No sobrescribir datos más recientes que ya llegaron de la red
      if (!existing || existing.data === undefined || existing.dataUpdatedAt < entry.dataUpdatedAt) {
        queryClient.setQueryData(entry.queryKey, entry.data, {
          updatedAt: entry.dataUpdatedAt,
        });
      }
    }
  });

  // 3. Suscripción con Debounce para persistir actualizaciones exitosas en IndexedDB + Fast Storage
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const schedulePersist = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const queries = queryClient.getQueryCache().getAll();
      const idbBatch: CachedQueryRecord[] = [];
      const fastEntries: Record<string, CachedQueryRecord> = {};
      const ts = Date.now();

      for (const q of queries) {
        if (
          q.state.status === "success" &&
          q.state.data !== undefined &&
          ts - q.state.dataUpdatedAt < L2_MAX_AGE_MS &&
          shouldPersistKey(q.queryKey)
        ) {
          const rec: CachedQueryRecord = {
            queryHash: q.queryHash,
            queryKey: q.queryKey,
            data: q.state.data,
            dataUpdatedAt: q.state.dataUpdatedAt,
          };
          idbBatch.push(rec);
          if (isFastSyncKey(q.queryKey)) {
            fastEntries[q.queryHash] = rec;
          }
        }
      }

      if (idbBatch.length > 0) {
        void saveCachedQueriesBatch(idbBatch);
      }

      try {
        const fastPayload: PersistedFastPayload = {
          version: 2,
          savedAt: ts,
          entries: fastEntries,
        };
        window.localStorage.setItem(L2_FAST_STORAGE_KEY, JSON.stringify(fastPayload));
      } catch {
        // Ignorar errores de cuota en localStorage
      }
    }, SAVE_DEBOUNCE_MS);
  };

  queryClient.getQueryCache().subscribe((event) => {
    if (
      event.type === "updated" &&
      event.query.state.status === "success" &&
      shouldPersistKey(event.query.queryKey)
    ) {
      schedulePersist();
    }
  });
}

/**
 * Limpia la Caché L2 Persistente (útil al cerrar sesión).
 */
export function clearPersistentQueryCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(L2_FAST_STORAGE_KEY);
    window.localStorage.removeItem("medizen_l2_query_cache_v1");
  } catch {
    // ignore
  }
  void clearCachedQueries();
}
