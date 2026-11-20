import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkspaceHeaderTitle({
  backLabel,
  title,
  badge,
  onBack,
}: {
  backLabel: string;
  title: string;
  badge: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-start sm:items-center gap-3 min-w-0">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onBack}
        className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 shrink-0 cursor-pointer shadow-2xs"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>{backLabel}</span>
      </Button>
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
          {title}
        </h1>
        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {badge}
        </span>
      </div>
    </div>
  );
}

export function WorkspaceStepHeader({
  stepNumber,
  totalSteps,
  title,
  subtitle,
}: {
  stepNumber: number;
  totalSteps: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="hidden lg:flex items-center justify-between pb-3.5 mb-5 border-b border-border/50">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-extrabold">
          {stepNumber}
        </span>
        <div>
          <h2 className="text-base font-bold text-foreground leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-3 py-1 rounded-xl border border-border/60">
        Paso {stepNumber} de {totalSteps}
      </span>
    </div>
  );
}

export interface WorkspaceStepItem {
  id: string;
  title: string;
  subtitle: string;
}

export function WorkspaceStepper({
  steps,
  activeIndex,
  isAllCompleted,
  sealedBadge,
  sealedTitle,
  onSelectStep,
}: {
  steps: WorkspaceStepItem[];
  activeIndex: number;
  isAllCompleted: boolean;
  sealedBadge: string;
  sealedTitle: string;
  onSelectStep: (idx: number) => void;
}) {
  const currentStep = steps[activeIndex] ?? steps[0];

  return (
    <>
      {/* Stepper Horizontal Móvil (< lg) */}
      <div className="lg:hidden mb-5 rounded-2xl border border-border/60 bg-muted/30 p-3.5">
        <div className="flex items-center justify-between relative">
          {steps.map((step, idx) => {
            const isCompleted = isAllCompleted || idx < activeIndex;
            const isActive = !isAllCompleted && idx === activeIndex;
            const isLast = idx === steps.length - 1;
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  disabled={isAllCompleted}
                  onClick={() => onSelectStep(idx)}
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors cursor-pointer disabled:cursor-default",
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
                        "h-full transition-[width,background-color] duration-300",
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
              {isAllCompleted ? sealedBadge : `Paso ${activeIndex + 1} de ${steps.length}`}
            </span>
            <p className="text-sm font-bold text-foreground truncate">
              {isAllCompleted ? sealedTitle : currentStep.title}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-muted-foreground bg-background px-2.5 py-1 rounded-xl border border-border/60 shrink-0">
            {isAllCompleted ? `${steps.length} / ${steps.length} ✓` : `${activeIndex + 1} / ${steps.length}`}
          </span>
        </div>
      </div>

      {/* Stepper Vertical Lateral Escritorio (lg+) */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 pr-7 border-r border-border/60 select-none">
        <div className="relative py-2">
          {steps.map((step, idx) => {
            const isCompleted = isAllCompleted || idx < activeIndex;
            const isActive = !isAllCompleted && idx === activeIndex;
            const isLast = idx === steps.length - 1;
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
                  disabled={isAllCompleted}
                  onClick={() => onSelectStep(idx)}
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
                  disabled={isAllCompleted}
                  onClick={() => onSelectStep(idx)}
                  className={cn(
                    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors cursor-pointer disabled:cursor-default",
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
    </>
  );
}

export function WorkspaceStepperFooter({
  isFirstStep,
  isLastStep,
  isPending,
  canQuickSubmit,
  submitLabel,
  onCancel,
  onPrev,
  onNext,
}: {
  isFirstStep: boolean;
  isLastStep: boolean;
  isPending: boolean;
  canQuickSubmit: boolean;
  submitLabel: string;
  onCancel: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-6 border-t border-border/60 pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
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
            onClick={onPrev}
            disabled={isFirstStep || isPending}
            className="rounded-2xl flex-1 sm:flex-initial h-10 px-4 text-xs font-bold gap-1 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          {!isLastStep ? (
            <Button
              type="button"
              onClick={onNext}
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
              {submitLabel}
            </Button>
          )}
        </div>

        {!isLastStep && canQuickSubmit && (
          <Button
            type="submit"
            variant="secondary"
            disabled={isPending}
            className="rounded-2xl h-10 px-4 text-xs font-bold cursor-pointer"
          >
            {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
