import { useState } from "react";
import {
  UserRound,
  FileText,
  Stethoscope,
  FolderOpen,
  UserPlus,
  CreditCard,
} from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  WorkspaceHeaderTitle,
  WorkspaceStepHeader,
  WorkspaceStepper,
  WorkspaceStepperFooter,
} from "@/components/ui/workspace-stepper";
import type { Patient } from "@/lib/api/patients";
import {
  PatientIdTab,
  PatientFamilyTab,
  PatientPersonalTab,
  PatientGynTab,
  PatientObsTab,
} from "./PatientFormTabs";

export interface PatientFormBodyProps {
  formState: any;
  doctors: any[];
  STATUSES: string[];
  statusLabel: (s: string) => string;
  busy: boolean;
  isEdit: boolean;
  isDoctorOnly?: boolean;
  doctorName?: string | null;
  backLabel?: string;
  savedPatient?: Patient | null;
  onResetForNew?: () => void;
  onOpenDossier?: (patientId: string) => void;
  onCancel: () => void;
}

interface PatientStepItem {
  id: "id" | "family" | "personal" | "gyn" | "obs";
  title: string;
  subtitle: string;
}

const PATIENT_STEPS: PatientStepItem[] = [
  {
    id: "id",
    title: "Identificación",
    subtitle: "Datos personales y contacto",
  },
  {
    id: "family",
    title: "Ant. Familiares",
    subtitle: "Herencia y familiares",
  },
  {
    id: "personal",
    title: "Ant. Personales",
    subtitle: "Hábitos, alergias y cirugías",
  },
  {
    id: "gyn",
    title: "Ginecológicos",
    subtitle: "Ciclo, citología y métodos",
  },
  {
    id: "obs",
    title: "Obstétricos",
    subtitle: "Gestas, FUM y control prenatal",
  },
];

function formatDoctorDisplayName(name?: string | null): string {
  if (!name) return "Médico Asignado";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function PatientSuccessView({
  savedPatient,
  isEdit,
  resolvedDocName,
  backLabel,
  onOpenDossier,
  onResetForNew,
  onCancel,
}: {
  savedPatient: Patient;
  isEdit: boolean;
  resolvedDocName?: string | null;
  backLabel: string;
  onOpenDossier?: (patientId: string) => void;
  onResetForNew?: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
      <style>{`
        @keyframes medizen-dossier-draw { 0% { stroke-dashoffset: 320; opacity: 0; transform: translateY(6px); } 50% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 1; transform: translateY(0); } }
        @keyframes medizen-seal-pop { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes medizen-seal-check { 0% { stroke-dashoffset: 60; } 100% { stroke-dashoffset: 0; } }
        .medizen-dossier-stroke { stroke-dasharray: 320; stroke-dashoffset: 320; animation: medizen-dossier-draw 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .medizen-seal-badge { transform-origin: 72px 72px; opacity: 0; animation: medizen-seal-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.35s forwards; }
        .medizen-seal-check-path { stroke-dasharray: 60; stroke-dashoffset: 60; animation: medizen-seal-check 0.38s cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards; }
      `}</style>

      <div className="relative flex items-center justify-center mb-5">
        <div className="absolute h-28 w-28 rounded-full bg-emerald-500/15 animate-ping [animation-duration:1.8s]" />
        <div className="absolute h-24 w-24 rounded-full bg-primary/5" />
        <svg className="h-28 w-28 relative z-10" viewBox="0 0 100 100" fill="none">
          <rect x="18" y="14" width="52" height="66" rx="10" className="fill-primary/10 stroke-primary medizen-dossier-stroke" strokeWidth="3.5" />
          <path d="M44 26V38M38 32H50" className="stroke-primary medizen-dossier-stroke" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M30 49H58M30 58H50M30 67H44" className="stroke-primary/70 medizen-dossier-stroke" strokeWidth="3" strokeLinecap="round" />
          <g className="medizen-seal-badge">
            <circle cx="70" cy="68" r="19" className="fill-emerald-500 stroke-card" strokeWidth="4" />
            <path d="M61.5 68.5L67 74L79 62" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="medizen-seal-check-path" />
          </g>
        </svg>
      </div>

      <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 rounded-full">
        {isEdit ? "Historia Clínica Actualizada" : "Expediente Clínico Oficial · Sellado"}
      </span>
      <h3 className="text-xl sm:text-2xl font-black text-foreground mt-3">
        {isEdit ? "¡Cambios Guardados con Éxito!" : "¡Historia Clínica Registrada!"}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md">
        Los 5 módulos del expediente médico de <strong className="text-foreground">{savedPatient.full_name}</strong> quedaron resguardados en la base de datos de la clínica.
      </p>

      <div className="mt-6 w-full max-w-md rounded-2xl border border-border/80 bg-muted/30 p-4 text-left shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary font-black text-sm flex items-center justify-center shrink-0">
              {(savedPatient.full_name || "P").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-foreground truncate">{savedPatient.full_name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{savedPatient.email || savedPatient.phone || "Paciente registrado"}</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-extrabold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg shrink-0">
            {savedPatient.historia_number ? `HC #${savedPatient.historia_number}` : `ID #${savedPatient.id}`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <CreditCard className="h-3 w-3 text-primary" /> Cédula / Documento
            </span>
            <p className="font-bold text-foreground mt-0.5 font-mono">{savedPatient.document_id || "Sin documento (S/C)"}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Stethoscope className="h-3 w-3 text-primary" /> Especialista
            </span>
            <p className="font-bold text-foreground mt-0.5 truncate">Dr(a). {formatDoctorDisplayName(resolvedDocName)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
        {onOpenDossier && (
          <Button type="button" onClick={() => onOpenDossier(savedPatient.id)} className="w-full sm:w-auto flex-1 h-10 rounded-2xl bg-primary text-primary-foreground hover:bg-[#3451d6] font-bold text-xs gap-1.5 shadow-sm shadow-primary/20 cursor-pointer">
            <FolderOpen className="h-4 w-4" /> Abrir Expediente del Paciente
          </Button>
        )}
        {!isEdit && onResetForNew && (
          <Button type="button" variant="outline" onClick={onResetForNew} className="w-full sm:w-auto h-10 rounded-2xl font-bold text-xs gap-1.5 cursor-pointer">
            <UserPlus className="h-4 w-4 text-primary" /> Registrar Otro Paciente
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto h-10 rounded-2xl font-semibold text-xs text-muted-foreground hover:text-foreground cursor-pointer">
          {backLabel}
        </Button>
      </div>
    </div>
  );
}

export function PatientFormBody({
  formState,
  doctors,
  STATUSES,
  statusLabel,
  busy,
  isEdit,
  isDoctorOnly,
  doctorName,
  backLabel = "Volver a Pacientes",
  savedPatient,
  onResetForNew,
  onOpenDossier,
  onCancel,
}: PatientFormBodyProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentStep = PATIENT_STEPS[activeIndex] ?? PATIENT_STEPS[0];
  const isFirstStep = activeIndex === 0;
  const isLastStep = activeIndex === PATIENT_STEPS.length - 1;
  const isAllSealed = Boolean(savedPatient);

  const assignedDoc = doctors.find(
    (d) => String(d.id) === String(formState.assigned_doctor_id),
  );
  const resolvedDocName = isDoctorOnly
    ? doctorName || assignedDoc?.full_name
    : assignedDoc?.full_name || doctorName;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Cabecera Superior Unificada */}
      <header className="mb-6 space-y-3.5 pb-5 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <WorkspaceHeaderTitle
            backLabel={backLabel}
            title={isEdit ? "Editar Historia Clínica" : "Nueva Historia Clínica"}
            badge="Expediente Clínico"
            onBack={onCancel}
          />

          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-xl border border-border/60 w-fit">
            Estado: <strong className="text-primary">{statusLabel(formState.status)}</strong>
          </span>
        </div>

        {/* Barra de Resumen en Vivo de la Paciente */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-muted/35 border border-border/60 items-center">
          <div className="md:col-span-5 flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <UserRound className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                Paciente
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-foreground truncate mt-1">
                {formState.full_name?.trim() || "Nuevo(a) Paciente"}
              </p>
            </div>
          </div>

          <div className="md:col-span-3 flex items-center gap-2.5 min-w-0 md:border-l md:border-border/60 md:pl-3.5">
            <div className="h-9 w-9 rounded-xl bg-background border border-border/70 text-primary flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                N° Historia
              </span>
              <p className="text-xs font-extrabold text-foreground truncate mt-1 font-mono">
                {formState.historia_number?.trim() || "Auto-generado"}
              </p>
            </div>
          </div>

          <div className="md:col-span-4 flex items-center gap-2.5 min-w-0 md:border-l md:border-border/60 md:pl-3.5">
            <div className="h-9 w-9 rounded-xl bg-background border border-border/70 text-primary flex items-center justify-center shrink-0">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                Especialista Asignado
              </span>
              <p className="text-xs font-extrabold text-foreground truncate mt-1">
                Dr(a). {formatDoctorDisplayName(resolvedDocName)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <Tabs
        value={currentStep.id}
        onValueChange={(val) => {
          const idx = PATIENT_STEPS.findIndex((s) => s.id === val);
          if (idx !== -1) setActiveIndex(idx);
        }}
        className="flex-1 flex flex-col min-w-0"
      >
        <div className="flex-1 flex flex-col lg:flex-row min-w-0">
          <WorkspaceStepper
            steps={PATIENT_STEPS}
            activeIndex={activeIndex}
            isAllCompleted={isAllSealed}
            sealedBadge="Historia Sellada"
            sealedTitle="Expediente Registrado"
            onSelectStep={setActiveIndex}
          />

          <div className="flex-1 min-w-0 lg:pl-8 flex flex-col justify-between">
            {savedPatient ? (
              <PatientSuccessView
                savedPatient={savedPatient}
                isEdit={isEdit}
                resolvedDocName={resolvedDocName}
                backLabel={backLabel}
                onOpenDossier={onOpenDossier}
                onResetForNew={onResetForNew}
                onCancel={onCancel}
              />
            ) : (
            <>
            <div className="min-w-0">
              <WorkspaceStepHeader
                stepNumber={activeIndex + 1}
                totalSteps={PATIENT_STEPS.length}
                title={currentStep.title}
                subtitle={currentStep.subtitle}
              />

              <div className="py-1">
                <PatientIdTab
                  historia_number={formState.historia_number}
                  setHistoriaNumber={formState.setHistoriaNumber}
                  full_name={formState.full_name}
                  setName={formState.setName}
                  idPrefix={formState.idPrefix}
                  setIdPrefix={formState.setIdPrefix}
                  idNumber={formState.idNumber}
                  setIdNumber={formState.setIdNumber}
                  birth_date={formState.birth_date}
                  setBirth={formState.setBirth}
                  gender={formState.gender}
                  setGender={formState.setGender}
                  blood_type={formState.blood_type}
                  setBloodType={formState.setBloodType}
                  marital_status={formState.marital_status}
                  setMaritalStatus={formState.setMaritalStatus}
                  birthplace={formState.birthplace}
                  setBirthplace={formState.setBirthplace}
                  education_level={formState.education_level}
                  setEducationLevel={formState.setEducationLevel}
                  occupation={formState.occupation}
                  setOccupation={formState.setOccupation}
                  ethnicity={formState.ethnicity}
                  setEthnicity={formState.setEthnicity}
                  phonePrefix={formState.phonePrefix}
                  setPhonePrefix={formState.setPhonePrefix}
                  phoneNumber={formState.phoneNumber}
                  setPhoneNumber={formState.setPhoneNumber}
                  email={formState.email}
                  setEmail={formState.setEmail}
                  address={formState.address}
                  setAddress={formState.setAddress}
                  emergency_contact={formState.emergency_contact}
                  setEmergencyContact={formState.setEmergencyContact}
                  insurance_provider={formState.insurance_provider}
                  setInsuranceProvider={formState.setInsuranceProvider}
                  status={formState.status}
                  setStatus={formState.setStatus}
                  first_visit_date={formState.first_visit_date}
                  setFirstVisitDate={formState.setFirstVisitDate}
                  assigned_doctor_id={formState.assigned_doctor_id}
                  setDoctor={formState.setDoctor}
                  doctors={doctors}
                  isDoctorOnly={isDoctorOnly}
                  doctorName={doctorName}
                  STATUSES={STATUSES}
                  statusLabel={statusLabel}
                  consultation_reason={formState.consultation_reason}
                  setConsultationReason={formState.setConsultationReason}
                  current_illness={formState.current_illness}
                  setCurrentIllness={formState.setCurrentIllness}
                  notes={formState.notes}
                  setNotes={formState.setNotes}
                />

                <PatientFamilyTab
                  famMother={formState.famMother}
                  setFamMother={formState.setFamMother}
                  famFather={formState.famFather}
                  setFamFather={formState.setFamFather}
                  famSiblings={formState.famSiblings}
                  setFamSiblings={formState.setFamSiblings}
                  famChildren={formState.famChildren}
                  setFamChildren={formState.setFamChildren}
                />

                <PatientPersonalTab
                  persAlcohol={formState.persAlcohol}
                  setPersAlcohol={formState.setPersAlcohol}
                  persDrugs={formState.persDrugs}
                  setPersDrugs={formState.setPersDrugs}
                  persTobacco={formState.persTobacco}
                  setPersTobacco={formState.setPersTobacco}
                  persBase={formState.persBase}
                  setPersBase={formState.setPersBase}
                  persAllergies={formState.persAllergies}
                  setPersAllergies={formState.setPersAllergies}
                  persMedications={formState.persMedications}
                  setPersMedications={formState.setPersMedications}
                  persSurgical={formState.persSurgical}
                  setPersSurgical={formState.setPersSurgical}
                  persTransfusions={formState.persTransfusions}
                  setPersTransfusions={formState.setPersTransfusions}
                />

                <PatientGynTab
                  gynMenarche={formState.gynMenarche}
                  setGynMenarche={formState.setGynMenarche}
                  gynSexarche={formState.gynSexarche}
                  setGynSexarche={formState.setGynSexarche}
                  gynCycle={formState.gynCycle}
                  setGynCycle={formState.setGynCycle}
                  gynDismenorrea={formState.gynDismenorrea}
                  setGynDismenorrea={formState.setGynDismenorrea}
                  gynNps={formState.gynNps}
                  setGynNps={formState.setGynNps}
                  gynIts={formState.gynIts}
                  setGynIts={formState.setGynIts}
                  gynCytology={formState.gynCytology}
                  setGynCytology={formState.setGynCytology}
                  gynContraceptives={formState.gynContraceptives}
                  setGynContraceptives={formState.setGynContraceptives}
                />

                <PatientObsTab
                  obsG={formState.obsG}
                  setObsG={formState.setObsG}
                  obsP={formState.obsP}
                  setObsP={formState.setObsP}
                  obsC={formState.obsC}
                  setObsC={formState.setObsC}
                  obsA={formState.obsA}
                  setObsA={formState.setObsA}
                  obsPig={formState.obsPig}
                  setObsPig={formState.setObsPig}
                  obsEm={formState.obsEm}
                  setObsEm={formState.setObsEm}
                  obsEe={formState.obsEe}
                  setObsEe={formState.setObsEe}
                  obsFum={formState.obsFum}
                  handleFumChange={formState.handleFumChange}
                  obsEg={formState.obsEg}
                  setObsEg={formState.setObsEg}
                  obsFpp={formState.obsFpp}
                  setObsFpp={formState.setObsFpp}
                  obsNumConsultations={formState.obsNumConsultations}
                  setObsNumConsultations={formState.setObsNumConsultations}
                  obsVaccines={formState.obsVaccines}
                  setObsVaccines={formState.setObsVaccines}
                  obsComplications={formState.obsComplications}
                  setObsComplications={formState.setObsComplications}
                />
              </div>
            </div>

            {/* Pie de Navegación del Stepper */}
            <WorkspaceStepperFooter
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              isPending={busy}
              canQuickSubmit={isEdit || Boolean(formState.full_name?.trim())}
              submitLabel={isEdit ? "Guardar cambios" : "Crear paciente"}
              onCancel={onCancel}
              onPrev={() => setActiveIndex((i) => Math.max(0, i - 1))}
              onNext={() => setActiveIndex((i) => Math.min(PATIENT_STEPS.length - 1, i + 1))}
            />
            </>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
