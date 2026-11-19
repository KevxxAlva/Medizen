import React, { useState } from "react";
import {
  Loader2,
  ArrowLeft,
  UserRound,
  FileText,
  Stethoscope,
  Check,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  UserPlus,
  CreditCard,
} from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 shrink-0 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{backLabel}</span>
            </Button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                  {isEdit ? "Editar Historia Clínica" : "Nueva Historia Clínica"}
                </h1>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Expediente Clínico
                </span>
              </div>
            </div>
          </div>

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
          {/* Stepper Horizontal Móvil (< lg) */}
          <div className="lg:hidden mb-5 rounded-2xl border border-border/60 bg-muted/30 p-3.5">
            <div className="flex items-center justify-between relative">
              {PATIENT_STEPS.map((step, idx) => {
                const isCompleted = isAllSealed || idx < activeIndex;
                const isActive = !isAllSealed && idx === activeIndex;
                const isLast = idx === PATIENT_STEPS.length - 1;

                return (
                  <div key={step.id} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      disabled={isAllSealed}
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`Paso ${idx + 1}: ${step.title}`}
                      className={cn(
                        "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-all cursor-pointer disabled:cursor-default",
                        isCompleted
                          ? "border-2 border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : isActive
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 ring-4 ring-primary/15"
                            : "border-2 border-border bg-background text-muted-foreground",
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : idx + 1}
                    </button>
                    {!isLast && (
                      <div className="flex-1 mx-1.5 h-0.5 rounded-full bg-border overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            isCompleted ? "w-full bg-emerald-500" : "w-0 bg-primary",
                          )}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-border/50">
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary block">
                  Paso {activeIndex + 1} de {PATIENT_STEPS.length}
                </span>
                <p className="text-sm font-bold text-foreground truncate">{currentStep.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{currentStep.subtitle}</p>
              </div>
              <span className="text-xs font-mono font-bold text-muted-foreground bg-background px-2.5 py-1 rounded-xl border border-border/60 shrink-0">
                {activeIndex + 1} / {PATIENT_STEPS.length}
              </span>
            </div>
          </div>

          {/* Stepper Vertical Lateral Escritorio (lg+) */}
          <aside className="hidden lg:flex flex-col w-64 shrink-0 pr-7 border-r border-border/60 select-none">
            <div className="relative py-2">
              {PATIENT_STEPS.map((step, idx) => {
                const isCompleted = isAllSealed || idx < activeIndex;
                const isActive = !isAllSealed && idx === activeIndex;
                const isLast = idx === PATIENT_STEPS.length - 1;

                return (
                  <div key={step.id} className="relative flex items-start justify-end gap-4 pb-8 last:pb-0">
                    {!isLast && (
                      <div
                        className={cn(
                          "absolute right-[17px] top-9 bottom-0 w-[2px] transition-colors",
                          isCompleted ? "bg-emerald-500/60" : "bg-border",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full",
                            isCompleted ? "bg-emerald-500" : "bg-muted-foreground/35",
                          )}
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isAllSealed}
                      onClick={() => setActiveIndex(idx)}
                      className="text-right group cursor-pointer disabled:cursor-default focus:outline-none min-w-0 flex-1 pt-0.5"
                    >
                      <p
                        className={cn(
                          "text-xs font-bold transition-colors leading-snug",
                          isActive
                            ? "text-primary font-extrabold"
                            : isCompleted
                              ? "text-emerald-600 dark:text-emerald-400 font-bold"
                              : "text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                        {step.subtitle}
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={isAllSealed}
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`Ir al paso ${idx + 1}: ${step.title}`}
                      className={cn(
                        "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-all cursor-pointer disabled:cursor-default",
                        isCompleted
                          ? "border-2 border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-2xs"
                          : isActive
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 ring-4 ring-primary/15"
                            : "border-2 border-primary/30 bg-background text-muted-foreground hover:border-primary/60",
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : idx + 1}
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Contenido del Paso Activo o Animación de Expediente Clínico Sellado */}
          <div className="flex-1 min-w-0 lg:pl-8 flex flex-col justify-between">
            {savedPatient ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
                <style>{`
                  @keyframes medizen-dossier-draw {
                    0% { stroke-dashoffset: 320; opacity: 0; transform: translateY(6px); }
                    50% { opacity: 1; }
                    100% { stroke-dashoffset: 0; opacity: 1; transform: translateY(0); }
                  }
                  @keyframes medizen-seal-pop {
                    0% { transform: scale(0.4); opacity: 0; }
                    70% { transform: scale(1.08); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                  @keyframes medizen-seal-check {
                    0% { stroke-dashoffset: 60; }
                    100% { stroke-dashoffset: 0; }
                  }
                  .medizen-dossier-stroke {
                    stroke-dasharray: 320;
                    stroke-dashoffset: 320;
                    animation: medizen-dossier-draw 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                  }
                  .medizen-seal-badge {
                    transform-origin: 72px 72px;
                    opacity: 0;
                    animation: medizen-seal-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.35s forwards;
                  }
                  .medizen-seal-check-path {
                    stroke-dasharray: 60;
                    stroke-dashoffset: 60;
                    animation: medizen-seal-check 0.38s cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards;
                  }
                `}</style>

                {/* Ilustración SVG: Expediente Clínico + Sello Esmeralda Animado */}
                <div className="relative flex items-center justify-center mb-5">
                  <div className="absolute h-28 w-28 rounded-full bg-emerald-500/15 animate-ping [animation-duration:1.8s]" />
                  <div className="absolute h-24 w-24 rounded-full bg-primary/5" />
                  <svg
                    className="h-28 w-28 relative z-10"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Carpeta / Ficha Clínica */}
                    <rect
                      x="18"
                      y="14"
                      width="52"
                      height="66"
                      rx="10"
                      className="fill-primary/10 stroke-primary medizen-dossier-stroke"
                      strokeWidth="3.5"
                    />
                    {/* Cruz Médica superior dentro del expediente */}
                    <path
                      d="M44 26V38M38 32H50"
                      className="stroke-primary medizen-dossier-stroke"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Líneas del expediente */}
                    <path
                      d="M30 49H58M30 58H50M30 67H44"
                      className="stroke-primary/70 medizen-dossier-stroke"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Sello Circular Esmeralda con Checkmark */}
                    <g className="medizen-seal-badge">
                      <circle
                        cx="70"
                        cy="68"
                        r="19"
                        className="fill-emerald-500 stroke-card"
                        strokeWidth="4"
                      />
                      <path
                        d="M61.5 68.5L67 74L79 62"
                        stroke="white"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="medizen-seal-check-path"
                      />
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
                  Los 5 módulos del expediente médico de{" "}
                  <strong className="text-foreground">{savedPatient.full_name}</strong> quedaron
                  resguardados en la base de datos de la clínica.
                </p>

                {/* Carnet Digital del Paciente */}
                <div className="mt-6 w-full max-w-md rounded-2xl border border-border/80 bg-muted/30 p-4 text-left shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary font-black text-sm flex items-center justify-center shrink-0">
                        {(savedPatient.full_name || "P").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-foreground truncate">
                          {savedPatient.full_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {savedPatient.email || savedPatient.phone || "Paciente registrado"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-extrabold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg shrink-0">
                      {savedPatient.historia_number
                        ? `HC #${savedPatient.historia_number}`
                        : `ID #${savedPatient.id}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-primary" /> Cédula / Documento
                      </span>
                      <p className="font-bold text-foreground mt-0.5 font-mono">
                        {savedPatient.document_id || "Sin documento (S/C)"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Stethoscope className="h-3 w-3 text-primary" /> Especialista
                      </span>
                      <p className="font-bold text-foreground mt-0.5 truncate">
                        Dr(a). {formatDoctorDisplayName(resolvedDocName)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción Inmediata */}
                <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
                  {onOpenDossier && (
                    <Button
                      type="button"
                      onClick={() => onOpenDossier(savedPatient.id)}
                      className="w-full sm:w-auto flex-1 h-10 rounded-2xl bg-primary text-primary-foreground hover:bg-[#3451d6] font-bold text-xs gap-1.5 shadow-sm shadow-primary/20 cursor-pointer"
                    >
                      <FolderOpen className="h-4 w-4" />
                      Abrir Expediente del Paciente
                    </Button>
                  )}

                  {!isEdit && onResetForNew && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onResetForNew}
                      className="w-full sm:w-auto h-10 rounded-2xl font-bold text-xs gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4 text-primary" />
                      Registrar Otro Paciente
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="w-full sm:w-auto h-10 rounded-2xl font-semibold text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {backLabel}
                  </Button>
                </div>
              </div>
            ) : (
            <>
            <div className="min-w-0">
              <div className="hidden lg:flex items-center justify-between pb-3.5 mb-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-extrabold">
                    {activeIndex + 1}
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-foreground leading-tight">
                      {currentStep.title}
                    </h2>
                    <p className="text-xs text-muted-foreground">{currentStep.subtitle}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-3 py-1 rounded-xl border border-border/60">
                  Paso {activeIndex + 1} de {PATIENT_STEPS.length}
                </span>
              </div>

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
            <div className="mt-6 border-t border-border/60 pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={busy}
                className="rounded-2xl w-full sm:w-auto h-10 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancelar
              </Button>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-end gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                    disabled={isFirstStep || busy}
                    className="rounded-2xl flex-1 sm:flex-initial h-10 px-4 text-xs font-bold gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>

                  {!isLastStep ? (
                    <Button
                      type="button"
                      onClick={() => setActiveIndex((i) => Math.min(PATIENT_STEPS.length - 1, i + 1))}
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
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isEdit ? "Guardar cambios" : "Crear paciente"}
                    </Button>
                  )}
                </div>

                {/* Botón rápido para guardar desde cualquier paso si ya escribió el nombre */}
                {!isLastStep && (isEdit || formState.full_name?.trim()) && (
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={busy}
                    className="rounded-2xl h-10 px-4 text-xs font-bold cursor-pointer"
                  >
                    {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    {isEdit ? "Guardar cambios" : "Crear paciente"}
                  </Button>
                )}
              </div>
            </div>
            </>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
