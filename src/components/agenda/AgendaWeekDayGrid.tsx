import { Clock, MoreHorizontal, Network, Stethoscope, Users, MessageCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AppointmentWithPatient } from "@/lib/api/appointments";
import { getStoredExchangeRate, formatBs } from "@/hooks/useExchangeRate";
import { formatToYMD, timeOnly, WEEKDAYS_SHORT, HOURS } from "./agenda-helpers";

interface AgendaWeekDayGridProps {
  calendarView: string;
  daysToRender: Date[];
  todayStr: string;
  compactMode: boolean;
  gridEvents: any[];
  onNewAppointmentAtDate: (dateStr: string) => void;
  onEditAppointment: (app: AppointmentWithPatient) => void;
  onDeleteAppointment: (id: string) => void;
  onStartConsultation: (app: AppointmentWithPatient) => void;
}

function AgendaDaysHeader({
  calendarView,
  daysToRender,
}: {
  calendarView: string;
  daysToRender: Date[];
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 flex bg-card border-b border-border",
        calendarView !== "Diaria" ? "min-w-[640px] sm:min-w-full" : "min-w-full",
      )}
    >
      <div className="w-16 shrink-0 border-r border-border bg-card flex items-center justify-center">
        <span className="text-[10px] font-bold text-muted-foreground">GMT-4</span>
      </div>
      <div
        className={cn(
          "flex-1 grid",
          calendarView === "Diaria" ? "grid-cols-1" : "grid-cols-7",
        )}
      >
        {daysToRender.map((d) => (
          <div
            key={formatToYMD(d)}
            className="text-center py-3 border-r border-border last:border-0"
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {WEEKDAYS_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1]} {d.getDate()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgendaGridEventCard({
  ev,
  compactMode,
  onEditAppointment,
  onDeleteAppointment,
  onStartConsultation,
}: {
  ev: any;
  compactMode: boolean;
  onEditAppointment: (app: AppointmentWithPatient) => void;
  onDeleteAppointment: (id: string) => void;
  onStartConsultation: (app: AppointmentWithPatient) => void;
}) {
  const pxPerHour = compactMode ? 48 : 96;
  const topPx = ev.topHours * pxPerHour;
  const heightPx = Math.max(compactMode ? 36 : 48, ev.durationHours * pxPerHour);

  const handleSendReminder = () => {
    const bcvRate = getStoredExchangeRate();
    const priceUsd = Number(ev.price) || 35;
    const dateFormatted = new Date(
      ev.scheduled_at.replace(" ", "T"),
    ).toLocaleDateString("es-VE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    const timeFormatted = timeOnly(ev.scheduled_at.replace(" ", "T"));
    const message = [
      `🏥 *Clínica FemeSalud (Medizen)*`,
      `Hola *${ev.patient_name || "Paciente"}*, te recordamos tu cita médica:`,
      `📅 *Fecha:* ${dateFormatted}`,
      `⏰ *Hora:* ${timeFormatted}`,
      `🩺 *Servicio:* ${ev.reason || "Consulta Médica"}`,
      `💵 *Honorarios:* $${priceUsd.toFixed(2)} USD (${formatBs(priceUsd, bcvRate)} a tasa BCV)`,
      `💳 *Métodos de pago disponibles:* Pago Móvil, Transferencia, Efectivo Bs., Divisas ($/€), Binance Pay (USDT) y Cashea.`,
      `Por favor responde *CONFIRMAR* para asegurar tu turno.`,
    ].join("\n");
    const phoneClean = String(ev.patient_phone || "").replace(/\D/g, "");
    const waPhone = phoneClean
      ? phoneClean.startsWith("0")
        ? `58${phoneClean.slice(1)}`
        : phoneClean.startsWith("58")
        ? phoneClean
        : `58${phoneClean}`
      : "";
    const url = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute rounded-[1rem] p-3 text-xs font-bold cursor-pointer transition-transform hover:scale-[1.02] hover:!z-50 overflow-hidden shadow-sm border border-l-4",
            ev.theme.bg,
            ev.theme.border,
            ev.theme.text,
          )}
          style={{
            top: `${topPx}px`,
            height: `${heightPx}px`,
            left: `${(ev.overlapIndex || 0) * 16 + 4}px`,
            right: `4px`,
            zIndex: 10 + (ev.overlapIndex || 0),
          }}
        >
          <p className="truncate font-extrabold">{ev.patient_name}</p>
          <p className="text-[10px] opacity-80 font-medium tracking-wide mt-0.5 flex gap-1">
            {timeOnly(ev.scheduled_at.replace(" ", "T"))} -{" "}
            {timeOnly(
              new Date(
                new Date(ev.scheduled_at.replace(" ", "T")).getTime() +
                  ev.durationHours * 3600000,
              ).toISOString(),
            )}
          </p>
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="right"
        className="w-64 p-0 rounded-2xl shadow-xl border-border/40 z-50"
      >
        <div className="px-4 py-3 flex justify-between items-center border-b border-border/40">
          <span className="text-xs font-bold text-foreground tracking-wide">
            Editar Horario
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Más opciones de cita"
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
              <DropdownMenuItem
                className="text-xs font-bold text-destructive focus:text-destructive cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAppointment(ev.id);
                }}
              >
                Eliminar Cita
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-3 text-sm">
            <div className="mt-0.5 shrink-0">
              <div className="h-3 w-3 rounded-full border-2 border-[#4361ee]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground leading-tight">{ev.patient_name}</p>
              <p className="text-[10px] text-primary font-medium mt-0.5 cursor-pointer hover:underline">
                Añadir Descripción
              </p>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-foreground text-xs">Añadir Hora</p>
              <p className="text-[10px] text-primary font-medium mt-0.5">
                {timeOnly(ev.scheduled_at.replace(" ", "T"))} →{" "}
                {timeOnly(
                  new Date(
                    new Date(ev.scheduled_at.replace(" ", "T")).getTime() +
                      ev.durationHours * 3600000,
                  ).toISOString(),
                )}
              </p>
            </div>
            <button
              type="button"
              aria-label="Conexión de red de cita"
              className="text-muted-foreground"
            >
              <Network className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-3 text-sm">
            <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-foreground text-xs">Motivo / Servicio</p>
              <div className="flex items-center justify-between gap-1 mt-1">
                <p className="text-[11px] text-muted-foreground font-semibold truncate">
                  {ev.reason || "Consulta Médica"}
                </p>
                {Number(ev.price) > 0 && (
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                    ${Number(ev.price).toFixed(2)} (
                    {formatBs(Number(ev.price), getStoredExchangeRate())})
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendReminder}
            className="w-full py-2 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Recordatorio + Tasa BCV (WhatsApp)
          </button>
        </div>
        <div className="p-3 border-t border-border/40 flex justify-end gap-2 bg-muted/50 rounded-b-2xl">
          <button
            type="button"
            onClick={() => onEditAppointment(ev)}
            className="text-xs font-bold text-foreground hover:bg-gray-200 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onStartConsultation(ev)}
            className={`text-xs font-bold text-primary-foreground px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer ${
              ev.status?.toLowerCase() === "completada"
                ? "bg-[#05c46b] hover:bg-[#04b060]"
                : "bg-primary hover:bg-[#3f37c9]"
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            {ev.status?.toLowerCase() === "completada"
              ? "Ver / Editar Consulta"
              : "Iniciar Consulta"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AgendaWeekDayGrid({
  calendarView,
  daysToRender,
  todayStr,
  compactMode,
  gridEvents,
  onNewAppointmentAtDate,
  onEditAppointment,
  onDeleteAppointment,
  onStartConsultation,
}: AgendaWeekDayGridProps) {
  return (
    <>
      <AgendaDaysHeader
        calendarView={calendarView}
        daysToRender={daysToRender}
      />

      {/* Grid Lines & Events Container */}
      <div
        className={cn(
          "flex relative",
          calendarView !== "Diaria" ? "min-w-[640px] sm:min-w-full" : "min-w-full",
        )}
      >
        {/* Y-Axis Hours */}
        <div className="w-16 shrink-0 border-r border-border bg-card relative z-10">
          {HOURS.map((h, i) => (
            <div
              key={h}
              className={cn(
                "border-b border-transparent relative flex items-start justify-center pt-2",
                compactMode ? "h-12" : "h-24",
              )}
            >
              {i > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold text-muted-foreground bg-card px-1",
                    compactMode ? "-mt-3" : "-mt-4",
                  )}
                >
                  {h < 12 ? h : h === 12 ? 12 : h - 12} {h < 12 ? "AM" : "PM"}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div
          className={cn(
            "flex-1 grid relative",
            calendarView === "Diaria" ? "grid-cols-1" : "grid-cols-7",
          )}
        >
          {/* Background horizontal lines */}
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            {HOURS.map((h, i) => (
              <div
                key={h}
                className={cn(
                  "w-full",
                  compactMode ? "h-12" : "h-24",
                  i > 0 && "border-t border-border",
                )}
              />
            ))}
          </div>

          {/* Day Columns */}
          {daysToRender.map((d, colIndex) => {
            const dateStr = formatToYMD(d);
            const isToday = dateStr === todayStr;
            const actualDayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon
            const dayEvents = gridEvents.filter((ev) =>
              ev.dateStr ? ev.dateStr === dateStr : ev.dayIndex === actualDayIndex,
            );

            return (
              <div
                key={colIndex}
                className={cn(
                  "border-r border-border last:border-0 relative h-full min-h-[800px]",
                  isToday && "bg-muted/50",
                )}
              >
                <button
                  type="button"
                  aria-label={`Crear cita para ${dateStr}`}
                  onClick={() => onNewAppointmentAtDate(dateStr)}
                  className="absolute inset-0 w-full h-full cursor-pointer hover:bg-muted/30 transition-colors z-0"
                />
                {dayEvents.map((ev) => (
                  <AgendaGridEventCard
                    key={ev.id}
                    ev={ev}
                    compactMode={compactMode}
                    onEditAppointment={onEditAppointment}
                    onDeleteAppointment={onDeleteAppointment}
                    onStartConsultation={onStartConsultation}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
