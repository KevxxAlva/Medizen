import { useState } from "react";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, Activity, ShieldCheck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AiClinicalInsightsCard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [insights, setInsights] = useState([
    {
      id: 1,
      type: "trend",
      title: "Alta Demanda Gineco-Obstétrica",
      description: "Aumento del 22% en consultas de control prenatal este mes. Se sugiere pre-reservar ecógrafo para turno vespertino.",
      level: "info",
      badge: "+22% Demanda",
    },
    {
      id: 2,
      type: "inventory",
      title: "Optimización de Inventario",
      description: "Consumo acelerado de guantes estériles y espéculos descartables. Nivel óptimo sugerido: reordenar en 5 días.",
      level: "warning",
      badge: "Sugerencia Stock",
    },
    {
      id: 3,
      type: "adherence",
      title: "Adherencia al Tratamiento",
      description: "94% de pacientes con récipes descargados han acudido o confirmado seguimiento clínico satisfactorio.",
      level: "success",
      badge: "94% Éxito",
    },
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Insights clínicos actualizados por IA");
    }, 700);
  };

  return (
    <div className="glass-card rounded-[2rem] p-5 shadow-lg shadow-black/5 flex flex-col border border-border/50 relative overflow-hidden">
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
              Insights Clínicos IA
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary/15 text-primary">
                Smart Pulse
              </span>
            </h3>
            <p className="text-[10px] text-muted-foreground">Análisis predictivo de flujo y patrones médicos</p>
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
            className="p-3 rounded-2xl bg-card/60 hover:bg-card/90 border border-border/40 transition-all flex items-start gap-3 shadow-xs"
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
