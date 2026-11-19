import React, { useMemo, memo } from "react";
import { TrendsBarChart } from "./DashboardCharts";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardTrendsAndTreatmentsProps {
  trends: any[];
  topTreatments: any[];
}

export const DashboardTrendsAndTreatments = memo(function DashboardTrendsAndTreatments({
  trends,
  topTreatments,
}: DashboardTrendsAndTreatmentsProps) {
  const { maxCount, totalCount } = useMemo(() => {
    if (!topTreatments || topTreatments.length === 0) {
      return { maxCount: 1, totalCount: 0 };
    }
    const max = Math.max(...topTreatments.map((t) => Number(t.count) || 0), 1);
    const total = topTreatments.reduce((sum, t) => sum + (Number(t.count) || 0), 0);
    return { maxCount: max, totalCount: total };
  }, [topTreatments]);

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

      {/* Top Treatments - Ranked Proportional Horizontal Bars */}
      <div className="glass-card rounded-[2rem] p-6 shadow-lg shadow-black/5 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Servicios Populares
          </h3>
          {totalCount > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full flex items-center gap-1 tabular-nums">
              <Sparkles className="h-3 w-3 text-amber-500" />
              {totalCount} consultas registradas
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between gap-3.5 pt-1">
          {topTreatments.length > 0 ? (
            topTreatments.map((t, idx) => {
              const count = Number(t.count) || 0;
              const barWidth = Math.min(Math.max((count / maxCount) * 100, 4), 100);
              const sharePct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

              return (
                <div
                  key={t.name}
                  className="group flex flex-col gap-1.5 p-2 -mx-2 rounded-xl hover:bg-muted/15 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 transition-transform group-hover:scale-105",
                          idx === 0
                            ? "bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30"
                            : idx === 1
                            ? "bg-slate-400/20 text-slate-300 ring-1 ring-slate-400/20"
                            : idx === 2
                            ? "bg-amber-700/20 text-amber-600 dark:text-amber-400"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        #{idx + 1}
                      </div>
                      <span className="font-bold text-foreground truncate text-sm tracking-tight">
                        {t.name}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5 shrink-0 pl-2">
                      <span className="font-bold text-foreground font-display tabular-nums text-sm">
                        {count}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {count === 1 ? "consulta" : "consultas"}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/70 tabular-nums ml-1 bg-muted/30 px-1.5 py-0.5 rounded">
                        {sharePct}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Graphic */}
                  <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden p-0.5 flex items-center">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out shadow-xs",
                        idx === 0
                          ? "bg-gradient-to-r from-primary via-indigo-500 to-secondary"
                          : idx === 1
                          ? "bg-primary/90"
                          : idx === 2
                          ? "bg-primary/75"
                          : "bg-primary/55",
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-full min-h-[180px] items-center justify-center text-muted-foreground text-xs font-medium">
              Sin datos suficientes
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
