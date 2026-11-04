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
    ? new Date(invoice.fecha_emision).toLocaleDateString("es-VE")
    : new Date().toLocaleDateString("es-VE");
  const statusLabel = (invoice.estado_pago || "PAGADO").toUpperCase();

  doc.text(`Factura N°: ${invoiceId}`, 40, 205);
  doc.text(`Fecha de Emisión: ${dateStr}`, 40, 220);
  doc.text(`Estado: ${statusLabel}`, 40, 235);

  doc.text(
    `Tasas Ref — BCV: Bs. ${rates.bcv.toFixed(2)} | EUR: Bs. ${rates.eur.toFixed(
      2
    )} | USDT: Bs. ${rates.usdt.toFixed(2)}`,
    pageWidth - 40,
    205,
    { align: "right" }
  );

  if (invoice.metodo_pago) {
    doc.setFont(config.customFontFamily, "bold");
    doc.text(`Método de Pago: ${invoice.metodo_pago}`, pageWidth - 40, 220, {
      align: "right",
    });
    doc.setFont(config.customFontFamily, "normal");
  }

  if (invoice.referencia) {
    const refText =
      invoice.referencia.length > 65
        ? `${invoice.referencia.slice(0, 62)}...`
        : invoice.referencia;
    doc.setFontSize(9);
    doc.text(`Ref / Detalle: ${refText}`, pageWidth - 40, 235, {
      align: "right",
    });
    doc.setFontSize(10);
  }

  doc.setFont(config.customFontFamily, "bold");
  doc.setFontSize(11);
  doc.text(`Paciente: ${invoice.paciente_nombre || "Desconocido"}`, 40, 265);
  doc.setFont(config.customFontFamily, "normal");

  const tableData = [
    [
      "1",
      "Servicios Médicos / Consulta Especializada",
      invoice.metodo_pago || "Por definir",
      `$${invoice.total_general.toFixed(2)}`,
      formatEurFromUsd(invoice.total_general, rates),
      formatBs(invoice.total_general, rate),
    ],
  ];

  autoTable(doc, {
    startY: 285,
    head: [
      [
        "Cant.",
        "Descripción",
        "Método de Pago",
        "Total (USD $)",
        "Equiv. (EUR €)",
        "Equivalente (Bs.)",
      ],
    ],
    body: tableData,
    theme: "striped",
    styles: { font: config.customFontFamily, fontSize: 9.5, cellPadding: 8 },
    headStyles: { fillColor: [139, 92, 175], textColor: 255, font: config.customFontFamily },
    margin: { left: 40, right: 40 },
  });

  let finalY = (doc as any).lastAutoTable.finalY || 285;

  if (invoice.referencia) {
    doc.setFontSize(9);
    doc.setFont(config.customFontFamily, "normal");
    doc.setTextColor(80);
    doc.text(`Detalle de Operación / Referencia: ${invoice.referencia}`, 40, finalY + 18);
    finalY += 12;
  }

  doc.setFontSize(12);
  doc.setFont(config.customFontFamily, "bold");
  doc.setTextColor(0);
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
  doc.text("¡Gracias por su confianza!", 40, finalY + 30);

  drawPdfFooter(doc, config, pageWidth, pageHeight);

  doc.save(`${invoiceId}_${invoice.paciente_nombre?.replace(/ /g, "_")}.pdf`);
};
