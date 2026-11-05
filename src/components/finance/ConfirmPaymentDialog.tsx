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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Copy,
  Check,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatBs,
  formatEurFromUsd,
  RATE_LABELS,
  type RateType,
  type ExchangeRates,
} from "@/hooks/useExchangeRate";
import {
  VE_PAYMENT_PRESETS,
  inferCategoryFromMethod,
  getDefaultDetailsForCategory,
  formatPaymentMethodCopyText,
  type PaymentMethod,
  type PaymentMethodDetails,
} from "@/lib/api/paymentMethods";
import { getCategoryIcon, getCategoryBadgeStyle } from "./PaymentMethodsPage";
import { toast } from "sonner";
import type { Invoice } from "./ViewInvoiceDialog";

export interface ConfirmPaymentDialogProps {
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
}

function CasheaCalculatorSection({
  casheaInitialPct,
  setCasheaInitialPct,
  casheaInitialUsd,
  casheaInitialBs,
  casheaFinancedUsd,
  casheaInstallmentUsd,
  casheaInitialMethod,
  setCasheaInitialMethod,
  casheaOrderNumber,
  setCasheaOrderNumber,
  activeRate,
  onCopyBs,
}: {
  casheaInitialPct: number;
  setCasheaInitialPct: (v: number) => void;
  casheaInitialUsd: number;
  casheaInitialBs: number;
  casheaFinancedUsd: number;
  casheaInstallmentUsd: number;
  casheaInitialMethod: string;
  setCasheaInitialMethod: (v: string) => void;
  casheaOrderNumber: string;
  setCasheaOrderNumber: (v: string) => void;
  activeRate: number;
  onCopyBs: (amount: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-3 sm:p-3.5 space-y-3 animate-fade-in min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="text-[11px] sm:text-xs font-extrabold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-wider">
          Plan Cashea — Inicial + 3 Cuotas
        </span>
        <span className="text-[10px] font-bold bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 px-2 py-0.5 rounded-full">
          Sin Interés
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
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
              "py-1.5 px-1.5 sm:px-2 rounded-xl border text-[11px] sm:text-xs font-bold transition cursor-pointer truncate",
              casheaInitialPct === lvl.pct
                ? "border-fuchsia-500 bg-fuchsia-500 text-white shadow-2xs"
                : "border-border bg-background/80 text-muted-foreground hover:text-foreground"
            )}
          >
            {lvl.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="rounded-xl bg-background/90 border border-border/70 p-2.5 min-w-0">
          <span className="text-[10px] font-bold uppercase text-muted-foreground block">
            Inicial a Cobrar Hoy ({casheaInitialPct}%)
          </span>
          <p className="text-base font-black text-foreground mt-0.5">
            ${casheaInitialUsd.toFixed(2)} USD
          </p>
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <span className="text-[11px] font-extrabold text-primary truncate">
              {formatBs(casheaInitialUsd, activeRate)}
            </span>
            <button
              type="button"
              onClick={() => onCopyBs(casheaInitialBs)}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer shrink-0"
            >
              Copiar Bs
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-background/90 border border-border/70 p-2.5 min-w-0">
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
          <Label className="text-[11px] font-bold">¿Cómo pagó la Inicial hoy?</Label>
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
          <Label className="text-[11px] font-bold">N° Orden Cashea *</Label>
          <Input
            placeholder="Ej. Orden #CSH-94821"
            value={casheaOrderNumber}
            onChange={(e) => setCasheaOrderNumber(e.target.value)}
            className="rounded-xl h-9 text-xs bg-background"
          />
        </div>
      </div>
    </div>
  );
}

function SplitPaymentSection({
  isSplitPayment,
  setIsSplitPayment,
  usdCashReceived,
  setUsdCashReceived,
  totalUsd,
  remainingUsd,
  remainingBs,
  activeRate,
  onCopyBs,
}: {
  isSplitPayment: boolean;
  setIsSplitPayment: (v: boolean) => void;
  usdCashReceived: string;
  setUsdCashReceived: (v: string) => void;
  totalUsd: number;
  remainingUsd: number;
  remainingBs: number;
  activeRate: number;
  onCopyBs: (amount: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 sm:p-3.5 space-y-2.5 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="split-payment-toggle"
          className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer min-w-0"
        >
          <ArrowRightLeft className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">¿Pago Mixto (Divisas + Resto en Bs.)?</span>
        </label>
        <input
          id="split-payment-toggle"
          type="checkbox"
          checked={isSplitPayment}
          onChange={(e) => setIsSplitPayment(e.target.checked)}
          className="rounded border-border h-4 w-4 accent-primary cursor-pointer shrink-0"
        />
      </div>

      {isSplitPayment && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 animate-fade-in">
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
          <div className="bg-background/80 border border-border/60 rounded-xl p-2 flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">
              Restante en Bs. (${remainingUsd.toFixed(2)})
            </span>
            <div className="flex items-center justify-between gap-1 mt-0.5">
              <span className="text-xs font-extrabold text-primary truncate">
                {formatBs(remainingUsd, activeRate)}
              </span>
              <button
                type="button"
                onClick={() => onCopyBs(remainingBs)}
                className="text-primary hover:underline text-[10px] font-bold cursor-pointer shrink-0"
              >
                Copiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getReferencePlaceholder(category: string): string {
  switch (category) {
    case "Pago Móvil":
      return "Ej. 849201 (últimos dígitos de la operación)";
    case "Transferencia":
      return "Ej. Ref. 0092837412 Banesco";
    case "Binance":
      return "Ej. Order ID 29384756102938 (USDT)";
    case "Divisas":
      return "Ej. 2 billetes de $20 (Seriales PK29381, JB10293) + 1 de $10";
    case "Cashea":
      return "Ej. Ref Pago Móvil de la inicial: 4921";
    default:
      return "Ej. Recibido en caja principal sin vuelto";
  }
}

function composePaymentConfirmation({
  selectedCategory,
  chosenMethodName,
  paymentReference,
  casheaOrderNumber,
  casheaInitialPct,
  casheaInitialUsd,
  casheaInitialMethod,
  casheaFinancedUsd,
  casheaInstallmentUsd,
  isSplitPayment,
  usdPart,
  remainingUsd,
  dialogRateType,
  activeRate,
}: {
  selectedCategory: string;
  chosenMethodName: string;
  paymentReference: string;
  casheaOrderNumber: string;
  casheaInitialPct: number;
  casheaInitialUsd: number;
  casheaInitialMethod: string;
  casheaFinancedUsd: number;
  casheaInstallmentUsd: number;
  isSplitPayment: boolean;
  usdPart: number;
  remainingUsd: number;
  dialogRateType: RateType;
  activeRate: number;
}) {
  let composedRef = paymentReference.trim();
  let finalMethodLabel = chosenMethodName;
  const rateNote = `Tasa ${RATE_LABELS[dialogRateType].short}: ${activeRate.toFixed(2)} Bs`;

  if (selectedCategory === "Cashea") {
    finalMethodLabel = `Cashea (Inicial ${casheaInitialPct}% · ${casheaInitialMethod})`;
    composedRef = [
      casheaOrderNumber.trim() ? `Orden #${casheaOrderNumber.trim()}` : null,
      `Inicial ${casheaInitialPct}%: $${casheaInitialUsd.toFixed(2)} (${formatBs(
        casheaInitialUsd,
        activeRate
      )} vía ${casheaInitialMethod})`,
      `Financiado: $${casheaFinancedUsd.toFixed(2)} (3 cuotas de $${casheaInstallmentUsd.toFixed(2)})`,
      composedRef ? `Ref Inicial: ${composedRef}` : null,
    ]
      .filter(Boolean)
      .join(" | ");
  } else if (isSplitPayment && usdPart > 0) {
    const splitSummary = `Mixto: $${usdPart.toFixed(2)} + ${formatBs(remainingUsd, activeRate)} (${rateNote})`;
    composedRef = composedRef ? `${composedRef} | ${splitSummary}` : splitSummary;
  } else if (dialogRateType !== "bcv") {
    composedRef = composedRef ? `${composedRef} | ${rateNote}` : rateNote;
  }

  return { composedRef, finalMethodLabel };
}

function ConfirmPaymentRateSelector({
  dialogRateType,
  setDialogRateType,
  rates,
}: {
  dialogRateType: RateType;
  setDialogRateType: (t: RateType) => void;
  rates: ExchangeRates;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5 bg-muted/50 p-1 sm:p-1.5 rounded-2xl border border-border/60 min-w-0">
      {(["bcv", "eur", "usdt"] as RateType[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setDialogRateType(t)}
          className={cn(
            "flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center min-w-0 leading-tight",
            dialogRateType === t
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="truncate">{RATE_LABELS[t].short}</span>
          <span className="hidden sm:inline">·</span>
          <span className="text-[10px] sm:text-xs opacity-90 truncate">
            Bs. {rates[t].toFixed(2)}
          </span>
        </button>
      ))}
    </div>
  );
}

function ConfirmPaymentSummaryCard({
  totalUsd,
  rates,
  dialogRateType,
  activeRate,
  totalBs,
  copiedBs,
  onCopyBs,
}: {
  totalUsd: number;
  rates: ExchangeRates;
  dialogRateType: RateType;
  activeRate: number;
  totalBs: number;
  copiedBs: boolean;
  onCopyBs: (amount: number) => void;
}) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 sm:p-3.5 space-y-2 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 min-w-0">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Total Factura
          </span>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-xl sm:text-2xl font-black text-foreground">
              ${totalUsd.toFixed(2)}{" "}
              <span className="text-xs font-bold text-muted-foreground">USD</span>
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              · {formatEurFromUsd(totalUsd, rates)} EUR
            </span>
          </div>
        </div>
        <div className="sm:text-right border-t sm:border-t-0 border-primary/10 pt-1.5 sm:pt-0 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
            Equivalente ({RATE_LABELS[dialogRateType].short})
          </span>
          <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
            <span className="text-base sm:text-lg font-extrabold text-primary truncate">
              {formatBs(totalUsd, activeRate)}
            </span>
            <button
              type="button"
              onClick={() => onCopyBs(totalBs)}
              className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer shrink-0"
              title="Copiar monto en Bolívares"
            >
              {copiedBs ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[10px] sm:text-[11px] text-muted-foreground border-t border-primary/10 pt-1.5">
        <span>BCV ($): {formatBs(totalUsd, rates.bcv)}</span>
        <span>EUR (€): {formatBs(totalUsd, rates.eur)}</span>
        <span>USDT: {totalUsd.toFixed(2)} USDT</span>
      </div>
    </div>
  );
}

function ConfirmPaymentMethodSelector({
  methods,
  selectedMethodName,
  onSelectMethod,
}: {
  methods: PaymentMethod[];
  selectedMethodName: string;
  onSelectMethod: (m: PaymentMethod) => void;
}) {
  return (
    <div className="space-y-1.5 min-w-0">
      <Label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Selecciona Método de Pago
      </Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
        {methods.map((m) => {
          const cat = inferCategoryFromMethod(m.name, m.category);
          const Icon = getCategoryIcon(cat);
          const isSelected = selectedMethodName === m.name;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMethod(m)}
              className={cn(
                "flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border text-left transition-colors cursor-pointer min-w-0 overflow-hidden",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground shadow-xs ring-1 ring-primary/30"
                  : "border-border/70 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <div
                className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7 rounded-lg border flex items-center justify-center shrink-0",
                  getCategoryBadgeStyle(cat)
                )}
              >
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs font-bold text-foreground truncate">
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
  );
}

function ConfirmPaymentReceiverCard({
  methodName,
  details,
  copiedDetails,
  onCopy,
}: {
  methodName: string;
  details: PaymentMethodDetails;
  copiedDetails: boolean;
  onCopy: () => void;
}) {
  const lineDetails = [
    details.bank,
    details.phone ? `Tel: ${details.phone}` : null,
    details.accountNumber ? `Cta: ${details.accountNumber}` : null,
    details.binanceId ? `Binance: ${details.binanceId}` : null,
    details.documentId,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-xl border border-border/80 bg-muted/30 px-3 py-2 flex items-center justify-between gap-2 text-xs min-w-0">
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-bold text-foreground truncate">
          Datos de Cobro ({methodName}):
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {lineDetails}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCopy}
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
  );
}

function useConfirmPaymentDialogState({
  invoice,
  rates,
  defaultRateType,
  methods,
  paymentMethod,
  setPaymentMethod,
  paymentReference,
  onConfirm,
  onOpenChange,
}: ConfirmPaymentDialogProps) {
  const [dialogRateType, setDialogRateType] = useState<RateType>(defaultRateType);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [usdCashReceived, setUsdCashReceived] = useState("");
  const [copiedBs, setCopiedBs] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);

  const [casheaInitialPct, setCasheaInitialPct] = useState<number>(50);
  const [casheaInitialMethod, setCasheaInitialMethod] = useState<string>("Pago Móvil");
  const [casheaOrderNumber, setCasheaOrderNumber] = useState<string>("");

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

  const usdPart = Math.min(Math.max(parseFloat(usdCashReceived) || 0, 0), totalUsd);
  const remainingUsd = Math.max(totalUsd - usdPart, 0);
  const remainingBs = remainingUsd * activeRate;

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
    const chosenMethodName = paymentMethod || selectedMethodObj?.name || "Pago Móvil";

    if (
      selectedDetails.requiresReference &&
      selectedCategory !== "Efectivo" &&
      selectedCategory !== "Divisas" &&
      !paymentReference.trim() &&
      !casheaOrderNumber.trim()
    ) {
      toast.error(`Por favor ingresa el número de referencia u orden para ${chosenMethodName}`);
      return;
    }

    const { composedRef, finalMethodLabel } = composePaymentConfirmation({
      selectedCategory,
      chosenMethodName,
      paymentReference,
      casheaOrderNumber,
      casheaInitialPct,
      casheaInitialUsd,
      casheaInitialMethod,
      casheaFinancedUsd,
      casheaInstallmentUsd,
      isSplitPayment,
      usdPart,
      remainingUsd,
      dialogRateType,
      activeRate,
    });

    onConfirm(composedRef, activeRate, dialogRateType, finalMethodLabel, totalUsd);
  };

  const handleOpenChange = (val: boolean) => {
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
  };

  const hasReceiverDetails = Boolean(
    selectedDetails.bank ||
      selectedDetails.phone ||
      selectedDetails.accountNumber ||
      selectedDetails.binanceId ||
      selectedDetails.documentId
  );

  return {
    dialogRateType,
    setDialogRateType,
    isSplitPayment,
    setIsSplitPayment,
    usdCashReceived,
    setUsdCashReceived,
    copiedBs,
    copiedDetails,
    casheaInitialPct,
    setCasheaInitialPct,
    casheaInitialMethod,
    setCasheaInitialMethod,
    casheaOrderNumber,
    setCasheaOrderNumber,
    availableMethods,
    selectedMethodObj,
    selectedCategory,
    selectedDetails,
    activeRate,
    totalUsd,
    totalBs,
    remainingUsd,
    remainingBs,
    casheaInitialUsd,
    casheaInitialBs,
    casheaFinancedUsd,
    casheaInstallmentUsd,
    hasReceiverDetails,
    handleSelectMethod,
    handleCopyBs,
    handleCopyClinicPaymentData,
    handleSubmitConfirm,
    handleOpenChange,
  };
}

export function ConfirmPaymentDialog(props: ConfirmPaymentDialogProps) {
  const {
    open,
    invoice,
    rates,
    paymentMethod,
    paymentReference,
    setPaymentReference,
    isPending,
  } = props;

  const s = useConfirmPaymentDialogState(props);

  return (
    <Dialog open={open} onOpenChange={s.handleOpenChange}>
      <DialogContent className="w-[calc(100vw-1.25rem)] sm:max-w-[540px] max-h-[calc(100dvh-1.5rem)] sm:max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-6 border border-border/60 shadow-2xl glass-card gap-3 sm:gap-4">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-xl font-bold">
            Confirmar Cobro (Venezuela)
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm truncate">
            Factura INV-{invoice?.id_factura?.toString().padStart(4, "0")} ·{" "}
            <span className="font-semibold text-foreground">{invoice?.paciente_nombre}</span>
          </DialogDescription>
        </DialogHeader>

        <ConfirmPaymentRateSelector
          dialogRateType={s.dialogRateType}
          setDialogRateType={s.setDialogRateType}
          rates={rates}
        />

        <ConfirmPaymentSummaryCard
          totalUsd={s.totalUsd}
          rates={rates}
          dialogRateType={s.dialogRateType}
          activeRate={s.activeRate}
          totalBs={s.totalBs}
          copiedBs={s.copiedBs}
          onCopyBs={s.handleCopyBs}
        />

        <div className="space-y-3 py-0.5 min-w-0">
          <ConfirmPaymentMethodSelector
            methods={s.availableMethods}
            selectedMethodName={paymentMethod || s.selectedMethodObj?.name || ""}
            onSelectMethod={s.handleSelectMethod}
          />

          {s.hasReceiverDetails && (
            <ConfirmPaymentReceiverCard
              methodName={s.selectedMethodObj?.name || ""}
              details={s.selectedDetails}
              copiedDetails={s.copiedDetails}
              onCopy={s.handleCopyClinicPaymentData}
            />
          )}

          {s.selectedCategory === "Cashea" ? (
            <CasheaCalculatorSection
              casheaInitialPct={s.casheaInitialPct}
              setCasheaInitialPct={s.setCasheaInitialPct}
              casheaInitialUsd={s.casheaInitialUsd}
              casheaInitialBs={s.casheaInitialBs}
              casheaFinancedUsd={s.casheaFinancedUsd}
              casheaInstallmentUsd={s.casheaInstallmentUsd}
              casheaInitialMethod={s.casheaInitialMethod}
              setCasheaInitialMethod={s.setCasheaInitialMethod}
              casheaOrderNumber={s.casheaOrderNumber}
              setCasheaOrderNumber={s.setCasheaOrderNumber}
              activeRate={s.activeRate}
              onCopyBs={s.handleCopyBs}
            />
          ) : (
            <SplitPaymentSection
              isSplitPayment={s.isSplitPayment}
              setIsSplitPayment={s.setIsSplitPayment}
              usdCashReceived={s.usdCashReceived}
              setUsdCashReceived={s.setUsdCashReceived}
              totalUsd={s.totalUsd}
              remainingUsd={s.remainingUsd}
              remainingBs={s.remainingBs}
              activeRate={s.activeRate}
              onCopyBs={s.handleCopyBs}
            />
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="referencia" className="text-xs font-bold">
              Referencia / Comprobante de Cobro
            </Label>
            <Input
              id="referencia"
              placeholder={getReferencePlaceholder(s.selectedCategory)}
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="rounded-xl bg-background/50 text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => props.onOpenChange(false)}
            className="rounded-xl hover:bg-muted"
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={s.handleSubmitConfirm}
            className="rounded-xl bg-primary text-primary-foreground cursor-pointer"
            disabled={isPending}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Cobro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmPaymentDialog;
