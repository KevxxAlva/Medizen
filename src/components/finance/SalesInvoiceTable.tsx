import { useState } from "react";
import {
  Download,
  Eye,
  Trash2,
  Copy,
  Check,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { inferCategoryFromMethod } from "@/lib/api/paymentMethods";
import {
  RATE_LABELS,
  type RateType,
  type ExchangeRates,
} from "@/hooks/useExchangeRate";
import { getCategoryIcon, getCategoryBadgeStyle } from "./PaymentMethodsPage";
import { generateIndividualInvoice } from "@/lib/utils/generateIndividualInvoice";
import { toast } from "sonner";
import { APP_LOCALE, APP_TIME_ZONE } from "@/lib/constants/locale";
import type { Invoice } from "./ViewInvoiceDialog";

export interface SalesInvoiceTableProps {
  paginated: Invoice[];
  rate: number;
  rates: ExchangeRates;
  activeType: RateType;
  onView: (invoice: Invoice) => void;
  onConfirm: (invoice: Invoice) => void;
  onDelete: (id: number) => void;
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

function InvoiceStatusTag({
  status,
  method,
  reference,
}: {
  status: string;
  method?: string | null;
  reference?: string | null;
}) {
  const normStatus = (status || "").toLowerCase();
  const isPaid = normStatus === "pagado" || normStatus === "pagada";
  const isCancelled = normStatus === "cancelado" || normStatus === "cancelada";

  const methodCat = method ? inferCategoryFromMethod(method, method) : null;
  const MethodIcon = methodCat ? getCategoryIcon(methodCat) : null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider w-fit",
            isPaid
              ? "bg-green-50 text-green-600 border border-green-100 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
              : isCancelled
              ? "bg-red-50 text-red-600 border border-red-100 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30"
              : "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
          )}
        >
          {status}
        </span>

        {method && methodCat && MethodIcon && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
              getCategoryBadgeStyle(methodCat)
            )}
          >
            <MethodIcon className="h-3 w-3 shrink-0" />
            {method}
          </span>
        )}
      </div>

      {reference && (
        <span
          className="text-[10px] text-muted-foreground font-medium truncate max-w-[230px]"
          title={reference}
        >
          Ref: {reference}
        </span>
      )}
    </div>
  );
}

function InvoiceAmountsCell({
  totalGeneral,
  rate,
  rates,
  invoiceId,
  copiedId,
  onCopyBs,
}: {
  totalGeneral: number;
  rate: number;
  rates: ExchangeRates;
  invoiceId: number;
  copiedId: number | null;
  onCopyBs: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-foreground">
            ${totalGeneral.toFixed(2)}
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground">
            · {formatEurFromUsd(totalGeneral, rates)}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-primary block">
          {formatBs(totalGeneral, rate)}
        </span>
      </div>
      <button
        type="button"
        onClick={onCopyBs}
        title="Copiar monto en Bolívares"
        aria-label="Copiar monto en Bolívares"
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
      >
        {copiedId === invoiceId ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

function InvoiceRowActions({
  invoice,
  rate,
  onConfirm,
  onView,
  onDelete,
}: {
  invoice: Invoice;
  rate: number;
  onConfirm: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
  onDelete: (id: number) => void;
}) {
  const normStatus = (invoice.estado_pago || "").toLowerCase();
  const isPaid = normStatus === "pagado" || normStatus === "pagada";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => generateIndividualInvoice(invoice, rate)}
        className="hover:text-primary cursor-pointer transition-colors"
        title="Descargar Comprobante PDF (USD / Bs.)"
      >
        <Download className="h-4 w-4" />
      </button>

      {!isPaid && (
        <button
          type="button"
          onClick={() => onConfirm(invoice)}
          className="flex items-center gap-1 text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          title="Confirmar Pago"
        >
          <CreditCard className="h-3.5 w-3.5" />
          Cobrar
        </button>
      )}

      <button
        type="button"
        onClick={() => onView(invoice)}
        className="hover:text-primary cursor-pointer transition-colors"
        title="Ver Factura"
      >
        <Eye className="h-4 w-4" />
      </button>

      <button
        type="button"
        aria-label={`Eliminar factura INV-${invoice.id_factura.toString().padStart(4, "0")}`}
        className="hover:text-destructive cursor-pointer"
        onClick={() => {
          if (
            window.confirm(
              `¿Estás segura de que deseas eliminar la factura INV-${invoice.id_factura
                .toString()
                .padStart(4, "0")}?`
            )
          ) {
            onDelete(invoice.id_factura);
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function SalesInvoiceTableRow({
  invoice: f,
  rate,
  rates,
  copiedId,
  onCopyBs,
  onConfirm,
  onView,
  onDelete,
}: {
  invoice: Invoice;
  rate: number;
  rates: ExchangeRates;
  copiedId: number | null;
  onCopyBs: (invoice: Invoice) => void;
  onConfirm: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
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
        <InvoiceAmountsCell
          totalGeneral={f.total_general}
          rate={rate}
          rates={rates}
          invoiceId={f.id_factura}
          copiedId={copiedId}
          onCopyBs={() => onCopyBs(f)}
        />
      </td>
      <td className="p-4">
        <InvoiceStatusTag
          status={f.estado_pago}
          method={f.metodo_pago}
          reference={f.referencia}
        />
      </td>
      <td className="p-4 text-muted-foreground">
        <InvoiceRowActions
          invoice={f}
          rate={rate}
          onConfirm={onConfirm}
          onView={onView}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}

export function SalesInvoiceTable({
  paginated,
  rate,
  rates,
  activeType,
  onView,
  onConfirm,
  onDelete,
}: SalesInvoiceTableProps) {
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
    <div className="flex-1 w-full min-w-0 overflow-x-auto border border-border rounded-2xl bg-card shadow-xs">
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
            paginated.map((f) => (
              <SalesInvoiceTableRow
                key={f.id_factura}
                invoice={f}
                rate={rate}
                rates={rates}
                copiedId={copiedId}
                onCopyBs={copyBsAmount}
                onConfirm={onConfirm}
                onView={onView}
                onDelete={onDelete}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SalesInvoiceTable;
