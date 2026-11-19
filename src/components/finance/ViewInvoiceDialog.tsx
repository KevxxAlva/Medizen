import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ReceiptText,
  CreditCard,
  Download,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  inferCategoryFromMethod,
  type ExchangeRates,
} from "@/lib/api/paymentMethods";
import { getCategoryIcon, getCategoryBadgeStyle } from "./PaymentMethodsPage";
import { generateIndividualInvoice } from "@/lib/utils/generateIndividualInvoice";
import { toast } from "sonner";
import { APP_LOCALE, APP_TIME_ZONE } from "@/lib/constants/locale";

export interface InvoiceItem {
  id?: number | string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Invoice {
  id_factura: number;
  id_paciente: number;
  paciente_nombre: string;
  fecha_emision: string;
  subtotal: number;
  monto_paciente: number;
  total_general: number;
  estado_pago: string;
  metodo_pago?: string | null;
  referencia?: string | null;
  concepto?: string | null;
  items?: InvoiceItem[];
}

export interface ViewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  rate: number;
  rates: ExchangeRates;
  onConfirmPayment?: (invoice: Invoice) => void;
}

function formatBs(usd: number, rateValue: number) {
  return `Bs. ${(usd * rateValue).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatEur(usd: number, rates: ExchangeRates) {
  const eurRate = rates.eur > 0 ? rates.eur : rates.bcv * 1.08;
  const inEur = (usd * rates.bcv) / eurRate;
  return `€${inEur.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function InvoiceStatusBadge({
  isPaid,
  isCancelled,
}: {
  isPaid: boolean;
  isCancelled: boolean;
}) {
  if (isPaid) {
    return (
      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        PAGADO
      </span>
    );
  }
  if (isCancelled) {
    return (
      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        CANCELADO
      </span>
    );
  }
  return (
    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
      PENDIENTE
    </span>
  );
}

function InvoiceMulticurrencyCard({
  totalUsd,
  rate,
  rates,
}: {
  totalUsd: number;
  rate: number;
  rates: ExchangeRates;
}) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Monto Total ($ USD)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              ${totalUsd.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              · {formatEur(totalUsd, rates)} EUR
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Equivalente Oficial (Bs.)
          </span>
          <span className="text-lg sm:text-xl font-black text-primary block mt-0.5">
            {formatBs(totalUsd, rate)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-muted-foreground border-t border-primary/10 pt-2">
        <span>BCV ($): {formatBs(totalUsd, rates.bcv)}</span>
        <span>EUR (€): {formatBs(totalUsd, rates.eur)}</span>
        <span>USDT: {totalUsd.toFixed(2)} USDT</span>
      </div>
    </div>
  );
}

function PatientInfoCard({
  patientName,
  emissionDate,
}: {
  patientName: string;
  emissionDate: string;
}) {
  const dateFormatted = emissionDate
    ? new Date(emissionDate).toLocaleDateString(APP_LOCALE, {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: APP_TIME_ZONE,
      })
    : "Fecha no disponible";

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5 space-y-2.5 text-xs">
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
        <span className="text-muted-foreground font-semibold">Paciente:</span>
        <span className="font-bold text-foreground text-sm text-right truncate">
          {patientName}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground font-semibold">Fecha de Emisión:</span>
        <span className="font-semibold text-foreground text-right">{dateFormatted}</span>
      </div>
    </div>
  );
}

function TransactionDetailsCard({
  metodoPago,
  referencia,
}: {
  metodoPago?: string | null;
  referencia?: string | null;
}) {
  const [copiedRef, setCopiedRef] = useState(false);
  const category = metodoPago ? inferCategoryFromMethod(metodoPago, metodoPago) : null;
  const CategoryIcon = category ? getCategoryIcon(category) : null;

  const handleCopyRef = (refText: string) => {
    navigator.clipboard.writeText(refText);
    setCopiedRef(true);
    toast.success("N° de referencia copiado al portapapeles");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3.5 space-y-2.5 text-xs">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
        Información de Transacción
      </span>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground font-semibold">Método de Pago:</span>
        {metodoPago ? (
          <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
            {CategoryIcon && (
              <span
                className={cn(
                  "h-5 w-5 rounded-md border flex items-center justify-center",
                  getCategoryBadgeStyle(category || "")
                )}
              >
                <CategoryIcon className="h-3 w-3" />
              </span>
            )}
            <span>{metodoPago}</span>
          </span>
        ) : (
          <span className="text-muted-foreground italic">Sin método registrado</span>
        )}
      </div>

      {referencia && (
        <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2">
          <span className="text-muted-foreground font-semibold">Referencia:</span>
          <div className="flex items-center gap-1.5 max-w-[220px]">
            <span className="font-mono text-xs font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-md truncate">
              {referencia}
            </span>
            <button
              type="button"
              onClick={() => handleCopyRef(referencia)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
              title="Copiar Referencia"
            >
              {copiedRef ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceDialogFooter({
  isPaid,
  isCancelled,
  isExporting,
  onClose,
  onConfirmPayment,
  onDownloadPdf,
}: {
  isPaid: boolean;
  isCancelled: boolean;
  isExporting: boolean;
  onClose: () => void;
  onConfirmPayment?: () => void;
  onDownloadPdf: () => void;
}) {
  return (
    <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-border/50">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="rounded-xl hover:bg-muted"
      >
        Cerrar
      </Button>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {!isPaid && !isCancelled && onConfirmPayment && (
          <Button
            type="button"
            onClick={onConfirmPayment}
            className="rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 gap-1.5 font-bold cursor-pointer"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Cobrar Factura
          </Button>
        )}

        <Button
          type="button"
          onClick={onDownloadPdf}
          disabled={isExporting}
          className="rounded-xl bg-primary text-primary-foreground gap-1.5 font-bold cursor-pointer"
        >
          {isExporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Descargar PDF
        </Button>
      </div>
    </DialogFooter>
  );
}

export function ViewInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  rate,
  rates,
  onConfirmPayment,
}: ViewInvoiceDialogProps) {
  const [isExporting, setIsExporting] = useState(false);

  if (!invoice) return null;

  const totalUsd = Number(invoice.total_general) || 0;
  const isPaid =
    ["pagado", "pagada", "paid"].includes((invoice.estado_pago || "").toLowerCase());
  const isCancelled =
    ["cancelado", "cancelada", "cancelled"].includes((invoice.estado_pago || "").toLowerCase());

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      await generateIndividualInvoice(invoice, rate);
      toast.success("Comprobante de factura descargado en PDF");
    } catch (e: any) {
      toast.error(e?.message || "Error al generar el comprobante PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const invoiceNumber = `INV-${invoice.id_factura.toString().padStart(4, "0")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.25rem)] sm:max-w-[500px] max-h-[calc(100dvh-1.5rem)] sm:max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 border border-border/60 shadow-2xl glass-card gap-4">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ReceiptText className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                {invoiceNumber}
              </DialogTitle>
            </div>
            <InvoiceStatusBadge isPaid={isPaid} isCancelled={isCancelled} />
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Comprobante fiscal y de cobro emitido para la atención médica.
          </DialogDescription>
        </DialogHeader>

        <PatientInfoCard
          patientName={invoice.paciente_nombre || "Paciente General"}
          emissionDate={invoice.fecha_emision}
        />

        <InvoiceMulticurrencyCard
          totalUsd={totalUsd}
          rate={rate}
          rates={rates}
        />

        <TransactionDetailsCard
          metodoPago={invoice.metodo_pago}
          referencia={invoice.referencia}
        />

        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 text-xs space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Concepto Facturado
          </span>
          {invoice.items && invoice.items.length > 0 ? (
            <div className="space-y-2">
              {invoice.items.map((item) => (
                <div
                  key={item.id ?? `${item.descripcion}-${item.cantidad}-${item.precio_unitario}`}
                  className="flex items-center justify-between font-semibold text-foreground"
                >
                  <div className="flex items-center gap-1.5">
                    {item.cantidad > 1 && (
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                        {item.cantidad}x
                      </span>
                    )}
                    <span>{item.descripcion}</span>
                  </div>
                  <span>${Number(item.subtotal || item.precio_unitario || 0).toFixed(2)} USD</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span>{invoice.concepto || "Servicios Médicos / Consulta Especializada"}</span>
              <span>${totalUsd.toFixed(2)} USD</span>
            </div>
          )}
        </div>

        <InvoiceDialogFooter
          isPaid={isPaid}
          isCancelled={isCancelled}
          isExporting={isExporting}
          onClose={() => onOpenChange(false)}
          onConfirmPayment={onConfirmPayment ? () => onConfirmPayment(invoice) : undefined}
          onDownloadPdf={handleDownloadPdf}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ViewInvoiceDialog;
