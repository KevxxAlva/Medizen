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
import { MiniAreaChart, MonthlyPaymentsChart } from "./DashboardCharts";
import {
  downloadMonthlySalesReport,
  downloadGeneralSalesReport,
  downloadPatientsReport,
  downloadAllPatientsReport,
  downloadAppointmentsReport,
  downloadAllAppointmentsReport,
} from "@/lib/utils/dashboardPdfReports";

export interface DashboardMetricsCardsProps {
  totalPatients: number;
  stats: any;
  monthlyData: { total: number; paymentsByDay: any[] };
}

export function DashboardMetricsCards({
  totalPatients,
  stats,
  monthlyData,
}: DashboardMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Patients */}
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
                onClick={downloadPatientsReport}
                className="text-xs font-bold cursor-pointer text-primary focus:text-primary"
              >
                Descargar Reporte del Mes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={downloadAllPatientsReport}
                className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground"
              >
                Descargar Reporte Histórico
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
          <span className="font-display text-4xl font-bold text-foreground tracking-tight tabular-nums">
            {totalPatients.toLocaleString("es-ES")}
          </span>
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap mb-1">
            en el sistema
          </span>
        </div>
        <div className="mt-auto pt-4 h-16 w-full -mb-2">
          <MiniAreaChart
            data={stats?.offlineWork.sparkline || [0, 0, 0, 0, 0, 0, 0]}
            colorVar="var(--color-primary)"
            gradientId="colorOffline"
          />
        </div>
      </div>

      {/* Completed Consultations (Last 7 Days) */}
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
                onClick={downloadAppointmentsReport}
                className="text-xs font-bold cursor-pointer text-primary focus:text-primary"
              >
                Descargar Reporte del Mes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={downloadAllAppointmentsReport}
                className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground"
              >
                Descargar Reporte Histórico
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
          <span className="font-display text-4xl font-bold text-foreground tracking-tight tabular-nums">
            {(stats?.onlineWork.total || 0).toLocaleString("es-ES")}
          </span>
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap mb-1">
            últimos 7 días
          </span>
        </div>
        <div>
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded",
              (stats?.onlineWork.change || 0) >= 0
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {(stats?.onlineWork.change || 0) >= 0 ? "+" : ""}
            {stats?.onlineWork.change || 0}% hoy respecto a ayer
          </span>
        </div>
        <div className="mt-auto pt-4 h-16 w-full -mb-2">
          <MiniAreaChart
            data={stats?.onlineWork.sparkline || [0, 0, 0, 0, 0, 0, 0]}
            colorVar="var(--color-secondary)"
            gradientId="colorOnline"
          />
        </div>
      </div>

      {/* Monthly Payments */}
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
                onClick={downloadMonthlySalesReport}
                className="text-xs font-bold cursor-pointer text-primary focus:text-primary"
              >
                Descargar Reporte del Mes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={downloadGeneralSalesReport}
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
              monthlyData.total >= 100000
                ? "text-2xl sm:text-3xl"
                : monthlyData.total >= 10000
                ? "text-3xl"
                : "text-4xl",
            )}
          >
            $
            {monthlyData.total.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap mb-1">
            este mes
          </span>
        </div>
        <div className="mt-auto pt-4 h-24 w-full">
          {monthlyData.paymentsByDay.length > 0 ? (
            <MonthlyPaymentsChart data={monthlyData.paymentsByDay} />
          ) : (
            <div className="h-full w-full bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground text-xs font-medium">
              Sin datos de ingresos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
