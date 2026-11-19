import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  VE_ACCOUNT_TYPES,
  normalizeAccountType,
  getAccountTypeInfo,
  type FinancialAccount as Account,
  type VeAccountCategory,
  type AccountMetadata,
} from "@/lib/api/accounts";
import { VENEZUELAN_BANKS } from "@/lib/api/paymentMethods";

export interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Account | null;
  onSave: (data: {
    name: string;
    type: string;
    balance: number;
    status: "Active" | "Inactive";
    meta?: AccountMetadata;
    id?: string;
  }) => Promise<void>;
  isPending: boolean;
}

export function AccountFormDialog({
  open,
  onOpenChange,
  editing,
  onSave,
  isPending,
}: AccountFormDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<VeAccountCategory>("Bank");
  const [balance, setBalance] = useState("0");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [bankName, setBankName] = useState("");
  const [notes, setNotes] = useState("");

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (editing) {
        const norm = normalizeAccountType(editing.type, editing.name);
        setName(editing.name);
        setType(norm);
        setBalance(String(editing.balance ?? 0));
        setStatus(editing.status);
        setBankName(editing.meta?.bankName || "");
        setNotes(editing.meta?.notes || "");
      } else {
        setName("");
        setType("Bank");
        setBalance("0");
        setStatus("Active");
        setBankName("");
        setNotes("");
      }
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const typeInfo = getAccountTypeInfo(type, name);
    await onSave({
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      status,
      meta: {
        currency: typeInfo.currency,
        bankName: bankName || undefined,
        notes: notes || undefined,
      },
      id: editing?.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Editar ${editing.name}` : "Añadir Cuenta / Caja Financiera"}
          </DialogTitle>
          <DialogDescription>
            Configura dónde se reciben y custodian los cobros de la clínica (Bancos Bs., Caja Divisas, Efectivo Bs., Binance USDT o Cashea).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="acc-type" className="text-xs font-bold text-foreground">
              TIPO DE CUENTA EN VENEZUELA
            </Label>
            <select
              id="acc-type"
              value={type}
              onChange={(e) => {
                const nextType = e.target.value as VeAccountCategory;
                setType(nextType);
                if (!editing && !name) {
                  const found = VE_ACCOUNT_TYPES.find((t) => t.value === nextType);
                  if (found) setName(found.shortLabel);
                }
              }}
              className="w-full h-10 px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs font-bold outline-none"
            >
              {VE_ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-name" className="text-xs font-bold text-foreground">
              NOMBRE DE LA CUENTA / CAJA *
            </Label>
            <Input
              id="acc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cuenta Bancamiga (Bs.) o Caja Divisas ($)"
              required
              className="rounded-xl bg-muted/50"
            />
          </div>

          {type === "Bank" && (
            <div className="space-y-1.5">
              <Label htmlFor="acc-bank" className="text-xs font-bold text-foreground">
                BANCO NACIONAL (VENEZUELA)
              </Label>
              <select
                id="acc-bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full h-10 px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-semibold outline-none"
              >
                <option value="">-- Seleccionar Banco (Opcional) --</option>
                {VENEZUELAN_BANKS.map((b) => (
                  <option key={b.code} value={`${b.code} - ${b.name}`}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-balance" className="text-xs font-bold text-foreground">
                BALANCE ACTUAL ($ USD / USDT) *
              </Label>
              <Input
                id="acc-balance"
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
                className="rounded-xl bg-muted/50 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-status" className="text-xs font-bold text-foreground">
                ESTADO
              </Label>
              <select
                id="acc-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
                className="w-full h-10 px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-bold outline-none"
              >
                <option value="Active">Activa</option>
                <option value="Inactive">Inactiva</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-notes" className="text-xs font-bold text-foreground">
              DESCRIPCIÓN / NOTAS DE USO
            </Label>
            <Input
              id="acc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Recibe todos los cobros de Pago Móvil y Transferencias"
              className="rounded-xl bg-muted/50 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-primary text-primary-foreground cursor-pointer"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Guardar Cambios" : "Crear Cuenta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AccountFormDialog;
