import { getClinicPdfConfig, drawPdfHeader, drawPdfWatermark, drawPdfFooter } from "./pdfConfig";

type InvoiceForReport = {
  id_factura: number;
  paciente_nombre?: string;
  fecha_emision: string;
  total_general: number;
  estado_pago: string;
};

export const generateSalesReport = async (facturas: InvoiceForReport[], filterMonth: string = "") => {
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

  doc.setFont(config.customFontFamily, "bold");
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(
    filterMonth ? "REPORTE MENSUAL DE INGRESOS Y FACTURACIÓN" : "REPORTE GENERAL DE INGRESOS Y FACTURACIÓN", 
    pageWidth / 2, 
    170, 
    { align: "center" }
  );

  if (filterMonth) {
    const [yyyy, mm] = filterMonth.split("-");
    const monthName = new Date(parseInt(yyyy), parseInt(mm) - 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    doc.setFontSize(11);
    doc.text(`Mes: ${monthName.toUpperCase()}`, pageWidth / 2, 185, { align: "center" });
  } else {
    doc.setFontSize(10);
    doc.text(`Reporte Histórico — Generado el: ${new Date().toLocaleDateString()}`, pageWidth / 2, 185, { align: "center" });
  }

  const tableData = facturas.map(f => {
    let estado = "Desconocido";
    const st = (f.estado_pago || "").toLowerCase();
    if (st === "pagado" || st === "paid") estado = "Pagado";
    else if (st === "pendiente" || st === "pending") estado = "Pendiente";
    else if (st === "cancelado" || st === "cancelled") estado = "Cancelado";
    else estado = f.estado_pago || "Desconocido";

    const amount = Number(f.total_general) || 0;

    return [
      `INV-${(f.id_factura || 0).toString().padStart(4, '0')}`,
      f.paciente_nombre || 'N/A',
      f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString() : '',
      `$${amount.toFixed(2)}`,
      estado
    ];
  });

  autoTable(doc, {
    startY: 205,
    head: [['ID Factura', 'Paciente', 'Fecha', 'Monto Total', 'Estado']],
    body: tableData.length > 0 ? tableData : [['—', 'Sin movimientos registrados en este período', '—', '$0.00', '—']],
    theme: 'striped',
    styles: { font: config.customFontFamily, fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [139, 92, 175], textColor: 255, font: config.customFontFamily },
    margin: { left: 40, right: 40 },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 4) {
        const estado = (data.cell.raw as string || "").toLowerCase();
        if (estado === 'pagado') {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado === 'pendiente') {
          data.cell.styles.textColor = [202, 138, 4];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado === 'cancelado') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  const totalCobrado = facturas
    .filter(f => {
      const st = (f.estado_pago || "").toLowerCase();
      return st === 'pagado' || st === 'paid';
    })
    .reduce((sum, f) => sum + (Number(f.total_general) || 0), 0);

  const totalPendiente = facturas
    .filter(f => {
      const st = (f.estado_pago || "").toLowerCase();
      return st === 'pendiente' || st === 'pending';
    })
    .reduce((sum, f) => sum + (Number(f.total_general) || 0), 0);

  const finalY = (doc as any).lastAutoTable.finalY || 205;
  doc.setFontSize(11);
  doc.setFont(config.customFontFamily, "bold");
  doc.text(`Total Cobrado: $${totalCobrado.toFixed(2)}`, pageWidth - 40, finalY + 20, { align: "right" });
  doc.text(`Total Pendiente: $${totalPendiente.toFixed(2)}`, pageWidth - 40, finalY + 35, { align: "right" });

  drawPdfFooter(doc, config, pageWidth, pageHeight);

  doc.save(`Reporte_Pagos_${filterMonth || "General"}.pdf`);
};
