import { APP_TIME_ZONE } from "@/lib/constants/locale";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { 
  ArrowLeft, FileDown, FileText, Printer, Loader2, User, 
  Baby, Stethoscope, Clock, StickyNote, AlertCircle, Sparkles, 
  FileSpreadsheet, Heart, Pill, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientTimeline } from "@/components/PatientTimeline";
import { ClinicalNotesPanel } from "@/components/ClinicalNotesPanel";
import { PatientConsultationsPanel } from "@/components/PatientConsultationsPanel";
import { PatientForm } from "@/components/PatientForm";
import { usePatient, fetchPatientById } from "@/lib/api/patients";
import { useDoctors, useMyProfile } from "@/lib/api/profiles";
import { useAuthSession } from "@/hooks/useAuth";
import { PatientClinicalBanner } from "@/components/PatientClinicalBanner";
import { PatientProfileSkeleton } from "@/components/skeletons/PatientProfileSkeleton";
import { usePatientConsultations } from "@/lib/api/consultations";
import {
  PatientGeneralTab,
  PatientAntecedentesTab,
  PatientGinecologiaTab,
  PatientObstetriciaTab,
} from "@/components/patient-detail/PatientDetailTabs";
import { PatientMedicalReportDialogs } from "@/components/patient-detail/PatientMedicalReportDialogs";

export const Route = createFileRoute("/_authenticated/pacientes/$patientId")({
  loader: ({ context: { queryClient }, params: { patientId } }) => {
    if (typeof window !== "undefined") {
      queryClient.prefetchQuery({
        queryKey: ["patient", patientId],
        queryFn: () => fetchPatientById(patientId),
      });
    }
  },
  component: PatientDetailRoute,
});

function PatientRecipesTab({ patientId, patient, doctors }: any) {
  const { data: consultations, isLoading } = usePatientConsultations(patientId);
  
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-4" />;
  
  const recipes = consultations?.filter((c: any) => c.indications && c.indications.trim().length > 0) || [];
  
  if (recipes.length === 0) return <p className="text-muted-foreground text-sm p-4 text-center">No hay recetas registradas.</p>;
  
  return (
    <div className="space-y-4">
      {recipes.map((c: any) => {
        const doc = doctors?.find((d: any) => d.id === c.doctor_id) || doctors?.find((d: any) => d.id === patient?.assigned_doctor_id);
        return (
          <div key={c.id} className="p-4 border border-border/50 rounded-2xl bg-muted/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <p className="font-bold text-sm text-foreground">
                Receta de Consulta - {new Date(c.created_at).toLocaleDateString("es-ES", { timeZone: APP_TIME_ZONE })}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 max-w-md">
                {c.indications}
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="rounded-xl border-border/60 hover:bg-muted text-xs font-semibold"
              onClick={async () => {
                const { generateRecipePDF } = await import("@/lib/utils/recipePdf");
                await generateRecipePDF(
                  patient, 
                  c, 
                  doc?.full_name || "Médico Tratante",
                  doc?.specialty || "Ginecología - Obstetricia",
                  doc?.university || "",
                  doc?.mpps || "",
                  doc?.cmc || ""
                );
              }}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function PatientNotFoundView({ patientId }: { patientId: string }) {
  return (
    <div className="p-6 sm:p-10 max-w-2xl mx-auto w-full my-10 bg-card rounded-[2.5rem] border border-border/50 shadow-sm flex flex-col items-center justify-center text-center gap-4">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        <AlertCircle className="h-7 w-7" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-extrabold text-foreground">
          Expediente #{patientId} no encontrado
        </h2>
        <p className="text-xs text-muted-foreground max-w-md">
          El paciente solicitado no existe en el registro clínico o el identificador en la URL no
          corresponde a un expediente activo.
        </p>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Link to="/pacientes">
          <Button className="rounded-xl gap-2 font-bold text-xs">
            <ArrowLeft className="h-4 w-4" /> Volver al directorio de pacientes
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PatientDetailHeader({
  viewing,
  onEditOpen,
  onExportFicha,
  onOpenReposo,
  onOpenAtencion,
  onOpenJustificativo,
}: {
  viewing: any;
  onEditOpen: () => void;
  onExportFicha: (p: any) => void;
  onOpenReposo: (p: any) => void;
  onOpenAtencion: (p: any) => void;
  onOpenJustificativo: (p: any) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <Link to="/pacientes">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Volver a la lista de pacientes"
            className="h-10 w-10 rounded-2xl bg-background/80 border border-border/40 shadow-sm hover:bg-muted/80 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Volver a la lista de pacientes</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            Expediente Clínico
            <Sparkles className="h-4 w-4 text-primary/70 animate-pulse" />
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Historial médico centralizado, antecedentes y registro evolutivo.
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onEditOpen}
          className="rounded-2xl flex items-center gap-2 h-10 px-4 font-bold text-xs border-border/60 hover:bg-muted/80 transition-colors duration-200 cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5 text-primary" /> Editar Expediente
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="rounded-2xl flex items-center gap-2 h-10 px-4 font-bold text-xs bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors duration-200 cursor-pointer">
              <FileDown className="h-4 w-4" /> Exportar Documentos
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="rounded-2xl bg-popover/95 backdrop-blur-md border border-border/50 p-2 shadow-2xl min-w-[200px]"
            align="end"
          >
            <DropdownMenuItem
              onClick={() => onExportFicha(viewing)}
              className="rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-2 px-3 py-2.5 hover:bg-muted/80 transition-colors"
            >
              <FileText className="h-4 w-4 text-primary" /> Expediente Clínico Completo
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onOpenReposo(viewing)}
              className="rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-2 px-3 py-2.5 hover:bg-muted/80 transition-colors"
            >
              <Printer className="h-4 w-4 text-emerald-500" /> Constancia de Reposo
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onOpenAtencion(viewing)}
              className="rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-2 px-3 py-2.5 hover:bg-muted/80 transition-colors"
            >
              <Printer className="h-4 w-4 text-sky-500" /> Constancia de Atención
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onOpenJustificativo(viewing)}
              className="rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-2 px-3 py-2.5 hover:bg-muted/80 transition-colors"
            >
              <Printer className="h-4 w-4 text-amber-500" /> Justificativo Médico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function usePatientReportsState(doctors: any[] | undefined, myProfile: any) {
  const [openReposo, setOpenReposo] = useState(false);
  const [openAtencion, setOpenAtencion] = useState(false);
  const [openJustificativo, setOpenJustificativo] = useState(false);

  const [reposoDays, setReposoDays] = useState("3");
  const [reposoStart, setReposoStart] = useState("");
  const [reposoReason, setReposoReason] = useState("");

  const [atencionDate, setAtencionDate] = useState("");
  const [atencionTime, setAtencionTime] = useState("");
  const [atencionReason, setAtencionReason] = useState("");

  const [justificativoDate, setJustificativoDate] = useState("");
  const [justificativoReason, setJustificativoReason] = useState("");

  const [doctorName, setDoctorName] = useState("");
  const [doctorUni, setDoctorUni] = useState("");
  const [doctorMpps, setDoctorMpps] = useState("");
  const [doctorCmc, setDoctorCmc] = useState("");

  const prefillDoctorFields = (p: any) => {
    const assignedDoc = doctors?.find((d) => d.id === p?.assigned_doctor_id);
    const activeDoc = assignedDoc || myProfile || doctors?.[0];
    setDoctorName(activeDoc?.full_name || "Médico Tratante");
    setDoctorUni(activeDoc?.university || "");
    setDoctorMpps(activeDoc?.mpps || "");
    setDoctorCmc(activeDoc?.cmc || "");
  };

  const handleExportFicha = async (p: any) => {
    const { generateFullHistoryPdf } = await import("@/lib/pdf/generateFullHistoryPdf");
    await generateFullHistoryPdf(p.id);
  };

  const handleOpenReposoDialog = (p: any) => {
    setReposoStart(new Date().toISOString().slice(0, 10));
    prefillDoctorFields(p);
    setReposoReason(p.diagnosis || p.current_illness || "");
    setOpenReposo(true);
  };

  const handleOpenAtencionDialog = (p: any) => {
    setAtencionDate(new Date().toISOString().slice(0, 10));
    setAtencionTime(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }));
    prefillDoctorFields(p);
    setAtencionReason(`Consulta ${p.consultation_reason ? `- ${p.consultation_reason}` : ""}`);
    setOpenAtencion(true);
  };

  const handleOpenJustificativoDialog = (p: any) => {
    setJustificativoDate(new Date().toISOString().slice(0, 10));
    prefillDoctorFields(p);
    setJustificativoReason(
      p.diagnosis || p.current_illness || p.consultation_reason || "Evaluación médica de rutina",
    );
    setOpenJustificativo(true);
  };

  const handleExportReposo = async (p: any) => {
    const { generateReposoPDF } = await import("@/lib/utils/reportsPdf");
    await generateReposoPDF({
      patientName: p.full_name,
      patientId: p.document_id || "",
      days: parseInt(reposoDays) || 3,
      startDate: reposoStart,
      reason: reposoReason,
      doctorName: doctorName || "Médico Tratante",
      doctorUniversity: doctorUni,
      doctorMpps,
      doctorCmc,
    });
    setOpenReposo(false);
  };

  const handleExportAtencion = async (p: any) => {
    const { generateAtencionPDF } = await import("@/lib/utils/reportsPdf");
    await generateAtencionPDF({
      patientName: p.full_name,
      patientId: p.document_id || "",
      date: atencionDate,
      time: atencionTime,
      reason: atencionReason,
      doctorName: doctorName || "Médico Tratante",
      doctorUniversity: doctorUni,
      doctorMpps,
      doctorCmc,
    });
    setOpenAtencion(false);
  };

  const handleExportJustificativo = async (p: any) => {
    const { generateJustificativoPDF } = await import("@/lib/utils/reportsPdf");
    await generateJustificativoPDF({
      patientName: p.full_name,
      patientId: p.document_id || "",
      date: justificativoDate,
      justificationText: justificativoReason,
      doctorName: doctorName || "Médico Tratante",
      doctorUniversity: doctorUni,
      doctorMpps,
      doctorCmc,
    });
    setOpenJustificativo(false);
  };

  return {
    openReposo,
    setOpenReposo,
    reposoDays,
    setReposoDays,
    reposoStart,
    setReposoStart,
    reposoReason,
    setReposoReason,
    handleOpenReposoDialog,
    handleExportReposo,

    openAtencion,
    setOpenAtencion,
    atencionDate,
    setAtencionDate,
    atencionTime,
    setAtencionTime,
    atencionReason,
    setAtencionReason,
    handleOpenAtencionDialog,
    handleExportAtencion,

    openJustificativo,
    setOpenJustificativo,
    justificativoDate,
    setJustificativoDate,
    justificativoReason,
    setJustificativoReason,
    handleOpenJustificativoDialog,
    handleExportJustificativo,

    doctorName,
    setDoctorName,
    doctorUni,
    setDoctorUni,
    doctorMpps,
    setDoctorMpps,
    doctorCmc,
    setDoctorCmc,

    handleExportFicha,
  };
}

function PatientDetailTabsContent({
  viewing,
  doctors,
}: {
  viewing: any;
  doctors: any;
}) {
  return (
    <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
      <TabsList className="flex flex-wrap w-full bg-muted/40 p-1.5 rounded-2xl mb-6 border border-border/40 gap-1.5 h-auto">
        <TabsTrigger
          value="general"
          className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-colors"
        >
          <User className="h-3.5 w-3.5" /> Identificación
        </TabsTrigger>
        <TabsTrigger
          value="antecedentes"
          className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-colors"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> Antecedentes
        </TabsTrigger>
        <TabsTrigger
          value="ginecologia"
          className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-colors"
        >
          <Heart className="h-3.5 w-3.5" /> Ginecológico
        </TabsTrigger>
        <TabsTrigger
          value="obstetricia"
          className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-colors"
        >
          <Baby className="h-3.5 w-3.5" /> Obstétrico
        </TabsTrigger>
        <TabsTrigger
          value="consultas"
          className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-colors"
        >
          <Stethoscope className="h-3.5 w-3.5" /> Consultas
        </TabsTrigger>
        <TabsTrigger
          value="timeline"
          className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-colors"
        >
          <Clock className="h-3.5 w-3.5" /> Timeline
        </TabsTrigger>
        <TabsTrigger
          value="notas"
          className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-colors"
        >
          <StickyNote className="h-3.5 w-3.5" /> Notas y Estudios
        </TabsTrigger>
        <TabsTrigger
          value="recetas"
          className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-colors"
        >
          <Pill className="h-3.5 w-3.5" /> Recetas
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 pb-10">
        <TabsContent value="general" className="space-y-6 outline-none animate-fade-in">
          <PatientGeneralTab viewing={viewing} />
        </TabsContent>

        <TabsContent value="antecedentes" className="space-y-6 outline-none">
          <PatientAntecedentesTab viewing={viewing} />
        </TabsContent>

        <TabsContent value="ginecologia" className="space-y-4 outline-none">
          <PatientGinecologiaTab viewing={viewing} />
        </TabsContent>

        <TabsContent value="obstetricia" className="space-y-6 outline-none">
          <PatientObstetriciaTab viewing={viewing} />
        </TabsContent>

        <TabsContent value="consultas" className="space-y-4 outline-none">
          <PatientConsultationsPanel patientId={viewing.id} />
        </TabsContent>

        <TabsContent value="notas" className="space-y-4 outline-none">
          <ClinicalNotesPanel patientId={viewing.id} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 outline-none">
          <div className="max-w-2xl">
            <PatientTimeline patientId={viewing.id} />
          </div>
        </TabsContent>

        <TabsContent value="recetas" className="space-y-4 outline-none">
          <div className="bg-card border border-border/40 p-6 rounded-3xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
              <Pill className="h-4 w-4" /> Historial de Recetas e Indicaciones
            </h3>
            <PatientRecipesTab patientId={viewing.id} patient={viewing} doctors={doctors} />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}

function PatientDetailView({
  viewing,
  doctors,
  myProfile,
}: {
  viewing: any;
  doctors: any[] | undefined;
  myProfile: any;
}) {
  const doctorMap = useMemo(
    () => new Map(doctors?.map((d) => [d.id, d.full_name]) || []),
    [doctors],
  );

  const [editOpen, setEditOpen] = useState(false);
  const reports = usePatientReportsState(doctors, myProfile);

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-border/40 shadow-sm">
        <PatientDetailHeader
          viewing={viewing}
          onEditOpen={() => setEditOpen(true)}
          onExportFicha={reports.handleExportFicha}
          onOpenReposo={reports.handleOpenReposoDialog}
          onOpenAtencion={reports.handleOpenAtencionDialog}
          onOpenJustificativo={reports.handleOpenJustificativoDialog}
        />

        <PatientClinicalBanner
          patient={viewing}
          assignedDoctorName={doctorMap.get(viewing.assigned_doctor_id ?? "")}
          className="mb-6"
        />

        <PatientDetailTabsContent viewing={viewing} doctors={doctors} />

        <PatientMedicalReportDialogs
          viewing={viewing}
          openReposo={reports.openReposo}
          setOpenReposo={reports.setOpenReposo}
          reposoDays={reports.reposoDays}
          setReposoDays={reports.setReposoDays}
          reposoStart={reports.reposoStart}
          setReposoStart={reports.setReposoStart}
          reposoReason={reports.reposoReason}
          setReposoReason={reports.setReposoReason}
          onExportReposo={reports.handleExportReposo}
          openAtencion={reports.openAtencion}
          setOpenAtencion={reports.setOpenAtencion}
          atencionDate={reports.atencionDate}
          setAtencionDate={reports.setAtencionDate}
          atencionTime={reports.atencionTime}
          setAtencionTime={reports.setAtencionTime}
          atencionReason={reports.atencionReason}
          setAtencionReason={reports.setAtencionReason}
          onExportAtencion={reports.handleExportAtencion}
          openJustificativo={reports.openJustificativo}
          setOpenJustificativo={reports.setOpenJustificativo}
          justificativoDate={reports.justificativoDate}
          setJustificativoDate={reports.setJustificativoDate}
          justificativoReason={reports.justificativoReason}
          setJustificativoReason={reports.setJustificativoReason}
          onExportJustificativo={reports.handleExportJustificativo}
          doctorName={reports.doctorName}
          setDoctorName={reports.setDoctorName}
          doctorUni={reports.doctorUni}
          setDoctorUni={reports.setDoctorUni}
          doctorMpps={reports.doctorMpps}
          setDoctorMpps={reports.setDoctorMpps}
          doctorCmc={reports.doctorCmc}
          setDoctorCmc={reports.setDoctorCmc}
        />

        <PatientForm open={editOpen} onOpenChange={setEditOpen} patient={viewing} />
      </div>
    </div>
  );
}

function PatientDetailRoute() {
  const { patientId } = Route.useParams();
  const { data: viewing, isLoading } = usePatient(patientId);
  const { data: doctors } = useDoctors();
  const { user: me } = useAuthSession();
  const { data: myProfile } = useMyProfile(me?.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PatientProfileSkeleton />
      </div>
    );
  }

  if (!viewing) {
    return <PatientNotFoundView patientId={patientId} />;
  }

  return <PatientDetailView viewing={viewing} doctors={doctors} myProfile={myProfile} />;
}
