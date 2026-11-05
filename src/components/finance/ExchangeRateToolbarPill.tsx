import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft, Calculator, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RATE_LABELS,
  type RateType,
  type ExchangeRates,
} from "@/hooks/useExchangeRate";
import { toast } from "sonner";
import { APP_LOCALE, APP_TIME_ZONE } from "@/lib/constants/locale";

export interface ExchangeRateToolbarPillProps {
  rate: number;
  rates: ExchangeRates;
  activeType: RateType;
  onSelectType: (type: RateType) => void;
  updatedAt: string | null;
  isManual: boolean;
  isSyncing: boolean;
  onUpdateRates: (nextRates: Partial<ExchangeRates>, manual?: boolean) => void;
  onSync: () => void;
}

function ExchangeRateConverter({
  rate,
  rates,
  calcUsd,
  setCalcUsd,
  calcBs,
  setCalcBs,
  calcEur,
  setCalcEur,
  calcUsdt,
  setCalcUsdt,
}: {
  rate: number;
  rates: ExchangeRates;
  calcUsd: string;
  setCalcUsd: (v: string) => void;
  calcBs: string;
  setCalcBs: (v: string) => void;
  calcEur: string;
  setCalcEur: (v: string) => void;
  calcUsdt: string;
  setCalcUsdt: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-muted/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-foreground">
          Calculadora Rápida Multimoneda
        </span>
        <span className="text-[10px] text-muted-foreground font-semibold">
          Conversión en tiempo real
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <Label htmlFor="calc-usd" className="text-[10px] text-muted-foreground font-semibold">
            Dólares ($ USD)
          </Label>
          <Input
            id="calc-usd"
            type="number"
            step="0.01"
            value={calcUsd}
            onChange={(e) => {
              const val = e.target.value;
              setCalcUsd(val);
              const num = parseFloat(val);
              if (!isNaN(num)) {
                setCalcBs((num * rate).toFixed(2));
                const eurRatio = rates.eur > 0 ? rates.bcv / rates.eur : 0.92;
                setCalcEur((num * eurRatio).toFixed(2));
                const usdtRatio = rates.usdt > 0 ? rates.bcv / rates.usdt : 1;
                setCalcUsdt((num * usdtRatio).toFixed(2));
              }
            }}
            className="rounded-xl h-8 text-xs font-bold mt-1 bg-background"
          />
        </div>
        <div>
          <Label htmlFor="calc-bs" className="text-[10px] text-muted-foreground font-semibold">
            Bolívares (Bs.)
          </Label>
          <Input
            id="calc-bs"
            type="number"
            step="0.01"
            value={calcBs}
            onChange={(e) => {
              const val = e.target.value;
              setCalcBs(val);
              const numBs = parseFloat(val);
              if (!isNaN(numBs) && rate > 0) {
                const usd = numBs / rate;
                setCalcUsd(usd.toFixed(2));
                const eurRatio = rates.eur > 0 ? rates.bcv / rates.eur : 0.92;
                setCalcEur((usd * eurRatio).toFixed(2));
                const usdtRatio = rates.usdt > 0 ? rates.bcv / rates.usdt : 1;
                setCalcUsdt((usd * usdtRatio).toFixed(2));
              }
            }}
            className="rounded-xl h-8 text-xs font-bold mt-1 bg-background"
          />
        </div>
        <div>
          <Label htmlFor="calc-eur" className="text-[10px] text-muted-foreground font-semibold">
            Euros (€ EUR)
          </Label>
          <Input
            id="calc-eur"
            type="number"
            step="0.01"
            value={calcEur}
            onChange={(e) => {
              const val = e.target.value;
              setCalcEur(val);
              const numEur = parseFloat(val);
              if (!isNaN(numEur) && rates.bcv > 0) {
                const totalInBs = numEur * rates.eur;
                const eqUsd = totalInBs / rates.bcv;
                setCalcUsd(eqUsd.toFixed(2));
                setCalcBs(totalInBs.toFixed(2));
                setCalcUsdt(
                  rates.usdt > 0 ? (totalInBs / rates.usdt).toFixed(2) : eqUsd.toFixed(2)
                );
              }
            }}
            className="rounded-xl h-8 text-xs font-bold mt-1 bg-background"
          />
        </div>
        <div>
          <Label htmlFor="calc-usdt" className="text-[10px] text-muted-foreground font-semibold">
            USDT (Tether)
          </Label>
          <Input
            id="calc-usdt"
            type="number"
            step="0.01"
            value={calcUsdt}
            onChange={(e) => {
              const val = e.target.value;
              setCalcUsdt(val);
              const numUsdt = parseFloat(val);
              if (!isNaN(numUsdt) && rates.bcv > 0) {
                const totalInBs = numUsdt * rates.usdt;
                const eqUsd = totalInBs / rates.bcv;
                setCalcUsd(eqUsd.toFixed(2));
                setCalcBs(totalInBs.toFixed(2));
                setCalcEur(
                  rates.eur > 0 ? (totalInBs / rates.eur).toFixed(2) : eqUsd.toFixed(2)
                );
              }
            }}
            className="rounded-xl h-8 text-xs font-bold mt-1 bg-background"
          />
        </div>
      </div>
    </div>
  );
}

export function ExchangeRateToolbarPill({
  rate,
  rates,
  activeType,
  onSelectType,
  updatedAt,
  isManual,
  isSyncing,
  onUpdateRates,
  onSync,
}: ExchangeRateToolbarPillProps) {
  const [inputBcv, setInputBcv] = useState(String(rates.bcv));
  const [inputEur, setInputEur] = useState(String(rates.eur));
  const [inputUsdt, setInputUsdt] = useState(String(rates.usdt));

  const [calcUsd, setCalcUsd] = useState("50");
  const [calcBs, setCalcBs] = useState(() => (50 * rate).toFixed(2));
  const [calcEur, setCalcEur] = useState(() => {
    const ratio = rates.eur > 0 ? rates.bcv / rates.eur : 0.92;
    return (50 * ratio).toFixed(2);
  });
  const [calcUsdt, setCalcUsdt] = useState("50.00");

  const recalculateFromUsd = (
    usdAmount: number,
    currentRates: ExchangeRates = rates,
    currentType: RateType = activeType
  ) => {
    const activeRateVal = currentRates[currentType] || currentRates.bcv;
    setCalcBs((usdAmount * activeRateVal).toFixed(2));
    const eurRatio = currentRates.eur > 0 ? currentRates.bcv / currentRates.eur : 0.92;
    setCalcEur((usdAmount * eurRatio).toFixed(2));
    const usdtRatio = currentRates.usdt > 0 ? currentRates.bcv / currentRates.usdt : 1;
    setCalcUsdt((usdAmount * usdtRatio).toFixed(2));
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setInputBcv(String(rates.bcv));
      setInputEur(String(rates.eur));
      setInputUsdt(String(rates.usdt));
      const numUsd = parseFloat(calcUsd) || 0;
      recalculateFromUsd(numUsd, rates, activeType);
    }
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBcv = parseFloat(inputBcv);
    const parsedEur = parseFloat(inputEur);
    const parsedUsdt = parseFloat(inputUsdt);
    if (
      isNaN(parsedBcv) ||
      parsedBcv <= 0 ||
      isNaN(parsedEur) ||
      parsedEur <= 0 ||
      isNaN(parsedUsdt) ||
      parsedUsdt <= 0
    ) {
      toast.error("Ingresa tasas válidas mayores a 0 para BCV, EUR y USDT");
      return;
    }
    const nextRates: ExchangeRates = {
      bcv: parsedBcv,
      eur: parsedEur,
      usdt: parsedUsdt,
    };
    onUpdateRates(nextRates, true);
    const numUsd = parseFloat(calcUsd) || 0;
    recalculateFromUsd(numUsd, nextRates, activeType);
    toast.success("Tasas BCV, Euro y USDT actualizadas correctamente");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center rounded-2xl bg-muted/70 border border-border/60 p-1 gap-1">
        {(["bcv", "eur", "usdt"] as RateType[]).map((type) => {
          const isActive = activeType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelectType(type)}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={`Usar ${RATE_LABELS[type].full} (Bs. ${rates[type].toFixed(2)})`}
            >
              {RATE_LABELS[type].short}
            </button>
          );
        })}
      </div>

      <Popover onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-2xl bg-primary/10 hover:bg-primary/15 border border-primary/20 px-3.5 py-2 transition-colors cursor-pointer"
            title="Configurar Tasas (BCV, Euro, USDT) y Calculadora Multimoneda"
          >
            <div className="h-7 w-7 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                {RATE_LABELS[activeType].full} {isManual ? "(Manual)" : ""}
              </span>
              <span className="text-xs font-extrabold text-foreground">
                Bs.{" "}
                {rate.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-primary font-bold">
                  / {RATE_LABELS[activeType].symbol}
                </span>
              </span>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-1.5rem)] max-w-[380px] rounded-3xl glass-card border border-border/60 shadow-2xl p-4 sm:p-5"
          align="end"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Calculator className="h-3.5 w-3.5" /> Multimoneda: BCV · EUR · USDT
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {updatedAt
                    ? `Actualizado: ${new Date(updatedAt).toLocaleTimeString(APP_LOCALE, {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: APP_TIME_ZONE,
                      })}`
                    : "Tasas referenciales activas"}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSyncing}
                onClick={onSync}
                className="rounded-xl h-8 px-2.5 text-[11px] font-bold gap-1.5 cursor-pointer"
              >
                <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                Sincronizar
              </Button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-2.5">
              <Label className="text-xs font-bold block">
                Tasas del Día (Bolívares por unidad)
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="input-bcv" className="text-[10px] text-muted-foreground font-semibold">
                    BCV ($ USD)
                  </Label>
                  <Input
                    id="input-bcv"
                    type="number"
                    step="0.01"
                    value={inputBcv}
                    onChange={(e) => setInputBcv(e.target.value)}
                    className="rounded-xl h-8 text-xs font-bold mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="input-eur" className="text-[10px] text-muted-foreground font-semibold">
                    Euro (€ EUR)
                  </Label>
                  <Input
                    id="input-eur"
                    type="number"
                    step="0.01"
                    value={inputEur}
                    onChange={(e) => setInputEur(e.target.value)}
                    className="rounded-xl h-8 text-xs font-bold mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="input-usdt" className="text-[10px] text-muted-foreground font-semibold">
                    USDT (Binance)
                  </Label>
                  <Input
                    id="input-usdt"
                    type="number"
                    step="0.01"
                    value={inputUsdt}
                    onChange={(e) => setInputUsdt(e.target.value)}
                    className="rounded-xl h-8 text-xs font-bold mt-1"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full rounded-xl text-xs font-bold mt-1">
                Guardar Tasas Manuales
              </Button>
            </form>

            <ExchangeRateConverter
              rate={rate}
              rates={rates}
              calcUsd={calcUsd}
              setCalcUsd={setCalcUsd}
              calcBs={calcBs}
              setCalcBs={setCalcBs}
              calcEur={calcEur}
              setCalcEur={setCalcEur}
              calcUsdt={calcUsdt}
              setCalcUsdt={setCalcUsdt}
            />
          </div>
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={onSync}
        disabled={isSyncing}
        title="Sincronizar Tasas (BCV, Euro y USDT)"
        aria-label="Sincronizar Tasas (BCV, Euro y USDT)"
        className="h-10 w-10 rounded-2xl border border-border/60 bg-muted/40 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin text-primary")} />
      </button>
    </div>
  );
}
export default ExchangeRateToolbarPill;
