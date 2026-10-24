import React, { useState } from "react";
import { ChevronDown, Plus, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DonutChart } from "./DashboardCharts";

function DashboardScheduledEventsCard({ stats }: { stats: any }) {
  const [eventsRange, setEventsRange] = useState<"today" | "week">("today");
  const isToday = eventsRange === "today";
  const source = isToday ? stats?.scheduledEvents : stats?.scheduledEvents?.week;

  const donutPercentage = source?.donutPercentage || 0;
  const consultationsCount = source?.consultations || 0;
  const labsCount = source?.labs || 0;
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

      <div className="flex items-center gap-6 mt-2">
        <DonutChart percentage={donutPercentage} />

        <div className="flex flex-col gap-4 flex-1">
          <div>
            <div className="text-xl font-bold text-foreground font-display">
              {consultationsCount}
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Consultas</div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground font-display">{labsCount}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase">
              Análisis de Lab.
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground font-display">{invoicesCount}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase">Facturas</div>
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
  const planLabs = planSource?.labs || 0;
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

      <div className="space-y-5 flex-1">
        <div>
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-foreground">Consultas</span>
            <span className="text-foreground">{planConsultations}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-500"
              style={{ width: `${planConsultations}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-foreground">Análisis</span>
            <span className="text-foreground">{planLabs}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary rounded-full transition-[width] duration-500"
              style={{ width: `${planLabs}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-foreground">Facturas Pagadas</span>
            <span className="text-foreground">{planInvoices}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground/50 rounded-full transition-[width] duration-500"
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
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-foreground flex items-center gap-2">
                  {goal.title}
                  {isComplete && <Check className="h-3 w-3 text-emerald-500" />}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground">{percentage}%</span>
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
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-[width] duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
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
