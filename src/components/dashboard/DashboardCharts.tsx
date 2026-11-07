import { APP_TIME_ZONE } from "@/lib/constants/locale";
import React, { useMemo, useState, useEffect, memo, useSyncExternalStore } from "react";
import { Clock } from "lucide-react";
import { Chart as TanStackChart } from "@tanstack/charts/react/tooltip";
import { tooltip as chartTooltip } from "@tanstack/charts/tooltip";
import { defineChart, differenceY, rollingWindow } from "@tanstack/charts";
import { scaleLinear, scaleUtc } from "d3-scale";
import { cn } from "@/lib/utils";

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

const getWeekDayLabels = () => {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const result: { short: string; full: string }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push({
      short: i === 0 ? "Hoy" : days[d.getDay()],
      full: d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" }),
    });
  }
  return result;
};

export const DailyPillBars = memo(function DailyPillBars({
  data = [0, 0, 0, 0, 0, 0, 0],
  unit = "pacientes",
}: {
  data: number[];
  unit?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const days = useMemo(() => getWeekDayLabels(), []);

  const values = useMemo(() => {
    const arr = (data || []).slice(-7);
    while (arr.length < 7) arr.unshift(0);
    return arr;
  }, [data]);

  const maxVal = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="w-full h-full flex flex-col justify-between pt-1">
      <div className="flex justify-between items-center text-[10px] text-muted-foreground px-0.5 mb-1.5 font-medium">
        <span>Captación diaria</span>
        <span className="font-semibold text-foreground/80">{total} esta semana</span>
      </div>

      <div className="flex items-end justify-between gap-1 sm:gap-2 h-18 px-1">
        {values.map((val, idx) => {
          const isToday = idx === 6;
          const isHovered = hoveredIdx === idx;
          const isPeak = val > 0 && val === maxVal;
          const heightPct = val === 0 ? 9 : Math.max(20, Math.round((val / maxVal) * 100));

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {isHovered && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 bg-popover text-popover-foreground text-[10px] font-bold py-0.5 px-2 rounded-md shadow-lg border border-border whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  <span className="capitalize">{days[idx]?.short}:</span> {val} {unit}
                </div>
              )}

              <div className="w-full max-w-[14px] h-full flex items-end justify-center rounded-full bg-muted/25 p-0.5">
                <div
                  style={{ height: `${heightPct}%` }}
                  className={cn(
                    "w-full rounded-full transition-all duration-300",
                    isToday
                      ? "bg-gradient-to-t from-primary to-blue-400 shadow-sm shadow-primary/40 ring-1 ring-primary/40"
                      : isPeak
                      ? "bg-blue-500/80"
                      : val > 0
                      ? "bg-blue-400/50 hover:bg-blue-400/80"
                      : "bg-muted-foreground/20"
                  )}
                />
              </div>

              <span
                className={cn(
                  "text-[9px] mt-1.5 font-medium transition-colors",
                  isToday
                    ? "font-bold text-primary"
                    : isHovered
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground/70"
                )}
              >
                {days[idx]?.short}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export const PeakSparklineWithBaseline = memo(function PeakSparklineWithBaseline({
  data = [0, 0, 0, 0, 0, 0, 0],
  unit = "consultas",
}: {
  data: number[];
  unit?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const days = useMemo(() => getWeekDayLabels(), []);

  const values = useMemo(() => {
    const arr = (data || []).slice(-7);
    while (arr.length < 7) arr.unshift(0);
    return arr;
  }, [data]);

  const maxVal = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);
  const avg = Math.round((total / 7) * 10) / 10;

  const width = 280;
  const height = 75;
  const padX = 14;
  const padTop = 10;
  const padBottom = 16;
  const plotH = height - padTop - padBottom;
  const stepX = (width - padX * 2) / 6;

  const points = useMemo(() => {
    return values.map((v, i) => {
      const x = padX + i * stepX;
      const y = padTop + plotH - (v / maxVal) * plotH;
      return { x, y, value: v, day: days[i]?.short || "" };
    });
  }, [values, maxVal, plotH, stepX, days]);

  const pathD = useMemo(() => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  const areaD = useMemo(() => {
    if (!pathD) return "";
    const lastP = points[points.length - 1];
    const firstP = points[0];
    const baseY = padTop + plotH;
    return `${pathD} L ${lastP.x} ${baseY} L ${firstP.x} ${baseY} Z`;
  }, [pathD, points, padTop, plotH]);

  const avgY = padTop + plotH - (avg / maxVal) * plotH;

  return (
    <div className="w-full h-full flex flex-col justify-between pt-1">
      <div className="flex justify-between items-center text-[10px] text-muted-foreground px-0.5 mb-0.5 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-0.5 border-t border-dashed border-amber-500" />
          <span>Promedio: <strong className="text-foreground">{avg}</strong>/día</span>
        </span>
        <span className="font-semibold text-foreground/80">{total} total</span>
      </div>

      <div className="relative w-full h-20">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="consultationsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
            </linearGradient>
            <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.4" />
            </filter>
          </defs>

          <line
            x1={padX}
            y1={avgY}
            x2={width - padX}
            y2={avgY}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            strokeOpacity="0.5"
            strokeWidth="1"
          />

          <path d={areaD} fill="url(#consultationsGradient)" />

          <path
            d={pathD}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glowAmber)"
          />

          {points.map((p, i) => {
            const isToday = i === 6;
            const isHovered = hoveredIdx === i;
            const isAboveAvg = p.value >= avg;
            return (
              <g key={i}>
                {isToday && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="6.5"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    className="animate-ping opacity-75 origin-center"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? "5" : isToday ? "4" : "3"}
                  fill={isAboveAvg ? "#f59e0b" : "#d97706"}
                  stroke="var(--color-card, #ffffff)"
                  strokeWidth="1.5"
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}
        </svg>

        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${Math.max(0, (points[hoveredIdx].y / height) * 100 - 35)}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-full z-30 bg-popover text-popover-foreground text-[10px] font-bold py-0.5 px-2 rounded-md shadow-lg border border-border whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          >
            <span>{days[hoveredIdx]?.short}: </span>
            <span className="text-amber-500 font-extrabold">{points[hoveredIdx].value}</span> {unit}
          </div>
        )}

        <div className="flex justify-between px-2 text-[9px] text-muted-foreground/70 font-medium -mt-2">
          {days.map((d, i) => (
            <span
              key={i}
              className={cn(
                "transition-colors",
                i === 6 ? "font-bold text-amber-500" : hoveredIdx === i ? "text-foreground font-semibold" : ""
              )}
            >
              {d.short}
            </span>
          ))}
        </div>
      </div>
    </div>
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
