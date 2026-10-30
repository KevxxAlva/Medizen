import { getClinicPdfConfig, drawPdfHeader, drawPdfWatermark, drawPdfFooter } from "./pdfConfig";
import {
  getStoredExchangeRate,
  getStoredExchangeRates,
  formatBs,
  formatEurFromUsd,
} from "@/hooks/useExchangeRate";

type InvoiceForReport = {
  id_factura: number;
  paciente_nombre?: string;
  fecha_emision: string;
  total_general: number;
  estado_pago: string;
};

export const generateSalesReport = async (
  facturas: InvoiceForReport[],
  filterMonth: string = "",
  customRate?: number
) => {
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
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(
    filterMonth
      ? "REPORTE MENSUAL DE INGRESOS Y FACTURACIÓN"
      : "REPORTE GENERAL DE INGRESOS Y FACTURACIÓN",
    pageWidth / 2,
    170,
    { align: "center" }
  );

  const ratesSubtitle = `BCV ($): Bs. ${rates.bcv.toFixed(2)}  |  EUR (€): Bs. ${rates.eur.toFixed(
    2
  )}  |  USDT: Bs. ${rates.usdt.toFixed(2)}`;

  if (filterMonth) {
    const [yyyy, mm] = filterMonth.split("-");
    const monthName = new Date(parseInt(yyyy), parseInt(mm) - 1, 1).toLocaleString("es-ES", {
      month: "long",
      year: "numeric",
    });
    doc.setFontSize(9.5);
    doc.text(`Mes: ${monthName.toUpperCase()}  —  ${ratesSubtitle}`, pageWidth / 2, 186, {
      align: "center",
    });
  } else {
    doc.setFontSize(9.5);
    doc.text(
      `Fecha: ${new Date().toLocaleDateString()}  —  ${ratesSubtitle}`,
      pageWidth / 2,
      186,
      { align: "center" }
    );
  }

  const tableData = facturas.map((f) => {
    let estado = "Desconocido";
    const st = (f.estado_pago || "").toLowerCase();
    if (st === "pagado" || st === "paid" || st === "pagada") estado = "Pagado";
    else if (st === "pendiente" || st === "pending") estado = "Pendiente";
    else if (st === "cancelado" || st === "cancelled" || st === "cancelada") estado = "Cancelado";
    else estado = f.estado_pago || "Desconocido";

    const amount = Number(f.total_general) || 0;

    return [
      `INV-${(f.id_factura || 0).toString().padStart(4, "0")}`,
      f.paciente_nombre || "N/A",
      f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString() : "",
      `$${amount.toFixed(2)}`,
      formatEurFromUsd(amount, rates),
      formatBs(amount, rate),
      estado,
    ];
  });

  autoTable(doc, {
    startY: 205,
    head: [
      ["ID Factura", "Paciente", "Fecha", "USD ($)", "EUR (€)", "Equiv. (Bs.)", "Estado"],
    ],
    body:
      tableData.length > 0
        ? tableData
        : [["—", "Sin movimientos registrados", "—", "$0.00", "€0,00", "Bs. 0,00", "—"]],
    theme: "striped",
    styles: { font: config.customFontFamily, fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [139, 92, 175], textColor: 255, font: config.customFontFamily },
    margin: { left: 40, right: 40 },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 6) {
        const estado = ((data.cell.raw as string) || "").toLowerCase();
        if (estado === "pagado") {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = "bold";
        } else if (estado === "pendiente") {
          data.cell.styles.textColor = [202, 138, 4];
          data.cell.styles.fontStyle = "bold";
        } else if (estado === "cancelado") {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  const totalCobrado = facturas
    .filter((f) => {
      const st = (f.estado_pago || "").toLowerCase();
      return st === "pagado" || st === "paid" || st === "pagada";
    })
    .reduce((sum, f) => sum + (Number(f.total_general) || 0), 0);

  const totalPendiente = facturas
    .filter((f) => {
      const st = (f.estado_pago || "").toLowerCase();
      return st === "pendiente" || st === "pending";
    })
    .reduce((sum, f) => sum + (Number(f.total_general) || 0), 0);

  const finalY = (doc as any).lastAutoTable.finalY || 205;
  doc.setFontSize(10.5);
  doc.setFont(config.customFontFamily, "bold");
  doc.text(
    `Total Cobrado: $${totalCobrado.toFixed(2)}  |  ${formatEurFromUsd(
      totalCobrado,
      rates
    )}  |  ${formatBs(totalCobrado, rate)}`,
    pageWidth - 40,
    finalY + 22,
    { align: "right" }
  );
  doc.text(
    `Total Pendiente: $${totalPendiente.toFixed(2)}  |  ${formatEurFromUsd(
      totalPendiente,
      rates
    )}  |  ${formatBs(totalPendiente, rate)}`,
    pageWidth - 40,
    finalY + 38,
    { align: "right" }
  );

  drawPdfFooter(doc, config, pageWidth, pageHeight);

  doc.save(`Reporte_Pagos_${filterMonth || "General"}.pdf`);
};
