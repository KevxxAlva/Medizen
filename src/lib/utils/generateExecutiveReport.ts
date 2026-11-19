import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getClinicPdfConfig, drawPdfHeader, drawPdfWatermark, drawPdfFooter } from "./pdfConfig";
import { generateSalesReport } from "./generateSalesReport";
import { generatePatientsReport } from "./generatePatientsReport";
import { generateAppointmentsReport } from "./generateAppointmentsReport";
import { formatBs } from "@/hooks/useExchangeRate";

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export interface ExecutiveReportPayload {
  from: string;
  to: string;
  rate: number;
  stats: {
    total: number;
    completed: number;
    scheduled: number;
    cancelled: number;
    income: number;
    newPatients: number;
  };
  marketingData: Array<{
    channel: string;
    count: number;
    percentage: string;
  }>;
  monthlyData: Array<{
    month: string;
    amount: number;
  }>;
}

export async function generateExecutiveReport({
  from,
  to,
  rate,
  stats,
  marketingData,
  monthlyData,
}: ExecutiveReportPayload) {
  try {
    toast.loading("Generando Reporte Ejecutivo PDF...", { id: "exec_pdf" });
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const config = await getClinicPdfConfig();
    drawPdfWatermark(doc, config, pageWidth, pageHeight);
    drawPdfHeader(doc, config, pageWidth);

    const today = new Date();
    const topDay = String(today.getDate()).padStart(2, "0");
    const topMonth = String(today.getMonth() + 1).padStart(2, "0");
    const topYear = String(today.getFullYear());

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 50);
    doc.text(
      `Fecha de Emisión: ${topDay}/${topMonth}/${topYear}  |  Tasa BCV: Bs. ${rate.toFixed(2)}`,
      pageWidth - 40,
      152,
      { align: "right" }
    );

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(13.5);
    doc.setTextColor(0);
    doc.text("REPORTE ANALÍTICO Y EJECUTIVO DE GESTIÓN", pageWidth / 2, 185, {
      align: "center",
    });

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(70, 70, 80);
    doc.text(`Período Evaluado: ${from}  al  ${to}`, pageWidth / 2, 202, {
      align: "center",
    });

    // Section 1: KPIs
    doc.setTextColor(30, 30, 40);
    doc.setFontSize(11);
    doc.setFont(config.customFontFamily, "bold");
    doc.text("1. Resumen de Indicadores Clave del Período", 40, 232);

    autoTable(doc, {
      startY: 240,
      head: [["Indicador Clave", "Valor Registrado", "Equivalente BCV", "Categoría"]],
      body: [
        [
          "Ingresos Facturados (Consultas Completadas)",
          `$${stats.income.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`,
          formatBs(stats.income, rate),
          "Financiero",
        ],
        ["Pacientes Nuevos Registrados", String(stats.newPatients), "—", "Crecimiento"],
        ["Citas Totales Agendadas", String(stats.total), "—", "Operativo"],
        ["Consultas Completadas Exitosamente", String(stats.completed), "—", "Clínico"],
        ["Citas Programadas / Pendientes", String(stats.scheduled), "—", "Agenda"],
        ["Citas Canceladas", String(stats.cancelled), "—", "Auditoría"],
      ],
      theme: "grid",
      headStyles: { fillColor: [67, 97, 238], textColor: 255, font: config.customFontFamily },
      styles: { font: config.customFontFamily, fontSize: 9, cellPadding: 5 },
      margin: { left: 40, right: 40 },
    });

    // Section 2: Marketing Channels
    const yAcq = (doc as any).lastAutoTable.finalY + 22;
    doc.setFontSize(11);
    doc.setFont(config.customFontFamily, "bold");
    doc.text("2. Canales de Adquisición de Pacientes (Marketing)", 40, yAcq);

    autoTable(doc, {
      startY: yAcq + 8,
      head: [["Canal de Captación", "Consultas Registradas", "Participación (%)"]],
      body:
        marketingData.length > 0
          ? marketingData.map((d) => [d.channel, String(d.count), `${d.percentage}%`])
          : [["Sin datos registrados en este período", "0", "0%"]],
      theme: "grid",
      headStyles: { fillColor: [67, 97, 238], textColor: 255, font: config.customFontFamily },
      styles: { font: config.customFontFamily, fontSize: 9, cellPadding: 5 },
      margin: { left: 40, right: 40 },
    });

    // Section 3: Monthly Breakdown
    const yMonthly = (doc as any).lastAutoTable.finalY + 22;
    doc.setFontSize(11);
    doc.setFont(config.customFontFamily, "bold");
    doc.text("3. Evolución Histórica de Ingresos (Últimos 12 Meses)", 40, yMonthly);

    autoTable(doc, {
      startY: yMonthly + 8,
      head: [["Mes / Año", "Total Facturado (USD)", "Equivalente Referencial (Bs.)"]],
      body:
        monthlyData.length > 0
          ? monthlyData.map((d) => {
              const [yr, mn] = d.month.split("-");
              return [
                `${MONTHS_ES[parseInt(mn, 10) - 1] || mn} ${yr}`,
                `$${d.amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`,
                formatBs(d.amount, rate),
              ];
            })
          : [["Sin registros históricos", "$0.00", "Bs. 0,00"]],
      theme: "grid",
      headStyles: { fillColor: [67, 97, 238], textColor: 255, font: config.customFontFamily },
      styles: { font: config.customFontFamily, fontSize: 9, cellPadding: 5 },
      margin: { left: 40, right: 40 },
    });

    drawPdfFooter(doc, config, pageWidth, pageHeight);
    doc.save(`Reporte_Ejecutivo_${from}_a_${to}.pdf`);
    toast.success("Reporte Ejecutivo descargado con éxito", { id: "exec_pdf" });
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Error al exportar reporte", {
      id: "exec_pdf",
    });
  }
}

export async function exportSalesReportByRange(from: string, to: string, rate: number) {
  try {
    toast.loading("Generando Reporte de Ventas y Facturación...", { id: "sales_range_pdf" });
    const startIso = `${from}T00:00:00.000Z`;
    const endIso = `${to}T23:59:59.999Z`;

    const { data, error } = await supabase
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
        pagos (metodo_pago, referencia)
      `)
      .gte("fecha_emision", startIso)
      .lte("fecha_emision", endIso)
      .order("id_factura", { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((f: any) => {
      const pago = Array.isArray(f.pagos) ? f.pagos[0] : f.pagos;
      return {
        id_factura: f.id_factura,
        paciente_nombre: f.pacientes
          ? `${f.pacientes.nombre} ${f.pacientes.apellido}`
          : "Paciente General",
        fecha_emision: f.fecha_emision,
        total_general: Number(f.total_general) || 0,
        estado_pago: f.estado_pago || "Pendiente",
        metodo_pago: pago?.metodo_pago || null,
        referencia: pago?.referencia || null,
      };
    });

    await generateSalesReport(formatted, "", rate);
    toast.success("Reporte de Ventas PDF descargado", { id: "sales_range_pdf" });
  } catch {
    toast.error("Error al generar el Reporte de Ventas", { id: "sales_range_pdf" });
  }
}

export async function exportAppointmentsReportByRange(from: string, to: string) {
  try {
    toast.loading("Generando Reporte de Citas y Consultas...", { id: "apps_range_pdf" });
    const startIso = `${from}T00:00:00.000Z`;
    const endIso = `${to}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from("citas")
      .select(`
        id_cita,
        fecha_hora,
        estado,
        motivo,
        pacientes (nombre, apellido),
        medicos (nombre, apellido)
      `)
      .gte("fecha_hora", startIso)
      .lte("fecha_hora", endIso)
      .order("fecha_hora", { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((d: any) => ({
      ...d,
      paciente_nombre: d.pacientes ? `${d.pacientes.nombre} ${d.pacientes.apellido}` : "—",
      medico_nombre: d.medicos ? `Dr(a). ${d.medicos.nombre} ${d.medicos.apellido}` : "—",
    }));

    await generateAppointmentsReport(formatted, "");
    toast.success("Reporte de Citas PDF descargado", { id: "apps_range_pdf" });
  } catch {
    toast.error("Error al generar el Reporte de Citas", { id: "apps_range_pdf" });
  }
}

export async function exportPatientsReportByRange(from: string, to: string) {
  try {
    toast.loading("Generando Padrón de Pacientes...", { id: "patients_range_pdf" });
    const startIso = `${from}T00:00:00.000Z`;
    const endIso = `${to}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from("pacientes")
      .select("id_paciente, nombre, apellido, documento_identidad, telefono, creado_en")
      .gte("creado_en", startIso)
      .lte("creado_en", endIso)
      .order("creado_en", { ascending: false });

    if (error) throw error;

    await generatePatientsReport(data || [], "");
    toast.success("Padrón de Pacientes PDF descargado", { id: "patients_range_pdf" });
  } catch {
    toast.error("Error al generar el Padrón de Pacientes", { id: "patients_range_pdf" });
  }
}

export function exportAppointmentsCsv(
  appointments: Array<{
    scheduled_at: string;
    patient_name?: string;
    doctor_id?: string;
    reason?: string | null;
    status: string;
    price?: number | null;
  }>,
  doctorMap: Map<string, string>,
  from: string,
  to: string,
  rate: number
) {
  const headers = [
    "Fecha y Hora",
    "Paciente",
    "Médico",
    "Motivo / Servicio",
    "Estado",
    "Monto USD ($)",
    "Equivalente Bs. (BCV)",
  ];

  const rows = appointments.map((a) => {
    const usd = Number(a.price) || 0;
    const bs = (usd * rate).toFixed(2);
    const doctor = (a.doctor_id && doctorMap.get(a.doctor_id)) || "Sin asignar";
    return [
      new Date(a.scheduled_at).toLocaleString("es-VE"),
      `"${(a.patient_name || "Paciente").replace(/"/g, '""')}"`,
      `"${doctor.replace(/"/g, '""')}"`,
      `"${(a.reason || "Consulta").replace(/"/g, '""')}"`,
      a.status,
      usd.toFixed(2),
      bs,
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Reporte_Operativo_${from}_a_${to}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success("Archivo Excel / CSV descargado exitosamente");
}
