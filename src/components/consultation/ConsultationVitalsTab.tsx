import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ObstetricCalculatorCard } from "@/components/consultation/ObstetricCalculatorCard";
import { toast } from "sonner";

export interface ConsultationVitalsTabProps {
  heightCm: string;
  setHeightCm: (v: string) => void;
  weightKg: string;
  setWeightKg: (v: string) => void;
  bmiEval: any;
  bloodPressure: string;
  setBloodPressure: (v: string) => void;
  heartRate: string;
  setHeartRate: (v: string) => void;
  respiratoryRate: string;
  setRespiratoryRate: (v: string) => void;
  temperature: string;
  setTemperature: (v: string) => void;
  specialtyConfig: any;
  selectedSpecialty: string;
  patient: any;
  gestationalAgeRef: React.MutableRefObject<string>;
  handleSpecialtyAnswerChange: (fieldId: string, val: any) => void;
  skin: string;
  setSkin: (v: string) => void;
  headNeck: string;
  setHeadNeck: (v: string) => void;
  breasts: string;
  setBreasts: (v: string) => void;
  abdomen: string;
  setAbdomen: (v: string) => void;
  gynecological: string;
  setGynecological: (v: string) => void;
  extremities: string;
  setExtremities: (v: string) => void;
  neurological: string;
  setNeurological: (v: string) => void;
}

export function ConsultationVitalsTab({
  heightCm,
  setHeightCm,
  weightKg,
  setWeightKg,
  bmiEval,
  bloodPressure,
  setBloodPressure,
  heartRate,
  setHeartRate,
  respiratoryRate,
  setRespiratoryRate,
  temperature,
  setTemperature,
  specialtyConfig,
  selectedSpecialty,
  patient,
  gestationalAgeRef,
  handleSpecialtyAnswerChange,
  skin,
  setSkin,
  headNeck,
  setHeadNeck,
  breasts,
  setBreasts,
  abdomen,
  setAbdomen,
  gynecological,
  setGynecological,
  extremities,
  setExtremities,
  neurological,
  setNeurological,
}: ConsultationVitalsTabProps) {
  return (
    <TabsContent value="vitals" className="space-y-6 mt-0">
      <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
          Signos Vitales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="c-height">Estatura (cm)</Label>
            <Input
              id="c-height"
              type="number"
              placeholder="Ej. 165"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="rounded-2xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-weight">Peso (kg)</Label>
            <Input
              id="c-weight"
              type="number"
              step="0.1"
              placeholder="Ej. 62.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="rounded-2xl"
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label>IMC (Calculado)</Label>
              {bmiEval && (
                <span
                  className={cn(
                    "text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border uppercase tracking-wider",
                    bmiEval.bgClass,
                    bmiEval.colorClass,
                    bmiEval.borderClass,
                  )}
                >
                  {bmiEval.category}
                </span>
              )}
            </div>
            <Input
              readOnly
              value={bmiEval ? `${bmiEval.bmiFormatted} kg/m²` : ""}
              placeholder="Ingrese Peso y Talla"
              className={cn(
                "rounded-2xl font-bold transition-colors",
                bmiEval ? `${bmiEval.bgClass} ${bmiEval.colorClass}` : "bg-muted/50",
              )}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-bp">Presión Arterial (TA)</Label>
            <Input
              id="c-bp"
              placeholder="Ej. 120/80"
              value={bloodPressure}
              onChange={(e) => setBloodPressure(e.target.value)}
              className="rounded-2xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-hr">Frecuencia Cardíaca (FC)</Label>
            <Input
              id="c-hr"
              type="number"
              placeholder="LPM"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              className="rounded-2xl"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-rr">Frecuencia Respiratoria (FR)</Label>
            <Input
              id="c-rr"
              type="number"
              placeholder="RPM"
              value={respiratoryRate}
              onChange={(e) => setRespiratoryRate(e.target.value)}
              className="rounded-2xl"
            />
          </div>
          <div className="grid gap-1.5 col-span-2">
            <Label htmlFor="c-temp">Temperatura (°C)</Label>
            <Input
              id="c-temp"
              type="number"
              step="0.1"
              placeholder="Ej. 36.5"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="rounded-2xl"
            />
          </div>
        </div>
      </div>

      {/* Integrated Intelligent Obstetric Calculator */}
      {(specialtyConfig.key === "gynecology" ||
        selectedSpecialty.includes("Ginecología") ||
        selectedSpecialty.includes("Obstetricia")) && (
        <ObstetricCalculatorCard
          initialFum={patient?.obstetric_data?.fum || ""}
          onApplyDates={({ eg }) => {
            gestationalAgeRef.current = eg;
            handleSpecialtyAnswerChange("gestational_age", eg);
            toast.success(`Cálculo obstétrico aplicado: ${eg}`);
          }}
        />
      )}

      <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
            Revisión por Sistemas / Examen Físico
          </h3>
          <span className="text-[11px] text-muted-foreground font-semibold">
            {specialtyConfig.key === "gynecology"
              ? "Enfoque Gineco-Obstétrico"
              : `Adaptado a ${specialtyConfig.name}`}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="c-skin">Piel y faneras</Label>
            <Input
              id="c-skin"
              value={skin}
              onChange={(e) => setSkin(e.target.value)}
              placeholder="Normal, hidratada, turgor conservado..."
              className="rounded-2xl text-xs h-9"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-headneck">Cabeza y cuello</Label>
            <Input
              id="c-headneck"
              value={headNeck}
              onChange={(e) => setHeadNeck(e.target.value)}
              placeholder="Normocéfalo, sin adenopatías..."
              className="rounded-2xl text-xs h-9"
            />
          </div>
          {specialtyConfig.key === "gynecology" && (
            <div className="grid gap-1.5">
              <Label htmlFor="c-breasts">Mamas</Label>
              <Input
                id="c-breasts"
                value={breasts}
                onChange={(e) => setBreasts(e.target.value)}
                placeholder="Simétricas, sin nódulos palpables..."
                className="rounded-2xl text-xs h-9"
              />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="c-abdomen">Abdomen</Label>
            <Input
              id="c-abdomen"
              value={abdomen}
              onChange={(e) => setAbdomen(e.target.value)}
              placeholder="Blando, depresible, no doloroso..."
              className="rounded-2xl text-xs h-9"
            />
          </div>
          {specialtyConfig.key === "gynecology" && (
            <div className="grid gap-1.5 col-span-2">
              <Label htmlFor="c-gyneco">Ginecológico</Label>
              <Input
                id="c-gyneco"
                value={gynecological}
                onChange={(e) => setGynecological(e.target.value)}
                placeholder="Genitales externos normales, vagina elástica, cuello sano..."
                className="rounded-2xl text-xs h-9"
              />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="c-extremities">Extremidades y Aparato Locomotor</Label>
            <Input
              id="c-extremities"
              value={extremities}
              onChange={(e) => setExtremities(e.target.value)}
              placeholder="Simétricas, arcos conservados, sin edemas..."
              className="rounded-2xl text-xs h-9"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-neuro">Neurológico</Label>
            <Input
              id="c-neuro"
              value={neurological}
              onChange={(e) => setNeurological(e.target.value)}
              placeholder="Lúcida, orientada en 3 esferas..."
              className="rounded-2xl text-xs h-9"
            />
          </div>
        </div>
      </div>
    </TabsContent>
  );
}
