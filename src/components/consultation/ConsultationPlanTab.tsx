import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { VoiceDictationButton } from "@/components/VoiceDictationButton";
import { ShieldAlert } from "lucide-react";

export interface ConsultationPlanTabProps {
  diagnosis: string;
  setDiagnosis: React.Dispatch<React.SetStateAction<string>>;
  indications: string;
  setIndications: React.Dispatch<React.SetStateAction<string>>;
  complementaryExams: string;
  setComplementaryExams: React.Dispatch<React.SetStateAction<string>>;
  plan: string;
  setPlan: React.Dispatch<React.SetStateAction<string>>;
  nextAppointmentDate: string;
  setNextAppointmentDate: (v: string) => void;
  applyPrescriptionTemplate: (id: string) => void;
  currentSpecialtyPrescriptions: Array<{ id: string; name: string; indications: string }>;
}

export function ConsultationPlanTab({
  diagnosis,
  setDiagnosis,
  indications,
  setIndications,
  complementaryExams,
  setComplementaryExams,
  plan,
  setPlan,
  nextAppointmentDate,
  setNextAppointmentDate,
  applyPrescriptionTemplate,
  currentSpecialtyPrescriptions,
}: ConsultationPlanTabProps) {
  return (
    <TabsContent value="plan" className="grid gap-4 mt-0">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="c-diagnosis">Diagnóstico</Label>
          <VoiceDictationButton
            size="sm"
            onTranscript={(spoken) =>
              setDiagnosis((prev) => (prev ? prev + " " + spoken : spoken))
            }
          />
        </div>
        <Textarea
          id="c-diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Diagnóstico clínico presuntivo o definitivo…"
          required
          className="rounded-2xl min-h-[90px]"
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="c-indications">Indicaciones / Receta</Label>
            <VoiceDictationButton
              size="sm"
              onTranscript={(spoken) =>
                setIndications((prev) => (prev ? prev + " " + spoken : spoken))
              }
            />
          </div>
          <Select onValueChange={applyPrescriptionTemplate}>
            <SelectTrigger className="w-[200px] h-7 text-xs rounded-xl bg-muted/50 border-0 font-medium">
              <SelectValue placeholder="Recetas rápidas…" />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-[300px]">
              {currentSpecialtyPrescriptions.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          id="c-indications"
          value={indications}
          onChange={(e) => setIndications(e.target.value)}
          placeholder="Tratamientos médicos recetados, dosis, administración…"
          className="rounded-2xl min-h-[90px]"
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="c-exams">Exámenes Complementarios Solicitados</Label>
          <VoiceDictationButton
            size="sm"
            onTranscript={(spoken) =>
              setComplementaryExams((prev) => (prev ? prev + " " + spoken : spoken))
            }
          />
        </div>
        <Textarea
          id="c-exams"
          value={complementaryExams}
          onChange={(e) => setComplementaryExams(e.target.value)}
          placeholder="Ecografías, perfil de laboratorios, citología…"
          className="rounded-2xl min-h-[90px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="c-plan">Plan y Seguimiento</Label>
            <VoiceDictationButton
              size="sm"
              onTranscript={(spoken) =>
                setPlan((prev) => (prev ? prev + " " + spoken : spoken))
              }
            />
          </div>
          <Textarea
            id="c-plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="Recomendaciones generales, pautas de alarma…"
            className="rounded-2xl min-h-[90px]"
          />
        </div>
        <div className="grid gap-2 justify-between">
          <div className="grid gap-2 w-full">
            <Label htmlFor="c-next-date">Fecha sugerida próxima cita</Label>
            <Input
              id="c-next-date"
              type="date"
              value={nextAppointmentDate}
              onChange={(e) => setNextAppointmentDate(e.target.value)}
              className="rounded-2xl"
            />
          </div>
          <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/50 text-[11px]">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Al guardar, la cita se marcará automáticamente como completada.</span>
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
