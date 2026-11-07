import { Building2, CheckCircle2, Clock, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DoctorOption } from "@/lib/api/profiles";
import { bsAmountFormatter, type SettlementTotals } from "./doctorFeesHelpers";

interface DoctorFeesHeaderAndKpisProps {
  isDoctorOnly: boolean;
  canViewAllDoctors: boolean;
  selectedMonth: string;
  onMonthChange: (val: string) => void;
  selectedDoctorId: string;
  onDoctorChange: (val: string) => void;
  doctors: DoctorOption[];
  totals: SettlementTotals;
  rate: number;
}

export function DoctorFeesHeaderAndKpis({
  isDoctorOnly,
  canViewAllDoctors,
  selectedMonth,
  onMonthChange,
  selectedDoctorId,
  onDoctorChange,
  doctors,
  totals,
  rate,
}: DoctorFeesHeaderAndKpisProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
            Conciliación y Reparto Clínico
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mt-0.5">
            {isDoctorOnly ? "Mis Honorarios Médicos" : "Liquidación de Honorarios Médicos"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isDoctorOnly
              ? "Resumen individual de consultas cobradas, porcentaje de liquidación y estado de cuenta"
              : "Cálculo exacto de comisiones por especialista sobre facturas conciliadas y comprobantes en PDF"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Input
              type="month"
              aria-label="Mes de liquidación"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="h-9 w-[165px] rounded-xl text-xs font-semibold"
            />
            {selectedMonth && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMonthChange("")}
                className="h-9 rounded-xl text-xs font-semibold"
              >
                Ver todo
              </Button>
            )}
          </div>

          {canViewAllDoctors && (
            <Select value={selectedDoctorId} onValueChange={onDoctorChange}>
              <SelectTrigger className="w-[210px] h-9 rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Todos los médicos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todos los especialistas</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    Dr(a). {d.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-border bg-muted/25 p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Facturación Cobrada ({totals.paidCount})
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-1">
              ${totals.grossPaidUsd.toFixed(2)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Bs. {bsAmountFormatter.format(totals.grossPaidUsd * rate)}
            </p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Neto Honorarios Médicos
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-1">
              ${totals.doctorNetUsd.toFixed(2)}
            </p>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold mt-0.5">
              Bs. {bsAmountFormatter.format(totals.doctorNetUsd * rate)}
            </p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <HandCoins className="h-5 w-5" />
          </div>
        </div>

        {!isDoctorOnly && (
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/[0.06] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Margen / Retención Clínica
              </p>
              <p className="text-2xl font-extrabold text-foreground mt-1">
                ${totals.clinicNetUsd.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Participación operativa del centro
              </p>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Por Cobrar (Pendientes)
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-1">
              ${totals.pendingUsd.toFixed(2)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Se suman al liquidar el pago
            </p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>
    </>
  );
}
