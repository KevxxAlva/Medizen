import { ChevronLeft, ChevronRight, MoreHorizontal, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AppointmentWithPatient } from "@/lib/api/appointments";
import { formatToYMD, WEEKDAYS_SHORT } from "./agenda-helpers";

interface AgendaSidebarProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  monthDays: Date[];
  gridEvents: any[];
  showAllSidebarApps: boolean;
  onToggleShowAll: () => void;
  onNewAppointment: () => void;
  onEditAppointment: (app: AppointmentWithPatient) => void;
  onDownloadAgenda: () => void;
}

export function AgendaSidebar({
  currentDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  monthDays,
  gridEvents,
  showAllSidebarApps,
  onToggleShowAll,
  onNewAppointment,
  onEditAppointment,
  onDownloadAgenda,
}: AgendaSidebarProps) {
  return (
    <aside className="w-full lg:w-[280px] flex flex-col gap-8 shrink-0">
      {/* Appointment Calendar */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-sm tracking-wide text-foreground">
            Calendario de Citas
          </h2>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={onPrevMonth}
              className="h-6 w-6 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:opacity-90"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={onNextMonth}
              className="h-6 w-6 flex items-center justify-center bg-muted text-gray-400 rounded-full hover:bg-gray-200"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center gap-y-3 gap-x-1">
          {WEEKDAYS_SHORT.map((d) => (
            <div key={d} className="text-[10px] font-bold text-muted-foreground">
              {d}
            </div>
          ))}
          {monthDays.map((d) => {
            const isCurrentMonth = d.getMonth() === currentDate.getMonth();
            const isSelected = formatToYMD(d) === formatToYMD(currentDate);
            return (
              <button
                type="button"
                key={formatToYMD(d)}
                aria-label={`Seleccionar ${formatToYMD(d)}`}
                onClick={() => onSelectDate(d)}
                className={cn(
                  "h-8 w-8 mx-auto flex items-center justify-center text-xs font-bold rounded-full cursor-pointer transition-colors",
                  !isCurrentMonth && "text-gray-300",
                  isCurrentMonth && !isSelected && "text-foreground hover:bg-muted",
                  isSelected && "bg-primary text-primary-foreground shadow-md",
                )}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-border/40" />

      {/* Doctor Appointment List */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-sm tracking-wide text-foreground">
            Lista de Citas Médicas
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Opciones de citas"
                className="text-muted-foreground border border-border/40 p-1 rounded-lg hover:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuItem
                onClick={onNewAppointment}
                className="text-xs font-bold cursor-pointer"
              >
                Nueva Cita
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDownloadAgenda}
                className="text-xs font-bold cursor-pointer"
              >
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2">
          {gridEvents.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground mt-10">
              No hay citas en este rango de fechas.
            </div>
          ) : (
            (showAllSidebarApps ? gridEvents : gridEvents.slice(0, 10)).map((app) => {
              const safeIso = app.scheduled_at.replace(" ", "T");
              const d = new Date(safeIso);
              const end = new Date(d.getTime() + (app.duration_minutes || 60) * 60000);
              const pad = (n: number) => String(n).padStart(2, "0");
              const patientInitials = (app.patient_name || "P")
                .split(" ")
                .filter(Boolean)
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <button
                  type="button"
                  key={app.id}
                  aria-label={`Ver o editar cita de ${app.patient_name}`}
                  onClick={() => onEditAppointment(app)}
                  className="w-full text-left flex items-center justify-between group cursor-pointer p-2 hover:bg-muted/50 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border-2 border-card shadow-sm shrink-0">
                      {patientInitials}
                    </div>
                    <div className="overflow-hidden max-w-[120px]">
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition truncate">
                        {app.patient_name}
                      </p>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                        {app.reason || "Cita"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Clock className="h-3 w-3 text-muted-foreground ml-auto mb-0.5" />
                    <p className="text-[10px] font-bold text-foreground">
                      {pad(d.getHours())}:{pad(d.getMinutes())} - {pad(end.getHours())}:
                      {pad(end.getMinutes())}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={onToggleShowAll}
          className="mt-4 w-full bg-primary text-primary-foreground text-xs font-bold py-3 rounded-2xl hover:bg-[#3451d6] transition shadow-md shadow-primary/20 cursor-pointer"
        >
          {showAllSidebarApps ? "Mostrar Menos" : `Ver Todo (${gridEvents.length})`}
        </button>
      </div>
    </aside>
  );
}
