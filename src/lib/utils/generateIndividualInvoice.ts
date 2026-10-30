import { getClinicPdfConfig, drawPdfHeader, drawPdfWatermark, drawPdfFooter } from "./pdfConfig";
import {
  getStoredExchangeRate,
  getStoredExchangeRates,
  formatBs,
  formatEurFromUsd,
} from "@/hooks/useExchangeRate";

export const generateIndividualInvoice = async (invoice: any, customRate?: number) => {
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
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("COMPROBANTE DE PAGO", pageWidth / 2, 170, { align: "center" });

  doc.setFontSize(10);
  doc.setFont(config.customFontFamily, "normal");

  const invoiceId = `INV-${invoice.id_factura.toString().padStart(4, "0")}`;
  const dateStr = invoice.fecha_emision
    ? new Date(invoice.fecha_emision).toLocaleDateString()
    : new Date().toLocaleDateString();
  const statusLabel = (invoice.estado_pago || "PAGADO").toUpperCase();

  doc.text(`Factura N°: ${invoiceId}`, 40, 210);
  doc.text(`Fecha de Emisión: ${dateStr}`, 40, 225);
  doc.text(`Estado: ${statusLabel}`, 40, 240);
  doc.text(
    `Tasas Ref — BCV: Bs. ${rates.bcv.toFixed(2)} | EUR: Bs. ${rates.eur.toFixed(
      2
    )} | USDT: Bs. ${rates.usdt.toFixed(2)}`,
    pageWidth - 40,
    210,
    { align: "right" }
  );

  doc.setFont(config.customFontFamily, "bold");
  doc.setFontSize(11);
  doc.text(`Paciente: ${invoice.paciente_nombre || "Desconocido"}`, 40, 270);
  doc.setFont(config.customFontFamily, "normal");

  const tableData = [
    [
      "1",
      "Servicios Médicos / Consulta",
      `$${invoice.total_general.toFixed(2)}`,
      formatEurFromUsd(invoice.total_general, rates),
      formatBs(invoice.total_general, rate),
    ],
  ];

  autoTable(doc, {
    startY: 290,
    head: [["Cant.", "Descripción", "Total (USD $)", "Equiv. (EUR €)", "Equivalente (Bs.)"]],
    body: tableData,
    theme: "striped",
    styles: { font: config.customFontFamily, fontSize: 10, cellPadding: 8 },
    headStyles: { fillColor: [139, 92, 175], textColor: 255, font: config.customFontFamily },
    margin: { left: 40, right: 40 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 290;

  doc.setFontSize(12);
  doc.setFont(config.customFontFamily, "bold");
  doc.text(
    `Total: $${invoice.total_general.toFixed(2)} USD  (${formatEurFromUsd(
      invoice.total_general,
      rates
    )})`,
    pageWidth - 40,
    finalY + 28,
    { align: "right" }
  );
  doc.setFontSize(10);
  doc.setFont(config.customFontFamily, "normal");
  doc.setTextColor(70);
  doc.text(
    `Equivalente en Bolívares (Tasa Bs. ${rate.toFixed(2)}): ${formatBs(
      invoice.total_general,
      rate
    )}`,
    pageWidth - 40,
    finalY + 44,
    { align: "right" }
  );

  doc.setFontSize(10);
  doc.setFont(config.customFontFamily, "normal");
  doc.setTextColor(100);
  doc.text("¡Gracias por su preferencia!", 40, finalY + 30);

  drawPdfFooter(doc, config, pageWidth, pageHeight);

  doc.save(`${invoiceId}_${invoice.paciente_nombre?.replace(/ /g, "_")}.pdf`);
};
