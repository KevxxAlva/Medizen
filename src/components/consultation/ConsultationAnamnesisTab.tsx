import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { AiClinicalAssistant } from "@/components/consultation/AiClinicalAssistant";
import { VoiceDictationButton } from "@/components/VoiceDictationButton";

export type VisitType = "CONTROL" | "EMERGENCIA" | "CONSULTA_NUEVA" | "POST_TRATAMIENTO" | "OTRO";

export interface ConsultationAnamnesisTabProps {
  visitType: VisitType;
  setVisitType: (v: VisitType) => void;
  contactChannel: string;
  setContactChannel: (v: string) => void;
  isFirstVisit: boolean;
  setIsFirstVisit: (v: boolean) => void;
  subjectiveExam: string;
  setSubjectiveExam: React.Dispatch<React.SetStateAction<string>>;
  contactChannels: string[];
  patient: any;
  appointment: any;
  selectedSpecialty: string;
  vitals: {
    heightCm: string;
    weightKg: string;
    bmi: string;
    bloodPressure: string;
    heartRate: string;
    respiratoryRate: string;
    temperature: string;
  };
  physicalExam: {
    skin: string;
    headNeck: string;
    breasts: string;
    abdomen: string;
    gynecological: string;
    extremities: string;
    neurological: string;
  };
  diagnosis: string;
  plan: string;
  indications: string;
  setIndications: React.Dispatch<React.SetStateAction<string>>;
}

export function ConsultationAnamnesisTab({
  visitType,
  setVisitType,
  contactChannel,
  setContactChannel,
  isFirstVisit,
  setIsFirstVisit,
  subjectiveExam,
  setSubjectiveExam,
  contactChannels,
  patient,
  appointment,
  selectedSpecialty,
  vitals,
  physicalExam,
  diagnosis,
  plan,
  indications,
  setIndications,
}: ConsultationAnamnesisTabProps) {
  return (
    <TabsContent value="anamnesis" className="grid gap-4 mt-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="c-visit-type">Tipo de asistencia</Label>
          <Select value={visitType} onValueChange={(v: VisitType) => setVisitType(v)}>
            <SelectTrigger className="rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="CONTROL">Control</SelectItem>
              <SelectItem value="EMERGENCIA">Emergencia</SelectItem>
              <SelectItem value="CONSULTA_NUEVA">Consulta Nueva</SelectItem>
              <SelectItem value="POST_TRATAMIENTO">Post-Tratamiento</SelectItem>
              <SelectItem value="OTRO">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="c-channel">Canal de contacto</Label>
          <Select value={contactChannel} onValueChange={setContactChannel}>
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder="Seleccionar canal…" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {contactChannels.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 mt-8">
          <Checkbox
            id="c-first-visit"
            checked={isFirstVisit}
            onCheckedChange={(c) => setIsFirstVisit(!!c)}
            className="rounded-md"
          />
          <Label htmlFor="c-first-visit" className="cursor-pointer">
            ¿Es primera visita de la paciente?
          </Label>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="c-subjective">Examen Subjetivo / Motivo del control</Label>
          <div className="flex items-center gap-1.5">
            <AiClinicalAssistant
              patientName={patient?.full_name || appointment?.patient_name}
              allergies={patient?.personal_history?.allergies}
              chronicConditions={patient?.personal_history?.chronic_conditions}
              specialty={selectedSpecialty}
              visitType={visitType}
              vitals={vitals}
              physicalExam={physicalExam}
              diagnosis={diagnosis}
              plan={plan}
              indications={indications}
              notesInput={subjectiveExam}
              onApplyNotes={(formatted) => setSubjectiveExam(formatted)}
              onApplyPrescription={(prescription) =>
                setIndications((prev) => (prev ? prev + "\n" + prescription : prescription))
              }
            />
            <VoiceDictationButton
              size="sm"
              onTranscript={(spoken) =>
                setSubjectiveExam((prev) => (prev ? prev + " " + spoken : spoken))
              }
            />
          </div>
        </div>
        <Textarea
          id="c-subjective"
          value={subjectiveExam}
          onChange={(e) => setSubjectiveExam(e.target.value)}
          placeholder="Descripción subjetiva y antecedentes inmediatos expresados por la paciente…"
          className="rounded-2xl min-h-[140px]"
        />
      </div>
    </TabsContent>
  );
}
