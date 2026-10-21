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

export function AiClinicalAssistant({
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
  onApplyNotes,
  onApplyPrescription,
}: AiClinicalAssistantProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"soap" | "clear_instructions" | "differential">("soap");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [suggestedPrescription, setSuggestedPrescription] = useState("");

  const hasActiveAllergies = Boolean(
    allergies &&
      allergies.trim() &&
      !allergies.toUpperCase().includes("NIEGA") &&
      !allergies.toUpperCase().includes("NO REFIERE")
  );

  const buildStructuredContent = (targetMode: "soap" | "clear_instructions" | "differential") => {
    const cleanInput =
      notesInput.trim() ||
      "[Sin motivo subjetivo redactado — ingrese los síntomas o motivo de consulta en el campo Examen Subjetivo]";

    const allergySummary = allergies?.trim()
      ? allergies.trim()
      : "No registradas en historia clínica (confirmar durante anamnesis)";
    const chronicSummary = chronicConditions?.trim()
      ? chronicConditions.trim()
      : "No reportadas en historia clínica";

    // Build real vitals summary from entered form values only
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

    // Build real physical exam summary from entered form values only
    const examParts: string[] = [];
    if (physicalExam?.skin?.trim()) examParts.push(`- Piel y mucosas: ${physicalExam.skin.trim()}`);
    if (physicalExam?.headNeck?.trim()) examParts.push(`- Cabeza y cuello: ${physicalExam.headNeck.trim()}`);
    if (physicalExam?.breasts?.trim()) examParts.push(`- Mamas: ${physicalExam.breasts.trim()}`);
    if (physicalExam?.abdomen?.trim()) examParts.push(`- Abdomen: ${physicalExam.abdomen.trim()}`);
    if (physicalExam?.gynecological?.trim()) examParts.push(`- Ginecológico: ${physicalExam.gynecological.trim()}`);
    if (physicalExam?.extremities?.trim()) examParts.push(`- Extremidades: ${physicalExam.extremities.trim()}`);
    if (physicalExam?.neurological?.trim()) examParts.push(`- Neurológico: ${physicalExam.neurological.trim()}`);

    const examText =
      examParts.length > 0
        ? examParts.join("\n")
        : "- Examen físico segmentario: [Pendiente de registro en pestaña Físico y Vitales]";

    const diagnosisText = diagnosis?.trim()
      ? diagnosis.trim()
      : `[Diagnóstico clínico por definir por el médico tratante — ${specialty}]`;

    const planText = plan?.trim()
      ? plan.trim()
      : `- Seguimiento clínico según evolución en consulta de ${specialty}.\n- Educación sobre signos de alarma.`;

    if (targetMode === "soap") {
      setGeneratedOutput(
`[ESTRUCTURA CLÍNICA SOAP — ${specialty.toUpperCase()}]

■ S (SUBJETIVO):
- Paciente: ${patientName} (${visitType})
- Motivo y evolución referida: "${cleanInput}"
- Alergias registradas: ${allergySummary}
- Antecedentes patológicos: ${chronicSummary}

■ O (OBJETIVO):
- Signos vitales: ${vitalsText}
${examText}

■ A (ANÁLISIS / IMPRESIÓN DIAGNÓSTICA):
${diagnosisText}

■ P (PLAN DE MANEJO):
${planText}`
      );

      if (indications?.trim()) {
        setSuggestedPrescription(indications.trim());
      } else {
        setSuggestedPrescription(
          `- Medidas generales de cuidado e hidratación adecuada.\n- Cumplir indicaciones específicas según criterio del médico tratante.${
            hasActiveAllergies ? `\n- PRECAUCIÓN: Verificar alergias registradas (${allergies?.trim()}) antes de indicar fármacos.` : ""
          }`
        );
      }
    } else if (targetMode === "clear_instructions") {
      setGeneratedOutput(
`[RESUMEN DE INDICACIONES PARA EL PACIENTE]

Estimada/o ${patientName}:
1. Motivo de atención registrado: ${notesInput.trim() ? `"${notesInput.trim()}"` : `Consulta de ${specialty}`}.
2. Impresión clínica: ${diagnosis?.trim() || "En evaluación por su médico tratante"}.
3. Plan e indicaciones:
${indications?.trim() || plan?.trim() || "- Siga las indicaciones verbales y escritas entregadas en su récipe médico."}
4. Acuda a consulta de urgencia si presenta fiebre persistente, dolor agudo o empeoramiento de los síntomas.`
      );
      setSuggestedPrescription("");
    } else {
      setGeneratedOutput(
`[SÍNTESIS CLÍNICA Y CORRELACIÓN DE DATOS]

- Paciente: ${patientName}
- Especialidad: ${specialty} (${visitType})
- Cuadro subjetivo analizado: "${cleanInput}"
- Signos vitales actuales: ${vitalsText}
- Alergias conocidas: ${allergySummary}
- Condiciones crónicas: ${chronicSummary}

Puntos de verificación sugeridos para el médico:
1. Correlacionar hallazgos subjetivos con examen físico segmentario registrado.
2. Confirmar si requiere estudios paraclínicos o de imagen complementarios.
3. Verificar contraindicaciones con alergias (${allergySummary}) antes de emitir récipe.`
      );
      setSuggestedPrescription("");
    }
  };

  const handleGenerate = (nextMode?: "soap" | "clear_instructions" | "differential") => {
    const activeMode = nextMode || mode;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      buildStructuredContent(activeMode);
      toast.success("Estructuración clínica generada con datos del formulario");
    }, 250);
  };

  const handleApplyNotesOnly = () => {
    if (generatedOutput) {
      onApplyNotes(generatedOutput);
      toast.success("Nota estructurada aplicada al examen subjetivo");
    }
    setOpen(false);
  };

  const handleApplyAll = () => {
    if (generatedOutput) {
      onApplyNotes(generatedOutput);
    }
    if (suggestedPrescription && onApplyPrescription) {
      onApplyPrescription(suggestedPrescription);
    }
    toast.success("Notas e indicaciones actualizadas con éxito");
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(true);
          handleGenerate(mode);
        }}
        className="rounded-xl border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold gap-1.5 shadow-sm"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
        Estructurar SOAP
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl p-6 border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wand2 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Asistente de Estructuración Clínica Medizen
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
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

          {/* Mode Selector */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setMode("soap");
                handleGenerate("soap");
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                mode === "soap"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
              }`}
            >
              📋 Formato SOAP
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("clear_instructions");
                handleGenerate("clear_instructions");
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                mode === "clear_instructions"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
              }`}
            >
              📝 Resumen Paciente
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("differential");
                handleGenerate("differential");
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                mode === "differential"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
              }`}
            >
              🔍 Síntesis de Control
            </button>
          </div>

          {/* Generated Content Box */}
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
              onClick={() => handleGenerate(mode)}
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
                onClick={() => setOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancelar
              </Button>
              {suggestedPrescription && onApplyPrescription && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyNotesOnly}
                  disabled={isProcessing || !generatedOutput}
                  className="rounded-xl text-xs font-bold"
                >
                  Solo Notas
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleApplyAll}
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
    </>
  );
}

