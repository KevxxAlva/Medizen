import { Search, Plus, X, ChevronLeft, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StocksHeaderProps {
  q: string;
  isFetching: boolean;
  onSearchChange: (value: string) => void;
  onExportCsv: () => void;
  onRefresh: () => void;
  onAddNew: () => void;
}

export function StocksHeader({
  q,
  isFetching,
  onSearchChange,
  onExportCsv,
  onRefresh,
  onAddNew,
}: StocksHeaderProps) {
  return (
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por insumo, SKU o categoría..."
            aria-label="Buscar por insumo, SKU o categoría"
            className="pl-10 pr-9 h-11 rounded-2xl bg-background/80 border-border/70 text-xs font-medium placeholder:text-muted-foreground/70 focus-visible:ring-primary shadow-xs"
          />
          {q && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Limpiar búsqueda"
              title="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onExportCsv}
          className="h-11 px-3.5 rounded-2xl border-border/80 text-xs font-bold gap-2 text-foreground/80 hover:text-foreground hover:bg-muted/80 shadow-xs cursor-pointer"
          title="Exportar a archivo CSV"
        >
          <Download className="h-4 w-4 text-muted-foreground" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          aria-label="Actualizar inventario"
          className="h-11 w-11 p-0 rounded-2xl border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/80 shadow-xs cursor-pointer"
          title="Actualizar datos"
        >
          <Loader2 className={cn("h-4 w-4", isFetching && "animate-spin text-primary")} />
        </Button>

        <Button
          type="button"
          onClick={onAddNew}
          className="h-11 px-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 shadow-lg shadow-primary/25 cursor-pointer transition-[background-color,box-shadow] duration-200 hover:shadow-primary/35"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Añadir Artículo</span>
        </Button>
      </div>
    </div>
  );
}
