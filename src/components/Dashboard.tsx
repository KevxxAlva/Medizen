import React, { useMemo, useEffect } from "react";
import { Users, CalendarClock } from "lucide-react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import { useAuthSession, useRoles } from "@/hooks/useAuth";
import { useMyProfile, useDoctors } from "@/lib/api/profiles";
import { useAppointments } from "@/lib/api/appointments";
import { useRecentPatients, usePatientsCountByDateRange } from "@/lib/api/patients";
import {
  useDashboardStats,
  useMonthlyPayments,
  useDailyGoals,
  useAddDailyGoal,
  useIncrementDailyGoal,
  useDashboardTrends,
  useTopTreatments,
} from "@/lib/api/dashboard";
import { useClinicInfo } from "@/lib/api/clinic";

import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { AiClinicalInsightsCard } from "@/components/dashboard/AiClinicalInsightsCard";
import { DashboardHeader, DashboardNotification } from "@/components/dashboard/DashboardHeader";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardDailyTreasuryCard } from "@/components/dashboard/DashboardDailyTreasuryCard";
import { DashboardMetricsCards } from "@/components/dashboard/DashboardMetricsCards";
import { DashboardGoalsAndEvents } from "@/components/dashboard/DashboardGoalsAndEvents";
import { DashboardTrendsAndTreatments } from "@/components/dashboard/DashboardTrendsAndTreatments";
import { DashboardProfileCard } from "@/components/dashboard/DashboardProfileCard";
import { DashboardCalendarWidget } from "@/components/dashboard/DashboardCalendarWidget";
import { useSalesInvoices } from "@/components/finance/useSalesInvoices";
import { useUserRoleScope } from "@/hooks/useUserRoleScope";
import { getInvoicesForDoctor } from "@/lib/utils/invoiceDoctorPartition";

export function Dashboard() {
  const { user, loading: authLoading } = useAuthSession();
  const { isDoctorOnly, doctorId: currentDoctorId, isLoading: scopeLoading } = useUserRoleScope();
  const doctorScopeId = isDoctorOnly ? currentDoctorId : undefined;
  const scopeReady = !authLoading && !scopeLoading;

  const { data: roles = [] } = useRoles();
  const { data: profile } = useMyProfile(user?.id);
  const { data: doctors = [] } = useDoctors();
  const { data: recentPatients = [] } = useRecentPatients(5, {
    doctorId: doctorScopeId,
    isDoctorOnly,
    enabled: scopeReady,
  });
  const { data: totalPatients = 0 } = usePatientsCountByDateRange(undefined, undefined, {
    doctorId: doctorScopeId,
    isDoctorOnly,
    enabled: scopeReady,
  });
  const { data: stats, isLoading: statsLoading } = useDashboardStats({
    doctorId: doctorScopeId,
    isDoctorOnly,
    enabled: scopeReady,
  });
  const { data: monthlyData = { total: 0, paymentsByDay: [] } } = useMonthlyPayments({
    doctorId: doctorScopeId,
    isDoctorOnly,
    enabled: scopeReady,
  });
  const { data: clinic } = useClinicInfo();
  const { data: trends = [] } = useDashboardTrends({
    doctorId: doctorScopeId,
    isDoctorOnly,
    enabled: scopeReady,
  });
  const { data: topTreatments = [] } = useTopTreatments({
    doctorId: doctorScopeId,
    isDoctorOnly,
    enabled: scopeReady,
  });
  const { facturas = [], isLoading: facturasLoading } = useSalesInvoices();

  const startOfLastMonthStr = useMemo(() => {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return startOfLastMonth.toISOString().slice(0, 10);
  }, []);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const today = useMemo(() => new Date(), []);

  const { data: dailyGoals = [] } = useDailyGoals(todayStr);
  const addDailyGoal = useAddDailyGoal();
  const incrementDailyGoal = useIncrementDailyGoal();

  const { data: rawAppointments = [] } = useAppointments({
    from: startOfLastMonthStr,
  }, {
    enabled: scopeReady,
  });

  const appointments = useMemo(() => {
    if (isDoctorOnly && !currentDoctorId) return [];
    if (!isDoctorOnly) return rawAppointments;
    return rawAppointments.filter((a) => Number(a.doctor_id) === Number(currentDoctorId));
  }, [rawAppointments, isDoctorOnly, currentDoctorId]);

  const doctorInvoices = useMemo(() => {
    if (!isDoctorOnly) return facturas;
    if (!currentDoctorId || rawAppointments.length === 0) return [];
    return getInvoicesForDoctor(facturas, rawAppointments, currentDoctorId);
  }, [facturas, isDoctorOnly, rawAppointments, currentDoctorId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isTourDone = localStorage.getItem("femesalud_tour_done");
      if (!isTourDone) {
        const driverObj = driver({
          showProgress: true,
          steps: [
            {
              element: "aside",
              popover: {
                title: "Menú Principal",
                description: "Accede a todas las herramientas de la clínica desde aquí.",
              },
            },
            {
              element: "#search-bar",
              popover: {
                title: "Buscador",
                description: "Encuentra rápidamente pacientes, citas o acciones.",
              },
            },
            {
              element: "#calendar-widget",
              popover: {
                title: "Tu Agenda",
                description: "Controla tus citas diarias y mantente al día con tu calendario.",
              },
            },
          ],
          onDestroyStarted: () => {
            if (!driverObj.hasNextStep() || confirm("¿Estás seguro de saltar el tour?")) {
              localStorage.setItem("femesalud_tour_done", "true");
              driverObj.destroy();
            }
          },
        });
        const timerId = setTimeout(() => driverObj.drive(), 1000);
        return () => {
          clearTimeout(timerId);
          driverObj.destroy();
        };
      }
    }
  }, []);

  const todaysAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.scheduled_at.slice(0, 10) === todayStr)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [appointments, todayStr]);

  const notifications = useMemo(() => {
    const list: DashboardNotification[] = [];
    if (todaysAppointments.length > 0) {
      list.push({
        id: "app-1",
        title: "Citas para Hoy",
        desc: `Tienes ${todaysAppointments.length} cita(s) programadas para hoy.`,
        icon: CalendarClock,
        color: "text-primary",
        bg: "bg-primary/10",
        href: "/agenda",
      });
    }
    if (recentPatients.length > 0) {
      list.push({
        id: "pat-1",
        title: "Nuevos Pacientes",
        desc: `${recentPatients.length} paciente(s) registrados recientemente.`,
        icon: Users,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
        href: "/pacientes",
      });
    }
    return list;
  }, [todaysAppointments, recentPatients]);

  const displayName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "Usuario";
  const rawRole = (profile?.role || roles[0] || "").toLowerCase();
  const roleDisplay = rawRole.startsWith("admin")
    ? "Administrador"
    : rawRole.startsWith("recep")
      ? "Recepcionista"
      : "Médico";

  if ((authLoading && !user) || (statsLoading && !stats)) {
    return (
      <div className="min-h-full bg-card/40 border border-border rounded-3xl p-4 md:p-8">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-card/40 border border-border rounded-3xl p-4 md:p-8 font-sans text-foreground">
      <DashboardHeader notifications={notifications} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT COLUMN (Content) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <DashboardHero displayName={displayName} today={today} />
          <DashboardMetricsCards
            totalPatients={totalPatients}
            stats={stats}
            monthlyData={monthlyData}
            isDoctorOnly={isDoctorOnly}
            doctorId={doctorScopeId}
          />
          <DashboardGoalsAndEvents
            stats={stats}
            dailyGoals={dailyGoals}
            todayStr={todayStr}
            addDailyGoal={addDailyGoal}
            incrementDailyGoal={incrementDailyGoal}
          />
          <DashboardTrendsAndTreatments trends={trends} topTreatments={topTreatments} />
          <AiClinicalInsightsCard />
        </div>

        {/* RIGHT COLUMN (Sidebar Profile & Calendar) */}
        <div className="xl:col-span-4 flex flex-col gap-6 self-start xl:sticky xl:top-6">
          <DashboardProfileCard
            displayName={displayName}
            profile={profile}
            roleDisplay={roleDisplay}
            clinic={clinic}
          />
          <DashboardCalendarWidget appointments={appointments} today={today} />
          <DashboardDailyTreasuryCard invoices={doctorInvoices} isLoading={facturasLoading} />
        </div>
      </div>
    </div>
  );
}
export default Dashboard;
