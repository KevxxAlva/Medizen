import { getClinicPdfConfig, drawPdfHeader, drawPdfWatermark, drawPdfFooter } from "./pdfConfig";

type AppointmentForReport = {
  id_cita: number | string;
  paciente_nombre?: string;
  medico_nombre?: string;
  fecha_hora: string;
  estado: string;
  motivo?: string;
};

export const generateAppointmentsReport = async (appointments: AppointmentForReport[], filterMonth: string = "") => {
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
    filterMonth ? "REPORTE MENSUAL DE CONSULTAS Y CITAS MÉDICAS" : "REPORTE GENERAL DE CONSULTAS Y CITAS MÉDICAS", 
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

  const tableData = appointments.map(a => {
    let estadoDisplay = "Desconocido";
    const st = (a.estado || "").toLowerCase();
    if (st === "completada" || st === "completado") estadoDisplay = "Completada";
    else if (st === "pendiente") estadoDisplay = "Pendiente";
    else if (st === "cancelada" || st === "cancelado") estadoDisplay = "Cancelada";
    else if (st === "confirmada" || st === "confirmado") estadoDisplay = "Confirmada";
    else estadoDisplay = a.estado || 'N/A';

    return [
      `CITA-${(a.id_cita || 0).toString().padStart(4, '0')}`,
      a.paciente_nombre || 'Desconocido',
      a.medico_nombre || '—',
      a.fecha_hora ? new Date(a.fecha_hora).toLocaleString() : '',
      a.motivo || 'N/A',
      estadoDisplay
    ];
  });

  autoTable(doc, {
    startY: 205,
    head: [['ID', 'Paciente', 'Médico', 'Fecha y Hora', 'Motivo', 'Estado']],
    body: tableData.length > 0 ? tableData : [['—', 'Sin consultas en este período', '—', '—', '—', '—']],
    theme: 'striped',
    styles: { font: config.customFontFamily, fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [139, 92, 175], textColor: 255, font: config.customFontFamily },
    margin: { left: 40, right: 40 },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 5) {
        const estado = (data.cell.raw as string || "").toLowerCase();
        if (estado === 'completada') {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado === 'pendiente') {
          data.cell.styles.textColor = [202, 138, 4];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado === 'cancelada') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado === 'confirmada') {
          data.cell.styles.textColor = [37, 99, 235];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  const totalCompletadas = appointments.filter(a => ['completada', 'completado'].includes((a.estado || '').toLowerCase())).length;
  const totalPendientes = appointments.filter(a => ['pendiente', 'confirmada', 'confirmado'].includes((a.estado || '').toLowerCase())).length;

  const finalY = (doc as any).lastAutoTable.finalY || 205;
  doc.setFontSize(11);
  doc.setFont(config.customFontFamily, "bold");
  doc.setTextColor(0);
  doc.text(`Consultas Atendidas: ${totalCompletadas}`, pageWidth - 40, finalY + 20, { align: "right" });
  doc.text(`Citas Pendientes: ${totalPendientes}`, pageWidth - 40, finalY + 35, { align: "right" });
  doc.text(
    filterMonth 
      ? `Total del Mes: ${appointments.length}` 
      : `Total de Citas: ${appointments.length}`, 
    pageWidth - 40, 
    finalY + 50, 
    { align: "right" }
  );

  drawPdfFooter(doc, config, pageWidth, pageHeight);

  doc.save(`Reporte_Citas_${filterMonth || "General"}.pdf`);
};
