import { DollarSign, CheckCircle2, Users, CalendarClock, TrendingUp } from "lucide-react";
import { formatBs } from "@/hooks/useExchangeRate";

export interface ReportsKpiGridProps {
  stats: {
    total: number;
    completed: number;
    scheduled: number;
    cancelled: number;
    income: number;
    newPatients: number;
  };
  rate: number;
}

export function ReportsKpiGrid({ stats, rate }: ReportsKpiGridProps) {
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const avgTicket = stats.completed > 0 ? stats.income / stats.completed : 0;

  const cards = [
    {
      label: "Ingresos en Período",
      primaryValue: `$${stats.income.toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      secondaryValue: formatBs(stats.income, rate),
      caption: `Ticket promedio: $${avgTicket.toFixed(2)}`,
      icon: DollarSign,
      iconStyle: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Consultas Completadas",
      primaryValue: String(stats.completed),
      secondaryValue: `${completionRate}% de efectividad`,
      caption: `${stats.cancelled} canceladas · ${stats.scheduled} pendientes`,
      icon: CheckCircle2,
      iconStyle: "text-primary bg-primary/10 border-primary/20",
    },
    {
      label: "Total Citas Agendadas",
      primaryValue: String(stats.total),
      secondaryValue: "Flujo operativo",
      caption: "En el rango seleccionado",
      icon: CalendarClock,
      iconStyle: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Pacientes Nuevos",
      primaryValue: String(stats.newPatients),
      secondaryValue: "Nuevas historias",
      caption: "Captación en el período",
      icon: Users,
      iconStyle: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="bg-card border border-border rounded-3xl p-5 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </span>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${c.iconStyle}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {c.primaryValue}
              </p>
              <p className="text-xs font-bold text-primary mt-0.5 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 shrink-0" />
                {c.secondaryValue}
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground mt-3 pt-2.5 border-t border-border/50">
              {c.caption}
            </p>
          </div>
        );
      })}
    </div>
  );
}
