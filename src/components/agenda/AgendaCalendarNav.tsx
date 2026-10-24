import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MONTHS_ES } from "./agenda-helpers";

interface AgendaCalendarNavProps {
  currentDate: Date;
  onCurrentDateChange: (d: Date) => void;
  calendarView: string;
  onCalendarViewChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
}

export function AgendaCalendarNav({
  currentDate,
  onCurrentDateChange,
  calendarView,
  onCalendarViewChange,
  statusFilter,
  onStatusFilterChange,
}: AgendaCalendarNavProps) {
  return (
    <div className="flex flex-wrap items-center justify-between p-4 border-b border-border/40 bg-card z-20 relative">
      <div className="flex items-center gap-4">
        <h2 className="text-base font-bold text-foreground">
          {MONTHS_ES[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          type="button"
          onClick={() => onCurrentDateChange(new Date())}
          className="text-xs font-bold text-primary bg-muted/50 px-3 py-1 rounded-lg"
        >
          Hoy
        </button>
        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            type="button"
            aria-label="Periodo anterior"
            onClick={() => {
              if (calendarView === "Mensual") {
                onCurrentDateChange(
                  new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
                );
              } else if (calendarView === "Diaria") {
                onCurrentDateChange(new Date(currentDate.getTime() - 86400000));
              } else {
                onCurrentDateChange(new Date(currentDate.getTime() - 7 * 86400000));
              }
            }}
            className="hover:bg-muted p-1 rounded-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Periodo siguiente"
            onClick={() => {
              if (calendarView === "Mensual") {
                onCurrentDateChange(
                  new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
                );
              } else if (calendarView === "Diaria") {
                onCurrentDateChange(new Date(currentDate.getTime() + 86400000));
              } else {
                onCurrentDateChange(new Date(currentDate.getTime() + 7 * 86400000));
              }
            }}
            className="hover:bg-muted p-1 rounded-md"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg ml-4">
          {["Mensual", "Semanal", "Diaria"].map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => onCalendarViewChange(v)}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-md transition-colors",
                calendarView === v
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
        <button
          type="button"
          onClick={() => onStatusFilterChange("todas")}
          className={cn(
            "hover:text-foreground transition-colors",
            statusFilter === "todas" && "text-primary",
          )}
        >
          Todas
        </button>
        <button
          type="button"
          onClick={() => onStatusFilterChange("pendiente")}
          className={cn(
            "hover:text-foreground transition-colors",
            statusFilter === "pendiente" && "text-primary",
          )}
        >
          En Espera
        </button>
        <button
          type="button"
          onClick={() => onStatusFilterChange("completada")}
          className={cn(
            "hover:text-foreground transition-colors",
            statusFilter === "completada" && "text-primary",
          )}
        >
          Completadas
        </button>
      </div>
    </div>
  );
}
