import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type AppointmentWithPatient } from "@/lib/api/appointments";
import { useDoctors } from "@/lib/api/profiles";
import { useClinicInfo } from "@/lib/api/clinic";
import { useSalesInvoices } from "@/components/finance/useSalesInvoices";
import { useUserRoleScope } from "@/hooks/useUserRoleScope";
import { ConsultationForm } from "@/components/ConsultationForm";
import { AppointmentForm } from "@/components/AppointmentForm";
import { formatToYMD } from "@/components/agenda/agenda-helpers";
import { useWaitingRoomData } from "./useWaitingRoomData";
import { WaitingRoomHeaderAndKpis } from "./WaitingRoomHeaderAndKpis";
import { WaitingRoomBoard } from "./WaitingRoomBoard";

function resolveEffectiveDoctorFilter(
  isDoctorOnly: boolean,
  currentDoctorId: string | null,
  selectedDoctorId: string,
): string | undefined {
  if (isDoctorOnly) return currentDoctorId || "__unassigned__";
  return selectedDoctorId !== "all" ? selectedDoctorId : undefined;
}

export function WaitingRoomPage() {
  const navigate = useNavigate();
  const { isDoctorOnly, doctorId: currentDoctorId, canViewAllDoctors, doctorName } =
    useUserRoleScope();
  const { data: doctors = [] } = useDoctors();
  const { data: clinic } = useClinicInfo();
  const { facturas } = useSalesInvoices();

  const todayYmd = useMemo(() => formatToYMD(new Date()), []);
  const tomorrowYmd = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return formatToYMD(t);
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayYmd);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [consultationApp, setConsultationApp] = useState<AppointmentWithPatient | null>(null);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const effectiveDoctorFilter = resolveEffectiveDoctorFilter(
    isDoctorOnly,
    currentDoctorId,
    selectedDoctorId,
  );

  const {
    isLoading,
    sharedStages,
    patientContactMap,
    doctorMap,
    columns,
    pendingCashCount,
    handleStageTransition,
  } = useWaitingRoomData({
    selectedDate,
    effectiveDoctorFilter,
    doctors,
    facturas,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canViewAllDoctors) {
    return (
      <div className="bg-card border border-border rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Clock className="h-10 w-10 text-muted-foreground/50" />
        <h2 className="text-lg font-bold text-foreground">
          Módulo exclusivo de Recepción y Administración
        </h2>
        <p className="text-xs text-muted-foreground max-w-md">
          La gestión de turnos en Sala de Espera la realiza Recepción. Puedes ver e iniciar tus
          consultas directamente desde tu Agenda.
        </p>
        <Button
          onClick={() => navigate({ to: "/agenda" })}
          className="rounded-xl text-xs font-bold mt-1"
        >
          Ir a mi Agenda
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] flex flex-col gap-6">
      <WaitingRoomHeaderAndKpis
        isDoctorOnly={isDoctorOnly}
        doctorName={doctorName}
        canViewAllDoctors={canViewAllDoctors}
        selectedDate={selectedDate}
        todayYmd={todayYmd}
        tomorrowYmd={tomorrowYmd}
        onSelectDate={setSelectedDate}
        selectedDoctorId={selectedDoctorId}
        onSelectDoctor={setSelectedDoctorId}
        doctors={doctors}
        onOpenNewAppointment={() => setNewAppointmentOpen(true)}
        columns={columns}
        pendingCashCount={pendingCashCount}
      />

      <WaitingRoomBoard
        columns={columns}
        patientContactMap={patientContactMap}
        doctorMap={doctorMap}
        sharedStages={sharedStages}
        facturas={facturas}
        selectedDate={selectedDate}
        clinicName={clinic?.name || "FemeSalud"}
        nowMs={nowMs}
        onStageChange={handleStageTransition}
        onOpenConsultation={(app) => {
          setConsultationApp(app);
          setConsultationOpen(true);
        }}
        onGoToSales={() => navigate({ to: "/facturacion" })}
      />

      {consultationOpen && consultationApp && (
        <ConsultationForm
          open={consultationOpen}
          onOpenChange={setConsultationOpen}
          appointment={consultationApp}
        />
      )}

      {newAppointmentOpen && (
        <AppointmentForm
          open={newAppointmentOpen}
          onOpenChange={setNewAppointmentOpen}
          defaultDate={selectedDate}
        />
      )}
    </div>
  );
}
