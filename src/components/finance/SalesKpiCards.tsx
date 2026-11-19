import { DollarSign, CreditCard, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RATE_LABELS,
  type RateType,
  type ExchangeRates,
} from "@/hooks/useExchangeRate";

export interface SalesKpiStats {
  paidTotal: number;
  paidCount: number;
  pendingTotal: number;
  pendingCount: number;
  totalEmitted: number;
  activeCount: number;
  avgTicket: number;
}

export interface SalesKpiCardsProps {
  kpiStats: SalesKpiStats;
  rate: number;
  rates: ExchangeRates;
  activeType: RateType;
  filterStatus: string;
  onSelectStatus: (status: string) => void;
}

function formatBs(usd: number, rateValue: number) {
  return `Bs. ${(usd * rateValue).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatEurFromUsd(usd: number, rates: ExchangeRates) {
  const eurRate = rates.eur > 0 ? rates.eur : rates.bcv * 1.08;
  const inEur = (usd * rates.bcv) / eurRate;
  return `€${inEur.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function SalesKpiCards({
  kpiStats,
  rate,
  rates,
  activeType,
  filterStatus,
  onSelectStatus,
}: SalesKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <button
        type="button"
        onClick={() => onSelectStatus("pagado")}
        className={cn(
          "text-left p-4 rounded-2xl border transition-colors cursor-pointer flex items-start justify-between gap-3",
          filterStatus === "pagado"
            ? "bg-emerald-500/10 border-emerald-500/50 shadow-sm"
            : "bg-muted/20 border-border/60 hover:border-emerald-500/40 hover:bg-muted/40"
        )}
      >
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            Total Cobrado ({kpiStats.paidCount})
          </span>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              ${kpiStats.paidTotal.toFixed(2)}
            </p>
            <span className="text-xs font-bold text-muted-foreground">
              · {formatEurFromUsd(kpiStats.paidTotal, rates)}
            </span>
          </div>
          <p className="text-xs font-bold text-muted-foreground">
            {formatBs(kpiStats.paidTotal, rate)}{" "}
            <span className="text-[10px] text-primary font-semibold">
              ({RATE_LABELS[activeType].short})
            </span>
          </p>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <DollarSign className="h-5 w-5" />
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelectStatus("pendiente")}
        className={cn(
          "text-left p-4 rounded-2xl border transition-colors cursor-pointer flex items-start justify-between gap-3",
          filterStatus === "pendiente"
            ? "bg-amber-500/10 border-amber-500/50 shadow-sm"
            : "bg-muted/20 border-border/60 hover:border-amber-500/40 hover:bg-muted/40"
        )}
      >
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            Por Cobrar / Pendiente ({kpiStats.pendingCount})
          </span>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              ${kpiStats.pendingTotal.toFixed(2)}
            </p>
            <span className="text-xs font-bold text-muted-foreground">
              · {formatEurFromUsd(kpiStats.pendingTotal, rates)}
            </span>
          </div>
          <p className="text-xs font-bold text-muted-foreground">
            {formatBs(kpiStats.pendingTotal, rate)}{" "}
            <span className="text-[10px] text-primary font-semibold">
              ({RATE_LABELS[activeType].short})
            </span>
          </p>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <CreditCard className="h-5 w-5" />
        </div>
      </button>

      <div className="p-4 rounded-2xl border border-border/60 bg-muted/20 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Facturado ({kpiStats.activeCount} activas)
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-foreground tracking-tight">
              ${kpiStats.totalEmitted.toFixed(2)}
            </p>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Prom: ${kpiStats.avgTicket.toFixed(2)}
            </span>
          </div>
          <p className="text-xs font-bold text-muted-foreground">
            {formatBs(kpiStats.totalEmitted, rate)}{" "}
            <span className="text-[11px] font-semibold text-muted-foreground">
              · {formatEurFromUsd(kpiStats.totalEmitted, rates)}
            </span>
          </p>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default SalesKpiCards;
