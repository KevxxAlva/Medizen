import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";

export interface CustomConsumableItem {
  id?: string;
  item_name: string;
  quantity: string;
  unit: string;
}

export interface ConsultationConsumablesTabProps {
  dynamicConsumables: Array<{ name: string; defaultUnit: string }>;
  commonQuantities: Record<string, string>;
  updateCommonQty: (name: string, val: string) => void;
  customConsumables: CustomConsumableItem[];
  addCustomConsumable: () => void;
  removeCustomConsumable: (idx: number) => void;
  updateCustomConsumable: (
    idx: number,
    key: "item_name" | "quantity" | "unit",
    val: string,
  ) => void;
}

export function ConsultationConsumablesTab({
  dynamicConsumables,
  commonQuantities,
  updateCommonQty,
  customConsumables,
  addCustomConsumable,
  removeCustomConsumable,
  updateCustomConsumable,
}: ConsultationConsumablesTabProps) {
  return (
    <TabsContent value="consumables" className="space-y-6 mt-0">
      <div className="bg-muted/30 p-4 rounded-2xl">
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
            Consumibles Clínicos de Uso Común
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Ingresa las cantidades de los materiales clínicos utilizados en esta sesión.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dynamicConsumables.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border/40 shadow-sm"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold truncate">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  Unidad: {item.defaultUnit}
                </p>
              </div>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={commonQuantities[item.name] ?? ""}
                onChange={(e) => updateCommonQty(item.name, e.target.value)}
                placeholder="0"
                className="w-20 text-center rounded-2xl font-semibold text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Materiales Clínicos Adicionales
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Agrega consumibles personalizados o medicamentos especiales utilizados.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomConsumable}
            className="rounded-2xl flex items-center gap-1 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar
          </Button>
        </div>

        {customConsumables.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No se han registrado consumibles adicionales.
          </p>
        ) : (
          <div className="space-y-3">
            {customConsumables.map((c, idx) => (
              <div
                key={c.id || c.item_name}
                className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-border/40 shadow-sm"
              >
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Nombre del material
                    </Label>
                    <Input
                      value={c.item_name}
                      onChange={(e) =>
                        updateCustomConsumable(idx, "item_name", e.target.value)
                      }
                      placeholder="Ej. Esparadrapo"
                      className="rounded-2xl text-xs h-9"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px] text-muted-foreground">Cantidad</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={c.quantity}
                      onChange={(e) =>
                        updateCustomConsumable(idx, "quantity", e.target.value)
                      }
                      placeholder="1"
                      className="rounded-2xl text-xs h-9 text-center"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[10px] text-muted-foreground">Unidad</Label>
                    <Input
                      value={c.unit}
                      onChange={(e) => updateCustomConsumable(idx, "unit", e.target.value)}
                      placeholder="Ej. U, cc, par, metros"
                      className="rounded-2xl text-xs h-9"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar insumo"
                  onClick={() => removeCustomConsumable(idx)}
                  className="text-destructive hover:bg-destructive/10 rounded-2xl mt-5 h-9 w-9 shrink-0 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Eliminar insumo</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
