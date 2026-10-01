import React, { useState, useMemo } from "react";
import { Baby, Calendar, Clock, Check, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateObstetricDates } from "@/lib/utils/medicalCalculators";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ObstetricCalculatorCardProps {
  initialFum?: string;
  onApplyDates?: (dates: { eg: string; fpp: string; fum: string }) => void;
  className?: string;
}

export function ObstetricCalculatorCard({
  initialFum = "",
  onApplyDates,
  className = "",
}: ObstetricCalculatorCardProps) {
  const [fum, setFum] = useState(initialFum);

  const calc = useMemo(() => {
    return calculateObstetricDates(fum);
  }, [fum]);

  const handleApply = () => {
    if (!calc.isValid) {
      toast.error(calc.errorMessage || "Fecha no válida.");
      return;
    }
    if (onApplyDates && calc.gestationalAgeFormatted && calc.fppDateFormatted) {
      onApplyDates({
        eg: calc.gestationalAgeFormatted,
        fpp: calc.fppDateFormatted,
        fum,
      });
      toast.success(`Cálculo aplicado: ${calc.gestationalAgeFormatted} · FPP: ${calc.fppDateFormatted}`);
    }
  };

  return (
    <div className={cn("rounded-3xl border border-pink-500/25 bg-gradient-to-br from-card via-pink-500/5 to-card p-4 sm:p-5 shadow-xs space-y-4", className)}>
      <div className="flex items-center justify-between pb-3 border-b border-pink-500/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-pink-500/15 text-pink-500">
            <Baby className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
              Calculadora Obstétrica Inteligente
            </h4>
            <p className="text-[11px] text-muted-foreground">Regla de Naegele automática (FUM → EG y FPP)</p>
          </div>
        </div>

        {calc.isValid && (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30">
            {calc.trimesterLabel}
          </span>
        )}
      </div>

      {/* Input Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="calc-fum" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-pink-500" />
            Fecha de Última Menstruación (FUM / FUR)
          </Label>
          <Input
            id="calc-fum"
            type="date"
            value={fum}
            onChange={(e) => setFum(e.target.value)}
            className="rounded-2xl h-10 bg-background/90 text-xs font-semibold"
          />
        </div>

        {onApplyDates && (
          <Button
            type="button"
            disabled={!calc.isValid}
            onClick={handleApply}
            className="h-10 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>Aplicar a Consulta</span>
          </Button>
        )}
      </div>

      {/* Results Banner */}
      {calc.isValid ? (
        <div className="space-y-3 pt-1 animate-in fade-in">
          {/* Visual Gestational Bar (0 - 40 weeks) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Semana 0</span>
              <span className="text-pink-600 dark:text-pink-400">
                Semana {calc.gestationalWeeks} ({calc.progressPercentage}%)
              </span>
              <span>Semana 40 (Término)</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted/80 overflow-hidden p-0.5 border border-border/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-pink-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, calc.progressPercentage || 0))}%` }}
              />
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="rounded-2xl bg-background/80 border border-border/40 p-2.5 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Edad Gestacional</span>
              <span className="text-sm font-black text-pink-600 dark:text-pink-400">
                {calc.gestationalAgeFormatted}
              </span>
            </div>

            <div className="rounded-2xl bg-background/80 border border-border/40 p-2.5 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Fecha Probable Parto</span>
              <span className="text-xs font-bold text-foreground truncate block mt-0.5">
                {calc.fppDateFormatted}
              </span>
            </div>

            <div className="rounded-2xl bg-background/80 border border-border/40 p-2.5 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Trimestre</span>
              <span className="text-xs font-bold text-foreground">
                {calc.trimester}º Trimestre
              </span>
            </div>
          </div>
        </div>
      ) : fum ? (
        <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4" /> {calc.errorMessage}
        </p>
      ) : null}
    </div>
  );
}
