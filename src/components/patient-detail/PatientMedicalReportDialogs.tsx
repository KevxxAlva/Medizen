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

  doctorName: string;
  setDoctorName: (val: string) => void;
  doctorUni: string;
  setDoctorUni: (val: string) => void;
  doctorMpps: string;
  setDoctorMpps: (val: string) => void;
  doctorCmc: string;
  setDoctorCmc: (val: string) => void;
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
    </>
  );
}
