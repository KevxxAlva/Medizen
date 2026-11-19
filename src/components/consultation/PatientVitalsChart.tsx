import { useState, useMemo, lazy, Suspense } from "react";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { APP_LOCALE, APP_TIME_ZONE } from "@/lib/constants/locale";
import type { Consultation } from "@/lib/api/consultations";
import { cn } from "@/lib/utils";

export interface PatientVitalsChartProps {
  consultations: Consultation[];
}

interface ChartItem {
  date: string;
  sistolica: number | null;
  diastolica: number | null;
  peso: number | null;
  imc: number | null;
}

const DynamicVitalsRecharts = lazy(() =>
  import("recharts").then((mod) => ({
    default: function InnerRecharts({
      data,
      metric,
    }: {
      data: ChartItem[];
      metric: "bp" | "weight";
    }) {
      const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } = mod;
      return (
        <ResponsiveContainer width="100%" height="100%">
          {metric === "bp" ? (
            <LineChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[50, 180]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              />
              <Line
                type="monotone"
                dataKey="sistolica"
                name="PA Sistólica (mmHg)"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="diastolica"
                name="PA Diastólica (mmHg)"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          ) : (
            <LineChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              />
              <Line
                type="monotone"
                dataKey="peso"
                name="Peso (kg)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="imc"
                name="IMC (kg/m²)"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3.5 }}
                connectNulls
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      );
    },
  }))
);

export function PatientVitalsChart({ consultations }: PatientVitalsChartProps) {
  const [metric, setMetric] = useState<"bp" | "weight">("bp");

  const chartData = useMemo(() => {
    const ordered = [...consultations].reverse();
    return ordered
      .map((c) => {
        const bpStr = c.blood_pressure || "";
        const bpParts = bpStr.split("/");
        const sys = bpParts[0] ? parseInt(bpParts[0], 10) : null;
        const dia = bpParts[1] ? parseInt(bpParts[1], 10) : null;
        const w = c.weight_kg ? Number(c.weight_kg) : null;
        const h = c.height_cm ? Number(c.height_cm) / 100 : null;
        const bmi = w && h && h > 0 ? Number((w / (h * h)).toFixed(1)) : null;

        return {
          date: new Date(c.created_at).toLocaleDateString(APP_LOCALE, {
            day: "2-digit",
            month: "short",
            timeZone: APP_TIME_ZONE,
          }),
          sistolica: !isNaN(sys as number) ? sys : null,
          diastolica: !isNaN(dia as number) ? dia : null,
          peso: w,
          imc: bmi,
        };
      })
      .filter((d) => d.sistolica !== null || d.peso !== null);
  }, [consultations]);

  const hasHighBp = useMemo(
    () => chartData.some((d) => (d.sistolica && d.sistolica >= 140) || (d.diastolica && d.diastolica >= 90)),
    [chartData]
  );

  if (chartData.length === 0) return null;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
              Curva Evolutiva de Signos Vitales y Peso / IMC
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Seguimiento longitudinal en {chartData.length} consulta(s)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasHighBp && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
              <AlertTriangle className="h-3 w-3" /> Alerta PA ≥ 140/90 mmHg
            </span>
          )}
          <div className="inline-flex rounded-xl bg-muted/60 p-0.5 border border-border/60">
            <button
              type="button"
              onClick={() => setMetric("bp")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer",
                metric === "bp"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tensión Arterial (mmHg)
            </button>
            <button
              type="button"
              onClick={() => setMetric("weight")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer",
                metric === "weight"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Peso (kg) / IMC
            </button>
          </div>
        </div>
      </div>

      <div className="h-48 w-full pt-1">
        <Suspense fallback={<div className="h-full flex items-center justify-center text-xs text-muted-foreground">Cargando gráfico...</div>}>
          <DynamicVitalsRecharts data={chartData} metric={metric} />
        </Suspense>
      </div>
    </div>
  );
}

export default PatientVitalsChart;
