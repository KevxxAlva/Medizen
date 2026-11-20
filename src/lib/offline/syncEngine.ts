/**
 * Motor de sincronización Offline-First (Outbox FIFO) para Medizen.
 * - Detecta automáticamente el regreso de conexión (evento `online` + Service Worker sync).
 * - Envía las operaciones pendientes a Supabase en orden estricto (FIFO).
 * - Remapea IDs temporales generados offline -> IDs reales devueltos por Supabase
 *   tanto en la URL (?id_paciente=eq.-123) como en el cuerpo JSON.
 * - Estrategia Last-Write-Wins con reintentos automáticos y panel de control para errores.
 */

import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  clearAllOutboxItems,
  clearIdMappings,
  getAllIdMappings,
  getAllOutboxItems,
  getKvValue,
  removeOutboxItem,
  saveIdMapping,
  setKvValue,
  updateOutboxItem,
  type OutboxItem,
} from "@/lib/offline/offlineDb";
import {
  getOnlineSnapshot,
  initNetworkListeners,
  isDeviceOffline,
  isOfflineError,
  markNetworkOffline,
  markNetworkOnline,
  subscribeNetworkStatus,
} from "@/lib/offline/networkState";

export const SYNC_REPLAY_HEADER = "x-medizen-sync-replay";

export interface OfflineSyncSnapshot {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  totalCount: number;
  items: OutboxItem[];
  lastSyncedAt: number | null;
}

type SyncListener = (snapshot: OfflineSyncSnapshot) => void;

const listeners = new Set<SyncListener>();
let snapshot: OfflineSyncSnapshot = {
  isOnline: getOnlineSnapshot(),
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0,
  totalCount: 0,
  items: [],
  lastSyncedAt: null,
};

let boundQueryClient: QueryClient | null = null;
let accessTokenProvider: (() => Promise<string | null>) | null = null;
let syncInFlight: Promise<void> | null = null;
let engineInitialized = false;

function emitSnapshot(partial?: Partial<OfflineSyncSnapshot>) {
  if (partial) {
    snapshot = { ...snapshot, ...partial };
  }
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch {
      // ignore listener errors
    }
  });
}

export function getSyncSnapshot(): OfflineSyncSnapshot {
  return snapshot;
}

export function subscribeSyncState(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function refreshOutboxSnapshot(): Promise<OutboxItem[]> {
  const items = await getAllOutboxItems();
  const pendingCount = items.filter((i) => i.status === "pending" || i.status === "syncing").length;
  const failedCount = items.filter((i) => i.status === "failed").length;
  const lastSyncedAt = (await getKvValue<number>("lastSyncedAt")) ?? snapshot.lastSyncedAt;

  emitSnapshot({
    isOnline: getOnlineSnapshot(),
    items,
    pendingCount,
    failedCount,
    totalCount: items.length,
    lastSyncedAt,
  });

  return items;
}

/**
 * Sustituye cualquier ID temporal conocido por su ID real de Supabase
 * dentro de una cadena (URL o JSON body).
 */
function replaceTempIdsInUrl(url: string, idMap: Map<string, string | number>): string {
  if (idMap.size === 0) return url;
  let result = url;
  for (const [tempKey, realValue] of idMap.entries()) {
    const escaped = tempKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Coincide con filtros PostgREST: eq.-123, in.(-123,-456), etc.
    const regex = new RegExp(`(?<=[=.,(])${escaped}(?=[&,)]|$)`, "g");
    result = result.replace(regex, String(realValue));
  }
  return result;
}

function replaceTempIdsInValue(value: unknown, idMap: Map<string, string | number>): unknown {
  if (idMap.size === 0 || value === null || value === undefined) return value;

  if (typeof value === "number" || typeof value === "string") {
    const mapped = idMap.get(String(value));
    if (mapped !== undefined) {
      return typeof value === "number" && typeof mapped === "number" ? mapped : mapped;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => replaceTempIdsInValue(entry, idMap));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = replaceTempIdsInValue(v, idMap);
    }
    return out;
  }

  return value;
}

function replaceTempIdsInBody(
  body: string | null,
  idMap: Map<string, string | number>,
): string | null {
  if (!body || idMap.size === 0) return body;
  try {
    const parsed = JSON.parse(body);
    const replaced = replaceTempIdsInValue(parsed, idMap);
    return JSON.stringify(replaced);
  } catch {
    return body;
  }
}

export function registerSyncRuntime(options: {
  queryClient?: QueryClient;
  getAccessToken?: () => Promise<string | null>;
}): void {
  if (options.queryClient) {
    boundQueryClient = options.queryClient;
  }
  if (options.getAccessToken) {
    accessTokenProvider = options.getAccessToken;
  }

  if (engineInitialized || typeof window === "undefined") return;
  engineInitialized = true;

  initNetworkListeners();
  void refreshOutboxSnapshot();

  subscribeNetworkStatus((online) => {
    emitSnapshot({ isOnline: online });
    if (online) {
      void syncOutboxNow({ silentIfEmpty: true });
    }
  });

  // Escuchar mensajes del Service Worker (Background Sync)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "MEDIZEN_TRIGGER_SYNC") {
        void syncOutboxNow({ silentIfEmpty: true });
      }
    });
  }

  // Si arrancamos con internet y hay elementos pendientes de una sesión offline anterior
  if (!isDeviceOffline()) {
    setTimeout(() => {
      void syncOutboxNow({ silentIfEmpty: true });
    }, 1500);
  }
}

export async function syncOutboxNow(options?: {
  includeFailed?: boolean;
  silentIfEmpty?: boolean;
}): Promise<void> {
  if (typeof window === "undefined") return;
  if (syncInFlight) return syncInFlight;
  if (isDeviceOffline()) {
    emitSnapshot({ isOnline: false });
    return;
  }

  syncInFlight = (async () => {
    const allItems = await refreshOutboxSnapshot();
    const targets = allItems.filter((item) =>
      options?.includeFailed
        ? item.status === "pending" || item.status === "failed" || item.status === "syncing"
        : item.status === "pending" || item.status === "syncing",
    );

    if (targets.length === 0) {
      if (!options?.silentIfEmpty && allItems.length === 0) {
        toast.info("Todos los datos están sincronizados");
      }
      return;
    }

    emitSnapshot({ isSyncing: true, isOnline: true });

    const idMap = await getAllIdMappings();
    let syncedCount = 0;
    let failedCount = 0;
    let abortedDueToNetwork = false;

    const freshToken = accessTokenProvider ? await accessTokenProvider().catch(() => null) : null;

    for (const item of targets) {
      if (isDeviceOffline()) {
        abortedDueToNetwork = true;
        break;
      }

      const workingItem: OutboxItem = { ...item, status: "syncing" };
      await updateOutboxItem(workingItem);

      const resolvedUrl = replaceTempIdsInUrl(item.url, idMap);
      const resolvedBody = replaceTempIdsInBody(item.body, idMap);

      const headers = new Headers(item.headers);
      if (freshToken) {
        headers.set("authorization", `Bearer ${freshToken}`);
      }
      headers.set(SYNC_REPLAY_HEADER, "1");
      if (item.tempId && !headers.get("prefer")?.includes("return=representation")) {
        const existingPrefer = headers.get("prefer");
        headers.set(
          "prefer",
          existingPrefer ? `${existingPrefer}, return=representation` : "return=representation",
        );
      }

      try {
        const response = await window.fetch(resolvedUrl, {
          method: item.method,
          headers,
          body: resolvedBody,
        });

        if (response.ok) {
          markNetworkOnline();

          // Si el registro tenía un ID temporal, capturar el ID real devuelto por Supabase
          if (item.tempId) {
            try {
              const text = await response.text();
              if (text) {
                const json = JSON.parse(text);
                const row = Array.isArray(json) ? json[0] : json;
                const realVal = row?.[item.tempId.column];
                if (realVal !== undefined && realVal !== null) {
                  idMap.set(String(item.tempId.value), realVal);
                  await saveIdMapping(item.tempId.value, realVal, item.table);
                }
              }
            } catch {
              // ignore non-JSON body
            }
          }

          await removeOutboxItem(item.id);
          syncedCount += 1;
        } else if (response.status >= 500 || response.status === 408 || response.status === 429) {
          // Error temporal del servidor: mantener pendiente para reintentar luego
          await updateOutboxItem({
            ...item,
            status: "pending",
            retryCount: item.retryCount + 1,
            lastError: `Servidor temporalmente no disponible (HTTP ${response.status})`,
          });
          abortedDueToNetwork = true;
          break;
        } else if (response.status === 401 || response.status === 403) {
          // Sesión expirada o permisos: mantener en failed con mensaje claro
          const errText = await response.text().catch(() => "");
          await updateOutboxItem({
            ...item,
            status: "failed",
            retryCount: item.retryCount + 1,
            lastError:
              errText || `Error de autorización (HTTP ${response.status}). Inicia sesión nuevamente.`,
          });
          failedCount += 1;
        } else {
          // Error 4xx (validación / conflicto / clave duplicada)
          let errMsg = `Error HTTP ${response.status}`;
          try {
            const errJson = await response.json();
            errMsg = errJson?.message || errJson?.details || errJson?.hint || errMsg;
          } catch {
            // ignore
          }
          await updateOutboxItem({
            ...item,
            status: "failed",
            retryCount: item.retryCount + 1,
            lastError: errMsg,
          });
          failedCount += 1;
        }
      } catch (err) {
        if (isOfflineError(err)) {
          markNetworkOffline();
          await updateOutboxItem({ ...item, status: "pending" });
          abortedDueToNetwork = true;
          break;
        }

        await updateOutboxItem({
          ...item,
          status: "failed",
          retryCount: item.retryCount + 1,
          lastError: err instanceof Error ? err.message : "Error desconocido al sincronizar",
        });
        failedCount += 1;
      }
    }

    const now = Date.now();
    if (syncedCount > 0) {
      await setKvValue("lastSyncedAt", now);
    }

    const remaining = await refreshOutboxSnapshot();
    if (remaining.length === 0) {
      // Ya no hay operaciones pendientes: limpiar mapa de IDs temporales antiguos
      await clearIdMappings();
    }

    emitSnapshot({ isSyncing: false, lastSyncedAt: syncedCount > 0 ? now : snapshot.lastSyncedAt });

    if (syncedCount > 0) {
      if (boundQueryClient) {
        await boundQueryClient.invalidateQueries();
      }
      toast.success(
        syncedCount === 1
          ? "1 cambio local sincronizado con la nube"
          : `${syncedCount} cambios locales sincronizados con la nube`,
      );
    }

    if (failedCount > 0) {
      toast.error(
        failedCount === 1
          ? "1 cambio no pudo sincronizarse. Revisa el centro de sincronización."
          : `${failedCount} cambios no pudieron sincronizarse. Revisa el centro de sincronización.`,
      );
    } else if (abortedDueToNetwork && syncedCount === 0) {
      // Sin ruido excesivo si se volvió a caer la red
    }
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

export async function retryFailedItem(itemId: string): Promise<void> {
  const items = await getAllOutboxItems();
  const target = items.find((i) => i.id === itemId);
  if (!target) return;
  await updateOutboxItem({ ...target, status: "pending", lastError: null });
  await refreshOutboxSnapshot();
  if (!isDeviceOffline()) {
    await syncOutboxNow({ includeFailed: false });
  }
}

export async function discardOutboxItem(itemId: string): Promise<void> {
  await removeOutboxItem(itemId);
  await refreshOutboxSnapshot();
  if (boundQueryClient && !isDeviceOffline()) {
    void boundQueryClient.invalidateQueries();
  }
}

export async function clearOutboxQueue(): Promise<void> {
  await clearAllOutboxItems();
  await clearIdMappings();
  await refreshOutboxSnapshot();
}
