import React from "react";
import { APP_TIME_ZONE } from "@/lib/constants/locale";
import { AppointmentWithPatient } from "@/lib/api/appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Search,
  Receipt,
  FileDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  CreditCard,
  X,
} from "lucide-react";

export function FacturacionHeader({
  metrics,
  onExportReport,
}: {
  metrics: { totalEarnings: number; pendingEarnings: number; completedCount: number; pendingCount: number };
  onExportReport: () => void;
}) {
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Módulo Financiero</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Facturación y Recibos</h1>
          <p className="text-sm text-muted-foreground">Control de caja, cobros de consultas y estados de pago.</p>
        </div>
        <Button
          onClick={onExportReport}
          className="rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30 hover:opacity-95 transition-transform duration-300 hover:scale-[1.02] flex items-center gap-1.5 h-10 px-4 text-xs font-semibold cursor-pointer"
        >
          <FileDown className="h-4 w-4" /> Exportar Reporte
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl glass-card p-5 border border-border/40 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sage to-sage-foreground text-primary-foreground font-bold shadow-sm shadow-sage/20">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Total Recaudado</p>
            <p className="text-lg font-bold mt-0.5 text-foreground">${metrics.totalEarnings.toLocaleString("es-ES")} USD</p>
            <span className="text-[10px] text-muted-foreground">{metrics.completedCount} consultas cobradas</span>
          </div>
        </div>

        <div className="rounded-3xl glass-card p-5 border border-border/40 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve to-mauve-soft text-primary-foreground font-bold shadow-sm shadow-mauve/20">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Por Recaudar</p>
            <p className="text-lg font-bold mt-0.5 text-foreground">${metrics.pendingEarnings.toLocaleString("es-ES")} USD</p>
            <span className="text-[10px] text-muted-foreground">{metrics.pendingCount} cobros pendientes</span>
          </div>
        </div>
      </div>
    </>
  );
}

export function FacturacionFilterBar({
  q,
  setQ,
  statusFilter,
  setStatusFilter,
  doctorFilter,
  setDoctorFilter,
  monthFilter,
  setMonthFilter,
  doctors,
  monthOptions,
}: {
  q: string;
  setQ: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  doctorFilter: string;
  setDoctorFilter: (v: string) => void;
  monthFilter: string;
  setMonthFilter: (v: string) => void;
  doctors: any[];
  monthOptions: { key: string; label: string }[];
}) {
  return (
    <div className="rounded-3xl glass-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-2xl bg-muted/60 px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por paciente o concepto…"
            aria-label="Buscar por paciente o concepto"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => setQ("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px] rounded-2xl">
            <SelectValue placeholder="Estado Pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos los estados</SelectItem>
            <SelectItem value="programada">Pendiente (Programada)</SelectItem>
            <SelectItem value="completada">Cobrada (Completada)</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="w-[210px] rounded-2xl">
            <SelectValue placeholder="Filtrar por médico" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los médicos</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.full_name || d.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-[190px] rounded-2xl">
            <SelectValue placeholder="Filtrar por mes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los meses</SelectItem>
            {monthOptions.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function FacturacionTable({
  isLoading,
  filteredCount,
  paginated,
  doctorMap,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onEditOpen,
  onExportInvoice,
}: {
  isLoading: boolean;
  filteredCount: number;
  paginated: AppointmentWithPatient[];
  doctorMap: Map<string, string>;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (p: number) => void;
  onEditOpen: (app: AppointmentWithPatient, confirmMode?: boolean) => void;
  onExportInvoice: (app: AppointmentWithPatient) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-3xl glass-card p-12 text-center shadow-sm flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filteredCount === 0) {
    return (
      <div className="rounded-3xl glass-card p-12 text-center shadow-sm">
        <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">No se encontraron cobros registrados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-3xl glass-card shadow-sm border border-border/40">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-muted/40 text-left">
            <tr className="text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3.5">Paciente</th>
              <th className="px-5 py-3.5">Fecha Cita</th>
              <th className="px-5 py-3.5">Concepto</th>
              <th className="px-5 py-3.5">Médico</th>
              <th className="px-5 py-3.5">Monto</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paginated.map((a) => (
              <tr key={a.id} className="transition hover:bg-muted/30">
                <td className="px-5 py-3.5 font-bold">{a.patient_name}</td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground">
                  {new Date(a.scheduled_at).toLocaleString("es-ES", {
                    timeZone: APP_TIME_ZONE,
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-5 py-3.5 text-xs truncate max-w-[200px]">{a.reason || "Consulta médica general"}</td>
                <td className="px-5 py-3.5 text-xs">{doctorMap.get(a.doctor_id) || "Doctor"}</td>
                <td className="px-5 py-3.5 font-bold">${a.price || 0}</td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-col gap-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize w-fit",
                        a.status === "completada"
                          ? a.payment_method
                            ? "bg-sage/50 text-sage-foreground"
                            : "bg-amber-100 text-amber-800 border border-amber-200/50"
                          : a.status === "programada"
                          ? "bg-mauve/15 text-mauve"
                          : "bg-destructive/15 text-destructive",
                      )}
                    >
                      {a.status === "completada"
                        ? a.payment_method
                          ? "Cobrada"
                          : "Por Cobrar"
                        : a.status === "programada"
                        ? "Pendiente"
                        : "Cancelada"}
                    </span>
                    {a.status === "completada" && a.payment_method && (
                      <span className="text-[10px] text-muted-foreground font-semibold flex flex-wrap items-center gap-1">
                        <CreditCard className="h-3 w-3 shrink-0" /> {a.payment_method}
                        {a.payment_reference && (
                          <span className="text-muted-foreground/60 font-normal">
                            (Ref: {a.payment_reference})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {!a.payment_method ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditOpen(a, true)}
                        className="rounded-xl border-mauve text-mauve hover:bg-mauve/15 flex items-center gap-1 cursor-pointer h-8 text-xs font-semibold px-2.5 shadow-sm shadow-mauve/5"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Confirmar Pago
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditOpen(a)}
                        className="h-8 w-8 p-0 rounded-xl hover:bg-mauve/10 cursor-pointer flex items-center justify-center text-muted-foreground"
                        aria-label="Registrar pago"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {(a.status === "completada" || (a.cost && a.cost > 0)) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExportInvoice(a)}
                        className="h-7 px-2.5 rounded-xl border-border/60 hover:bg-primary/10 hover:text-primary text-[11px] font-bold gap-1 cursor-pointer shadow-2xs"
                        title="Descargar Recibo Oficial en PDF"
                      >
                        <FileDown className="h-3 w-3 text-primary" />
                        Recibo PDF
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl glass-card p-4 shadow-sm border border-border/40 animate-fade-in">
          <p className="text-xs text-muted-foreground">
            Mostrando{" "}
            <span className="font-semibold text-foreground">
              {(currentPage - 1) * itemsPerPage + 1} - {Math.min(filteredCount, currentPage * itemsPerPage)}
            </span>{" "}
            de <span className="font-semibold text-foreground">{filteredCount}</span> registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-xl text-xs h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <span className="text-xs font-semibold px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="rounded-xl text-xs h-8"
            >
              Siguiente <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function EditPaymentDialog({
  open,
  onOpenChange,
  isConfirmMode,
  selectedApp,
  newPrice,
  setNewPrice,
  newStatus,
  setNewStatus,
  newPaymentMethod,
  setNewPaymentMethod,
  newPaymentReference,
  setNewPaymentReference,
  isPending,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConfirmMode: boolean;
  selectedApp: AppointmentWithPatient | null;
  newPrice: string;
  setNewPrice: (val: string) => void;
  newStatus: string;
  setNewStatus: (val: string) => void;
  newPaymentMethod: string;
  setNewPaymentMethod: (val: string) => void;
  newPaymentReference: string;
  setNewPaymentReference: (val: string) => void;
  isPending: boolean;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>{isConfirmMode ? "Confirmar Método de Pago" : "Editar Pago / Facturación"}</DialogTitle>
          <DialogDescription>
            {isConfirmMode
              ? "Registra y confirma el método de pago para completar la facturación de esta consulta."
              : "Actualiza el precio acordado de la consulta o el estado de pago."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="paciente-name">Paciente</Label>
            <Input id="paciente-name" value={selectedApp?.patient_name || ""} disabled className="rounded-xl bg-muted/40" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="monto-val">Precio de la Consulta ($ USD)</Label>
            <Input
              id="monto-val"
              type="number"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="status-val">Estado de Cita (Pago)</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="programada">Pendiente (Programada)</SelectItem>
                <SelectItem value="completada">Cobrada (Completada)</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newStatus === "completada" && (
            <>
              <div className="grid gap-1.5 animate-fade-in">
                <Label htmlFor="payment-method-val">Método de Pago</Label>
                <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                  <SelectTrigger id="payment-method-val" className="rounded-xl">
                    <SelectValue placeholder="Seleccione método de pago..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Pago Móvil">Pago Móvil</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                    <SelectItem value="Divisas">Divisas (Dólares)</SelectItem>
                    <SelectItem value="Punto de Venta">Punto de Venta / Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newPaymentMethod && newPaymentMethod !== "Efectivo" && newPaymentMethod !== "Divisas" && (
                <div className="grid gap-1.5 animate-fade-in">
                  <Label htmlFor="payment-ref-val">Referencia de Pago</Label>
                  <Input
                    id="payment-ref-val"
                    placeholder="Ej. Código de transferencia o pago móvil..."
                    value={newPaymentReference}
                    onChange={(e) => setNewPaymentReference(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={isPending}
            className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isConfirmMode ? (
              "Confirmar Pago"
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
