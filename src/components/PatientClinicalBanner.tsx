import React, { useState } from "react";
import { 
  ShieldAlert, ShieldCheck, HeartPulse, Baby, Copy, Check, 
  Stethoscope, Calendar, Phone, Mail, FileText, AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Patient } from "@/lib/api/patients";

interface PatientClinicalBannerProps {
  patient: Patient;
  assignedDoctorName?: string;
  onStartConsultation?: () => void;
  compact?: boolean;
  className?: string;
}

export function PatientClinicalBanner({
  patient,
  assignedDoctorName,
  onStartConsultation,
  compact = false,
  className = "",
}: PatientClinicalBannerProps) {
  const [copied, setCopied] = useState(false);

  const calculateAge = (dob: string | Date | null | undefined): string => {
    if (!dob) return "—";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} años`;
  };

  const getInitials = (name?: string) => {
    if (!name) return "PT";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Check if patient has registered allergies
  const allergies = patient.personal_history?.allergies?.trim() || "";
  const hasAllergies = 
    allergies.length > 0 && 
    !allergies.toUpperCase().includes("NIEGA") && 
    !allergies.toUpperCase().includes("NO REFIERE") &&
    allergies !== "—";

  // Base pathologies
  const basePathology = patient.personal_history?.base_pathology?.trim() || "";
  const hasBasePathology = 
    basePathology.length > 0 && 
    !basePathology.toUpperCase().includes("NIEGA") && 
    !basePathology.toUpperCase().includes("NINGUNA") &&
    basePathology !== "—";

  // Obstetric active condition
  const obstetricData = patient.obstetric_data;
  const isObstetricActive = !!(obstetricData?.fum || obstetricData?.eg || obstetricData?.fpp);

  const handleCopyId = () => {
    if (patient.document_id) {
      navigator.clipboard.writeText(patient.document_id);
      setCopied(true);
      toast.success(`Cédula ${patient.document_id} copiada al portapapeles`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusBgMap: Record<string, string> = {
    activo: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    en_tratamiento: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    nuevo: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    alta: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-4 sm:p-5 shadow-sm transition-all duration-300",
        hasAllergies && "border-rose-500/30 shadow-rose-500/5",
        className
      )}
    >
      {/* Decorative backdrop glow */}
      <div 
        className={cn(
          "absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl pointer-events-none opacity-40",
          hasAllergies ? "bg-rose-500/20" : "bg-primary/10"
        )} 
      />

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Side: Avatar & Demographics */}
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4.5">
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary via-primary/90 to-primary/70 text-primary-foreground font-black text-lg sm:text-xl shadow-md shadow-primary/25 border border-white/20">
              {getInitials(patient.full_name)}
            </div>
            <span
              className={cn(
                "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background",
                hasAllergies ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
              )}
              title={hasAllergies ? "Alerta de Alergias Activa" : "Estado Clínico Regular"}
            />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate max-w-[280px] sm:max-w-md">
                {patient.full_name}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border shadow-2xs",
                  statusBgMap[patient.status] || "bg-muted text-muted-foreground border-border/40"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {patient.status ? patient.status.replace("_", " ").toUpperCase() : "ACTIVO"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
              {patient.document_id && (
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="group inline-flex items-center gap-1 font-semibold text-foreground/90 hover:text-primary transition-colors cursor-pointer"
                  title="Clic para copiar C.I."
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>C.I. {patient.document_id}</span>
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  )}
                </button>
              )}

              <span className="font-medium">
                {calculateAge(patient.birth_date)}
              </span>

              {patient.historia_number && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground border border-border/40">
                  HC #{patient.historia_number}
                </span>
              )}

              {assignedDoctorName && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                  Dr(a). {assignedDoctorName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: High-Priority Clinical Badges & Quick Action */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t border-border/40 lg:border-t-0">
          {/* Allergies Highlight (Top Priority Alert) */}
          {hasAllergies ? (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-rose-500/15 border border-rose-500/35 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 shadow-xs animate-in fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-rose-500 font-extrabold leading-none">
                  Alergia Severa
                </span>
                <span className="truncate max-w-[200px] leading-tight mt-0.5 font-semibold">
                  {allergies}
                </span>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-[11px]">Sin alergias conocidas</span>
            </div>
          )}

          {/* Base Pathology Badge */}
          {hasBasePathology && (
            <div className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <HeartPulse className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="text-[11px] truncate max-w-[170px]">{basePathology}</span>
            </div>
          )}

          {/* Obstetric Badge if pregnant */}
          {isObstetricActive && (
            <div className="inline-flex items-center gap-1.5 rounded-2xl bg-pink-500/10 border border-pink-500/25 px-2.5 py-1 text-xs font-semibold text-pink-700 dark:text-pink-300">
              <Baby className="h-3.5 w-3.5 text-pink-500 shrink-0" />
              <span className="text-[11px]">
                {obstetricData?.eg ? `EG: ${obstetricData.eg}` : "Obstétrico"}
                {obstetricData?.fpp ? ` · FPP: ${obstetricData.fpp}` : ""}
              </span>
            </div>
          )}

          {/* Quick Consultation Trigger */}
          {onStartConsultation && (
            <Button
              onClick={onStartConsultation}
              size="sm"
              className="ml-auto lg:ml-2 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer h-9 px-3.5"
            >
              <Stethoscope className="h-4 w-4" />
              <span>Atender Consulta</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
