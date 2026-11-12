import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import type { StockSortBy, StockStats } from "./stockUtils";

interface StocksFilterBarProps {
  totalItems: number;
  stats: StockStats;
  filterCategory: string;
  filterStatus: string;
  sortBy: StockSortBy;
  onFilterCategoryChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onSortChange: (value: StockSortBy) => void;
  onResetFilters: () => void;
}

export function StocksFilterBar({
  totalItems,
  stats,
  filterCategory,
  filterStatus,
  sortBy,
  onFilterCategoryChange,
  onFilterStatusChange,
  onSortChange,
  onResetFilters,
}: StocksFilterBarProps) {
  return (
    <div className="glass-card rounded-2xl p-2.5 sm:p-3 border border-border/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-muted/40 rounded-xl border border-border/40">
        <button
          type="button"
          onClick={() => onFilterStatusChange("all")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2",
            filterStatus === "all"
              ? "bg-card text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span>Todos los artículos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground font-semibold">
            {totalItems}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onFilterStatusChange("In Stock")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2",
            filterStatus === "In Stock"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
              : "text-muted-foreground hover:text-foreground",
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
          onClick={() => onFilterStatusChange("Low Stock")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2",
            filterStatus === "Low Stock"
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs"
              : "text-muted-foreground hover:text-foreground",
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
          onClick={() => onFilterStatusChange("Out of Stock")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2",
            filterStatus === "Out of Stock"
              ? "bg-destructive/15 text-destructive border border-destructive/30 shadow-xs"
              : "text-muted-foreground hover:text-foreground",
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

      <div className="flex items-center gap-2.5">
        <StocksFilterPopover
          filterCategory={filterCategory}
          setFilterCategory={onFilterCategoryChange}
          filterStatus={filterStatus}
          setFilterStatus={onFilterStatusChange}
          onReset={onResetFilters}
        />

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as StockSortBy)}
          className="h-9 px-3 rounded-xl bg-background border border-border/80 text-xs font-bold text-muted-foreground hover:text-foreground outline-none cursor-pointer"
          aria-label="Ordenar inventario"
        >
          <option value="name">Ordenar: Nombre (A-Z)</option>
          <option value="quantity-desc">Mayor cantidad</option>
          <option value="quantity-asc">Menor cantidad</option>
        </select>
      </div>
    </div>
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
            "flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer shadow-2xs",
            isFiltered
              ? "bg-primary/10 border-primary text-primary"
              : "bg-background border-border/80 text-muted-foreground hover:text-foreground",
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>{isFiltered ? "Filtros Activos" : "Filtrar"}</span>
          {isFiltered && <span className="h-2 w-2 rounded-full bg-primary inline-block" />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-68 rounded-3xl glass-card border border-border shadow-2xl p-4.5"
        align="end"
      >
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
