import type { DoctorOption } from "@/lib/api/profiles";
import type { InvoiceRecord } from "@/components/finance/useSalesInvoices";
import { getClinicPdfConfig, drawPdfHeader, drawPdfFooter } from "@/lib/utils/pdfConfig";
import { toast } from "sonner";

const COMMISSION_STORAGE_KEY = "medizen_doctor_commissions";

export const bsAmountFormatter = new Intl.NumberFormat("es-VE", {
  maximumFractionDigits: 2,
});

export interface DoctorSettlementRow {
  doctor: DoctorOption;
  pct: number;
  paidCount: number;
  pendingCount: number;
  grossPaidUsd: number;
  pendingUsd: number;
  doctorNetUsd: number;
  clinicNetUsd: number;
  invoices: InvoiceRecord[];
  paidInvoices: InvoiceRecord[];
}

export interface SettlementTotals {
  grossPaidUsd: number;
  doctorNetUsd: number;
  clinicNetUsd: number;
  pendingUsd: number;
  paidCount: number;
}

export function readDoctorCommissions(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COMMISSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeDoctorCommissions(map: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COMMISSION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function resolveCommissionPct(
  commissions: Record<string, number>,
  docId: string,
): number {
  const val = commissions[docId];
  return typeof val === "number" && val >= 0 && val <= 100 ? val : 70;
}

export function isInvoicePaid(estadoPago?: string | null): boolean {
  return ["pagado", "pagada", "paid"].includes((estadoPago || "").toLowerCase());
}

function isInvoicePending(estadoPago?: string | null): boolean {
  return !["pagado", "pagada", "paid", "cancelado", "cancelada"].includes(
    (estadoPago || "").toLowerCase(),
  );
}

export function buildDoctorSettlements(params: {
  visibleDoctors: DoctorOption[];
  facturas: InvoiceRecord[];
  invoiceToDoctorMap: Map<number, string>;
  selectedMonth: string;
  commissions: Record<string, number>;
}): DoctorSettlementRow[] {
  const { visibleDoctors, facturas, invoiceToDoctorMap, selectedMonth, commissions } = params;

  return visibleDoctors.map((doc) => {
    const docInvoices = facturas.filter((f) => {
      const assignedDoc = invoiceToDoctorMap.get(Number(f.id_factura));
      if (String(assignedDoc) !== String(doc.id)) return false;
      if (selectedMonth && !(f.fecha_emision || "").startsWith(selectedMonth)) return false;
      return true;
    });

    const paidInvoices = docInvoices.filter((f) => isInvoicePaid(f.estado_pago));
    const pendingInvoices = docInvoices.filter((f) => isInvoicePending(f.estado_pago));

    const grossPaidUsd = paidInvoices.reduce(
      (acc, f) => acc + (Number(f.total_general) || 0),
      0,
    );
    const pendingUsd = pendingInvoices.reduce(
      (acc, f) => acc + (Number(f.total_general) || 0),
      0,
    );

    const pct = resolveCommissionPct(commissions, String(doc.id));
    const doctorNetUsd = (grossPaidUsd * pct) / 100;
    const clinicNetUsd = grossPaidUsd - doctorNetUsd;

    return {
      doctor: doc,
      pct,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      grossPaidUsd,
      pendingUsd,
      doctorNetUsd,
      clinicNetUsd,
      invoices: docInvoices,
      paidInvoices,
    };
  });
}

export function computeSettlementTotals(settlements: DoctorSettlementRow[]): SettlementTotals {
  return settlements.reduce(
    (acc, s) => ({
      grossPaidUsd: acc.grossPaidUsd + s.grossPaidUsd,
      doctorNetUsd: acc.doctorNetUsd + s.doctorNetUsd,
      clinicNetUsd: acc.clinicNetUsd + s.clinicNetUsd,
      pendingUsd: acc.pendingUsd + s.pendingUsd,
      paidCount: acc.paidCount + s.paidCount,
    }),
    { grossPaidUsd: 0, doctorNetUsd: 0, clinicNetUsd: 0, pendingUsd: 0, paidCount: 0 },
  );
}

export async function exportDoctorSettlementPdf(
  row: DoctorSettlementRow,
  selectedMonth: string,
  rate: number,
) {
  try {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const config = await getClinicPdfConfig();

    drawPdfHeader(doc, config, pageWidth);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("COMPROBANTE DE LIQUIDACIÓN DE HONORARIOS MÉDICOS", pageWidth / 2, 175, {
      align: "center",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(
      `Especialista: Dr(a). ${row.doctor.full_name}   |   Especialidad: ${row.doctor.specialty || "Medicina Especializada"}`,
      40,
      200,
    );
    doc.text(
      `Período Liquidado: ${selectedMonth || "Histórico Completo"}   |   Esquema Honorarios: ${row.pct}% Médico / ${100 - row.pct}% Clínica`,
      40,
      215,
    );

    const tableRows = row.paidInvoices.map((inv) => [
      `INV-${String(inv.id_factura).padStart(4, "0")}`,
      inv.fecha_emision ? inv.fecha_emision.slice(0, 10) : "—",
      inv.paciente_nombre,
      inv.concepto || "Consulta Médica",
      `$${Number(inv.total_general || 0).toFixed(2)}`,
      `$${((Number(inv.total_general || 0) * row.pct) / 100).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 232,
      head: [
        [
          "Factura",
          "Fecha",
          "Paciente",
          "Servicio Realizado",
          "Cobrado",
          `Honorario (${row.pct}%)`,
        ],
      ],
      body:
        tableRows.length > 0
          ? tableRows
          : [["—", "—", "Sin facturas cobradas en el período", "—", "$0.00", "$0.00"]],
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 5 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
      margin: { left: 40, right: 40 },
    });

    const finalY = ((doc as any).lastAutoTable?.finalY || 300) + 25;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(`Total Facturado Cobrado: $${row.grossPaidUsd.toFixed(2)} USD`, 40, finalY);
    doc.text(
      `Neto a Liquidar al Especialista (${row.pct}%): $${row.doctorNetUsd.toFixed(2)} USD (Bs. ${(row.doctorNetUsd * rate).toFixed(2)})`,
      40,
      finalY + 18,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(
      `Retención Operativa Clínica (${100 - row.pct}%): $${row.clinicNetUsd.toFixed(2)} USD`,
      40,
      finalY + 34,
    );

    const signY = Math.min(pageHeight - 95, finalY + 95);
    doc.line(70, signY, 230, signY);
    doc.line(pageWidth - 230, signY, pageWidth - 70, signY);
    doc.setFontSize(8.5);
    doc.text("Administración / Caja", 150, signY + 14, { align: "center" });
    doc.text(`Dr(a). ${row.doctor.full_name}`, pageWidth - 150, signY + 14, {
      align: "center",
    });

    drawPdfFooter(doc, config, pageWidth, pageHeight);
    doc.save(
      `Liquidacion_${(row.doctor.full_name || "Medico").replace(/\s+/g, "_")}_${selectedMonth || "Total"}.pdf`,
    );
    toast.success("Comprobante PDF de honorarios generado");
  } catch {
    toast.error("Error al exportar el comprobante PDF");
  }
}
