import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateSalesReport } from "@/lib/utils/generateSalesReport";
import { generatePatientsReport } from "@/lib/utils/generatePatientsReport";
import { generateAppointmentsReport } from "@/lib/utils/generateAppointmentsReport";

export function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0).toISOString();
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
  const filterMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  return { startOfMonth, endOfMonth, filterMonth };
}

export async function downloadMonthlySalesReport() {
  try {
    toast.loading("Generando reporte del mes...", { id: "report_sales" });
    const { startOfMonth, endOfMonth, filterMonth } = getCurrentMonthRange();
    const { data, error } = await supabase
      .from("facturas")
      .select(`id_factura, id_paciente, fecha_emision, subtotal, monto_paciente, total_general, estado_pago, pacientes (nombre, apellido)`)
      .gte("fecha_emision", startOfMonth)
      .lte("fecha_emision", endOfMonth)
      .order("fecha_emision", { ascending: false });

    if (error) throw error;
    const formatted = (data || []).map((d: any) => ({
      ...d,
      paciente_nombre: d.pacientes ? `${d.pacientes.nombre} ${d.pacientes.apellido}` : "",
    }));
    await generateSalesReport(formatted, filterMonth);
    toast.success("Reporte del mes generado", { id: "report_sales" });
  } catch {
    toast.error("Error al generar reporte", { id: "report_sales" });
  }
}

export async function downloadGeneralSalesReport() {
  try {
    toast.loading("Generando reporte general...", { id: "report_sales" });
    const { data, error } = await supabase
      .from("facturas")
      .select(`id_factura, id_paciente, fecha_emision, subtotal, monto_paciente, total_general, estado_pago, pacientes (nombre, apellido)`)
      .order("fecha_emision", { ascending: false });

    if (error) throw error;
    const formatted = (data || []).map((d: any) => ({
      ...d,
      paciente_nombre: d.pacientes ? `${d.pacientes.nombre} ${d.pacientes.apellido}` : "",
    }));
    await generateSalesReport(formatted, "");
    toast.success("Reporte histórico generado", { id: "report_sales" });
  } catch {
    toast.error("Error al generar reporte", { id: "report_sales" });
  }
}

export async function downloadPatientsReport() {
  try {
    toast.loading("Generando reporte del mes...", { id: "report_patients" });
    const { startOfMonth, endOfMonth, filterMonth } = getCurrentMonthRange();

    const { data, error } = await supabase
      .from("pacientes")
      .select(`id_paciente, nombre, apellido, documento_identidad, telefono, creado_en`)
      .gte("creado_en", startOfMonth)
      .lte("creado_en", endOfMonth)
      .order("creado_en", { ascending: false });

    if (error) throw error;

    await generatePatientsReport(data || [], filterMonth);
    toast.success("Reporte del mes generado", { id: "report_patients" });
  } catch {
    toast.error("Error al generar reporte", { id: "report_patients" });
  }
}

export async function downloadAllPatientsReport() {
  try {
    toast.loading("Generando reporte histórico...", { id: "report_patients" });
    const { data, error } = await supabase
      .from("pacientes")
      .select(`id_paciente, nombre, apellido, documento_identidad, telefono, creado_en`)
      .order("creado_en", { ascending: false });

    if (error) throw error;
    await generatePatientsReport(data || [], "");
    toast.success("Reporte histórico generado", { id: "report_patients" });
  } catch {
    toast.error("Error al generar reporte", { id: "report_patients" });
  }
}

export async function downloadAppointmentsReport() {
  try {
    toast.loading("Generando reporte del mes...", { id: "report_apps" });
    const { startOfMonth, endOfMonth, filterMonth } = getCurrentMonthRange();

    const { data, error } = await supabase
      .from("citas")
      .select(`id_cita, fecha_hora, estado, motivo, pacientes (nombre, apellido), medicos (nombre, apellido)`)
      .gte("fecha_hora", startOfMonth)
      .lte("fecha_hora", endOfMonth)
      .order("fecha_hora", { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((d: any) => ({
      ...d,
      paciente_nombre: d.pacientes ? `${d.pacientes.nombre} ${d.pacientes.apellido}` : "",
      medico_nombre: d.medicos ? `Dr(a). ${d.medicos.nombre} ${d.medicos.apellido}` : "",
    }));

    await generateAppointmentsReport(formatted, filterMonth);
    toast.success("Reporte del mes generado", { id: "report_apps" });
  } catch {
    toast.error("Error al generar reporte", { id: "report_apps" });
  }
}

export async function downloadAllAppointmentsReport() {
  try {
    toast.loading("Generando reporte histórico...", { id: "report_apps" });
    const { data, error } = await supabase
      .from("citas")
      .select(`id_cita, fecha_hora, estado, motivo, pacientes (nombre, apellido), medicos (nombre, apellido)`)
      .order("fecha_hora", { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((d: any) => ({
      ...d,
      paciente_nombre: d.pacientes ? `${d.pacientes.nombre} ${d.pacientes.apellido}` : "",
      medico_nombre: d.medicos ? `Dr(a). ${d.medicos.nombre} ${d.medicos.apellido}` : "",
    }));

    await generateAppointmentsReport(formatted, "");
    toast.success("Reporte histórico generado", { id: "report_apps" });
  } catch {
    toast.error("Error al generar reporte", { id: "report_apps" });
  }
}
