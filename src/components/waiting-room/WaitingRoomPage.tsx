import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock } from "lucide-react";
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

  const handleOpenNewAppointment = useCallback(() => {
    setNewAppointmentOpen(true);
  }, []);

  const handleOpenConsultation = useCallback((app: AppointmentWithPatient) => {
    setConsultationApp(app);
    setConsultationOpen(true);
  }, []);

  const handleGoToSales = useCallback(() => {
    navigate({ to: "/facturacion" });
  }, [navigate]);

  if (isLoading) {
    return (
      <div
        className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] flex flex-col gap-6 animate-pulse"
        aria-busy="true"
        aria-label="Cargando sala de espera"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-44 rounded bg-muted" />
            <div className="h-7 w-60 rounded-lg bg-muted" />
            <div className="h-3 w-72 rounded bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-28 rounded-xl bg-muted" />
            <div className="h-10 w-36 rounded-xl bg-muted" />
            <div className="h-10 w-32 rounded-xl bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-20 rounded-2xl border border-border/60 bg-muted/30" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-muted/20 min-h-[380px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!canViewAllDoctors) {
    return (
      <div className="bg-card border border-border rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Clock className="h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
        <h2 className="text-lg font-bold text-foreground">
          Módulo exclusivo de Recepción y Administración
        </h2>
        <p className="text-xs text-muted-foreground max-w-md">
          La gestión de turnos en Sala de Espera la realiza Recepción. Puedes ver e iniciar tus
          consultas directamente desde tu Agenda.
        </p>
        <Button
          type="button"
          onClick={() => navigate({ to: "/agenda" })}
          className="min-h-11 sm:min-h-9 rounded-xl text-xs font-bold mt-1 transition-[transform,colors] duration-150 active:scale-95 focus-visible:ring-2"
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
        onOpenNewAppointment={handleOpenNewAppointment}
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
        onOpenConsultation={handleOpenConsultation}
        onGoToSales={handleGoToSales}
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
