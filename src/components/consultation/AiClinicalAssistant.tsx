import { useState } from "react";
import { Sparkles, Wand2, Check, RefreshCw, Pill, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export interface AiClinicalAssistantVitals {
  heightCm?: string;
  weightKg?: string;
  bmi?: string;
  bloodPressure?: string;
  heartRate?: string;
  respiratoryRate?: string;
  temperature?: string;
}

export interface AiClinicalAssistantExam {
  skin?: string;
  headNeck?: string;
  breasts?: string;
  abdomen?: string;
  gynecological?: string;
  extremities?: string;
  neurological?: string;
}

interface AiClinicalAssistantProps {
  patientName?: string;
  allergies?: string | null;
  chronicConditions?: string | null;
  specialty?: string;
  visitType?: string;
  vitals?: AiClinicalAssistantVitals;
  physicalExam?: AiClinicalAssistantExam;
  diagnosis?: string;
  plan?: string;
  indications?: string;
  notesInput: string;
  onApplyNotes: (formattedNotes: string) => void;
  onApplyPrescription?: (prescription: string) => void;
}

export function AiClinicalAssistant(props: AiClinicalAssistantProps) {
  const {
    patientName = "Paciente",
    allergies,
    onApplyNotes,
    onApplyPrescription,
  } = props;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"soap" | "clear_instructions" | "differential">("soap");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [suggestedPrescription, setSuggestedPrescription] = useState("");

  const handleOpen = () => {
    setOpen(true);
    handleGenerate(mode);
  };

  const handleGenerate = (targetMode: "soap" | "clear_instructions" | "differential") => {
    setIsProcessing(true);
    setTimeout(() => {
      const content = buildStructuredContent(targetMode, props);
      setGeneratedOutput(content.notes);
      setSuggestedPrescription(content.prescription);
      setIsProcessing(false);
    }, 250);
  };

  const handleApplyAll = () => {
    if (!generatedOutput) return;
    onApplyNotes(generatedOutput);
    if (suggestedPrescription && onApplyPrescription) {
      onApplyPrescription(suggestedPrescription);
    }
    toast.success("Estructura clínica aplicada exitosamente.");
    setOpen(false);
  };

  const handleApplyNotesOnly = () => {
    if (!generatedOutput) return;
    onApplyNotes(generatedOutput);
    toast.success("Notas clínicas aplicadas.");
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs gap-1.5 shadow-2xs cursor-pointer transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
        <span>Asistente Clínico IA</span>
      </Button>

      <AiClinicalModal
        open={open}
        onOpenChange={setOpen}
        patientName={patientName}
        allergies={allergies}
        mode={mode}
        isProcessing={isProcessing}
        generatedOutput={generatedOutput}
        suggestedPrescription={suggestedPrescription}
        hasPrescriptionCallback={Boolean(onApplyPrescription)}
        onModeSelect={(m) => {
          setMode(m);
          handleGenerate(m);
        }}
        onRefresh={() => handleGenerate(mode)}
        onApplyAll={handleApplyAll}
        onApplyNotesOnly={handleApplyNotesOnly}
      />
    </>
  );
}

function buildStructuredContent(
  targetMode: "soap" | "clear_instructions" | "differential",
  props: AiClinicalAssistantProps
): { notes: string; prescription: string } {
  const {
    patientName = "Paciente",
    allergies,
    chronicConditions,
    specialty = "Consulta General",
    visitType = "CONTROL",
    vitals,
    physicalExam,
    diagnosis,
    plan,
    indications,
    notesInput,
  } = props;

  const cleanInput =
    notesInput.trim() ||
    "[Sin motivo subjetivo redactado — ingrese los síntomas o motivo de consulta en el campo Examen Subjetivo]";

  const allergySummary = allergies?.trim()
    ? allergies.trim()
    : "No registradas en historia clínica (confirmar durante anamnesis)";
  const chronicSummary = chronicConditions?.trim()
    ? chronicConditions.trim()
    : "No reportadas en historia clínica";

  const vitalParts: string[] = [];
  if (vitals?.bloodPressure?.trim()) vitalParts.push(`TA: ${vitals.bloodPressure.trim()} mmHg`);
  if (vitals?.heartRate?.trim()) vitalParts.push(`FC: ${vitals.heartRate.trim()} lpm`);
  if (vitals?.respiratoryRate?.trim()) vitalParts.push(`FR: ${vitals.respiratoryRate.trim()} rpm`);
  if (vitals?.temperature?.trim()) vitalParts.push(`Temp: ${vitals.temperature.trim()} °C`);
  if (vitals?.weightKg?.trim()) vitalParts.push(`Peso: ${vitals.weightKg.trim()} kg`);
  if (vitals?.heightCm?.trim()) vitalParts.push(`Talla: ${vitals.heightCm.trim()} cm`);
  if (vitals?.bmi?.trim()) vitalParts.push(`IMC: ${vitals.bmi.trim()} kg/m²`);

  const vitalsText =
    vitalParts.length > 0
      ? vitalParts.join(" | ")
      : "[Pendiente de registro en pestaña Físico y Vitales]";

  const examParts: string[] = [];
  if (physicalExam?.skin?.trim()) examParts.push(`- Piel y mucosas: ${physicalExam.skin.trim()}`);
  if (physicalExam?.headNeck?.trim()) examParts.push(`- Cabeza y cuello: ${physicalExam.headNeck.trim()}`);
  if (physicalExam?.breasts?.trim()) examParts.push(`- Mamas: ${physicalExam.breasts.trim()}`);
  if (physicalExam?.abdomen?.trim()) examParts.push(`- Abdomen: ${physicalExam.abdomen.trim()}`);
  if (physicalExam?.gynecological?.trim()) examParts.push(`- Genitourinario/Ginecológico: ${physicalExam.gynecological.trim()}`);
  if (physicalExam?.extremities?.trim()) examParts.push(`- Extremidades: ${physicalExam.extremities.trim()}`);
  if (physicalExam?.neurological?.trim()) examParts.push(`- Neurológico: ${physicalExam.neurological.trim()}`);

  const examText =
    examParts.length > 0
      ? examParts.join("\n")
      : "- Exploración segmentaria sin hallazgos patológicos descritos.";

  const diagnosisText = diagnosis?.trim()
    ? diagnosis.trim()
    : "[Pendiente de definir en pestaña Diagnóstico]";

  const planText = plan?.trim()
    ? plan.trim()
    : "[Sin conducta clínica explícita registrada]";

  const indicationsText = indications?.trim() ? indications.trim() : "";

  if (targetMode === "soap") {
    const notes = [
      `MOTIVO DE CONSULTA / ANAMNESIS (S):`,
      cleanInput,
      ``,
      `ANTECEDENTES RELEVANTES:`,
      `• Alergias: ${allergySummary}`,
      `• Patologías Crónicas: ${chronicSummary}`,
      ``,
      `EXPLORACIÓN Y SIGNOS VITALES (O):`,
      `Signos Vitales: ${vitalsText}`,
      `Examen Físico:`,
      examText,
      ``,
      `JUICIO CLÍNICO / DIAGNÓSTICO (A):`,
      `${diagnosisText} (Tipo de atención: ${visitType} · ${specialty})`,
      ``,
      `PLAN DE TRATAMIENTO Y SEGUIMIENTO (P):`,
      planText,
    ].join("\n");

    return {
      notes,
      prescription: indicationsText,
    };
  }

  if (targetMode === "clear_instructions") {
    const notes = [
      `RESUMEN EXPLICATIVO PARA EL PACIENTE (${patientName}):`,
      `----------------------------------------------------`,
      `1. MOTIVO DE ATENCIÓN:`,
      cleanInput,
      ``,
      `2. CONDICIÓN CLÍNICA VALORADA:`,
      diagnosisText,
      ``,
      `3. SIGNOS VITALES REGISTRADOS:`,
      vitalsText,
      ``,
      `4. PLAN ACORDADO:`,
      planText,
      ``,
      `5. ALERGIAS VERIFICADAS:`,
      allergySummary,
      ``,
      `NOTA: Este resumen sintetiza los datos volcados en la historia. Se instruyó al paciente sobre signos de alarma y acudir a urgencias de ser necesario.`,
    ].join("\n");

    return {
      notes,
      prescription: indicationsText,
    };
  }

  const notes = [
    `SÍNTESIS DE CONTROL Y SEGUIMIENTO CLÍNICO:`,
    `==========================================`,
    `Paciente: ${patientName}`,
    `Especialidad: ${specialty} | Tipo: ${visitType}`,
    ``,
    `ESTADO DE INGRESO:`,
    cleanInput,
    ``,
    `PARÁMETROS BIOMÉTRICOS DEL ACTO:`,
    vitalsText,
    ``,
    `DIAGNÓSTICO EN CURSO:`,
    diagnosisText,
    ``,
    `ALERTAS DE SEGURIDAD DEL PACIENTE:`,
    `• Alergias registradas: ${allergySummary}`,
    `• Comorbilidades: ${chronicSummary}`,
    ``,
    `CONDUCTA Y PLAN VIGENTE:`,
    planText,
  ].join("\n");

  return {
    notes,
    prescription: indicationsText,
  };
}

function AiClinicalModal({
  open,
  onOpenChange,
  patientName,
  allergies,
  mode,
  isProcessing,
  generatedOutput,
  suggestedPrescription,
  hasPrescriptionCallback,
  onModeSelect,
  onRefresh,
  onApplyAll,
  onApplyNotesOnly,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  allergies?: string | null;
  mode: "soap" | "clear_instructions" | "differential";
  isProcessing: boolean;
  generatedOutput: string;
  suggestedPrescription: string;
  hasPrescriptionCallback: boolean;
  onModeSelect: (mode: "soap" | "clear_instructions" | "differential") => void;
  onRefresh: () => void;
  onApplyAll: () => void;
  onApplyNotesOnly: () => void;
}) {
  const hasActiveAllergies = Boolean(
    allergies &&
      allergies.trim() &&
      !allergies.toUpperCase().includes("NIEGA") &&
      !allergies.toUpperCase().includes("NO REFIERE")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-6 border-0 shadow-2xl glass-card">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Asistente de Redacción Clínica
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Consolida los datos reales ingresados en la consulta de {patientName} sin inventar signos vitales ni fármacos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {hasActiveAllergies && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Alergias registradas en historia: {allergies}</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => onModeSelect("soap")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
              mode === "soap"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
            }`}
          >
            📋 Formato SOAP
          </button>
          <button
            type="button"
            onClick={() => onModeSelect("clear_instructions")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
              mode === "clear_instructions"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
            }`}
          >
            📝 Resumen Paciente
          </button>
          <button
            type="button"
            onClick={() => onModeSelect("differential")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
              mode === "differential"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
            }`}
          >
            🔍 Síntesis de Control
          </button>
        </div>

        <div className="relative mt-2">
          {isProcessing ? (
            <div className="h-64 rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center gap-3 bg-muted/20">
              <RefreshCw className="h-6 w-6 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground font-semibold">
                Consolidando campos clínicos del formulario...
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="max-h-60 overflow-y-auto p-4 rounded-2xl bg-muted/30 border border-border/50 font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {generatedOutput}
              </div>

              {suggestedPrescription && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                    <Pill className="h-3.5 w-3.5" />
                    <span>Medidas Generales / Indicaciones Actuales:</span>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground whitespace-pre-wrap pl-5">
                    {suggestedPrescription}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row sm:justify-between items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isProcessing}
            className="rounded-xl text-xs font-semibold gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar con Formulario
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancelar
            </Button>
            {suggestedPrescription && hasPrescriptionCallback && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onApplyNotesOnly}
                disabled={isProcessing || !generatedOutput}
                className="rounded-xl text-xs font-bold"
              >
                Solo Notas
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={onApplyAll}
              disabled={isProcessing || !generatedOutput}
              className="rounded-xl bg-primary text-primary-foreground font-bold text-xs gap-1.5 px-4 shadow-sm"
            >
              <Check className="h-3.5 w-3.5" />
              Aplicar a la Consulta
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
