import { useState } from "react";
import { Search, Plus, X, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, Box, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { TablePagination } from "@/components/ui/table-pagination";
import { useStocks, useCreateStock, useUpdateStock, useDeleteStock, type StockItem } from "@/lib/api/inventory";
import { toast } from "sonner";

export function StocksPage() {
  const { data: items = [], isLoading } = useStocks();
  const createItem = useCreateStock();
  const updateItem = useUpdateStock();
  const deleteItem = useDeleteStock();
  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = items.filter((item) => {
    if (q) {
      const term = q.toLowerCase();
      if (!(item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term))) {
        return false;
      }
    }
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este artículo del inventario?")) {
      try {
        await deleteItem.mutateAsync(id);
        toast.success("Artículo eliminado");
      } catch (e) {
        toast.error("Error al eliminar el artículo");
      }
    }
  };

  const handleSave = async (itemData: { name: string; category: string; quantity: number; status: "In Stock" | "Low Stock" | "Out of Stock"; id?: string }) => {
    try {
      if (itemData.id) {
        await updateItem.mutateAsync(itemData as StockItem);
        toast.success("Artículo actualizado");
      } else {
        await createItem.mutateAsync(itemData);
        toast.success("Artículo añadido");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error("Error al guardar el artículo");
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
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => window.history.back()} className="text-muted-foreground hover:text-foreground" title="Volver" aria-label="Volver"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold text-foreground">Inventario de Existencias</h1>
        </div>
        <div className="flex-1 max-w-xl mx-auto w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-full bg-muted border border-border/50 px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar artículos de inventario…"
              aria-label="Buscar artículos de inventario"
              className="w-full bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40 rounded-lg px-1 placeholder:text-muted-foreground text-foreground"
            />
            {q && <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-4 hidden md:flex"></div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border/40 pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Box className="h-4 w-4" /> {filtered.length} artículos
        </div>
        <div className="flex items-center gap-3">
          <StocksFilterPopover
            filterCategory={filterCategory}
            setFilterCategory={(v) => { setFilterCategory(v); setCurrentPage(1); }}
            filterStatus={filterStatus}
            setFilterStatus={(v) => { setFilterStatus(v); setCurrentPage(1); }}
            onReset={() => { setFilterCategory("all"); setFilterStatus("all"); setCurrentPage(1); }}
          />
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#3451d6] transition">
            <Plus className="h-3.5 w-3.5" /> Añadir Artículo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="p-4 w-12 rounded-tl-xl"><input type="checkbox" aria-label="Seleccionar todos los insumos" className="rounded border-gray-300" /></th>
              <th className="p-4">Nombre del Artículo <span className="ml-1">↕</span></th>
              <th className="p-4">SKU / ID <span className="ml-1">↕</span></th>
              <th className="p-4">Categoría <span className="ml-1">↕</span></th>
              <th className="p-4">Cantidad <span className="ml-1">↕</span></th>
              <th className="p-4">Estado <span className="ml-1">↕</span></th>
              <th className="p-4 rounded-tr-xl">Acción <span className="ml-1">↕</span></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginated.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-muted-foreground font-medium">No se encontraron artículos en stock.</td></tr>
            ) : (
              paginated.map((item) => (
                <tr key={item.id} className="border-b border-border/40 hover:bg-muted/50 transition group">
                  <td className="p-4"><input type="checkbox" aria-label={`Seleccionar insumo ${item.name}`} className="rounded border-gray-300" /></td>
                  <td className="p-4 font-bold text-foreground">{item.name}</td>
                  <td className="p-4 text-muted-foreground font-medium">{item.id}</td>
                  <td className="p-4 text-muted-foreground font-medium">{item.category}</td>
                  <td className="p-4 font-bold text-foreground">{item.quantity}</td>
                  <td className="p-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide",
                      item.status === "In Stock" ? "bg-green-50 text-green-600 border border-green-100" : 
                      item.status === "Low Stock" ? "bg-yellow-50 text-yellow-600 border border-yellow-100" :
                      "bg-destructive/10 text-destructive border border-red-100"
                    )}>
                      {item.status === "In Stock" ? "En Stock" : item.status === "Low Stock" ? "Stock Bajo" : "Agotado"}
                    </span>
                  </td>
                  <TableRowActions
                    editLabel={`Editar insumo ${item.name}`}
                    deleteLabel={`Eliminar insumo ${item.name}`}
                    onEdit={() => { setEditing(item); setFormOpen(true); }}
                    onDelete={() => handleDelete(item.id)}
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
        entityLabel="artículos"
        onPageChange={setCurrentPage}
      />

      <StockFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSave={handleSave}
        isPending={createItem.isPending || updateItem.isPending}
      />
    </div>
  );
}

interface StockFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: StockItem | null;
  onSave: (data: { name: string; category: string; quantity: number; status: "In Stock" | "Low Stock" | "Out of Stock"; id?: string }) => Promise<void>;
  isPending: boolean;
}

function StockFormDialog({ open, onOpenChange, editing, onSave, isPending }: StockFormDialogProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const fd = new FormData(e.currentTarget);
    const qty = parseInt(fd.get("quantity") as string, 10);
    const status = qty === 0 ? "Out of Stock" : qty <= 100 ? "Low Stock" : "In Stock";
    const itemData = {
      name: fd.get("name") as string,
      category: fd.get("category") as string,
      quantity: qty,
      status: status as "In Stock" | "Low Stock" | "Out of Stock",
      id: editing?.id,
    };
    await onSave(itemData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Artículo" : "Añadir Nuevo Artículo"}</DialogTitle>
          <DialogDescription>Actualizar niveles y detalles de inventario.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold text-foreground">NOMBRE DEL ARTÍCULO *</Label>
            <Input id="name" name="name" defaultValue={editing?.name} placeholder="Ej. Guantes Quirúrgicos" required className="bg-muted border-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs font-bold text-foreground">CATEGORÍA</Label>
              <select id="category" name="category" defaultValue={editing?.category || "Medical Supplies"} className="w-full h-10 px-3 py-2 rounded-md bg-muted border border-gray-200 text-sm outline-none">
                <option value="Medical Supplies">Insumos Médicos</option>
                <option value="Consumables">Consumibles</option>
                <option value="Equipment">Equipos</option>
                <option value="Office">Oficina</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-xs font-bold text-foreground">CANTIDAD *</Label>
              <Input id="quantity" name="quantity" type="number" min="0" defaultValue={editing?.quantity || 0} required className="bg-muted border-gray-200" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-gray-200 text-muted-foreground">Cancelar</Button>
            <Button type="submit" className="rounded-xl bg-primary hover:bg-[#3b55d9] text-primary-foreground">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? "Guardar Cambios" : "Guardar Artículo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface StocksFilterPopoverProps {
  filterCategory: string;
  setFilterCategory: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  onReset: () => void;
}

function StocksFilterPopover({
  filterCategory,
  setFilterCategory,
  filterStatus,
  setFilterStatus,
  onReset,
}: StocksFilterPopoverProps) {
  const isFiltered = filterCategory !== "all" || filterStatus !== "all";
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
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Categoría</h4>
            <select
              aria-label="Filtrar por categoría"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs font-semibold outline-none"
            >
              <option value="all">Todas las categorías</option>
              <option value="Medical Supplies">Insumos Médicos</option>
              <option value="Consumables">Consumibles</option>
              <option value="Equipment">Equipos</option>
              <option value="Office">Oficina</option>
            </select>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Estado de Stock</h4>
            <select
              aria-label="Filtrar por estado de stock"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs font-semibold outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="In Stock">En Stock</option>
              <option value="Low Stock">Stock Bajo</option>
              <option value="Out of Stock">Agotado</option>
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
