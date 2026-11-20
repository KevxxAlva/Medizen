import React, { useState } from "react";
import {
  Package,
  ArrowLeft,
  Layers,
  Boxes,
  Plus,
  Stethoscope,
  Syringe,
  Cpu,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  WorkspaceHeaderTitle,
  WorkspaceStepHeader,
  WorkspaceStepper,
  WorkspaceStepperFooter,
} from "@/components/ui/workspace-stepper";
import { toast } from "sonner";
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

const STOCK_STEPS = [
  { id: "identity", title: "Identificación y Categoría", subtitle: "Nombre del material y clasificación" },
  { id: "quantity", title: "Existencias y Umbral", subtitle: "Cantidad en stock y estado clínico" },
];

const STOCK_CATEGORIES = [
  { value: "Medical Supplies", label: "Insumos Médicos", desc: "Guantes, gasas, gel, suturas", icon: Stethoscope },
  { value: "Consumables", label: "Material Descartable", desc: "Espéculos, jeringas, citobrush", icon: Syringe },
  { value: "Equipment", label: "Equipos Médicos", desc: "Instrumental, sensores, sondas", icon: Cpu },
  { value: "Office", label: "Papelería y Oficina", desc: "Récipes, carpetas, papel térmico", icon: FileText },
];

const SUGGESTED_SUPPLIES = [
  "Guantes Quirúrgicos (Caja x 100)",
  "Espéculos Vaginales Descartables",
  "Gel Conductor para Ecografía",
  "Citobrush / Espátula de Ayre",
  "Fijador Celular Citológico",
  "Jeringas Descartables 5cc",
  "Gasas Estériles (Paquete)",
  "Papel Térmico para Ecógrafo",
];

const QUICK_QUANTITIES = [25, 50, 100, 150, 200, 300, 500];

function StockSuccessView({
  savedSummary,
  isEdit,
  onResetForNew,
  onClose,
}: {
  savedSummary: StockFormPayload;
  isEdit: boolean;
  onResetForNew: () => void;
  onClose: () => void;
}) {
  const catLabel = STOCK_CATEGORIES.find((c) => c.value === savedSummary.category)?.label || savedSummary.category;
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
      <style>{`
        @keyframes medizen-box-draw { 0% { stroke-dashoffset: 320; opacity: 0; transform: translateY(6px); } 50% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 1; transform: translateY(0); } }
        @keyframes medizen-box-seal-pop { 0% { transform: scale(0.35); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes medizen-box-check { 0% { stroke-dashoffset: 60; } 100% { stroke-dashoffset: 0; } }
        .medizen-box-stroke { stroke-dasharray: 320; stroke-dashoffset: 320; animation: medizen-box-draw 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .medizen-box-seal { transform-origin: 73px 70px; opacity: 0; animation: medizen-box-seal-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.35s forwards; }
        .medizen-box-check-path { stroke-dasharray: 60; stroke-dashoffset: 60; animation: medizen-box-check 0.38s cubic-bezier(0.22, 1, 0.36, 1) 0.52s forwards; }
      `}</style>

      <div className="relative flex items-center justify-center mb-5">
        <div className="absolute h-28 w-28 rounded-full bg-emerald-500/15 animate-ping [animation-duration:1.8s]" />
        <div className="absolute h-24 w-24 rounded-full bg-primary/5" />
        <svg className="h-28 w-28 relative z-10" viewBox="0 0 100 100" fill="none">
          <path d="M46 16L74 31V63L46 78L18 63V31L46 16Z" className="fill-primary/10 stroke-primary medizen-box-stroke" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M18 31L46 46L74 31M46 46V78" className="stroke-primary medizen-box-stroke" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <g className="medizen-box-seal">
            <circle cx="73" cy="70" r="18" className="fill-emerald-500 stroke-card" strokeWidth="4" />
            <path d="M64.5 70.5L70 76L81.5 64" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="medizen-box-check-path" />
          </g>
        </svg>
      </div>

      <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 rounded-full">
        {isEdit ? "Existencias Actualizadas" : "Insumo Incorporado al Inventario"}
      </span>
      <h3 className="text-xl sm:text-2xl font-black text-foreground mt-3">
        {isEdit ? "¡Inventario Actualizado!" : "¡Insumo Registrado con Éxito!"}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md">
        El artículo <strong className="text-foreground">{savedSummary.name}</strong> quedó registrado en almacén y disponible para descuento automático en consultas.
      </p>

      <div className="mt-6 w-full max-w-md rounded-2xl border border-border/80 bg-muted/30 p-4 text-left shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-foreground truncate">{savedSummary.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{catLabel}</p>
          </div>
          <span className="text-sm font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl shrink-0 tabular-nums">
            {savedSummary.quantity} uds.
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Estado en Almacén:</span>
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-bold",
              savedSummary.status === "Out of Stock"
                ? "bg-destructive/15 text-destructive"
                : savedSummary.status === "Low Stock"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
            )}
          >
            {savedSummary.status === "Out of Stock"
              ? "Agotado"
              : savedSummary.status === "Low Stock"
                ? "Stock Bajo"
                : "En Stock Óptimo"}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
        {!isEdit && (
          <Button type="button" variant="outline" onClick={onResetForNew} className="w-full sm:w-auto h-10 rounded-2xl font-bold text-xs gap-1.5 cursor-pointer">
            <Plus className="h-4 w-4 text-primary" />
            Registrar Otro Insumo
          </Button>
        )}
        <Button type="button" onClick={onClose} className="w-full sm:w-auto flex-1 h-10 rounded-2xl bg-primary text-primary-foreground hover:bg-[#3451d6] font-bold text-xs shadow-sm shadow-primary/20 cursor-pointer">
          Listo, Volver a Inventario
        </Button>
      </div>
    </div>
  );
}

function StockStepFields({
  activeIndex,
  isEdit,
  nameValue,
  setNameValue,
  categoryValue,
  setCategoryValue,
  qtyValue,
  setQtyValue,
  previewStatus,
}: {
  activeIndex: number;
  isEdit: boolean;
  nameValue: string;
  setNameValue: (v: string) => void;
  categoryValue: string;
  setCategoryValue: (v: string) => void;
  qtyValue: number;
  setQtyValue: (v: number) => void;
  previewStatus: string;
}) {
  if (activeIndex === 0) {
    return (
      <div className="space-y-5 py-1 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-bold text-foreground">
            Nombre del Insumo o Material Clínico *
          </Label>
          <Input
            id="name"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            placeholder="Ej. Guantes Quirúrgicos (Caja x 100)"
            required
            className="h-10 rounded-xl text-sm"
          />

          {!isEdit && (
            <div className="pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Insumos frecuentes (haz clic para autocompletar):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SUPPLIES.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setNameValue(sug)}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-xl border font-semibold transition-colors cursor-pointer",
                      nameValue === sug
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/30 text-muted-foreground border-border/70 hover:text-foreground hover:bg-muted/60",
                    )}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-foreground">Categoría de Almacén</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {STOCK_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = categoryValue === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategoryValue(cat.value)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-[background-color,border-color,box-shadow] cursor-pointer",
                    active
                      ? "border-primary bg-primary/10 text-foreground shadow-xs ring-2 ring-primary/25"
                      : "border-border/70 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-foreground">{cat.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{cat.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-1 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="quantity" className="text-xs font-bold text-foreground">
          Cantidad en Existencia (Unidades) *
        </Label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Input
            id="quantity"
            type="number"
            min="0"
            value={qtyValue}
            onChange={(e) => setQtyValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
            required
            className="h-10 rounded-xl text-base font-black tabular-nums sm:w-44"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground mr-1">Cantidades rápidas:</span>
            {QUICK_QUANTITIES.map((qVal) => (
              <button
                key={qVal}
                type="button"
                onClick={() => setQtyValue(qVal)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
                  qtyValue === qVal
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:text-foreground",
                )}
              >
                {qVal}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-muted/35 border border-border/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-semibold">Estado de Alerta Calculado:</span>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-extrabold",
              previewStatus === "Agotado"
                ? "bg-destructive/15 text-destructive"
                : previewStatus === "Stock Bajo"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
            )}
          >
            {previewStatus}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          El sistema marca automáticamente como <strong>En Stock</strong> cuando supera las 100 unidades,{" "}
          <strong>Stock Bajo</strong> entre 1 y 100 unidades, y <strong>Agotado</strong> en 0 unidades.
        </p>
      </div>
    </div>
  );
}

export function StockFormDialog(props: StockFormDialogProps) {
  if (!props.open) return null;
  return <StockFormWorkspace key={props.editing?.id ?? "new"} {...props} />;
}

function StockLiveHeader({
  isEdit,
  previewStatus,
  nameValue,
  categoryLabel,
  qtyValue,
  onBack,
}: {
  isEdit: boolean;
  previewStatus: string;
  nameValue: string;
  categoryLabel: string;
  qtyValue: number;
  onBack: () => void;
}) {
  return (
    <header className="mb-6 space-y-3.5 pb-5 border-b border-border/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <WorkspaceHeaderTitle
          backLabel="Volver a Inventario"
          title={isEdit ? "Editar Insumo de Inventario" : "Registrar Nuevo Insumo"}
          badge="Almacén Clínico"
          onBack={onBack}
        />
        <span
          className={cn(
            "text-xs font-extrabold px-3 py-1.5 rounded-xl border w-fit",
            previewStatus === "Agotado"
              ? "bg-destructive/15 text-destructive border-destructive/30"
              : previewStatus === "Stock Bajo"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          )}
        >
          Estado: {previewStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-muted/35 border border-border/60 items-center">
        <div className="md:col-span-5 flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Package className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">Insumo / Material</span>
            <p className="text-xs sm:text-sm font-extrabold text-foreground truncate mt-1">{nameValue.trim() || "Nuevo Artículo de Almacén"}</p>
          </div>
        </div>
        <div className="md:col-span-4 flex items-center gap-2.5 min-w-0 md:border-l md:border-border/60 md:pl-3.5">
          <div className="h-9 w-9 rounded-xl bg-background border border-border/70 text-primary flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">Categoría</span>
            <p className="text-xs font-extrabold text-foreground truncate mt-1">{categoryLabel}</p>
          </div>
        </div>
        <div className="md:col-span-3 flex items-center gap-2.5 min-w-0 md:border-l md:border-border/60 md:pl-3.5">
          <div className="h-9 w-9 rounded-xl bg-background border border-border/70 text-emerald-500 flex items-center justify-center shrink-0">
            <Boxes className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">Existencias</span>
            <p className="text-sm font-black text-foreground truncate mt-1 tabular-nums">{qtyValue} unidades</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function StockFormWorkspace({ onOpenChange, editing, onSave, isPending }: StockFormDialogProps) {
  const [nameValue, setNameValue] = useState(editing?.name || "");
  const [categoryValue, setCategoryValue] = useState(editing?.category || "Medical Supplies");
  const [qtyValue, setQtyValue] = useState<number>(editing ? editing.quantity : 150);
  const [activeIndex, setActiveIndex] = useState(0);
  const [savedSummary, setSavedSummary] = useState<StockFormPayload | null>(null);

  const isEdit = Boolean(editing);
  const currentStep = STOCK_STEPS[activeIndex] ?? STOCK_STEPS[0];
  const previewStatus = qtyValue === 0 ? "Agotado" : qtyValue <= 100 ? "Stock Bajo" : "En Stock";
  const categoryLabel = STOCK_CATEGORIES.find((c) => c.value === categoryValue)?.label || "Insumos Médicos";

  const handleNextStep = () => {
    if (!nameValue.trim()) {
      toast.error("Por favor ingresa el nombre del insumo o material");
      return;
    }
    setActiveIndex((i) => Math.min(STOCK_STEPS.length - 1, i + 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    if (!nameValue.trim()) {
      toast.error("Por favor ingresa el nombre del insumo o material");
      return;
    }
    const qty = Math.max(0, Number(qtyValue) || 0);
    const status: StockItem["status"] = qty === 0 ? "Out of Stock" : qty <= 100 ? "Low Stock" : "In Stock";
    const payload: StockFormPayload = { name: nameValue.trim(), category: categoryValue, quantity: qty, status, id: editing?.id };

    try {
      await onSave(payload);
      setSavedSummary(payload);
    } catch {
      // Error toast is already handled by StocksPage
    }
  };

  const handleResetForNew = () => {
    setNameValue("");
    setCategoryValue("Medical Supplies");
    setQtyValue(150);
    setActiveIndex(0);
    setSavedSummary(null);
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] flex flex-col text-foreground w-full min-w-0 animate-in fade-in duration-200 max-w-7xl mx-auto">
      <StockLiveHeader
        isEdit={isEdit}
        previewStatus={previewStatus}
        nameValue={nameValue}
        categoryLabel={categoryLabel}
        qtyValue={qtyValue}
        onBack={() => onOpenChange(false)}
      />

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col lg:flex-row min-w-0">
        <WorkspaceStepper
          steps={STOCK_STEPS}
          activeIndex={activeIndex}
          isAllCompleted={Boolean(savedSummary)}
          sealedBadge="Insumo Guardado"
          sealedTitle="Inventario Actualizado"
          onSelectStep={setActiveIndex}
        />

        <div className="flex-1 min-w-0 lg:pl-8 flex flex-col justify-between">
          {savedSummary ? (
            <StockSuccessView
              savedSummary={savedSummary}
              isEdit={isEdit}
              onResetForNew={handleResetForNew}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <>
              <div className="min-w-0">
                <WorkspaceStepHeader
                  stepNumber={activeIndex + 1}
                  totalSteps={STOCK_STEPS.length}
                  title={currentStep.title}
                  subtitle={currentStep.subtitle}
                />

                <StockStepFields
                  activeIndex={activeIndex}
                  isEdit={isEdit}
                  nameValue={nameValue}
                  setNameValue={setNameValue}
                  categoryValue={categoryValue}
                  setCategoryValue={setCategoryValue}
                  qtyValue={qtyValue}
                  setQtyValue={setQtyValue}
                  previewStatus={previewStatus}
                />
              </div>

              <WorkspaceStepperFooter
                isFirstStep={activeIndex === 0}
                isLastStep={activeIndex === STOCK_STEPS.length - 1}
                isPending={isPending}
                canQuickSubmit={isEdit || Boolean(nameValue.trim())}
                submitLabel={isEdit ? "Guardar Cambios" : "Guardar Insumo"}
                onCancel={() => onOpenChange(false)}
                onPrev={() => setActiveIndex((i) => Math.max(0, i - 1))}
                onNext={handleNextStep}
              />
            </>
          )}
        </div>
      </form>
    </div>
  );
}
