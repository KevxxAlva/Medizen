import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBs, type ExchangeRates } from "@/hooks/useExchangeRate";
import { inferCategoryFromMethod } from "@/lib/api/paymentMethods";
import {
  generateCashCloseReport,
  type CashCloseBreakdownItem,
} from "@/lib/utils/generateCashCloseReport";
import { toast } from "sonner";
import type { Invoice } from "@/lib/api/invoices";

export interface CashCloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  rate: number;
  rates: ExchangeRates;
}

export function CashCloseDialog({
  open,
  onOpenChange,
  invoices,
  rate,
  rates,
}: CashCloseDialogProps) {
  const [scope, setScope] = useState<"today" | "all">("today");
  const todayIso = new Date().toISOString().slice(0, 10);

  const paidInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const st = (inv.estado_pago || "").toLowerCase();
      const isPaid = st === "pagado" || st === "pagada" || st === "paid";
      if (!isPaid) return false;
      if (scope === "today") {
        return (inv.fecha_emision || "").slice(0, 10) === todayIso;
      }
      return true;
    });
  }, [invoices, scope, todayIso]);

  const { breakdown, casheaInitialTodayUsd, casheaFinancedPendingUsd, totalUsd } = useMemo(() => {
    const categories = [
      "Pago Móvil",
      "Transferencia",
      "Efectivo",
      "Divisas",
      "Binance",
      "Cashea",
    ];
    const map = new Map<string, { count: number; amountUsd: number }>();
    for (const c of categories) {
      map.set(c, { count: 0, amountUsd: 0 });
    }

    let casheaInit = 0;
    let casheaFin = 0;
    let grandTotal = 0;

    for (const inv of paidInvoices) {
      const amt = Number(inv.total_general) || 0;
      grandTotal += amt;
      const cat = inferCategoryFromMethod(inv.metodo_pago || "Efectivo", inv.metodo_pago || "Efectivo");
      const normalized = categories.includes(cat) ? cat : "Efectivo";
      const cur = map.get(normalized) || { count: 0, amountUsd: 0 };
      cur.count += 1;
      cur.amountUsd += amt;
      map.set(normalized, cur);

      if (normalized === "Cashea") {
        const pctMatch = `${inv.metodo_pago || ""} ${inv.referencia || ""}`.match(/(\d{2})%/);
        const pct = pctMatch ? Number(pctMatch[1]) : 50;
        const initAmt = Number(((amt * pct) / 100).toFixed(2));
        casheaInit += initAmt;
        casheaFin += Math.max(amt - initAmt, 0);
      }
    }

    const list: CashCloseBreakdownItem[] = categories.map((cat) => {
      const item = map.get(cat) || { count: 0, amountUsd: 0 };
      const effectiveRate = cat === "Binance" ? rates.usdt : rate;
      const label =
        cat === "Pago Móvil"
          ? "Pago Móvil (Bs. BCV)"
          : cat === "Transferencia"
          ? "Transferencia Bancaria (Bs.)"
          : cat === "Efectivo"
          ? "Efectivo en Bolívares (Bs.)"
          : cat === "Divisas"
          ? "Divisas Físicas ($ USD / € EUR)"
          : cat === "Binance"
          ? "Binance Pay (USDT)"
          : "Cashea (Inicial + 3 Cuotas)";
      return {
        category: label,
        count: item.count,
        amountUsd: item.amountUsd,
        amountBs: item.amountUsd * effectiveRate,
      };
    });

    return {
      breakdown: list,
      casheaInitialTodayUsd: casheaInit,
      casheaFinancedPendingUsd: casheaFin,
      totalUsd: grandTotal,
    };
  }, [paidInvoices, rate, rates.usdt]);

  const handleExportPdf = async () => {
    try {
      const dateLabel =
        scope === "today"
          ? `Hoy (${new Date().toLocaleDateString("es-VE")})`
          : `Acumulado General (${new Date().toLocaleDateString("es-VE")})`;
      await generateCashCloseReport({
        dateLabel,
        breakdown,
        invoices: paidInvoices.map((inv) => ({
          id: `INV-${inv.id_factura.toString().padStart(4, "0")}`,
          patientName: inv.paciente_nombre || "Paciente",
          date: inv.fecha_emision,
          amount: Number(inv.total_general) || 0,
          paymentMethod: inv.metodo_pago,
          reference: inv.referencia,
          status: inv.estado_pago,
        })),
        casheaInitialTodayUsd,
        casheaFinancedPendingUsd,
        customRate: rate,
      });
      toast.success("Acta de Cierre de Caja (Reporte Z) descargada en PDF");
    } catch (e: any) {
      toast.error(e?.message || "Error al exportar el cierre de caja");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.25rem)] sm:max-w-[580px] max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 border border-border/60 shadow-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-xl font-bold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary shrink-0" />
            <span>Arqueo y Cierre de Caja (Reporte Z)</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Conciliación de ingresos por método de pago en Venezuela (Bolívares, Divisas, Binance USDT y Cashea).
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-muted/50 p-1.5 rounded-2xl border border-border/60">
          <button
            type="button"
            onClick={() => setScope("today")}
            className={cn(
              "py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer truncate",
              scope === "today"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Operaciones de Hoy ({todayIso})
          </button>
          <button
            type="button"
            onClick={() => setScope("all")}
            className={cn(
              "py-1.5 px-2 rounded-xl text-xs font-bold transition cursor-pointer truncate",
              scope === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Todas las Cobradas ({invoices.filter((i) => ["pagado", "pagada", "paid"].includes((i.estado_pago || "").toLowerCase())).length})
          </button>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Total Consolidado ({paidInvoices.length} cobros)
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
              ${totalUsd.toFixed(2)} <span className="text-xs font-bold">USD</span>
            </p>
          </div>
          <div className="sm:text-right border-t sm:border-t-0 border-emerald-500/20 pt-1.5 sm:pt-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Equivalente BCV
            </span>
            <p className="text-sm sm:text-base font-extrabold text-foreground">
              {formatBs(totalUsd, rate)}
            </p>
          </div>
        </div>

        <div className="space-y-2 min-w-0">
          {breakdown.map((b) => (
            <div
              key={b.category}
              className="flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2.5 rounded-xl border border-border/60 bg-muted/20 text-xs min-w-0"
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground truncate">{b.category}</p>
                <p className="text-[11px] text-muted-foreground">{b.count} operaciones</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-extrabold text-foreground">${b.amountUsd.toFixed(2)}</p>
                <p className="text-[11px] font-semibold text-primary">
                  Bs. {b.amountBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {(casheaInitialTodayUsd > 0 || casheaFinancedPendingUsd > 0) && (
          <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-3.5 text-xs space-y-1">
            <p className="font-extrabold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-wider text-[11px]">
              Desglose Cartera Cashea
            </p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inicial recibida en clínica:</span>
              <span className="font-bold text-foreground">
                ${casheaInitialTodayUsd.toFixed(2)} ({formatBs(casheaInitialTodayUsd, rate)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo financiado en 3 cuotas (c/14 días):</span>
              <span className="font-bold text-fuchsia-600 dark:text-fuchsia-400">
                ${casheaFinancedPendingUsd.toFixed(2)} ({formatBs(casheaFinancedPendingUsd, rate)})
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={handleExportPdf}
            className="rounded-xl bg-primary text-primary-foreground gap-2 font-bold cursor-pointer"
          >
            <Download className="h-4 w-4" /> Descargar Acta Reporte Z (PDF)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default CashCloseDialog;
