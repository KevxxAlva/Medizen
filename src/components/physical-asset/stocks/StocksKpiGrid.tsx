import { Boxes, Package, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StockStats } from "./stockUtils";

interface StocksKpiGridProps {
  stats: StockStats;
  filterStatus: string;
  onToggleStatusFilter: (status: "Low Stock" | "Out of Stock") => void;
}

export function StocksKpiGrid({
  stats,
  filterStatus,
  onToggleStatusFilter,
}: StocksKpiGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      <button
        type="button"
        onClick={() => onToggleStatusFilter("Low Stock")}
        aria-pressed={filterStatus === "Low Stock"}
        className={cn(
          "glass-card rounded-[1.75rem] p-4.5 border shadow-md shadow-black/5 flex items-center justify-between text-left w-full cursor-pointer hover:-translate-y-0.5 transition-[transform,border-color,box-shadow,background-color] duration-200",
          filterStatus === "Low Stock"
            ? "border-amber-500/60 bg-amber-500/5 ring-2 ring-amber-500/20"
            : "border-border/70 hover:border-amber-500/40",
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
      </button>

      <button
        type="button"
        onClick={() => onToggleStatusFilter("Out of Stock")}
        aria-pressed={filterStatus === "Out of Stock"}
        className={cn(
          "glass-card rounded-[1.75rem] p-4.5 border shadow-md shadow-black/5 flex items-center justify-between text-left w-full cursor-pointer hover:-translate-y-0.5 transition-[transform,border-color,box-shadow,background-color] duration-200",
          filterStatus === "Out of Stock"
            ? "border-destructive/60 bg-destructive/5 ring-2 ring-destructive/20"
            : "border-border/70 hover:border-destructive/40",
        )}
      >
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Agotados
          </p>
          <h3
            className={cn(
              "text-2xl sm:text-3xl font-display font-bold tracking-tight tabular-nums",
              stats.outOfStockCount > 0 ? "text-destructive" : "text-foreground/70",
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
              : "bg-muted border-border text-muted-foreground",
          )}
        >
          <ShieldAlert className="h-6 w-6" />
        </div>
      </button>
    </div>
  );
}
