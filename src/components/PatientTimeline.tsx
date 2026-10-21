import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  FileText,
  Paperclip,
  Loader2,
  Stethoscope,
  Calendar,
  Pill,
  HeartPulse,
} from "lucide-react";
import { useClinicalNotes } from "@/lib/api/clinical-notes";
import { usePatientConsultations } from "@/lib/api/consultations";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  type: "consultation" | "appointment" | "note";
  date: string;
  badge: string;
  title: string;
  subtitle?: string;
  vitals?: string;
  prescription?: string;
  attachmentsCount?: number;
}

export function PatientTimeline({ patientId }: { patientId: string }) {
  const { data: notes = [], isLoading: loadingNotes } = useClinicalNotes(patientId);
  const { data: consultations = [], isLoading: loadingConsults } =
    usePatientConsultations(patientId);

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ["patient_timeline_appointments", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const pid = parseInt(patientId, 10);
      if (isNaN(pid)) return [];
      const { data } = await supabase
        .from("citas")
        .select("id_cita, fecha_hora, estado, motivo, medicos(nombre, apellido)")
        .eq("id_paciente", pid)
        .order("fecha_hora", { ascending: false });
      return data ?? [];
    },
  });

  const isLoading = loadingNotes || loadingConsults || loadingAppts;

  const events = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = [];

    for (const c of consultations) {
      const vitalsParts = [
        c.blood_pressure ? `TA: ${c.blood_pressure}` : null,
        c.weight_kg ? `Peso: ${c.weight_kg} kg` : null,
        c.temperature ? `Temp: ${c.temperature} °C` : null,
        c.heart_rate ? `FC: ${c.heart_rate} lpm` : null,
      ].filter(Boolean);

      list.push({
        id: `consult-${c.id}`,
        type: "consultation",
        date: c.created_at,
        badge: `Consulta · ${(c.visit_type || "CONTROL").replace("_", " ")}`,
        title: c.diagnosis
          ? `Diagnóstico: ${c.diagnosis}`
          : c.subjective_exam || "Consulta médica registrada",
        subtitle: c.plan || c.subjective_exam || undefined,
        vitals: vitalsParts.length > 0 ? vitalsParts.join(" · ") : undefined,
        prescription: c.indications || undefined,
      });
    }

    for (const a of appointments as any[]) {
      const docName = a.medicos
        ? `Dr(a). ${a.medicos.nombre || ""} ${a.medicos.apellido || ""}`.trim()
        : "";
      list.push({
        id: `appt-${a.id_cita}`,
        type: "appointment",
        date: a.fecha_hora,
        badge: `Cita · ${(a.estado || "Programada").toUpperCase()}`,
        title: a.motivo || "Cita de control médico",
        subtitle: docName || undefined,
      });
    }

    for (const n of notes) {
      list.push({
        id: `note-${n.id}`,
        type: "note",
        date: n.note_date,
        badge: "Nota / Estudio Clínico",
        title: n.title,
        subtitle: n.content || undefined,
        attachmentsCount: n.attachments?.length || 0,
      });
    }

    return list.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [consultations, appointments, notes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
          <Activity className="h-4 w-4 text-primary" /> Línea de Tiempo Clínica Evolutiva
          <span className="text-xs font-semibold text-muted-foreground">({events.length} eventos)</span>
        </h4>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <div className="py-10 text-center rounded-3xl border border-dashed border-border/60 bg-muted/10">
          <p className="text-xs font-medium text-muted-foreground">
            Sin eventos clínicos registrados aún para este paciente.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-4 border-l-2 border-border/60 pl-5 ml-2">
          {events.map((ev) => {
            const Icon =
              ev.type === "consultation"
                ? Stethoscope
                : ev.type === "appointment"
                  ? Calendar
                  : FileText;

            const dotClass =
              ev.type === "consultation"
                ? "bg-primary text-primary-foreground"
                : ev.type === "appointment"
                  ? "bg-emerald-500 text-white"
                  : "bg-amber-500 text-white";

            return (
              <li key={ev.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[29px] top-2 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background",
                    dotClass
                  )}
                />
                <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-xs hover:border-primary/30 transition-all space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" /> {ev.badge}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {new Date(ev.date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-foreground leading-snug">{ev.title}</p>

                  {ev.subtitle && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-3">
                      {ev.subtitle}
                    </p>
                  )}

                  {ev.vitals && (
                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-muted/60 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                      <HeartPulse className="h-3 w-3 text-rose-500" />
                      {ev.vitals}
                    </div>
                  )}

                  {ev.prescription && (
                    <div className="rounded-xl bg-primary/5 border border-primary/15 p-2.5 text-xs text-foreground flex items-start gap-2">
                      <Pill className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{ev.prescription}</span>
                    </div>
                  )}

                  {ev.attachmentsCount && ev.attachmentsCount > 0 ? (
                    <p className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Paperclip className="h-3 w-3" /> {ev.attachmentsCount} archivo
                      {ev.attachmentsCount > 1 ? "s adjuntos" : " adjunto"}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
