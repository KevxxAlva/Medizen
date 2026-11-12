import React, { useState } from "react";
import { Package, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { StockItem } from "@/lib/api/inventory";

export interface StockFormPayload {
  name: string;
  category: string;
  quantity: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  id?: string;
}

interface StockFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: StockItem | null;
  onSave: (data: StockFormPayload) => Promise<void>;
  isPending: boolean;
}

export function StockFormDialog({
  open,
  onOpenChange,
  editing,
  onSave,
  isPending,
}: StockFormDialogProps) {
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

        <StockFormBody
          key={`${editing?.id ?? "new"}-${open ? "open" : "closed"}`}
          editing={editing}
          isPending={isPending}
          onCancel={() => onOpenChange(false)}
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  );
}

function StockFormBody({
  editing,
  isPending,
  onCancel,
  onSave,
}: {
  editing: StockItem | null;
  isPending: boolean;
  onCancel: () => void;
  onSave: (data: StockFormPayload) => Promise<void>;
}) {
  const [qtyValue, setQtyValue] = useState<number>(editing ? editing.quantity : 100);
  const previewStatus = qtyValue === 0 ? "Agotado" : qtyValue <= 100 ? "Stock Bajo" : "En Stock";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const fd = new FormData(e.currentTarget);
    const qty = parseInt(fd.get("quantity") as string, 10) || 0;
    const status: StockItem["status"] =
      qty === 0 ? "Out of Stock" : qty <= 100 ? "Low Stock" : "In Stock";

    await onSave({
      name: (fd.get("name") as string).trim(),
      category: fd.get("category") as string,
      quantity: qty,
      status,
      id: editing?.id,
    });
  };

  return (
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
          <Label
            htmlFor="category"
            className="text-xs font-bold text-foreground uppercase tracking-wide"
          >
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
          <Label
            htmlFor="quantity"
            className="text-xs font-bold text-foreground uppercase tracking-wide"
          >
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

      <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">Estado calculado:</span>
        <span
          className={cn(
            "px-2.5 py-0.5 rounded-full text-[11px] font-bold",
            previewStatus === "Agotado"
              ? "bg-destructive/15 text-destructive"
              : previewStatus === "Stock Bajo"
                ? "bg-amber-500/15 text-amber-500"
                : "bg-emerald-500/15 text-emerald-500",
          )}
        >
          {previewStatus}
        </span>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
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
  );
}
