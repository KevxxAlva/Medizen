import React from "react";
import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface DoctorSignatureProps {
  prefix: string;
  doctorName: string;
  setDoctorName: (val: string) => void;
  doctorUni: string;
  setDoctorUni: (val: string) => void;
  doctorMpps: string;
  setDoctorMpps: (val: string) => void;
  doctorCmc: string;
  setDoctorCmc: (val: string) => void;
}

function DoctorSignatureFields({
  prefix,
  doctorName,
  setDoctorName,
  doctorUni,
  setDoctorUni,
  doctorMpps,
  setDoctorMpps,
  doctorCmc,
  setDoctorCmc,
}: DoctorSignatureProps) {
  return (
    <div className="border-t border-border/60 pt-3 mt-1 space-y-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Datos de Firma del Médico
      </p>
      <div className="grid gap-1">
        <Label htmlFor={`${prefix}-name`}>Nombre del Médico</Label>
        <Input
          id={`${prefix}-name`}
          placeholder="Ej. Dra. Nombre Apellido"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          className="rounded-xl text-xs h-9"
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`${prefix}-uni`}>Universidad / Título Adicional</Label>
        <Input
          id={`${prefix}-uni`}
          placeholder="Ej. UC-CHET"
          value={doctorUni}
          onChange={(e) => setDoctorUni(e.target.value)}
          className="rounded-xl text-xs h-9"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label htmlFor={`${prefix}-mpps`}>Registro MPPS</Label>
          <Input
            id={`${prefix}-mpps`}
            placeholder="Ej. 102.927"
            value={doctorMpps}
            onChange={(e) => setDoctorMpps(e.target.value)}
            className="rounded-xl text-xs h-9"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`${prefix}-cmc`}>Registro CMC</Label>
          <Input
            id={`${prefix}-cmc`}
            placeholder="Ej. 11.619"
            value={doctorCmc}
            onChange={(e) => setDoctorCmc(e.target.value)}
            className="rounded-xl text-xs h-9"
          />
        </div>
      </div>
    </div>
  );
}

function ReposoDialog({
  viewing,
  openReposo,
  setOpenReposo,
  reposoDays,
  setReposoDays,
  reposoStart,
  setReposoStart,
  reposoReason,
  setReposoReason,
  onExportReposo,
  doctorProps,
}: {
  viewing: any;
  openReposo: boolean;
  setOpenReposo: (open: boolean) => void;
  reposoDays: string;
  setReposoDays: (val: string) => void;
  reposoStart: string;
  setReposoStart: (val: string) => void;
  reposoReason: string;
  setReposoReason: (val: string) => void;
  onExportReposo: (patient: any) => void;
  doctorProps: DoctorSignatureProps;
}) {
  return (
    <Dialog open={openReposo} onOpenChange={setOpenReposo}>
      <DialogContent className="rounded-3xl sm:max-w-md bg-card p-6 border border-muted/50 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <Printer className="h-5 w-5 text-mauve" /> Constancia de Reposo
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2 text-sm">
          <div className="grid gap-1">
            <Label htmlFor="rp-days">Días de reposo</Label>
            <Input
              id="rp-days"
              type="number"
              min="1"
              max="90"
              value={reposoDays}
              onChange={(e) => setReposoDays(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="rp-start">Fecha de inicio</Label>
            <Input
              id="rp-start"
              type="date"
              value={reposoStart}
              onChange={(e) => setReposoStart(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="rp-reason">Diagnóstico / Motivo de reposo</Label>
            <Textarea
              id="rp-reason"
              value={reposoReason}
              onChange={(e) => setReposoReason(e.target.value)}
              placeholder="Escribe el diagnóstico médico o motivo..."
              className="rounded-xl min-h-[70px]"
            />
          </div>
          <DoctorSignatureFields {...doctorProps} prefix="rp-doc" />
        </div>
        <div className="flex justify-end gap-2 border-t border-border/60 pt-3 mt-2">
          <Button variant="ghost" onClick={() => setOpenReposo(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={() => viewing && onExportReposo(viewing)}
            className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30"
          >
            Generar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AtencionDialog({
  viewing,
  openAtencion,
  setOpenAtencion,
  atencionDate,
  setAtencionDate,
  atencionTime,
  setAtencionTime,
  atencionReason,
  setAtencionReason,
  onExportAtencion,
  doctorProps,
}: {
  viewing: any;
  openAtencion: boolean;
  setOpenAtencion: (open: boolean) => void;
  atencionDate: string;
  setAtencionDate: (val: string) => void;
  atencionTime: string;
  setAtencionTime: (val: string) => void;
  atencionReason: string;
  setAtencionReason: (val: string) => void;
  onExportAtencion: (patient: any) => void;
  doctorProps: DoctorSignatureProps;
}) {
  return (
    <Dialog open={openAtencion} onOpenChange={setOpenAtencion}>
      <DialogContent className="rounded-3xl sm:max-w-md bg-card p-6 border border-muted/50 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <Printer className="h-5 w-5 text-mauve" /> Constancia de Atención
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2 text-sm">
          <div className="grid gap-1">
            <Label htmlFor="at-date">Fecha de consulta</Label>
            <Input
              id="at-date"
              type="date"
              value={atencionDate}
              onChange={(e) => setAtencionDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="at-time">Hora de consulta</Label>
            <Input
              id="at-time"
              type="time"
              value={atencionTime}
              onChange={(e) => setAtencionTime(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="at-reason">Concepto de la consulta</Label>
            <Textarea
              id="at-reason"
              value={atencionReason}
              onChange={(e) => setAtencionReason(e.target.value)}
              placeholder="Escribe el concepto..."
              className="rounded-xl min-h-[70px]"
            />
          </div>
          <DoctorSignatureFields {...doctorProps} prefix="at-doc" />
        </div>
        <div className="flex justify-end gap-2 border-t border-border/60 pt-3 mt-2">
          <Button variant="ghost" onClick={() => setOpenAtencion(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={() => viewing && onExportAtencion(viewing)}
            className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30"
          >
            Generar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function JustificativoDialog({
  viewing,
  openJustificativo,
  setOpenJustificativo,
  justificativoDate,
  setJustificativoDate,
  justificativoReason,
  setJustificativoReason,
  onExportJustificativo,
  doctorProps,
}: {
  viewing: any;
  openJustificativo: boolean;
  setOpenJustificativo: (open: boolean) => void;
  justificativoDate: string;
  setJustificativoDate: (val: string) => void;
  justificativoReason: string;
  setJustificativoReason: (val: string) => void;
  onExportJustificativo: (patient: any) => void;
  doctorProps: DoctorSignatureProps;
}) {
  return (
    <Dialog open={openJustificativo} onOpenChange={setOpenJustificativo}>
      <DialogContent className="rounded-3xl sm:max-w-md bg-card p-6 border border-muted/50 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <Printer className="h-5 w-5 text-mauve" /> Justificativo Médico
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2 text-sm">
          <div className="grid gap-1">
            <Label htmlFor="jf-date">Fecha</Label>
            <Input
              id="jf-date"
              type="date"
              value={justificativoDate}
              onChange={(e) => setJustificativoDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="jf-reason">Motivo / Justificación</Label>
            <Textarea
              id="jf-reason"
              value={justificativoReason}
              onChange={(e) => setJustificativoReason(e.target.value)}
              placeholder="Escribe la justificación médica..."
              className="rounded-xl min-h-[70px]"
            />
          </div>
          <DoctorSignatureFields {...doctorProps} prefix="jf-doc" />
        </div>
        <div className="flex justify-end gap-2 border-t border-border/60 pt-3 mt-2">
          <Button
            variant="ghost"
            onClick={() => setOpenJustificativo(false)}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => viewing && onExportJustificativo(viewing)}
            className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30"
          >
            Generar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export interface PatientMedicalReportDialogsProps {
  viewing: any;
  openReposo: boolean;
  setOpenReposo: (val: boolean) => void;
  reposoDays: string;
  setReposoDays: (val: string) => void;
  reposoStart: string;
  setReposoStart: (val: string) => void;
  reposoReason: string;
  setReposoReason: (val: string) => void;
  onExportReposo: (patient: any) => void;

  openAtencion: boolean;
  setOpenAtencion: (val: boolean) => void;
  atencionDate: string;
  setAtencionDate: (val: string) => void;
  atencionTime: string;
  setAtencionTime: (val: string) => void;
  atencionReason: string;
  setAtencionReason: (val: string) => void;
  onExportAtencion: (patient: any) => void;

  openJustificativo: boolean;
  setOpenJustificativo: (val: boolean) => void;
  justificativoDate: string;
  setJustificativoDate: (val: string) => void;
  justificativoReason: string;
  setJustificativoReason: (val: string) => void;
  onExportJustificativo: (patient: any) => void;

  openLaboratorio?: boolean;
  setOpenLaboratorio?: (val: boolean) => void;
  onExportLaboratorio?: (data: {
    profileTitle: string;
    examsList: string;
    clinicalIndication: string;
  }) => void;

  openEcografia?: boolean;
  setOpenEcografia?: (val: boolean) => void;
  onExportEcografia?: (data: {
    ecoType: string;
    gestationalAge: string;
    fhr: string;
    efw: string;
    placenta: string;
    findings: string;
    conclusion: string;
  }) => void;

  doctorName: string;
  setDoctorName: (val: string) => void;
  doctorUni: string;
  setDoctorUni: (val: string) => void;
  doctorMpps: string;
  setDoctorMpps: (val: string) => void;
  doctorCmc: string;
  setDoctorCmc: (val: string) => void;
}

const LAB_PROFILES: Array<{ title: string; exams: string; indication: string }> = [
  {
    title: "Perfil Prenatal Completo",
    exams: [
      "Hematología Completa + Plaquetas",
      "Tipiaje Sanguíneo ABO y Factor Rh",
      "Glicemia Basal en Ayunas",
      "Urea y Creatinina",
      "VDRL y HIV (1 y 2)",
      "Antígeno de Superficie Hepatitis B (HBsAg) y Toxoplasmosis (IgG / IgM)",
      "Examen Simple de Orina (Uroanálisis) y Urocultivo",
    ].join("\n"),
    indication: "Acudir en ayunas de 8 a 12 horas con primera muestra de orina matutina.",
  },
  {
    title: "Perfil 20 / Preoperatorio",
    exams: [
      "Hematología Completa y Plaquetas",
      "PT, PTT y Fibrinógeno (Tiempos de Coagulación)",
      "Glicemia, Urea, Creatinina y Ácido Úrico",
      "Colesterol Total, HDL, LDL y Triglicéridos",
      "Transaminasas (TGO / TGP) y Bilirrubina Total y Fraccionada",
      "Proteínas Totales y Fraccionadas",
      "VDRL y HIV",
      "Uroanálisis Completo",
    ].join("\n"),
    indication: "Ayuno estricto de 12 horas previo a la toma de muestra.",
  },
  {
    title: "Perfil Ginecológico y Hormonal",
    exams: [
      "FSH, LH, Estradiol y Progesterona",
      "Prolactina Basal",
      "Perfil Tiroideo: TSH, T3 Libre y T4 Libre",
      "Insulina Basal y Post-Prandial (Curva HOMA)",
      "CA-125 (Marcador Tumoral Ovárico)",
    ].join("\n"),
    indication: "Realizar preferiblemente entre el día 2 y 5 del ciclo menstrual en ayunas.",
  },
  {
    title: "Pesquisa Infecciosa / Flujo Vaginal",
    exams: [
      "Examen en Fresco y Gram de Secreción Vaginal",
      "Cultivo de Secreción Vaginal y Antibiograma",
      "Citología Cervicovaginal (Papanicolaou)",
      "Uroanálisis y Urocultivo",
    ].join("\n"),
    indication: "Sin duchas ni óvulos vaginales durante las 48 horas previas.",
  },
];

function LaboratorioDialog({
  open,
  onOpenChange,
  onExport,
  doctorProps,
}: {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onExport?: (data: {
    profileTitle: string;
    examsList: string;
    clinicalIndication: string;
  }) => void;
  doctorProps: DoctorSignatureProps;
}) {
  const [profileTitle, setProfileTitle] = React.useState(LAB_PROFILES[0].title);
  const [examsList, setExamsList] = React.useState(LAB_PROFILES[0].exams);
  const [clinicalIndication, setClinicalIndication] = React.useState(LAB_PROFILES[0].indication);

  const handleApplyPreset = (preset: (typeof LAB_PROFILES)[0]) => {
    setProfileTitle(preset.title);
    setExamsList(preset.exams);
    setClinicalIndication(preset.indication);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:rounded-3xl sm:max-w-lg bg-card p-4 sm:p-6 border border-muted/50 shadow-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-base sm:text-lg">
            <Printer className="h-5 w-5 text-primary shrink-0" /> Orden de Exámenes de Laboratorio
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2 text-sm">
          <div>
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Perfiles Rápidos en 1 Clic
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5">
              {LAB_PROFILES.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`text-left px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    profileTitle === p.title
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="lab-title">Título del Perfil / Solicitud</Label>
            <Input
              id="lab-title"
              value={profileTitle}
              onChange={(e) => setProfileTitle(e.target.value)}
              className="rounded-xl text-xs h-9"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="lab-exams">Exámenes Solicitados (uno por línea)</Label>
            <Textarea
              id="lab-exams"
              rows={5}
              value={examsList}
              onChange={(e) => setExamsList(e.target.value)}
              className="rounded-xl text-xs"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="lab-indication">Indicación / Preparación del Paciente</Label>
            <Input
              id="lab-indication"
              value={clinicalIndication}
              onChange={(e) => setClinicalIndication(e.target.value)}
              className="rounded-xl text-xs h-9"
            />
          </div>

          <DoctorSignatureFields {...doctorProps} prefix="lab" />
        </div>
        <div className="flex justify-end gap-2 border-t border-border/60 pt-3 mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onExport?.({
                profileTitle,
                examsList,
                clinicalIndication,
              })
            }
            className="rounded-xl bg-primary text-primary-foreground shadow-sm"
          >
            Generar Orden PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const ECO_TEMPLATES = [
  {
    type: "Ecografía Obstétrica / Biometría Fetal",
    findings:
      "Feto único vivo en situación longitudinal, presentación cefálica, dorso anterior. Movimientos cardíacos y fetales activos y presentes. Biometría fetal acorde a edad gestacional. Placenta corporal anterior normoinserta Grado I/II de madurez. Líquido amniótico en volumen normal (ILA normal).",
    conclusion: "Embarazo simple intrauterino evolutivo acorde a edad gestacional. Bienestar fetal conservado.",
  },
  {
    type: "Ecografía Pélvica / Transvaginal",
    findings:
      "Útero en anteversoflexión (AVF), de dimensiones normales, bordes regulares y miometrio homogéneo sin lesiones focales. Línea endometrial central, ecogénica y regular acorde a fase del ciclo. Ovario derecho e izquierdo de forma, volumen y ecoestructura conservada. Fondo de saco de Douglas libre de líquido.",
    conclusion: "Ecografía ginecológica pélvica / transvaginal dentro de límites normales.",
  },
];

function EcografiaDialog({
  open,
  onOpenChange,
  onExport,
  doctorProps,
}: {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onExport?: (data: {
    ecoType: string;
    gestationalAge: string;
    fhr: string;
    efw: string;
    placenta: string;
    findings: string;
    conclusion: string;
  }) => void;
  doctorProps: DoctorSignatureProps;
}) {
  const [ecoType, setEcoType] = React.useState(ECO_TEMPLATES[0].type);
  const [gestationalAge, setGestationalAge] = React.useState("24 sem + 2 días");
  const [fhr, setFhr] = React.useState("144");
  const [efw, setEfw] = React.useState("680");
  const [placenta, setPlacenta] = React.useState("Anterior G-I / ILA Normal");
  const [findings, setFindings] = React.useState(ECO_TEMPLATES[0].findings);
  const [conclusion, setConclusion] = React.useState(ECO_TEMPLATES[0].conclusion);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:rounded-3xl sm:max-w-lg bg-card p-4 sm:p-6 border border-muted/50 shadow-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-base sm:text-lg">
            <Printer className="h-5 w-5 text-primary shrink-0" /> Informe Ecográfico Estructurado
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ECO_TEMPLATES.map((tpl) => (
              <button
                key={tpl.type}
                type="button"
                onClick={() => {
                  setEcoType(tpl.type);
                  setFindings(tpl.findings);
                  setConclusion(tpl.conclusion);
                }}
                className={`text-left px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  ecoType === tpl.type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                {tpl.type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <Label className="text-[11px]">Edad Gestacional / Fase</Label>
              <Input
                value={gestationalAge}
                onChange={(e) => setGestationalAge(e.target.value)}
                className="rounded-xl text-xs h-8 mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px]">FCF (lpm)</Label>
              <Input
                value={fhr}
                onChange={(e) => setFhr(e.target.value)}
                className="rounded-xl text-xs h-8 mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px]">Peso Fetal Est. (g)</Label>
              <Input
                value={efw}
                onChange={(e) => setEfw(e.target.value)}
                className="rounded-xl text-xs h-8 mt-1"
              />
            </div>
          </div>

          <div className="grid gap-1">
            <Label className="text-xs">Hallazgos Ecográficos y Biometría</Label>
            <Textarea
              rows={4}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              className="rounded-xl text-xs"
            />
          </div>

          <div className="grid gap-1">
            <Label className="text-xs">Conclusión Diagnóstica</Label>
            <Textarea
              rows={2}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              className="rounded-xl text-xs"
            />
          </div>

          <DoctorSignatureFields {...doctorProps} prefix="eco" />
        </div>
        <div className="flex justify-end gap-2 border-t border-border/60 pt-3 mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onExport?.({
                ecoType,
                gestationalAge,
                fhr,
                efw,
                placenta,
                findings,
                conclusion,
              })
            }
            className="rounded-xl bg-primary text-primary-foreground shadow-sm"
          >
            Generar Informe PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PatientMedicalReportDialogs({
  viewing,
  openReposo,
  setOpenReposo,
  reposoDays,
  setReposoDays,
  reposoStart,
  setReposoStart,
  reposoReason,
  setReposoReason,
  onExportReposo,

  openAtencion,
  setOpenAtencion,
  atencionDate,
  setAtencionDate,
  atencionTime,
  setAtencionTime,
  atencionReason,
  setAtencionReason,
  onExportAtencion,

  openJustificativo,
  setOpenJustificativo,
  justificativoDate,
  setJustificativoDate,
  justificativoReason,
  setJustificativoReason,
  onExportJustificativo,

  openLaboratorio = false,
  setOpenLaboratorio = () => {},
  onExportLaboratorio,

  openEcografia = false,
  setOpenEcografia = () => {},
  onExportEcografia,

  doctorName,
  setDoctorName,
  doctorUni,
  setDoctorUni,
  doctorMpps,
  setDoctorMpps,
  doctorCmc,
  setDoctorCmc,
}: PatientMedicalReportDialogsProps) {
  const doctorProps: DoctorSignatureProps = {
    prefix: "",
    doctorName,
    setDoctorName,
    doctorUni,
    setDoctorUni,
    doctorMpps,
    setDoctorMpps,
    doctorCmc,
    setDoctorCmc,
  };

  return (
    <>
      <ReposoDialog
        viewing={viewing}
        openReposo={openReposo}
        setOpenReposo={setOpenReposo}
        reposoDays={reposoDays}
        setReposoDays={setReposoDays}
        reposoStart={reposoStart}
        setReposoStart={setReposoStart}
        reposoReason={reposoReason}
        setReposoReason={setReposoReason}
        onExportReposo={onExportReposo}
        doctorProps={doctorProps}
      />
      <AtencionDialog
        viewing={viewing}
        openAtencion={openAtencion}
        setOpenAtencion={setOpenAtencion}
        atencionDate={atencionDate}
        setAtencionDate={setAtencionDate}
        atencionTime={atencionTime}
        setAtencionTime={setAtencionTime}
        atencionReason={atencionReason}
        setAtencionReason={setAtencionReason}
        onExportAtencion={onExportAtencion}
        doctorProps={doctorProps}
      />
      <JustificativoDialog
        viewing={viewing}
        openJustificativo={openJustificativo}
        setOpenJustificativo={setOpenJustificativo}
        justificativoDate={justificativoDate}
        setJustificativoDate={setJustificativoDate}
        justificativoReason={justificativoReason}
        setJustificativoReason={setJustificativoReason}
        onExportJustificativo={onExportJustificativo}
        doctorProps={doctorProps}
      />
      <LaboratorioDialog
        open={openLaboratorio}
        onOpenChange={setOpenLaboratorio}
        onExport={onExportLaboratorio}
        doctorProps={doctorProps}
      />
      <EcografiaDialog
        open={openEcografia}
        onOpenChange={setOpenEcografia}
        onExport={onExportEcografia}
        doctorProps={doctorProps}
      />
    </>
  );
}
