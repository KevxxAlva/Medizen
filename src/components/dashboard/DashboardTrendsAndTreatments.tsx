import React from "react";
import { TrendsBarChart } from "./DashboardCharts";

export interface DashboardTrendsAndTreatmentsProps {
  trends: any[];
  topTreatments: any[];
}

export function DashboardTrendsAndTreatments({
  trends,
  topTreatments,
}: DashboardTrendsAndTreatmentsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Trends Chart */}
      <div className="glass-card rounded-[2rem] p-6 shadow-lg shadow-black/5 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Tendencias de Ingresos (6 Meses)
          </h3>
        </div>
        <div className="flex-1 min-h-[250px] w-full">
          <TrendsBarChart trends={trends} />
        </div>
      </div>

      {/* Top Treatments */}
      <div className="glass-card rounded-[2rem] p-6 shadow-lg shadow-black/5 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Servicios Populares
          </h3>
        </div>
        <div className="flex-1 space-y-4 pt-2">
          {topTreatments.length > 0 ? (
            topTreatments.map((t, idx) => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <span className="font-bold text-sm text-foreground">{t.name}</span>
                </div>
                <span className="font-bold text-xs bg-muted px-2 py-1 rounded-md">
                  {t.count} consultas
                </span>
              </div>
            ))
          ) : (
            <div className="flex h-full min-h-[150px] items-center justify-center text-muted-foreground text-xs">
              Sin datos suficientes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
