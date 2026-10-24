import { useState } from "react";
import { Search, Plus, X, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, Wallet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { TablePagination } from "@/components/ui/table-pagination";
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, type FinancialAccount as Account } from "@/lib/api/accounts";
import { toast } from "sonner";

export function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const createAcc = useCreateAccount();
  const updateAcc = useUpdateAccount();
  const deleteAcc = useDeleteAccount();
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = accounts.filter((a) => {
    if (q) {
      const term = q.toLowerCase();
      if (!(a.name.toLowerCase().includes(term) || a.type.toLowerCase().includes(term))) {
        return false;
      }
    }
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta cuenta?")) {
      try {
        await deleteAcc.mutateAsync(id);
        toast.success("Cuenta eliminada");
      } catch (e) {
        toast.error("Error al eliminar cuenta");
      }
    }
  };

  const handleSave = async (accData: { name: string; type: string; balance: number; status: "Active" | "Inactive"; id?: string }) => {
    try {
      if (accData.id) {
        await updateAcc.mutateAsync(accData as Account);
        toast.success("Cuenta actualizada");
      } else {
        await createAcc.mutateAsync(accData);
        toast.success("Cuenta añadida");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error("Error al guardar cuenta");
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
    <div className="bg-card rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-sm min-h-[calc(100vh-8rem)] font-sans flex flex-col">
      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => window.history.back()} className="text-muted-foreground hover:text-foreground" title="Volver" aria-label="Volver"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold text-foreground">Cuentas</h1>
        </div>
        <div className="flex-1 max-w-xl mx-auto w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-full bg-muted border border-border/50 px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cuentas..."
              aria-label="Buscar cuentas"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            {q && <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-4 hidden md:flex">
          {/* Action icons */}
        </div>
      </header>

      {/* SECONDARY TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border/40 pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Wallet className="h-4 w-4" /> {filtered.length} cuentas
        </div>
        <div className="flex items-center gap-3">
          <AccountsFilterPopover
            filterType={filterType}
            setFilterType={(v) => { setFilterType(v); setCurrentPage(1); }}
            filterStatus={filterStatus}
            setFilterStatus={(v) => { setFilterStatus(v); setCurrentPage(1); }}
            onReset={() => { setFilterType("all"); setFilterStatus("all"); setCurrentPage(1); }}
          />
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#3451d6] transition">
            <Plus className="h-3.5 w-3.5" /> Añadir Cuenta
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="p-4 w-12 rounded-tl-xl"><input type="checkbox" aria-label="Seleccionar todas las cuentas" className="rounded border-gray-300" /></th>
              <th className="p-4">Nombre de Cuenta <span className="ml-1">↕</span></th>
              <th className="p-4">ID de Cuenta <span className="ml-1">↕</span></th>
              <th className="p-4">Tipo <span className="ml-1">↕</span></th>
              <th className="p-4">Balance <span className="ml-1">↕</span></th>
              <th className="p-4">Estado <span className="ml-1">↕</span></th>
              <th className="p-4 rounded-tr-xl">Acción <span className="ml-1">↕</span></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginated.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-muted-foreground font-medium">No se encontraron cuentas.</td></tr>
            ) : (
              paginated.map((a) => (
                <tr key={a.id} className="border-b border-border/40 hover:bg-muted/50 transition group">
                  <td className="p-4"><input type="checkbox" aria-label={`Seleccionar cuenta ${a.name}`} className="rounded border-gray-300" /></td>
                  <td className="p-4 font-bold text-foreground">{a.name}</td>
                  <td className="p-4 text-muted-foreground font-medium">{a.id}</td>
                  <td className="p-4 text-muted-foreground font-medium">{a.type}</td>
                  <td className="p-4">
                    <span className="bg-green-50 text-green-600 font-bold px-3 py-1.5 text-xs rounded-full border border-green-100">
                      ${a.balance.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide",
                      a.status === "Active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {a.status === "Active" ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <TableRowActions
                    editLabel={`Editar cuenta ${a.name}`}
                    deleteLabel={`Eliminar cuenta ${a.name}`}
                    onEdit={() => { setEditing(a); setFormOpen(true); }}
                    onDelete={() => handleDelete(a.id)}
                  />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        entityLabel="cuentas"
        onPageChange={setCurrentPage}
      />

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSave={handleSave}
        isPending={createAcc.isPending || updateAcc.isPending}
      />
    </div>
  );
}

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Account | null;
  onSave: (data: { name: string; type: string; balance: number; status: "Active" | "Inactive"; id?: string }) => Promise<void>;
  isPending: boolean;
}

function AccountFormDialog({ open, onOpenChange, editing, onSave, isPending }: AccountFormDialogProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const fd = new FormData(e.currentTarget);
    const accData = {
      name: fd.get("name") as string,
      type: fd.get("type") as string,
      balance: parseFloat(fd.get("balance") as string),
      status: fd.get("status") as "Active" | "Inactive",
      id: editing?.id,
    };
    await onSave(accData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Cuenta" : "Añadir Nueva Cuenta"}</DialogTitle>
          <DialogDescription>Completa los detalles para la cuenta financiera.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold text-foreground">NOMBRE DE LA CUENTA *</Label>
            <Input id="name" name="name" defaultValue={editing?.name} required className="bg-muted border-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-xs font-bold text-foreground">TIPO</Label>
              <select id="type" name="type" defaultValue={editing?.type || "Bank"} className="w-full h-10 px-3 py-2 rounded-md bg-muted border border-gray-200 text-sm outline-none">
                <option value="Bank">Banco</option>
                <option value="Cash">Efectivo (Cash)</option>
                <option value="Digital">Digital / Crypto</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance" className="text-xs font-bold text-foreground">BALANCE ($) *</Label>
              <Input id="balance" name="balance" type="number" step="0.01" defaultValue={editing?.balance || 0} required className="bg-muted border-gray-200" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status" className="text-xs font-bold text-foreground">ESTADO</Label>
            <select id="status" name="status" defaultValue={editing?.status || "Active"} className="w-full h-10 px-3 py-2 rounded-md bg-muted border border-gray-200 text-sm outline-none">
              <option value="Active">Activa</option>
              <option value="Inactive">Inactiva</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-gray-200 text-muted-foreground">Cancelar</Button>
            <Button type="submit" className="rounded-xl bg-primary hover:bg-[#3b55d9] text-primary-foreground">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? "Guardar Cambios" : "Crear Cuenta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AccountsFilterPopoverProps {
  filterType: string;
  setFilterType: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  onReset: () => void;
}

function AccountsFilterPopover({
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  onReset,
}: AccountsFilterPopoverProps) {
  const isFiltered = filterType !== "all" || filterStatus !== "all";
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
      <PopoverContent className="w-60 rounded-2xl glass-card border-0 shadow-2xl p-4" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Tipo de Cuenta</h4>
            <select
              aria-label="Filtrar por tipo de cuenta"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs font-semibold outline-none"
            >
              <option value="all">Todos los tipos</option>
              <option value="Bank">Banco</option>
              <option value="Cash">Efectivo (Cash)</option>
              <option value="Digital">Digital / Crypto</option>
            </select>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Estado</h4>
            <select
              aria-label="Filtrar por estado"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs font-semibold outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="Active">Activa</option>
              <option value="Inactive">Inactiva</option>
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
