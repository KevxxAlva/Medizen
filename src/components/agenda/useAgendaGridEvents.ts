import { useMemo } from "react";
import type { AppointmentWithPatient } from "@/lib/api/appointments";
import { dateOnly, formatToYMD } from "./agenda-helpers";

export function useAgendaGridEvents(
  appointments: AppointmentWithPatient[],
  weekDays: Date[],
  searchQuery: string,
  statusFilter: string,
) {
  return useMemo(() => {
    const weekStart = formatToYMD(weekDays[0]);
    const weekEnd = formatToYMD(weekDays[6]);

    const processed = appointments
      .filter((a) => {
        const safeIso = a.scheduled_at.replace(" ", "T");
        const d = dateOnly(safeIso);
        const matchesSearch =
          !searchQuery ||
          (a.patient_name && a.patient_name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus =
          statusFilter === "todas" ? a.status !== "cancelada" : a.status === statusFilter;
        return d >= weekStart && d <= weekEnd && matchesSearch && matchesStatus;
      })
      .map((app) => {
        const safeIso = app.scheduled_at.replace(" ", "T");
        const date = new Date(safeIso);
        const hour = date.getHours();
        const mins = date.getMinutes();

        const startFloat = hour + mins / 60;
        const startFrom8 = startFloat - 8;
        const durationHours = (app.duration_minutes || 60) / 60;

        const theme =
          app.status?.toLowerCase() === "completada"
            ? {
                bg: "bg-green-50/90 backdrop-blur-sm",
                border: "border-green-400",
                text: "text-green-700",
              }
            : {
                bg: "bg-primary/10 backdrop-blur-sm",
                border: "border-blue-300",
                text: "text-primary",
              };

        return {
          ...app,
          dayIndex: date.getDay() === 0 ? 6 : date.getDay() - 1,
          topHours: startFrom8,
          durationHours,
          theme,
        };
      })
      .sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
        return a.topHours - b.topHours;
      });

    const result = [];
    let currentGroup: any[] = [];
    for (const ev of processed) {
      currentGroup = currentGroup.filter(
        (g) => g.dayIndex === ev.dayIndex && g.topHours + g.durationHours > ev.topHours,
      );
      ev.overlapIndex = currentGroup.length;
      currentGroup.push(ev);
      result.push(ev);
    }

    return result;
  }, [appointments, weekDays, searchQuery, statusFilter]);
}
