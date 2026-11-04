import { toast } from "sonner";
import { getClinicPdfConfig, drawPdfHeader, drawPdfWatermark, drawPdfFooter } from "./pdfConfig";

export const generateReposoPDF = async ({
  patientName, patientId, days, startDate, reason, doctorName, doctorUniversity, doctorMpps, doctorCmc
}: {
  patientName: string; patientId: string; days: number; startDate: string; reason: string;
  doctorName: string; doctorUniversity: string; doctorMpps: string; doctorCmc: string;
}) => {
  try {
    const { jsPDF } = await import("jspdf");
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
    doc.setFontSize(10.5);
    doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 70, 155, { align: "right" });

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(13);
    doc.text("CONSTANCIA DE REPOSO", pageWidth / 2, 195, { align: "center" });
    const titleWidth = doc.getTextWidth("CONSTANCIA DE REPOSO");
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11);
    doc.text("A quien pueda interesar", 70, 235);

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(11);
    doc.text("Quien suscribe, médico tratante, certifica que examinó a:", 70, 265);

    doc.line(70, 300, pageWidth - 70, 300);
    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(12);
    doc.text(patientName, pageWidth / 2, 296, { align: "center" });

    let ciLabel = "C.I. V-";
    let displayCI = patientId || "";
    if (displayCI.startsWith("V-") || displayCI.startsWith("E-")) {
      ciLabel = `C.I. ${displayCI.slice(0, 2)}`;
      displayCI = displayCI.slice(2);
    }

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(11);
    doc.text(ciLabel, 70, 335);
    const labelWidth = doc.getTextWidth(ciLabel);
    const lineStartX = 70 + labelWidth + 5;
    const lineEndX = 280;
    doc.line(lineStartX, 335, lineEndX, 335);

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11.5);
    doc.text(displayCI, (lineStartX + lineEndX) / 2, 331, { align: "center" });

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(11);
    doc.text(", quien presenta: Diagnóstico:", 285, 335);

    const splitReason = doc.splitTextToSize(reason || "", pageWidth - 140);
    doc.line(70, 370, pageWidth - 70, 370);
    if (splitReason[0]) {
      doc.setFont(config.customFontFamily, "bold");
      doc.setFontSize(11.5);
      doc.text(splitReason[0], pageWidth / 2, 366, { align: "center" });
    }

    doc.line(70, 405, pageWidth - 70, 405);
    if (splitReason[1]) {
      doc.setFont(config.customFontFamily, "bold");
      doc.setFontSize(11.5);
      doc.text(splitReason[1], pageWidth / 2, 401, { align: "center" });
    }

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(11);
    doc.text(`Se le indicó tratamiento y reposo por (   ${days}   ) días a partir de la presente fecha`, 70, 440);

    const [sYear, sMonth, sDay] = startDate.split("-");
    const reposoStartFormatted = `${sDay} / ${sMonth} / ${sYear}`;
    doc.text(`(   ${reposoStartFormatted}   ).`, 70, 470);

    doc.text("Constancia que se expide a petición de la persona interesada.", 70, 510);

    const sigY = 590;
    doc.setDrawColor(120);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(pageWidth / 2 - 100, sigY, pageWidth / 2 + 100, sigY);
    doc.setLineDashPattern([], 0);

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11.5);
    doc.text(doctorName, pageWidth / 2, sigY + 16, { align: "center" });
    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(10.5);
    doc.text("Ginecólogo Obstetra", pageWidth / 2, sigY + 29, { align: "center" });
    if (doctorUniversity) doc.text(doctorUniversity, pageWidth / 2, sigY + 42, { align: "center" });
    doc.text(`MPPS ${doctorMpps || "______"}   CMC ${doctorCmc || "______"}`, pageWidth / 2, sigY + 55, { align: "center" });

    doc.save(`Reposo_${patientName.replace(/\s+/g, "_")}.pdf`);
    toast.success("Constancia de reposo generada");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Error al exportar");
  }
};

export const generateAtencionPDF = async ({
  patientName, patientId, date, time, reason, doctorName, doctorUniversity, doctorMpps, doctorCmc
}: {
  patientName: string; patientId: string; date: string; time: string; reason: string;
  doctorName: string; doctorUniversity: string; doctorMpps: string; doctorCmc: string;
}) => {
  try {
    const { jsPDF } = await import("jspdf");
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
    doc.setFontSize(10.5);
    doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 70, 155, { align: "right" });

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(13);
    doc.text("CONSTANCIA DE ATENCION MEDICA", pageWidth / 2, 195, { align: "center" });
    const titleWidth = doc.getTextWidth("CONSTANCIA DE ATENCION MEDICA");
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11);
    doc.text("A quien pueda interesar", 70, 235);

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(11);
    doc.text("Quien suscribe, médico tratante, certifica que examinó a:", 70, 265);

    doc.line(70, 300, 310, 300);
    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11.5);
    doc.text(patientName, 190, 296, { align: "center" });

    let ciLabel = "C.I. ";
    let displayCI = patientId || "";
    if (displayCI.startsWith("V-") || displayCI.startsWith("E-")) {
      ciLabel = `C.I. ${displayCI.slice(0, 2)}`;
      displayCI = displayCI.slice(2);
    }

    doc.text(ciLabel, 315, 300);
    const labelWidth = doc.getTextWidth(ciLabel);
    const lineStartX = 315 + labelWidth + 5;
    const lineEndX = 460;

    doc.line(lineStartX, 300, lineEndX, 300);
    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11.5);
    doc.text(displayCI, (lineStartX + lineEndX) / 2, 296, { align: "center" });

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(11);
    doc.text(", quien", 465, 300);

    const splitReason = doc.splitTextToSize(reason || "", pageWidth - 140);
    doc.text("presenta:", 70, 335);
    doc.line(120, 335, pageWidth - 70, 335);
    if (splitReason[0]) {
      doc.setFont(config.customFontFamily, "bold");
      doc.setFontSize(11.5);
      doc.text(splitReason[0], (pageWidth + 50) / 2, 331, { align: "center" });
    }

    doc.line(70, 370, pageWidth - 70, 370);
    if (splitReason[1]) {
      doc.setFont(config.customFontFamily, "bold");
      doc.setFontSize(11.5);
      doc.text(splitReason[1], pageWidth / 2, 366, { align: "center" });
    }

    const [aYear, aMonth, aDay] = date.split("-");
    const atencionDateFormatted = `${aDay} / ${aMonth} / ${aYear}`;
    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(11);
    doc.text(`Acudió a consulta el día de hoy: (   ${atencionDateFormatted}   ).`, 70, 405);

    doc.text("Constancia que se expide a petición de la persona interesada.", 70, 445);

    const sigY = 530;
    doc.setDrawColor(120);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(pageWidth / 2 - 100, sigY, pageWidth / 2 + 100, sigY);
    doc.setLineDashPattern([], 0);

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11.5);
    doc.text(doctorName, pageWidth / 2, sigY + 16, { align: "center" });
    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(10.5);
    doc.text("Ginecólogo Obstetra", pageWidth / 2, sigY + 29, { align: "center" });
    if (doctorUniversity) doc.text(doctorUniversity, pageWidth / 2, sigY + 42, { align: "center" });
    doc.text(`MPPS ${doctorMpps || "______"}   CMC ${doctorCmc || "______"}`, pageWidth / 2, sigY + 55, { align: "center" });

    drawPdfFooter(doc, config, pageWidth, pageHeight);

    doc.save(`Atencion_${patientName.replace(/\s+/g, "_")}.pdf`);
    toast.success("Constancia de atención generada");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Error al exportar");
  }
};

export const generateJustificativoPDF = async ({
  patientName, patientId, date, justificationText, doctorName, doctorUniversity, doctorMpps, doctorCmc
}: {
  patientName: string; patientId: string; date: string; justificationText: string;
  doctorName: string; doctorUniversity: string; doctorMpps: string; doctorCmc: string;
}) => {
  try {
    const { jsPDF } = await import("jspdf");
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
    doc.setFontSize(10.5);
    doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 70, 155, { align: "right" });

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(13);
    doc.text("JUSTIFICATIVO MEDICO", pageWidth / 2, 195, { align: "center" });
    const titleWidth = doc.getTextWidth("JUSTIFICATIVO MEDICO");
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11);
    doc.text("A quien pueda interesar", 70, 235);

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(11);
    doc.text("Quien suscribe, médico tratante, hace constar por medio de la presente que:", 70, 265);

    doc.line(70, 300, 310, 300);
    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11.5);
    doc.text(patientName, 190, 296, { align: "center" });

    let ciLabel = "C.I. ";
    let displayCI = patientId || "";
    if (displayCI.startsWith("V-") || displayCI.startsWith("E-")) {
      ciLabel = `C.I. ${displayCI.slice(0, 2)}`;
      displayCI = displayCI.slice(2);
    }

    doc.text(ciLabel, 315, 300);
    const labelWidth = doc.getTextWidth(ciLabel);
    const lineStartX = 315 + labelWidth + 5;
    const lineEndX = 460;

    doc.line(lineStartX, 300, lineEndX, 300);
    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11.5);
    doc.text(displayCI, (lineStartX + lineEndX) / 2, 296, { align: "center" });

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(11);
    doc.text(", asistió a evaluación", 465, 300);

    doc.text("médica el día de hoy. Motivo / Justificación:", 70, 335);

    const splitJustification = doc.splitTextToSize(justificationText || "", pageWidth - 140);
    let currentY = 370;

    for (let i = 0; i < Math.min(splitJustification.length, 3); i++) {
      doc.line(70, currentY, pageWidth - 70, currentY);
      doc.setFont(config.customFontFamily, "bold");
      doc.setFontSize(11.5);
      doc.text(splitJustification[i], pageWidth / 2, currentY - 4, { align: "center" });
      currentY += 35;
    }

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(11);
    doc.text("Constancia que se expide a petición de la parte interesada en la fecha indicada.", 70, currentY + 30);

    const sigY = currentY + 110;
    doc.setDrawColor(120);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(pageWidth / 2 - 100, sigY, pageWidth / 2 + 100, sigY);
    doc.setLineDashPattern([], 0);

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11.5);
    doc.text(doctorName, pageWidth / 2, sigY + 16, { align: "center" });
    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(10.5);
    doc.text("Ginecólogo Obstetra", pageWidth / 2, sigY + 29, { align: "center" });
    if (doctorUniversity) doc.text(doctorUniversity, pageWidth / 2, sigY + 42, { align: "center" });
    doc.text(`MPPS ${doctorMpps || "______"}   CMC ${doctorCmc || "______"}`, pageWidth / 2, sigY + 55, { align: "center" });

    drawPdfFooter(doc, config, pageWidth, pageHeight);

    doc.save(`Justificativo_${patientName.replace(/\s+/g, "_")}.pdf`);
    toast.success("Justificativo médico generado");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Error al exportar justificativo");
  }
};


export const generateLaboratorioPDF = async ({
  patientName,
  patientId,
  profileTitle,
  examsList,
  clinicalIndication,
  doctorName,
  doctorUniversity,
  doctorMpps,
  doctorCmc,
}: {
  patientName: string;
  patientId: string;
  profileTitle: string;
  examsList: string;
  clinicalIndication?: string;
  doctorName: string;
  doctorUniversity: string;
  doctorMpps: string;
  doctorCmc: string;
}) => {
  try {
    const { jsPDF } = await import("jspdf");
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
    doc.setFontSize(10.5);
    doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 70, 155, { align: "right" });

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(13);
    doc.text("ORDEN DE EXÁMENES DE LABORATORIO Y PARACLÍNICOS", pageWidth / 2, 190, { align: "center" });
    const titleWidth = doc.getTextWidth("ORDEN DE EXÁMENES DE LABORATORIO Y PARACLÍNICOS");
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - titleWidth / 2, 193, pageWidth / 2 + titleWidth / 2, 193);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(70, 210, pageWidth - 140, 48, 6, 6, "FD");

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(10.5);
    doc.text(`PACIENTE: ${patientName}`, 84, 230);
    doc.text(`C.I.: ${patientId || "—"}`, pageWidth - 200, 230);
    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(10);
    doc.text(`PERFIL SOLICITADO: ${profileTitle || "Laboratorio General"}`, 84, 248);

    let y = 285;
    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11);
    doc.text("ESTUDIOS Y DETERMINACIONES SOLICITADAS:", 70, y);
    y += 18;

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(10.5);
    const lines = doc.splitTextToSize(examsList || "", pageWidth - 150);
    for (const line of lines) {
      if (y > pageHeight - 180) break;
      doc.text(`•  ${line.replace(/^[•\-*]\s*/, "")}`, 80, y);
      y += 18;
    }

    if (clinicalIndication && clinicalIndication.trim()) {
      y += 12;
      doc.setFont(config.customFontFamily, "bold");
      doc.setFontSize(10.5);
      doc.text("INDICACIÓN CLÍNICA / PREPARACIÓN:", 70, y);
      y += 16;
      doc.setFont(config.customFontFamily, "normal");
      const indLines = doc.splitTextToSize(clinicalIndication, pageWidth - 140);
      doc.text(indLines, 70, y);
      y += indLines.length * 15;
    }

    const sigY = Math.max(y + 60, 560);
    doc.setDrawColor(120);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(pageWidth / 2 - 100, sigY, pageWidth / 2 + 100, sigY);
    doc.setLineDashPattern([], 0);

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11.5);
    doc.text(doctorName, pageWidth / 2, sigY + 16, { align: "center" });
    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(10.5);
    doc.text("Médico Especialista", pageWidth / 2, sigY + 29, { align: "center" });
    if (doctorUniversity) doc.text(doctorUniversity, pageWidth / 2, sigY + 42, { align: "center" });
    doc.text(`MPPS ${doctorMpps || "______"}   CMC ${doctorCmc || "______"}`, pageWidth / 2, sigY + 55, { align: "center" });

    drawPdfFooter(doc, config, pageWidth, pageHeight);
    doc.save(`Orden_Laboratorio_${patientName.replace(/\s+/g, "_")}.pdf`);
    toast.success("Orden de laboratorio en PDF descargada");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Error al exportar orden de laboratorio");
  }
};

export const generateEcografiaPDF = async ({
  patientName,
  patientId,
  ecoType,
  gestationalAge,
  fhr,
  efw,
  placenta,
  findings,
  conclusion,
  doctorName,
  doctorUniversity,
  doctorMpps,
  doctorCmc,
}: {
  patientName: string;
  patientId: string;
  ecoType: string;
  gestationalAge?: string;
  fhr?: string;
  efw?: string;
  placenta?: string;
  findings: string;
  conclusion: string;
  doctorName: string;
  doctorUniversity: string;
  doctorMpps: string;
  doctorCmc: string;
}) => {
  try {
    const { jsPDF } = await import("jspdf");
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
    doc.setFontSize(10.5);
    doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 70, 155, { align: "right" });

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(13);
    const title = `INFORME ECOGRÁFICO — ${(ecoType || "ECOGRAFÍA OBSTÉTRICA / PÉLVICA").toUpperCase()}`;
    doc.text(title, pageWidth / 2, 188, { align: "center" });

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(70, 205, pageWidth - 140, 58, 6, 6, "FD");

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(10);
    doc.text(`PACIENTE: ${patientName}`, 84, 224);
    doc.text(`C.I.: ${patientId || "—"}`, pageWidth - 200, 224);

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(9.5);
    doc.text(
      `Edad Gestacional / Ciclo: ${gestationalAge || "N/A"}   |   FCF: ${fhr || "N/A"} lpm   |   Peso Fetal Est.: ${efw || "N/A"} g   |   Placenta/L.A.: ${placenta || "Normal"}`,
      84,
      246
    );

    let y = 285;
    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11);
    doc.text("HALLAZGOS ECOGRÁFICOS Y BIOMETRÍA:", 70, y);
    y += 18;

    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(10.5);
    const findingLines = doc.splitTextToSize(findings || "", pageWidth - 140);
    doc.text(findingLines, 70, y);
    y += findingLines.length * 16 + 20;

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11);
    doc.text("CONCLUSIÓN DIAGNÓSTICA ECOGRÁFICA:", 70, y);
    y += 18;

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(134, 239, 172);
    const concLines = doc.splitTextToSize(conclusion || "", pageWidth - 164);
    const boxH = Math.max(concLines.length * 16 + 18, 36);
    doc.roundedRect(70, y - 12, pageWidth - 140, boxH, 5, 5, "FD");
    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(10.5);
    doc.text(concLines, 82, y + 4);
    y += boxH + 40;

    const sigY = Math.max(y + 30, 580);
    doc.setDrawColor(120);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(pageWidth / 2 - 100, sigY, pageWidth / 2 + 100, sigY);
    doc.setLineDashPattern([], 0);

    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11.5);
    doc.text(doctorName, pageWidth / 2, sigY + 16, { align: "center" });
    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(10.5);
    doc.text("Médico Especialista / Ecografista", pageWidth / 2, sigY + 29, { align: "center" });
    if (doctorUniversity) doc.text(doctorUniversity, pageWidth / 2, sigY + 42, { align: "center" });
    doc.text(`MPPS ${doctorMpps || "______"}   CMC ${doctorCmc || "______"}`, pageWidth / 2, sigY + 55, { align: "center" });

    drawPdfFooter(doc, config, pageWidth, pageHeight);
    doc.save(`Informe_Ecografico_${patientName.replace(/\s+/g, "_")}.pdf`);
    toast.success("Informe ecográfico en PDF descargado");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Error al exportar informe ecográfico");
  }
};
