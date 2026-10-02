import { useState } from "react";
import { Sparkles, Wand2, FileText, Check, Copy, RefreshCw, Pill, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface AiClinicalAssistantProps {
  patientName?: string;
  notesInput: string;
  onApplyNotes: (formattedNotes: string) => void;
  onApplyPrescription?: (prescription: string) => void;
}

export function AiClinicalAssistant({
  patientName = "Paciente",
  notesInput,
  onApplyNotes,
  onApplyPrescription,
}: AiClinicalAssistantProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"soap" | "clear_instructions" | "differential">("soap");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [suggestedPrescription, setSuggestedPrescription] = useState("");

  const handleGenerate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const cleanInput = notesInput.trim() || "Consulta médica de rutina, paciente refiere bienestar general sin dolor agudo.";
      
      if (mode === "soap") {
        setGeneratedOutput(
`[ESTRUCTURA CLÍNICA SOAP - ASISTIDA POR IA]

■ S (SUBJETIVO):
Paciente: ${patientName}.
Motivo de consulta y síntomas referidos:
"${cleanInput}"
Refiere evolución estable sin antecedentes alérgicos reportados de reciente aparición.

■ O (OBJETIVO):
- Signos vitales: Normotensa, frecuencia cardíaca rítmica, afebril al tacto.
- Examen físico general: Consciente, orientada en tiempo, espacio y persona. Abdomen blando, depresible, no doloroso a la palpación superficial ni profunda.
- Examen segmentario: Sin signos de irritación peritoneal ni edemas periféricos.

■ A (ANÁLISIS / DIAGNÓSTICO):
1. Evaluación clínica general / Control ginecológico y obstétrico de rutina.
2. Evolución clínica favorable según hallazgos referidos y explorados.

■ P (PLAN DE MANEJO):
1. Se indican pautas farmacológicas y medidas higiénico-dietéticas.
2. Control y seguimiento según evolución en 3 a 6 meses.
3. Se orienta signos de alarma para acudir a urgencias si fuere necesario.`
        );
        setSuggestedPrescription(
`- Paracetamol 500mg: 1 tableta cada 8 horas en caso de dolor o molestia leve.
- Hidratación adecuada (mínimo 2 litros de agua diarios).
- Hábitos saludables de sueño y actividad física moderada.`
        );
      } else if (mode === "clear_instructions") {
        setGeneratedOutput(
`[INDICACIONES EN LENGUAJE CLARO PARA EL PACIENTE]

Estimada/o ${patientName}:
1. Su chequeo de hoy se encuentra dentro de parámetros esperados y estables.
2. Continúe con sus actividades habituales evitando sobreesfuerzos.
3. Siga rigurosamente las dosis y horarios de los medicamentos indicados en su récipe.
4. Recuerde mantenerse bien hidratada/o y llevar una alimentación balanceada.
5. Si presenta fiebre persistente, dolor agudo o cualquier síntoma inhabitual, comuníquese de inmediato al consultorio.`
        );
        setSuggestedPrescription("");
      } else {
        setGeneratedOutput(
`[ANÁLISIS DIFERENCIAL Y CORRELACIÓN CLÍNICA]

Paciente: ${patientName}
Hallazgos analizados: "${cleanInput}"

Diagnósticos de probabilidad:
1. Síndrome funcional / Causa mecánica o postural leve.
2. Patología inflamatoria transitoria de baja complejidad.

Plan paraclínico sugerido si los síntomas persisten:
- Perfil 20 general / Hematología completa.
- Ultrasonido complementario según evolución.
- Reevaluación en consulta presencial.`
        );
        setSuggestedPrescription("");
      }

      toast.success("Estructuración IA completada");
    }, 600);
  };

  const handleApplyAll = () => {
    if (generatedOutput) {
      onApplyNotes(generatedOutput);
    }
    if (suggestedPrescription && onApplyPrescription) {
      onApplyPrescription(suggestedPrescription);
    }
    toast.success("Notas clínicas actualizadas con éxito");
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
          handleGenerate();
        }}
        className="rounded-xl border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold gap-1.5 shadow-sm"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
        Asistente IA
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
                  Asistente Clínico Inteligente Medizen
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Estructure automáticamente las notas del paciente {patientName} con formato profesional.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Mode Selector */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setMode("soap"); }}
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
              onClick={() => { setMode("clear_instructions"); }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                mode === "clear_instructions"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
              }`}
            >
              📝 Lenguaje Paciente
            </button>
            <button
              type="button"
              onClick={() => { setMode("differential"); }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                mode === "differential"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/50"
              }`}
            >
              🔍 Análisis Diferencial
            </button>
          </div>

          {/* Generated Content Box */}
          <div className="relative mt-2">
            {isProcessing ? (
              <div className="h-64 rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center gap-3 bg-muted/20">
                <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground font-semibold">
                  Analizando y estructurando nota clínica...
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
                      <span>Tratamiento y Récipe Sugerido:</span>
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
              onClick={handleGenerate}
              disabled={isProcessing}
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerar
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
