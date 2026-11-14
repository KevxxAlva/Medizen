import { Pencil, Trash2, Package, Copy, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import type { StockItem } from "@/lib/api/inventory";
import { formatSku, getCategoryMeta } from "./stockUtils";

interface StocksTableProps {
  paginated: StockItem[];
  totalFiltered: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  hasActiveFilters: boolean;
  selectedIds: Set<string>;
  allSelectedOnPage: boolean;
  copiedSku: string | null;
  onSelectAll: (checked: boolean) => void;
  onToggleSelectRow: (id: string) => void;
  onCopySku: (id: string) => void;
  onQuickAdjust: (item: StockItem, delta: number) => void;
  onEdit: (item: StockItem) => void;
  onDelete: (id: string, name: string) => void;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
}

export function StocksTable({
  paginated,
  totalFiltered,
  currentPage,
  totalPages,
  itemsPerPage,
  hasActiveFilters,
  selectedIds,
  allSelectedOnPage,
  copiedSku,
  onSelectAll,
  onToggleSelectRow,
  onCopySku,
  onQuickAdjust,
  onEdit,
  onDelete,
  onPageChange,
  onResetFilters,
}: StocksTableProps) {
  return (
    <div className="glass-card rounded-[2rem] border border-border/80 shadow-xl shadow-black/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-muted/50 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/80">
              <th className="py-4 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={allSelectedOnPage}
                  onChange={(e) => onSelectAll(e.target.checked)}
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
              <StocksEmptyRow
                hasActiveFilters={hasActiveFilters}
                onResetFilters={onResetFilters}
              />
            ) : (
              paginated.map((item) => (
                <StocksTableRow
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.has(item.id)}
                  copiedSku={copiedSku}
                  onToggleSelect={() => onToggleSelectRow(item.id)}
                  onCopySku={() => onCopySku(item.id)}
                  onQuickAdjust={(delta) => onQuickAdjust(item, delta)}
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item.id, item.name)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalFiltered > 0 && (
        <div className="p-4 border-t border-border/80 bg-muted/20">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalFiltered}
            itemsPerPage={itemsPerPage}
            entityLabel="artículos"
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

function StocksEmptyRow({
  hasActiveFilters,
  onResetFilters,
}: {
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}) {
  return (
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
            {hasActiveFilters
              ? "No hay resultados para los filtros o el término de búsqueda actual."
              : "Tu catálogo de inventario está vacío. Comienza registrando un nuevo insumo."}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="mt-2 text-xs rounded-xl font-bold"
            >
              Restablecer búsqueda
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function StockIdentityCell({ name, category }: { name: string; category: string }) {
  const catMeta = getCategoryMeta(category);
  const CatIcon = catMeta.icon;

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
          catMeta.bg,
        )}
      >
        <CatIcon className={cn("h-5 w-5", catMeta.color)} />
      </div>
      <div>
        <p className="font-bold text-foreground text-sm tracking-tight group-hover:text-primary transition-colors">
          {name}
        </p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
          <span>{catMeta.label}</span>
        </p>
      </div>
    </div>
  );
}

function StockSkuCell({
  id,
  isCopied,
  onCopy,
}: {
  id: string;
  isCopied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <code className="text-xs font-mono font-bold bg-muted/60 border border-border/70 text-foreground/80 px-2.5 py-1 rounded-lg">
        {formatSku(id)}
      </code>
      <button
        type="button"
        onClick={onCopy}
        className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
        title="Copiar ID completo"
        aria-label="Copiar ID"
      >
        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function StockCategoryBadge({ category }: { category: string }) {
  const catMeta = getCategoryMeta(category);
  const CatIcon = catMeta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        catMeta.bg,
        catMeta.color,
      )}
    >
      <CatIcon className="h-3.5 w-3.5" />
      <span>{catMeta.label}</span>
    </span>
  );
}

function StockQuantityBar({ quantity, status }: { quantity: number; status: StockItem["status"] }) {
  const isOut = status === "Out of Stock" || quantity === 0;
  const isLow = status === "Low Stock" || (quantity > 0 && quantity <= 100);
  const pct = Math.min(100, Math.round((quantity / 300) * 100));
  const barClass = isOut ? "bg-destructive" : isLow ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="w-36 space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-display font-bold text-base text-foreground tabular-nums">
          {quantity.toLocaleString("es-ES")}
        </span>
        <span className="text-[10px] text-muted-foreground font-semibold">unidades</span>
      </div>
      <div className="h-2 w-full bg-muted/70 rounded-full overflow-hidden p-0.5 border border-border/40">
        <div
          style={{ width: `${Math.max(5, pct)}%` }}
          className={cn("h-full rounded-full transition-[width] duration-300", barClass)}
        />
      </div>
    </div>
  );
}

function StockStatusBadge({ status, quantity }: { status: StockItem["status"]; quantity: number }) {
  const isOut = status === "Out of Stock" || quantity === 0;
  const isLow = status === "Low Stock" || (quantity > 0 && quantity <= 100);

  const containerClass = isOut
    ? "bg-destructive/10 text-destructive border-destructive/20"
    : isLow
      ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/25";

  const dotClass = isOut
    ? "bg-destructive"
    : isLow
      ? "bg-amber-500 animate-pulse"
      : "bg-emerald-500";

  const label = isOut ? "Agotado" : isLow ? "Stock Bajo" : "En Stock";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full tracking-wide border shadow-2xs",
        containerClass,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full inline-block", dotClass)} />
      {label}
    </span>
  );
}

function StockQuickAdjustControls({
  quantity,
  onAdjust,
}: {
  quantity: number;
  onAdjust: (delta: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
      <button
        type="button"
        disabled={quantity <= 0}
        onClick={() => onAdjust(-1)}
        className="h-7 w-7 rounded-lg bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
        title="Descontar 1 unidad"
        aria-label="Descontar 1"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center text-xs font-bold text-foreground tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onAdjust(10)}
        className="h-7 px-2 rounded-lg bg-card hover:bg-muted text-primary font-bold text-xs flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
        title="Añadir +10 unidades"
        aria-label="Añadir 10"
      >
        +10
      </button>
    </div>
  );
}

function StockActionButtons({
  name,
  onEdit,
  onDelete,
}: {
  name: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        className="h-8 w-8 rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
        title="Editar artículo"
        aria-label={`Editar ${name}`}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="h-8 w-8 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors cursor-pointer"
        title="Eliminar artículo"
        aria-label={`Eliminar ${name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function StocksTableRow({
  item,
  isSelected,
  copiedSku,
  onToggleSelect,
  onCopySku,
  onQuickAdjust,
  onEdit,
  onDelete,
}: {
  item: StockItem;
  isSelected: boolean;
  copiedSku: string | null;
  onToggleSelect: () => void;
  onCopySku: () => void;
  onQuickAdjust: (delta: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className={cn("group transition-colors hover:bg-muted/40", isSelected && "bg-primary/5")}>
      <td className="py-4 px-4 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          aria-label={`Seleccionar ${item.name}`}
          className="rounded-md border-border text-primary focus:ring-primary/40 cursor-pointer h-4 w-4"
        />
      </td>

      <td className="py-4 px-4">
        <StockIdentityCell name={item.name} category={item.category} />
      </td>

      <td className="py-4 px-4">
        <StockSkuCell id={item.id} isCopied={copiedSku === item.id} onCopy={onCopySku} />
      </td>

      <td className="py-4 px-4">
        <StockCategoryBadge category={item.category} />
      </td>

      <td className="py-4 px-4">
        <StockQuantityBar quantity={item.quantity} status={item.status} />
      </td>

      <td className="py-4 px-4">
        <StockStatusBadge status={item.status} quantity={item.quantity} />
      </td>

      <td className="py-4 px-4 text-center">
        <StockQuickAdjustControls quantity={item.quantity} onAdjust={onQuickAdjust} />
      </td>

      <td className="py-4 px-4 text-right pr-6">
        <StockActionButtons name={item.name} onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}
