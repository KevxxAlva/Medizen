import React, { useState } from "react";
import { ChevronDown, Plus, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DonutChart, MultiRadialRings, SemiGaugeChart } from "./DashboardCharts";

function DashboardScheduledEventsCard({ stats }: { stats: any }) {
  const [eventsRange, setEventsRange] = useState<"today" | "week">("today");
  const isToday = eventsRange === "today";
  const source = isToday ? stats?.scheduledEvents : stats?.scheduledEvents?.week;

  const occupationPercentage = source?.donutPercentage || 0;
  const consultationsCount = source?.consultations || 0;
  const patientsCount = source?.patients ?? source?.labs ?? 0;
  const invoicesCount = source?.invoices || 0;

  return (
    <div className="glass-card rounded-[2rem] p-6 shadow-lg shadow-black/5 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Mis Eventos Programados
        </h3>
        <button
          type="button"
          onClick={() => setEventsRange(isToday ? "week" : "today")}
          className="flex items-center gap-1 text-primary font-bold text-xs bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition cursor-pointer"
        >
          {isToday ? "Hoy" : "7 Días"} <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 mt-1 flex-1">
        <div className="flex flex-col items-center gap-1.5 shrink-0 pt-1">
          <SemiGaugeChart percentage={occupationPercentage} size={145} label="OCUPACIÓN" />
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted/30 px-2.5 py-0.5 rounded-full mt-1">
            Capacidad de turnos
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 flex-1 w-full min-w-0">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Consultas
              </span>
            </div>
            <span className="text-xl font-bold text-foreground font-display tabular-nums">
              {consultationsCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Pacientes Nuevos
              </span>
            </div>
            <span className="text-xl font-bold text-foreground font-display tabular-nums">
              {patientsCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Facturas
              </span>
            </div>
            <span className="text-xl font-bold text-foreground font-display tabular-nums">
              {invoicesCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardGoalsCard({
  stats,
  dailyGoals,
  todayStr,
  addDailyGoal,
  incrementDailyGoal,
}: {
  stats: any;
  dailyGoals: any[];
  todayStr: string;
  addDailyGoal: any;
  incrementDailyGoal: any;
}) {
  const [goalsRange, setGoalsRange] = useState<"today" | "week">("today");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState(1);

  const isToday = goalsRange === "today";
  const planSource = isToday ? stats?.plansDone : stats?.plansDone?.week;
  const planConsultations = planSource?.consultations || 0;
  const planPatients = planSource?.patients ?? planSource?.labs ?? 0;
  const planInvoices = planSource?.invoices || 0;

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addDailyGoal.isPending) return;
    if (!newGoalTitle.trim() || newGoalTarget < 1) return;
    await addDailyGoal.mutateAsync({
      title: newGoalTitle.trim(),
      target_value: newGoalTarget,
      date: todayStr,
    });
    setNewGoalTitle("");
    setNewGoalTarget(1);
    setIsGoalModalOpen(false);
  };

  const ringData = [
    { name: "Consultas", percentage: planConsultations, color: "var(--color-primary, #3b82f6)" },
    { name: "Pacientes", percentage: planPatients, color: "var(--color-secondary, #8b5cf6)" },
    { name: "Facturas", percentage: planInvoices, color: "#10b981" },
  ];

  const allPercentages = [
    planConsultations,
    planPatients,
    planInvoices,
    ...dailyGoals.map((g) =>
      Math.min(Math.round(((g.current_value || 0) / Math.max(g.target_value || 1, 1)) * 100), 100)
    ),
  ];
  const overallAveragePct = Math.round(
    allPercentages.reduce((a, b) => a + b, 0) / Math.max(allPercentages.length, 1)
  );

  return (
    <div className="glass-card rounded-[2rem] p-6 shadow-lg shadow-black/5 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {isToday ? "Mis Metas de Hoy" : "Mis Metas (7 Días)"}
        </h3>
        <button
          type="button"
          onClick={() => setGoalsRange(isToday ? "week" : "today")}
          className="flex items-center gap-1 text-primary font-bold text-xs bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition cursor-pointer"
        >
          {isToday ? "Hoy" : "7 Días"} <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 flex-1">
        {/* Multi-Radial Activity Rings */}
        <div className="flex flex-col items-center gap-2 pt-1 shrink-0">
          <MultiRadialRings
            rings={ringData}
            size={132}
            centerValue={`${overallAveragePct}%`}
            centerLabel="LOGRADO"
          />
          <div className="flex items-center gap-2.5 text-[10px] font-bold text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Cons.</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>Pac.</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Fact.</span>
            </span>
          </div>
        </div>

        {/* Goals Progress Bars & Custom Goals */}
        <div className="space-y-4 flex-1 w-full min-w-0">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Consultas
              </span>
              <span className="text-foreground tabular-nums">{planConsultations}%</span>
            </div>
            <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-[width] duration-500"
                style={{ width: `${planConsultations}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Pacientes Nuevos
              </span>
              <span className="text-foreground tabular-nums">{planPatients}%</span>
            </div>
            <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-[width] duration-500"
                style={{ width: `${planPatients}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Facturas Pagadas
              </span>
              <span className="text-foreground tabular-nums">{planInvoices}%</span>
            </div>
            <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-[width] duration-500"
                style={{ width: `${planInvoices}%` }}
              />
            </div>
          </div>

          {dailyGoals.map((goal) => {
            const percentage = Math.min(
              Math.round((goal.current_value / goal.target_value) * 100),
              100,
            );
            const isComplete = goal.current_value >= goal.target_value;
            return (
              <div key={goal.id}>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-foreground flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span className="truncate">{goal.title}</span>
                    {isComplete && <Check className="h-3 w-3 text-emerald-500 shrink-0" />}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-foreground tabular-nums">{percentage}%</span>
                    {!isComplete && (
                      <button
                        type="button"
                        aria-label={`Incrementar meta ${goal.title}`}
                        onClick={() =>
                          incrementDailyGoal.mutate({
                            id: goal.id,
                            currentValue: goal.current_value,
                            date: goal.date,
                          })
                        }
                        className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-500/30 w-5 h-5 flex items-center justify-center transition disabled:opacity-50"
                        disabled={incrementDailyGoal.isPending}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400 rounded-full transition-[width] duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogTrigger asChild>
          <button className="mt-6 w-full py-2.5 border-2 border-dashed border-border text-muted-foreground font-bold text-xs rounded-xl hover:bg-muted transition flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" /> Añadir meta
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva meta de hoy</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGoal} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>¿Qué quieres lograr hoy?</Label>
              <Input
                placeholder="Ej: Entregar presupuestos"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Cantidad objetivo</Label>
              <Input
                type="number"
                min={1}
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 1)}
              />
            </div>
            <button
              type="submit"
              disabled={addDailyGoal.isPending || !newGoalTitle.trim()}
              className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl mt-2 disabled:opacity-50"
            >
              Guardar Meta
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export interface DashboardGoalsAndEventsProps {
  stats: any;
  dailyGoals: any[];
  todayStr: string;
  addDailyGoal: any;
  incrementDailyGoal: any;
}

export function DashboardGoalsAndEvents({
  stats,
  dailyGoals,
  todayStr,
  addDailyGoal,
  incrementDailyGoal,
}: DashboardGoalsAndEventsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DashboardScheduledEventsCard stats={stats} />
      <DashboardGoalsCard
        stats={stats}
        dailyGoals={dailyGoals}
        todayStr={todayStr}
        addDailyGoal={addDailyGoal}
        incrementDailyGoal={incrementDailyGoal}
      />
    </div>
  );
}
