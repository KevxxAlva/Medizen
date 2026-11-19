import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  ArrowLeft,
  UserRound,
} from "lucide-react";
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
  const isEdit = !!existingConsultation;

  if (!open) return null;

  return (
    <div className="bg-card border border-border rounded-3xl p-3.5 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] flex flex-col text-foreground w-full min-w-0 animate-in fade-in duration-200">
      {/* Cabecera de Página Completa (Modo Consultorio) */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border/60">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 px-2.5 -ml-1 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Button>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              Modo Consultorio
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {isEdit ? "Editar Consulta Clínica" : "Registrar Nueva Consulta Clínica"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium flex flex-wrap items-center gap-1.5">
            <span>Examen físico, diagnóstico, récipe e insumos para</span>
            <span className="inline-flex items-center gap-1 font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg">
              <UserRound className="h-3.5 w-3.5" />
              {appointment?.patient_name || "Paciente"}
            </span>
          </p>
        </div>
      </header>

      {loadingExisting ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ConsultationFormContent
          key={existingConsultation?.id ?? appointment?.id ?? "new"}
          appointment={appointment}
          existingConsultation={existingConsultation}
          onOpenChange={onOpenChange}
        />
      )}
    </div>
  );
}

function ConsultationDoctorSpecialtyBar({
  selectedDoctorId,
  currentDoctor,
  doctors,
  handleDoctorChange,
  selectedSpecialty,
  isDoctorOnly,
  templates,
  onApplyTemplate,
}: {
  selectedDoctorId: string;
  currentDoctor: any;
  doctors: any[];
  handleDoctorChange: (id: string) => void;
  selectedSpecialty: string;
  isDoctorOnly?: boolean;
  templates: { id: string; name: string }[];
  onApplyTemplate: (id: string) => void;
}) {
  const doctorSpecialty = currentDoctor?.specialty || selectedSpecialty || "Medicina General";
  const badge = getSpecialtyBadgeStyle(doctorSpecialty);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 mb-4 rounded-2xl bg-muted/40 border border-border/50 min-w-0">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 shrink-0">
            <Stethoscope className="w-3.5 h-3.5 text-primary" /> Médico:
          </span>
          {isDoctorOnly ? (
            <div className="flex items-center gap-2 h-8 px-3 rounded-xl bg-background border border-border/50 text-xs font-bold text-foreground max-w-full">
              <span className="truncate">Dr(a). {currentDoctor?.full_name || "Médico Tratante"}</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                Tú
              </span>
            </div>
          ) : (
            <Select
              value={selectedDoctorId || currentDoctor?.id || ""}
              onValueChange={handleDoctorChange}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl bg-background border-border/50 font-bold w-full sm:w-auto sm:min-w-[220px]">
                <SelectValue placeholder="Seleccione médico…" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-[300px]">
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-xs font-semibold">
                    {d.full_name} {d.specialty ? `— ${d.specialty}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-muted-foreground shrink-0">Especialidad:</span>
          <span
            className={cn(
              "text-[11px] sm:text-xs font-extrabold px-3 py-1 rounded-xl border uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs break-words max-w-full",
              badge.className,
            )}
          >
            <Sparkles className="w-3 h-3 opacity-80 shrink-0" />
            <span className="break-words">{doctorSpecialty}</span>
          </span>
        </div>
      </div>

      {/* Selector de Plantillas Rápidas separado de las pestañas para no quitarles espacio */}
      <div className="flex items-center gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40 shrink-0">
        <Wand2 className="h-4 w-4 text-primary shrink-0" />
        <Select onValueChange={onApplyTemplate}>
          <SelectTrigger className="w-full lg:w-[230px] h-9 text-xs rounded-xl bg-background border-border/60 font-medium shadow-none">
            <SelectValue placeholder="Plantillas rápidas…" />
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-[300px]">
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id} className="text-xs">
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
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

function ConsultationFormActionFooter({
  busy,
  isEdit,
  indications,
  onCancel,
  onSaveAction,
}: {
  busy: boolean;
  isEdit: boolean;
  indications: string;
  onCancel: () => void;
  onSaveAction: (action: "save" | "print" | "whatsapp") => void;
}) {
  return (
    <div className="mt-6 border-t border-border/60 pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={busy}
        className="rounded-2xl w-full sm:w-auto h-10 text-xs font-semibold cursor-pointer"
      >
        Cancelar
      </Button>
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
        <Button
          type="submit"
          disabled={busy}
          className="rounded-2xl bg-primary text-primary-foreground hover:bg-[#3451d6] shadow-sm shadow-primary/20 hover:opacity-95 px-6 h-10 text-xs font-bold cursor-pointer"
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
      </div>
    </div>
  );
}

function ConsultationFormContent({
  appointment,
  existingConsultation,
  onOpenChange,
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
}) {
  const { isDoctorOnly } = useUserRoleScope();
  const state = useConsultationFormState(appointment, existingConsultation, onOpenChange);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    state.handleSave("save");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 flex flex-col min-w-0"
    >
      <ConsultationDoctorSpecialtyBar
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

      <Tabs defaultValue="anamnesis" className="flex-1 flex flex-col min-w-0">
        {/* Pestañas adaptables en cuadrícula limpia (sin barra de scroll horizontal en teléfono ni escritorio) */}
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto w-full bg-muted/60 p-1.5 rounded-2xl gap-1.5 mb-5">
          <TabsTrigger
            value="anamnesis"
            className="rounded-xl font-semibold text-xs py-2 px-3 data-[state=active]:shadow-sm"
          >
            Anamnesis
          </TabsTrigger>
          <TabsTrigger
            value="vitals"
            className="rounded-xl font-semibold text-xs py-2 px-3 data-[state=active]:shadow-sm"
          >
            Físico y Vitales
          </TabsTrigger>
          <TabsTrigger
            value="special"
            className="rounded-xl font-semibold text-xs py-2 px-3 data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            title={state.specialtyConfig.tabTitle}
          >
            <Sparkles className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate">{state.specialtyConfig.tabTitle}</span>
          </TabsTrigger>
          <TabsTrigger
            value="plan"
            className="rounded-xl font-semibold text-xs py-2 px-3 data-[state=active]:shadow-sm"
          >
            Diagnóstico & Plan
          </TabsTrigger>
          <TabsTrigger
            value="consumables"
            className="col-span-2 sm:col-span-1 rounded-xl font-semibold text-xs py-2 px-3 data-[state=active]:shadow-sm"
          >
            Consumibles
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
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
          onCancel={() => onOpenChange(false)}
          onSaveAction={(action) => state.handleSave(action)}
        />
      </Tabs>
    </form>
  );
}
