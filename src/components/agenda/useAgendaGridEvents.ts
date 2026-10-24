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

        return d >= weekStart && d <= weekEnd && matchesSearch && matchesStatus;
      })
      .map((app) => {
        const safeIso = app.scheduled_at.replace(" ", "T");
        const dateStr = dateOnly(safeIso);
        const date = new Date(safeIso);
        const hour = date.getHours();
        const mins = date.getMinutes();

        const startFloat = hour + mins / 60;
        const startFrom8 = startFloat - 8;
        const durationHours = (app.duration_minutes || 60) / 60;

        const isCompletada = app.status?.toLowerCase() === "completada";
        const theme = isCompletada
          ? {
              bg: "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30",
              border: "border-l-emerald-500",
              text: "text-emerald-700 dark:text-emerald-400",
            }
          : {
              bg: "bg-primary/10 dark:bg-primary/15 border-primary/30",
              border: "border-l-primary",
              text: "text-primary dark:text-blue-400",
            };

        return {
          ...app,
          dateStr,
          dayIndex: date.getDay() === 0 ? 6 : date.getDay() - 1,
          topHours: Math.max(0, startFrom8),
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
