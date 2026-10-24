import { APP_LOCALE, APP_TIME_ZONE } from "@/lib/constants/locale";
import { useState } from "react";
import { Search, Plus, X, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, ReceiptText, Loader2, CreditCard, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateSalesReport } from "@/lib/utils/generateSalesReport";
import { generateIndividualInvoice } from "@/lib/utils/generateIndividualInvoice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { logAuditAction } from "@/lib/api/audit";
import { usePaymentMethods } from "@/lib/api/paymentMethods";

export type Invoice = {
  id_factura: number;
  id_paciente: number | null;
  paciente_nombre?: string;
  fecha_emision: string;
  subtotal: number;
  monto_paciente: number;
  total_general: number;
  estado_pago: string;
};

export function SalesPage() {
  const [q, setQ] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

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
          pacientes (nombre, apellido)
        `)
        .order("fecha_emision", { ascending: false });

      if (error) throw error;
      
      return data.map((f: any) => ({
        id_factura: f.id_factura,
        id_paciente: f.id_paciente,
        paciente_nombre: f.pacientes ? `${f.pacientes.nombre} ${f.pacientes.apellido}` : "Paciente Desconocido",
        fecha_emision: f.fecha_emision,
        subtotal: f.subtotal,
        monto_paciente: f.monto_paciente,
        total_general: f.total_general,
        estado_pago: f.estado_pago || "Pendiente",
      })) as Invoice[];
    }
  });

  const queryClient = useQueryClient();

  const updatePaymentStatus = useMutation({
    mutationFn: async ({ id, status, invoice }: { id: number; status: string; invoice: Invoice }) => {
      const { error: invError } = await supabase
        .from("facturas")
        .update({ estado_pago: status })
        .eq("id_factura", id);
        
      if (invError) throw invError;

      const { error: payError } = await supabase
        .from("pagos")
        .insert({
          id_factura: id,
          monto: invoice.total_general,
          metodo_pago: paymentMethod || "Efectivo",
          referencia: paymentReference || null,
          fecha_pago: new Date().toISOString(),
        });

      if (payError) throw payError;

      await logAuditAction("UPDATE", "INVOICE", id.toString(), {
        status,
        monto: invoice.total_general,
        metodo_pago: paymentMethod,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      queryClient.invalidateQueries({ queryKey: ["monthly_payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      toast.success("Pago confirmado y registrado exitosamente");
      setConfirmOpen(false);
    },
    onError: (err: any) => {
      toast.error(`Error al actualizar estado: ${err.message}`);
    }
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
    }
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

  const filtered = facturas.filter((f) => {
    if (q) {
      const query = q.toLowerCase();
      const numMatch = `inv-${f.id_factura.toString().padStart(4, "0")}`.includes(query) || f.id_factura.toString().includes(query);
      const nameMatch = (f.paciente_nombre || "").toLowerCase().includes(query);
      if (!numMatch && !nameMatch) return false;
    }
    if (filterMonth && !f.fecha_emision.startsWith(filterMonth)) return false;
    if (filterStatus !== "all" && (f.estado_pago || "pendiente").toLowerCase() !== filterStatus) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const generatePDFReport = async () => {
    try {
      await generateSalesReport(filtered, filterMonth);
      toast.success("Reporte generado exitosamente");
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
          <button type="button" onClick={() => window.history.back()} className="text-muted-foreground hover:text-foreground" title="Volver" aria-label="Volver"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold text-foreground">Ventas y Facturación</h1>
        </div>
        <div className="flex-1 max-w-xl mx-auto w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-full bg-muted border border-border px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por paciente o N° Factura (ej: 0001)…"
              aria-label="Buscar por paciente o N° Factura"
              className="w-full bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40 rounded-lg px-1 placeholder:text-muted-foreground text-foreground"
            />
            {q && <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-4 hidden md:flex"></div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <ReceiptText className="h-4 w-4" /> {filtered.length} facturas registradas
        </div>
        <div className="flex items-center gap-3">
          <SalesFilterPopover
            filterMonth={filterMonth}
            setFilterMonth={setFilterMonth}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onReset={() => { setFilterMonth(""); setFilterStatus("all"); setCurrentPage(1); }}
          />

          <Button
            type="button"
            onClick={generatePDFReport}
            variant="outline"
            className="flex items-center gap-2 border-border/40 text-foreground font-bold rounded-xl text-xs hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" /> Reporte Mensual
          </Button>
        </div>
      </div>

      <SalesTable
        paginated={paginated}
        onEdit={handleEditClick}
        onConfirm={handleConfirmClick}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <EditInvoiceDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        invoice={editingInvoice}
        isPending={updateInvoiceMutation.isPending}
        onSave={(data) => updateInvoiceMutation.mutate(data)}
      />

      <ConfirmPaymentDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        invoice={selectedInvoice}
        methods={methods}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentReference={paymentReference}
        setPaymentReference={setPaymentReference}
        isPending={updatePaymentStatus.isPending}
        onConfirm={() => {
          if (!selectedInvoice) return;
          updatePaymentStatus.mutate({ id: selectedInvoice.id_factura, status: "pagado", invoice: selectedInvoice });
        }}
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

function SalesFilterPopover({
  filterMonth,
  setFilterMonth,
  filterStatus,
  setFilterStatus,
  onReset,
}: {
  filterMonth: string;
  setFilterMonth: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  onReset: () => void;
}) {
  const isFiltered = filterMonth !== "" || filterStatus !== "all";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-bold text-foreground border border-border/40 rounded-xl hover:bg-muted transition-colors",
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
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Mes de Emisión</h4>
            <input
              type="month"
              aria-label="Filtrar por mes de emisión"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs font-semibold outline-none"
            />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Estado de Pago</h4>
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
  onEdit,
  onConfirm,
  onDelete,
}: {
  paginated: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onConfirm: (invoice: Invoice) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex-1 overflow-x-auto border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-muted/70 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
            <th className="p-4 w-12 rounded-tl-xl"><input type="checkbox" aria-label="Seleccionar todas las facturas" className="rounded border-gray-300" /></th>
            <th className="p-4">Factura N°</th>
            <th className="p-4">Paciente</th>
            <th className="p-4">Fecha de Emisión</th>
            <th className="p-4">Total</th>
            <th className="p-4">Estado</th>
            <th className="p-4 rounded-tr-xl">Acciones</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {paginated.length === 0 ? (
            <tr><td colSpan={7} className="p-12 text-center text-muted-foreground font-medium">No se encontraron ventas.</td></tr>
          ) : (
            paginated.map((f) => (
              <tr key={f.id_factura} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                <td className="p-4"><input type="checkbox" aria-label={`Seleccionar factura INV-${f.id_factura.toString().padStart(4, "0")}`} className="rounded border-gray-300" /></td>
                <td className="p-4 font-bold text-primary">
                  INV-{f.id_factura.toString().padStart(4, "0")}
                </td>
                <td className="p-4 font-semibold text-foreground">
                  {f.paciente_nombre}
                </td>
                <td className="p-4 text-muted-foreground text-xs font-medium">
                  {new Date(f.fecha_emision).toLocaleDateString(APP_LOCALE, { timeZone: APP_TIME_ZONE })}
                </td>
                <td className="p-4 font-bold text-foreground">
                  ${f.total_general.toFixed(2)}
                </td>
                <td className="p-4">
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
                    (f.estado_pago || "").toLowerCase() === "pagado" || (f.estado_pago || "").toLowerCase() === "pagada"
                      ? "bg-green-50 text-green-600 border border-green-100"
                      : (f.estado_pago || "").toLowerCase() === "cancelado" || (f.estado_pago || "").toLowerCase() === "cancelada"
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                  )}>
                    {f.estado_pago}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => generateIndividualInvoice(f)}
                      className="hover:text-primary cursor-pointer transition-colors"
                      title="Descargar Comprobante PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    {(f.estado_pago || "").toLowerCase() !== "pagado" && (f.estado_pago || "").toLowerCase() !== "pagada" && (
                      <button
                        type="button"
                        onClick={() => onConfirm(f)}
                        className="flex items-center gap-1 text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded-md transition-colors"
                        title="Confirmar Pago"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Confirmar
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
                        if (window.confirm(`¿Estás segura de que deseas eliminar la factura INV-${f.id_factura.toString().padStart(4, "0")}?`)) {
                          onDelete(f.id_factura);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
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
  isPending,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  isPending: boolean;
  onSave: (data: { id: number; total_general: number; estado_pago: string; fecha_emision: string }) => void;
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
      setEditDate(invoice.fecha_emision ? invoice.fecha_emision.slice(0, 10) : new Date().toISOString().slice(0, 10));
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
      fecha_emision: editDate ? new Date(`${editDate}T12:00:00`).toISOString() : invoice.fecha_emision,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-6 border-0 shadow-2xl glass-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Editar Factura</DialogTitle>
          <DialogDescription>
            Modifica los datos de la factura INV-{invoice?.id_factura?.toString().padStart(4, "0")} ({invoice?.paciente_nombre}).
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
            <Label htmlFor="edit-invoice-total">Monto Total ($)</Label>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl hover:bg-muted" disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl bg-primary text-primary-foreground" disabled={isPending}>
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
  methods: any[];
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  paymentReference: string;
  setPaymentReference: (val: string) => void;
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-6 border-0 shadow-2xl glass-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Confirmar Pago</DialogTitle>
          <DialogDescription>
            Selecciona el método de pago utilizado para la factura INV-{invoice?.id_factura?.toString().padStart(4, "0")}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="metodo-pago">Método de Pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="metodo-pago" className="rounded-xl bg-background/50">
                <SelectValue placeholder="Seleccione un método…" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {methods.filter(m => m.status === "Active").map(m => (
                  <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                ))}
                {methods.length === 0 && (
                   <SelectItem value="Efectivo">Efectivo</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {paymentMethod && methods.find(m => m.name === paymentMethod)?.category !== "Cash" && (
            <div className="grid gap-2">
              <Label htmlFor="referencia">Referencia</Label>
              <Input
                id="referencia"
                placeholder="Ej. 12345678"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="rounded-xl bg-background/50"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl hover:bg-muted" disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="rounded-xl bg-primary text-primary-foreground" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
