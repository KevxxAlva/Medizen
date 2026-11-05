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
import { Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  VE_PAYMENT_PRESETS,
  VENEZUELAN_BANKS,
  type VePaymentCategory,
  type PaymentMethodDetails,
  type PaymentMethod,
  decodeCategoryDetails,
  inferCategoryFromMethod,
  getDefaultDetailsForCategory,
} from "@/lib/api/paymentMethods";
import type { Account } from "@/lib/api/accounts";
import type { RateType } from "@/hooks/useExchangeRate";
import { getCategoryIcon } from "./PaymentMethodsPage";

export interface PaymentMethodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: PaymentMethod | null;
  accounts: Account[];
  initialCategory?: VePaymentCategory;
  isPending: boolean;
  onSave: (payload: {
    name: string;
    category: VePaymentCategory;
    accountId: string;
    status: "Active" | "Inactive";
    details: PaymentMethodDetails;
  }) => void;
}

interface DetailProps {
  details: PaymentMethodDetails;
  setDetails: React.Dispatch<React.SetStateAction<PaymentMethodDetails>>;
}

function PagoMovilFields({ details, setDetails }: DetailProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="sm:col-span-3 space-y-1">
        <Label className="text-[11px] font-bold">Banco Receptor (Venezuela)</Label>
        <select
          aria-label="Banco Receptor"
          value={details.bank || ""}
          onChange={(e) =>
            setDetails((prev) => ({ ...prev, bank: e.target.value }))
          }
          className="w-full h-9 px-3 rounded-xl bg-background border border-border text-xs font-semibold outline-none"
        >
          <option value="">-- Seleccionar Banco --</option>
          {VENEZUELAN_BANKS.map((b) => (
            <option key={b.code} value={`${b.code} - ${b.name}`}>
              {b.code} — {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-[11px] font-bold">Teléfono Afiliado</Label>
        <Input
          placeholder="Ej. 0414-1234567"
          value={details.phone || ""}
          onChange={(e) =>
            setDetails((prev) => ({ ...prev, phone: e.target.value }))
          }
          className="rounded-xl h-9 text-xs bg-background"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-bold">RIF o Cédula</Label>
        <Input
          placeholder="Ej. J-12345678-9"
          value={details.documentId || ""}
          onChange={(e) =>
            setDetails((prev) => ({ ...prev, documentId: e.target.value }))
          }
          className="rounded-xl h-9 text-xs bg-background"
        />
      </div>
    </div>
  );
}

function TransferenciaFields({ details, setDetails }: DetailProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-[11px] font-bold">Banco</Label>
        <select
          aria-label="Banco de Transferencia"
          value={details.bank || ""}
          onChange={(e) =>
            setDetails((prev) => ({ ...prev, bank: e.target.value }))
          }
          className="w-full h-9 px-3 rounded-xl bg-background border border-border text-xs font-semibold outline-none"
        >
          <option value="">-- Seleccionar Banco --</option>
          {VENEZUELAN_BANKS.map((b) => (
            <option key={b.code} value={`${b.code} - ${b.name}`}>
              {b.code} — {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-bold">RIF o Cédula</Label>
        <Input
          placeholder="Ej. J-12345678-9"
          value={details.documentId || ""}
          onChange={(e) =>
            setDetails((prev) => ({ ...prev, documentId: e.target.value }))
          }
          className="rounded-xl h-9 text-xs bg-background"
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-[11px] font-bold">Número de Cuenta (20 dígitos)</Label>
        <Input
          placeholder="0134-0000-00-0000000000"
          maxLength={24}
          value={details.accountNumber || ""}
          onChange={(e) =>
            setDetails((prev) => ({ ...prev, accountNumber: e.target.value }))
          }
          className="rounded-xl h-9 text-xs font-mono bg-background"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-bold">Titular / Razón Social</Label>
        <Input
          placeholder="Ej. Clínica Medizen C.A."
          value={details.holderName || ""}
          onChange={(e) =>
            setDetails((prev) => ({ ...prev, holderName: e.target.value }))
          }
          className="rounded-xl h-9 text-xs bg-background"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-bold">Tipo de Cuenta</Label>
        <select
          aria-label="Tipo de Cuenta"
          value={details.accountType || "Corriente"}
          onChange={(e) =>
            setDetails((prev) => ({
              ...prev,
              accountType: e.target.value as "Corriente" | "Ahorro",
            }))
          }
          className="w-full h-9 px-3 rounded-xl bg-background border border-border text-xs font-semibold outline-none"
        >
          <option value="Corriente">Cuenta Corriente</option>
          <option value="Ahorro">Cuenta de Ahorro</option>
        </select>
      </div>
    </div>
  );
}

function BinanceFields({ details, setDetails }: DetailProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-[11px] font-bold">
          Correo Binance o Binance ID (Pay ID)
        </Label>
        <Input
          placeholder="Ej. pagos@clinica.com o ID 283948192"
          value={details.binanceId || ""}
          onChange={(e) =>
            setDetails((prev) => ({ ...prev, binanceId: e.target.value }))
          }
          className="rounded-xl h-9 text-xs bg-background"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-bold">Alias / Usuario Receptor</Label>
        <Input
          placeholder="Ej. Medizen_Oficial"
          value={details.holderName || ""}
          onChange={(e) =>
            setDetails((prev) => ({ ...prev, holderName: e.target.value }))
          }
          className="rounded-xl h-9 text-xs bg-background"
        />
      </div>
    </div>
  );
}

function CasheaFields({ details, setDetails }: DetailProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-[11px] font-bold">% de Inicial Predeterminado</Label>
        <select
          aria-label="Porcentaje de inicial Cashea"
          value={details.casheaDefaultInitialPct || 50}
          onChange={(e) =>
            setDetails((prev) => ({
              ...prev,
              casheaDefaultInitialPct: Number(e.target.value),
            }))
          }
          className="w-full h-9 px-3 rounded-xl bg-background border border-border text-xs font-semibold outline-none"
        >
          <option value={60}>Nivel 1 — 60% Inicial + 3 cuotas</option>
          <option value={50}>Nivel 2 — 50% Inicial + 3 cuotas</option>
          <option value={40}>Nivel 3+ — 40% Inicial + 3 cuotas</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-bold">Nombre de Aliado / Caja</Label>
        <Input
          placeholder="Ej. Aliado Cashea Medizen"
          value={details.holderName || ""}
          onChange={(e) =>
            setDetails((prev) => ({ ...prev, holderName: e.target.value }))
          }
          className="rounded-xl h-9 text-xs bg-background"
        />
      </div>
    </div>
  );
}

function CategoryDetailFields({
  category,
  details,
  setDetails,
}: {
  category: VePaymentCategory;
  details: PaymentMethodDetails;
  setDetails: React.Dispatch<React.SetStateAction<PaymentMethodDetails>>;
}) {
  switch (category) {
    case "Pago Móvil":
      return <PagoMovilFields details={details} setDetails={setDetails} />;
    case "Transferencia":
      return <TransferenciaFields details={details} setDetails={setDetails} />;
    case "Binance":
      return <BinanceFields details={details} setDetails={setDetails} />;
    case "Cashea":
      return <CasheaFields details={details} setDetails={setDetails} />;
    default:
      return null;
  }
}

function PaymentMethodFormContent({
  editing,
  accounts,
  initialCategory = "Pago Móvil",
  isPending,
  onSave,
  onOpenChange,
}: Omit<PaymentMethodFormDialogProps, "open">) {
  const [name, setName] = useState(() => {
    if (editing) return editing.name;
    const preset = VE_PAYMENT_PRESETS.find((p) => p.category === initialCategory);
    return preset ? preset.name : "";
  });

  const [category, setCategory] = useState<VePaymentCategory>(() => {
    if (editing) return inferCategoryFromMethod(editing.name, editing.category);
    return initialCategory;
  });

  const [accountId, setAccountId] = useState(() => editing?.account_id || "");

  const [status, setStatus] = useState<"Active" | "Inactive">(() => {
    return editing?.status === "Inactive" ? "Inactive" : "Active";
  });

  const [details, setDetails] = useState<PaymentMethodDetails>(() => {
    if (editing) return decodeCategoryDetails(editing.category);
    const preset = VE_PAYMENT_PRESETS.find((p) => p.category === initialCategory);
    return preset ? { ...preset.details } : getDefaultDetailsForCategory(initialCategory);
  });

  const handleCategoryChange = (cat: VePaymentCategory) => {
    setCategory(cat);
    const preset = VE_PAYMENT_PRESETS.find((p) => p.category === cat);
    if (preset) {
      if (!editing || name === "") {
        setName(preset.name);
      }
      setDetails({ ...preset.details });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, category, accountId, status, details });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* PLANTILLA DE CATEGORÍA */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Tipo de Método en Venezuela
        </Label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {VE_PAYMENT_PRESETS.map((p) => {
            const Icon = getCategoryIcon(p.category);
            const active = category === p.category;
            return (
              <button
                key={p.category}
                type="button"
                onClick={() => handleCategoryChange(p.category)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[11px] font-bold transition cursor-pointer",
                  active
                    ? "border-primary bg-primary/10 text-primary shadow-2xs"
                    : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate max-w-[58px]">{p.category}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pm-name" className="text-xs font-bold text-foreground">
            Nombre Visible en Recepción *
          </Label>
          <Input
            id="pm-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Pago Móvil Banesco"
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pm-account" className="text-xs font-bold text-foreground">
            Bóveda / Cuenta Financiera
          </Label>
          <select
            id="pm-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border text-xs font-semibold outline-none focus:border-primary"
          >
            <option value="">-- Caja General (Sin vincular) --</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pm-currency" className="text-xs font-bold text-foreground">
            Moneda Base
          </Label>
          <select
            id="pm-currency"
            value={details.currency || "VES"}
            onChange={(e) =>
              setDetails((prev) => ({
                ...prev,
                currency: e.target.value as PaymentMethodDetails["currency"],
              }))
            }
            className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border text-xs font-bold outline-none"
          >
            <option value="VES">Bolívares (Bs.)</option>
            <option value="USD">Dólares ($ USD)</option>
            <option value="USDT">USDT (Binance)</option>
            <option value="EUR">Euros (€ EUR)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pm-rate" className="text-xs font-bold text-foreground">
            Tasa Sugerida
          </Label>
          <select
            id="pm-rate"
            value={details.defaultRateType || "bcv"}
            onChange={(e) =>
              setDetails((prev) => ({
                ...prev,
                defaultRateType: e.target.value as RateType,
              }))
            }
            className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border text-xs font-bold outline-none"
          >
            <option value="bcv">Dólar BCV ($)</option>
            <option value="eur">Euro BCV (€)</option>
            <option value="usdt">USDT (Binance P2P)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pm-status" className="text-xs font-bold text-foreground">
            Estado
          </Label>
          <select
            id="pm-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
            className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border text-xs font-bold outline-none"
          >
            <option value="Active">Activo</option>
            <option value="Inactive">Inactivo</option>
          </select>
        </div>
      </div>

      {/* CAMPOS ESPECÍFICOS SEGÚN CATEGORÍA VENEZOLANA */}
      <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Datos Receptores ({category})
          </span>
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={details.requiresReference ?? true}
              onChange={(e) =>
                setDetails((prev) => ({
                  ...prev,
                  requiresReference: e.target.checked,
                }))
              }
              className="rounded accent-primary"
            />
            Solicitar N° de Referencia al cobrar
          </label>
        </div>

        <CategoryDetailFields
          category={category}
          details={details}
          setDetails={setDetails}
        />

        <div className="space-y-1">
          <Label className="text-[11px] font-bold">Instrucciones o Notas de Caja</Label>
          <Input
            placeholder="Ej. Verificar seriales de billetes o últimos 4 dígitos..."
            value={details.instructions || ""}
            onChange={(e) =>
              setDetails((prev) => ({ ...prev, instructions: e.target.value }))
            }
            className="rounded-xl h-9 text-xs bg-background"
          />
        </div>
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
          {editing ? "Guardar Cambios" : "Guardar Método"}
        </Button>
      </div>
    </form>
  );
}

export function PaymentMethodFormDialog({
  open,
  onOpenChange,
  editing,
  accounts,
  initialCategory = "Pago Móvil",
  isPending,
  onSave,
}: PaymentMethodFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editing ? `Editar ${editing.name}` : "Configurar Método de Pago"}
          </DialogTitle>
          <DialogDescription>
            Define la categoría, tasa referencial y los datos receptores que verá recepción
            al cobrar.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <PaymentMethodFormContent
            key={editing?.id || initialCategory}
            editing={editing}
            accounts={accounts}
            initialCategory={initialCategory}
            isPending={isPending}
            onSave={onSave}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PaymentMethodFormDialog;
