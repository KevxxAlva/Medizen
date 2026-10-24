import { useMemo, useState } from "react";
import {
  useAppointments,
  useDeleteAppointment,
  type AppointmentWithPatient,
} from "@/lib/api/appointments";
import { useDoctors } from "@/lib/api/profiles";
import { AppointmentForm } from "@/components/AppointmentForm";
import { ConsultationForm } from "@/components/ConsultationForm";
import { generateAppointmentsReport } from "@/lib/utils/generateAppointmentsReport";
import { toast } from "sonner";
import {
  getWeekDays,
  getCalendarMonthDays,
  formatToYMD,
} from "./agenda/agenda-helpers";
import { AgendaHeader } from "./agenda/AgendaHeader";
import { AgendaToolbar } from "./agenda/AgendaToolbar";
import { AgendaSidebar } from "./agenda/AgendaSidebar";
import { AgendaMonthView } from "./agenda/AgendaMonthView";
import { AgendaWeekDayGrid } from "./agenda/AgendaWeekDayGrid";
import { AgendaCalendarNav } from "./agenda/AgendaCalendarNav";
import { useAgendaGridEvents } from "./agenda/useAgendaGridEvents";

export function AgendaPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [defaultFormDate, setDefaultFormDate] = useState<string | undefined>(undefined);
  const [editingApp, setEditingApp] = useState<AppointmentWithPatient | null>(null);

  const [consultationOpen, setConsultationOpen] = useState(false);
  const [consultationApp, setConsultationApp] = useState<AppointmentWithPatient | null>(null);
  const [compactMode, setCompactMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [calendarView, setCalendarView] = useState("Semanal");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [showAllSidebarApps, setShowAllSidebarApps] = useState(false);

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const monthDays = useMemo(() => getCalendarMonthDays(currentDate), [currentDate]);
  const todayStr = useMemo(() => formatToYMD(new Date()), []);

  const dateRange = useMemo(() => {
    const firstWeekDay = formatToYMD(weekDays[0]);
    const lastWeekDay = formatToYMD(weekDays[6]);
    const firstMonthDay = formatToYMD(monthDays[0]);
    const lastMonthDay = formatToYMD(monthDays[monthDays.length - 1]);

    const from = firstWeekDay < firstMonthDay ? firstWeekDay : firstMonthDay;
    const to = lastWeekDay > lastMonthDay ? lastWeekDay : lastMonthDay;

    return { from, to };
  }, [weekDays, monthDays]);

  // Queries
  const { data: appointments = [] } = useAppointments({
    from: dateRange.from,
    to: dateRange.to,
  });
  const { data: doctors = [] } = useDoctors();
  const del = useDeleteAppointment();

  const doctorMap = useMemo(
    () => new Map(doctors.map((d) => [d.id, d.full_name || d.email])),
    [doctors],
  );

  const handleDownloadAgenda = async () => {
    try {
      toast.loading("Generando reporte de citas...", { id: "agenda_pdf" });
      const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
      const formatted = appointments
        .filter((a) =>
          statusFilter === "todas" ? a.status !== "cancelada" : a.status === statusFilter,
        )
        .map((a) => ({
          id_cita: Number(a.id) || a.id,
          fecha_hora: a.scheduled_at,
          estado: a.status,
          motivo: a.reason || "Consulta",
          paciente_nombre: a.patient_name || "Paciente",
          medico_nombre: a.doctor_id ? doctorMap.get(a.doctor_id) || "Médico" : "—",
        }));
      await generateAppointmentsReport(formatted, currentMonthStr);
      toast.success("Reporte de agenda descargado", { id: "agenda_pdf" });
    } catch (err: any) {
      toast.error(err?.message || "Error al exportar citas", { id: "agenda_pdf" });
    }
  };

  const deleteApp = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast.success("Cita eliminada");
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar");
    }
  };

  const gridEvents = useAgendaGridEvents(appointments, weekDays, searchQuery, statusFilter);

  const daysToRender = calendarView === "Diaria" ? [currentDate] : weekDays;

  const handleOpenNewAppointment = (dateStr?: string) => {
    setDefaultFormDate(dateStr || formatToYMD(new Date()));
    setEditingApp(null);
    setFormOpen(true);
  };

  const handleEditAppointment = (app: AppointmentWithPatient) => {
    setEditingApp(app);
    setFormOpen(true);
  };

  const handleStartConsultation = (app: AppointmentWithPatient) => {
    setConsultationApp(app);
    setConsultationOpen(true);
  };

  return (
    <>
      <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] font-sans text-foreground flex flex-col">
        {/* HEADER */}
        <AgendaHeader onNewAppointment={() => handleOpenNewAppointment()} />

        {/* TOOLBAR */}
        <AgendaToolbar
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onDownloadAgenda={handleDownloadAgenda}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          isSearchOpen={isSearchOpen}
          onSearchOpenChange={setIsSearchOpen}
          compactMode={compactMode}
          onCompactModeChange={setCompactMode}
        />

        <div className="flex flex-col lg:flex-row gap-8 flex-1">
          {/* LEFT SIDEBAR */}
          <AgendaSidebar
            currentDate={currentDate}
            onSelectDate={setCurrentDate}
            onPrevMonth={() =>
              setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
            }
            onNextMonth={() =>
              setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
            }
            monthDays={monthDays}
            gridEvents={gridEvents}
            showAllSidebarApps={showAllSidebarApps}
            onToggleShowAll={() => setShowAllSidebarApps((prev) => !prev)}
            onNewAppointment={() => handleOpenNewAppointment(formatToYMD(currentDate))}
            onEditAppointment={handleEditAppointment}
            onDownloadAgenda={handleDownloadAgenda}
          />

          {/* MAIN WEEK GRID */}
          <section className="flex-1 border border-border rounded-2xl flex flex-col overflow-hidden shadow-xs relative">
            <AgendaCalendarNav
              currentDate={currentDate}
              onCurrentDateChange={setCurrentDate}
              calendarView={calendarView}
              onCalendarViewChange={setCalendarView}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />

            {/* Timetable Body Container */}
            <div className="flex-1 overflow-y-auto overflow-x-auto relative bg-card">
              {calendarView === "Mensual" ? (
                <AgendaMonthView
                  currentDate={currentDate}
                  monthDays={monthDays}
                  todayStr={todayStr}
                  appointments={appointments}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  onSelectDay={(d) => {
                    setCurrentDate(d);
                    setCalendarView("Semanal");
                  }}
                  onEditAppointment={handleEditAppointment}
                />
              ) : (
                <AgendaWeekDayGrid
                  calendarView={calendarView}
                  daysToRender={daysToRender}
                  todayStr={todayStr}
                  compactMode={compactMode}
                  gridEvents={gridEvents}
                  onNewAppointmentAtDate={(dateStr) => handleOpenNewAppointment(dateStr)}
                  onEditAppointment={handleEditAppointment}
                  onDeleteAppointment={deleteApp}
                  onStartConsultation={handleStartConsultation}
                />
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Appointment Creation/Editing Form */}
      {formOpen && (
        <AppointmentForm
          key={`${editingApp?.id || "new"}-${defaultFormDate || ""}`}
          open={formOpen}
          onOpenChange={setFormOpen}
          defaultDate={defaultFormDate}
          appointment={editingApp}
        />
      )}

      {/* Consultation Process Form */}
      {consultationOpen && consultationApp && (
        <ConsultationForm
          open={consultationOpen}
          onOpenChange={setConsultationOpen}
          appointment={consultationApp}
        />
      )}
    </>
  );
}
