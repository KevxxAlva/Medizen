import { APP_LOCALE, APP_TIME_ZONE } from "@/lib/constants/locale";
import { useState, useMemo } from "react";
import {
  Search,
  X,
  Pencil,
  Trash2,
  ChevronLeft,
  Filter,
  ReceiptText,
  Loader2,
  CreditCard,
  Download,
  RefreshCw,
  DollarSign,
  Clock,
  TrendingUp,
  ArrowRightLeft,
  Copy,
  Check,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateSalesReport } from "@/lib/utils/generateSalesReport";
import { generateIndividualInvoice } from "@/lib/utils/generateIndividualInvoice";
import { generateCashCloseReport, type CashCloseBreakdownItem } from "@/lib/utils/generateCashCloseReport";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { logAuditAction } from "@/lib/api/audit";
import {
  usePaymentMethods,
  VE_PAYMENT_PRESETS,
  inferCategoryFromMethod,
  getDefaultDetailsForCategory,
  formatPaymentMethodCopyText,
  type PaymentMethod,
} from "@/lib/api/paymentMethods";
import {
  getCategoryIcon,
  getCategoryBadgeStyle,
} from "@/components/finance/PaymentMethodsPage";
import {
  useExchangeRate,
  formatBs,
  formatEurFromUsd,
  RATE_LABELS,
  type RateType,
  type ExchangeRates,
} from "@/hooks/useExchangeRate";

export type Invoice = {
  id_factura: number;
  id_paciente: number | null;
  paciente_nombre?: string;
  fecha_emision: string;
  subtotal: number;
  monto_paciente: number;
  total_general: number;
  estado_pago: string;
  metodo_pago?: string | null;
  referencia?: string | null;
};

export function SalesPage() {
  const [q, setQ] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [cashCloseOpen, setCashCloseOpen] = useState(false);

  const {
    rate,
    rates,
    activeType,
    setActiveType,
    updatedAt,
    isManual,
    isSyncing,
    updateRates,
    syncWithBcv,
  } = useExchangeRate();

  const { data: methods = [] } = usePaymentMethods();

  const { data: facturas = [], isLoading } = useQuery({
    queryKey: ["facturas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facturas")
        .select(`
          id_factura, 
          id_paciente,
          fecha_emision,
          subtotal,
          monto_paciente,
          total_general,
          estado_pago,
          pacientes (nombre, apellido),
          pagos (id_pago, metodo_pago, referencia, monto_pagado, fecha_pago)
        `)
        .order("fecha_emision", { ascending: false });

      if (error) throw error;

      return data.map((f: any) => {
        const pago = Array.isArray(f.pagos) ? f.pagos[0] : f.pagos;
        return {
          id_factura: f.id_factura,
          id_paciente: f.id_paciente,
          paciente_nombre: f.pacientes
            ? `${f.pacientes.nombre} ${f.pacientes.apellido}`
            : "Paciente Desconocido",
          fecha_emision: f.fecha_emision,
          subtotal: f.subtotal,
          monto_paciente: f.monto_paciente,
          total_general: f.total_general,
          estado_pago: f.estado_pago || "Pendiente",
          metodo_pago: pago?.metodo_pago || null,
          referencia: pago?.referencia || null,
        };
      }) as Invoice[];
    },
  });

  const queryClient = useQueryClient();

  const updatePaymentStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      invoice,
      finalMethod,
      finalReference,
      creditedUsdAmount,
      usedRate,
      usedRateType,
    }: {
      id: number;
      status: string;
      invoice: Invoice;
      finalMethod?: string;
      finalReference?: string;
      creditedUsdAmount?: number;
      usedRate?: number;
      usedRateType?: RateType;
    }) => {
      const effectiveRate = usedRate || rate;
      const effectiveType = usedRateType || activeType;
      const methodToSave = finalMethod || paymentMethod || "Pago Móvil";
      const amountToCredit = creditedUsdAmount ?? invoice.total_general;

      const { error: invError } = await supabase
        .from("facturas")
        .update({ estado_pago: status })
        .eq("id_factura", id);

      if (invError) throw invError;

      const { data: existP } = await supabase
        .from("pagos")
        .select("id_pago")
        .eq("id_factura", id)
        .maybeSingle();

      const refToSave = (finalReference ?? paymentReference) || null;

      if (existP) {
        const { error: payError } = await supabase
          .from("pagos")
          .update({
            monto_pagado: invoice.total_general,
            metodo_pago: methodToSave,
            referencia: refToSave,
            fecha_pago: new Date().toISOString(),
          })
          .eq("id_pago", existP.id_pago);

        if (payError) throw payError;
      } else {
        const { error: payError } = await supabase.from("pagos").insert({
          id_factura: id,
          monto_pagado: invoice.total_general,
          metodo_pago: methodToSave,
          referencia: refToSave,
          fecha_pago: new Date().toISOString(),
        });

        if (payError) throw payError;
      }

      // Función auxiliar para abonar el saldo a la cuenta vinculada o a la cuenta por categoría en Venezuela
      const creditAccountForMethod = async (targetMethodName: string, usdAmount: number) => {
        if (!usdAmount || usdAmount <= 0) return;
        const { data: allMethods } = await supabase
          .from("payment_methods")
          .select("name, category, account_id");
        const { data: allAccounts } = await supabase
          .from("financial_accounts")
          .select("id, name, type, balance");

        if (!allAccounts || allAccounts.length === 0) return;

        const targetCat = inferCategoryFromMethod(targetMethodName, targetMethodName);
        const matchedPm = (allMethods || []).find(
          (m: any) =>
            m.name?.toLowerCase() === targetMethodName.toLowerCase() ||
            inferCategoryFromMethod(m.name || "", m.category || "") === targetCat
        );

        let targetAcc = matchedPm?.account_id
          ? allAccounts.find((a: any) => a.id === matchedPm.account_id)
          : undefined;

        if (!targetAcc) {
          // Fallback inteligente según el tipo de cuenta en Venezuela
          targetAcc = allAccounts.find((a: any) => {
            const combined = `${a.type || ""} ${a.name || ""}`.toLowerCase();
            if (targetCat === "Pago Móvil" || targetCat === "Transferencia" || targetCat === "Punto de Venta") {
              return combined.includes("bank") || combined.includes("banca") || combined.includes("banco");
            }
            if (targetCat === "Divisas" || targetCat === "Efectivo") {
              return combined.includes("cash") || combined.includes("caja") || combined.includes("efectivo");
            }
            if (targetCat === "Binance") {
              return combined.includes("binance") || combined.includes("usdt") || combined.includes("digital");
            }
            if (targetCat === "Cashea") {
              return combined.includes("cashea") || combined.includes("digital");
            }
            return false;
          });
        }

        if (targetAcc) {
          await supabase
            .from("financial_accounts")
            .update({ balance: Number(((Number(targetAcc.balance) || 0) + usdAmount).toFixed(2)) })
            .eq("id", targetAcc.id);
        }
      };

      await creditAccountForMethod(paymentMethod || methodToSave, amountToCredit);

      await logAuditAction("UPDATE", "INVOICE", id.toString(), {
        status,
        monto: invoice.total_general,
        tipo_tasa: effectiveType.toUpperCase(),
        tasa_aplicada: effectiveRate,
        monto_bs: Number((invoice.total_general * effectiveRate).toFixed(2)),
        metodo_pago: methodToSave,
        referencia: refToSave,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["monthly_payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      queryClient.invalidateQueries({ queryKey: ["financial_accounts"] });
      toast.success("Pago confirmado y registrado exitosamente");
      setConfirmOpen(false);
    },
    onError: (err: any) => {
      toast.error(`Error al actualizar estado: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("facturas").delete().eq("id_factura", id);
      if (error) throw error;
      await logAuditAction("DELETE", "INVOICE", id.toString());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      queryClient.invalidateQueries({ queryKey: ["monthly_payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      toast.success("Factura eliminada");
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar: ${err.message}`);
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({
      id,
      total_general,
      estado_pago,
      fecha_emision,
    }: {
      id: number;
      total_general: number;
      estado_pago: string;
      fecha_emision: string;
    }) => {
      const { error } = await supabase
        .from("facturas")
        .update({
          subtotal: total_general,
          monto_paciente: total_general,
          total_general,
          estado_pago,
          fecha_emision,
        })
        .eq("id_factura", id);
      if (error) throw error;
      await logAuditAction("UPDATE", "INVOICE", id.toString(), {
        total_general,
        estado_pago,
        fecha_emision,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      queryClient.invalidateQueries({ queryKey: ["monthly_payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      toast.success("Factura actualizada exitosamente");
      setEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(`Error al actualizar factura: ${err.message}`);
    },
  });

  const handleEditClick = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setEditOpen(true);
  };

  const handleConfirmClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentMethod("");
    setPaymentReference("");
    setConfirmOpen(true);
  };

  const periodInvoices = useMemo(() => {
    return facturas.filter((f) => {
      if (q) {
        const query = q.toLowerCase();
        const numMatch =
          `inv-${f.id_factura.toString().padStart(4, "0")}`.includes(query) ||
          f.id_factura.toString().includes(query);
        const nameMatch = (f.paciente_nombre || "").toLowerCase().includes(query);
        if (!numMatch && !nameMatch) return false;
      }
      if (filterMonth && !f.fecha_emision.startsWith(filterMonth)) return false;
      return true;
    });
  }, [facturas, q, filterMonth]);

  const kpiStats = useMemo(() => {
    let paidTotal = 0;
    let paidCount = 0;
    let pendingTotal = 0;
    let pendingCount = 0;
    let totalEmitted = 0;

    for (const f of periodInvoices) {
      const amount = Number(f.total_general) || 0;
      const st = (f.estado_pago || "pendiente").toLowerCase();
      if (st === "pagado" || st === "pagada" || st === "paid") {
        paidTotal += amount;
        paidCount++;
        totalEmitted += amount;
      } else if (st === "pendiente" || st === "pending") {
        pendingTotal += amount;
        pendingCount++;
        totalEmitted += amount;
      }
    }

    const activeCount = paidCount + pendingCount;
    const avgTicket = activeCount > 0 ? totalEmitted / activeCount : 0;

    return {
      paidTotal,
      paidCount,
      pendingTotal,
      pendingCount,
      totalEmitted,
      activeCount,
      avgTicket,
    };
  }, [periodInvoices]);

  const filtered = useMemo(() => {
    return periodInvoices.filter((f) => {
      if (filterStatus !== "all") {
        const st = (f.estado_pago || "pendiente").toLowerCase();
        if (filterStatus === "pagado" && !["pagado", "pagada", "paid"].includes(st)) {
          return false;
        }
        if (filterStatus === "pendiente" && !["pendiente", "pending"].includes(st)) {
          return false;
        }
        if (filterStatus === "cancelado" && !["cancelado", "cancelada", "cancelled"].includes(st)) {
          return false;
        }
      }
      if (filterMethod !== "all") {
        if (!f.metodo_pago) return false;
        const cat = inferCategoryFromMethod(f.metodo_pago, f.metodo_pago);
        if (cat !== filterMethod) return false;
      }
      return true;
    });
  }, [periodInvoices, filterStatus, filterMethod]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generatePDFReport = async () => {
    try {
      await generateSalesReport(filtered, filterMonth, rate);
      toast.success("Reporte multimoneda generado exitosamente");
    } catch (err: any) {
      toast.error(`Error al generar reporte: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] font-sans flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-muted-foreground hover:text-foreground"
            title="Volver"
            aria-label="Volver"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Ventas y Facturación</h1>
            <p className="text-xs text-muted-foreground">
              Control multimoneda en USD ($), Bolívares (BCV), Euros (€) y USDT
            </p>
          </div>
        </div>
        <div className="flex-1 max-w-md mx-auto w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-full bg-muted border border-border px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por paciente o N° Factura (ej: 0001)…"
              aria-label="Buscar por paciente o N° Factura"
              className="w-full bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40 rounded-lg px-1 placeholder:text-muted-foreground text-foreground"
            />
            {q && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  setQ("");
                  setCurrentPage(1);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <ExchangeRateToolbarPill
          rate={rate}
          rates={rates}
          activeType={activeType}
          onSelectType={setActiveType}
          updatedAt={updatedAt}
          isManual={isManual}
          isSyncing={isSyncing}
          onUpdateRates={updateRates}
          onSync={() => syncWithBcv(false)}
        />
      </header>

      {/* KPI SUMMARY CARDS (USD + Bs. + EUR + USDT) */}
      <SalesKpiCards
        kpiStats={kpiStats}
        rate={rate}
        rates={rates}
        activeType={activeType}
        filterStatus={filterStatus}
        onSelectStatus={(st) => {
          setFilterStatus((prev) => (prev === st ? "all" : st));
          setCurrentPage(1);
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <ReceiptText className="h-4 w-4" /> {filtered.length} facturas registradas
          {filterStatus !== "all" && (
            <span className="ml-1 text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase">
              Filtro: {filterStatus}
            </span>
          )}
          {filterMethod !== "all" && (
            <span className="ml-1 text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
              Método: {filterMethod}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <SalesFilterPopover
            filterMonth={filterMonth}
            setFilterMonth={(val) => {
              setFilterMonth(val);
              setCurrentPage(1);
            }}
            filterStatus={filterStatus}
            setFilterStatus={(val) => {
              setFilterStatus(val);
              setCurrentPage(1);
            }}
            filterMethod={filterMethod}
            setFilterMethod={(val) => {
              setFilterMethod(val);
              setCurrentPage(1);
            }}
            onReset={() => {
              setFilterMonth("");
              setFilterStatus("all");
              setFilterMethod("all");
              setCurrentPage(1);
            }}
          />

          <Button
            type="button"
            onClick={() => setCashCloseOpen(true)}
            variant="outline"
            className="flex items-center gap-2 border-primary/30 bg-primary/5 text-primary font-bold rounded-xl text-xs hover:bg-primary/10 cursor-pointer"
          >
            <Calculator className="h-3.5 w-3.5" /> Cierre de Caja (Reporte Z)
          </Button>

          <Button
            type="button"
            onClick={generatePDFReport}
            variant="outline"
            className="flex items-center gap-2 border-border/40 text-foreground font-bold rounded-xl text-xs hover:bg-muted cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" /> Reporte Mensual
          </Button>
        </div>
      </div>

      <SalesTable
        paginated={paginated}
        rate={rate}
        rates={rates}
        activeType={activeType}
        onEdit={handleEditClick}
        onConfirm={handleConfirmClick}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <EditInvoiceDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        invoice={editingInvoice}
        rate={rate}
        rates={rates}
        isPending={updateInvoiceMutation.isPending}
        onSave={(data) => updateInvoiceMutation.mutate(data)}
      />

      <ConfirmPaymentDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        invoice={selectedInvoice}
        rates={rates}
        defaultRateType={activeType}
        methods={methods}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentReference={paymentReference}
        setPaymentReference={setPaymentReference}
        isPending={updatePaymentStatus.isPending}
        onConfirm={(finalReference, usedRate, usedRateType, finalMethod, creditedUsdAmount) => {
          if (!selectedInvoice) return;
          updatePaymentStatus.mutate({
            id: selectedInvoice.id_factura,
            status: "pagado",
            invoice: selectedInvoice,
            finalMethod,
            finalReference,
            creditedUsdAmount,
            usedRate,
            usedRateType,
          });
        }}
      />

      <CashCloseDialog
        open={cashCloseOpen}
        onOpenChange={setCashCloseOpen}
        invoices={facturas}
        rate={rate}
        rates={rates}
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        entityLabel="facturas"
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

function ExchangeRateToolbarPill({
  rate,
  rates,
  activeType,
  onSelectType,
  updatedAt,
  isManual,
  isSyncing,
  onUpdateRates,
  onSync,
}: {
  rate: number;
  rates: ExchangeRates;
  activeType: RateType;
  onSelectType: (type: RateType) => void;
  updatedAt: string | null;
  isManual: boolean;
  isSyncing: boolean;
  onUpdateRates: (nextRates: Partial<ExchangeRates>, manual?: boolean) => void;
  onSync: () => void;
}) {
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
      {/* SELECTOR RÁPIDO DE MONEDA DE REFERENCIA: BCV ($) | EUR (€) | USDT */}
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
          className="w-[350px] sm:w-[380px] rounded-3xl glass-card border border-border/60 shadow-2xl p-5"
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
                  <Label htmlFor="rate-bcv" className="text-[10px] text-muted-foreground font-bold">
                    USD BCV ($)
                  </Label>
                  <Input
                    id="rate-bcv"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={inputBcv}
                    onChange={(e) => setInputBcv(e.target.value)}
                    className="rounded-xl h-8 text-xs font-bold mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rate-eur" className="text-[10px] text-muted-foreground font-bold">
                    Euro BCV (€)
                  </Label>
                  <Input
                    id="rate-eur"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={inputEur}
                    onChange={(e) => setInputEur(e.target.value)}
                    className="rounded-xl h-8 text-xs font-bold mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rate-usdt" className="text-[10px] text-muted-foreground font-bold">
                    USDT (₮)
                  </Label>
                  <Input
                    id="rate-usdt"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={inputUsdt}
                    onChange={(e) => setInputUsdt(e.target.value)}
                    className="rounded-xl h-8 text-xs font-bold mt-1"
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="sm"
                className="w-full rounded-xl h-8 text-xs font-bold bg-primary text-primary-foreground cursor-pointer"
              >
                Guardar Tasas Manuales
              </Button>
            </form>

            <div className="bg-muted/40 border border-border/50 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Conversor Multimoneda en Vivo
                </span>
                <span className="text-[10px] font-bold text-primary">
                  Base: {RATE_LABELS[activeType].short}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
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
                        recalculateFromUsd(num);
                      } else {
                        setCalcBs("");
                        setCalcEur("");
                        setCalcUsdt("");
                      }
                    }}
                    className="rounded-xl h-8 text-xs font-bold mt-1 bg-background"
                  />
                </div>
                <div>
                  <Label htmlFor="calc-bs" className="text-[10px] text-muted-foreground font-semibold">
                    Bolívares (Bs. a {RATE_LABELS[activeType].short})
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

function SalesKpiCards({
  kpiStats,
  rate,
  rates,
  activeType,
  filterStatus,
  onSelectStatus,
}: {
  kpiStats: {
    paidTotal: number;
    paidCount: number;
    pendingTotal: number;
    pendingCount: number;
    totalEmitted: number;
    activeCount: number;
    avgTicket: number;
  };
  rate: number;
  rates: ExchangeRates;
  activeType: RateType;
  filterStatus: string;
  onSelectStatus: (status: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* CARD 1: TOTAL COBRADO */}
      <button
        type="button"
        onClick={() => onSelectStatus("pagado")}
        className={cn(
          "text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3",
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

      {/* CARD 2: CUENTAS POR COBRAR / PENDIENTE */}
      <button
        type="button"
        onClick={() => onSelectStatus("pendiente")}
        className={cn(
          "text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3",
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
          <Clock className="h-5 w-5" />
        </div>
      </button>

      {/* CARD 3: FACTURACIÓN TOTAL Y TICKET PROMEDIO */}
      <div className="p-4 rounded-2xl border border-border/60 bg-muted/20 flex items-start justify-between gap-3 sm:col-span-2 lg:col-span-1">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Facturado ({kpiStats.activeCount} activas)
          </span>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-foreground tracking-tight">
              ${kpiStats.totalEmitted.toFixed(2)}
            </p>
            <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Prom: ${kpiStats.avgTicket.toFixed(2)}
            </span>
          </div>
          <p className="text-xs font-bold text-muted-foreground">
            {formatBs(kpiStats.totalEmitted, rate)} ·{" "}
            {formatEurFromUsd(kpiStats.totalEmitted, rates)}
          </p>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SalesFilterPopover({
  filterMonth,
  setFilterMonth,
  filterStatus,
  setFilterStatus,
  filterMethod,
  setFilterMethod,
  onReset,
}: {
  filterMonth: string;
  setFilterMonth: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterMethod: string;
  setFilterMethod: (val: string) => void;
  onReset: () => void;
}) {
  const isFiltered = filterMonth !== "" || filterStatus !== "all" || filterMethod !== "all";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-bold text-foreground border border-border/40 rounded-xl hover:bg-muted transition-colors cursor-pointer",
            isFiltered && "bg-primary/10 border-primary text-primary"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          {isFiltered ? "Filtrado" : "Filtros"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-2xl glass-card border-0 shadow-2xl p-4" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Mes de Emisión
            </h4>
            <input
              type="month"
              aria-label="Filtrar por mes de emisión"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs font-semibold outline-none"
            />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Estado de Pago
            </h4>
            <select
              aria-label="Filtrar por estado de pago"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs font-semibold outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Método de Pago
            </h4>
            <select
              aria-label="Filtrar por método de pago"
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs font-semibold outline-none"
            >
              <option value="all">Todos los métodos</option>
              <option value="Pago Móvil">Pago Móvil</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Binance">Binance (USDT)</option>
              <option value="Divisas">Divisas ($ / €)</option>
              <option value="Efectivo">Efectivo (Bs.)</option>
              <option value="Cashea">Cashea</option>
            </select>
          </div>
          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="w-full rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SalesTable({
  paginated,
  rate,
  rates,
  activeType,
  onEdit,
  onConfirm,
  onDelete,
}: {
  paginated: Invoice[];
  rate: number;
  rates: ExchangeRates;
  activeType: RateType;
  onEdit: (invoice: Invoice) => void;
  onConfirm: (invoice: Invoice) => void;
  onDelete: (id: number) => void;
}) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyBsAmount = (invoice: Invoice) => {
    const bsValue = (invoice.total_general * rate).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    navigator.clipboard.writeText(bsValue);
    setCopiedId(invoice.id_factura);
    toast.success(`Monto copiado (${RATE_LABELS[activeType].short}): Bs. ${bsValue}`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="flex-1 overflow-x-auto border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
      <table className="w-full text-left border-collapse min-w-[820px]">
        <thead>
          <tr className="bg-muted/70 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
            <th className="p-4 w-12 rounded-tl-xl">
              <input
                type="checkbox"
                aria-label="Seleccionar todas las facturas"
                className="rounded border-gray-300"
              />
            </th>
            <th className="p-4">Factura N°</th>
            <th className="p-4">Paciente</th>
            <th className="p-4">Fecha de Emisión</th>
            <th className="p-4">
              Total ($ / € / Bs. {RATE_LABELS[activeType].short})
            </th>
            <th className="p-4">Estado y Método de Pago</th>
            <th className="p-4 rounded-tr-xl">Acciones</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {paginated.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-12 text-center text-muted-foreground font-medium">
                No se encontraron ventas.
              </td>
            </tr>
          ) : (
            paginated.map((f) => {
              const methodCat = f.metodo_pago
                ? inferCategoryFromMethod(f.metodo_pago, f.metodo_pago)
                : null;
              const MethodIcon = methodCat ? getCategoryIcon(methodCat) : null;

              return (
                <tr
                  key={f.id_factura}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar factura INV-${f.id_factura.toString().padStart(4, "0")}`}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="p-4 font-bold text-primary">
                    INV-{f.id_factura.toString().padStart(4, "0")}
                  </td>
                  <td className="p-4 font-semibold text-foreground">{f.paciente_nombre}</td>
                  <td className="p-4 text-muted-foreground text-xs font-medium">
                    {new Date(f.fecha_emision).toLocaleDateString(APP_LOCALE, {
                      timeZone: APP_TIME_ZONE,
                    })}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-foreground">
                            ${f.total_general.toFixed(2)}
                          </span>
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            · {formatEurFromUsd(f.total_general, rates)}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-primary block">
                          {formatBs(f.total_general, rate)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyBsAmount(f)}
                        title="Copiar monto en Bolívares"
                        aria-label="Copiar monto en Bolívares"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all cursor-pointer"
                      >
                        {copiedId === f.id_factura ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider w-fit",
                            (f.estado_pago || "").toLowerCase() === "pagado" ||
                              (f.estado_pago || "").toLowerCase() === "pagada"
                              ? "bg-green-50 text-green-600 border border-green-100 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                              : (f.estado_pago || "").toLowerCase() === "cancelado" ||
                                (f.estado_pago || "").toLowerCase() === "cancelada"
                              ? "bg-red-50 text-red-600 border border-red-100 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30"
                              : "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                          )}
                        >
                          {f.estado_pago}
                        </span>

                        {f.metodo_pago && methodCat && MethodIcon && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                              getCategoryBadgeStyle(methodCat)
                            )}
                          >
                            <MethodIcon className="h-3 w-3 shrink-0" />
                            {f.metodo_pago}
                          </span>
                        )}
                      </div>

                      {f.referencia && (
                        <span
                          className="text-[10px] text-muted-foreground font-medium truncate max-w-[230px]"
                          title={f.referencia}
                        >
                          Ref: {f.referencia}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => generateIndividualInvoice(f, rate)}
                        className="hover:text-primary cursor-pointer transition-colors"
                        title="Descargar Comprobante PDF (USD / Bs.)"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {(f.estado_pago || "").toLowerCase() !== "pagado" &&
                        (f.estado_pago || "").toLowerCase() !== "pagada" && (
                          <button
                            type="button"
                            onClick={() => onConfirm(f)}
                            className="flex items-center gap-1 text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            title="Confirmar Pago"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Cobrar
                          </button>
                        )}
                      <button
                        type="button"
                        onClick={() => onEdit(f)}
                        className="hover:text-foreground cursor-pointer"
                        title="Editar Factura"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Eliminar factura INV-${f.id_factura.toString().padStart(4, "0")}`}
                        className="hover:text-destructive cursor-pointer"
                        onClick={() => {
                          if (
                            window.confirm(
                              `¿Estás segura de que deseas eliminar la factura INV-${f.id_factura
                                .toString()
                                .padStart(4, "0")}?`
                            )
                          ) {
                            onDelete(f.id_factura);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function EditInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  rate,
  rates,
  isPending,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  rate: number;
  rates: ExchangeRates;
  isPending: boolean;
  onSave: (data: {
    id: number;
    total_general: number;
    estado_pago: string;
    fecha_emision: string;
  }) => void;
}) {
  const [editTotal, setEditTotal] = useState("");
  const [editStatus, setEditStatus] = useState("pendiente");
  const [editDate, setEditDate] = useState("");

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && invoice) {
      setEditTotal(String(invoice.total_general ?? 0));
      const st = (invoice.estado_pago || "").toLowerCase();
      setEditStatus(
        ["pagado", "pagada", "paid"].includes(st)
          ? "pagado"
          : ["cancelado", "cancelada", "cancelled"].includes(st)
          ? "cancelado"
          : "pendiente"
      );
      setEditDate(
        invoice.fecha_emision
          ? invoice.fecha_emision.slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
    }
    onOpenChange(isOpen);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    const parsedTotal = parseFloat(editTotal);
    if (isNaN(parsedTotal) || parsedTotal < 0) {
      toast.error("Ingrese un monto válido");
      return;
    }
    onSave({
      id: invoice.id_factura,
      total_general: parsedTotal,
      estado_pago: editStatus,
      fecha_emision: editDate
        ? new Date(`${editDate}T12:00:00`).toISOString()
        : invoice.fecha_emision,
    });
  };

  const previewUsd = parseFloat(editTotal) || 0;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-6 border-0 shadow-2xl glass-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Editar Factura</DialogTitle>
          <DialogDescription>
            Modifica los datos de la factura INV-
            {invoice?.id_factura?.toString().padStart(4, "0")} ({invoice?.paciente_nombre}).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="edit-invoice-date">Fecha de Emisión</Label>
            <Input
              id="edit-invoice-date"
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="rounded-xl bg-background/50"
              required
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-invoice-total">Monto Total ($ USD)</Label>
              <span className="text-xs font-bold text-primary">
                ≈ {formatBs(previewUsd, rate)} · {formatEurFromUsd(previewUsd, rates)}
              </span>
            </div>
            <Input
              id="edit-invoice-total"
              type="number"
              step="0.01"
              min="0"
              value={editTotal}
              onChange={(e) => setEditTotal(e.target.value)}
              className="rounded-xl bg-background/50"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-invoice-status">Estado de Pago</Label>
            <Select value={editStatus} onValueChange={setEditStatus}>
              <SelectTrigger id="edit-invoice-status" className="rounded-xl bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl hover:bg-muted"
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-primary text-primary-foreground"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmPaymentDialog({
  open,
  onOpenChange,
  invoice,
  rates,
  defaultRateType,
  methods,
  paymentMethod,
  setPaymentMethod,
  paymentReference,
  setPaymentReference,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  rates: ExchangeRates;
  defaultRateType: RateType;
  methods: PaymentMethod[];
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  paymentReference: string;
  setPaymentReference: (val: string) => void;
  isPending: boolean;
  onConfirm: (
    finalReference?: string,
    usedRate?: number,
    usedRateType?: RateType,
    finalMethod?: string,
    creditedUsdAmount?: number
  ) => void;
}) {
  const [dialogRateType, setDialogRateType] = useState<RateType>(defaultRateType);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [usdCashReceived, setUsdCashReceived] = useState("");
  const [copiedBs, setCopiedBs] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);

  // Estados específicos para Cashea (Compra ahora y paga después)
  const [casheaInitialPct, setCasheaInitialPct] = useState<number>(50);
  const [casheaInitialMethod, setCasheaInitialMethod] = useState<string>("Pago Móvil");
  const [casheaOrderNumber, setCasheaOrderNumber] = useState<string>("");

  // Construimos la lista unificada de métodos de pago (activos de BD + los 6 oficiales de Venezuela)
  const availableMethods = useMemo<PaymentMethod[]>(() => {
    const activeDb = methods.filter((m) => m.status === "Active");
    const existingCats = new Set(
      activeDb.map((m) => inferCategoryFromMethod(m.name, m.category))
    );
    const fallbacks: PaymentMethod[] = VE_PAYMENT_PRESETS.filter(
      (p) => !existingCats.has(p.category)
    ).map((p) => ({
      id: `preset-${p.category}`,
      name: p.name,
      category: p.category,
      status: "Active" as const,
      details: p.details,
    }));
    return [...activeDb, ...fallbacks];
  }, [methods]);

  const selectedMethodObj = useMemo(() => {
    return (
      availableMethods.find((m) => m.name === paymentMethod) ||
      availableMethods.find((m) => m.category === paymentMethod) ||
      availableMethods[0]
    );
  }, [availableMethods, paymentMethod]);

  const selectedCategory = selectedMethodObj
    ? inferCategoryFromMethod(selectedMethodObj.name, selectedMethodObj.category)
    : "Pago Móvil";

  const selectedDetails =
    selectedMethodObj?.details ||
    getDefaultDetailsForCategory(selectedCategory, selectedMethodObj?.name || "");

  const activeRate = rates[dialogRateType] || rates.bcv;
  const totalUsd = Number(invoice?.total_general) || 0;
  const totalBs = totalUsd * activeRate;

  // Cálculos de Pago Mixto
  const usdPart = Math.min(Math.max(parseFloat(usdCashReceived) || 0, 0), totalUsd);
  const remainingUsd = Math.max(totalUsd - usdPart, 0);
  const remainingBs = remainingUsd * activeRate;

  // Cálculos de Cashea
  const casheaInitialUsd = Number(((totalUsd * casheaInitialPct) / 100).toFixed(2));
  const casheaInitialBs = casheaInitialUsd * activeRate;
  const casheaFinancedUsd = Math.max(Number((totalUsd - casheaInitialUsd).toFixed(2)), 0);
  const casheaInstallmentUsd = Number((casheaFinancedUsd / 3).toFixed(2));

  const handleSelectMethod = (m: PaymentMethod) => {
    setPaymentMethod(m.name);
    const cat = inferCategoryFromMethod(m.name, m.category);
    const det = m.details || getDefaultDetailsForCategory(cat, m.name);
    if (det.defaultRateType) {
      setDialogRateType(det.defaultRateType);
    } else if (cat === "Binance") {
      setDialogRateType("usdt");
    } else {
      setDialogRateType("bcv");
    }
    if (cat === "Cashea" && det.casheaDefaultInitialPct) {
      setCasheaInitialPct(det.casheaDefaultInitialPct);
    }
  };

  const handleCopyBs = (amountToCopy: number) => {
    const formatted = amountToCopy.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    navigator.clipboard.writeText(formatted);
    setCopiedBs(true);
    toast.success(`Copiado al portapapeles: Bs. ${formatted}`);
    setTimeout(() => setCopiedBs(false), 1800);
  };

  const handleCopyClinicPaymentData = () => {
    if (!selectedMethodObj) return;
    const amountForCopy = selectedCategory === "Cashea" ? casheaInitialUsd : totalUsd;
    const text = formatPaymentMethodCopyText(selectedMethodObj, amountForCopy, activeRate);
    navigator.clipboard.writeText(text);
    setCopiedDetails(true);
    toast.success("Datos de cobro y monto copiados para el paciente");
    setTimeout(() => setCopiedDetails(false), 1800);
  };

  const handleSubmitConfirm = () => {
    const chosenMethodName =
      paymentMethod || selectedMethodObj?.name || "Pago Móvil";

    if (
      selectedDetails.requiresReference &&
      selectedCategory !== "Efectivo" &&
      selectedCategory !== "Divisas" &&
      !paymentReference.trim() &&
      !casheaOrderNumber.trim()
    ) {
      toast.error(
        `Por favor ingresa el número de referencia u orden para ${chosenMethodName}`
      );
      return;
    }

    let composedRef = paymentReference.trim();
    let finalMethodLabel = chosenMethodName;
    const rateNote = `Tasa ${RATE_LABELS[dialogRateType].short}: ${activeRate.toFixed(2)} Bs`;

    if (selectedCategory === "Cashea") {
      finalMethodLabel = `Cashea (Inicial ${casheaInitialPct}% · ${casheaInitialMethod})`;
      const casheaBreakdown = [
        casheaOrderNumber.trim() ? `Orden #${casheaOrderNumber.trim()}` : null,
        `Inicial ${casheaInitialPct}%: $${casheaInitialUsd.toFixed(2)} (${formatBs(
          casheaInitialUsd,
          activeRate
        )} vía ${casheaInitialMethod})`,
        `Financiado: $${casheaFinancedUsd.toFixed(2)} (3 cuotas de $${casheaInstallmentUsd.toFixed(
          2
        )})`,
        composedRef ? `Ref Inicial: ${composedRef}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
      composedRef = casheaBreakdown;
    } else if (isSplitPayment && usdPart > 0) {
      const splitSummary = `Mixto: $${usdPart.toFixed(2)} + ${formatBs(
        remainingUsd,
        activeRate
      )} (${rateNote})`;
      composedRef = composedRef ? `${composedRef} | ${splitSummary}` : splitSummary;
    } else if (dialogRateType !== "bcv") {
      composedRef = composedRef ? `${composedRef} | ${rateNote}` : rateNote;
    }

    onConfirm(composedRef, activeRate, dialogRateType, finalMethodLabel, totalUsd);
  };

  const hasReceiverDetails = Boolean(
    selectedDetails.bank ||
      selectedDetails.phone ||
      selectedDetails.accountNumber ||
      selectedDetails.binanceId ||
      selectedDetails.documentId
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (val) {
          const initialMethod = availableMethods[0];
          if (!paymentMethod && initialMethod) {
            handleSelectMethod(initialMethod);
          } else {
            setDialogRateType(defaultRateType);
          }
        } else {
          setIsSplitPayment(false);
          setUsdCashReceived("");
          setCasheaOrderNumber("");
        }
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-[540px] max-h-[92vh] overflow-y-auto rounded-[2rem] p-5 sm:p-6 border-0 shadow-2xl glass-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Confirmar Cobro (Venezuela)
          </DialogTitle>
          <DialogDescription>
            Factura INV-{invoice?.id_factura?.toString().padStart(4, "0")} ·{" "}
            <span className="font-semibold text-foreground">{invoice?.paciente_nombre}</span>
          </DialogDescription>
        </DialogHeader>

        {/* SELECTOR DE TASA EN EL DIÁLOGO DE COBRO */}
        <div className="flex items-center justify-between gap-2 bg-muted/50 p-1.5 rounded-2xl border border-border/60">
          {(["bcv", "eur", "usdt"] as RateType[]).map((t) => {
            const selected = dialogRateType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setDialogRateType(t)}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center",
                  selected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {RATE_LABELS[t].short} · Bs. {rates[t].toFixed(2)}
              </button>
            );
          })}
        </div>

        {/* RESUMEN MULTIMONEDA USD ↔ EUR ↔ USDT ↔ BS */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Factura
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  ${totalUsd.toFixed(2)}{" "}
                  <span className="text-xs font-bold text-muted-foreground">USD</span>
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  · {formatEurFromUsd(totalUsd, rates)} EUR
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                Equivalente ({RATE_LABELS[dialogRateType].short})
              </span>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className="text-lg font-extrabold text-primary">
                  {formatBs(totalUsd, activeRate)}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyBs(totalBs)}
                  className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                  title="Copiar monto en Bolívares"
                >
                  {copiedBs ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-primary/10 pt-1.5">
            <span>BCV ($): {formatBs(totalUsd, rates.bcv)}</span>
            <span>EUR (€): {formatBs(totalUsd, rates.eur)}</span>
            <span>USDT: {totalUsd.toFixed(2)} USDT</span>
          </div>
        </div>

        <div className="space-y-3.5 py-1">
          {/* SELECTOR VISUAL DE MÉTODOS DE PAGO DE VENEZUELA */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Selecciona Método de Pago
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableMethods.map((m) => {
                const cat = inferCategoryFromMethod(m.name, m.category);
                const Icon = getCategoryIcon(cat);
                const isSelected =
                  (paymentMethod || selectedMethodObj?.name) === m.name;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMethod(m)}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground shadow-xs ring-1 ring-primary/30"
                        : "border-border/70 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <div
                      className={cn(
                        "h-7 w-7 rounded-lg border flex items-center justify-center shrink-0",
                        getCategoryBadgeStyle(cat)
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {m.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {cat === "Cashea"
                          ? "Inicial + 3 cuotas"
                          : cat === "Binance"
                          ? "USDT · Binance Pay"
                          : cat === "Divisas"
                          ? "Efectivo $ / €"
                          : "Bolívares (BCV)"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BARRA DE DATOS RECEPTORES DE LA CLÍNICA PARA COPIAR AL PACIENTE */}
          {hasReceiverDetails && (
            <div className="rounded-xl border border-border/80 bg-muted/30 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
              <div className="truncate space-y-0.5">
                <p className="font-bold text-foreground truncate">
                  Datos de Cobro ({selectedMethodObj?.name}):
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {[
                    selectedDetails.bank,
                    selectedDetails.phone ? `Tel: ${selectedDetails.phone}` : null,
                    selectedDetails.accountNumber
                      ? `Cta: ${selectedDetails.accountNumber}`
                      : null,
                    selectedDetails.binanceId
                      ? `Binance: ${selectedDetails.binanceId}`
                      : null,
                    selectedDetails.documentId,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyClinicPaymentData}
                className="rounded-xl h-8 px-2.5 text-[11px] font-bold gap-1 shrink-0 cursor-pointer"
              >
                {copiedDetails ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copiar Datos
              </Button>
            </div>
          )}

          {/* MODO ESPECIAL: CALCULADORA PROFESIONAL CASHEA */}
          {selectedCategory === "Cashea" ? (
            <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-3.5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-wider">
                  Plan Cashea — Inicial en Clínica + 3 Cuotas
                </span>
                <span className="text-[10px] font-bold bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 px-2 py-0.5 rounded-full">
                  Sin Interés
                </span>
              </div>

              {/* Selector de Nivel / % de Inicial */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { pct: 60, label: "Nivel 1 (60%)" },
                  { pct: 50, label: "Nivel 2 (50%)" },
                  { pct: 40, label: "Nivel 3+ (40%)" },
                ].map((lvl) => (
                  <button
                    key={lvl.pct}
                    type="button"
                    onClick={() => setCasheaInitialPct(lvl.pct)}
                    className={cn(
                      "py-1.5 px-2 rounded-xl border text-xs font-bold transition cursor-pointer",
                      casheaInitialPct === lvl.pct
                        ? "border-fuchsia-500 bg-fuchsia-500 text-white shadow-2xs"
                        : "border-border bg-background/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>

              {/* Desglose Inicial Hoy vs Cuotas */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-background/90 border border-border/70 p-2.5">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Inicial a Cobrar Hoy ({casheaInitialPct}%)
                  </span>
                  <p className="text-base font-black text-foreground mt-0.5">
                    ${casheaInitialUsd.toFixed(2)} USD
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] font-extrabold text-primary">
                      {formatBs(casheaInitialUsd, activeRate)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyBs(casheaInitialBs)}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Copiar Bs
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-background/90 border border-border/70 p-2.5">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Financiado Cashea ({100 - casheaInitialPct}%)
                  </span>
                  <p className="text-base font-black text-foreground mt-0.5">
                    ${casheaFinancedUsd.toFixed(2)} USD
                  </p>
                  <span className="text-[11px] font-semibold text-muted-foreground block mt-0.5">
                    3 cuotas de ${casheaInstallmentUsd.toFixed(2)} c/14 días
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">
                    ¿Cómo pagó la Inicial hoy?
                  </Label>
                  <select
                    aria-label="Método de pago de la inicial Cashea"
                    value={casheaInitialMethod}
                    onChange={(e) => setCasheaInitialMethod(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-background border border-border text-xs font-semibold outline-none"
                  >
                    <option value="Pago Móvil">Pago Móvil (Bs. BCV)</option>
                    <option value="Divisas ($)">Divisas (Efectivo $)</option>
                    <option value="Transferencia">Transferencia (Bs.)</option>
                    <option value="Binance (USDT)">Binance (USDT)</option>
                    <option value="Efectivo (Bs.)">Efectivo (Bs.)</option>
                    <option value="Punto de Venta">Punto de Venta</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">
                    N° Orden Cashea *
                  </Label>
                  <Input
                    placeholder="Ej. Orden #CSH-94821"
                    value={casheaOrderNumber}
                    onChange={(e) => setCasheaOrderNumber(e.target.value)}
                    className="rounded-xl h-9 text-xs bg-background"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* CALCULADORA DE PAGO MIXTO (USD + BOLÍVARES) */
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="split-payment-toggle"
                  className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
                  ¿Pago Mixto (Parte en Divisas + Resto en Bs.)?
                </label>
                <input
                  id="split-payment-toggle"
                  type="checkbox"
                  checked={isSplitPayment}
                  onChange={(e) => setIsSplitPayment(e.target.checked)}
                  className="rounded border-border h-4 w-4 accent-primary cursor-pointer"
                />
              </div>

              {isSplitPayment && (
                <div className="grid grid-cols-2 gap-3 pt-1 animate-fade-in">
                  <div>
                    <Label htmlFor="usd-received" className="text-[11px] text-muted-foreground">
                      Recibido en Divisas ($ / USDT)
                    </Label>
                    <Input
                      id="usd-received"
                      type="number"
                      step="0.01"
                      min="0"
                      max={totalUsd}
                      placeholder="Ej. 20"
                      value={usdCashReceived}
                      onChange={(e) => setUsdCashReceived(e.target.value)}
                      className="rounded-xl h-9 text-xs font-bold mt-1 bg-background"
                    />
                  </div>
                  <div className="bg-background/80 border border-border/60 rounded-xl p-2 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      Restante en Bs. (${remainingUsd.toFixed(2)})
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs font-extrabold text-primary">
                        {formatBs(remainingUsd, activeRate)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyBs(remainingBs)}
                        className="text-primary hover:underline text-[10px] font-bold cursor-pointer"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CAMPO DE REFERENCIA CONTEXTUAL SEGÚN MÉTODO DE PAGO */}
          <div className="grid gap-1.5">
            <Label htmlFor="referencia" className="text-xs font-bold">
              {selectedCategory === "Pago Móvil"
                ? "N° de Referencia Pago Móvil (Últimos 4 a 6 dígitos) *"
                : selectedCategory === "Transferencia"
                ? "N° de Referencia de Transferencia Bancaria *"
                : selectedCategory === "Binance"
                ? "Order ID de Binance Pay / Comprobante USDT *"
                : selectedCategory === "Cashea"
                ? "Referencia del Pago de la Inicial (Opcional si fue Efectivo/Divisas)"
                : selectedCategory === "Divisas"
                ? "Seriales de Billetes / Denominación / Vuelto (Opcional)"
                : "Nota de Caja / Referencia (Opcional)"}
            </Label>
            <Input
              id="referencia"
              placeholder={
                selectedCategory === "Pago Móvil"
                  ? "Ej. 849201 (últimos dígitos de la operación)"
                  : selectedCategory === "Transferencia"
                  ? "Ej. Ref. 0092837412 Banesco"
                  : selectedCategory === "Binance"
                  ? "Ej. Order ID 29384756102938 (USDT)"
                  : selectedCategory === "Divisas"
                  ? "Ej. 2 billetes de $20 (Seriales PK29381, JB10293) + 1 de $10"
                  : selectedCategory === "Cashea"
                  ? "Ej. Ref Pago Móvil de la inicial: 4921"
                  : "Ej. Recibido en caja principal sin vuelto"
              }
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="rounded-xl bg-background/50 text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl hover:bg-muted"
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitConfirm}
            className="rounded-xl bg-primary text-primary-foreground cursor-pointer"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Confirmar Cobro"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CashCloseDialog({
  open,
  onOpenChange,
  invoices,
  rate,
  rates,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  rate: number;
  rates: ExchangeRates;
}) {
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
        // Extraemos el % de inicial si está en el método o referencia (por defecto 50%)
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
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto rounded-[2rem] p-6 border border-border/60 shadow-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Arqueo y Cierre de Caja (Reporte Z)
          </DialogTitle>
          <DialogDescription>
            Conciliación de ingresos por método de pago en Venezuela (Bolívares, Divisas, Binance USDT y Cashea).
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between bg-muted/50 p-1.5 rounded-2xl border border-border/60">
          <button
            type="button"
            onClick={() => setScope("today")}
            className={cn(
              "flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer",
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
              "flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer",
              scope === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Todas las Cobradas ({invoices.filter((i) => ["pagado", "pagada", "paid"].includes((i.estado_pago || "").toLowerCase())).length})
          </button>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Total Consolidado ({paidInvoices.length} cobros)
            </span>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              ${totalUsd.toFixed(2)} <span className="text-xs font-bold">USD</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Equivalente BCV
            </span>
            <p className="text-base font-extrabold text-foreground">
              {formatBs(totalUsd, rate)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {breakdown.map((b) => (
            <div
              key={b.category}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/60 bg-muted/20 text-xs"
            >
              <div>
                <p className="font-bold text-foreground">{b.category}</p>
                <p className="text-[11px] text-muted-foreground">{b.count} operaciones</p>
              </div>
              <div className="text-right">
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
