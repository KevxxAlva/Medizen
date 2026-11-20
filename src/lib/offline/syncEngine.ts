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
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let consecutiveNetworkRetries = 0;

function scheduleSyncRetry(delayMs: number) {
  if (typeof window === "undefined") return;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (!isDeviceOffline()) {
      void syncOutboxNow({ silentIfEmpty: true });
    }
  }, delayMs);
}

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

export function getBoundQueryClient(): QueryClient | null {
  return boundQueryClient;
}

/**
 * Devuelve true cuando no hay internet O todavía hay cambios locales pendientes
 * por subir a Supabase, para evitar que un refetch sobrescriba datos locales
 * antes de que termine la sincronización.
 */
export function shouldServeLocalCacheOnly(): boolean {
  return isDeviceOffline() || snapshot.pendingCount > 0;
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

function sanitizeLegacyPayloadForTable(table: string, body: string | null): string | null {
  if (!body) return body;
  if (table !== "financial_accounts" && table !== "payment_methods") return body;
  try {
    const parsed = JSON.parse(body);
    const fixRow = (row: Record<string, unknown>) => {
      if (table === "financial_accounts" && typeof row.type === "string" && row.type.length > 50) {
        const base = row.type.split("||")[0].trim();
        row.type = base === "CashVES" ? "Cash" : base === "Cashea" ? "Digital" : base.slice(0, 50);
      }
      if (table === "payment_methods" && typeof row.category === "string" && row.category.length > 50) {
        row.category = row.category.split("||")[0].trim().slice(0, 50);
      }
      return row;
    };
    if (Array.isArray(parsed)) {
      return JSON.stringify(parsed.map((r) => (r && typeof r === "object" ? fixRow(r as Record<string, unknown>) : r)));
    }
    if (parsed && typeof parsed === "object") {
      return JSON.stringify(fixRow(parsed as Record<string, unknown>));
    }
    return body;
  } catch {
    return body;
  }
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

/**
 * Reemplaza un ID temporal por su ID real en TODAS las cachés de React Query
 * (activas e inactivas) para que ningún paciente/cita/factura quede con ID negativo.
 */
function rewriteTempIdInAllCaches(
  qc: QueryClient | null,
  tempValue: string | number,
  realValue: string | number,
): void {
  if (!qc) return;
  const miniMap = new Map<string, string | number>([[String(tempValue), realValue]]);
  const tempStr = String(tempValue);

  const patchVal = (val: unknown): unknown => {
    if (val === null || val === undefined) return val;
    if (typeof val === "number" && String(val) === tempStr) {
      return typeof realValue === "number" ? realValue : Number(realValue) || realValue;
    }
    if (typeof val === "string" && val === tempStr) {
      return String(realValue);
    }
    if (Array.isArray(val)) {
      let changed = false;
      const next = val.map((item) => {
        const p = patchVal(item);
        if (p !== item) changed = true;
        return p;
      });
      return changed ? next : val;
    }
    if (typeof val === "object") {
      let changed = false;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        const p = patchVal(v);
        if (p !== v) changed = true;
        out[k] = p;
      }
      return changed ? out : val;
    }
    return val;
  };

  for (const query of qc.getQueryCache().getAll()) {
    if (query.state.data === undefined) continue;
    const patched = patchVal(query.state.data);
    if (patched !== query.state.data) {
      qc.setQueryData(query.queryKey, patched);
    }
  }
  void miniMap;
}

/**
 * Autocuración de llave foránea para `id_paciente` negativo sin mapeo en `idMap`:
 * busca al paciente en la caché local y lo localiza (o crea) en Supabase para
 * recuperar su `id_paciente` real y desbloquear citas, historias, consultas y facturas.
 */
async function tryHealMissingPatientMapping(params: {
  tempPatientId: number;
  baseOrigin: string;
  headers: Headers;
  idMap: Map<string, string | number>;
}): Promise<number | null> {
  const { tempPatientId, baseOrigin, headers, idMap } = params;
  if (!boundQueryClient) return null;

  const tempStr = String(tempPatientId);
  const direct = boundQueryClient.getQueryData<any>(["patient", tempStr]);
  const fromLists = [
    ...boundQueryClient
      .getQueriesData<any[]>({ queryKey: ["patients"] })
      .flatMap(([, d]) => (Array.isArray(d) ? d : [])),
    ...boundQueryClient
      .getQueriesData<any[]>({ queryKey: ["patients_recent"] })
      .flatMap(([, d]) => (Array.isArray(d) ? d : [])),
    ...boundQueryClient
      .getQueriesData<{ data?: any[] }>({ queryKey: ["patients_paginated"] })
      .flatMap(([, d]) => (Array.isArray(d?.data) ? d.data : [])),
  ];
  const cachedPatient = direct || fromLists.find((p) => String(p?.id) === tempStr);
  if (!cachedPatient) return null;

  const readHeaders = new Headers();
  const apikey = headers.get("apikey");
  const auth = headers.get("authorization");
  if (apikey) readHeaders.set("apikey", apikey);
  if (auth) readHeaders.set("authorization", auth);
  readHeaders.set("accept", "application/json");
  readHeaders.set(SYNC_REPLAY_HEADER, "1");

  const fullNameNorm = String(cachedPatient.full_name || "").trim().toLowerCase();
  const docNorm = String(cachedPatient.document_id || "").trim().toLowerCase();

  try {
    // 1. Buscar si el paciente ya existe en Supabase
    const listRes = await window.fetch(
      `${baseOrigin}/rest/v1/pacientes?select=id_paciente,nombre,apellido,documento_identidad&order=id_paciente.desc&limit=100`,
      { method: "GET", headers: readHeaders },
    );
    if (listRes.ok) {
      const rows = (await listRes.json()) as Array<{
        id_paciente: number;
        nombre?: string;
        apellido?: string;
        documento_identidad?: string;
      }>;
      const found = rows.find((r) => {
        const rDoc = String(r.documento_identidad || "").trim().toLowerCase();
        if (docNorm && rDoc && docNorm === rDoc) return true;
        const rName = `${r.nombre || ""} ${r.apellido || ""}`.trim().toLowerCase();
        return fullNameNorm && rName === fullNameNorm;
      });
      if (found?.id_paciente) {
        idMap.set(tempStr, found.id_paciente);
        await saveIdMapping(tempPatientId, found.id_paciente, "pacientes");
        rewriteTempIdInAllCaches(boundQueryClient, tempPatientId, found.id_paciente);
        return found.id_paciente;
      }
    }

    // 2. Si todavía no existía en Supabase, crearlo automáticamente desde la caché local
    const parts = String(cachedPatient.full_name || "Paciente").trim().split(/\s+/);
    const nombre = parts[0] || "Paciente";
    const apellido = parts.slice(1).join(" ") || ".";
    const createHeaders = new Headers(readHeaders);
    createHeaders.set("content-type", "application/json");
    createHeaders.set("prefer", "return=representation");

    const createPayload: Record<string, unknown> = {
      nombre,
      apellido,
      email: cachedPatient.email || null,
      telefono: cachedPatient.phone || null,
      documento_identidad: cachedPatient.document_id || `S/C-${Date.now().toString().slice(-6)}`,
      fecha_nacimiento: cachedPatient.birth_date || null,
      genero: cachedPatient.gender || null,
      contacto_emergencia: cachedPatient.emergency_contact || null,
      direccion: cachedPatient.address || null,
    };

    try {
      const clinicKey = Object.keys(window.localStorage).find((k) =>
        k.startsWith("medizen_cached_clinic_id_"),
      );
      const cachedClinicId = clinicKey ? window.localStorage.getItem(clinicKey) : null;
      if (cachedClinicId) {
        createPayload.id_clinica = cachedClinicId;
      }
    } catch {
      // ignore
    }

    const createRes = await window.fetch(`${baseOrigin}/rest/v1/pacientes?select=id_paciente`, {
      method: "POST",
      headers: createHeaders,
      body: JSON.stringify(createPayload),
    });
    if (createRes.ok) {
      const created = await createRes.json();
      const row = Array.isArray(created) ? created[0] : created;
      if (row?.id_paciente) {
        idMap.set(tempStr, row.id_paciente);
        await saveIdMapping(tempPatientId, row.id_paciente, "pacientes");
        rewriteTempIdInAllCaches(boundQueryClient, tempPatientId, row.id_paciente);
        return row.id_paciente;
      }
    }
  } catch {
    // ignore heal failure
  }

  return null;
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
      consecutiveNetworkRetries = 0;
      // Esperar 1.2s para que DHCP/DNS del Wi-Fi termine de estabilizarse antes de subir la cola
      scheduleSyncRetry(1200);
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

  // Sincronizar automáticamente también al volver a enfocar la ventana o pestaña de la PWA
  window.addEventListener("focus", () => {
    if (!isDeviceOffline() && !syncInFlight && snapshot.pendingCount > 0) {
      scheduleSyncRetry(500);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "visible" &&
      !isDeviceOffline() &&
      !syncInFlight &&
      snapshot.pendingCount > 0
    ) {
      scheduleSyncRetry(500);
    }
  });

  // Reintento automático cada 5s mientras existan operaciones pendientes y el navegador tenga red
  window.setInterval(() => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      markNetworkOnline();
      if (!syncInFlight && snapshot.pendingCount > 0) {
        void syncOutboxNow({ silentIfEmpty: true });
      }
    }
  }, 5_000);

  // Si arrancamos con internet y hay elementos pendientes de una sesión offline anterior
  if (!isDeviceOffline()) {
    scheduleSyncRetry(1500);
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
      // Si no había pendientes y el usuario acaba de reconectar, refrescar caché silenciosamente
      if (boundQueryClient && allItems.length === 0) {
        void boundQueryClient.invalidateQueries();
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

      let resolvedUrl = replaceTempIdsInUrl(item.url, idMap);
      let resolvedBody = sanitizeLegacyPayloadForTable(
        item.table,
        replaceTempIdsInBody(item.body, idMap),
      );

      const headers = new Headers(item.headers);
      if (freshToken) {
        headers.set("authorization", `Bearer ${freshToken}`);
      }
      headers.set(SYNC_REPLAY_HEADER, "1");

      // Autocuración: si el payload aún trae un id_paciente negativo sin mapear, resolverlo en Supabase
      if (resolvedBody) {
        try {
          const parsedCheck = JSON.parse(resolvedBody);
          const firstRow = Array.isArray(parsedCheck) ? parsedCheck[0] : parsedCheck;
          const rawPid = firstRow?.id_paciente;
          if (typeof rawPid === "number" && rawPid < 0 && !idMap.has(String(rawPid))) {
            const origin = new URL(resolvedUrl).origin;
            const healedId = await tryHealMissingPatientMapping({
              tempPatientId: rawPid,
              baseOrigin: origin,
              headers,
              idMap,
            });
            if (healedId !== null) {
              resolvedUrl = replaceTempIdsInUrl(resolvedUrl, idMap);
              resolvedBody = sanitizeLegacyPayloadForTable(
                item.table,
                replaceTempIdsInBody(resolvedBody, idMap),
              );
            }
          }
        } catch {
          // ignore
        }
      }

      // Limpiar automáticamente facturas heredadas inválidas con id_paciente = 0 (bug anterior al fix)
      if (item.table === "facturas" && item.method === "POST" && resolvedBody) {
        try {
          const parsedF = JSON.parse(resolvedBody);
          const firstF = Array.isArray(parsedF) ? parsedF[0] : parsedF;
          if (firstF && (firstF.id_paciente === 0 || firstF.id_paciente === "0" || firstF.id_paciente === null)) {
            await removeOutboxItem(item.id);
            continue;
          }
        } catch {
          // ignore
        }
      }

      // Hacer idempotente cualquier POST a historias_clinicas para evitar 23505 (id_paciente único)
      if (item.table === "historias_clinicas" && item.method === "POST") {
        if (!resolvedUrl.includes("on_conflict=")) {
          resolvedUrl += (resolvedUrl.includes("?") ? "&" : "?") + "on_conflict=id_paciente";
        }
        const prevPrefer = headers.get("prefer") || "";
        if (!prevPrefer.includes("resolution=merge-duplicates")) {
          headers.set(
            "prefer",
            prevPrefer ? `${prevPrefer}, resolution=merge-duplicates` : "resolution=merge-duplicates",
          );
        }
      }

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
                  rewriteTempIdInAllCaches(boundQueryClient, item.tempId.value, realVal);
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

    emitSnapshot({ isSyncing: false, lastSyncedAt: syncedCount > 0 ? now : snapshot.lastSyncedAt });

    if (syncedCount > 0) {
      consecutiveNetworkRetries = 0;
      if (boundQueryClient) {
        // Invalidar todo y recargar listas clave (incluso inactivas) para que IndexedDB nunca guarde IDs temporales viejos
        await boundQueryClient.invalidateQueries();
        await Promise.allSettled([
          boundQueryClient.refetchQueries({ type: "active" }),
          boundQueryClient.refetchQueries({ queryKey: ["patients"], type: "all" }),
          boundQueryClient.refetchQueries({ queryKey: ["patients_paginated"], type: "all" }),
          boundQueryClient.refetchQueries({ queryKey: ["appointments"], type: "all" }),
          boundQueryClient.refetchQueries({ queryKey: ["facturas"], type: "all" }),
        ]);
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
    } else if (abortedDueToNetwork && remaining.some((i) => i.status === "pending")) {
      // El Wi-Fi puede estar terminando de resolver DNS: reintentar automáticamente con backoff
      consecutiveNetworkRetries += 1;
      if (typeof navigator !== "undefined" && navigator.onLine && consecutiveNetworkRetries <= 6) {
        const nextDelay = Math.min(20_000, 2500 * consecutiveNetworkRetries);
        scheduleSyncRetry(nextDelay);
      }
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

export async function clearFailedOutboxItems(): Promise<void> {
  const items = await getAllOutboxItems();
  const remaining = items.filter((i) => i.status !== "failed");
  const pendingCount = remaining.filter((i) => i.status === "pending" || i.status === "syncing").length;

  // Actualizar la UI en 0 ms antes de esperar a IndexedDB
  emitSnapshot({
    items: remaining,
    pendingCount,
    failedCount: 0,
    totalCount: remaining.length,
  });

  for (const item of items) {
    if (item.status === "failed") {
      await removeOutboxItem(item.id);
    }
  }
  await refreshOutboxSnapshot();

  // Refrescar caché desde Supabase si estamos en línea para eliminar registros fantasma con ID temporal descartado
  if (boundQueryClient && !isDeviceOffline() && remaining.length === 0) {
    void boundQueryClient.invalidateQueries();
  }
  toast.info("Errores de sincronización descartados");
}

export async function clearOutboxQueue(): Promise<void> {
  await clearAllOutboxItems();
  await clearIdMappings();
  await refreshOutboxSnapshot();
}
