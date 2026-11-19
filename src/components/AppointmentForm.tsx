import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Appointment } from "@/lib/api/appointments";
import { useDoctors } from "@/lib/api/profiles";
import { useServices } from "@/lib/api/services";
import { useClinicInfo } from "@/lib/api/clinic";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  DollarSign,
  Loader2,
  MessageCircle,
  Plus,
  Stethoscope,
  X,
  FileText,
} from "lucide-react";
import { AppointmentPatientSelect } from "./appointment/AppointmentPatientSelect";
import { AppointmentServiceSelect } from "./appointment/AppointmentServiceSelect";
import { useAppointmentFormState } from "./appointment/useAppointmentFormState";

const STATUSES = ["programada", "completada", "cancelada"] as const;

const QUICK_TIME_SLOTS = [
  { value: "08:00", label: "8:00 AM" },
  { value: "08:30", label: "8:30 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "09:30", label: "9:30 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
];

const QUICK_DURATIONS = ["15", "30", "45", "60"];

function formatYmdOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateSpanish(ymd: string): string {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime12h(hhmm: string): string {
  if (!hhmm) return "—";
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function normalizeWhatsAppPhone(raw?: string | null): string {
  if (!raw) return "";
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // Venezuelan local mobile numbers (e.g. 04141234567 -> 584141234567)
  if (digits.startsWith("0") && digits.length === 11) {
    digits = `58${digits.slice(1)}`;
  } else if (digits.length === 10 && digits.startsWith("4")) {
    digits = `58${digits}`;
  }
  return digits;
}

export function AppointmentForm({
  open,
  onOpenChange,
  appointment,
  defaultPatientId,
  defaultDate,
  initialDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment?: Appointment | null;
  defaultPatientId?: string;
  defaultDate?: string;
  initialDate?: string;
}) {
  const { data: doctors = [] } = useDoctors();
  const { data: services = [] } = useServices();
  const { data: clinicInfo } = useClinicInfo({ includeLogo: false });

  const effectiveDefaultDate = defaultDate || initialDate;

  const {
    isEdit,
    patient_id,
    setPatient,
    setResolvedPatient,
    doctor_id,
    setDoctorId,
    selectedDoctor,
    isDoctorOnly,
    doctorName,
    date,
    setDate,
    time,
    setTime,
    reason,
    setReason,
    status,
    setStatus,
    duration,
    setDuration,
    price,
    setPrice,
    selectedServiceId,
    setSelectedServiceId,
    savedSummary,
    resetForAnother,
    busy,
    handleSubmit,
  } = useAppointmentFormState({
    open,
    appointment,
    defaultPatientId,
    defaultDate: effectiveDefaultDate,
    doctors,
    onOpenChange,
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onOpenChange]);

  if (!open) return null;

  const todayYmd = formatYmdOffset(0);
  const tomorrowYmd = formatYmdOffset(1);
  const nextWeekYmd = formatYmdOffset(7);

  const handleSendWhatsApp = () => {
    if (!savedSummary) return;
    const clinicName = clinicInfo?.name || "nuestra clínica";
    const formattedDate = formatDateSpanish(savedSummary.date);
    const formattedTime = formatTime12h(savedSummary.time);
    const lines = [
      `Hola *${savedSummary.patientName}*, te confirmamos tu cita médica en *${clinicName}* ✅`,
      ``,
      `📅 *Fecha:* ${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}`,
      `🕒 *Hora:* ${formattedTime} (${savedSummary.duration} min)`,
      `🩺 *Especialista:* Dr(a). ${savedSummary.doctorName}`,
      `📋 *Motivo / Servicio:* ${savedSummary.reason}`,
      savedSummary.price > 0 ? `💳 *Tarifa estimada:* $${savedSummary.price.toFixed(2)}` : null,
      ``,
      `Por favor avísanos si necesitas reprogramar. ¡Te esperamos!`,
    ].filter((l) => l !== null);

    const text = encodeURIComponent(lines.join("\n"));
    const cleanPhone = normalizeWhatsAppPhone(savedSummary.patientPhone);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-[2px] animate-fade-in"
        onClick={() => {
          if (!busy) onOpenChange(false);
        }}
      />

      {/* Responsive Panel: Full-screen native on Mobile (<md), Slide-over Right Drawer on Desktop (md+) */}
      <div className="relative z-10 w-full md:w-[540px] lg:w-[580px] h-full md:h-[calc(100vh-1.5rem)] md:my-3 md:mr-3 bg-card text-foreground md:rounded-[28px] md:border md:border-border/70 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {savedSummary ? (
          /* ================= SUCCESS ANIMATION VIEW ================= */
          <div className="flex-1 flex flex-col overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
            <style>{`
              @keyframes appt-circle-draw {
                0% { stroke-dashoffset: 251; }
                100% { stroke-dashoffset: 0; }
              }
              @keyframes appt-check-draw {
                0% { stroke-dashoffset: 60; }
                100% { stroke-dashoffset: 0; }
              }
              @keyframes appt-ring-pop {
                0% { transform: scale(0.8); opacity: 0; }
                60% { transform: scale(1.06); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes appt-pulse-glow {
                0%, 100% { transform: scale(1); opacity: 0.35; }
                50% { transform: scale(1.16); opacity: 0.08; }
              }
              .appt-circle-anim {
                stroke-dasharray: 251;
                stroke-dashoffset: 251;
                animation: appt-circle-draw 0.6s cubic-bezier(0.65, 0, 0.35, 1) forwards;
              }
              .appt-check-anim {
                stroke-dasharray: 60;
                stroke-dashoffset: 60;
                animation: appt-check-draw 0.4s cubic-bezier(0.65, 0, 0.35, 1) 0.45s forwards;
              }
              .appt-pop-anim {
                animation: appt-ring-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
              }
              .appt-glow-anim {
                animation: appt-pulse-glow 2.4s ease-in-out infinite;
              }
            `}</style>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-9 w-9 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full py-4 space-y-5">
              {/* SVG Calendario Clínico + Sello Checkmark Esmeralda */}
              <div className="relative flex items-center justify-center w-28 h-28">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 appt-glow-anim" />
                <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center appt-pop-anim">
                  <svg className="w-24 h-24" viewBox="0 0 96 96" fill="none">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#10b981"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      className="appt-circle-anim"
                      transform="rotate(-90 48 48)"
                    />
                    <path
                      d="M32 49.5L43 60.5L65 37.5"
                      stroke="#10b981"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="appt-check-anim"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {savedSummary.isEdit ? "Cita Actualizada" : "Cita Médica Agendada"}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  {savedSummary.patientName}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  La reserva quedó registrada en la agenda clínica y lista para su atención.
                </p>
              </div>

              {/* Ticket Resumen de la Cita */}
              <div className="w-full rounded-2xl border border-border/70 bg-muted/25 p-4 text-left space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Fecha y Horario
                      </p>
                      <p className="text-xs sm:text-sm font-extrabold text-foreground capitalize truncate">
                        {formatDateSpanish(savedSummary.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-extrabold">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime12h(savedSummary.time)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Especialista
                    </span>
                    <p className="font-bold text-foreground truncate">
                      Dr(a). {savedSummary.doctorName}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Duración / Tarifa
                    </span>
                    <p className="font-bold text-foreground">
                      {savedSummary.duration} min
                      {savedSummary.price > 0 ? ` · $${savedSummary.price.toFixed(2)}` : ""}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground font-medium truncate">
                    {savedSummary.reason}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shrink-0">
                    {savedSummary.status}
                  </span>
                </div>
              </div>

              {/* Acciones directas */}
              <div className="w-full space-y-2.5 pt-2">
                <Button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full h-11 rounded-2xl font-bold text-xs sm:text-sm gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar Confirmación por WhatsApp
                </Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {!savedSummary.isEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForAnother}
                      className="h-10 rounded-2xl font-bold text-xs gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      Agendar Otra Cita
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant={savedSummary.isEdit ? "default" : "secondary"}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "h-10 rounded-2xl font-bold text-xs gap-1.5",
                      savedSummary.isEdit && "sm:col-span-2"
                    )}
                  >
                    <Check className="h-4 w-4" />
                    Listo, Volver a la Agenda
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= FORM VIEW ================= */
          <>
            {/* Sticky Header */}
            <div className="px-5 py-4 sm:px-6 border-b border-border/60 bg-card/95 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => !busy && onOpenChange(false)}
                  className="md:hidden h-9 w-9 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-foreground shrink-0"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-foreground truncate">
                    {isEdit ? "Editar Cita Médica" : "Nueva Cita Médica"}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {isEdit
                      ? "Actualiza el horario, servicio o estado de la reserva."
                      : "Agenda rápido eligiendo paciente, servicio y bloque horario."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !busy && onOpenChange(false)}
                className="hidden md:flex h-9 w-9 rounded-full bg-muted/60 hover:bg-muted items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                aria-label="Cerrar panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form
              id="appointment-drawer-form"
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-6"
            >
              {/* BLOQUE 1: PACIENTE, ESPECIALISTA Y SERVICIO */}
              <div className="rounded-2xl border border-border/60 bg-muted/15 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-extrabold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                    Paciente, Especialista y Servicio
                  </h3>
                </div>

                <AppointmentPatientSelect
                  value={patient_id}
                  doctorId={doctor_id}
                  onChange={setPatient}
                  onPatientResolved={setResolvedPatient}
                />

                <div className="grid gap-2">
                  <Label className="text-xs font-bold text-foreground">Médico / Especialista *</Label>
                  {isDoctorOnly ? (
                    <div className="flex items-center gap-2.5 h-11 px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/[0.07] text-xs sm:text-sm font-bold text-foreground">
                      <Stethoscope className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">
                        Dr(a). {selectedDoctor?.full_name || doctorName || "Especialista asignado"}
                      </span>
                      <span className="ml-auto text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                        Tú
                      </span>
                    </div>
                  ) : (
                    <Select value={doctor_id || undefined} onValueChange={setDoctorId}>
                      <SelectTrigger className="h-11 rounded-xl bg-background border-border/50 text-xs font-medium">
                        <SelectValue placeholder="Selecciona doctor" />
                      </SelectTrigger>
                      <SelectContent className="z-[70]">
                        {doctors.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No hay doctores registrados
                          </SelectItem>
                        ) : (
                          doctors.map((d) => (
                            <SelectItem key={d.id} value={d.id} className="text-xs font-medium">
                              {d.full_name || d.email}
                              {d.specialty ? ` · ${d.specialty}` : ""}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <AppointmentServiceSelect
                  value={selectedServiceId}
                  services={services}
                  doctors={doctors}
                  selectedDoctor={selectedDoctor}
                  doctor_id={doctor_id}
                  onSelectService={(s) => {
                    setSelectedServiceId(String(s.id_servicio));
                    setPrice(String(s.costo_base || 0));
                    setReason(s.nombre_servicio);
                  }}
                  onResetService={() => setSelectedServiceId("none")}
                  onAutoSelectDoctor={(matchId) => setDoctorId(matchId)}
                />
              </div>

              {/* BLOQUE 2: FECHA, HORARIO RÁPIDO, DURACIÓN Y TARIFA */}
              <div className="rounded-2xl border border-border/60 bg-muted/15 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-extrabold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                    Fecha, Horario y Detalles
                  </h3>
                </div>

                {/* Fecha con accesos rápidos */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="appt-date" className="text-xs font-bold text-foreground">
                      Fecha de la Cita *
                    </Label>
                    <div className="flex items-center gap-1">
                      {[
                        { label: "Hoy", val: todayYmd },
                        { label: "Mañana", val: tomorrowYmd },
                        { label: "+1 Sem", val: nextWeekYmd },
                      ].map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => setDate(chip.val)}
                          className={cn(
                            "px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border",
                            date === chip.val
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    id="appt-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="h-11 rounded-xl bg-background border-border/50 text-xs font-semibold"
                  />
                </div>

                {/* Bloques de Horario Rápidos + Input Manual */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="appt-time" className="text-xs font-bold text-foreground">
                      Horario *
                    </Label>
                    <span className="text-[11px] font-bold text-primary">
                      {formatTime12h(time)}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {QUICK_TIME_SLOTS.map((slot) => {
                      const active = time === slot.value;
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => setTime(slot.value)}
                          className={cn(
                            "py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center",
                            active
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "bg-background text-foreground/80 border-border/50 hover:border-primary/40 hover:bg-primary/5"
                          )}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                      Otra hora:
                    </span>
                    <Input
                      id="appt-time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="h-9 rounded-xl bg-background border-border/50 text-xs font-semibold max-w-[150px]"
                    />
                  </div>
                </div>

                {/* Duración rápida + Precio + Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Duración (min)
                    </Label>
                    <div className="flex items-center gap-1.5">
                      {QUICK_DURATIONS.map((dVal) => (
                        <button
                          key={dVal}
                          type="button"
                          onClick={() => setDuration(dVal)}
                          className={cn(
                            "flex-1 h-9 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                            duration === dVal
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-foreground/80 border-border/50 hover:bg-muted/40"
                          )}
                        >
                          {dVal}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="appt-price" className="text-xs font-bold text-foreground flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> Tarifa Estimada ($)
                    </Label>
                    <Input
                      id="appt-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="h-9 rounded-xl bg-background border-border/50 text-xs font-bold"
                    />
                  </div>
                </div>

                {isEdit && (
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold text-foreground">Estado de la Cita</Label>
                    <Select value={status || undefined} onValueChange={setStatus}>
                      <SelectTrigger className="h-10 rounded-xl bg-background border-border/50 capitalize text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[70]">
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize text-xs font-medium">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="appt-reason" className="text-xs font-bold text-foreground flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Motivo o Notas de la Cita
                  </Label>
                  <Input
                    id="appt-reason"
                    value={reason ?? ""}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej. Control ginecológico, ecografía obstétrica…"
                    className="h-10 rounded-xl bg-background border-border/50 text-xs"
                  />
                </div>
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="px-5 py-4 sm:px-6 border-t border-border/60 bg-card/95 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => onOpenChange(false)}
                className="rounded-2xl h-11 px-4 text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="appointment-drawer-form"
                disabled={busy}
                className="rounded-2xl h-11 px-6 text-xs sm:text-sm font-extrabold gap-2 bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground hover:opacity-95 shadow-sm"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarDays className="h-4 w-4" />
                )}
                {isEdit ? "Guardar Cambios" : "Agendar Cita"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
