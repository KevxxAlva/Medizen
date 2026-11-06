import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuth";
import { getInvoicesForDoctor } from "@/lib/utils/invoiceDoctorPartition";

// Helper to get dates for the last 7 days (including today)
const getLast7Days = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

export function useDashboardStats(options?: {
  enabled?: boolean;
  doctorId?: string | number | null;
  isDoctorOnly?: boolean;
}) {
  const { user } = useAuthSession();
  const doctorId = options?.doctorId ? Number(options.doctorId) : undefined;
  const isDoctorOnly = options?.isDoctorOnly;

  return useQuery({
    queryKey: ["dashboard_stats", user?.id, doctorId, isDoctorOnly],
    enabled: (options?.enabled ?? true) && !!user,
    queryFn: async () => {
      // Si el rol es exclusivo de doctor y no tiene ID médico asignado o resuelto, retornar 0
      if (isDoctorOnly && !doctorId) {
        return {
          offlineWork: { total: 0, change: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] },
          onlineWork: { total: 0, change: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] },
          labWork: { total: 0, change: 0, sparkline: [0, 0, 0, 0, 0, 0, 0] },
          scheduledEvents: {
            consultations: 0,
            labs: 0,
            invoices: 0,
            donutPercentage: 0,
            week: { consultations: 0, labs: 0, invoices: 0, donutPercentage: 0 },
          },
          plansDone: { done: 0, total: 0, percentage: 0, change: 0 },
        };
      }

      const dates = getLast7Days();
      const todayStr = dates[6];
      const yesterdayStr = dates[5];
      const sevenDaysAgo = dates[0];

      // Consultas acotadas a los últimos 7 días y al doctor si aplica
      let citasQuery = supabase
        .from("citas")
        .select("fecha_hora, estado, motivo, id_medico, id_paciente")
        .or("motivo.is.null,motivo.not.ilike.%[TEST-LOAD]%")
        .gte("fecha_hora", `${sevenDaysAgo}T00:00:00.000Z`);

      if (doctorId) {
        citasQuery = citasQuery.eq("id_medico", doctorId);
      }

      const { data: citasData } = await citasQuery;

      const citas = (citasData || []).filter(
        (c) => !["cancelada", "cancelado", "cancelled"].includes((c.estado || "").toLowerCase())
      );

      const doctorPatientIds = doctorId
        ? new Set(citas.map((c) => c.id_paciente).filter(Boolean))
        : null;

      // Invoices
      let invoices: any[] = [];
      if (!isDoctorOnly && !doctorId) {
        const { data: invoicesData } = await supabase
          .from("facturas")
          .select("id_paciente, fecha_emision, estado_pago")
          .gte("fecha_emision", `${sevenDaysAgo}T00:00:00.000Z`);
        invoices = invoicesData || [];
      } else if (doctorPatientIds && doctorPatientIds.size > 0) {
        const { data: invoicesData } = await supabase
          .from("facturas")
          .select("id_paciente, fecha_emision, estado_pago")
          .in("id_paciente", Array.from(doctorPatientIds))
          .gte("fecha_emision", `${sevenDaysAgo}T00:00:00.000Z`);
        invoices = invoicesData || [];
      }

      // Labs
      let labs: any[] = [];
      if (!isDoctorOnly && !doctorId) {
        const { data: labsData } = await supabase
          .from("examenes_laboratorio")
          .select("fecha_resultado")
          .gte("fecha_resultado", `${sevenDaysAgo}T00:00:00.000Z`);
        labs = labsData || [];
      } else if (doctorId) {
        const { data: consultasData } = await supabase
          .from("consultas")
          .select("id_consulta")
          .eq("id_medico", doctorId);

        const consultaIds = (consultasData || []).map((c) => c.id_consulta).filter(Boolean);
        if (consultaIds.length > 0) {
          const { data: labsData } = await supabase
            .from("examenes_laboratorio")
            .select("fecha_resultado")
            .in("id_consulta", consultaIds)
            .gte("fecha_resultado", `${sevenDaysAgo}T00:00:00.000Z`);
          labs = labsData || [];
        }
      }

      // Helper to count by day
      const countByDay = (items: any[], dateField: string) => {
        return dates.map(date => {
          return items.filter(item => item[dateField] && item[dateField].startsWith(date)).length;
        });
      };

      const citasByDay = countByDay(citas, "fecha_hora");
      const completedCitas = citas.filter((c) => (c.estado || "").toLowerCase() === "completada");
      const completedByDay = countByDay(completedCitas, "fecha_hora");
      const labsByDay = countByDay(labs, "fecha_resultado");
      const invoicesByDay = countByDay(invoices, "fecha_emision");

      const getChange = (today: number, yesterday: number) => {
        if (yesterday === 0) return today > 0 ? 100 : 0;
        return Math.round(((today - yesterday) / yesterday) * 100);
      };

      // OFFLINE WORK (Active Appointments)
      const offlineToday = citasByDay[6];
      const offlineYesterday = citasByDay[5];
      const offlineChange = getChange(offlineToday, offlineYesterday);

      // COMPLETED CONSULTATIONS (Real completed appointments in last 7 days)
      const completedWeekTotal = completedByDay.reduce((acc, v) => acc + v, 0);
      const completedToday = completedByDay[6];
      const completedYesterday = completedByDay[5];
      const completedChange = getChange(completedToday, completedYesterday);

      // LAB WORK
      const labToday = labsByDay[6];
      const labYesterday = labsByDay[5];
      const labChange = getChange(labToday, labYesterday);

      const DAILY_SLOT_CAPACITY = 10;
      const todayOccupationPct = Math.min(100, Math.round((offlineToday / DAILY_SLOT_CAPACITY) * 100));

      const weekConsultations = citasByDay.reduce((a, b) => a + b, 0);
      const weekLabs = labsByDay.reduce((a, b) => a + b, 0);
      const weekInvoices = invoicesByDay.reduce((a, b) => a + b, 0);
      const weekOccupationPct = Math.min(
        100,
        Math.round((weekConsultations / (DAILY_SLOT_CAPACITY * 7)) * 100)
      );

      // SCHEDULED EVENTS (Today & 7-Day counts)
      const scheduledEvents = {
        consultations: offlineToday,
        labs: labToday,
        invoices: invoicesByDay[6],
        donutPercentage: todayOccupationPct,
        week: {
          consultations: weekConsultations,
          labs: weekLabs,
          invoices: weekInvoices,
          donutPercentage: weekOccupationPct,
        }
      };

      // REAL CLINICAL PLANS DONE
      const plansDone = {
        done: completedWeekTotal,
        total: Math.max(completedWeekTotal, weekConsultations),
        percentage: weekConsultations > 0 ? Math.round((completedWeekTotal / weekConsultations) * 100) : 0,
        change: completedChange,
      };

      return {
        offlineWork: {
          total: offlineToday,
          change: offlineChange,
          sparkline: citasByDay,
        },
        onlineWork: {
          total: completedWeekTotal,
          change: completedChange,
          sparkline: completedByDay,
        },
        labWork: {
          total: labToday,
          change: labChange,
          sparkline: labsByDay,
        },
        scheduledEvents,
        plansDone
      };
    }
  });
}

export function useMonthlyPayments(options?: {
  enabled?: boolean;
  doctorId?: string | number | null;
  isDoctorOnly?: boolean;
}) {
  const { user } = useAuthSession();
  const doctorId = options?.doctorId ? Number(options.doctorId) : undefined;
  const isDoctorOnly = options?.isDoctorOnly;

  return useQuery({
    queryKey: ["monthly_payments", user?.id, doctorId, isDoctorOnly],
    enabled: (options?.enabled ?? true) && !!user,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 3000,
    queryFn: async () => {
      // 1. Si el usuario es doctor y no tiene ID médico resuelto (cuenta nueva sin citas),
      // sus ingresos son única y exclusivamente los suyos (inicia en 0).
      if (isDoctorOnly && !doctorId) {
        return { total: 0, paymentsByDay: [] };
      }

      const now = new Date();
      const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // CASO 1: DOCTOR INDIVIDUAL (isDoctorOnly o doctorId presente)
      if (isDoctorOnly && doctorId) {
        // Consultar citas de la clínica (excluyendo datos de prueba) y facturas emitidas
        const [{ data: allCitas }, { data: allRawInvoices }] = await Promise.all([
          supabase
            .from("citas")
            .select("id_cita, id_paciente, id_medico, fecha_hora, motivo, estado")
            .or("motivo.is.null,motivo.not.ilike.%[TEST-LOAD]%")
            .order("fecha_hora", { ascending: false }),
          supabase
            .from("facturas")
            .select(`
              id_factura,
              id_paciente,
              total_general,
              estado_pago,
              fecha_emision,
              detalles_factura (
                id_servicio,
                servicios (nombre_servicio)
              )
            `)
            .order("id_factura", { ascending: false }),
        ]);

        const paidInvoices = (allRawInvoices || []).filter((i) => {
          const isPaid = ["pagado", "pagada", "paid"].includes((i.estado_pago || "").toLowerCase());
          if (!isPaid) return false;
          if (!i.fecha_emision) return false;
          return i.fecha_emision.startsWith(currentMonthPrefix) || new Date(i.fecha_emision) >= startOfMonth;
        });

        // Partición biyectiva determinista: cada factura pagada va a su médico legítimo sin pérdidas ni solapamientos
        const myPaidInvoices = getInvoicesForDoctor(paidInvoices, allCitas || [], doctorId);

        const total = myPaidInvoices.reduce((sum, f) => sum + (Number(f.total_general) || 0), 0);

        const dailyMap: Record<string, number> = {};
        const today = new Date();
        const numDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        for (let i = 1; i <= numDays; i++) {
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, "0");
          const day = String(i).padStart(2, "0");
          dailyMap[`${year}-${month}-${day}`] = 0;
        }

        myPaidInvoices.forEach((inv) => {
          if (!inv.fecha_emision) return;
          const dateStr = inv.fecha_emision.slice(0, 10);
          if (dailyMap[dateStr] !== undefined) {
            dailyMap[dateStr] += Number(inv.total_general) || 0;
          }
        });

        const paymentsByDay = Object.keys(dailyMap)
          .sort()
          .map((date) => ({
            date,
            amount: dailyMap[date],
          }));

        return { total, paymentsByDay };
      }

      // CASO 2: ADMIN Y RECEPCIONISTA (Vista global de la clínica)
      const { data, error } = await supabase
        .from("facturas")
        .select("id_paciente, total_general, estado_pago, fecha_emision")
        .order("id_factura", { ascending: false });

      if (error) throw error;

      const paidInvoices = (data || []).filter((i) => {
        const isPaid = ["pagado", "pagada", "paid"].includes((i.estado_pago || "").toLowerCase());
        if (!isPaid) return false;
        if (!i.fecha_emision) return false;
        return i.fecha_emision.startsWith(currentMonthPrefix) || new Date(i.fecha_emision) >= startOfMonth;
      });

      const total = paidInvoices.reduce((sum, f) => sum + (Number(f.total_general) || 0), 0);

      const dailyMap: Record<string, number> = {};
      const today = new Date();
      const numDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

      for (let i = 1; i <= numDays; i++) {
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(i).padStart(2, "0");
        dailyMap[`${year}-${month}-${day}`] = 0;
      }

      paidInvoices.forEach((inv) => {
        if (!inv.fecha_emision) return;
        const dateStr = inv.fecha_emision.slice(0, 10);
        if (dailyMap[dateStr] !== undefined) {
          dailyMap[dateStr] += Number(inv.total_general) || 0;
        }
      });

      const paymentsByDay = Object.keys(dailyMap)
        .sort()
        .map((date) => ({
          date,
          amount: dailyMap[date],
        }));

      return { total, paymentsByDay };
    },
  });
}

export interface DailyGoal {
  id: string;
  created_at: string;
  date: string;
  title: string;
  target_value: number;
  current_value: number;
}

export function useDailyGoals(dateStr: string, options?: { enabled?: boolean }) {
  const { user } = useAuthSession();
  return useQuery({
    queryKey: ["daily_goals", dateStr, user?.id],
    enabled: (options?.enabled ?? true) && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("date", dateStr)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as DailyGoal[];
    }
  });
}

export function useAddDailyGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goal: { title: string; target_value: number; date: string }) => {
      const { data, error } = await supabase.from("daily_goals").insert([goal]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily_goals", variables.date] });
    }
  });
}

export function useIncrementDailyGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currentValue }: { id: string; currentValue: number; date: string }) => {
      const { data, error } = await supabase
        .from("daily_goals")
        .update({ current_value: currentValue + 1 })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily_goals", variables.date] });
    }
  });
}

export function useDashboardTrends(options?: {
  enabled?: boolean;
  doctorId?: string | number | null;
  isDoctorOnly?: boolean;
}) {
  const { user } = useAuthSession();
  const doctorId = options?.doctorId ? Number(options.doctorId) : undefined;
  const isDoctorOnly = options?.isDoctorOnly;

  return useQuery({
    queryKey: ["dashboard_trends", user?.id, doctorId, isDoctorOnly],
    enabled: (options?.enabled ?? true) && !!user,
    queryFn: async () => {
      const getEmptyMonthly = () => {
        const emptyMonthly: { month: string; amount: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          emptyMonthly.push({
            month: d.toLocaleString('es-ES', { month: 'short', year: '2-digit' }),
            amount: 0,
          });
        }
        return emptyMonthly;
      };

      if (isDoctorOnly && !doctorId) {
        return getEmptyMonthly();
      }

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setDate(1);

      let allowedPatientIds: Set<number> | null = null;
      if (isDoctorOnly || doctorId) {
        const { data: doctorCitas } = await supabase
          .from("citas")
          .select("id_paciente")
          .eq("id_medico", doctorId!);

        const patientIds = (doctorCitas || [])
          .map((c) => c.id_paciente)
          .filter((id): id is number => id !== null && id !== undefined);

        allowedPatientIds = new Set(patientIds);
        if (allowedPatientIds.size === 0) {
          return getEmptyMonthly();
        }
      }

      let query = supabase
        .from("facturas")
        .select("id_paciente, fecha_emision, total_general, estado_pago")
        .gte("fecha_emision", sixMonthsAgo.toISOString());

      if (allowedPatientIds) {
        query = query.in("id_paciente", Array.from(allowedPatientIds));
      }

      const { data: invoices, error } = await query;
      if (error) throw error;

      const monthlyData: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthYear = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
        monthlyData[monthYear] = 0;
      }

      const paidInvoices = invoices?.filter(i => ["pagado", "pagada", "paid"].includes((i.estado_pago || "").toLowerCase())) || [];

      paidInvoices.forEach(inv => {
        if (!inv.fecha_emision) return;
        const d = new Date(inv.fecha_emision);
        const monthYear = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
        if (monthlyData[monthYear] !== undefined) {
          monthlyData[monthYear] += (Number(inv.total_general) || 0);
        }
      });

      return Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount
      }));
    }
  });
}

export function useTopTreatments(options?: {
  enabled?: boolean;
  doctorId?: string | number | null;
  isDoctorOnly?: boolean;
}) {
  const { user } = useAuthSession();
  const doctorId = options?.doctorId ? Number(options.doctorId) : undefined;
  const isDoctorOnly = options?.isDoctorOnly;

  return useQuery({
    queryKey: ["dashboard_top_treatments", user?.id, doctorId, isDoctorOnly],
    enabled: (options?.enabled ?? true) && !!user,
    queryFn: async () => {
      if (isDoctorOnly && !doctorId) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let allowedPatientIds: Set<number> | null = null;
      if (isDoctorOnly || doctorId) {
        const { data: doctorCitas } = await supabase
          .from("citas")
          .select("id_paciente")
          .eq("id_medico", doctorId!);

        const patientIds = (doctorCitas || [])
          .map((c) => c.id_paciente)
          .filter((id): id is number => id !== null && id !== undefined);

        allowedPatientIds = new Set(patientIds);
        if (allowedPatientIds.size === 0) return [];
      }

      let query = supabase
        .from("detalles_factura")
        .select("id_servicio, cantidad, servicios(nombre_servicio), facturas!inner(id_paciente, fecha_emision)")
        .gte("facturas.fecha_emision", thirtyDaysAgo.toISOString());

      if (allowedPatientIds) {
        query = query.in("facturas.id_paciente", Array.from(allowedPatientIds));
      }

      const { data: detalles } = await query;
      if (!detalles || detalles.length === 0) return [];

      const counts: Record<string, { name: string, count: number }> = {};
      detalles.forEach(d => {
        const sId = d.id_servicio;
        if (!sId) return;
        if (!counts[sId]) {
          counts[sId] = { name: (d.servicios as any)?.nombre_servicio || "Tratamiento", count: 0 };
        }
        counts[sId].count += (d.cantidad || 1);
      });

      return Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }
  });
}
