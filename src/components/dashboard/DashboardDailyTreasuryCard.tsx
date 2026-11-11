import React, { useState, useMemo, useTransition, lazy, Suspense, memo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Coins,
  Smartphone,
  Banknote,
  ShoppingBag,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { useExchangeRate, formatBs, formatEurFromUsd } from "@/hooks/useExchangeRate";
import { inferCategoryFromMethod } from "@/lib/api/paymentMethods";
import { TreasuryChannelCard } from "./TreasuryChannelCard";
import { APP_LOCALE, APP_TIME_ZONE } from "@/lib/constants/locale";
import type { Invoice } from "@/components/finance/ViewInvoiceDialog";

const CashCloseDialog = lazy(() =>
  import("@/components/finance/CashCloseDialog").then((m) => ({ default: m.CashCloseDialog }))
);

const preloadCashCloseDialog = () => {
  void import("@/components/finance/CashCloseDialog");
};

export interface DashboardDailyTreasuryCardProps {
  invoices: Invoice[];
  isLoading?: boolean;
}

export const DashboardDailyTreasuryCard = memo(function DashboardDailyTreasuryCard({
  invoices,
  isLoading = false,
}: DashboardDailyTreasuryCardProps) {
  const [hasMountedCashClose, setHasMountedCashClose] = useState(false);
  const [cashCloseOpen, setCashCloseOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { rate, rates } = useExchangeRate();

  const handleOpenCashClose = () => {
    startTransition(() => {
      setHasMountedCashClose(true);
      setCashCloseOpen(true);
    });
  };

  const todayIso = useMemo(() => {
    return new Date().toLocaleDateString("en-CA", { timeZone: APP_TIME_ZONE });
  }, []);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString(APP_LOCALE, {
      timeZone: APP_TIME_ZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, []);

  const {
    todayPaidInvoices,
    todayPendingInvoices,
    totalTodayUsd,
    divisasUsd,
    bolivaresBs,
    bolivaresUsd,
    casheaInitUsd,
    casheaPendingUsd,
    binanceUsdt,
  } = useMemo(() => {
    const todayInvoices = invoices.filter((inv) => (inv.fecha_emision || "").slice(0, 10) === todayIso);

    const paid: Invoice[] = [];
    const pending: Invoice[] = [];

    let totalUsd = 0;
    let divUsd = 0;
    let bvsUsd = 0;
    let bvsBs = 0;
    let cshInit = 0;
    let cshPend = 0;
    let binUsdt = 0;

    for (const inv of todayInvoices) {
      const st = (inv.estado_pago || "").toLowerCase();
      const isPaid = st === "pagado" || st === "pagada" || st === "paid";
      const amt = Number(inv.total_general) || 0;

      if (isPaid) {
        paid.push(inv);
        totalUsd += amt;

        const cat = inferCategoryFromMethod(inv.metodo_pago || "Efectivo", inv.metodo_pago || "Efectivo");

        if (cat === "Divisas") {
          divUsd += amt;
        } else if (cat === "Pago Móvil" || cat === "Transferencia" || cat === "Punto de Venta" || cat === "Efectivo") {
          bvsUsd += amt;
          bvsBs += amt * (rate || rates.bcv);
        } else if (cat === "Binance") {
          binUsdt += amt;
        } else if (cat === "Cashea") {
          const match = `${inv.metodo_pago || ""} ${inv.referencia || ""}`.match(/(\d{2})%/);
          const pct = match ? Number(match[1]) : 50;
          const initAmt = Number(((amt * pct) / 100).toFixed(2));
          cshInit += initAmt;
          cshPend += Math.max(amt - initAmt, 0);
        } else {
          divUsd += amt;
        }
      } else {
        pending.push(inv);
      }
    }

    return {
      todayPaidInvoices: paid,
      todayPendingInvoices: pending,
      totalTodayUsd: totalUsd,
      divisasUsd: divUsd,
      bolivaresBs: bvsBs,
      bolivaresUsd: bvsUsd,
      casheaInitUsd: cshInit,
      casheaPendingUsd: cshPend,
      binanceUsdt: binUsdt,
    };
  }, [invoices, todayIso, rate, rates.bcv]);

  return (
    <>
      <div className="glass-card rounded-[2rem] p-5 shadow-lg shadow-black/5 flex flex-col border border-border/80">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-foreground tracking-tight truncate">
                  Caja y Tesorería
                </h3>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                  Hoy
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground capitalize font-medium truncate">{todayLabel}</p>
            </div>
          </div>

          {/* Cierre Z Button */}
          <button
            type="button"
            onClick={handleOpenCashClose}
            onPointerEnter={preloadCashCloseDialog}
            onFocus={preloadCashCloseDialog}
            aria-busy={isPending}
            className="flex items-center gap-1.5 min-h-11 sm:min-h-9 px-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-[transform,colors] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sm cursor-pointer shrink-0"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>Cierre Z</span>
          </button>
        </div>

        {/* Hero Totals Row */}
        <div className="bg-gradient-to-br from-primary/10 via-card to-secondary/5 rounded-2xl p-4 border border-primary/15 mb-4 flex flex-col gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
              Total Cobrado Hoy
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-2xl font-extrabold text-foreground tabular-nums tracking-tight">
                ${totalTodayUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="flex items-baseline gap-1.5 text-xs font-bold text-primary tabular-nums">
                <span>≈ {formatBs(totalTodayUsd, rates.bcv)}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  ({formatEurFromUsd(totalTodayUsd, rates)})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              {todayPaidInvoices.length} {todayPaidInvoices.length === 1 ? "cobrada" : "cobradas"}
            </span>

            {todayPendingInvoices.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3 w-3" />
                {todayPendingInvoices.length} por cobrar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">
                0 pendientes
              </span>
            )}
          </div>
        </div>

        {/* Channels Breakdown */}
        <div className="grid grid-cols-2 gap-2.5">
          <TreasuryChannelCard
            label="Efectivo ($/€)"
            icon={Banknote}
            iconColor="text-emerald-500"
            primaryValue={`$${divisasUsd.toFixed(2)}`}
            secondaryValue="Billetes en caja"
          />
          <TreasuryChannelCard
            label="Pago Móvil / Bancos"
            icon={Smartphone}
            iconColor="text-blue-500"
            primaryValue={bolivaresBs > 0 ? formatBs(bolivaresUsd, rates.bcv) : "Bs. 0,00"}
            secondaryValue={`≈ $${bolivaresUsd.toFixed(2)} USD`}
          />
          <TreasuryChannelCard
            label="Cashea"
            icon={ShoppingBag}
            iconColor="text-yellow-500"
            primaryValue={`$${casheaInitUsd.toFixed(2)}`}
            secondaryValue={`+$${casheaPendingUsd.toFixed(2)} financiado`}
          />
          <TreasuryChannelCard
            label="Binance Pay"
            icon={Coins}
            iconColor="text-amber-500"
            primaryValue={`${binanceUsdt.toFixed(2)} USDT`}
            secondaryValue="Cripto liquidado"
          />
        </div>

        {/* Footer Navigation Link */}
        <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-center text-xs">
          <Link
            to="/facturacion"
            className="w-full justify-center font-bold text-primary hover:underline flex items-center gap-1 group py-1 cursor-pointer"
          >
            Ir a Ventas y Facturación
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Cash Close Report Modal */}
      {hasMountedCashClose && (
        <Suspense fallback={null}>
          <CashCloseDialog
            open={cashCloseOpen}
            onOpenChange={setCashCloseOpen}
            invoices={invoices}
            rate={rate}
            rates={rates}
          />
        </Suspense>
      )}
    </>
  );
});
