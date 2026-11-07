import { APP_TIME_ZONE } from "@/lib/constants/locale";
import React, { useMemo, useState, useEffect, memo, useSyncExternalStore } from "react";
import { Clock } from "lucide-react";
import { Chart as TanStackChart } from "@tanstack/charts/react/tooltip";
import { tooltip as chartTooltip } from "@tanstack/charts/tooltip";
import { defineChart, differenceY, rollingWindow } from "@tanstack/charts";
import { scaleLinear, scaleUtc } from "d3-scale";

let rechartsModule: typeof import("recharts") | null = null;
let rechartsPromise: Promise<typeof import("recharts")> | null = null;
const rechartsListeners = new Set<() => void>();

function getRecharts() {
  if (rechartsModule) return rechartsModule;
  if (!rechartsPromise) {
    rechartsPromise = import("recharts").then((mod) => {
      rechartsModule = mod;
      rechartsListeners.forEach((fn) => fn());
      return mod;
    });
  }
  return null;
}

export function useRecharts() {
  return useSyncExternalStore(
    (notify) => {
      rechartsListeners.add(notify);
      getRecharts();
      return () => {
        rechartsListeners.delete(notify);
      };
    },
    () => rechartsModule,
    () => null,
  );
}

export const MiniAreaChart = memo(function MiniAreaChart({
  data,
  colorVar,
  gradientId,
}: {
  data: number[];
  colorVar: string;
  gradientId: string;
}) {
  const recharts = useRecharts();
  const chartData = useMemo(() => data.map((val, i) => ({ index: i, value: val })), [data]);

  if (!recharts) {
    return <div className="h-full w-full bg-muted/10 animate-pulse rounded" />;
  }

  const { ResponsiveContainer, AreaChart, Area, Tooltip } = recharts;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colorVar} stopOpacity={0.5} />
            <stop offset="95%" stopColor={colorVar} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          cursor={false}
          contentStyle={{
            borderRadius: "0.5rem",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-card)",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            padding: "4px 8px",
            fontSize: "12px",
            fontWeight: "bold",
          }}
          formatter={(value: number) => [value, "Total"]}
          labelFormatter={() => ""}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={colorVar}
          strokeWidth={2.5}
          fillOpacity={1}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export const SemiGaugeChart = memo(function SemiGaugeChart({
  percentage,
  size = 145,
  label = "OCUPACIÓN",
}: {
  percentage: number;
  size?: number;
  label?: string;
}) {
  const strokeWidth = 11;
  const cx = size / 2;
  const r = (size - strokeWidth) / 2 - 4;
  const cy = r + strokeWidth / 2 + 6;
  const height = cy + 14;
  const arcLength = Math.PI * r;
  const pct = Math.min(Math.max(Number(percentage) || 0, 0), 100);
  const strokeDashoffset = arcLength * (1 - pct / 100);

  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <div
      className="relative flex flex-col items-center justify-center shrink-0 select-none"
      style={{ width: size, height }}
    >
      <svg
        width={size}
        height={height}
        viewBox={`0 0 ${size} ${height}`}
        className="overflow-visible w-full h-full"
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-secondary, #8b5cf6)" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Active gauge arc */}
        <path
          d={d}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={strokeDashoffset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {/* Central typography */}
      <div className="absolute flex flex-col items-center justify-center bottom-0">
        <span className="text-2xl font-display font-bold text-foreground tabular-nums tracking-tight">
          {pct}%
        </span>
        <span className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">
          {label}
        </span>
      </div>
    </div>
  );
});

export const DonutChart = memo(function DonutChart({ percentage }: { percentage: number }) {
  const recharts = useRecharts();
  const data = useMemo(
    () => [
      { name: "Ocupado", value: percentage },
      { name: "Libre", value: 100 - percentage },
    ],
    [percentage],
  );

  return (
    <div className="relative flex items-center justify-center w-[120px] h-[120px]">
      {recharts ? (
        <recharts.ResponsiveContainer width="100%" height="100%">
          <recharts.PieChart>
            <defs>
              <linearGradient id="pieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-secondary)" />
              </linearGradient>
            </defs>
            <recharts.Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={60}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
              cornerRadius={10}
            >
              <recharts.Cell fill="url(#pieGradient)" />
              <recharts.Cell fill="var(--color-muted)" opacity={0.3} />
            </recharts.Pie>
            <recharts.Tooltip
              formatter={(value: number) => [`${value}%`, ""]}
              contentStyle={{
                borderRadius: "0.5rem",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-card)",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                padding: "4px 8px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
              itemStyle={{ color: "var(--color-foreground)" }}
            />
          </recharts.PieChart>
        </recharts.ResponsiveContainer>
      ) : (
        <div className="h-[120px] w-[120px] rounded-full border-4 border-muted/20 animate-pulse" />
      )}
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-display font-bold text-foreground">{percentage}%</span>
        <span className="text-[9px] font-bold text-muted-foreground tracking-wider">OCUPACIÓN</span>
      </div>
    </div>
  );
});

export interface RingData {
  name: string;
  percentage: number;
  color: string;
}

export const MultiRadialRings = memo(function MultiRadialRings({
  rings,
  size = 136,
  centerValue,
  centerLabel = "METAS",
}: {
  rings: RingData[];
  size?: number;
  centerValue?: string;
  centerLabel?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 7.5;
  const gap = 3.5;

  const validRings = rings.map((ring, idx) => {
    const r = size / 2 - strokeWidth / 2 - 4 - idx * (strokeWidth + gap);
    const circumference = 2 * Math.PI * r;
    const pct = Math.min(Math.max(Number(ring.percentage) || 0, 0), 100);
    const strokeDashoffset = circumference * (1 - pct / 100);
    return { ...ring, r, circumference, strokeDashoffset, pct };
  });

  const averagePct = Math.round(
    rings.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0) / Math.max(rings.length, 1)
  );

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="w-full h-full overflow-visible">
        {validRings.map((r, i) => (
          <g key={r.name || i}>
            {/* Background track circle */}
            <circle
              cx={cx}
              cy={cy}
              r={r.r}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeWidth={strokeWidth}
            />
            {/* Active progress ring */}
            <circle
              cx={cx}
              cy={cy}
              r={r.r}
              fill="none"
              stroke={r.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={r.circumference}
              strokeDashoffset={r.strokeDashoffset}
              className="transition-[stroke-dashoffset] duration-700 ease-out origin-center -rotate-90"
            />
          </g>
        ))}
      </svg>
      <div className="absolute flex flex-col items-center justify-center pointer-events-none select-none">
        <span className="text-xl font-display font-bold text-foreground tabular-nums tracking-tight">
          {centerValue ?? `${averagePct}%`}
        </span>
        <span className="text-[8px] font-bold text-muted-foreground tracking-wider uppercase">
          {centerLabel}
        </span>
      </div>
    </div>
  );
});

export const MonthlyPaymentsChart = memo(function MonthlyPaymentsChart({ data }: { data: any[] }) {
  const chart = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Normalizar datos diarios a fechas UTC y montos numéricos
    const rawData = data.map((d) => ({
      date: new Date(`${d.date}T00:00:00Z`),
      amount: Math.max(0, Number(d.amount) || 0),
    }));

    // Calcular media móvil (ventana de 5 días con partial: true para conservar todos los días)
    const rows = rollingWindow(rawData, {
      size: 5,
      orderBy: "date",
      anchor: "end",
      partial: true,
      outputs: {
        average: { value: "amount", reduce: "mean" },
      },
    });

    return defineChart(
      {
        marks: [
          differenceY(rows, {
            id: "difference",
            x: "date",
            y1: "average",
            y2: "amount",
            positiveFill: "#16a34a",
            negativeFill: "#dc2626",
            fillOpacity: 0.35,
            stroke: "#166534",
            strokeWidth: 2,
            comparisonStroke: "#475569",
            comparisonStrokeWidth: 1.5,
          }),
        ],
        scales: {
          x: {
            scale: scaleUtc,
            axis: {
              ticks: {
                count: 6,
                format: (d: Date) => String(d.getUTCDate()),
              },
            },
          },
          y: {
            scale: scaleLinear,
            grid: true,
            axis: {
              ticks: {
                count: 3,
                format: (v: number) => `$${Math.round(v)}`,
              },
            },
          },
        },
        margin: { top: 8, right: 12, bottom: 22, left: 38 },
      },
      { keyboard: true, tooltip: chartTooltip },
    );
  }, [data]);

  if (!chart) {
    return (
      <div className="h-full w-full bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground text-xs font-medium">
        Sin datos de ingresos
      </div>
    );
  }

  return (
    <div
      className="w-full h-full min-h-[110px] select-none text-muted-foreground"
      style={{
        ["--ts-chart-tooltip-background" as any]: "var(--color-card, #18181b)",
        ["--ts-chart-tooltip-color" as any]: "var(--color-card-foreground, #f4f4f5)",
        ["--ts-chart-tooltip-border" as any]: "1px solid var(--color-border, rgba(255,255,255,0.15))",
        ["--ts-chart-tooltip-border-radius" as any]: "0.75rem",
        ["--ts-chart-tooltip-padding" as any]: "0.5rem 0.75rem",
      }}
    >
      <TanStackChart
        ariaLabel="Ingresos diarios versus promedio móvil (TanStack Difference Chart)"
        definition={chart}
        height="100%"
      />
    </div>
  );
});

export const TrendsBarChart = memo(function TrendsBarChart({ trends }: { trends: any[] }) {
  const recharts = useRecharts();
  if (!recharts) {
    return (
      <div className="h-full w-full bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground text-xs font-medium animate-pulse">
        Cargando gráfico...
      </div>
    );
  }
  const { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } = recharts;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          tickFormatter={(val) => `${val}`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "1rem",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-card)",
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
          }}
          formatter={(value: number) => [`${value.toFixed(2)}`, "Ingresos"]}
          cursor={{ fill: "var(--color-muted)", opacity: 0.2 }}
        />
        <Bar dataKey="amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
});

export const LiveClockBadge = memo(function LiveClockBadge() {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("es-VE", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString("es-VE", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div
      className="flex items-center gap-2.5 bg-card rounded-full px-3.5 py-2 shadow-sm border border-border text-foreground transition-colors hover:border-primary/40 select-none"
      title={currentTime.toLocaleDateString("es-VE", {
        timeZone: APP_TIME_ZONE,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
    >
      <div className="relative flex items-center justify-center shrink-0">
        <Clock className="h-4 w-4 text-primary" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>
      <div className="flex items-center gap-1.5 font-mono">
        <span className="hidden lg:inline text-[11px] font-medium text-muted-foreground uppercase tracking-tight">
          {formattedDate} •
        </span>
        <span className="text-xs font-bold tabular-nums text-foreground tracking-wider uppercase">
          {formattedTime}
        </span>
      </div>
    </div>
  );
});

export const HeroDateTimeBadge = memo(function HeroDateTimeBadge() {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("es-VE", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex items-center gap-2 bg-black/10 w-max px-3 py-1.5 rounded-full backdrop-blur-md mb-4 border border-white/10 shadow-sm">
      <span className="text-xs font-medium">
        📅{" "}
        {currentTime.toLocaleDateString("es-ES", {
          timeZone: APP_TIME_ZONE,
          month: "short",
          day: "numeric",
          year: "numeric",
        })}{" "}
        {formattedTime}
      </span>
    </div>
  );
});
