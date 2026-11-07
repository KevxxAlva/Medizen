import React from "react";
import { Link } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DailyPillBars, PeakSparklineWithBaseline, MonthlyPaymentsChart } from "./DashboardCharts";
import {
  downloadMonthlySalesReport,
  downloadGeneralSalesReport,
  downloadPatientsReport,
  downloadAllPatientsReport,
  downloadAppointmentsReport,
  downloadAllAppointmentsReport,
} from "@/lib/utils/dashboardPdfReports";

const EMPTY_SPARKLINE = [0, 0, 0, 0, 0, 0, 0];
const esIntFormatter = new Intl.NumberFormat("es-ES");
const usdCurrencyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getRevenueFontClass(total: number): string {
  if (total >= 100000) return "text-2xl sm:text-3xl";
  if (total >= 10000) return "text-3xl";
  return "text-4xl";
}

export interface DashboardMetricsCardsProps {
  totalPatients: number;
  stats: any;
  monthlyData: { total: number; paymentsByDay: any[] };
  isDoctorOnly?: boolean;
  doctorId?: string | number | null;
}

function PatientsMetricCard({
  totalPatients,
  sparkline,
  isDoctorOnly,
  doctorId,
}: {
  totalPatients: number;
  sparkline: number[];
  isDoctorOnly?: boolean;
  doctorId?: string | number | null;
}) {
  return (
    <div className="glass-card rounded-[2rem] p-5 shadow-lg shadow-black/5 flex flex-col hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Pacientes Registrados
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Más opciones"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg cursor-pointer transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl overscroll-contain">
            <DropdownMenuItem asChild className="text-xs font-bold cursor-pointer">
              <Link to="/pacientes">Ver Todos</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-xs font-bold cursor-pointer">
              <Link to="/agenda">Ver Citas</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => downloadPatientsReport({ doctorId, isDoctorOnly })}
              className="text-xs font-bold cursor-pointer text-primary focus:text-primary"
            >
              Descargar Reporte del Mes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => downloadAllPatientsReport({ doctorId, isDoctorOnly })}
              className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground"
            >
              Descargar Reporte Histórico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
        <span className="font-display text-4xl font-bold text-foreground tracking-tight tabular-nums">
          {esIntFormatter.format(totalPatients)}
        </span>
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap mb-1">
          {isDoctorOnly ? "atendidos por ti" : "en el sistema"}
        </span>
      </div>
      <div className="mt-auto pt-2 h-28 w-full">
        <DailyPillBars data={sparkline} unit="pacientes" />
      </div>
    </div>
  );
}

function ConsultationsMetricCard({
  total,
  change,
  sparkline,
  isDoctorOnly,
  doctorId,
}: {
  total: number;
  change: number;
  sparkline: number[];
  isDoctorOnly?: boolean;
  doctorId?: string | number | null;
}) {
  const isNonNegative = change >= 0;
  return (
    <div className="glass-card rounded-[2rem] p-5 shadow-lg shadow-black/5 flex flex-col hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Consultas Atendidas
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Más opciones"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg cursor-pointer transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl overscroll-contain">
            <DropdownMenuItem asChild className="text-xs font-bold cursor-pointer">
              <Link to="/agenda">Ir a la Agenda</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => downloadAppointmentsReport({ doctorId, isDoctorOnly })}
              className="text-xs font-bold cursor-pointer text-primary focus:text-primary"
            >
              Descargar Reporte del Mes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => downloadAllAppointmentsReport({ doctorId, isDoctorOnly })}
              className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground"
            >
              Descargar Reporte Histórico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
        <span className="font-display text-4xl font-bold text-foreground tracking-tight tabular-nums">
          {esIntFormatter.format(total)}
        </span>
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap mb-1">
          últimos 7 días
        </span>
      </div>
      <div className="mb-1">
        <span
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded",
            isNonNegative
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {isNonNegative ? `+${change}` : change}% hoy respecto a ayer
        </span>
      </div>
      <div className="mt-auto pt-2 h-28 w-full">
        <PeakSparklineWithBaseline data={sparkline} unit="consultas" />
      </div>
    </div>
  );
}

function MonthlyRevenueMetricCard({
  total,
  paymentsByDay,
  isDoctorOnly,
  doctorId,
}: {
  total: number;
  paymentsByDay: any[];
  isDoctorOnly?: boolean;
  doctorId?: string | number | null;
}) {
  return (
    <div className="glass-card rounded-[2rem] p-5 shadow-lg shadow-black/5 flex flex-col hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Ingresos Mensuales
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Más opciones"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg cursor-pointer transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl overscroll-contain">
            <DropdownMenuItem asChild className="text-xs font-bold cursor-pointer">
              <Link to="/facturacion">Ver Facturación</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => downloadMonthlySalesReport({ doctorId, isDoctorOnly })}
              className="text-xs font-bold cursor-pointer text-primary focus:text-primary"
            >
              Descargar Reporte del Mes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => downloadGeneralSalesReport({ doctorId, isDoctorOnly })}
              className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground"
            >
              Descargar Reporte Histórico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
        <span
          className={cn(
            "font-display font-bold text-foreground tracking-tight tabular-nums",
            getRevenueFontClass(total),
          )}
        >
          ${usdCurrencyFormatter.format(total)}
        </span>
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap mb-1">
          este mes
        </span>
      </div>
      <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground mb-1">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
          <span>Ingreso real</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-slate-400 inline-block" />
          <span>Media móvil</span>
        </span>
      </div>
      <div className="mt-auto pt-2 h-28 w-full">
        {paymentsByDay.length > 0 ? (
          <MonthlyPaymentsChart data={paymentsByDay} />
        ) : (
          <div className="h-full w-full bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground text-xs font-medium">
            Sin datos de ingresos
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardMetricsCards({
  totalPatients,
  stats,
  monthlyData,
  isDoctorOnly,
  doctorId,
}: DashboardMetricsCardsProps) {
  const patientsSparkline = stats?.labWork?.sparkline || stats?.offlineWork?.sparkline || EMPTY_SPARKLINE;
  const onlineTotal = stats?.onlineWork?.total || 0;
  const onlineChange = stats?.onlineWork?.change || 0;
  const onlineSparkline = stats?.onlineWork?.sparkline || EMPTY_SPARKLINE;
  const revenueTotal = monthlyData?.total || 0;
  const paymentsByDay = monthlyData?.paymentsByDay || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <PatientsMetricCard
        totalPatients={totalPatients}
        sparkline={patientsSparkline}
        isDoctorOnly={isDoctorOnly}
        doctorId={doctorId}
      />
      <ConsultationsMetricCard
        total={onlineTotal}
        change={onlineChange}
        sparkline={onlineSparkline}
        isDoctorOnly={isDoctorOnly}
        doctorId={doctorId}
      />
      <MonthlyRevenueMetricCard
        total={revenueTotal}
        paymentsByDay={paymentsByDay}
        isDoctorOnly={isDoctorOnly}
        doctorId={doctorId}
      />
    </div>
  );
}
