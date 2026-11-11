import { memo } from "react";
import { Calendar, Clock, Plus, ReceiptText, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DoctorOption } from "@/lib/api/profiles";
import type { WaitingRoomColumns } from "./waitingRoomHelpers";

interface WaitingRoomHeaderAndKpisProps {
  isDoctorOnly: boolean;
  doctorName?: string | null;
  canViewAllDoctors: boolean;
  selectedDate: string;
  todayYmd: string;
  tomorrowYmd: string;
  onSelectDate: (dateYmd: string) => void;
  selectedDoctorId: string;
  onSelectDoctor: (docId: string) => void;
  doctors: DoctorOption[];
  onOpenNewAppointment: () => void;
  columns: WaitingRoomColumns;
  pendingCashCount: number;
}

export const WaitingRoomHeaderAndKpis = memo(function WaitingRoomHeaderAndKpis({
  isDoctorOnly,
  doctorName,
  canViewAllDoctors,
  selectedDate,
  todayYmd,
  tomorrowYmd,
  onSelectDate,
  selectedDoctorId,
  onSelectDoctor,
  doctors,
  onOpenNewAppointment,
  columns,
  pendingCashCount,
}: WaitingRoomHeaderAndKpisProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"
            />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
              Recepción y Flujo Clínico en Vivo
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mt-0.5">
            Sala de Espera y Turnos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isDoctorOnly
              ? `Pacientes asignados a tu consulta — Dr(a). ${doctorName || "Especialista"}`
              : "Control sincronizado entre Recepción, Consultorios Médicos y Caja"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="group"
            aria-label="Selector rápido de fecha"
            className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/60"
          >
            <button
              type="button"
              aria-pressed={selectedDate === todayYmd}
              onClick={() => onSelectDate(todayYmd)}
              className={cn(
                "min-h-11 sm:min-h-8 px-3.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-[background-color,color,transform] duration-150 active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                selectedDate === todayYmd
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Hoy
            </button>
            <button
              type="button"
              aria-pressed={selectedDate === tomorrowYmd}
              onClick={() => onSelectDate(tomorrowYmd)}
              className={cn(
                "min-h-11 sm:min-h-8 px-3.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-[background-color,color,transform] duration-150 active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                selectedDate === tomorrowYmd
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Mañana
            </button>
          </div>

          <Input
            type="date"
            aria-label="Fecha de sala de espera"
            value={selectedDate}
            onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            className="w-[155px] h-11 sm:h-9 rounded-xl text-xs font-semibold"
          />

          {canViewAllDoctors && (
            <Select value={selectedDoctorId} onValueChange={onSelectDoctor}>
              <SelectTrigger
                aria-label="Filtrar por especialista"
                className="w-[200px] h-11 sm:h-9 rounded-xl text-xs font-semibold"
              >
                <SelectValue placeholder="Todos los médicos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todos los especialistas</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    Dr(a). {d.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            type="button"
            onClick={onOpenNewAppointment}
            className="h-11 sm:h-9 rounded-xl text-xs font-bold gap-1.5 active:scale-95 transition-[background-color,color,transform] duration-150"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agendar Turno
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Por Llegar
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">
              {columns.porLlegar.length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              En Sala de Espera
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">
              {columns.enEspera.length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/[0.06] p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              En Consultorio
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">
              {columns.enConsulta.length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Stethoscope className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Atendidos / Caja
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-2xl font-extrabold text-foreground">{columns.atendidos.length}</p>
              {pendingCashCount > 0 && (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  ({pendingCashCount} por cobrar)
                </span>
              )}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ReceiptText className="h-5 w-5" />
          </div>
        </div>
      </div>
    </>
  );
});
