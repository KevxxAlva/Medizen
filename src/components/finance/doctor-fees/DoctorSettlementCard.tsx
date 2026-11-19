import { Download, Percent, ReceiptText, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isInvoicePaid, type DoctorSettlementRow } from "./doctorFeesHelpers";

interface DoctorSettlementCardProps {
  settlement: DoctorSettlementRow;
  isAdmin: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCommissionChange: (rawVal: string) => void;
  onExportPdf: () => void;
}

export function DoctorSettlementCard({
  settlement: s,
  isAdmin,
  isExpanded,
  onToggleExpand,
  onCommissionChange,
  onExportPdf,
}: DoctorSettlementCardProps) {
  const docKey = String(s.doctor.id);
  const inputId = `commission-pct-${docKey}`;

  return (
    <div className="rounded-2xl border border-border bg-muted/15 p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-extrabold text-sm">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Dr(a). {s.doctor.full_name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {s.doctor.specialty || "Medicina Especializada"} • {s.paidCount} pagada(s),{" "}
              {s.pendingCount} pendiente(s)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 py-1.5">
            <Percent className="h-3.5 w-3.5 text-primary" />
            {isAdmin ? (
              <>
                <label
                  htmlFor={inputId}
                  className="text-xs font-bold text-muted-foreground"
                >
                  % Médico:
                </label>
                <input
                  id={inputId}
                  type="number"
                  min={0}
                  max={100}
                  aria-label={`Porcentaje médico para ${s.doctor.full_name}`}
                  value={s.pct}
                  onChange={(e) => onCommissionChange(e.target.value)}
                  className="w-12 text-center text-xs font-extrabold bg-muted rounded-md py-0.5 text-foreground focus:outline-none"
                />
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-muted-foreground">% Médico:</span>
                <span className="text-xs font-extrabold text-foreground">{s.pct}%</span>
              </>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onToggleExpand}
            className="h-9 rounded-xl text-xs font-bold gap-1.5"
          >
            <ReceiptText className="h-3.5 w-3.5" />
            {isExpanded ? "Ocultar Detalle" : "Ver Facturas"}
          </Button>

          <Button
            size="sm"
            onClick={onExportPdf}
            className="h-9 rounded-xl text-xs font-bold gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Liquidación PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="rounded-xl bg-card border border-border/60 p-3">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Bruto Cobrado</p>
          <p className="text-base font-extrabold text-foreground mt-0.5">
            ${s.grossPaidUsd.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-500/[0.08] border border-emerald-500/25 p-3">
          <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
            Honorario Médico ({s.pct}%)
          </p>
          <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
            ${s.doctorNetUsd.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl bg-card border border-border/60 p-3">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">
            Retención Clínica ({100 - s.pct}%)
          </p>
          <p className="text-base font-extrabold text-foreground mt-0.5">
            ${s.clinicNetUsd.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl bg-amber-500/[0.07] border border-amber-500/25 p-3">
          <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
            Facturas Pendientes
          </p>
          <p className="text-base font-extrabold text-foreground mt-0.5">
            ${s.pendingUsd.toFixed(2)}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="rounded-xl border border-border bg-card overflow-hidden mt-1">
          {s.invoices.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground text-center">
              No hay facturas asociadas a este especialista en el período seleccionado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-extrabold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Factura</th>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Paciente</th>
                    <th className="py-2.5 px-3">Servicio</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Monto</th>
                    <th className="py-2.5 px-3 text-right">Honorario ({s.pct}%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {s.invoices.map((inv) => {
                    const isPaid = isInvoicePaid(inv.estado_pago);
                    const total = Number(inv.total_general) || 0;
                    return (
                      <tr key={inv.id_factura} className="hover:bg-muted/30">
                        <td className="py-2.5 px-3 font-mono font-bold">
                          INV-{String(inv.id_factura).padStart(4, "0")}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {(inv.fecha_emision || "").slice(0, 10)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {inv.paciente_nombre}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {inv.concepto || "Consulta Médica"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={
                              isPaid
                                ? "px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase"
                                : "px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase"
                            }
                          >
                            {isPaid ? "Pagada" : "Pendiente"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">${total.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          {isPaid ? `$${((total * s.pct) / 100).toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
