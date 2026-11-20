/**
 * Interceptor universal de red (fetch) para el cliente Supabase en modo Offline-First.
 *
 * - Para lecturas (GET/HEAD): deja pasar la petición normal (React Query + IndexedDB sirven caché).
 * - Para Auth/Realtime: nunca interfiere.
 * - Para Storage (subida de archivos) sin internet: devuelve error claro en español.
 * - Para escrituras PostgREST (/rest/v1/*) cuando no hay internet o falla la red:
 *   1. Encola la operación en IndexedDB (`syncOutbox`) en orden FIFO.
 *   2. Genera un ID temporal seguro si es un INSERT para que operaciones encadenadas
 *      (ej. crear paciente -> crear historia clínica -> crear cita) funcionen sin errores.
 *   3. Devuelve una respuesta HTTP 200/201 sintética compatible con PostgREST para que
 *      la interfaz siga funcionando con fluidez.
 */

import { toast } from "sonner";
import { enqueueOutboxItem, type OutboxItem, type TempIdInfo } from "@/lib/offline/offlineDb";
import {
  generateTempIntId,
  generateTempUuid,
  isDeviceOffline,
  isOfflineError,
  markNetworkOffline,
  markNetworkOnline,
} from "@/lib/offline/networkState";
import { refreshOutboxSnapshot, SYNC_REPLAY_HEADER } from "@/lib/offline/syncEngine";

export const OFFLINE_QUEUED_HEADER = "x-medizen-offline-queued";

interface TablePkConfig {
  column: string;
  type: "int" | "uuid";
  label: string;
}

const TABLE_CONFIG: Record<string, TablePkConfig> = {
  pacientes: { column: "id_paciente", type: "int", label: "paciente" },
  historias_clinicas: { column: "id_historia", type: "int", label: "historia clínica" },
  citas: { column: "id_cita", type: "int", label: "cita" },
  consultas: { column: "id_consulta", type: "int", label: "consulta" },
  facturas: { column: "id_factura", type: "int", label: "factura" },
  detalles_factura: { column: "id_detalle", type: "int", label: "detalle de factura" },
  pagos: { column: "id_pago", type: "int", label: "pago" },
  servicios: { column: "id_servicio", type: "int", label: "servicio" },
  especialidades: { column: "id_especialidad", type: "int", label: "especialidad" },
  medicos: { column: "id_medico", type: "int", label: "médico" },
  usuarios: { column: "id_usuario", type: "int", label: "usuario" },
  clinicas: { column: "id_clinica", type: "uuid", label: "clínica" },
  clinic_info: { column: "id", type: "int", label: "configuración clínica" },
  inventory_stocks: { column: "id", type: "uuid", label: "inventario" },
  financial_accounts: { column: "id", type: "uuid", label: "cuenta financiera" },
  financial_purchases: { column: "id", type: "uuid", label: "compra / gasto" },
  payment_methods: { column: "id", type: "uuid", label: "método de pago" },
  daily_goals: { column: "id", type: "uuid", label: "meta diaria" },
  support_tickets: { column: "id", type: "uuid", label: "ticket de soporte" },
  audit_logs: { column: "id", type: "uuid", label: "auditoría" },
  recetas: { column: "id_receta", type: "int", label: "récipe" },
  detalles_receta: { column: "id_detalle", type: "int", label: "detalle de récipe" },
  examenes_laboratorio: { column: "id_examen", type: "int", label: "examen" },
  archivos_pacientes: { column: "id", type: "uuid", label: "archivo" },
};

const METHOD_VERBS: Record<string, string> = {
  POST: "Guardar",
  PATCH: "Actualizar",
  PUT: "Actualizar",
  DELETE: "Eliminar",
};

let lastOfflineToastAt = 0;

function notifyOfflineQueued(table: string, label: string) {
  // No mostrar toast repetido para tablas auxiliares encadenadas (historias_clinicas, audit_logs, detalles_factura)
  if (table === "audit_logs" || table === "historias_clinicas" || table === "detalles_factura") {
    return;
  }
  const now = Date.now();
  if (now - lastOfflineToastAt < 2500) return;
  lastOfflineToastAt = now;

  toast.info("Guardado localmente (Sin conexión)", {
    description: `${label}. Se sincronizará automáticamente al volver el internet.`,
  });
}

function extractRestTable(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr);
    const match = parsed.pathname.match(/\/rest\/v1\/([^/?]+)/);
    if (!match) return null;
    const segment = decodeURIComponent(match[1]);
    if (segment === "rpc") return null;
    return segment;
  } catch {
    return null;
  }
}

function headersToPlainRecord(headersInit?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  const h = new Headers(headersInit);
  h.forEach((value, key) => {
    const lower = key.toLowerCase();
    // No guardar el JWT viejo en IndexedDB; se inyecta el token fresco al sincronizar
    if (lower === "authorization" || lower === SYNC_REPLAY_HEADER) return;
    out[lower] = value;
  });
  return out;
}

function registerBackgroundSyncSafe() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready
    .then((reg) => {
      const syncReg = reg as ServiceWorkerRegistration & {
        sync?: { register: (tag: string) => Promise<void> };
      };
      if (syncReg.sync) {
        return syncReg.sync.register("medizen-offline-sync");
      }
    })
    .catch(() => {
      // Background Sync no soportado en todos los navegadores (iOS/Firefox); el evento `online` lo cubre.
    });
}

function buildSyntheticResponse(options: {
  table: string;
  method: "POST" | "PATCH" | "PUT" | "DELETE";
  bodyText: string | null;
  acceptHeader: string;
  tempId?: TempIdInfo;
  url: string;
}): Response {
  const wantsSingle = options.acceptHeader.includes("application/vnd.pgrst.object+json");
  const nowIso = new Date().toISOString();

  if (options.method === "DELETE") {
    const emptyBody = wantsSingle ? "{}" : "[]";
    return new Response(emptyBody, {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        [OFFLINE_QUEUED_HEADER]: "1",
      },
    });
  }

  let parsedBody: unknown = {};
  if (options.bodyText) {
    try {
      parsedBody = JSON.parse(options.bodyText);
    } catch {
      parsedBody = {};
    }
  }

  // Extraer ID del filtro URL para PATCH (?id_paciente=eq.123 o ?id=eq.uuid)
  const pkCfg = TABLE_CONFIG[options.table];
  let filterId: string | number | undefined;
  if (pkCfg && (options.method === "PATCH" || options.method === "PUT")) {
    try {
      const u = new URL(options.url);
      const rawParam = u.searchParams.get(pkCfg.column);
      if (rawParam && rawParam.startsWith("eq.")) {
        const rawVal = rawParam.slice(3);
        filterId = pkCfg.type === "int" ? Number(rawVal) : rawVal;
      }
    } catch {
      // ignore
    }
  }

  const enrichRow = (row: Record<string, unknown>) => {
    const next: Record<string, unknown> = {
      ...row,
      created_at: row.created_at ?? nowIso,
      updated_at: nowIso,
      creado_en: row.creado_en ?? nowIso,
      actualizado_en: nowIso,
    };
    if (options.tempId && next[options.tempId.column] === undefined) {
      next[options.tempId.column] = options.tempId.value;
    } else if (pkCfg && filterId !== undefined && next[pkCfg.column] === undefined) {
      next[pkCfg.column] = filterId;
    }
    return next;
  };

  let payload: unknown;
  if (Array.isArray(parsedBody)) {
    const rows = parsedBody.map((item) =>
      typeof item === "object" && item !== null ? enrichRow(item as Record<string, unknown>) : item,
    );
    payload = wantsSingle ? rows[0] ?? {} : rows;
  } else if (typeof parsedBody === "object" && parsedBody !== null) {
    const enriched = enrichRow(parsedBody as Record<string, unknown>);
    payload = wantsSingle ? enriched : [enriched];
  } else {
    payload = wantsSingle ? {} : [];
  }

  return new Response(JSON.stringify(payload), {
    status: options.method === "POST" ? 201 : 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      [OFFLINE_QUEUED_HEADER]: "1",
    },
  });
}

async function queueOfflineMutation(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  headersInit: HeadersInit | undefined,
  bodyText: string | null,
  table: string,
): Promise<Response> {
  const pkCfg = TABLE_CONFIG[table];
  const verb = METHOD_VERBS[method] || "Guardar";
  const friendlyLabel = `${verb} ${pkCfg?.label ?? table}`;

  let tempId: TempIdInfo | undefined;
  let finalBodyToQueue = bodyText;

  if (method === "POST" && pkCfg) {
    // Revisar si el payload ya trae PK explícita (ej. upsert con id existente)
    let hasExplicitPk = false;
    if (bodyText) {
      try {
        const parsed = JSON.parse(bodyText);
        const first = Array.isArray(parsed) ? parsed[0] : parsed;
        if (first && typeof first === "object" && first[pkCfg.column] !== undefined && first[pkCfg.column] !== null) {
          hasExplicitPk = true;
        }
      } catch {
        // ignore
      }
    }

    if (!hasExplicitPk) {
      const value = pkCfg.type === "int" ? generateTempIntId() : generateTempUuid();
      tempId = { column: pkCfg.column, value };
      // Para UUIDs, incluir el ID en el cuerpo si es un objeto simple garantiza consistencia inmediata
      if (pkCfg.type === "uuid" && bodyText) {
        try {
          const parsed = JSON.parse(bodyText);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            parsed[pkCfg.column] = value;
            finalBodyToQueue = JSON.stringify(parsed);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  const outboxItem: OutboxItem = {
    id: generateTempUuid(),
    createdAt: Date.now(),
    kind: "rest",
    table,
    method,
    url,
    headers: headersToPlainRecord(headersInit),
    body: finalBodyToQueue,
    label: friendlyLabel,
    tempId,
    status: "pending",
    retryCount: 0,
    lastError: null,
  };

  await enqueueOutboxItem(outboxItem);
  await refreshOutboxSnapshot();
  registerBackgroundSyncSafe();
  notifyOfflineQueued(table, friendlyLabel);

  const acceptHeader = new Headers(headersInit).get("accept") || "";
  return buildSyntheticResponse({
    table,
    method,
    bodyText: finalBodyToQueue,
    acceptHeader,
    tempId,
    url,
  });
}

/**
 * Crea un wrapper de `fetch` compatible con Supabase JS v2 que intercepta
 * escrituras PostgREST cuando el dispositivo está sin conexión.
 */
export function createOfflineAwareFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const baseFetch = globalThis.fetch.bind(globalThis);

    if (typeof window === "undefined") {
      return baseFetch(input, init);
    }

    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const method = (
      init?.method ||
      (typeof Request !== "undefined" && input instanceof Request ? input.method : "GET")
    ).toUpperCase();

    const headers = new Headers(
      init?.headers || (typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined),
    );

    // Si es una repetición del motor de sincronización, ir directo a la red
    if (headers.get(SYNC_REPLAY_HEADER) === "1") {
      return baseFetch(input, init);
    }

    // Subida de archivos a Storage sin internet -> error claro
    if (url.includes("/storage/v1/") && method !== "GET" && method !== "HEAD" && isDeviceOffline()) {
      throw new Error("No se pueden subir archivos sin conexión a internet. Intenta al reconectar.");
    }

    const isWriteMethod =
      method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE";
    const restTable = isWriteMethod ? extractRestTable(url) : null;

    if (!restTable) {
      // Para lecturas REST, llamadas de Auth (refresh_token/getUser) o Edge Functions cuando
      // ya sabemos que no hay internet: fallar en 0 ms para evitar esperas de 15-30s por timeout.
      if (
        isDeviceOffline() &&
        (url.includes("/rest/v1/") || url.includes("/auth/v1/") || url.includes("/functions/v1/"))
      ) {
        throw new TypeError("Failed to fetch (offline)");
      }
      try {
        const res = await baseFetch(input, init);
        if (res.ok) markNetworkOnline();
        return res;
      } catch (err) {
        if (isOfflineError(err)) markNetworkOffline();
        throw err;
      }
    }

    const bodyText =
      typeof init?.body === "string"
        ? init.body
        : init?.body instanceof URLSearchParams
          ? init.body.toString()
          : null;

    // 1. Si sabemos que estamos sin conexión -> encolar inmediatamente sin esperar timeout
    if (isDeviceOffline()) {
      return queueOfflineMutation(
        url,
        method as "POST" | "PATCH" | "PUT" | "DELETE",
        headers,
        bodyText,
        restTable,
      );
    }

    // 2. Si creemos estar en línea -> intentar red y caer a cola offline si falla por red
    try {
      const res = await baseFetch(input, init);
      markNetworkOnline();
      return res;
    } catch (err) {
      if (isOfflineError(err)) {
        markNetworkOffline();
        return queueOfflineMutation(
          url,
          method as "POST" | "PATCH" | "PUT" | "DELETE",
          headers,
          bodyText,
          restTable,
        );
      }
      throw err;
    }
  };
}
