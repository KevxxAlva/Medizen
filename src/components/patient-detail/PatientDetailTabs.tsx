import React from "react";
import { User, MapPin, Briefcase } from "lucide-react";

export const calculateAge = (dob: string | Date | undefined | null) => {
  if (!dob) return "—";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

function PersonalDataCard({ viewing }: { viewing: any }) {
  const ageDisplay = viewing.birth_date ? `${calculateAge(viewing.birth_date)} años` : "—";
  return (
    <div className="bg-card/90 dark:bg-muted/15 border border-border/60 p-5 rounded-3xl space-y-4 shadow-sm hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2 pb-3 border-b border-border/40">
        <User className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Datos Personales</h3>
      </div>
      <div className="space-y-3.5 text-xs">
        <div>
          <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Nombre Completo</span>
          <span className="font-bold text-foreground text-sm">{viewing.full_name}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Cédula</span>
            <span className="font-bold text-foreground">{viewing.document_id || "—"}</span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Edad</span>
            <span className="font-bold text-foreground">{ageDisplay}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Sexo / Género</span>
            <span className="font-bold text-foreground">{viewing.gender || "No especificado"}</span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Grupo Sanguíneo</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">{viewing.blood_type || "No especificado"}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Fecha de Nacimiento</span>
            <span className="font-bold text-foreground">{viewing.birth_date || "—"}</span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Lugar de Nacimiento</span>
            <span className="font-bold text-foreground">{viewing.birthplace || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactDemographyCard({ viewing }: { viewing: any }) {
  return (
    <div className="bg-card/90 dark:bg-muted/15 border border-border/60 p-5 rounded-3xl space-y-4 shadow-sm hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2 pb-3 border-b border-border/40">
        <MapPin className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Contacto y Demografía</h3>
      </div>
      <div className="space-y-3.5 text-xs">
        <div>
          <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Teléfono Principal</span>
          <span className="font-bold text-foreground">{viewing.phone || "—"}</span>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Correo Electrónico</span>
          <span className="font-bold text-foreground truncate block">{viewing.email || "—"}</span>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Contacto de Emergencia</span>
          <span className="font-bold text-foreground">{viewing.emergency_contact || "No registrado"}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Estado Civil</span>
            <span className="font-bold text-foreground">{viewing.marital_status || "—"}</span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Instrucción</span>
            <span className="font-bold text-foreground">{viewing.education_level || "—"}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Ocupación</span>
            <span className="font-bold text-foreground">{viewing.occupation || "—"}</span>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Ciudad de Residencia</span>
            <span className="font-bold text-foreground">{viewing.address || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AfiliacionCard({ viewing }: { viewing: any }) {
  const hcCode = viewing.historia_number
    ? `HC-${String(viewing.historia_number).padStart(5, "0")}`
    : `HC-${String(viewing.id).padStart(5, "0")}`;
  const regDate = viewing.created_at
    ? new Date(viewing.created_at).toLocaleDateString("es-ES")
    : "—";

  return (
    <div className="bg-card/90 dark:bg-muted/15 border border-border/60 p-5 rounded-3xl space-y-4 shadow-sm hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-2 pb-3 border-b border-border/40">
        <Briefcase className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Afiliación y Registro</h3>
      </div>
      <div className="space-y-3.5 text-xs">
        <div>
          <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">N° Historia Clínica</span>
          <span className="font-bold text-primary font-mono text-sm">{hcCode}</span>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Fecha de Registro</span>
          <span className="font-bold text-foreground">{regDate}</span>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Estado del Expediente</span>
          <span className="font-bold capitalize text-foreground">{viewing.status || "Activo"}</span>
        </div>
      </div>
    </div>
  );
}

function ClinicalNotesSummary({ viewing }: { viewing: any }) {
  const hasNotes = viewing.consultation_reason || viewing.current_illness || viewing.notes;
  if (!hasNotes) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
      {viewing.consultation_reason && (
        <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-1.5">
            Motivo de Consulta Inicial
          </span>
          <p className="text-xs font-medium text-foreground whitespace-pre-wrap leading-relaxed">
            {viewing.consultation_reason}
          </p>
        </div>
      )}
      {viewing.current_illness && (
        <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-1.5">
            Enfermedad Actual
          </span>
          <p className="text-xs font-medium text-foreground whitespace-pre-wrap leading-relaxed">
            {viewing.current_illness}
          </p>
        </div>
      )}
      {viewing.notes && (
        <div className="col-span-1 md:col-span-2 bg-muted/40 border border-border/40 p-4 rounded-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
            Notas Administrativas
          </span>
          <p className="text-xs font-medium text-foreground whitespace-pre-wrap leading-relaxed">
            {viewing.notes}
          </p>
        </div>
      )}
    </div>
  );
}

export function PatientGeneralTab({ viewing }: { viewing: any }) {
  return (
    <div className="space-y-6 outline-none animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <PersonalDataCard viewing={viewing} />
        <ContactDemographyCard viewing={viewing} />
        <AfiliacionCard viewing={viewing} />
      </div>
      <ClinicalNotesSummary viewing={viewing} />
    </div>
  );
}

export function PatientAntecedentesTab({ viewing }: { viewing: any }) {
  return (
    <div className="space-y-6 outline-none">
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Antecedentes Familiares</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/20 border border-border/40 p-5 rounded-3xl">
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Madre</span>
            <span className="font-semibold text-foreground">{viewing.family_history?.mother || "Niega / Sano"}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Padre</span>
            <span className="font-semibold text-foreground">{viewing.family_history?.father || "Niega / Sano"}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Hermanos</span>
            <span className="font-semibold text-foreground">{viewing.family_history?.siblings || "Niega / Sano"}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Hijos</span>
            <span className="font-semibold text-foreground">{viewing.family_history?.children || "Niega / Sano"}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Antecedentes Personales Patológicos, Medicación y Hábitos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/20 border border-border/40 p-5 rounded-3xl">
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Tabaco</span>
            <span className="font-semibold text-foreground">{viewing.personal_history?.tobacco || "NIEGA"}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Alcohol</span>
            <span className="font-semibold text-foreground">{viewing.personal_history?.alcohol || "NIEGA"}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Drogas</span>
            <span className="font-semibold text-foreground">{viewing.personal_history?.drugs || "NIEGA"}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Patología de Base</span>
            <span className="font-semibold text-foreground">{viewing.personal_history?.base_pathology || "Niega"}</span>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-muted-foreground block mb-1">Quirúrgicos / Hospitalizaciones</span>
            <span className="font-semibold text-foreground">{viewing.personal_history?.surgical || "Niega"}</span>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-muted-foreground block mb-1">Alérgicos (Medicamentos / Alimentos)</span>
            <span className="font-semibold text-destructive">{viewing.personal_history?.allergies || "Niega"}</span>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-muted-foreground block mb-1">Medicación Habitual Activa</span>
            <span className="font-semibold text-foreground">{viewing.personal_history?.current_medications || "Niega"}</span>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-muted-foreground block mb-1">Transfusiones e Inmunizaciones</span>
            <span className="font-semibold text-foreground">{viewing.personal_history?.transfusions || "Niega"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PatientGinecologiaTab({ viewing }: { viewing: any }) {
  return (
    <div className="space-y-4 outline-none">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm bg-muted/20 border border-border/40 p-6 rounded-3xl">
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Menarquía (Edad primera menstruación)</span>
          <span className="font-semibold text-foreground">{viewing.gynecological_data?.menarche || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Sexarquía (Edad inicio relaciones sexuales)</span>
          <span className="font-semibold text-foreground">{viewing.gynecological_data?.sexarche || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Ciclo Menstrual</span>
          <span className="font-semibold text-foreground">{viewing.gynecological_data?.menstrual_cycle || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Dismenorrea (Menstruación dolorosa)</span>
          <span className="font-semibold text-foreground">{viewing.gynecological_data?.dysmenorrhea || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">NPS (Número parejas sexuales)</span>
          <span className="font-semibold text-foreground">{viewing.gynecological_data?.nps || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">ITS (Infecciones de Transmisión Sexual)</span>
          <span className="font-semibold text-foreground">{viewing.gynecological_data?.its || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Última Citología</span>
          <span className="font-semibold text-foreground">{viewing.gynecological_data?.cytology || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Anticonceptivos</span>
          <span className="font-semibold text-foreground">{viewing.gynecological_data?.contraceptives || "—"}</span>
        </div>
      </div>
    </div>
  );
}

export function PatientObstetriciaTab({ viewing }: { viewing: any }) {
  return (
    <div className="space-y-6 outline-none">
      <div className="grid grid-cols-4 gap-4 text-sm bg-muted/20 border border-border/40 p-6 rounded-3xl">
        <div className="text-center">
          <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Gestas</span>
          <span className="font-bold text-2xl text-mauve">{viewing.obstetric_data?.g ?? 0}</span>
        </div>
        <div className="text-center">
          <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Partos</span>
          <span className="font-bold text-2xl text-mauve">{viewing.obstetric_data?.p ?? 0}</span>
        </div>
        <div className="text-center">
          <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Cesáreas</span>
          <span className="font-bold text-2xl text-mauve">{viewing.obstetric_data?.c ?? 0}</span>
        </div>
        <div className="text-center">
          <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Abortos</span>
          <span className="font-bold text-2xl text-mauve">{viewing.obstetric_data?.a ?? 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm bg-muted/20 border border-border/40 p-6 rounded-3xl">
        <div>
          <span className="text-xs text-muted-foreground block mb-1">PIG (Período Intergenésico)</span>
          <span className="font-semibold text-foreground">{viewing.obstetric_data?.pig || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Embarazos Múltiples</span>
          <span className="font-semibold text-foreground">{viewing.obstetric_data?.em ?? "0"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Embarazos Ectópicos</span>
          <span className="font-semibold text-foreground">{viewing.obstetric_data?.ee ?? "0"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Complicaciones Obstétricas</span>
          <span className="font-semibold text-foreground">{viewing.obstetric_data?.complications || "Ninguna"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">FUM (Fecha Última Menstruación)</span>
          <span className="font-semibold text-foreground">{viewing.obstetric_data?.fum || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">EG (Edad Gestacional)</span>
          <span className="font-semibold text-foreground">{viewing.obstetric_data?.eg || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">FPP (Fecha Probable de Parto)</span>
          <span className="font-semibold text-mauve">{viewing.obstetric_data?.fpp || "—"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Número de Consultas Control</span>
          <span className="font-semibold text-foreground">{viewing.obstetric_data?.num_consultations || "—"}</span>
        </div>
        <div className="col-span-2">
          <span className="text-xs text-muted-foreground block mb-1">Vacunas</span>
          <span className="font-semibold text-foreground">{viewing.obstetric_data?.vaccines || "—"}</span>
        </div>
      </div>
    </div>
  );
}
