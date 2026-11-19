import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
  useStocks,
  useCreateStock,
  useUpdateStock,
  useDeleteStock,
  type StockItem,
} from "@/lib/api/inventory";
import { toast } from "sonner";
import {
  CATEGORY_MAP,
  buildStocksCsvUri,
  computeStockStats,
  filterAndSortStocks,
  type StockSortBy,
} from "./stocks/stockUtils";
import { StocksHeader } from "./stocks/StocksHeader";
import { StocksKpiGrid } from "./stocks/StocksKpiGrid";
import { StocksFilterBar } from "./stocks/StocksFilterBar";
import { StocksTable } from "./stocks/StocksTable";
import { StockFormDialog, type StockFormPayload } from "./stocks/StockFormDialog";

export { CATEGORY_MAP };

export function StocksPage() {
  const { data: items = [], isLoading, refetch, isFetching } = useStocks();
  const createItem = useCreateStock();
  const updateItem = useUpdateStock();
  const deleteItem = useDeleteStock();

  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState<StockSortBy>("name");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const stats = useMemo(() => computeStockStats(items), [items]);
  const filtered = useMemo(
    () => filterAndSortStocks(items, q, filterCategory, filterStatus, sortBy),
    [items, q, filterCategory, filterStatus, sortBy],
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const allSelectedOnPage = paginated.length > 0 && paginated.every((p) => selectedIds.has(p.id));

  const handleCopySku = (fullId: string) => {
    navigator.clipboard.writeText(fullId);
    setCopiedSku(fullId);
    toast.success("ID copiado al portapapeles");
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(paginated.map((p) => p.id)) : new Set());
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${name}" del inventario?`)) return;
    try {
      await deleteItem.mutateAsync(id);
      toast.success("Artículo eliminado con éxito");
    } catch {
      toast.error("Error al eliminar el artículo");
    }
  };

  const handleQuickAdjust = async (item: StockItem, delta: number) => {
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    const newStatus: StockItem["status"] =
      newQty === 0 ? "Out of Stock" : newQty <= 100 ? "Low Stock" : "In Stock";
    try {
      await updateItem.mutateAsync({ ...item, quantity: newQty, status: newStatus });
      toast.success(
        delta > 0
          ? `+${delta} unidades añadidas a ${item.name}`
          : `${delta} unidades descontadas de ${item.name}`,
      );
    } catch {
      toast.error("Error al actualizar la cantidad");
    }
  };

  const handleSave = async (itemData: StockFormPayload) => {
    try {
      if (itemData.id) {
        await updateItem.mutateAsync(itemData as StockItem);
        toast.success("Artículo actualizado correctamente");
      } else {
        await createItem.mutateAsync(itemData);
        toast.success("Nuevo artículo registrado en el inventario");
      }
      setFormOpen(false);
    } catch {
      toast.error("Error al guardar el artículo");
    }
  };

  const exportToCsv = () => {
    if (!items.length) {
      toast.error("No hay datos para exportar");
      return;
    }
    const link = document.createElement("a");
    link.setAttribute("href", buildStocksCsvUri(items));
    link.setAttribute(
      "download",
      `Inventario_FemeSalud_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inventario exportado a CSV");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground animate-pulse">
          Cargando inventario de existencias...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 font-sans pb-10">
      <StocksHeader
        q={q}
        isFetching={isFetching}
        onSearchChange={(val) => {
          setQ(val);
          setCurrentPage(1);
        }}
        onExportCsv={exportToCsv}
        onRefresh={() => refetch()}
        onAddNew={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      />

      <StocksKpiGrid
        stats={stats}
        filterStatus={filterStatus}
        onToggleStatusFilter={(status) => {
          setFilterStatus(filterStatus === status ? "all" : status);
          setCurrentPage(1);
        }}
      />

      <StocksFilterBar
        totalItems={items.length}
        stats={stats}
        filterCategory={filterCategory}
        filterStatus={filterStatus}
        sortBy={sortBy}
        onFilterCategoryChange={(v) => {
          setFilterCategory(v);
          setCurrentPage(1);
        }}
        onFilterStatusChange={(v) => {
          setFilterStatus(v);
          setCurrentPage(1);
        }}
        onSortChange={setSortBy}
        onResetFilters={() => {
          setFilterCategory("all");
          setFilterStatus("all");
          setCurrentPage(1);
        }}
      />

      <StocksTable
        paginated={paginated}
        totalFiltered={filtered.length}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        hasActiveFilters={Boolean(q) || filterCategory !== "all" || filterStatus !== "all"}
        selectedIds={selectedIds}
        allSelectedOnPage={allSelectedOnPage}
        copiedSku={copiedSku}
        onSelectAll={handleSelectAll}
        onToggleSelectRow={toggleSelectRow}
        onCopySku={handleCopySku}
        onQuickAdjust={handleQuickAdjust}
        onEdit={(item) => {
          setEditing(item);
          setFormOpen(true);
        }}
        onDelete={handleDelete}
        onPageChange={setCurrentPage}
        onResetFilters={() => {
          setQ("");
          setFilterCategory("all");
          setFilterStatus("all");
        }}
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
