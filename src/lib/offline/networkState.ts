/**
 * Estado reactivo de conectividad y utilidades de detección offline para Medizen.
 */

type NetworkListener = (online: boolean) => void;

let currentOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
const listeners = new Set<NetworkListener>();
let initialized = false;

function emitOnlineState(next: boolean) {
  if (currentOnline === next) return;
  currentOnline = next;
  listeners.forEach((fn) => {
    try {
      fn(next);
    } catch {
      // ignore listener error
    }
  });
}

export function initNetworkListeners(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  currentOnline = navigator.onLine;

  window.addEventListener("online", () => {
    emitOnlineState(true);
  });

  window.addEventListener("offline", () => {
    emitOnlineState(false);
  });
}

export function isDeviceOffline(): boolean {
  if (typeof navigator === "undefined") return false;
  return !navigator.onLine || !currentOnline;
}

export function getOnlineSnapshot(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine && currentOnline;
}

export function markNetworkOffline(): void {
  // Solo marcar offline si el navegador realmente reporta sin conexión;
  // si navigator.onLine es true, un fallo puntual puede ser DNS reconectándose.
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    emitOnlineState(false);
  }
}

export function markNetworkOnline(): void {
  if (typeof navigator === "undefined" || navigator.onLine) {
    emitOnlineState(true);
  }
}

export function subscribeNetworkStatus(listener: NetworkListener): () => void {
  initNetworkListeners();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Detecta si un error proviene de ausencia de conexión a internet o fallo de red.
 */
export function isOfflineError(error: unknown): boolean {
  if (isDeviceOffline()) return true;
  if (!error) return false;

  const msg =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === "string"
        ? error
        : typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "";

  const lower = msg.toLowerCase();
  return (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed") ||
    lower.includes("fetch failed") ||
    lower.includes("err_internet_disconnected") ||
    lower.includes("err_network_changed") ||
    lower.includes("net::err_") ||
    lower.includes("the internet connection appears to be offline")
  );
}

let tempCounter = 0;

/**
 * Genera un ID entero negativo único para tablas con PK numérica (pacientes, citas, facturas, etc.)
 * Permite que parseInt(id, 10) funcione sin cambios y facilita detectar IDs temporales (< 0).
 */
export function generateTempIntId(): number {
  tempCounter = (tempCounter + 1) % 1000;
  const base = Math.floor(Date.now() % 1_000_000) * 1000 + tempCounter;
  return -Math.max(1, base);
}

/**
 * Genera un UUID v4 temporal con prefijo identificable o estándar para tablas con PK UUID.
 */
export function generateTempUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0").slice(-12)}`;
}
