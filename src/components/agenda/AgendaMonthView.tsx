import { cn } from "@/lib/utils";
import type { AppointmentWithPatient } from "@/lib/api/appointments";
import { formatToYMD, dateOnly, timeOnly, WEEKDAYS_SHORT } from "./agenda-helpers";

interface AgendaMonthViewProps {
  currentDate: Date;
  monthDays: Date[];
  todayStr: string;
  appointments: AppointmentWithPatient[];
  searchQuery: string;
  statusFilter: string;
  onSelectDay: (date: Date) => void;
  onEditAppointment: (app: AppointmentWithPatient) => void;
}

export function AgendaMonthView({
  currentDate,
  monthDays,
  todayStr,
  appointments,
  searchQuery,
  statusFilter,
  onSelectDay,
  onEditAppointment,
}: AgendaMonthViewProps) {
  return (
    <div className="flex flex-col min-h-full bg-card relative min-w-[640px] sm:min-w-full">
      {/* Monthly Header */}
      <div className="sticky top-0 z-20 grid grid-cols-7 border-b border-border/40 bg-card">
        {WEEKDAYS_SHORT.map((dayName) => (
          <div
            key={dayName}
            className="text-center py-3 border-r border-border/40 last:border-0"
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {dayName}
            </p>
          </div>
        ))}
      </div>
      {/* Monthly Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5">
        {monthDays.map((d) => {
          const isToday = formatToYMD(d) === todayStr;
          const isCurrentMonth = d.getMonth() === currentDate.getMonth();

          const dayEvents = appointments.filter((a) => {
            const safeIso = a.scheduled_at.replace(" ", "T");
            const matchesSearch =
              !searchQuery ||
              (a.patient_name &&
                a.patient_name.toLowerCase().includes(searchQuery.toLowerCase()));
            const statusLower = (a.status || "").toLowerCase();
            let matchesStatus = true;
            if (statusFilter === "todas") {
              matchesStatus = statusLower !== "cancelada";
            } else if (statusFilter === "pendiente") {
              matchesStatus = ["pendiente", "programada", "confirmada"].includes(statusLower);
            } else if (statusFilter === "completada") {
              matchesStatus = statusLower === "completada";
            } else if (statusFilter === "cancelada") {
              matchesStatus = statusLower === "cancelada";
            } else {
              matchesStatus = statusLower === statusFilter.toLowerCase();
            }
            return (
              dateOnly(safeIso) === formatToYMD(d) && matchesSearch && matchesStatus
            );
          });

          return (
            <div
              key={formatToYMD(d)}
              className={cn(
                "border-r border-b border-border/40 p-2 min-h-[120px] overflow-hidden flex flex-col relative group",
                !isCurrentMonth && "bg-muted/30 opacity-50",
                isToday && "bg-muted/50",
              )}
            >
              <button
                type="button"
                aria-label={`Ver semana del ${formatToYMD(d)}`}
                onClick={() => onSelectDay(d)}
                className="absolute inset-0 w-full h-full cursor-pointer hover:bg-muted/40 transition-colors z-0"
              />
              <div className="flex justify-between items-center mb-1 shrink-0 relative z-10 pointer-events-none">
                <span
                  className={cn(
                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                    isToday ? "bg-primary text-primary-foreground" : "text-foreground",
                  )}
                >
                  {d.getDate()}
                </span>
              </div>
              <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar relative z-10">
                {dayEvents.map((ev) => {
                  const dotColor =
                    ev.status?.toLowerCase() === "completada"
                      ? "bg-green-500"
                      : "bg-blue-500";
                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`Editar cita de ${ev.patient_name}`}
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditAppointment(ev);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          e.preventDefault();
                          onEditAppointment(ev);
                        }
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-bold px-1.5 py-1 rounded hover:bg-muted transition"
                    >
                      <div
                        className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)}
                      />
                      <span className="truncate">
                        {timeOnly(ev.scheduled_at.replace(" ", "T"))} {ev.patient_name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
