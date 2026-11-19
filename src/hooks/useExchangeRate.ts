import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";

export type RateType = "bcv" | "eur" | "usdt";

export interface ExchangeRates {
  bcv: number;
  eur: number;
  usdt: number;
}

const STORAGE_KEY_RATES = "medizen_exchange_rates_v3";
const STORAGE_KEY_ACTIVE_TYPE = "medizen_active_rate_type";
const STORAGE_KEY_UPDATED = "medizen_bcv_updated_at";
const STORAGE_KEY_MANUAL = "medizen_bcv_is_manual";

// Intervalo de actualización automática en tiempo real: cada 60 segundos
const REALTIME_POLL_INTERVAL_MS = 60 * 1000;
// Si los datos tienen más de 60 segundos, se consideran obsoletos y se consultan de nuevo
const MAX_STALE_MS = 60 * 1000;

const DEFAULT_RATES: ExchangeRates = {
  bcv: 896.12,
  eur: 1004.96,
  usdt: 1033.0,
};

export const RATE_LABELS: Record<RateType, { short: string; full: string; symbol: string }> = {
  bcv: { short: "BCV ($)", full: "Dólar BCV Oficial", symbol: "$" },
  eur: { short: "EUR (€)", full: "Euro BCV Oficial", symbol: "€" },
  usdt: { short: "USDT", full: "USDT Binance P2P", symbol: "USDT" },
};

export function formatBs(amountUsd: number, rate: number): string {
  const totalBs = (Number(amountUsd) || 0) * (Number(rate) || 0);
  return `Bs. ${totalBs.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatEurFromUsd(amountUsd: number, rates: ExchangeRates): string {
  const bcv = Number(rates.bcv) || 896.12;
  let eur = Number(rates.eur) || 1004.96;
  if (eur < 100 && bcv > 100) {
    eur = bcv * (eur > 0.8 && eur < 1.5 ? eur : 1.124);
  }
  const totalBs = (Number(amountUsd) || 0) * bcv;
  const totalEur = eur > 0 ? totalBs / eur : (Number(amountUsd) || 0) * 0.92;
  return `€${totalEur.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getStoredExchangeRates(): ExchangeRates {
  if (typeof window === "undefined") return DEFAULT_RATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      const bcv = Number(parsed.bcv) > 0 ? Number(parsed.bcv) : DEFAULT_RATES.bcv;
      let eur = Number(parsed.eur) > 0 ? Number(parsed.eur) : DEFAULT_RATES.eur;
      const usdt = Number(parsed.usdt) > 0 ? Number(parsed.usdt) : DEFAULT_RATES.usdt;

      // Auto-reparar si EUR fue guardado como ratio (< 100) en lugar de Bolívares por Euro
      if (eur < 100 && bcv > 100) {
        eur = Math.round(bcv * (eur > 0.8 && eur < 1.5 ? eur : 1.124) * 100) / 100;
      }

      return { bcv, eur, usdt };
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_RATES;
}

export function getStoredActiveType(): RateType {
  if (typeof window === "undefined") return "bcv";
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_TYPE) as RateType;
    return saved === "bcv" || saved === "eur" || saved === "usdt" ? saved : "bcv";
  } catch {
    return "bcv";
  }
}

export function getStoredExchangeRate(): number {
  const rates = getStoredExchangeRates();
  if (typeof window === "undefined") return rates.bcv;
  const activeType = getStoredActiveType();
  return rates[activeType] || rates.bcv;
}

// =========================================================================
// STORE GLOBAL REACTIVO COMPARTIDO ENTRE TODOS LOS COMPONENTES Y PESTAÑAS
// =========================================================================

interface ExchangeRateStoreState {
  rates: ExchangeRates;
  activeType: RateType;
  updatedAt: string | null;
  isManual: boolean;
  isSyncing: boolean;
}

let storeState: ExchangeRateStoreState = {
  rates: getStoredExchangeRates(),
  activeType: getStoredActiveType(),
  updatedAt: typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_UPDATED) : null,
  isManual: typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_MANUAL) === "true" : false,
  isSyncing: false,
};

const listeners = new Set<() => void>();

function notifyStoreChange() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error("Error in exchange rate store subscriber:", e);
    }
  });
}

function setStoreState(updater: Partial<ExchangeRateStoreState> | ((prev: ExchangeRateStoreState) => ExchangeRateStoreState)) {
  const next = typeof updater === "function" ? updater(storeState) : { ...storeState, ...updater };
  storeState = next;
  notifyStoreChange();
}

// Sincronización entre pestañas abiertas del navegador
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (
      e.key === STORAGE_KEY_RATES ||
      e.key === STORAGE_KEY_ACTIVE_TYPE ||
      e.key === STORAGE_KEY_UPDATED ||
      e.key === STORAGE_KEY_MANUAL
    ) {
      setStoreState({
        rates: getStoredExchangeRates(),
        activeType: getStoredActiveType(),
        updatedAt: localStorage.getItem(STORAGE_KEY_UPDATED),
        isManual: localStorage.getItem(STORAGE_KEY_MANUAL) === "true",
      });
    }
  });
}

// Deduplicador de solicitudes de red en vuelo
let activeSyncPromise: Promise<boolean> | null = null;

export async function syncLiveExchangeRates(silent = false): Promise<boolean> {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  setStoreState({ isSyncing: true });

  activeSyncPromise = (async () => {
    try {
      // 1. Cotizaciones Oficiales BCV (USD y EUR)
      // 2. Binance P2P directo para USDT/VES (CriptoYa API)
      // 3. Respaldo DolarAPI (Paralelo y oficial)
      const [cotizacionesRes, binanceP2pRes, dolaresRes] = await Promise.allSettled([
        fetch("https://ve.dolarapi.com/v1/cotizaciones"),
        fetch("https://criptoya.com/api/binancep2p/USDT/VES/0.1"),
        fetch("https://ve.dolarapi.com/v1/dolares"),
      ]);

      let nextBcv = 0;
      let nextEur = 0;
      let nextUsdt = 0;

      if (cotizacionesRes.status === "fulfilled" && cotizacionesRes.value.ok) {
        const cotData = await cotizacionesRes.value.json();
        if (Array.isArray(cotData)) {
          const usdObj = cotData.find((c: any) => c.moneda === "USD");
          const eurObj = cotData.find((c: any) => c.moneda === "EUR");
          if (usdObj?.promedio > 0) nextBcv = Number(usdObj.promedio);
          if (eurObj?.promedio > 0) nextEur = Number(eurObj.promedio);
        }
      }

      // Prioridad 1 para USDT: Precio directo Binance P2P
      if (binanceP2pRes.status === "fulfilled" && binanceP2pRes.value.ok) {
        const binanceData = await binanceP2pRes.value.json();
        const ask = Number(binanceData?.ask) || 0;
        const bid = Number(binanceData?.bid) || 0;
        if (ask > 0 && bid > 0) {
          nextUsdt = (ask + bid) / 2;
        } else if (ask > 0) {
          nextUsdt = ask;
        }
      }

      // Respaldo para BCV y USDT si alguna fuente falló
      if (dolaresRes.status === "fulfilled" && dolaresRes.value.ok) {
        const dolaresData = await dolaresRes.value.json();
        if (Array.isArray(dolaresData)) {
          if (!nextBcv) {
            const oficialObj = dolaresData.find((d: any) => d.fuente === "oficial");
            if (oficialObj?.promedio > 0) nextBcv = Number(oficialObj.promedio);
          }
          if (!nextUsdt) {
            const paraleloObj = dolaresData.find((d: any) => d.fuente === "paralelo");
            if (paraleloObj?.promedio > 0) nextUsdt = Number(paraleloObj.promedio);
          }
        }
      }

      if (!nextBcv && !nextUsdt && !nextEur) {
        throw new Error("No se pudo conectar al servicio de tasas");
      }

      const prev = storeState.rates;
      const roundedBcv = nextBcv > 0 ? Math.round(nextBcv * 100) / 100 : prev.bcv;
      const roundedEur = nextEur > 0 ? Math.round(nextEur * 100) / 100 : prev.eur;
      const roundedUsdt = nextUsdt > 0 ? Math.round(nextUsdt * 100) / 100 : prev.usdt;

      const newRates: ExchangeRates = {
        bcv: roundedBcv,
        eur: roundedEur,
        usdt: roundedUsdt,
      };

      const nowIso = new Date().toISOString();

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(newRates));
        localStorage.setItem("medizen_bcv_rate", String(newRates.bcv));
        localStorage.setItem(STORAGE_KEY_UPDATED, nowIso);
        localStorage.setItem(STORAGE_KEY_MANUAL, "false");
      }

      setStoreState({
        rates: newRates,
        updatedAt: nowIso,
        isManual: false,
        isSyncing: false,
      });

      if (!silent) {
        toast.success(
          `Tasas actualizadas — BCV: Bs. ${newRates.bcv.toFixed(2)} | EUR BCV: Bs. ${newRates.eur.toFixed(2)} | USDT: Bs. ${newRates.usdt.toFixed(2)}`
        );
      }

      return true;
    } catch (err) {
      if (!silent) {
        toast.error("No se pudieron obtener las tasas en línea. Puedes ajustarlas manualmente.");
      }
      return false;
    } finally {
      activeSyncPromise = null;
      setStoreState({ isSyncing: false });
    }
  })();

  return activeSyncPromise;
}

// =========================================================================
// MOTOR DE ACTUALIZACIÓN EN TIEMPO REAL (POLLER AUTOMÁTICO)
// =========================================================================

let isPollerInitialized = false;

function initExchangeRatePoller() {
  if (typeof window === "undefined" || isPollerInitialized) return;
  isPollerInitialized = true;

  const checkAndSync = () => {
    // Si la pestaña está oculta, no saturar la red innecesariamente
    if (document.visibilityState !== "visible") return;

    // Si el usuario fijó manualmente una tasa personalizada, respetarla
    if (storeState.isManual) return;

    const last = storeState.updatedAt;
    const isStale = !last || Date.now() - new Date(last).getTime() > MAX_STALE_MS;
    const isEurCorrupted = storeState.rates.eur < 100 && storeState.rates.bcv > 100;

    if (isStale || isEurCorrupted) {
      syncLiveExchangeRates(true);
    }
  };

  // 1. Chequeo inicial al abrir la app (diferido al microtask para no notificar durante subscribe)
  queueMicrotask(checkAndSync);

  // 2. Polling recurrente en vivo cada 60 segundos
  setInterval(checkAndSync, REALTIME_POLL_INTERVAL_MS);

  // 3. Reactividad inmediata al volver a la pestaña o ventana
  window.addEventListener("focus", checkAndSync);
  document.addEventListener("visibilitychange", checkAndSync);
}

function updateRatesInStore(nextRates: Partial<ExchangeRates>, manual = true) {
  const current = storeState.rates;
  const newRates: ExchangeRates = {
    bcv:
      nextRates.bcv && nextRates.bcv > 0
        ? Math.round(nextRates.bcv * 100) / 100
        : current.bcv,
    eur:
      nextRates.eur && nextRates.eur > 0
        ? Math.round(nextRates.eur * 100) / 100
        : current.eur,
    usdt:
      nextRates.usdt && nextRates.usdt > 0
        ? Math.round(nextRates.usdt * 100) / 100
        : current.usdt,
  };
  const nowIso = new Date().toISOString();
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(newRates));
    localStorage.setItem("medizen_bcv_rate", String(newRates.bcv));
    localStorage.setItem(STORAGE_KEY_UPDATED, nowIso);
    localStorage.setItem(STORAGE_KEY_MANUAL, String(manual));
  }
  setStoreState({
    rates: newRates,
    updatedAt: nowIso,
    isManual: manual,
  });
}

function setActiveTypeInStore(type: RateType) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_ACTIVE_TYPE, type);
  }
  setStoreState({ activeType: type });
}

function subscribe(callback: () => void) {
  initExchangeRatePoller();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return storeState;
}

function getServerSnapshot() {
  return storeState;
}

export function useExchangeRate() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setActiveType = useCallback((type: RateType) => {
    setActiveTypeInStore(type);
  }, []);

  const updateRates = useCallback((nextRates: Partial<ExchangeRates>, manual = true) => {
    updateRatesInStore(nextRates, manual);
  }, []);

  const setCustomRate = useCallback(
    (newRate: number, manual = true, targetType?: RateType) => {
      if (isNaN(newRate) || newRate <= 0) return;
      const key = targetType || state.activeType;
      updateRates({ [key]: newRate }, manual);
    },
    [state.activeType, updateRates]
  );

  const syncWithBcv = useCallback(async (silent = false) => {
    return syncLiveExchangeRates(silent);
  }, []);

  const rate = state.rates[state.activeType] || state.rates.bcv;

  return {
    rate,
    rates: state.rates,
    activeType: state.activeType,
    setActiveType,
    updatedAt: state.updatedAt,
    isManual: state.isManual,
    isSyncing: state.isSyncing,
    setCustomRate,
    updateRates,
    syncWithBcv,
  };
}
