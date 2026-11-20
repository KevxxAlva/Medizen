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

function sendAppointmentReminder(target: any) {
  const bcvRate = getStoredExchangeRate();
  const priceUsd = Number(target.price) || 35;
  const dateFormatted = new Date(target.scheduled_at.replace(" ", "T")).toLocaleDateString("es-VE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  const timeFormatted = timeOnly(target.scheduled_at.replace(" ", "T"));
  const message = [
    `🏥 *Clínica FemeSalud (Medizen)*`,
    `Hola *${target.patient_name || "Paciente"}*, te recordamos tu cita médica:`,
    `📅 *Fecha:* ${dateFormatted}`,
    `⏰ *Hora:* ${timeFormatted}`,
    `🩺 *Servicio:* ${target.reason || "Consulta Médica"}`,
    `💵 *Honorarios:* $${priceUsd.toFixed(2)} USD (${formatBs(priceUsd, bcvRate)} a tasa BCV)`,
    `💳 *Métodos de pago disponibles:* Pago Móvil, Transferencia, Efectivo Bs., Divisas ($/€), Binance Pay (USDT) y Cashea.`,
    `Por favor responde *CONFIRMAR* para asegurar tu turno.`,
  ].join("\n");
  const phoneClean = String(target.patient_phone || "").replace(/\D/g, "");
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
}

function AgendaClusterPopoverBody({
  ev,
  clusterEvents,
  onStartConsultation,
  onEditAppointment,
}: {
  ev: any;
  clusterEvents: any[];
  onStartConsultation: (app: AppointmentWithPatient) => void;
  onEditAppointment: (app: AppointmentWithPatient) => void;
}) {
  return (
    <div className="flex flex-col max-h-[380px]">
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
        <div>
          <p className="text-xs font-extrabold text-foreground">
            {clusterEvents.length} citas en este horario
          </p>
          <p className="text-[10px] text-muted-foreground font-medium">
            Selecciona una cita para atender o editar
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary">
          {timeOnly(ev.scheduled_at.replace(" ", "T"))}
        </span>
      </div>
      <div className="overflow-y-auto divide-y divide-border/40">
        {clusterEvents.map((item) => {
          const isDone = item.status?.toLowerCase() === "completada";
          return (
            <div key={item.id} className="p-3 space-y-2 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-foreground truncate">
                    {item.patient_name || "Paciente"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {timeOnly(item.scheduled_at.replace(" ", "T"))} · {item.reason || "Consulta Médica"}
                  </p>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0",
                    isDone
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-primary/15 text-primary",
                  )}
                >
                  {item.status || "programada"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onStartConsultation(item)}
                  className={cn(
                    "flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1 cursor-pointer transition",
                    isDone ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary hover:opacity-90",
                  )}
                >
                  <Stethoscope className="h-3 w-3" />
                  {isDone ? "Ver Consulta" : "Iniciar"}
                </button>
                <button
                  type="button"
                  onClick={() => onEditAppointment(item)}
                  className="py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-muted hover:bg-muted/80 text-foreground cursor-pointer transition"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => sendAppointmentReminder(item)}
                  title="Recordatorio WhatsApp"
                  className="p-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 cursor-pointer transition"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaSingleEventPopoverBody({
  ev,
  onEditAppointment,
  onDeleteAppointment,
  onStartConsultation,
}: {
  ev: any;
  onEditAppointment: (app: AppointmentWithPatient) => void;
  onDeleteAppointment: (id: string) => void;
  onStartConsultation: (app: AppointmentWithPatient) => void;
}) {
  const isCompleted = ev.status?.toLowerCase() === "completada";
  const endTimeIso = new Date(
    new Date(ev.scheduled_at.replace(" ", "T")).getTime() + ev.durationHours * 3600000,
  ).toISOString();

  return (
    <>
      <div className="px-4 py-3 flex justify-between items-center border-b border-border/40">
        <span className="text-xs font-bold text-foreground tracking-wide">Editar Horario</span>
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
            <p className="text-[10px] text-primary font-medium mt-0.5">Cita médica registrada</p>
          </div>
        </div>
        <div className="flex gap-3 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-foreground text-xs">Horario</p>
            <p className="text-[10px] text-primary font-medium mt-0.5">
              {timeOnly(ev.scheduled_at.replace(" ", "T"))} → {timeOnly(endTimeIso)}
            </p>
          </div>
          <button type="button" aria-label="Conexión de red de cita" className="text-muted-foreground">
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
                  ${Number(ev.price).toFixed(2)} ({formatBs(Number(ev.price), getStoredExchangeRate())})
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => sendAppointmentReminder(ev)}
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
          className="text-xs font-bold text-foreground hover:bg-gray-200 dark:hover:bg-muted px-4 py-2 rounded-xl transition cursor-pointer"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onStartConsultation(ev)}
          className={`text-xs font-bold text-primary-foreground px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer ${
            isCompleted ? "bg-[#05c46b] hover:bg-[#04b060]" : "bg-primary hover:bg-[#3f37c9]"
          }`}
        >
          <Stethoscope className="h-3.5 w-3.5" />
          {isCompleted ? "Ver / Editar Consulta" : "Iniciar Consulta"}
        </button>
      </div>
    </>
  );
}

function computeEventCardLayout(ev: any, calendarView: string, compactMode: boolean) {
  const pxPerHour = compactMode ? 48 : 96;
  const topPx = ev.topHours * pxPerHour;
  const heightPx = Math.max(compactMode ? 40 : 54, ev.durationHours * pxPerHour);
  const overlapCount = Math.max(1, ev.overlapCount || 1);
  const overlapIndex = ev.overlapIndex || 0;
  const isWeeklyCluster = calendarView !== "Diaria" && overlapCount >= 3;
  const clusterEvents: any[] =
    isWeeklyCluster && Array.isArray(ev.clusterEvents) && ev.clusterEvents.length > 1
      ? ev.clusterEvents
      : [ev];
  const extraCount = clusterEvents.length - 1;
  const widthPercent = isWeeklyCluster ? 100 : 100 / overlapCount;
  const leftPercent = isWeeklyCluster ? 0 : overlapIndex * widthPercent;
  const startLabel = timeOnly(ev.scheduled_at.replace(" ", "T"));
  const endLabel = timeOnly(
    new Date(new Date(ev.scheduled_at.replace(" ", "T")).getTime() + ev.durationHours * 3600000).toISOString(),
  );
  return {
    topPx,
    heightPx,
    overlapCount,
    overlapIndex,
    isWeeklyCluster,
    clusterEvents,
    extraCount,
    widthPercent,
    leftPercent,
    subtitle: extraCount > 0 ? `${clusterEvents.length} citas · ${startLabel}` : `${startLabel} - ${endLabel}`,
  };
}

function AgendaGridEventCard({
  ev,
  calendarView,
  compactMode,
  onEditAppointment,
  onDeleteAppointment,
  onStartConsultation,
}: {
  ev: any;
  calendarView: string;
  compactMode: boolean;
  onEditAppointment: (app: AppointmentWithPatient) => void;
  onDeleteAppointment: (id: string) => void;
  onStartConsultation: (app: AppointmentWithPatient) => void;
}) {
  const layout = computeEventCardLayout(ev, calendarView, compactMode);
  if (layout.isWeeklyCluster && !ev.isClusterPrimary) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute rounded-2xl text-xs font-bold cursor-pointer transition-[filter,transform] hover:brightness-95 dark:hover:brightness-110 hover:!z-50 overflow-hidden shadow-xs border border-l-4 flex flex-col justify-center",
            layout.overlapCount > 1 && !layout.isWeeklyCluster ? "px-1.5 py-1.5" : "px-2.5 py-2",
            ev.theme.bg,
            ev.theme.border,
            ev.theme.text,
          )}
          style={{
            top: `${layout.topPx + 2}px`,
            height: `${Math.max(36, layout.heightPx - 4)}px`,
            left: `calc(${layout.leftPercent}% + 3px)`,
            width: `calc(${layout.widthPercent}% - 6px)`,
            zIndex: 10 + layout.overlapIndex,
          }}
        >
          <div className="flex items-center justify-between gap-1 min-w-0">
            <p className="truncate font-extrabold leading-tight text-[11px] sm:text-xs">{ev.patient_name}</p>
            {layout.extraCount > 0 && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950 shadow-2xs">
                +{layout.extraCount}
              </span>
            )}
          </div>
          <p className="text-[10px] opacity-80 font-semibold tracking-tight mt-0.5 truncate">
            {layout.subtitle}
          </p>
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="right"
        className={cn("p-0 rounded-2xl shadow-xl border-border/50 z-50", layout.extraCount > 0 ? "w-80" : "w-64")}
      >
        {layout.extraCount > 0 ? (
          <AgendaClusterPopoverBody
            ev={ev}
            clusterEvents={layout.clusterEvents}
            onStartConsultation={onStartConsultation}
            onEditAppointment={onEditAppointment}
          />
        ) : (
          <AgendaSingleEventPopoverBody
            ev={ev}
            onEditAppointment={onEditAppointment}
            onDeleteAppointment={onDeleteAppointment}
            onStartConsultation={onStartConsultation}
          />
        )}
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
        {/* Y-Axis Hours (24h: 12 AM - 11 PM) */}
        <div className="w-16 shrink-0 border-r border-border bg-card relative z-10">
          {HOURS.map((h, i) => {
            const label =
              h === 0
                ? "12 AM"
                : h < 12
                  ? `${h} AM`
                  : h === 12
                    ? "12 PM"
                    : `${h - 12} PM`;
            return (
              <div
                key={h}
                className={cn(
                  "border-b border-transparent relative flex items-start justify-center pt-2",
                  compactMode ? "h-12" : "h-24",
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-bold text-muted-foreground bg-card px-1",
                    i === 0 ? "mt-0" : compactMode ? "-mt-3" : "-mt-4",
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
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
                    calendarView={calendarView}
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
