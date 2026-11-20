import { useMemo } from "react";
import type { AppointmentWithPatient } from "@/lib/api/appointments";
import { dateOnly, formatToYMD } from "./agenda-helpers";

export interface AgendaGridEvent extends AppointmentWithPatient {
  dateStr: string;
  dayIndex: number;
  topHours: number;
  durationHours: number;
  theme: {
    bg: string;
    border: string;
    text: string;
  };
  overlapIndex: number;
  overlapCount: number;
  clusterEvents: AgendaGridEvent[];
  isClusterPrimary: boolean;
}

export function useAgendaGridEvents(
  appointments: AppointmentWithPatient[],
  weekDays: Date[],
  searchQuery: string,
  statusFilter: string,
): AgendaGridEvent[] {
  return useMemo(() => {
    const weekStart = formatToYMD(weekDays[0]);
    const weekEnd = formatToYMD(weekDays[6]);

    const processed: AgendaGridEvent[] = appointments
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
        const durationHours = Math.max(0.5, (app.duration_minutes || 60) / 60);

        const isCompletada = app.status?.toLowerCase() === "completada";
        const theme = isCompletada
          ? {
              bg: "bg-emerald-50 dark:bg-[#0c261d] border-emerald-500/40",
              border: "border-l-emerald-500",
              text: "text-emerald-800 dark:text-emerald-300",
            }
          : {
              bg: "bg-indigo-50 dark:bg-[#141c38] border-primary/40",
              border: "border-l-primary",
              text: "text-primary dark:text-blue-300",
            };

        return {
          ...app,
          dateStr,
          dayIndex: date.getDay() === 0 ? 6 : date.getDay() - 1,
          topHours: Math.max(0, startFloat),
          durationHours,
          theme,
          overlapIndex: 0,
          overlapCount: 1,
          clusterEvents: [],
          isClusterPrimary: true,
        };
      })
      .sort((a, b) => {
        if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
        if (a.topHours !== b.topHours) return a.topHours - b.topHours;
        return b.durationHours - a.durationHours;
      });

    // Group overlapping events into connected clusters per day (Google Calendar column algorithm)
    const byDay = new Map<string, AgendaGridEvent[]>();
    for (const ev of processed) {
      const list = byDay.get(ev.dateStr) || [];
      list.push(ev);
      byDay.set(ev.dateStr, list);
    }

    const result: AgendaGridEvent[] = [];

    for (const dayList of byDay.values()) {
      let cluster: AgendaGridEvent[] = [];
      let clusterEnd = -1;

      const flushCluster = () => {
        if (cluster.length === 0) return;
        const columns: AgendaGridEvent[][] = [];
        for (const ev of cluster) {
          let placed = false;
          for (let c = 0; c < columns.length; c++) {
            const lastInCol = columns[c][columns[c].length - 1];
            if (lastInCol.topHours + lastInCol.durationHours <= ev.topHours + 0.001) {
              columns[c].push(ev);
              ev.overlapIndex = c;
              placed = true;
              break;
            }
          }
          if (!placed) {
            ev.overlapIndex = columns.length;
            columns.push([ev]);
          }
        }

        const totalCols = Math.max(1, columns.length);
        const snapshot = [...cluster];
        cluster.forEach((ev, idx) => {
          ev.overlapCount = totalCols;
          ev.clusterEvents = snapshot;
          ev.isClusterPrimary = idx === 0;
          result.push(ev);
        });
      };

      for (const ev of dayList) {
        if (cluster.length > 0 && ev.topHours >= clusterEnd - 0.001) {
          flushCluster();
          cluster = [];
          clusterEnd = -1;
        }
        cluster.push(ev);
        clusterEnd = Math.max(clusterEnd, ev.topHours + ev.durationHours);
      }
      flushCluster();
    }

    return result;
  }, [appointments, weekDays, searchQuery, statusFilter]);
}
