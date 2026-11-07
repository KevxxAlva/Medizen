import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  X,
  Pencil,
  Trash2,
  ChevronLeft,
  Filter,
  Boxes,
  Package,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Copy,
  Check,
  Download,
  Minus,
  Layers,
  Loader2,
  Syringe,
  Stethoscope,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  useStocks,
  useCreateStock,
  useUpdateStock,
  useDeleteStock,
  type StockItem,
} from "@/lib/api/inventory";
import { toast } from "sonner";

// Categorías oficiales de inventario clínico
export const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  "Medical Supplies": {
    label: "Insumos Médicos",
    icon: Stethoscope,
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  "Consumables": {
    label: "Material Descartable",
    icon: Syringe,
    color: "text-purple-500 dark:text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  "Equipment": {
    label: "Equipos Médicos",
    icon: Package,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  "Office": {
    label: "Papelería y Oficina",
    icon: Layers,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
};

function getCategoryMeta(categoryName: string) {
  return (
    CATEGORY_MAP[categoryName] || {
      label: categoryName || "General",
      icon: Boxes,
      color: "text-slate-500 dark:text-slate-400",
      bg: "bg-slate-500/10 border-slate-500/20",
    }
  );
}

function formatSku(id: string): string {
  if (!id) return "SKU-0000";
  // Si es un UUID largo, creamos un SKU clínico legible y elegante
  if (id.includes("-")) {
    const parts = id.split("-");
    const prefix = parts[0].slice(0, 3).toUpperCase();
    const suffix = parts[parts.length - 1].slice(-4).toUpperCase();
    return `MED-${prefix}${suffix}`;
  }
  return id.length > 10 ? `SKU-${id.slice(-6).toUpperCase()}` : id.toUpperCase();
}

export function StocksPage() {
  const { data: items = [], isLoading, refetch, isFetching } = useStocks();
  const createItem = useCreateStock();
  const updateItem = useUpdateStock();
  const deleteItem = useDeleteStock();

  const [q, setQ] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "quantity-asc" | "quantity-desc">("name");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [adjustModalItem, setAdjustModalItem] = useState<StockItem | null>(null);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Estadísticas KPI Globales
  const stats = useMemo(() => {
    const totalArticles = items.length;
    const totalUnits = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    const lowStockCount = items.filter(
      (it) => it.status === "Low Stock" || (it.quantity > 0 && it.quantity <= 100)
    ).length;
    const outOfStockCount = items.filter(
      (it) => it.status === "Out of Stock" || it.quantity === 0
    ).length;
    const inStockCount = items.filter(
      (it) => it.status === "In Stock" && it.quantity > 100
    ).length;

    return { totalArticles, totalUnits, lowStockCount, outOfStockCount, inStockCount };
  }, [items]);

  // Filtrado y ordenamiento de la lista
  const filtered = useMemo(() => {
    let result = items.filter((item) => {
      if (q) {
        const term = q.toLowerCase();
        const skuFormatted = formatSku(item.id).toLowerCase();
        const catMeta = getCategoryMeta(item.category);
        const matchName = item.name.toLowerCase().includes(term);
        const matchCat =
          item.category.toLowerCase().includes(term) ||
          catMeta.label.toLowerCase().includes(term);
        const matchSku = item.id.toLowerCase().includes(term) || skuFormatted.includes(term);
        if (!matchName && !matchCat && !matchSku) return false;
      }
      if (filterCategory !== "all" && item.category !== filterCategory) return false;
      if (filterStatus !== "all") {
        if (filterStatus === "In Stock" && (item.status !== "In Stock" || item.quantity <= 100)) return false;
        if (filterStatus === "Low Stock" && item.status !== "Low Stock" && !(item.quantity > 0 && item.quantity <= 100)) return false;
        if (filterStatus === "Out of Stock" && item.status !== "Out of Stock" && item.quantity !== 0) return false;
      }
      return true;
    });

    // Ordenamiento
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "quantity-asc") return a.quantity - b.quantity;
      if (sortBy === "quantity-desc") return b.quantity - a.quantity;
      return 0;
    });

    return result;
  }, [items, q, filterCategory, filterStatus, sortBy]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCopySku = (fullId: string) => {
    navigator.clipboard.writeText(fullId);
    setCopiedSku(fullId);
    toast.success("ID copiado al portapapeles");
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginated.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar "${name}" del inventario?`)) {
      try {
        await deleteItem.mutateAsync(id);
        toast.success("Artículo eliminado con éxito");
      } catch {
        toast.error("Error al eliminar el artículo");
      }
    }
  };

  const handleQuickAdjust = async (item: StockItem, delta: number) => {
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    const newStatus: StockItem["status"] =
      newQty === 0 ? "Out of Stock" : newQty <= 100 ? "Low Stock" : "In Stock";

    try {
      await updateItem.mutateAsync({
        ...item,
        quantity: newQty,
        status: newStatus,
      });
      toast.success(
        delta > 0
          ? `+${delta} unidades añadidas a ${item.name}`
          : `${delta} unidades descontadas de ${item.name}`
      );
    } catch {
      toast.error("Error al actualizar la cantidad");
    }
  };

  const handleSave = async (itemData: {
    name: string;
    category: string;
    quantity: number;
    status: "In Stock" | "Low Stock" | "Out of Stock";
    id?: string;
  }) => {
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
    const headers = ["ID", "SKU", "Nombre", "Categoría", "Cantidad", "Estado"];
    const rows = items.map((it) => [
      `"${it.id}"`,
      `"${formatSku(it.id)}"`,
      `"${it.name.replace(/"/g, '""')}"`,
      `"${getCategoryMeta(it.category).label}"`,
      it.quantity,
      `"${it.status === "In Stock" ? "En Stock" : it.status === "Low Stock" ? "Stock Bajo" : "Agotado"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventario_FemeSalud_${new Date().toISOString().slice(0, 10)}.csv`);
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

  const allSelectedOnPage =
    paginated.length > 0 && paginated.every((p) => selectedIds.has(p.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 font-sans pb-10">
      {/* 1. TOP HEADER & ACCIONES PRINCIPALES */}
      <div className="glass-card rounded-[2rem] p-5 sm:p-6 border border-border/80 shadow-lg shadow-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="h-10 w-10 rounded-2xl bg-muted/60 hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Volver"
            aria-label="Volver"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                Activos Físicos
              </span>
              <span className="text-xs text-muted-foreground font-medium">• Clínica</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight mt-0.5">
              Inventario de Existencias
            </h1>
          </div>
        </div>

        {/* Buscador central y acciones de cabecera */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por insumo, SKU o categoría..."
              className="pl-10 pr-9 h-11 rounded-2xl bg-background/80 border-border/70 text-xs font-medium placeholder:text-muted-foreground/70 focus-visible:ring-primary shadow-xs"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={exportToCsv}
            className="h-11 px-3.5 rounded-2xl border-border/80 text-xs font-bold gap-2 text-foreground/80 hover:text-foreground hover:bg-muted/80 shadow-xs cursor-pointer"
            title="Exportar a archivo CSV"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            className="h-11 w-11 p-0 rounded-2xl border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/80 shadow-xs cursor-pointer"
            title="Actualizar datos"
          >
            <Loader2 className={cn("h-4 w-4", isFetching && "animate-spin text-primary")} />
          </Button>

          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="h-11 px-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 shadow-lg shadow-primary/25 cursor-pointer transition-all duration-200 hover:shadow-primary/35"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Añadir Artículo</span>
          </Button>
        </div>
      </div>

      {/* 2. TARJETAS DE INDICADORES CLÍNICOS (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Artículos */}
        <div className="glass-card rounded-[1.75rem] p-4.5 border border-border/70 shadow-md shadow-black/5 flex items-center justify-between hover:-translate-y-0.5 transition-transform duration-200">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Total Insumos
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight tabular-nums">
              {stats.totalArticles}
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              Registrados en catálogo
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <Boxes className="h-6 w-6" />
          </div>
        </div>

        {/* Unidades Físicas */}
        <div className="glass-card rounded-[1.75rem] p-4.5 border border-border/70 shadow-md shadow-black/5 flex items-center justify-between hover:-translate-y-0.5 transition-transform duration-200">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Unidades en Stock
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight tabular-nums">
              {stats.totalUnits.toLocaleString("es-ES")}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Stock consolidado
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <Package className="h-6 w-6" />
          </div>
        </div>

        {/* Stock Bajo / Crítico */}
        <div
          onClick={() => {
            setFilterStatus(filterStatus === "Low Stock" ? "all" : "Low Stock");
            setCurrentPage(1);
          }}
          className={cn(
            "glass-card rounded-[1.75rem] p-4.5 border shadow-md shadow-black/5 flex items-center justify-between cursor-pointer hover:-translate-y-0.5 transition-all duration-200",
            filterStatus === "Low Stock"
              ? "border-amber-500/60 bg-amber-500/5 ring-2 ring-amber-500/20"
              : "border-border/70 hover:border-amber-500/40"
          )}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Stock Bajo
              </p>
              {stats.lowStockCount > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-500">
                  Alerta
                </span>
              )}
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-amber-500 tracking-tight tabular-nums">
              {stats.lowStockCount}
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              ≤ 100 unidades mínimas
            </p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Agotados */}
        <div
          onClick={() => {
            setFilterStatus(filterStatus === "Out of Stock" ? "all" : "Out of Stock");
            setCurrentPage(1);
          }}
          className={cn(
            "glass-card rounded-[1.75rem] p-4.5 border shadow-md shadow-black/5 flex items-center justify-between cursor-pointer hover:-translate-y-0.5 transition-all duration-200",
            filterStatus === "Out of Stock"
              ? "border-destructive/60 bg-destructive/5 ring-2 ring-destructive/20"
              : "border-border/70 hover:border-destructive/40"
          )}
        >
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Agotados
            </p>
            <h3
              className={cn(
                "text-2xl sm:text-3xl font-display font-bold tracking-tight tabular-nums",
                stats.outOfStockCount > 0 ? "text-destructive" : "text-foreground/70"
              )}
            >
              {stats.outOfStockCount}
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              {stats.outOfStockCount > 0 ? "Requieren reposición" : "Sin faltantes"}
            </p>
          </div>
          <div
            className={cn(
              "h-12 w-12 rounded-2xl border flex items-center justify-center shrink-0",
              stats.outOfStockCount > 0
                ? "bg-destructive/10 border-destructive/20 text-destructive"
                : "bg-muted border-border text-muted-foreground"
            )}
          >
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 3. BARRA DE SEGMENTACIÓN POR ESTADO Y FILTROS RÁPIDOS */}
      <div className="glass-card rounded-2xl p-2.5 sm:p-3 border border-border/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Tabs de estado estilo Pill */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-muted/40 rounded-xl border border-border/40">
          <button
            type="button"
            onClick={() => {
              setFilterStatus("all");
              setCurrentPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2",
              filterStatus === "all"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Todos los artículos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground font-semibold">
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterStatus("In Stock");
              setCurrentPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2",
              filterStatus === "In Stock"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>En Stock</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground font-semibold">
              {stats.inStockCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterStatus("Low Stock");
              setCurrentPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2",
              filterStatus === "Low Stock"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
            <span>Stock Bajo</span>
            {stats.lowStockCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                {stats.lowStockCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterStatus("Out of Stock");
              setCurrentPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2",
              filterStatus === "Out of Stock"
                ? "bg-destructive/15 text-destructive border border-destructive/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" />
            <span>Agotados</span>
            {stats.outOfStockCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-destructive/20 text-destructive font-bold">
                {stats.outOfStockCount}
              </span>
            )}
          </button>
        </div>

        {/* Filtros secundarios: Categoría y Orden */}
        <div className="flex items-center gap-2.5">
          <StocksFilterPopover
            filterCategory={filterCategory}
            setFilterCategory={(v) => {
              setFilterCategory(v);
              setCurrentPage(1);
            }}
            filterStatus={filterStatus}
            setFilterStatus={(v) => {
              setFilterStatus(v);
              setCurrentPage(1);
            }}
            onReset={() => {
              setFilterCategory("all");
              setFilterStatus("all");
              setCurrentPage(1);
            }}
          />

          {/* Selector de ordenamiento */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 px-3 rounded-xl bg-background border border-border/80 text-xs font-bold text-muted-foreground hover:text-foreground outline-none cursor-pointer"
            aria-label="Ordenar inventario"
          >
            <option value="name">Ordenar: Nombre (A-Z)</option>
            <option value="quantity-desc">Mayor cantidad</option>
            <option value="quantity-asc">Menor cantidad</option>
          </select>
        </div>
      </div>

      {/* 4. TABLA CLÍNICA PROFESIONAL */}
      <div className="glass-card rounded-[2rem] border border-border/80 shadow-xl shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-muted/50 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/80">
                <th className="py-4 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allSelectedOnPage}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Seleccionar todos los artículos"
                    className="rounded-md border-border text-primary focus:ring-primary/40 cursor-pointer h-4 w-4"
                  />
                </th>
                <th className="py-4 px-4">Artículo e Identificación</th>
                <th className="py-4 px-4">SKU Clínico</th>
                <th className="py-4 px-4">Categoría</th>
                <th className="py-4 px-4">Nivel de Stock</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-4 text-center">Ajuste Rápido</th>
                <th className="py-4 px-4 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                      <div className="h-14 w-14 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center text-muted-foreground">
                        <Package className="h-7 w-7 stroke-1" />
                      </div>
                      <h4 className="font-display font-bold text-base text-foreground">
                        No se encontraron insumos
                      </h4>
                      <p className="text-xs text-muted-foreground text-center">
                        {q || filterCategory !== "all" || filterStatus !== "all"
                          ? "No hay resultados para los filtros o el término de búsqueda actual."
                          : "Tu catálogo de inventario está vacío. Comienza registrando un nuevo insumo."}
                      </p>
                      {(q || filterCategory !== "all" || filterStatus !== "all") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setQ("");
                            setFilterCategory("all");
                            setFilterStatus("all");
                          }}
                          className="mt-2 text-xs rounded-xl font-bold"
                        >
                          Restablecer búsqueda
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((item) => {
                  const catMeta = getCategoryMeta(item.category);
                  const CatIcon = catMeta.icon;
                  const isLow = item.status === "Low Stock" || (item.quantity > 0 && item.quantity <= 100);
                  const isOut = item.status === "Out of Stock" || item.quantity === 0;
                  const skuFormatted = formatSku(item.id);
                  const isSelected = selectedIds.has(item.id);

                  // Porcentaje visual respecto a umbral óptimo (ej. 300 unidades base)
                  const stockHealthPct = Math.min(100, Math.round((item.quantity / 300) * 100));

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "group transition-colors hover:bg-muted/40",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(item.id)}
                          aria-label={`Seleccionar ${item.name}`}
                          className="rounded-md border-border text-primary focus:ring-primary/40 cursor-pointer h-4 w-4"
                        />
                      </td>

                      {/* Nombre y datos del artículo */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                              catMeta.bg
                            )}
                          >
                            <CatIcon className={cn("h-5 w-5", catMeta.color)} />
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm tracking-tight group-hover:text-primary transition-colors">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span>{catMeta.label}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SKU / Identificador elegante */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono font-bold bg-muted/60 border border-border/70 text-foreground/80 px-2.5 py-1 rounded-lg">
                            {skuFormatted}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopySku(item.id)}
                            className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                            title="Copiar ID completo"
                            aria-label="Copiar ID"
                          >
                            {copiedSku === item.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Categoría con Badge */}
                      <td className="py-4 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                            catMeta.bg,
                            catMeta.color
                          )}
                        >
                          <CatIcon className="h-3.5 w-3.5" />
                          <span>{catMeta.label}</span>
                        </span>
                      </td>

                      {/* Cantidad y Mini Barra de Existencias */}
                      <td className="py-4 px-4">
                        <div className="w-36 space-y-1.5">
                          <div className="flex items-baseline justify-between">
                            <span className="font-display font-bold text-base text-foreground tabular-nums">
                              {item.quantity.toLocaleString("es-ES")}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              unidades
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted/70 rounded-full overflow-hidden p-0.5 border border-border/40">
                            <div
                              style={{ width: `${Math.max(5, stockHealthPct)}%` }}
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                isOut
                                  ? "bg-destructive"
                                  : isLow
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              )}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full tracking-wide border shadow-2xs",
                            isOut
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : isLow
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
                              : "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full inline-block",
                              isOut
                                ? "bg-destructive"
                                : isLow
                                ? "bg-amber-500 animate-pulse"
                                : "bg-emerald-500"
                            )}
                          />
                          {isOut ? "Agotado" : isLow ? "Stock Bajo" : "En Stock"}
                        </span>
                      </td>

                      {/* Ajuste rápido (+ / -) */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                          <button
                            type="button"
                            disabled={item.quantity <= 0}
                            onClick={() => handleQuickAdjust(item, -1)}
                            className="h-7 w-7 rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                            title="Descontar 1 unidad"
                            aria-label="Descontar 1"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-foreground tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(item, 10)}
                            className="h-7 px-2 rounded-lg bg-card hover:bg-muted text-primary font-bold text-xs flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                            title="Añadir +10 unidades"
                            aria-label="Añadir 10"
                          >
                            +10
                          </button>
                        </div>
                      </td>

                      {/* Acciones principales */}
                      <td className="py-4 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(item);
                              setFormOpen(true);
                            }}
                            className="h-8 w-8 rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
                            title="Editar artículo"
                            aria-label={`Editar ${item.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.name)}
                            className="h-8 w-8 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors cursor-pointer"
                            title="Eliminar artículo"
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {filtered.length > 0 && (
          <div className="p-4 border-t border-border/80 bg-muted/20">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              entityLabel="artículos"
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* DIÁLOGO MODAL PROFESIONAL PARA CREAR / EDITAR */}
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

// -------------------------------------------------------------
// MODAL CLÍNICO DE CREACIÓN Y EDICIÓN
// -------------------------------------------------------------
interface StockFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: StockItem | null;
  onSave: (data: {
    name: string;
    category: string;
    quantity: number;
    status: "In Stock" | "Low Stock" | "Out of Stock";
    id?: string;
  }) => Promise<void>;
  isPending: boolean;
}

function StockFormDialog({
  open,
  onOpenChange,
  editing,
  onSave,
  isPending,
}: StockFormDialogProps) {
  const [qtyValue, setQtyValue] = useState<number>(editing ? editing.quantity : 100);

  React.useEffect(() => {
    if (editing) {
      setQtyValue(editing.quantity);
    } else {
      setQtyValue(100);
    }
  }, [editing, open]);

  const previewStatus = qtyValue === 0 ? "Agotado" : qtyValue <= 100 ? "Stock Bajo" : "En Stock";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const fd = new FormData(e.currentTarget);
    const qty = parseInt(fd.get("quantity") as string, 10) || 0;
    const status: StockItem["status"] =
      qty === 0 ? "Out of Stock" : qty <= 100 ? "Low Stock" : "In Stock";

    const itemData = {
      name: (fd.get("name") as string).trim(),
      category: fd.get("category") as string,
      quantity: qty,
      status,
      id: editing?.id,
    };
    await onSave(itemData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 glass-card border border-border shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2.5 text-primary">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-display font-bold text-foreground">
                {editing ? "Editar Insumo de Inventario" : "Registrar Nuevo Insumo"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Actualiza las existencias, categoría y umbral de alerta clínica.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-bold text-foreground uppercase tracking-wide">
              Nombre del Insumo / Material *
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={editing?.name}
              placeholder="Ej. Guantes Quirúrgicos (Caja x 100)"
              required
              className="h-11 rounded-xl bg-background/80 border-border text-xs font-medium placeholder:text-muted-foreground focus-visible:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-bold text-foreground uppercase tracking-wide">
                Categoría
              </Label>
              <select
                id="category"
                name="category"
                defaultValue={editing?.category || "Medical Supplies"}
                className="w-full h-11 px-3 rounded-xl bg-background border border-border text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="Medical Supplies">Insumos Médicos</option>
                <option value="Consumables">Material Descartable</option>
                <option value="Equipment">Equipos Médicos</option>
                <option value="Office">Papelería y Oficina</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-xs font-bold text-foreground uppercase tracking-wide">
                Cantidad Inicial *
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                value={qtyValue}
                onChange={(e) => setQtyValue(parseInt(e.target.value, 10) || 0)}
                required
                className="h-11 rounded-xl bg-background/80 border-border text-xs font-bold tabular-nums focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Indicador previo de estado calculado */}
          <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Estado calculado:</span>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-bold",
                previewStatus === "Agotado"
                  ? "bg-destructive/15 text-destructive"
                  : previewStatus === "Stock Bajo"
                  ? "bg-amber-500/15 text-amber-500"
                  : "bg-emerald-500/15 text-emerald-500"
              )}
            >
              {previewStatus}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-border text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 cursor-pointer"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Guardar Cambios" : "Guardar Insumo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// -------------------------------------------------------------
// POPOVER DE FILTRADO AVANZADO
// -------------------------------------------------------------
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
            "flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer shadow-2xs",
            isFiltered
              ? "bg-primary/10 border-primary text-primary"
              : "bg-background border-border/80 text-muted-foreground hover:text-foreground"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>{isFiltered ? "Filtros Activos" : "Filtrar"}</span>
          {isFiltered && (
            <span className="h-2 w-2 rounded-full bg-primary inline-block" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-68 rounded-3xl glass-card border border-border shadow-2xl p-4.5" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-foreground">
              Filtros Avanzados
            </h4>
            {isFiltered && (
              <button
                type="button"
                onClick={onReset}
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                Limpiar todo
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Categoría
            </Label>
            <select
              aria-label="Filtrar por categoría"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-semibold text-foreground outline-none cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              <option value="Medical Supplies">Insumos Médicos</option>
              <option value="Consumables">Material Descartable</option>
              <option value="Equipment">Equipos Médicos</option>
              <option value="Office">Papelería y Oficina</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Estado de Existencias
            </Label>
            <select
              aria-label="Filtrar por estado de stock"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-semibold text-foreground outline-none cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="In Stock">En Stock</option>
              <option value="Low Stock">Stock Bajo (≤ 100)</option>
              <option value="Out of Stock">Agotados (0)</option>
            </select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
