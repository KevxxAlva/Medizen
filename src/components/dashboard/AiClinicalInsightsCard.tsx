import { useMemo } from "react";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStocks } from "@/lib/api/inventory";

export function AiClinicalInsightsCard() {
  const { data: stocks = [], refetch: refetchStocks, isFetching: fetchingStocks } = useStocks();

  const { data: metrics, refetch: refetchMetrics, isFetching: fetchingMetrics } = useQuery({
    queryKey: ["ai_clinical_insights"],
    queryFn: async () => {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const [{ data: citasData }, { data: facturasData }] = await Promise.all([
        supabase
          .from("citas")
          .select("fecha_hora, estado, motivo")
          .or("motivo.is.null,motivo.not.ilike.%[TEST-LOAD]%")
          .gte("fecha_hora", startOfLastMonth),
        supabase
          .from("facturas")
          .select("fecha_emision, estado_pago")
          .gte("fecha_emision", startOfThisMonth),
      ]);

      const allCitas = citasData || [];
      const thisMonthCitas = allCitas.filter(
        (c) => c.fecha_hora && c.fecha_hora >= startOfThisMonth && (c.estado || "").toLowerCase() !== "cancelada"
      );
      const lastMonthCitas = allCitas.filter(
        (c) =>
          c.fecha_hora &&
          c.fecha_hora >= startOfLastMonth &&
          c.fecha_hora < startOfThisMonth &&
          (c.estado || "").toLowerCase() !== "cancelada"
      );

      const thisCount = thisMonthCitas.length;
      const lastCount = lastMonthCitas.length;
      const deltaPct =
        lastCount > 0 ? Math.round(((thisCount - lastCount) / lastCount) * 100) : thisCount > 0 ? 100 : 0;

      // Find top reason this month
      const reasonCounts: Record<string, number> = {};
      for (const c of thisMonthCitas) {
        const reason = (c.motivo || "Control General").trim();
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      }
      const topReason =
        Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Control Gineco-Obstétrico";

      const completedThisMonth = thisMonthCitas.filter(
        (c) => (c.estado || "").toLowerCase() === "completada"
      ).length;
      const completionRate = thisCount > 0 ? Math.round((completedThisMonth / thisCount) * 100) : 0;

      const monthInvoices = facturasData || [];
      const paidInvoices = monthInvoices.filter((f) =>
        ["pagado", "pagada", "paid"].includes((f.estado_pago || "").toLowerCase())
      ).length;

      return {
        thisCount,
        lastCount,
        deltaPct,
        topReason,
        completedThisMonth,
        completionRate,
        totalInvoices: monthInvoices.length,
        paidInvoices,
      };
    },
  });

  const isRefreshing = fetchingStocks || fetchingMetrics;

  const insights = useMemo(() => {
    const thisCount = metrics?.thisCount ?? 0;
    const deltaPct = metrics?.deltaPct ?? 0;
    const topReason = metrics?.topReason ?? "Control General";

    const trendInsight = {
      id: 1,
      type: "trend",
      title: "Flujo de Consultas del Mes",
      description:
        thisCount > 0
          ? `${thisCount} cita(s) activas registradas este mes (${deltaPct >= 0 ? `+${deltaPct}%` : `${deltaPct}%`} vs. mes anterior). Motivo principal: "${topReason}".`
          : "Aún no se registran citas activas en el mes en curso. Programa nuevas citas desde la Agenda.",
      level: "info" as const,
      badge: thisCount > 0 ? `${deltaPct >= 0 ? "+" : ""}${deltaPct}% Flujo` : "0 Citas",
    };

    const lowOrOutStocks = stocks.filter(
      (s) => s.status === "Out of Stock" || s.status === "Low Stock" || s.quantity <= 20
    );
    const inventoryInsight =
      lowOrOutStocks.length > 0
        ? {
            id: 2,
            type: "inventory",
            title: "Alerta de Inventario Clínico",
            description: `Se detectaron ${lowOrOutStocks.length} insumo(s) con existencias bajas o agotadas: ${lowOrOutStocks
              .slice(0, 3)
              .map((s) => `${s.name} (${s.quantity})`)
              .join(", ")}.`,
            level: "warning" as const,
            badge: `${lowOrOutStocks.length} por Reponer`,
          }
        : {
            id: 2,
            type: "inventory",
            title: "Inventario en Nivel Óptimo",
            description:
              stocks.length > 0
                ? `Los ${stocks.length} artículos registrados en inventario cuentan con stock suficiente para la operación.`
                : "No hay alertas de stock activas en el inventario actual.",
            level: "success" as const,
            badge: "Stock Óptimo",
          };

    const completionRate = metrics?.completionRate ?? 0;
    const completedThisMonth = metrics?.completedThisMonth ?? 0;
    const adherenceInsight = {
      id: 3,
      type: "adherence",
      title: "Cumplimiento de Consultas",
      description:
        thisCount > 0
          ? `${completedThisMonth} de ${thisCount} citas programadas este mes han sido completadas (${completionRate}% de efectividad en atención).`
          : "Sin citas programadas este mes para calcular tasa de asistencia y seguimiento.",
      level: completionRate >= 70 || thisCount === 0 ? ("success" as const) : ("warning" as const),
      badge: `${completionRate}% Atendidas`,
    };

    return [trendInsight, inventoryInsight, adherenceInsight];
  }, [metrics, stocks]);

  const handleRefresh = async () => {
    await Promise.all([refetchMetrics(), refetchStocks()]);
    toast.success("Indicadores clínicos sincronizados con la base de datos");
  };

  return (
    <div className="glass-card rounded-[2rem] p-5 shadow-lg shadow-black/5 flex flex-col border border-border relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Indicadores Clínicos Inteligentes
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/15 text-primary">
                Datos en Vivo
              </span>
            </h3>
            <p className="text-[10px] text-muted-foreground">Análisis automático basado en citas e inventario real</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-muted-foreground hover:text-foreground transition p-1 rounded-lg hover:bg-muted/50"
          title="Actualizar análisis"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-primary")} />
        </button>
      </div>

      {/* Insights List */}
      <div className="space-y-2.5 z-10">
        {insights.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-2xl bg-card/60 hover:bg-card/90 border border-border/40 transition-colors flex items-start gap-3 shadow-xs"
          >
            <div className={cn(
              "h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
              item.level === "info" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
              item.level === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              item.level === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            )}>
              {item.level === "info" && <TrendingUp className="h-3.5 w-3.5" />}
              {item.level === "warning" && <AlertTriangle className="h-3.5 w-3.5" />}
              {item.level === "success" && <CheckCircle2 className="h-3.5 w-3.5" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-bold text-xs text-foreground truncate">{item.title}</span>
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0",
                  item.level === "info" && "bg-blue-500/15 text-blue-700 dark:text-blue-300",
                  item.level === "warning" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                  item.level === "success" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                )}>
                  {item.badge}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

