import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import {
  AVAILABLE_SPECIALTIES,
  getSpecialtyBadgeStyle,
} from "@/lib/constants/specialtyForms";
import { DynamicSpecialtyFields } from "@/components/consultation/DynamicSpecialtyFields";
import { TabsContent } from "@/components/ui/tabs";
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
}) {
  const { data: existingConsultation, isLoading: loadingExisting } = useConsultationByAppointment(
    appointment?.id,
  );
  const isEdit = !!existingConsultation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col rounded-[2rem] p-6 text-foreground">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-foreground">
            {isEdit ? "Editar Consulta Clínica" : "Registrar Nueva Consulta Clínica"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Registrar examen físico, diagnóstico y consumibles utilizados para{" "}
            <span className="font-semibold text-primary">{appointment?.patient_name}</span>.
          </DialogDescription>
        </DialogHeader>

        {loadingExisting ? (
          <div className="flex-1 flex items-center justify-center">
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
      </DialogContent>
    </Dialog>
  );
}

function ConsultationDoctorSpecialtyBar({
  selectedDoctorId,
  currentDoctor,
  doctors,
  handleDoctorChange,
  selectedSpecialty,
  setSelectedSpecialty,
}: {
  selectedDoctorId: string;
  currentDoctor: any;
  doctors: any[];
  handleDoctorChange: (id: string) => void;
  selectedSpecialty: string;
  setSelectedSpecialty: (val: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-3 rounded-2xl bg-muted/40 border border-border/50">
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <span className="text-xs font-bold text-muted-foreground">Médico:</span>
        <Select
          value={selectedDoctorId || currentDoctor?.id || ""}
          onValueChange={handleDoctorChange}
        >
          <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-border/50 font-bold w-full sm:w-auto sm:min-w-[200px]">
            <SelectValue placeholder="Seleccione médico..." />
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-[300px]">
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id} className="text-xs font-semibold">
                {d.full_name} {d.specialty ? `— ${d.specialty}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <span className="text-xs font-bold text-muted-foreground">Especialidad:</span>
        <Select value={selectedSpecialty} onValueChange={(val) => setSelectedSpecialty(val)}>
          <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-primary/40 font-bold text-primary w-full sm:w-auto sm:min-w-[220px]">
            <SelectValue placeholder="Seleccione especialidad..." />
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-[300px]">
            {AVAILABLE_SPECIALTIES.map((spec) => (
              <SelectItem key={spec.id} value={spec.name} className="text-xs font-semibold">
                {spec.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span
          className={cn(
            "text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider hidden sm:inline-block",
            getSpecialtyBadgeStyle(selectedSpecialty).className,
          )}
        >
          {selectedSpecialty}
        </span>
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
    <DialogFooter className="mt-4 border-t border-border/60 pt-4 flex items-center justify-between">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={busy}
        className="rounded-2xl"
      >
        Cancelar
      </Button>
      <div className="flex items-center gap-2">
        {indications.trim() && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSaveAction("print")}
              disabled={busy}
              className="rounded-2xl border-mauve text-primary hover:bg-primary/10 flex items-center gap-1.5 cursor-pointer h-9 text-xs"
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
              className="rounded-2xl border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1.5 cursor-pointer h-9 text-xs font-bold"
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
          className="rounded-2xl bg-primary text-primary-foreground hover:bg-[#3451d6] shadow-sm shadow-primary/20 hover:opacity-95 px-6 h-9 text-xs font-semibold"
        >
          {busy ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...
            </span>
          ) : isEdit ? (
            "Guardar Cambios"
          ) : (
            "Registrar Consulta"
          )}
        </Button>
      </div>
    </DialogFooter>
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
  const state = useConsultationFormState(appointment, existingConsultation, onOpenChange);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    state.handleSave("save");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 overflow-hidden p-3 sm:p-6 flex flex-col min-h-0 bg-background/50 relative"
    >
      <ConsultationDoctorSpecialtyBar
        selectedDoctorId={state.selectedDoctorId}
        currentDoctor={state.currentDoctor}
        doctors={state.doctors}
        handleDoctorChange={state.handleDoctorChange}
        selectedSpecialty={state.selectedSpecialty}
        setSelectedSpecialty={state.setSelectedSpecialty}
      />

      <ConsultationAllergyBanner patient={state.patient} />

      <Tabs defaultValue="anamnesis" className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <TabsList className="flex items-center h-10 w-full lg:w-auto bg-muted/60 p-1 rounded-2xl gap-1 overflow-x-auto">
            <TabsTrigger
              value="anamnesis"
              className="rounded-xl font-semibold text-xs px-3.5 py-1.5 shrink-0 data-[state=active]:shadow-sm"
            >
              Anamnesis
            </TabsTrigger>
            <TabsTrigger
              value="vitals"
              className="rounded-xl font-semibold text-xs px-3.5 py-1.5 shrink-0 data-[state=active]:shadow-sm"
            >
              Físico y Vitales
            </TabsTrigger>
            <TabsTrigger
              value="special"
              className="rounded-xl font-semibold text-xs px-3.5 py-1.5 shrink-0 data-[state=active]:shadow-sm flex items-center gap-1.5"
              title={state.specialtyConfig.tabTitle}
            >
              <Sparkles className="w-3 h-3 text-primary shrink-0" />
              <span>{state.specialtyConfig.tabTitle}</span>
            </TabsTrigger>
            <TabsTrigger
              value="plan"
              className="rounded-xl font-semibold text-xs px-3.5 py-1.5 shrink-0 data-[state=active]:shadow-sm"
            >
              Diagnóstico & Plan
            </TabsTrigger>
            <TabsTrigger
              value="consumables"
              className="rounded-xl font-semibold text-xs px-3.5 py-1.5 shrink-0 data-[state=active]:shadow-sm"
            >
              Consumibles
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
            <Wand2 className="h-4 w-4 text-primary" />
            <Select onValueChange={state.applyClinicalTemplate}>
              <SelectTrigger className="w-[210px] h-9 text-xs rounded-xl bg-background border-border/60 font-medium shadow-none">
                <SelectValue placeholder="Plantillas rápidas..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-[300px]">
                {state.currentSpecialtyTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
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
        </ScrollArea>

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
