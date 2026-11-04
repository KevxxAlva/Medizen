import { getClinicPdfConfig, drawPdfHeader, drawPdfWatermark, drawPdfFooter } from "./pdfConfig";
import {
  getStoredExchangeRate,
  getStoredExchangeRates,
  formatBs,
} from "@/hooks/useExchangeRate";

export interface CashCloseBreakdownItem {
  category: string;
  count: number;
  amountUsd: number;
  amountBs: number;
}

export interface CashCloseInvoiceItem {
  id: string;
  patientName: string;
  date: string;
  amount: number;
  paymentMethod?: string | null;
  reference?: string | null;
  status: string;
}

export const generateCashCloseReport = async ({
  dateLabel,
  breakdown,
  invoices,
  casheaInitialTodayUsd,
  casheaFinancedPendingUsd,
  customRate,
}: {
  dateLabel: string;
  breakdown: CashCloseBreakdownItem[];
  invoices: CashCloseInvoiceItem[];
  casheaInitialTodayUsd: number;
  casheaFinancedPendingUsd: number;
  customRate?: number;
}) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const rate = customRate && customRate > 0 ? customRate : getStoredExchangeRate();
  const rates = getStoredExchangeRates();

  const config = await getClinicPdfConfig();
  drawPdfWatermark(doc, config, pageWidth, pageHeight);
  drawPdfHeader(doc, config, pageWidth);

  doc.setFont(config.customFontFamily, "bold");
  doc.setFontSize(13.5);
  doc.setTextColor(0);
  doc.text(
    "ACTA DE ARQUEO Y CIERRE DIARIO DE CAJA (REPORTE Z CLÍNICO)",
    pageWidth / 2,
    168,
    { align: "center" }
  );

  doc.setFont(config.customFontFamily, "normal");
  doc.setFontSize(9.5);
  const ratesSubtitle = `BCV ($): Bs. ${rates.bcv.toFixed(2)}  |  EUR (€): Bs. ${rates.eur.toFixed(
    2
  )}  |  USDT: Bs. ${rates.usdt.toFixed(2)}`;
  doc.text(`Jornada / Fecha: ${dateLabel}   —   ${ratesSubtitle}`, pageWidth / 2, 184, {
    align: "center",
  });

  // 1. Resumen por Método de Pago Venezolano
  const totalUsd = breakdown.reduce((acc, b) => acc + b.amountUsd, 0);
  const totalCount = breakdown.reduce((acc, b) => acc + b.count, 0);

  autoTable(doc, {
    startY: 200,
    head: [
      [
        "Método de Pago (Venezuela)",
        "Operaciones",
        "Total USD ($)",
        "Equivalente en Bolívares (Bs.)",
      ],
    ],
    body: [
      ...breakdown.map((b) => [
        b.category,
        String(b.count),
        `$${b.amountUsd.toFixed(2)}`,
        formatBs(b.amountUsd, b.category.includes("Binance") ? rates.usdt : rate),
      ]),
      [
        "TOTAL CONSOLIDADO EN CAJA Y BANCOS",
        String(totalCount),
        `$${totalUsd.toFixed(2)}`,
        formatBs(totalUsd, rate),
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      1: { halign: "center" },
      2: { halign: "right", fontStyle: "bold" },
      3: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === breakdown.length) {
        data.cell.styles.fillColor = [240, 253, 244];
        data.cell.styles.textColor = [21, 128, 61];
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 50, right: 50 },
  });

  let nextY = (doc as any).lastAutoTable.finalY + 14;

  // 2. Cuadro de Conciliación Cashea (Inicial vs. 3 Cuotas por Cobrar)
  if (casheaInitialTodayUsd > 0 || casheaFinancedPendingUsd > 0) {
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(250, 204, 21);
    doc.roundedRect(50, nextY, pageWidth - 100, 38, 5, 5, "FD");
    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(9);
    doc.setTextColor(133, 77, 14);
    doc.text(
      `CARTERA CASHEA: Inicial Cobrada en Clínica: $${casheaInitialTodayUsd.toFixed(
        2
      )} (${formatBs(casheaInitialTodayUsd, rate)})   |   Saldo Financiado en 3 Cuotas: $${casheaFinancedPendingUsd.toFixed(
        2
      )} (${formatBs(casheaFinancedPendingUsd, rate)})`,
      pageWidth / 2,
      nextY + 23,
      { align: "center" }
    );
    nextY += 50;
  }

  // 3. Detalle de Operaciones Cobradas
  doc.setFont(config.customFontFamily, "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text("DETALLE DE OPERACIONES LIQUIDADAS", 50, nextY);

  autoTable(doc, {
    startY: nextY + 8,
    head: [["Factura", "Paciente", "Método de Pago", "Referencia / Detalle", "Monto ($)", "Equiv. Bs."]],
    body:
      invoices.length > 0
        ? invoices.map((inv) => [
            inv.id,
            inv.patientName,
            inv.paymentMethod || "Efectivo",
            inv.reference || "—",
            `$${inv.amount.toFixed(2)}`,
            formatBs(inv.amount, rate),
          ])
        : [["—", "Sin operaciones registradas en el período", "—", "—", "$0.00", "Bs. 0,00"]],
    theme: "striped",
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 4.5,
    },
    columnStyles: {
      4: { halign: "right", fontStyle: "bold" },
      5: { halign: "right" },
    },
    margin: { left: 50, right: 50 },
  });

  const finalY = Math.min((doc as any).lastAutoTable.finalY + 55, pageHeight - 95);

  // Bloques de Firma de Conformidad (Recepción y Administración)
  doc.setDrawColor(100);
  doc.setLineWidth(0.7);
  doc.line(85, finalY, 245, finalY);
  doc.line(pageWidth - 245, finalY, pageWidth - 85, finalY);

  doc.setFont(config.customFontFamily, "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text("Recepción / Cajero(a) de Turno", 165, finalY + 14, { align: "center" });
  doc.text("Dirección Médica / Administración", pageWidth - 165, finalY + 14, { align: "center" });

  doc.setFont(config.customFontFamily, "normal");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Entrega conforme de efectivo y soportes", 165, finalY + 26, { align: "center" });
  doc.text("Auditoría y conformidad de tesorería", pageWidth - 165, finalY + 26, { align: "center" });

  drawPdfFooter(doc, config, pageWidth, pageHeight);

  const safeDate = dateLabel.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`Cierre_Caja_ReporteZ_${safeDate}.pdf`);
};
