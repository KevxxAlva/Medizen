import { useState, useEffect, useCallback } from "react";
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

const DEFAULT_RATES: ExchangeRates = {
  bcv: 889.26,
  eur: 992.8,
  usdt: 986.0,
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
  const eurToUsdRatio = rates.eur > 0 && rates.bcv > 0 ? rates.bcv / rates.eur : 0.9;
  const totalEur = (Number(amountUsd) || 0) * eurToUsdRatio;
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
      return {
        bcv: Number(parsed.bcv) > 0 ? Number(parsed.bcv) : DEFAULT_RATES.bcv,
        eur: Number(parsed.eur) > 0 ? Number(parsed.eur) : DEFAULT_RATES.eur,
        usdt: Number(parsed.usdt) > 0 ? Number(parsed.usdt) : DEFAULT_RATES.usdt,
      };
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_RATES;
}

export function getStoredExchangeRate(): number {
  const rates = getStoredExchangeRates();
  if (typeof window === "undefined") return rates.bcv;
  const activeType = (localStorage.getItem(STORAGE_KEY_ACTIVE_TYPE) as RateType) || "bcv";
  return rates[activeType] || rates.bcv;
}

export function useExchangeRate() {
  const [rates, setRatesState] = useState<ExchangeRates>(() => getStoredExchangeRates());
  const [activeType, setActiveTypeState] = useState<RateType>(() => {
    if (typeof window === "undefined") return "bcv";
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_TYPE) as RateType;
    return saved === "bcv" || saved === "eur" || saved === "usdt" ? saved : "bcv";
  });
  const [updatedAt, setUpdatedAt] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_UPDATED) : null
  );
  const [isManual, setIsManual] = useState<boolean>(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_MANUAL) === "true" : false
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const setActiveType = useCallback((type: RateType) => {
    setActiveTypeState(type);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TYPE, type);
    }
  }, []);

  const updateRates = useCallback((nextRates: Partial<ExchangeRates>, manual = true) => {
    setRatesState((prev) => {
      const merged: ExchangeRates = {
        bcv:
          nextRates.bcv && nextRates.bcv > 0
            ? Math.round(nextRates.bcv * 100) / 100
            : prev.bcv,
        eur:
          nextRates.eur && nextRates.eur > 0
            ? Math.round(nextRates.eur * 100) / 100
            : prev.eur,
        usdt:
          nextRates.usdt && nextRates.usdt > 0
            ? Math.round(nextRates.usdt * 100) / 100
            : prev.usdt,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(merged));
        localStorage.setItem("medizen_bcv_rate", String(merged.bcv));
      }
      return merged;
    });
    const nowIso = new Date().toISOString();
    setUpdatedAt(nowIso);
    setIsManual(manual);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_UPDATED, nowIso);
      localStorage.setItem(STORAGE_KEY_MANUAL, String(manual));
    }
  }, []);

  const setCustomRate = useCallback(
    (newRate: number, manual = true, targetType?: RateType) => {
      if (isNaN(newRate) || newRate <= 0) return;
      const key = targetType || activeType;
      updateRates({ [key]: newRate }, manual);
    },
    [activeType, updateRates]
  );

  const syncWithBcv = useCallback(
    async (silent = false) => {
      setIsSyncing(true);
      try {
        // 1. Cotizaciones Oficiales BCV (USD y EUR)
        // 2. Binance P2P directo para USDT/VES (CriptoYa API de libro de órdenes Binance P2P)
        // 3. Respaldo DolarAPI (Paralelo) en caso de contingencia
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

        // Prioridad 1 para USDT: Precio directo de Binance P2P (promedio ask/bid)
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

        // Respaldo para BCV y USDT si alguna fuente anterior no respondió
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

        updateRates(
          {
            ...(nextBcv > 0 ? { bcv: nextBcv } : {}),
            ...(nextEur > 0 ? { eur: nextEur } : {}),
            ...(nextUsdt > 0 ? { usdt: nextUsdt } : {}),
          },
          false
        );

        if (!silent) {
          toast.success(
            `Tasas actualizadas — BCV: Bs. ${(nextBcv || rates.bcv).toFixed(
              2
            )} | EUR BCV: Bs. ${(nextEur || rates.eur).toFixed(
              2
            )} | USDT (Binance P2P): Bs. ${(nextUsdt || rates.usdt).toFixed(2)}`
          );
        }
      } catch {
        if (!silent) {
          toast.error("No se pudieron obtener las tasas en línea. Puedes ajustarlas manualmente.");
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [rates.bcv, rates.eur, rates.usdt, updateRates]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY_RATES);
    const savedUpdated = localStorage.getItem(STORAGE_KEY_UPDATED);
    const manualFlag = localStorage.getItem(STORAGE_KEY_MANUAL) === "true";

    const sixHoursMs = 6 * 60 * 60 * 1000;
    const isStale =
      !savedUpdated || Date.now() - new Date(savedUpdated).getTime() > sixHoursMs;

    if (!saved || (!manualFlag && isStale)) {
      syncWithBcv(true);
    }
  }, [syncWithBcv]);

  const rate = rates[activeType] || rates.bcv;

  return {
    rate,
    rates,
    activeType,
    setActiveType,
    updatedAt,
    isManual,
    isSyncing,
    setCustomRate,
    updateRates,
    syncWithBcv,
  };
}
