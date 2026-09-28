import jsPDF from "jspdf";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface RecipePatient {
  full_name: string;
  document_id: string | null;
  birth_date: string | null;
}

export interface RecipeConsultation {
  created_at: string;
  indications: string | null;
}

const loadLogoBase64 = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        resolve("");
      }
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
};

const calculateAge = (birthDateStr: string | null): string => {
  if (!birthDateStr) return "—";
  const birth = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} años`;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = (hex || "#992ACB").replace("#", "").trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return [153, 42, 203];
};

export const generateRecipePDF = async (
  patient: RecipePatient,
  consultation: RecipeConsultation,
  doctorName: string,
  doctorSpecialty?: string,
  doctorUniversity?: string,
  doctorMpps?: string,
  doctorCmc?: string,
  returnBlob: boolean = false
): Promise<Blob | void> => {
  try {
    const indicationsText = consultation.indications?.trim();
    if (!indicationsText) {
      toast.warning("La consulta no tiene indicaciones o receta registrada.");
      return;
    }

    // A4 Format (unit: pt, format: a4)
    // Page dimensions in pt: 595.28 x 841.89
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "p" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();



    // Query clinic info
    let clinicAddress1 = "Calle las Flores entre González Padrón y Shettino, Número 16.";
    let clinicAddress2 = "Valle de la Pascua, Estado Guárico.";
    let clinicPhone = "0412/8299890 0424/4609387";
    let clinicName = "Femesalud";
    let clinicRif = "";
    let clinicType = "Consultorio Ginecológico Obstétrico";
    let clinicPrimaryColor = "#992ACB";
    
    // Custom Config
    let customHeaderText = "";
    let customFontFamily = "times"; // default serif
    let customLogoUrl = "";
    let customFooterText = "";

    try {
      const { data } = await supabase.from("clinic_info").select("*").eq("id", 1).maybeSingle();
      if (data) {
        clinicAddress1 = data.address_line1 || clinicAddress1;
        clinicAddress2 = data.address_line2 || clinicAddress2;
        clinicPhone = data.phone || clinicPhone;
        clinicName = data.name || clinicName;
        clinicRif = data.rif || clinicRif;
        clinicType = data.recipe_clinic_type || clinicType;
        clinicPrimaryColor = data.recipe_primary_color || clinicPrimaryColor;
        
        customHeaderText = data.recipe_header_text || "";
        customFooterText = data.recipe_footer_text || "";
        customLogoUrl = data.recipe_logo_url || "";
        
        if (data.recipe_font_family === "font-sans") customFontFamily = "helvetica";
        else if (data.recipe_font_family === "font-mono") customFontFamily = "courier";
        else customFontFamily = "times";
      }
    } catch (e) {
      console.error("Error fetching clinic info for PDF:", e);
    }

    const dateObj = new Date(consultation.created_at);
    const topDay = String(dateObj.getDate()).padStart(2, "0");
    const topMonth = String(dateObj.getMonth() + 1).padStart(2, "0");
    const topYear = String(dateObj.getFullYear());

    // Setup doctor credentials using parameters or database fetch as fallback
    let docUni = doctorUniversity || "";
    let docMpps = doctorMpps || "";
    let docCmc = doctorCmc || "";
    let finalSpecialty = doctorSpecialty || "";

    // Default fallbacks if they are still missing
    if (!docUni) {
      docUni = "Universidad Central de Venezuela";
    }
    if (!docMpps) {
      if (doctorName.toLowerCase().includes("carli") || doctorName.toLowerCase().includes("sole") || doctorName.toLowerCase().includes("solé")) {
        docMpps = "102.927";
      } else {
        docMpps = "______";
      }
    }
    if (!docCmc) {
      if (doctorName.toLowerCase().includes("carli") || doctorName.toLowerCase().includes("sole") || doctorName.toLowerCase().includes("solé")) {
        docCmc = "11.619";
      } else {
        docCmc = "______";
      }
    }
    if (!finalSpecialty) {
      finalSpecialty = doctorName.toLowerCase().includes("carli") || doctorName.toLowerCase().includes("sole") || doctorName.toLowerCase().includes("solé") 
        ? "Ginecóloga y Obstetra" 
        : "Médico Especialista";
    }

    // Load logo if exists
    const logoBase64 = customLogoUrl ? customLogoUrl : await loadLogoBase64("/logo.png");
    const [r, g, b] = hexToRgb(clinicPrimaryColor);

    // Draw header on Page 1
    const drawHeader = (): number => {
      // Font Setup
      doc.setFont(customFontFamily, "normal");
      
      // Top Micro Info: Address & Contact
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text(clinicAddress1, pageWidth / 2, 42, { align: "center" });
      doc.text(clinicAddress2, pageWidth / 2, 54, { align: "center" });
      const headerLine3 = clinicRif ? `Teléfono: ${clinicPhone} | RIF: ${clinicRif}` : `Teléfono: ${clinicPhone}`;
      doc.text(headerLine3, pageWidth / 2, 66, { align: "center" });

      // Header Logo if available
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "PNG", 70, 42, 55, 55);
        } catch {
          // ignore if image format issue
        }
      }

      // Clinic Specialty / Type
      doc.setFont(customFontFamily, "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(90, 90, 90);
      doc.text(clinicType, pageWidth / 2, 88, { align: "center" });

      // Clinic Name in Brand Color
      doc.setFont(customFontFamily, "bold");
      doc.setFontSize(18);
      doc.setTextColor(r, g, b);
      doc.text(clinicName, pageWidth / 2, 108, { align: "center" });

      // Custom Subtitle / Slogan (e.g. #Gente Que Suma)
      let nextY = 121;
      if (customHeaderText) {
        doc.setFont(customFontFamily, "italic");
        doc.setFontSize(10.5);
        doc.setTextColor(80, 80, 80);
        const lines = customHeaderText.replace(/\\n/g, "\n").split("\n");
        lines.forEach((line) => {
          doc.text(line, pageWidth / 2, nextY, { align: "center" });
          nextY += 13;
        });
      }

      // Divider accent line
      const dividerY = Math.max(nextY + 3, 130);
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(1.6);
      doc.line(70, dividerY, pageWidth - 70, dividerY);

      // Watermark
      if (customLogoUrl) {
        try {
          doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
          doc.addImage(customLogoUrl, "PNG", (pageWidth - 250) / 2, (pageHeight - 250) / 2, 250, 250);
          doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
        } catch (e) {
          console.error("Could not draw watermark", e);
        }
      }

      // Date Format: Valle de la Pascua, DD / MM / AAAA
      doc.setFont(customFontFamily, "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(70, 70, 70);
      doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 70, dividerY + 22, { align: "right" });

      // Title (centered & underlined)
      doc.setFont(customFontFamily, "bold");
      doc.setFontSize(13);
      doc.setTextColor(r, g, b);
      doc.text("RÉCIPE / INDICACIONES", pageWidth / 2, dividerY + 46, { align: "center" });
      const titleWidth = doc.getTextWidth("RÉCIPE / INDICACIONES");
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.8);
      doc.line(pageWidth / 2 - titleWidth / 2, dividerY + 49, pageWidth / 2 + titleWidth / 2, dividerY + 49);

      // Patient Name and Age lines
      const metaY = dividerY + 76;
      doc.setFont(customFontFamily, "normal");
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text("Paciente:", 70, metaY);
      doc.line(125, metaY, 390, metaY);
      doc.setFont(customFontFamily, "bold");
      doc.setFontSize(11.5);
      doc.text(patient.full_name, (125 + 390) / 2, metaY - 4, { align: "center" });

      doc.setFont(customFontFamily, "normal");
      doc.setFontSize(11);
      doc.text("Edad:", 405, metaY);
      doc.line(435, metaY, 525, metaY);
      doc.setFont(customFontFamily, "bold");
      doc.setFontSize(11.5);
      doc.text(calculateAge(patient.birth_date), (435 + 525) / 2, metaY - 4, { align: "center" });

      // C.I. line
      let ciLabel = "C.I. V-";
      let displayCI = patient.document_id || "";
      if (displayCI.startsWith("V-")) {
        ciLabel = "C.I. V-";
        displayCI = displayCI.slice(2);
      } else if (displayCI.startsWith("E-")) {
        ciLabel = "C.I. E-";
        displayCI = displayCI.slice(2);
      } else if (displayCI.startsWith("P-")) {
        ciLabel = "Pasaporte ";
        displayCI = displayCI.slice(2);
      } else {
        ciLabel = "C.I. ";
      }

      const ciY = metaY + 28;
      doc.setFont(customFontFamily, "normal");
      doc.setFontSize(11);
      doc.text(ciLabel, 70, ciY);
      const labelWidth = doc.getTextWidth(ciLabel);
      const lineStartX = 70 + labelWidth + 5;
      const lineEndX = 280;
      doc.line(lineStartX, ciY, lineEndX, ciY);
      doc.setFont(customFontFamily, "bold");
      doc.setFontSize(11.5);
      doc.text(displayCI, (lineStartX + lineEndX) / 2, ciY - 4, { align: "center" });

      // Rx body title
      const rxY = ciY + 30;
      doc.setFont(customFontFamily, "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(r, g, b);
      doc.text("Indicaciones:", 70, rxY);

      return rxY + 18;
    };

    const startY = drawHeader();

    // Body Text wrap at 455 pt (70 pt margin left/right)
    doc.setFont(customFontFamily, "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(indicationsText, 455);

    let currentY = startY;
    const lineHeight = 15;

    lines.forEach((line: string) => {
      // If we go beyond 660, start a new page to leave room for the signature block at Y = 700
      if (currentY > 660) {
        doc.addPage();
        
        // Draw running header on next pages
        doc.setFont(customFontFamily, "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(140, 140, 140);
        doc.text(`Paciente: ${patient.full_name} | Fecha: ${topDay}/${topMonth}/${topYear}`, 70, 35);
        
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.5);
        doc.line(70, 40, pageWidth - 70, 40);

        currentY = 60;
        doc.setFont(customFontFamily, "normal");
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
      }
      doc.text(line, 70, currentY);
      currentY += lineHeight;
    });

    // Signature Block at Y = 700 on last page
    const totalPages = doc.getNumberOfPages();
    doc.setPage(totalPages);

    const sigY = 700;
    doc.setDrawColor(120);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(pageWidth / 2 - 100, sigY, pageWidth / 2 + 100, sigY);
    doc.setLineDashPattern([], 0); // Restore solid line

    doc.setFont(customFontFamily, "bold");
    doc.setFontSize(11.5);
    doc.text(doctorName, pageWidth / 2, sigY + 16, { align: "center" });

    doc.setFont(customFontFamily, "normal");
    doc.setFontSize(10.5);
    doc.text(finalSpecialty, pageWidth / 2, sigY + 29, { align: "center" });

    if (docUni) {
      doc.text(docUni, pageWidth / 2, sigY + 42, { align: "center" });
    }

    const regText = `MPPS ${docMpps}   CMC ${docCmc}`;
    doc.text(regText, pageWidth / 2, sigY + 55, { align: "center" });

    // Apply large watermark and page numbers on all pages
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Watermark
      try {
        if (logoBase64) {
          doc.saveGraphicsState();
          const gState = new (doc as any).GState({ opacity: 0.1 });
          doc.setGState(gState);
          // Logo centered: width 550, height 550
          const imgWidth = 550;
          const imgHeight = 550;
          const imgX = (pageWidth - imgWidth) / 2;
          const imgY = (pageHeight - imgHeight) / 2 - 20;
          doc.addImage(logoBase64, "PNG", imgX, imgY, imgWidth, imgHeight);
          doc.restoreGraphicsState();
        }
      } catch (e) {
        console.error("Error drawing watermark:", e);
      }

      // Footer Text and Page numbers if multi-page
      if (customFooterText) {
        doc.setFont(customFontFamily, "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 100, 100);
        const footerLines = customFooterText.split("\\n");
        let fY = pageHeight - 30;
        footerLines.forEach(line => {
          doc.text(line, pageWidth / 2, fY, { align: "center" });
          fY += 10;
        });
      }

      if (totalPages > 1) {
        doc.setFont(customFontFamily, "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 70, pageHeight - 20, { align: "right" });
      }
    }

    const cleanName = patient.full_name.replace(/\s+/g, "_");
    if (returnBlob) {
      return doc.output("blob");
    } else {
      doc.save(`Recipe_${cleanName}_${topYear}${topMonth}${topDay}.pdf`);
      toast.success("Récipe médico exportado correctamente");
    }
  } catch (err) {
    console.error(err);
    toast.error(err instanceof Error ? err.message : "Error al exportar el récipe");
  }
};
