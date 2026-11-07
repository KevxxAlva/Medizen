import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateSalesReport } from "@/lib/utils/generateSalesReport";
import { generatePatientsReport } from "@/lib/utils/generatePatientsReport";
import { generateAppointmentsReport } from "@/lib/utils/generateAppointmentsReport";
import { getInvoicesForDoctor } from "@/lib/utils/invoiceDoctorPartition";

export interface ReportFilterOptions {
  doctorId?: string | number | null;
  isDoctorOnly?: boolean;
}

export function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const filterMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  const startOfMonth = `${filterMonth}-01T00:00:00.000Z`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endOfMonth = `${filterMonth}-${String(lastDay).padStart(2, "0")}T23:59:59.999Z`;
  return { startOfMonth, endOfMonth, filterMonth };
}

async function getDoctorPatientIds(doctorId: number): Promise<Set<number>> {
  const [citasRes, consultasRes, hcRes, medicosCountRes] = await Promise.all([
    supabase.from("citas").select("id_paciente").eq("id_medico", doctorId),
    supabase.from("consultas").select("id_paciente").eq("id_medico", doctorId),
    supabase.from("historias_clinicas").select("id_paciente, datos_extras"),
    supabase.from("medicos").select("id_medico", { count: "exact", head: true }),
  ]);

  const ids = new Set<number>();
  (citasRes.data || []).forEach((c) => {
    if (c.id_paciente) ids.add(Number(c.id_paciente));
  });
  (consultasRes.data || []).forEach((c) => {
    if (c.id_paciente) ids.add(Number(c.id_paciente));
  });
  (hcRes.data || []).forEach((hc: any) => {
    const assigned = hc.datos_extras?.assigned_doctor_id;
    if (assigned && String(assigned) === String(doctorId) && hc.id_paciente) {
      ids.add(Number(hc.id_paciente));
    }
  });

  if ((medicosCountRes.count ?? 0) <= 1) {
    const { data: allP } = await supabase.from("pacientes").select("id_paciente");
    (allP || []).forEach((p) => ids.add(Number(p.id_paciente)));
  }

  return ids;
}

export async function downloadMonthlySalesReport(options?: ReportFilterOptions) {
  try {
    toast.loading("Generando reporte del mes...", { id: "report_sales" });
    const { filterMonth } = getCurrentMonthRange();
    const doctorId = options?.doctorId ? Number(options.doctorId) : undefined;
    const isDoctor = Boolean(doctorId && options?.isDoctorOnly);

    const now = new Date();
    const currentMonthPrefix = filterMonth;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [citasRes, facturasRes, medicosRes] = await Promise.all([
      isDoctor
        ? supabase
            .from("citas")
            .select("id_cita, id_paciente, id_medico, fecha_hora, motivo, estado")
            .or("motivo.is.null,motivo.not.ilike.%[TEST-LOAD]%")
            .order("fecha_hora", { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase
        .from("facturas")
        .select(`
          id_factura,
          id_paciente,
          fecha_emision,
          subtotal,
          monto_paciente,
          total_general,
          estado_pago,
          pacientes (nombre, apellido),
          pagos (id_pago, metodo_pago, referencia, monto_pagado, fecha_pago)
        `)
        .order("id_factura", { ascending: false }),
      doctorId
        ? supabase.from("medicos").select("id_medico, nombre, apellido")
        : Promise.resolve({ data: [] }),
    ]);

    if (facturasRes.error) throw facturasRes.error;

    const allRawInvoices = facturasRes.data || [];
    const allCitas = citasRes.data || [];

    // Facturas del mes actual con la misma regla determinista de useMonthlyPayments
    const monthlyInvoices = allRawInvoices.filter((i: any) => {
      if (!i.fecha_emision) return false;
      return i.fecha_emision.startsWith(currentMonthPrefix) || new Date(i.fecha_emision) >= startOfMonth;
    });

    let targetInvoices: any[] = [];
    if (isDoctor && doctorId) {
      // 1. Partición biyectiva de facturas pagadas (idéntica a useMonthlyPayments para coincidencia de ingresos)
      const paidInvoices = monthlyInvoices.filter((i: any) =>
        ["pagado", "pagada", "paid"].includes((i.estado_pago || "").toLowerCase())
      );
      const myPaidInvoices = getInvoicesForDoctor(paidInvoices, allCitas, doctorId);

      // 2. Partición de facturas pendientes si existieran
      const pendingInvoices = monthlyInvoices.filter((i: any) =>
        !["pagado", "pagada", "paid"].includes((i.estado_pago || "").toLowerCase())
      );
      const myPendingInvoices = pendingInvoices.length > 0
        ? getInvoicesForDoctor(pendingInvoices, allCitas, doctorId)
        : [];

      targetInvoices = [...myPaidInvoices, ...myPendingInvoices];
    } else {
      targetInvoices = monthlyInvoices;
    }

    const docMeta = (medicosRes.data || []).find((m: any) => Number(m.id_medico) === doctorId);
    const doctorName = docMeta ? `Dr(a). ${docMeta.nombre} ${docMeta.apellido || ""}`.trim() : undefined;

    const formatted = targetInvoices.map((d: any) => {
      const pago = Array.isArray(d.pagos) ? d.pagos[0] : d.pagos;
      return {
        ...d,
        paciente_nombre: d.pacientes ? `${d.pacientes.nombre} ${d.pacientes.apellido}` : "Paciente",
        metodo_pago: pago?.metodo_pago || "—",
        referencia: pago?.referencia || "—",
      };
    });

    await generateSalesReport(formatted, filterMonth, undefined, doctorName);
    toast.success("Reporte del mes generado", { id: "report_sales" });
  } catch (err) {
    console.error("Error generating sales report:", err);
    toast.error("Error al generar reporte", { id: "report_sales" });
  }
}

export async function downloadGeneralSalesReport(options?: ReportFilterOptions) {
  try {
    toast.loading("Generando reporte general...", { id: "report_sales" });
    const doctorId = options?.doctorId ? Number(options.doctorId) : undefined;
    const isDoctor = Boolean(doctorId && options?.isDoctorOnly);

    const [citasRes, facturasRes, medicosRes] = await Promise.all([
      isDoctor
        ? supabase
            .from("citas")
            .select("id_cita, id_paciente, id_medico, fecha_hora, motivo, estado")
            .or("motivo.is.null,motivo.not.ilike.%[TEST-LOAD]%")
            .order("fecha_hora", { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase
        .from("facturas")
        .select(`
          id_factura,
          id_paciente,
          fecha_emision,
          subtotal,
          monto_paciente,
          total_general,
          estado_pago,
          pacientes (nombre, apellido),
          pagos (id_pago, metodo_pago, referencia, monto_pagado, fecha_pago)
        `)
        .order("id_factura", { ascending: false }),
      doctorId
        ? supabase.from("medicos").select("id_medico, nombre, apellido")
        : Promise.resolve({ data: [] }),
    ]);

    if (facturasRes.error) throw facturasRes.error;

    const allInvoices = facturasRes.data || [];
    const allCitas = citasRes.data || [];

    let targetInvoices: any[] = [];
    if (isDoctor && doctorId) {
      const paidInvoices = allInvoices.filter((i: any) =>
        ["pagado", "pagada", "paid"].includes((i.estado_pago || "").toLowerCase())
      );
      const myPaidInvoices = getInvoicesForDoctor(paidInvoices, allCitas, doctorId);

      const pendingInvoices = allInvoices.filter((i: any) =>
        !["pagado", "pagada", "paid"].includes((i.estado_pago || "").toLowerCase())
      );
      const myPendingInvoices = pendingInvoices.length > 0
        ? getInvoicesForDoctor(pendingInvoices, allCitas, doctorId)
        : [];

      targetInvoices = [...myPaidInvoices, ...myPendingInvoices];
    } else {
      targetInvoices = allInvoices;
    }

    const docMeta = (medicosRes.data || []).find((m: any) => Number(m.id_medico) === doctorId);
    const doctorName = docMeta ? `Dr(a). ${docMeta.nombre} ${docMeta.apellido || ""}`.trim() : undefined;

    const formatted = targetInvoices.map((d: any) => {
      const pago = Array.isArray(d.pagos) ? d.pagos[0] : d.pagos;
      return {
        ...d,
        paciente_nombre: d.pacientes ? `${d.pacientes.nombre} ${d.pacientes.apellido}` : "Paciente",
        metodo_pago: pago?.metodo_pago || "—",
        referencia: pago?.referencia || "—",
      };
    });

    await generateSalesReport(formatted, "", undefined, doctorName);
    toast.success("Reporte histórico generado", { id: "report_sales" });
  } catch (err) {
    console.error("Error generating general sales report:", err);
    toast.error("Error al generar reporte", { id: "report_sales" });
  }
}

export async function downloadPatientsReport(options?: ReportFilterOptions) {
  try {
    toast.loading("Generando reporte del mes...", { id: "report_patients" });
    const { endOfMonth, filterMonth } = getCurrentMonthRange();
    const doctorId = options?.doctorId ? Number(options.doctorId) : undefined;

    const [patientsRes, doctorPatientIds, medicosRes] = await Promise.all([
      supabase
        .from("pacientes")
        .select(`id_paciente, nombre, apellido, documento_identidad, telefono, creado_en`)
        .gte("creado_en", `${filterMonth}-01T00:00:00.000Z`)
        .lte("creado_en", endOfMonth)
        .order("creado_en", { ascending: false }),
      doctorId ? getDoctorPatientIds(doctorId) : Promise.resolve(null),
      doctorId
        ? supabase.from("medicos").select("id_medico, nombre, apellido")
        : Promise.resolve({ data: [] }),
    ]);

    if (patientsRes.error) throw patientsRes.error;

    let patients = (patientsRes.data || []).filter(
      (p: any) => p.creado_en && p.creado_en.startsWith(filterMonth)
    );

    if (doctorId && doctorPatientIds) {
      patients = patients.filter((p: any) => doctorPatientIds.has(Number(p.id_paciente)));
    }

    const docMeta = (medicosRes.data || []).find((m: any) => Number(m.id_medico) === doctorId);
    const doctorName = docMeta ? `Dr(a). ${docMeta.nombre} ${docMeta.apellido || ""}`.trim() : undefined;

    await generatePatientsReport(patients, filterMonth, doctorName);
    toast.success("Reporte del mes generado", { id: "report_patients" });
  } catch (err) {
    console.error("Error generating patients report:", err);
    toast.error("Error al generar reporte", { id: "report_patients" });
  }
}

export async function downloadAllPatientsReport(options?: ReportFilterOptions) {
  try {
    toast.loading("Generando reporte histórico...", { id: "report_patients" });
    const doctorId = options?.doctorId ? Number(options.doctorId) : undefined;

    const [patientsRes, doctorPatientIds, medicosRes] = await Promise.all([
      supabase
        .from("pacientes")
        .select(`id_paciente, nombre, apellido, documento_identidad, telefono, creado_en`)
        .order("creado_en", { ascending: false }),
      doctorId ? getDoctorPatientIds(doctorId) : Promise.resolve(null),
      doctorId
        ? supabase.from("medicos").select("id_medico, nombre, apellido")
        : Promise.resolve({ data: [] }),
    ]);

    if (patientsRes.error) throw patientsRes.error;

    let patients = patientsRes.data || [];
    if (doctorId && doctorPatientIds) {
      patients = patients.filter((p: any) => doctorPatientIds.has(Number(p.id_paciente)));
    }

    const docMeta = (medicosRes.data || []).find((m: any) => Number(m.id_medico) === doctorId);
    const doctorName = docMeta ? `Dr(a). ${docMeta.nombre} ${docMeta.apellido || ""}`.trim() : undefined;

    await generatePatientsReport(patients, "", doctorName);
    toast.success("Reporte histórico generado", { id: "report_patients" });
  } catch (err) {
    console.error("Error generating all patients report:", err);
    toast.error("Error al generar reporte", { id: "report_patients" });
  }
}

export async function downloadAppointmentsReport(options?: ReportFilterOptions) {
  try {
    toast.loading("Generando reporte del mes...", { id: "report_apps" });
    const { endOfMonth, filterMonth } = getCurrentMonthRange();
    const doctorId = options?.doctorId ? Number(options.doctorId) : undefined;

    let query = supabase
      .from("citas")
      .select(`id_cita, fecha_hora, estado, motivo, id_medico, pacientes (nombre, apellido)`)
      .or("motivo.is.null,motivo.not.ilike.%[TEST-LOAD]%")
      .gte("fecha_hora", `${filterMonth}-01`)
      .lte("fecha_hora", endOfMonth)
      .order("fecha_hora", { ascending: false });

    if (doctorId) {
      query = query.eq("id_medico", doctorId);
    }

    const [{ data, error }, { data: allMedicos }] = await Promise.all([
      query,
      supabase.from("medicos").select("id_medico, nombre, apellido"),
    ]);

    if (error) throw error;

    const doctorMap = new Map<number, string>(
      (allMedicos || []).map((m: any) => [Number(m.id_medico), `Dr(a). ${m.nombre} ${m.apellido}`.trim()])
    );

    let appointments = (data || []).filter((c: any) => {
      if (!c.fecha_hora || !c.fecha_hora.startsWith(filterMonth)) return false;
      if (doctorId && Number(c.id_medico) !== doctorId) return false;
      return true;
    });

    const formatted = appointments.map((d: any) => {
      const docNameFromMap = d.id_medico ? doctorMap.get(Number(d.id_medico)) : undefined;
      return {
        ...d,
        paciente_nombre: d.pacientes ? `${d.pacientes.nombre} ${d.pacientes.apellido}` : "",
        medico_nombre: docNameFromMap || "—",
      };
    });

    const resolvedDoctorName = doctorId ? doctorMap.get(doctorId) : undefined;
    await generateAppointmentsReport(formatted, filterMonth, resolvedDoctorName);
    toast.success("Reporte del mes generado", { id: "report_apps" });
  } catch (err) {
    console.error("Error generating appointments report:", err);
    toast.error("Error al generar reporte", { id: "report_apps" });
  }
}

export async function downloadAllAppointmentsReport(options?: ReportFilterOptions) {
  try {
    toast.loading("Generando reporte histórico...", { id: "report_apps" });
    const doctorId = options?.doctorId ? Number(options.doctorId) : undefined;

    let query = supabase
      .from("citas")
      .select(`id_cita, fecha_hora, estado, motivo, id_medico, pacientes (nombre, apellido)`)
      .or("motivo.is.null,motivo.not.ilike.%[TEST-LOAD]%")
      .order("fecha_hora", { ascending: false });

    if (doctorId) {
      query = query.eq("id_medico", doctorId);
    }

    const [{ data, error }, { data: allMedicos }] = await Promise.all([
      query,
      supabase.from("medicos").select("id_medico, nombre, apellido"),
    ]);

    if (error) throw error;

    const doctorMap = new Map<number, string>(
      (allMedicos || []).map((m: any) => [Number(m.id_medico), `Dr(a). ${m.nombre} ${m.apellido}`.trim()])
    );

    let appointments = data || [];
    if (doctorId) {
      appointments = appointments.filter((c: any) => Number(c.id_medico) === doctorId);
    }

    const formatted = appointments.map((d: any) => {
      const docNameFromMap = d.id_medico ? doctorMap.get(Number(d.id_medico)) : undefined;
      return {
        ...d,
        paciente_nombre: d.pacientes ? `${d.pacientes.nombre} ${d.pacientes.apellido}` : "",
        medico_nombre: docNameFromMap || "—",
      };
    });

    const resolvedDoctorName = doctorId ? doctorMap.get(doctorId) : undefined;
    await generateAppointmentsReport(formatted, "", resolvedDoctorName);
    toast.success("Reporte histórico generado", { id: "report_apps" });
  } catch (err) {
    console.error("Error generating all appointments report:", err);
    toast.error("Error al generar reporte", { id: "report_apps" });
  }
}
