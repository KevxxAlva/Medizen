import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Copy, Check } from "lucide-react";
import { formatBs, type ExchangeRates } from "@/hooks/useExchangeRate";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface BcvCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rates: ExchangeRates;
}

type CurrencyMode = "usd" | "eur" | "bs";

const CURRENCIES: { id: CurrencyMode; label: string; symbol: string }[] = [
  { id: "usd", label: "$ Dólar (USD)", symbol: "$" },
  { id: "eur", label: "€ Euro (EUR)", symbol: "€" },
  { id: "bs", label: "Bs. Bolívares", symbol: "Bs." },
];

const PRESETS: Record<CurrencyMode, number[]> = {
  usd: [15, 25, 35, 50, 70, 100],
  eur: [15, 25, 35, 50, 70, 100],
  bs: [10000, 25000, 35000, 50000, 75000, 100000],
};

export function BcvCalculatorDialog({ open, onOpenChange, rates }: BcvCalculatorDialogProps) {
  const [mode, setMode] = useState<CurrencyMode>("usd");
  const [inputValue, setInputValue] = useState<string>("35");
  const [copied, setCopied] = useState(false);

  // Auto-corregir tasa de Euro si estuviera guardada como ratio (< 100) en lugar de Bolívares
  const effectiveEur = useMemo(() => {
    const bcv = rates.bcv > 0 ? rates.bcv : 894.89;
    if (rates.eur < 100 && bcv > 100) {
      return Math.round(bcv * (rates.eur > 0.8 && rates.eur < 1.5 ? rates.eur : 1.124) * 100) / 100;
    }
    return rates.eur > 0 ? rates.eur : 1006.03;
  }, [rates.eur, rates.bcv]);

  const numVal = useMemo(() => {
    const parsed = parseFloat(inputValue.replace(",", "."));
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [inputValue]);

  const calculations = useMemo(() => {
    const bcvRate = rates.bcv > 0 ? rates.bcv : 1;
    const usdtRate = rates.usdt > 0 ? rates.usdt : bcvRate;

    if (mode === "usd") {
      const bs = numVal * bcvRate;
      return {
        mainBs: bs,
        usdVal: numVal,
        eurVal: effectiveEur > 0 ? bs / effectiveEur : numVal * 0.92,
        usdtVal: usdtRate > 0 ? bs / usdtRate : numVal,
      };
    } else if (mode === "eur") {
      const bs = numVal * effectiveEur;
      return {
        mainBs: bs,
        usdVal: bcvRate > 0 ? bs / bcvRate : numVal * 1.08,
        eurVal: numVal,
        usdtVal: usdtRate > 0 ? bs / usdtRate : numVal,
      };
    } else {
      return {
        mainBs: numVal,
        usdVal: bcvRate > 0 ? numVal / bcvRate : 0,
        eurVal: effectiveEur > 0 ? numVal / effectiveEur : 0,
        usdtVal: usdtRate > 0 ? numVal / usdtRate : 0,
      };
    }
  }, [mode, numVal, rates.bcv, rates.usdt, effectiveEur]);

  const handleCopy = () => {
    const text = mode === "usd"
      ? `Cobro: $${numVal.toFixed(2)} USD ≈ ${formatBs(calculations.mainBs, 1)} (Dólar BCV: Bs. ${rates.bcv.toFixed(2)} | Euro BCV: Bs. ${effectiveEur.toFixed(2)})`
      : mode === "eur"
      ? `Cobro: €${numVal.toFixed(2)} EUR ≈ ${formatBs(calculations.mainBs, 1)} (Euro Oficial BCV: Bs. ${effectiveEur.toFixed(2)})`
      : `Monto: Bs. ${numVal.toLocaleString("es-VE")} ≈ $${calculations.usdVal.toFixed(2)} USD | €${calculations.eurVal.toFixed(2)} EUR`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Conversión copiada al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectMode = (newMode: CurrencyMode) => {
    setMode(newMode);
    if (newMode === "bs") {
      setInputValue(calculations.mainBs > 0 ? calculations.mainBs.toFixed(0) : "35000");
    } else if (newMode === "eur") {
      setInputValue(calculations.eurVal > 0 ? calculations.eurVal.toFixed(2) : "35");
    } else {
      setInputValue(calculations.usdVal > 0 ? calculations.usdVal.toFixed(2) : "35");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2rem] p-6 bg-card border-border shadow-2xl">
        <DialogHeader className="mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Calculadora de Cambio Clínico
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Conversión oficial en tiempo real para Dólar, Euro y Bolívares
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Live Rates Pill */}
        <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-muted/40 rounded-2xl border border-border/60 text-center">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Dólar BCV</div>
            <div className="text-xs font-bold text-foreground tabular-nums">Bs. {rates.bcv.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Euro BCV</div>
            <div className="text-xs font-bold text-foreground tabular-nums">Bs. {effectiveEur.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase">USDT Binance</div>
            <div className="text-xs font-bold text-foreground tabular-nums">Bs. {rates.usdt.toFixed(2)}</div>
          </div>
        </div>

        {/* Currency Tabs */}
        <div className="space-y-4 pt-1">
          <div
            className="flex gap-1 rounded-xl bg-muted/60 p-1 border border-border/60"
            role="tablist"
            aria-label="Moneda de entrada"
          >
            {CURRENCIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={mode === c.id}
                onClick={() => handleSelectMode(c.id)}
                className={cn(
                  "flex-1 min-h-11 sm:min-h-9 px-2 text-xs font-bold rounded-lg transition-[transform,colors] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                  mode === c.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Input Field */}
          <div className="space-y-1.5">
            <Label htmlFor="bcv-calc-input" className="text-xs font-bold text-foreground">
              {mode === "usd" ? "Monto en Dólares ($)" : mode === "eur" ? "Monto en Euros (€)" : "Monto en Bolívares (Bs.)"}
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-base">
                {CURRENCIES.find((c) => c.id === mode)?.symbol}
              </span>
              <Input
                id="bcv-calc-input"
                type="number"
                step="any"
                min="0"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="0.00"
                className="pl-9 text-lg font-bold h-12 rounded-xl bg-background border-border tabular-nums"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">
              Atajos:
            </span>
            {PRESETS[mode].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setInputValue(amt.toString())}
                className="min-h-11 sm:min-h-8 px-3 text-xs font-semibold bg-muted hover:bg-primary/10 hover:text-primary rounded-lg transition-[transform,colors] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer tabular-nums"
              >
                {mode === "usd" ? `$${amt}` : mode === "eur" ? `€${amt}` : `Bs. ${amt.toLocaleString("es-VE")}`}
              </button>
            ))}
          </div>

          {/* Results Box */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-baseline flex-wrap gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                {mode === "eur" ? "Equivalente en Bolívares (Euro BCV):" : "Equivalente en Bolívares (Dólar BCV):"}
              </span>
              <span className="text-2xl font-display font-extrabold text-foreground tabular-nums tracking-tight">
                {formatBs(calculations.mainBs, 1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/10 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  {mode === "usd" ? "En Euros (€ Oficial):" : "En Dólares ($ BCV):"}
                </span>
                <span className="font-bold text-foreground tabular-nums">
                  {mode === "usd" ? `€${calculations.eurVal.toFixed(2)}` : `$${calculations.usdVal.toFixed(2)}`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">En Binance (USDT):</span>
                <span className="font-bold text-foreground tabular-nums">{calculations.usdtVal.toFixed(2)} USDT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="min-h-11 sm:min-h-9 px-3.5 gap-1.5 rounded-xl font-bold text-xs cursor-pointer transition-[transform,colors] duration-150 active:scale-95 focus-visible:ring-2"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied ? "Copiado" : "Copiar detalle"}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="min-h-11 sm:min-h-9 px-4 rounded-xl font-bold text-xs cursor-pointer transition-[transform,colors] duration-150 active:scale-95 focus-visible:ring-2"
          >
            Listo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
