import { APP_TIME_ZONE } from "@/lib/constants/locale";
import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardCalendarWidgetProps {
  appointments: any[];
  today: Date;
}

export function DashboardCalendarWidget({ appointments, today }: DashboardCalendarWidgetProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointmentPage, setAppointmentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset page when selected date changes
  useEffect(() => {
    setAppointmentPage(1);
  }, [selectedDate]);

  const selectedDateStr = useMemo(() => {
    return selectedDate.toISOString().slice(0, 10);
  }, [selectedDate]);

  const selectedDateAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.scheduled_at.slice(0, 10) === selectedDateStr)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [appointments, selectedDateStr]);

  const currentWeek = useMemo(() => {
    const days = [];
    const date = new Date(selectedDate);
    // Move to Sunday of selected date's week
    date.setDate(date.getDate() - date.getDay());
    for (let i = 0; i < 7; i++) {
      const fullDate = new Date(date);
      days.push({
        day: date
          .toLocaleString("es-ES", { weekday: "short" })
          .slice(0, 3)
          .replace(/^\w/, (c) => c.toUpperCase()),
        date: date.getDate(),
        fullDate,
        dateStr: fullDate.toISOString().slice(0, 10),
        active: fullDate.toDateString() === selectedDate.toDateString(),
      });
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedDate]);

  return (
    <div
      id="calendar-widget"
      className="glass-card rounded-[2rem] overflow-hidden shadow-lg shadow-black/5 flex flex-col"
    >
      {/* Calendar Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-6 py-4 border-b border-border">
        <span className="text-xs font-bold uppercase tracking-widest">Mi Calendario</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const prev = new Date(selectedDate);
              prev.setDate(prev.getDate() - 7);
              setSelectedDate(prev);
            }}
            className="p-1 hover:bg-black/20 rounded-lg transition border border-white/10 cursor-pointer"
            title="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="bg-black/20 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-black/30 transition capitalize border border-white/10 cursor-pointer"
          >
            {selectedDate.toLocaleString("es-ES", { month: "long" })} {selectedDate.getFullYear()}
          </button>
          <button
            onClick={() => {
              const next = new Date(selectedDate);
              next.setDate(next.getDate() + 7);
              setSelectedDate(next);
            }}
            className="p-1 hover:bg-black/20 rounded-lg transition border border-white/10 cursor-pointer"
            title="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid (Interactive Row of Days) */}
      <div className="bg-card px-4 py-3.5 border-b border-border">
        <div className="flex justify-between items-center gap-1">
          {currentWeek.map((d) => (
            <button
              key={d.dateStr}
              onClick={() => setSelectedDate(d.fullDate)}
              className={cn(
                "flex flex-col items-center justify-center w-12 py-2 rounded-[1rem] transition-transform cursor-pointer hover:scale-105",
                d.active
                  ? "bg-primary text-primary-foreground shadow-md font-bold"
                  : "text-muted-foreground bg-transparent hover:bg-background/60 hover:text-foreground",
              )}
            >
              <span className="text-[10px] font-bold mb-1">{d.day}</span>
              <span
                className={cn(
                  "text-sm font-bold",
                  d.active ? "text-primary-foreground" : "text-foreground",
                )}
              >
                {d.date}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline for Selected Date */}
      <div className="px-6 py-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <span>
              {selectedDate
                .toLocaleString("es-ES", { month: "long", day: "numeric", year: "numeric" })
                .toUpperCase()}
            </span>
            {selectedDate.toDateString() === today.toDateString() && (
              <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                HOY
              </span>
            )}
          </h3>
          <span className="text-xs text-muted-foreground font-semibold">
            {selectedDateAppointments.length} cita(s)
          </span>
        </div>

        <div className="flex flex-col space-y-1">
          {selectedDateAppointments.length > 0 ? (
            <>
              {selectedDateAppointments
                .slice((appointmentPage - 1) * itemsPerPage, appointmentPage * itemsPerPage)
                .map((app, i) => {
                  const d = new Date(app.scheduled_at);
                  const time = d.toLocaleTimeString("es-ES", {
                    timeZone: APP_TIME_ZONE,
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isEven = i % 2 === 0;
                  const dotColor = isEven ? "var(--color-primary)" : "var(--color-secondary)";
                  return (
                    <div
                      key={app.id}
                      className="relative flex flex-col pt-2 pb-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors -mx-4 px-4 rounded-xl"
                    >
                      <div className="flex items-center gap-3 text-xs font-bold">
                        <span className="w-14 text-left text-muted-foreground font-medium">
                          {time}
                        </span>
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: dotColor }}
                        />
                        <span className="text-foreground truncate flex-1">
                          Consulta con {app.patient_name}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                            app.status === "completada"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : app.status === "cancelada"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-primary/10 text-primary",
                          )}
                        >
                          {app.status}
                        </span>
                      </div>
                    </div>
                  );
                })}

              {selectedDateAppointments.length > itemsPerPage && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/40">
                  <button
                    onClick={() => setAppointmentPage((p) => Math.max(1, p - 1))}
                    disabled={appointmentPage === 1}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-muted hover:bg-muted/80 rounded-lg disabled:opacity-50 transition cursor-pointer text-foreground"
                  >
                    Anterior
                  </button>
                  <span className="text-xs text-muted-foreground font-bold">
                    Página {appointmentPage} de{" "}
                    {Math.ceil(selectedDateAppointments.length / itemsPerPage)}
                  </span>
                  <button
                    onClick={() =>
                      setAppointmentPage((p) =>
                        Math.min(Math.ceil(selectedDateAppointments.length / itemsPerPage), p + 1),
                      )
                    }
                    disabled={
                      appointmentPage === Math.ceil(selectedDateAppointments.length / itemsPerPage)
                    }
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-muted hover:bg-muted/80 rounded-lg disabled:opacity-50 transition cursor-pointer text-foreground"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
              <CalendarClock className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-bold text-foreground">Sin eventos para este día</p>
              <p className="text-xs text-muted-foreground font-medium">
                No hay citas programadas para esta fecha
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
