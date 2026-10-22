import { getClinicPdfConfig, drawPdfHeader, drawPdfWatermark, drawPdfFooter } from "./pdfConfig";

type PatientForReport = {
  id_paciente: number;
  nombre: string;
  apellido: string;
  documento_identidad: string;
  telefono: string;
  creado_en: string;
};

export const generatePatientsReport = async (patients: PatientForReport[], filterMonth: string = "") => {
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
    filterMonth ? "REPORTE MENSUAL DE PACIENTES REGISTRADOS" : "REPORTE GENERAL DE PACIENTES REGISTRADOS", 
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

  const tableData = patients.map(p => {
    return [
      `PAT-${(p.id_paciente || 0).toString().padStart(4, '0')}`,
      `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin Nombre',
      p.documento_identidad || 'N/A',
      p.telefono || 'N/A',
      p.creado_en ? new Date(p.creado_en).toLocaleDateString() : ''
    ];
  });

  autoTable(doc, {
    startY: 205,
    head: [['ID', 'Paciente', 'Documento', 'Teléfono', 'Fecha de Registro']],
    body: tableData.length > 0 ? tableData : [['—', 'Sin pacientes registrados en este período', '—', '—', '—']],
    theme: 'striped',
    styles: { font: config.customFontFamily, fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [139, 92, 175], textColor: 255, font: config.customFontFamily },
    margin: { left: 40, right: 40 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 205;
  doc.setFontSize(11);
  doc.setFont(config.customFontFamily, "bold");
  doc.text(
    filterMonth ? `Total Registrados este Mes: ${patients.length}` : `Total de Pacientes: ${patients.length}`, 
    pageWidth - 40, 
    finalY + 20, 
    { align: "right" }
  );

  drawPdfFooter(doc, config, pageWidth, pageHeight);

  doc.save(`Reporte_Pacientes_${filterMonth || "General"}.pdf`);
};
