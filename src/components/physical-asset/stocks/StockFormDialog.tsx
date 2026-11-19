import React, { useState, useEffect } from "react";
import {
  Package,
  Loader2,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
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
  {
    id: "identity",
    title: "Identificación y Categoría",
    subtitle: "Nombre del material y clasificación",
  },
  {
    id: "quantity",
    title: "Existencias y Umbral",
    subtitle: "Cantidad en stock y estado clínico",
  },
];

const STOCK_CATEGORIES = [
  {
    value: "Medical Supplies",
    label: "Insumos Médicos",
    desc: "Guantes, gasas, gel, suturas",
    icon: Stethoscope,
  },
  {
    value: "Consumables",
    label: "Material Descartable",
    desc: "Espéculos, jeringas, citobrush",
    icon: Syringe,
  },
  {
    value: "Equipment",
    label: "Equipos Médicos",
    desc: "Instrumental, sensores, sondas",
    icon: Cpu,
  },
  {
    value: "Office",
    label: "Papelería y Oficina",
    desc: "Récipes, carpetas, papel térmico",
    icon: FileText,
  },
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

export function StockFormDialog({
  open,
  onOpenChange,
  editing,
  onSave,
  isPending,
}: StockFormDialogProps) {
  const [nameValue, setNameValue] = useState(editing?.name || "");
  const [categoryValue, setCategoryValue] = useState(editing?.category || "Medical Supplies");
  const [qtyValue, setQtyValue] = useState<number>(editing ? editing.quantity : 150);
  const [activeIndex, setActiveIndex] = useState(0);
  const [savedSummary, setSavedSummary] = useState<StockFormPayload | null>(null);

  useEffect(() => {
    setNameValue(editing?.name || "");
    setCategoryValue(editing?.category || "Medical Supplies");
    setQtyValue(editing ? editing.quantity : 150);
    setActiveIndex(0);
    setSavedSummary(null);
  }, [editing, open]);

  if (!open) return null;

  const isEdit = Boolean(editing);
  const isFirstStep = activeIndex === 0;
  const isLastStep = activeIndex === STOCK_STEPS.length - 1;
  const isAllSealed = Boolean(savedSummary);
  const currentStep = STOCK_STEPS[activeIndex] ?? STOCK_STEPS[0];

  const previewStatus = qtyValue === 0 ? "Agotado" : qtyValue <= 100 ? "Stock Bajo" : "En Stock";
  const categoryLabel =
    STOCK_CATEGORIES.find((c) => c.value === categoryValue)?.label || "Insumos Médicos";

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
    const status: StockItem["status"] =
      qty === 0 ? "Out of Stock" : qty <= 100 ? "Low Stock" : "In Stock";

    const payload: StockFormPayload = {
      name: nameValue.trim(),
      category: categoryValue,
      quantity: qty,
      status,
      id: editing?.id,
    };

    try {
      await onSave(payload);
      setSavedSummary(payload);
    } catch {
      // El toast de error ya lo muestra StocksPage
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
      {/* Cabecera Superior Unificada */}
      <header className="mb-6 space-y-3.5 pb-5 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 shrink-0 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver a Inventario</span>
            </Button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                  {isEdit ? "Editar Insumo de Inventario" : "Registrar Nuevo Insumo"}
                </h1>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Almacén Clínico
                </span>
              </div>
            </div>
          </div>

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

        {/* Barra de Resumen en Vivo del Insumo */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-muted/35 border border-border/60 items-center">
          <div className="md:col-span-5 flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                Insumo / Material
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-foreground truncate mt-1">
                {nameValue.trim() || "Nuevo Artículo de Almacén"}
              </p>
            </div>
          </div>

          <div className="md:col-span-4 flex items-center gap-2.5 min-w-0 md:border-l md:border-border/60 md:pl-3.5">
            <div className="h-9 w-9 rounded-xl bg-background border border-border/70 text-primary flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                Categoría
              </span>
              <p className="text-xs font-extrabold text-foreground truncate mt-1">
                {categoryLabel}
              </p>
            </div>
          </div>

          <div className="md:col-span-3 flex items-center gap-2.5 min-w-0 md:border-l md:border-border/60 md:pl-3.5">
            <div className="h-9 w-9 rounded-xl bg-background border border-border/70 text-emerald-500 flex items-center justify-center shrink-0">
              <Boxes className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                Existencias
              </span>
              <p className="text-sm font-black text-foreground truncate mt-1 tabular-nums">
                {qtyValue} unidades
              </p>
            </div>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col lg:flex-row min-w-0">
        {/* Stepper Horizontal Móvil (< lg) */}
        <div className="lg:hidden mb-5 rounded-2xl border border-border/60 bg-muted/30 p-3.5">
          <div className="flex items-center justify-between relative">
            {STOCK_STEPS.map((step, idx) => {
              const isCompleted = isAllSealed || idx < activeIndex;
              const isActive = !isAllSealed && idx === activeIndex;
              const isLast = idx === STOCK_STEPS.length - 1;

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <button
                    type="button"
                    disabled={isAllSealed}
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-all cursor-pointer disabled:cursor-default",
                      isCompleted
                        ? "border-2 border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 ring-4 ring-primary/15"
                          : "border-2 border-border bg-background text-muted-foreground",
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : idx + 1}
                  </button>
                  {!isLast && (
                    <div className="flex-1 mx-2 h-0.5 rounded-full bg-border overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          isCompleted ? "w-full bg-emerald-500" : "w-0 bg-primary",
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-border/50">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary block">
                {isAllSealed ? "Insumo Guardado" : `Paso ${activeIndex + 1} de ${STOCK_STEPS.length}`}
              </span>
              <p className="text-sm font-bold text-foreground truncate">
                {isAllSealed ? "Inventario Actualizado" : currentStep.title}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-muted-foreground bg-background px-2.5 py-1 rounded-xl border border-border/60 shrink-0">
              {isAllSealed ? "2 / 2 ✓" : `${activeIndex + 1} / ${STOCK_STEPS.length}`}
            </span>
          </div>
        </div>

        {/* Stepper Vertical Lateral Escritorio (lg+) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 pr-7 border-r border-border/60 select-none">
          <div className="relative py-2">
            {STOCK_STEPS.map((step, idx) => {
              const isCompleted = isAllSealed || idx < activeIndex;
              const isActive = !isAllSealed && idx === activeIndex;
              const isLast = idx === STOCK_STEPS.length - 1;

              return (
                <div key={step.id} className="relative flex items-start justify-end gap-4 pb-8 last:pb-0">
                  {!isLast && (
                    <div
                      className={cn(
                        "absolute right-[17px] top-9 bottom-0 w-[2px] transition-colors",
                        isCompleted ? "bg-emerald-500/60" : "bg-border",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full",
                          isCompleted ? "bg-emerald-500" : "bg-muted-foreground/35",
                        )}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isAllSealed}
                    onClick={() => setActiveIndex(idx)}
                    className="text-right group cursor-pointer disabled:cursor-default focus:outline-none min-w-0 flex-1 pt-0.5"
                  >
                    <p
                      className={cn(
                        "text-xs font-bold transition-colors leading-snug",
                        isActive
                          ? "text-primary font-extrabold"
                          : isCompleted
                            ? "text-emerald-600 dark:text-emerald-400 font-bold"
                            : "text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      {step.subtitle}
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={isAllSealed}
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                      "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-all cursor-pointer disabled:cursor-default",
                      isCompleted
                        ? "border-2 border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-2xs"
                        : isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 ring-4 ring-primary/15"
                          : "border-2 border-primary/30 bg-background text-muted-foreground hover:border-primary/60",
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : idx + 1}
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Contenido Derecho: Paso Activo o Animación de Éxito */}
        <div className="flex-1 min-w-0 lg:pl-8 flex flex-col justify-between">
          {savedSummary ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
              <style>{`
                @keyframes medizen-box-draw {
                  0% { stroke-dashoffset: 320; opacity: 0; transform: translateY(6px); }
                  50% { opacity: 1; }
                  100% { stroke-dashoffset: 0; opacity: 1; transform: translateY(0); }
                }
                @keyframes medizen-box-seal-pop {
                  0% { transform: scale(0.35); opacity: 0; }
                  70% { transform: scale(1.08); opacity: 1; }
                  100% { transform: scale(1); opacity: 1; }
                }
                @keyframes medizen-box-check {
                  0% { stroke-dashoffset: 60; }
                  100% { stroke-dashoffset: 0; }
                }
                .medizen-box-stroke {
                  stroke-dasharray: 320;
                  stroke-dashoffset: 320;
                  animation: medizen-box-draw 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                .medizen-box-seal {
                  transform-origin: 73px 70px;
                  opacity: 0;
                  animation: medizen-box-seal-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.35s forwards;
                }
                .medizen-box-check-path {
                  stroke-dasharray: 60;
                  stroke-dashoffset: 60;
                  animation: medizen-box-check 0.38s cubic-bezier(0.22, 1, 0.36, 1) 0.52s forwards;
                }
              `}</style>

              {/* Ilustración SVG: Cubo de Inventario Clínico + Sello Checkmark Esmeralda */}
              <div className="relative flex items-center justify-center mb-5">
                <div className="absolute h-28 w-28 rounded-full bg-emerald-500/15 animate-ping [animation-duration:1.8s]" />
                <div className="absolute h-24 w-24 rounded-full bg-primary/5" />
                <svg
                  className="h-28 w-28 relative z-10"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Caja Isométrica de Almacén */}
                  <path
                    d="M46 16L74 31V63L46 78L18 63V31L46 16Z"
                    className="fill-primary/10 stroke-primary medizen-box-stroke"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18 31L46 46L74 31M46 46V78"
                    className="stroke-primary medizen-box-stroke"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Sello Circular Esmeralda con Checkmark */}
                  <g className="medizen-box-seal">
                    <circle
                      cx="73"
                      cy="70"
                      r="18"
                      className="fill-emerald-500 stroke-card"
                      strokeWidth="4"
                    />
                    <path
                      d="M64.5 70.5L70 76L81.5 64"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="medizen-box-check-path"
                    />
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
                El artículo <strong className="text-foreground">{savedSummary.name}</strong> quedó
                registrado en almacén y disponible para descuento automático en consultas.
              </p>

              {/* Tarjeta Resumen del Insumo */}
              <div className="mt-6 w-full max-w-md rounded-2xl border border-border/80 bg-muted/30 p-4 text-left shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-foreground truncate">
                      {savedSummary.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {STOCK_CATEGORIES.find((c) => c.value === savedSummary.category)?.label ||
                        savedSummary.category}
                    </p>
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetForNew}
                    className="w-full sm:w-auto h-10 rounded-2xl font-bold text-xs gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-primary" />
                    Registrar Otro Insumo
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="w-full sm:w-auto flex-1 h-10 rounded-2xl bg-primary text-primary-foreground hover:bg-[#3451d6] font-bold text-xs shadow-sm shadow-primary/20 cursor-pointer"
                >
                  Listo, Volver a Inventario
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="min-w-0">
                <div className="hidden lg:flex items-center justify-between pb-3.5 mb-5 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-extrabold">
                      {activeIndex + 1}
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-foreground leading-tight">
                        {currentStep.title}
                      </h2>
                      <p className="text-xs text-muted-foreground">{currentStep.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-3 py-1 rounded-xl border border-border/60">
                    Paso {activeIndex + 1} de {STOCK_STEPS.length}
                  </span>
                </div>

                {activeIndex === 0 ? (
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
                      <Label className="text-xs font-bold text-foreground">
                        Categoría de Almacén
                      </Label>
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
                                "flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
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
                                <p className="text-xs font-extrabold text-foreground">
                                  {cat.label}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {cat.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
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
                          <span className="text-[11px] font-bold text-muted-foreground mr-1">
                            Cantidades rápidas:
                          </span>
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
                        <span className="text-muted-foreground font-semibold">
                          Estado de Alerta Calculado:
                        </span>
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
                        El sistema marca automáticamente como <strong>En Stock</strong> cuando supera las
                        100 unidades, <strong>Stock Bajo</strong> entre 1 y 100 unidades, y{" "}
                        <strong>Agotado</strong> en 0 unidades.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pie de Navegación del Stepper */}
              <div className="mt-6 border-t border-border/60 pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                  className="rounded-2xl w-full sm:w-auto h-10 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancelar
                </Button>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                      disabled={isFirstStep || isPending}
                      className="rounded-2xl flex-1 sm:flex-initial h-10 px-4 text-xs font-bold gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>

                    {!isLastStep ? (
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        disabled={isPending}
                        className="rounded-2xl flex-1 sm:flex-initial bg-primary text-primary-foreground hover:bg-[#3451d6] shadow-sm shadow-primary/20 h-10 px-5 text-xs font-bold gap-1 cursor-pointer"
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="rounded-2xl flex-1 sm:flex-initial bg-primary text-primary-foreground hover:bg-[#3451d6] shadow-sm shadow-primary/20 hover:opacity-95 px-6 h-10 text-xs font-bold cursor-pointer"
                      >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Guardar Cambios" : "Guardar Insumo"}
                      </Button>
                    )}
                  </div>

                  {!isLastStep && (isEdit || nameValue.trim()) && (
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={isPending}
                      className="rounded-2xl h-10 px-4 text-xs font-bold cursor-pointer"
                    >
                      {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      {isEdit ? "Guardar Cambios" : "Guardar Insumo"}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
