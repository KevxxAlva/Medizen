import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SalesFilterPopoverProps {
  filterMonth: string;
  setFilterMonth: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterMethod: string;
  setFilterMethod: (val: string) => void;
  onReset: () => void;
}

export function SalesFilterPopover({
  filterMonth,
  setFilterMonth,
  filterStatus,
  setFilterStatus,
  filterMethod,
  setFilterMethod,
  onReset,
}: SalesFilterPopoverProps) {
  const isFiltered = filterMonth !== "" || filterStatus !== "all" || filterMethod !== "all";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "flex items-center gap-2 rounded-xl text-xs font-bold transition-colors cursor-pointer",
            isFiltered
              ? "bg-primary/10 border-primary text-primary"
              : "border-border text-foreground hover:bg-muted"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>{isFiltered ? "Filtrado" : "Filtro"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 rounded-3xl glass-card border-border/60 shadow-xl" align="end">
        <div className="space-y-3.5">
          <div>
            <label
              htmlFor="sales-filter-month"
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1"
            >
              Mes de Emisión
            </label>
            <input
              id="sales-filter-month"
              type="month"
              aria-label="Filtrar por mes de emisión"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full text-xs font-medium bg-muted/50 border border-border rounded-xl px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="sales-filter-status"
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1"
            >
              Estado de Pago
            </label>
            <select
              id="sales-filter-status"
              aria-label="Filtrar por estado de pago"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs font-medium bg-muted/50 border border-border rounded-xl px-3 py-2 outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="sales-filter-method"
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1"
            >
              Método de Pago
            </label>
            <select
              id="sales-filter-method"
              aria-label="Filtrar por método de pago"
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full text-xs font-medium bg-muted/50 border border-border rounded-xl px-3 py-2 outline-none"
            >
              <option value="all">Todos los métodos</option>
              <option value="Pago Móvil">Pago Móvil</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Efectivo">Efectivo (Bs.)</option>
              <option value="Divisas">Divisas ($ / €)</option>
              <option value="Binance">Binance Pay (USDT)</option>
              <option value="Cashea">Cashea</option>
              <option value="Punto de Venta">Punto de Venta</option>
            </select>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="w-full text-center text-xs text-primary font-bold hover:underline pt-1 cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SalesFilterPopover;
