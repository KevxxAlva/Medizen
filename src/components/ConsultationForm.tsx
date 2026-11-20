import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useConsultationByAppointment,
  type Consultation,
} from "@/lib/api/consultations";
import {
  Loader2,
  ShieldAlert,
  Printer,
  Wand2,
  MessageSquare,
  Sparkles,
  Stethoscope,
  UserRound,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FolderOpen,
  Calendar,
} from "lucide-react";
import {
  WorkspaceHeaderTitle,
  WorkspaceStepHeader,
  WorkspaceStepper,
} from "@/components/ui/workspace-stepper";
import { useUserRoleScope } from "@/hooks/useUserRoleScope";
import {
  getSpecialtyBadgeStyle,
} from "@/lib/constants/specialtyForms";
import { DynamicSpecialtyFields } from "@/components/consultation/DynamicSpecialtyFields";
import { cn } from "@/lib/utils";
import { useConsultationFormState } from "@/components/consultation/useConsultationFormState";
import { ConsultationAnamnesisTab } from "@/components/consultation/ConsultationAnamnesisTab";
import { ConsultationVitalsTab } from "@/components/consultation/ConsultationVitalsTab";
import { ConsultationPlanTab } from "@/components/consultation/ConsultationPlanTab";
import { ConsultationConsumablesTab } from "@/components/consultation/ConsultationConsumablesTab";

const CONTACT_CHANNELS = [
  "WhatsApp",
  "Instagram",
  "Facebook",
  "Radio",
  "Recomendado",
  "Prensa",
  "Volante",
  "Otro",
];

export function ConsultationForm({
  open,
  onOpenChange,
  appointment,
  backLabel = "Volver",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment?: {
    id: string;
    patient_id: string;
    doctor_id?: string;
    patient_name?: string;
    price?: number | null;
    reason?: string | null;
  } | null;
  backLabel?: string;
}) {
  const { data: existingConsultation, isLoading: loadingExisting } = useConsultationByAppointment(
    appointment?.id,
  );

  if (!open) return null;

  return (
    <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] flex flex-col text-foreground w-full min-w-0 animate-in fade-in duration-200">
      {loadingExisting ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ConsultationFormContent
          key={appointment?.id ?? existingConsultation?.id ?? "new"}
          appointment={appointment}
          existingConsultation={existingConsultation}
          onOpenChange={onOpenChange}
          backLabel={backLabel}
        />
      )}
    </div>
  );
}

function formatDoctorDisplayName(name?: string | null): string {
  if (!name) return "Médico Tratante";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function ConsultationTopHeader({
  isEdit,
  backLabel,
  onBack,
  patientName,
  selectedDoctorId,
  currentDoctor,
  doctors,
  handleDoctorChange,
  selectedSpecialty,
  isDoctorOnly,
  templates,
  onApplyTemplate,
}: {
  isEdit: boolean;
  backLabel: string;
  onBack: () => void;
  patientName?: string | null;
  selectedDoctorId: string;
  currentDoctor: any;
  doctors: any[];
  handleDoctorChange: (id: string) => void;
  selectedSpecialty: string;
  isDoctorOnly?: boolean;
  templates: { id: string; name: string }[];
  onApplyTemplate: (id: string) => void;
}) {
  const rawSpecialty = currentDoctor?.specialty || selectedSpecialty || "Medicina General";
  const specialtyList = rawSpecialty
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
  const badge = getSpecialtyBadgeStyle(specialtyList[0] || rawSpecialty);

  return (
    <header className="mb-6 space-y-3.5 pb-5 border-b border-border/60">
      {/* Nivel 1: Navegación superior, Título y Plantillas Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <WorkspaceHeaderTitle
          backLabel={backLabel}
          title={isEdit ? "Editar Consulta Clínica" : "Registrar Nueva Consulta Clínica"}
          badge="Modo Consultorio"
          onBack={onBack}
        />

        {/* Selector de Plantillas Rápidas alineado arriba a la derecha */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="relative flex items-center w-full sm:w-[230px]">
            <Wand2 className="h-3.5 w-3.5 text-primary absolute left-3 z-10 pointer-events-none" />
            <Select onValueChange={onApplyTemplate}>
              <SelectTrigger className="w-full h-9 pl-8 text-xs rounded-xl bg-muted/40 hover:bg-muted/70 border-border/60 font-semibold shadow-none transition-colors">
                <SelectValue placeholder="Plantillas rápidas…" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-[300px]">
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs font-medium">
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Nivel 2: Barra de Contexto Clínico unificada (Paciente · Médico · Especialidades) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-muted/35 border border-border/60 items-center">
        {/* Paciente */}
        <div className="md:col-span-3 flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <UserRound className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
              Paciente en Atención
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-foreground truncate mt-1">
              {patientName || "Paciente"}
            </p>
          </div>
        </div>

        {/* Médico Tratante */}
        <div className="md:col-span-4 flex items-center gap-2.5 min-w-0 md:border-l md:border-border/60 md:pl-3.5">
          <div className="h-9 w-9 rounded-xl bg-background border border-border/70 text-primary flex items-center justify-center shrink-0">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none mb-1">
              Especialista Tratante
            </span>
            {isDoctorOnly ? (
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-foreground truncate">
                <span className="truncate">
                  Dr(a). {formatDoctorDisplayName(currentDoctor?.full_name)}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary shrink-0">
                  Tú
                </span>
              </div>
            ) : (
              <Select
                value={selectedDoctorId || currentDoctor?.id || ""}
                onValueChange={handleDoctorChange}
              >
                <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-border/60 font-bold w-full shadow-2xs">
                  <span className="truncate">
                    Dr(a). {formatDoctorDisplayName(currentDoctor?.full_name)}
                  </span>
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-[300px]">
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs font-semibold">
                      Dr(a). {formatDoctorDisplayName(d.full_name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Especialidades en píldoras individuales limpias */}
        <div className="md:col-span-5 flex flex-col justify-center min-w-0 md:border-l md:border-border/60 md:pl-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none mb-1.5">
            {specialtyList.length > 1 ? "Especialidades Habilitadas" : "Especialidad"}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {specialtyList.map((spec: string) => (
              <span
                key={spec}
                className={cn(
                  "text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border inline-flex items-center gap-1 shadow-2xs",
                  badge.className,
                )}
              >
                <Sparkles className="w-2.5 h-2.5 opacity-80 shrink-0" />
                <span>{spec}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function ConsultationAllergyBanner({ patient }: { patient: any }) {
  const allergies = patient?.personal_history?.allergies;
  if (!allergies) return null;
  const upper = allergies.toUpperCase();
  if (upper.includes("NIEGA") || upper.includes("NO REFIERE")) return null;

  return (
    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-rose-700 dark:text-rose-300 text-xs font-bold animate-in fade-in">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
      </span>
      <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
      <span>
        ALERTA CLÍNICA: Paciente con alergias registradas a:{" "}
        <strong className="underline">{allergies}</strong>. Verifique interacciones antes de
        prescribir.
      </span>
    </div>
  );
}

interface ConsultationStepItem {
  id: "anamnesis" | "vitals" | "special" | "plan" | "consumables";
  title: string;
  subtitle: string;
}

function ConsultationSuccessView({
  isEdit,
  patientName,
  patientId,
  doctorFullName,
  diagnosis,
  nextAppointmentDate,
  indications,
  backLabel,
  onExportRecipe,
  onGoToSales,
  onGoToPatient,
  onClose,
}: {
  isEdit: boolean;
  patientName?: string;
  patientId?: string;
  doctorFullName?: string | null;
  diagnosis?: string;
  nextAppointmentDate?: string;
  indications?: string;
  backLabel: string;
  onExportRecipe: (mode: "print" | "whatsapp") => void;
  onGoToSales: () => void;
  onGoToPatient: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
      <style>{`
        @keyframes medizen-ecg-draw { 0% { stroke-dashoffset: 240; opacity: 0.2; } 100% { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes medizen-ring-draw { 0% { stroke-dashoffset: 264; transform: scale(0.9); opacity: 0; } 50% { opacity: 1; transform: scale(1.03); } 100% { stroke-dashoffset: 0; transform: scale(1); opacity: 1; } }
        @keyframes medizen-badge-pop { 0% { transform: scale(0.3); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .medizen-consult-ring { stroke-dasharray: 264; stroke-dashoffset: 264; transform-origin: center; animation: medizen-ring-draw 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .medizen-consult-ecg { stroke-dasharray: 240; stroke-dashoffset: 240; animation: medizen-ecg-draw 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards; }
        .medizen-consult-seal { transform-origin: 74px 72px; opacity: 0; animation: medizen-badge-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.48s forwards; }
      `}</style>

      <div className="relative flex items-center justify-center mb-5">
        <div className="absolute h-28 w-28 rounded-full bg-emerald-500/15 animate-ping [animation-duration:1.8s]" />
        <div className="absolute h-24 w-24 rounded-full bg-primary/5" />
        <svg className="h-28 w-28 relative z-10" viewBox="0 0 100 100" fill="none">
          <circle cx="48" cy="48" r="38" className="stroke-primary/85 fill-primary/5 medizen-consult-ring" strokeWidth="3.5" />
          <path d="M20 48H33L38 35L45 63L52 29L58 55L62 48H75" className="stroke-primary medizen-consult-ecg" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
          <g className="medizen-consult-seal">
            <circle cx="74" cy="72" r="18" className="fill-emerald-500 stroke-card" strokeWidth="4" />
            <path d="M66 72.5L71.5 78L82.5 66.5" stroke="white" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </div>

      <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 rounded-full">
        {isEdit ? "Evolución Clínica Actualizada" : "Atención Médica Completada · Facturada"}
      </span>
      <h3 className="text-xl sm:text-2xl font-black text-foreground mt-3">
        {isEdit ? "¡Consulta Actualizada!" : "¡Consulta Médica Finalizada!"}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md">
        La evolución clínica de <strong className="text-foreground">{patientName || "la paciente"}</strong> quedó guardada y su orden de cobro ya está disponible en <strong>Ventas y Facturación</strong>.
      </p>

      <div className="mt-6 w-full max-w-md rounded-2xl border border-border/80 bg-muted/30 p-4 text-left shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary font-black text-sm flex items-center justify-center shrink-0">
              {(patientName || "P").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-foreground truncate">{patientName || "Paciente"}</p>
              <p className="text-[11px] text-muted-foreground truncate">Dr(a). {formatDoctorDisplayName(doctorFullName)}</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg shrink-0">
            Cita Completada
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Diagnóstico Registrado</span>
            <p className="font-bold text-foreground mt-0.5">{diagnosis?.trim() || "Evaluación clínica general completada"}</p>
          </div>
          {nextAppointmentDate && (
            <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Próximo Control:
              </span>
              <span className="font-bold text-foreground font-mono">{nextAppointmentDate}</span>
            </div>
          )}
        </div>
      </div>

      {indications?.trim() && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 w-full max-w-md">
          <Button type="button" variant="outline" onClick={() => onExportRecipe("print")} className="flex-1 h-10 rounded-2xl border-mauve text-primary hover:bg-primary/10 font-bold text-xs gap-1.5 cursor-pointer">
            <Printer className="h-4 w-4" /> Imprimir Récipe PDF
          </Button>
          <Button type="button" variant="outline" onClick={() => onExportRecipe("whatsapp")} className="flex-1 h-10 rounded-2xl border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs gap-1.5 cursor-pointer">
            <MessageSquare className="h-4 w-4 text-emerald-500" /> Enviar Récipe por WhatsApp
          </Button>
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
        <Button type="button" onClick={onGoToSales} className="w-full sm:w-auto flex-1 h-10 rounded-2xl bg-primary text-primary-foreground hover:bg-[#3451d6] font-bold text-xs gap-1.5 shadow-sm shadow-primary/20 cursor-pointer">
          <CreditCard className="h-4 w-4" /> Ir a Cobrar en Ventas
        </Button>
        {patientId && (
          <Button type="button" variant="outline" onClick={onGoToPatient} className="w-full sm:w-auto h-10 rounded-2xl font-bold text-xs gap-1.5 cursor-pointer">
            <FolderOpen className="h-4 w-4 text-primary" /> Ver Expediente
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto h-10 rounded-2xl font-semibold text-xs text-muted-foreground hover:text-foreground cursor-pointer">
          {backLabel}
        </Button>
      </div>
    </div>
  );
}

function ConsultationFormActionFooter({
  busy,
  isEdit,
  indications,
  activeIndex,
  totalSteps,
  onPrev,
  onNext,
  onCancel,
  onSaveAction,
}: {
  busy: boolean;
  isEdit: boolean;
  indications: string;
  activeIndex: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onCancel: () => void;
  onSaveAction: (action: "save" | "print" | "whatsapp") => void;
}) {
  const isFirstStep = activeIndex === 0;
  const isLastStep = activeIndex === totalSteps - 1;

  return (
    <div className="mt-6 border-t border-border/60 pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={busy}
          className="rounded-2xl w-full sm:w-auto h-10 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
        >
          Cancelar
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-end gap-2 w-full sm:w-auto">
        {indications.trim() && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSaveAction("print")}
              disabled={busy}
              className="rounded-2xl border-mauve text-primary hover:bg-primary/10 flex items-center justify-center gap-1.5 cursor-pointer h-10 text-xs font-semibold"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Printer className="h-3.5 w-3.5" />
              )}
              Imprimir PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSaveAction("whatsapp")}
              disabled={busy}
              className="rounded-2xl border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer h-10 text-xs font-bold"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
              )}
              Enviar por WhatsApp
            </Button>
          </>
        )}

        {/* Controles Prev / Next del Stepper */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            disabled={isFirstStep || busy}
            className="rounded-2xl flex-1 sm:flex-initial h-10 px-4 text-xs font-bold gap-1 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          {!isLastStep ? (
            <Button
              type="button"
              onClick={onNext}
              disabled={busy}
              className="rounded-2xl flex-1 sm:flex-initial bg-primary text-primary-foreground hover:bg-[#3451d6] shadow-sm shadow-primary/20 h-10 px-5 text-xs font-bold gap-1 cursor-pointer"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={busy}
              className="rounded-2xl flex-1 sm:flex-initial bg-primary text-primary-foreground hover:bg-[#3451d6] shadow-sm shadow-primary/20 hover:opacity-95 px-6 h-10 text-xs font-bold cursor-pointer"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…
                </span>
              ) : isEdit ? (
                "Guardar Cambios"
              ) : (
                "Registrar Consulta"
              )}
            </Button>
          )}
        </div>

        {/* Permitir guardar directamente también desde pasos intermedios si es edición o ya llenó datos */}
        {!isLastStep && (isEdit || indications.trim()) && (
          <Button
            type="submit"
            variant="secondary"
            disabled={busy}
            className="rounded-2xl h-10 px-4 text-xs font-bold cursor-pointer"
          >
            {isEdit ? "Guardar Cambios" : "Registrar Consulta"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ConsultationFormContent({
  appointment,
  existingConsultation,
  onOpenChange,
  backLabel = "Volver",
}: {
  appointment?: {
    id: string;
    patient_id: string;
    doctor_id?: string;
    patient_name?: string;
    price?: number | null;
    reason?: string | null;
  } | null;
  existingConsultation?: Consultation | null;
  onOpenChange: (v: boolean) => void;
  backLabel?: string;
}) {
  const { isDoctorOnly } = useUserRoleScope();
  const router = useRouter();
  const state = useConsultationFormState(appointment, existingConsultation, onOpenChange);

  const steps: ConsultationStepItem[] = [
    {
      id: "anamnesis",
      title: "Anamnesis",
      subtitle: "Motivo y antecedentes",
    },
    {
      id: "vitals",
      title: "Físico y Vitales",
      subtitle: "Signos y exploración",
    },
    {
      id: "special",
      title: state.specialtyConfig.tabTitle,
      subtitle: "Evaluación especializada",
    },
    {
      id: "plan",
      title: "Diagnóstico & Plan",
      subtitle: "Récipe e indicaciones",
    },
    {
      id: "consumables",
      title: "Consumibles",
      subtitle: "Insumos utilizados",
    },
  ];

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const currentStep = steps[activeStepIndex] ?? steps[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    state.handleSave("save");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 flex flex-col min-w-0"
    >
      <ConsultationTopHeader
        isEdit={state.isEdit}
        backLabel={backLabel}
        onBack={() => onOpenChange(false)}
        patientName={appointment?.patient_name}
        selectedDoctorId={state.selectedDoctorId}
        currentDoctor={state.currentDoctor}
        doctors={state.doctors}
        handleDoctorChange={state.handleDoctorChange}
        selectedSpecialty={state.selectedSpecialty}
        isDoctorOnly={isDoctorOnly}
        templates={state.currentSpecialtyTemplates}
        onApplyTemplate={state.applyClinicalTemplate}
      />

      <div className="mb-4">
        <ConsultationAllergyBanner patient={state.patient} />
      </div>

      <Tabs
        value={currentStep.id}
        onValueChange={(val) => {
          const idx = steps.findIndex((s) => s.id === val);
          if (idx !== -1) setActiveStepIndex(idx);
        }}
        className="flex-1 flex flex-col min-w-0"
      >
        <div className="flex-1 flex flex-col lg:flex-row min-w-0">
          <WorkspaceStepper
            steps={steps}
            activeIndex={activeStepIndex}
            isAllCompleted={Boolean(state.isCompletedSuccess)}
            sealedBadge="Consulta Finalizada"
            sealedTitle="5 de 5 Módulos Completados"
            onSelectStep={setActiveStepIndex}
          />

          <div className="flex-1 min-w-0 lg:pl-8 flex flex-col justify-between">
            {state.isCompletedSuccess ? (
              <ConsultationSuccessView
                isEdit={state.isEdit}
                patientName={appointment?.patient_name}
                patientId={appointment?.patient_id}
                doctorFullName={state.currentDoctor?.full_name}
                diagnosis={state.diagnosis}
                nextAppointmentDate={state.nextAppointmentDate}
                indications={state.indications}
                backLabel={backLabel}
                onExportRecipe={(mode) => state.exportRecipeOnly(mode)}
                onGoToSales={() => {
                  onOpenChange(false);
                  router.navigate({ to: "/facturacion" });
                }}
                onGoToPatient={() => {
                  onOpenChange(false);
                  if (appointment?.patient_id) {
                    router.navigate({
                      to: "/pacientes/$patientId",
                      params: { patientId: String(appointment.patient_id) },
                    });
                  }
                }}
                onClose={() => onOpenChange(false)}
              />
            ) : (
            <>
            <div className="min-w-0">
              <WorkspaceStepHeader
                stepNumber={activeStepIndex + 1}
                totalSteps={steps.length}
                title={currentStep.title}
                subtitle={currentStep.subtitle}
              />

              <div className="py-1">
                <ConsultationAnamnesisTab
                  visitType={state.visitType}
                  setVisitType={state.setVisitType}
                  contactChannel={state.contactChannel}
                  setContactChannel={state.setContactChannel}
                  isFirstVisit={state.isFirstVisit}
                  setIsFirstVisit={state.setIsFirstVisit}
                  subjectiveExam={state.subjectiveExam}
                  setSubjectiveExam={state.setSubjectiveExam}
                  contactChannels={CONTACT_CHANNELS}
                  patient={state.patient}
                  appointment={appointment}
                  selectedSpecialty={state.selectedSpecialty}
                  vitals={{
                    heightCm: state.heightCm,
                    weightKg: state.weightKg,
                    bmi: state.bmi,
                    bloodPressure: state.bloodPressure,
                    heartRate: state.heartRate,
                    respiratoryRate: state.respiratoryRate,
                    temperature: state.temperature,
                  }}
                  physicalExam={{
                    skin: state.skin,
                    headNeck: state.headNeck,
                    breasts: state.breasts,
                    abdomen: state.abdomen,
                    gynecological: state.gynecological,
                    extremities: state.extremities,
                    neurological: state.neurological,
                  }}
                  diagnosis={state.diagnosis}
                  plan={state.plan}
                  indications={state.indications}
                  setIndications={state.setIndications}
                />

                <ConsultationVitalsTab
                  heightCm={state.heightCm}
                  setHeightCm={state.setHeightCm}
                  weightKg={state.weightKg}
                  setWeightKg={state.setWeightKg}
                  bmiEval={state.bmiEval}
                  bloodPressure={state.bloodPressure}
                  setBloodPressure={state.setBloodPressure}
                  heartRate={state.heartRate}
                  setHeartRate={state.setHeartRate}
                  respiratoryRate={state.respiratoryRate}
                  setRespiratoryRate={state.setRespiratoryRate}
                  temperature={state.temperature}
                  setTemperature={state.setTemperature}
                  specialtyConfig={state.specialtyConfig}
                  selectedSpecialty={state.selectedSpecialty}
                  patient={state.patient}
                  gestationalAgeRef={state.gestationalAgeRef}
                  handleSpecialtyAnswerChange={state.handleSpecialtyAnswerChange}
                  skin={state.skin}
                  setSkin={state.setSkin}
                  headNeck={state.headNeck}
                  setHeadNeck={state.setHeadNeck}
                  breasts={state.breasts}
                  setBreasts={state.setBreasts}
                  abdomen={state.abdomen}
                  setAbdomen={state.setAbdomen}
                  gynecological={state.gynecological}
                  setGynecological={state.setGynecological}
                  extremities={state.extremities}
                  setExtremities={state.setExtremities}
                  neurological={state.neurological}
                  setNeurological={state.setNeurological}
                />

                <TabsContent value="special" className="space-y-6 mt-0">
                  <DynamicSpecialtyFields
                    config={state.specialtyConfig}
                    values={state.specialtyAnswers}
                    onChange={state.handleSpecialtyAnswerChange}
                  />
                </TabsContent>

                <ConsultationPlanTab
                  diagnosis={state.diagnosis}
                  setDiagnosis={state.setDiagnosis}
                  indications={state.indications}
                  setIndications={state.setIndications}
                  complementaryExams={state.complementaryExams}
                  setComplementaryExams={state.setComplementaryExams}
                  plan={state.plan}
                  setPlan={state.setPlan}
                  nextAppointmentDate={state.nextAppointmentDate}
                  setNextAppointmentDate={state.setNextAppointmentDate}
                  applyPrescriptionTemplate={state.applyPrescriptionTemplate}
                  currentSpecialtyPrescriptions={state.currentSpecialtyPrescriptions}
                />

                <ConsultationConsumablesTab
                  dynamicConsumables={state.dynamicConsumables}
                  commonQuantities={state.commonQuantities}
                  updateCommonQty={state.updateCommonQty}
                  customConsumables={state.customConsumables}
                  addCustomConsumable={state.addCustomConsumable}
                  removeCustomConsumable={state.removeCustomConsumable}
                  updateCustomConsumable={state.updateCustomConsumable}
                />
              </div>
            </div>

            <ConsultationFormActionFooter
              busy={state.busy}
              isEdit={state.isEdit}
              indications={state.indications}
              activeIndex={activeStepIndex}
              totalSteps={steps.length}
              onPrev={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
              onNext={() => setActiveStepIndex((i) => Math.min(steps.length - 1, i + 1))}
              onCancel={() => onOpenChange(false)}
              onSaveAction={(action) => state.handleSave(action)}
            />
            </>
            )}
          </div>
        </div>
      </Tabs>
    </form>
  );
}
