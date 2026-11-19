import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Copy,
  Check,
  Loader2,
  ArrowRightLeft,
  ArrowLeft,
  UserRound,
  Receipt,
  FileText,
  X,
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
  ) => Promise<void> | void;
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
    <div className="space-y-2 min-w-0">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Selecciona Método de Pago
      </Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                "flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer min-w-0",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground shadow-sm ring-2 ring-primary/25"
                  : "border-border/70 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <div
                className={cn(
                  "h-9 w-9 rounded-xl border flex items-center justify-center shrink-0",
                  getCategoryBadgeStyle(cat)
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground leading-snug break-words">
                  {m.name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmedMethodLabel, setConfirmedMethodLabel] = useState("");
  const [confirmedReference, setConfirmedReference] = useState("");

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

  const handleSubmitConfirm = async () => {
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

    try {
      await onConfirm(composedRef, activeRate, dialogRateType, finalMethodLabel, totalUsd);
      setConfirmedMethodLabel(finalMethodLabel);
      setConfirmedReference(composedRef);
      setShowSuccess(true);
    } catch {
      // El toast de error ya lo maneja la mutación
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (val) {
      setShowSuccess(false);
      const initialMethod = availableMethods[0];
      if (!paymentMethod && initialMethod) {
        handleSelectMethod(initialMethod);
      } else {
        setDialogRateType(defaultRateType);
      }
    } else {
      setShowSuccess(false);
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
    showSuccess,
    confirmedMethodLabel,
    confirmedReference,
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

  useEffect(() => {
    if (open) {
      const initialMethod = s.availableMethods[0];
      if (!paymentMethod && initialMethod) {
        s.handleSelectMethod(initialMethod);
      }
    }
  }, [open]);

  if (!open || !invoice) return null;

  const invCode = `INV-${invoice.id_factura?.toString().padStart(4, "0")}`;

  return (
    <>
      {/* Backdrop en Escritorio (md+) para el panel deslizable derecho */}
      <div
        onClick={() => {
          if (!isPending) s.handleOpenChange(false);
        }}
        className="hidden md:block fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200"
      />

      {/* Contenedor Híbrido:
          - En Móvil (< md): Vista de Página Completa nativa dentro del flujo (sin modal flotante).
          - En Escritorio (md+): Panel Lateral Derecho (Slide-over Drawer) con scroll vertical propio. */}
      <div
        role="dialog"
        aria-label="Confirmar Cobro"
        className={cn(
          "bg-card text-foreground w-full min-w-0 flex flex-col",
          // Móvil: página completa en flujo
          "border border-border rounded-3xl p-4 shadow-xs min-h-[calc(100vh-8rem)] animate-in fade-in duration-200",
          // Escritorio: drawer fijo a la derecha con scroll interno
          "md:fixed md:inset-y-0 md:right-0 md:z-50 md:w-[520px] lg:w-[560px] md:min-h-0 md:h-dvh md:rounded-none md:rounded-l-3xl md:border-y-0 md:border-r-0 md:border-l md:border-border/80 md:p-0 md:shadow-2xl md:animate-in md:slide-in-from-right md:duration-250",
        )}
      >
        {/* Cabecera Fija Superior */}
        <header className="pb-4 mb-4 md:mb-0 md:px-6 md:py-4 border-b border-border/60 shrink-0 bg-card/95 backdrop-blur-md md:rounded-tl-3xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Botón Volver en Móvil */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => s.handleOpenChange(false)}
                disabled={isPending}
                className="md:hidden h-8 px-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1 shrink-0 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver</span>
              </Button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                    Confirmar Cobro (Venezuela)
                  </h2>
                  <span className="text-[10px] font-mono font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20 shrink-0">
                    {invCode}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1.5">
                  <UserRound className="h-3 w-3 text-primary shrink-0" />
                  <span className="font-semibold text-foreground">{invoice.paciente_nombre}</span>
                  {invoice.concepto && (
                    <>
                      <span>·</span>
                      <span className="truncate">{invoice.concepto}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Botón Cerrar (X) en Escritorio */}
            <button
              type="button"
              onClick={() => s.handleOpenChange(false)}
              disabled={isPending}
              aria-label="Cerrar panel de cobro"
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Cuerpo con Scroll Vertical en Escritorio y Flujo Nativo en Móvil */}
        {s.showSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <style>{`
              @keyframes medizen-circle-draw {
                0% { stroke-dashoffset: 264; transform: scale(0.88); opacity: 0; }
                50% { opacity: 1; transform: scale(1.04); }
                100% { stroke-dashoffset: 0; transform: scale(1); opacity: 1; }
              }
              @keyframes medizen-check-draw {
                0% { stroke-dashoffset: 80; }
                100% { stroke-dashoffset: 0; }
              }
              .medizen-success-circle {
                stroke-dasharray: 264;
                stroke-dashoffset: 264;
                transform-origin: center;
                animation: medizen-circle-draw 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
              }
              .medizen-success-check {
                stroke-dasharray: 80;
                stroke-dashoffset: 80;
                animation: medizen-check-draw 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.35s forwards;
              }
            `}</style>

            {/* Anillo y Checkmark Animado */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="absolute h-28 w-28 rounded-full bg-emerald-500/15 animate-ping [animation-duration:1.6s]" />
              <div className="absolute h-24 w-24 rounded-full bg-emerald-500/10" />
              <svg
                className="h-24 w-24 text-emerald-500 relative z-10"
                viewBox="0 0 96 96"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="medizen-success-circle"
                />
                <path
                  d="M30 49.5L42.5 62L67 36.5"
                  stroke="currentColor"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="medizen-success-check"
                />
              </svg>
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
              Factura {invCode} · Pagada
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-foreground mt-3">
              ¡Cobro Confirmado!
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs">
              El pago de <strong className="text-foreground">{invoice.paciente_nombre}</strong> fue registrado y conciliado en tesorería.
            </p>

            <div className="mt-5 w-full max-w-xs rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Monto acreditado:</span>
                <span className="font-black text-foreground text-sm">
                  ${s.totalUsd.toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Equivalente Bs.:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatBs(s.totalUsd, s.activeRate)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-emerald-500/20">
                <span className="text-muted-foreground font-medium">Método:</span>
                <span className="font-bold text-foreground text-right">
                  {s.confirmedMethodLabel || paymentMethod || "Pago Móvil"}
                </span>
              </div>
              {s.confirmedReference && (
                <div className="flex items-start justify-between gap-2 text-xs pt-1.5 border-t border-emerald-500/20">
                  <span className="text-muted-foreground font-medium shrink-0">Referencia:</span>
                  <span className="font-mono font-semibold text-foreground text-right break-all">
                    {s.confirmedReference}
                  </span>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={() => s.handleOpenChange(false)}
              className="mt-6 w-full max-w-xs h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-500/20 cursor-pointer"
            >
              Listo, Cerrar Comprobante
            </Button>
          </div>
        ) : (
        <div className="flex-1 md:overflow-y-auto md:px-6 md:py-5 space-y-4 min-w-0">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tasa de Conversión Aplicada
            </Label>
            <ConfirmPaymentRateSelector
              dialogRateType={s.dialogRateType}
              setDialogRateType={s.setDialogRateType}
              rates={rates}
            />
          </div>

          <ConfirmPaymentSummaryCard
            totalUsd={s.totalUsd}
            rates={rates}
            dialogRateType={s.dialogRateType}
            activeRate={s.activeRate}
            totalBs={s.totalBs}
            copiedBs={s.copiedBs}
            onCopyBs={s.handleCopyBs}
          />

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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  s.handleSubmitConfirm();
                }
              }}
              className="rounded-xl bg-background/80 h-10 text-xs"
            />
          </div>
        </div>
        )}

        {/* Pie Fijo Inferior */}
        {!s.showSuccess && (
        <footer className="pt-4 mt-4 md:mt-0 md:px-6 md:py-4 border-t border-border/60 shrink-0 bg-card/95 backdrop-blur-md md:rounded-bl-3xl flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => s.handleOpenChange(false)}
            className="rounded-2xl h-10 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer w-full sm:w-auto"
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={s.handleSubmitConfirm}
            className="rounded-2xl bg-primary text-primary-foreground hover:bg-[#3451d6] shadow-sm shadow-primary/20 h-10 px-6 text-xs font-bold cursor-pointer w-full sm:w-auto"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" /> Procesando Cobro…
              </span>
            ) : (
              "Confirmar Cobro"
            )}
          </Button>
        </footer>
        )}
      </div>
    </>
  );
}

export default ConfirmPaymentDialog;
