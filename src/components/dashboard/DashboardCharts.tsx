import { APP_TIME_ZONE } from "@/lib/constants/locale";
import React, { useMemo, useState, useEffect, memo, useSyncExternalStore } from "react";
import { Clock } from "lucide-react";

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

export const MonthlyPaymentsChart = memo(function MonthlyPaymentsChart({ data }: { data: any[] }) {
  const recharts = useRecharts();
  if (!recharts) {
    return (
      <div className="h-full w-full bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground text-xs font-medium animate-pulse">
        Cargando gráfico...
      </div>
    );
  }
  const { ResponsiveContainer, AreaChart, Area, Tooltip } = recharts;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.5} />
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{
            borderRadius: "1rem",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-card)",
            boxShadow:
              "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
          }}
          formatter={(value: number) => [`${value.toFixed(2)}`, "Ingresos"]}
          labelFormatter={(label) => `Día: ${new Date(label).toLocaleDateString()}`}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorPayments)"
        />
      </AreaChart>
    </ResponsiveContainer>
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
      className="flex items-center gap-2.5 bg-card rounded-full px-3.5 py-2 shadow-sm border border-border/40 text-foreground transition-colors hover:border-primary/30 select-none"
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
