import { Calendar as CalIcon, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ReportsDateFilterBarProps {
  from: string;
  to: string;
  selectedDoctorId: string;
  doctors: Array<{ id: string; full_name?: string | null; email?: string | null }>;
  onChangeRange: (from: string, to: string) => void;
  onChangeDoctor: (doctorId: string) => void;
  canViewAllDoctors?: boolean;
  doctorName?: string | null;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function currentMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  return { from: first, to: todayISO() };
}

function currentYearRange() {
  const now = new Date();
  const first = `${now.getFullYear()}-01-01`;
  return { from: first, to: todayISO() };
}

export function ReportsDateFilterBar({
  from,
  to,
  selectedDoctorId,
  doctors,
  onChangeRange,
  onChangeDoctor,
  canViewAllDoctors = true,
  doctorName,
}: ReportsDateFilterBarProps) {
  const today = todayISO();
  const thisMonth = currentMonthRange();
  const thisYear = currentYearRange();

  const presets = [
    { label: "Hoy", from: today, to: today },
    { label: "7 días", from: daysAgoISO(7), to: today },
    { label: "Este Mes", from: thisMonth.from, to: thisMonth.to },
    { label: "30 días", from: daysAgoISO(30), to: today },
    { label: "90 días", from: daysAgoISO(90), to: today },
    { label: "Este Año", from: thisYear.from, to: thisYear.to },
  ];

  return (
    <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <CalIcon className="h-4 w-4 text-primary shrink-0" />
            <span>Período:</span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={from}
              aria-label="Fecha inicial"
              onChange={(e) => onChangeRange(e.target.value, to)}
              className="rounded-xl h-9 text-xs sm:w-[148px]"
            />
            <span className="text-muted-foreground text-xs font-medium">hasta</span>
            <Input
              type="date"
              value={to}
              aria-label="Fecha final"
              onChange={(e) => onChangeRange(from, e.target.value)}
              className="rounded-xl h-9 text-xs sm:w-[148px]"
            />
          </div>

          {canViewAllDoctors && doctors.length > 0 ? (
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              <select
                value={selectedDoctorId}
                aria-label="Filtrar por médico"
                onChange={(e) => onChangeDoctor(e.target.value)}
                className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                <option value="all">Todos los especialistas</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.full_name || doc.email || "Médico"}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            doctorName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/10 text-primary text-xs font-bold">
                <span>Mis Reportes: Dr(a). {doctorName}</span>
              </span>
            )
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((p) => {
            const isActive = from === p.from && to === p.to;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onChangeRange(p.from, p.to)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
