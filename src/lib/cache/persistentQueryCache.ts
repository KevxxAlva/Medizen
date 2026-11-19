import type { QueryClient } from "@tanstack/react-query";

const L2_STORAGE_KEY = "medizen_l2_query_cache_v1";
const L2_MAX_AGE_MS = 1000 * 60 * 30; // 30 minutos de validez máxima en disco
const SAVE_DEBOUNCE_MS = 800;

/**
 * Prefijos de Query Keys que se persisten en la Caché L2 (Web Storage)
 * para lograr carga en 0 ms al abrir o refrescar la aplicación (Stale-While-Revalidate).
 */
const PERSISTABLE_ROOT_KEYS = new Set<string>([
  "clinic_info",
  "doctors",
  "services",
  "payment_methods",
  "financial_accounts",
  "accounts",
  "dashboard_stats",
  "dashboard_trends",
  "dashboard_top_treatments",
  "facturas",
  "stocks",
  "inventory_stocks",
  "roles",
  "my_profile",
]);

interface PersistedEntry {
  queryKey: readonly unknown[];
  data: unknown;
  dataUpdatedAt: number;
}

interface PersistedPayload {
  version: 1;
  savedAt: number;
  entries: Record<string, PersistedEntry>;
}

function shouldPersistKey(queryKey: readonly unknown[]): boolean {
  if (!Array.isArray(queryKey) || queryKey.length === 0) return false;
  const root = String(queryKey[0]);
  return PERSISTABLE_ROOT_KEYS.has(root);
}

/**
 * Hidrata la Caché L1 (RAM de TanStack Query) desde la Caché L2 (localStorage)
 * y mantiene sincronizada la persistencia con escritura diferida (debounced).
 */
export function setupPersistentQueryCache(queryClient: QueryClient): void {
  if (typeof window === "undefined") return;

  // 1. Hidratación inicial en 0 ms desde L2 -> L1
  try {
    const raw = window.localStorage.getItem(L2_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedPayload;
      const now = Date.now();
      if (parsed && parsed.version === 1 && parsed.entries) {
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
    // Si el almacenamiento está corrupto, se limpia silenciosamente
    try {
      window.localStorage.removeItem(L2_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  // 2. Suscripción con Debounce para persistir actualizaciones exitosas en L2
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const schedulePersist = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const queries = queryClient.getQueryCache().getAll();
        const entries: Record<string, PersistedEntry> = {};
        const now = Date.now();

        for (const q of queries) {
          if (
            q.state.status === "success" &&
            q.state.data !== undefined &&
            now - q.state.dataUpdatedAt < L2_MAX_AGE_MS &&
            shouldPersistKey(q.queryKey)
          ) {
            entries[q.queryHash] = {
              queryKey: q.queryKey,
              data: q.state.data,
              dataUpdatedAt: q.state.dataUpdatedAt,
            };
          }
        }

        const payload: PersistedPayload = {
          version: 1,
          savedAt: now,
          entries,
        };
        window.localStorage.setItem(L2_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Ignorar errores de cuota de almacenamiento (QuotaExceededError)
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
    window.localStorage.removeItem(L2_STORAGE_KEY);
  } catch {
    // ignore
  }
}
