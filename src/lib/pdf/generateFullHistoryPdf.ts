import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchPatientById } from "@/lib/api/patients";
import { getClinicPdfConfig, drawPdfHeader, drawPdfWatermark, drawPdfFooter } from "@/lib/utils/pdfConfig";

export const generateFullHistoryPdf = async (patientId: string) => {
  try {
    toast.info("Generando expediente completo... esto puede tardar unos segundos.");

    // 1. Fetch patient data using normalized mapper
    const patient = await fetchPatientById(patientId);
    if (!patient) throw new Error("No se pudo cargar la información del paciente.");

    // 2. Fetch clinical history and consultations using real schema columns
    const { data: hc } = await supabase
      .from("historias_clinicas")
      .select("id_historia")
      .eq("id_paciente", parseInt(patientId, 10))
      .maybeSingle();

    let consultations: any[] = [];
    if (hc?.id_historia) {
      const { data: consData } = await supabase
        .from("consultas")
        .select("*")
        .eq("id_historia", hc.id_historia)
        .order("fecha_hora", { ascending: false });
      consultations = consData || [];
    }

    // 3. Fetch doctors to map IDs
    const { data: medicos } = await supabase
      .from("medicos")
      .select("id_medico, nombre, apellido");
    const doctorMap = new Map(
      (medicos || []).map((m: any) => [String(m.id_medico), `${m.nombre || ""} ${m.apellido || ""}`.trim()])
    );

    // 4. Dynamically import PDF libraries on demand
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

    const today = new Date();
    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(10.5);
    doc.text(
      `Generado: ${today.toLocaleDateString("es-ES")} ${today.toLocaleTimeString("es-ES")}`,
      pageWidth - 40,
      155,
      { align: "right" }
    );

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("EXPEDIENTE CLÍNICO COMPLETO", pageWidth / 2, 195, { align: "center" });
    const titleWidth = doc.getTextWidth("EXPEDIENTE CLÍNICO COMPLETO");
    doc.setDrawColor(0);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

    // Section: Datos Demográficos
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("1. Datos de Identificación y Cobertura", 40, 225);

    autoTable(doc, {
      startY: 235,
      body: [
        [
          "Nº Historia",
          patient.historia_number ? `HC-${String(patient.historia_number).padStart(5, "0")}` : `HC-${String(patient.id).padStart(5, "0")}`,
          "Cédula",
          patient.document_id || "—",
        ],
        ["Nombre Completo", patient.full_name || "—", "Sexo / Grupo Rh", `${patient.gender || "—"} / ${patient.blood_type || "—"}`],
        ["F. Nacimiento", patient.birth_date || "—", "Teléfono", patient.phone || "—"],
        ["Correo", patient.email || "—", "Estado Civil / Ocupación", `${patient.marital_status || "—"} / ${patient.occupation || "—"}`],
        ["Contacto Emergencia", { content: patient.emergency_contact || "No registrado", colSpan: 3 }],
        ["Dirección", { content: patient.address || "—", colSpan: 3 }],
        [
          "Médico Tratante",
          doctorMap.get(patient.assigned_doctor_id ?? "") || "Sin asignar",
          "Seguro / Cobertura",
          patient.insurance_provider || "Particular",
        ],
      ],
      theme: "grid",
      styles: { font: "times", fontSize: 9.5, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 95 },
        1: { cellWidth: 162 },
        2: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 105 },
        3: { cellWidth: 153 }
      },
      margin: { left: 40, right: 40 },
    });

    // Section: Antecedentes
    let currentY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("2. Antecedentes Médicos", 40, currentY);

    const famStr = patient.family_history
      ? [
          patient.family_history.mother && `Madre: ${patient.family_history.mother}`,
          patient.family_history.father && `Padre: ${patient.family_history.father}`,
          patient.family_history.siblings && `Hermanos: ${patient.family_history.siblings}`,
          patient.family_history.children && `Hijos: ${patient.family_history.children}`,
        ]
          .filter(Boolean)
          .join(" | ") || "Niega"
      : "Niega";

    const persStr = patient.personal_history
      ? [
          patient.personal_history.allergies && `Alergias: ${patient.personal_history.allergies}`,
          patient.personal_history.base_pathology && `Patología Base: ${patient.personal_history.base_pathology}`,
          patient.personal_history.current_medications && `Medicación Activa: ${patient.personal_history.current_medications}`,
          patient.personal_history.surgical && `Quirúrgicos: ${patient.personal_history.surgical}`,
          patient.personal_history.transfusions && `Transfusiones/Vacunas: ${patient.personal_history.transfusions}`,
        ]
          .filter(Boolean)
          .join(" | ") || "Niega"
      : "Niega";

    autoTable(doc, {
      startY: currentY + 10,
      body: [
        ["Familiares", famStr],
        ["Personales y Medicación", persStr],
        [
          "Gineco-Obstétricos",
          `G: ${patient.obstetric_data?.g ?? 0} P: ${patient.obstetric_data?.p ?? 0} C: ${patient.obstetric_data?.c ?? 0} A: ${patient.obstetric_data?.a ?? 0} | FUM: ${patient.obstetric_data?.fum || "—"} | EG: ${patient.obstetric_data?.eg || "—"} | FPP: ${patient.obstetric_data?.fpp || "—"}`,
        ],
      ],
      theme: "grid",
      styles: { font: "times", fontSize: 9.5, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 120 },
        1: { cellWidth: 395 }
      },
      margin: { left: 40, right: 40 },
    });

    // Section: Consultas
    currentY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("3. Historial de Consultas", 40, currentY);

    if (!consultations || consultations.length === 0) {
      doc.setFont("times", "italic");
      doc.setFontSize(10);
      doc.text("No se registran consultas previas.", 40, currentY + 15);
    } else {
      consultations.forEach((consulta: any, index: number) => {
        const rawDate = consulta.fecha_hora || consulta.fecha_consulta;
        const dateStr = rawDate
          ? new Date(rawDate).toLocaleDateString("es-ES")
          : "Fecha desconocida";

        let parsedObs: Record<string, any> = {};
        if (typeof consulta.notas_medicas === "string" && consulta.notas_medicas.trim().startsWith("{")) {
          try {
            parsedObs = JSON.parse(consulta.notas_medicas);
          } catch {
            parsedObs = {};
          }
        }

        if (currentY > pageHeight - 150) {
          doc.addPage();
          currentY = 50;
        } else {
          currentY += 15;
        }

        doc.setFont("times", "bold");
        doc.setFontSize(11);
        doc.setTextColor(139, 92, 175);
        doc.text(`Consulta #${consultations.length - index} - ${dateStr}`, 40, currentY);
        doc.setTextColor(0, 0, 0);

        const consultaBody: [string, string][] = [];
        const motivo = consulta.motivo_consulta || parsedObs.subjective_exam || consulta.sintomas;
        if (motivo) consultaBody.push(["Motivo / Subjetivo", motivo]);
        if (consulta.peso_kg || consulta.presion_arterial || parsedObs.height_cm || consulta.temperatura_c) {
          consultaBody.push([
            "Signos Vitales",
            `Peso: ${consulta.peso_kg || parsedObs.weight_kg || "-"} kg, Talla: ${parsedObs.height_cm || "-"} cm, PA: ${consulta.presion_arterial || parsedObs.blood_pressure || "-"}, Temp: ${consulta.temperatura_c || parsedObs.temperature || "-"} °C, FC: ${parsedObs.heart_rate || "-"} lpm`,
          ]);
        }
        if (consulta.diagnostico || parsedObs.diagnosis) {
          consultaBody.push(["Diagnóstico", consulta.diagnostico || parsedObs.diagnosis]);
        }
        if (parsedObs.plan) {
          consultaBody.push(["Plan de Manejo", parsedObs.plan]);
        }
        if (parsedObs.indications || consulta.tratamiento) {
          consultaBody.push(["Indicaciones / Récipe", parsedObs.indications || consulta.tratamiento]);
        }

        if (consultaBody.length > 0) {
          autoTable(doc, {
            startY: currentY + 8,
            body: consultaBody,
            theme: "plain",
            styles: { font: "times", fontSize: 9.5, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.1 },
            columnStyles: {
              0: { fontStyle: "bold", cellWidth: 110 },
              1: { cellWidth: 405 }
            },
            margin: { left: 40, right: 40 },
          });
          currentY = (doc as any).lastAutoTable.finalY + 10;
        }
      });
    }

    // Add watermark and footer to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      drawPdfWatermark(doc, config, pageWidth, pageHeight);
      drawPdfFooter(doc, config, pageWidth, pageHeight);
    }

    doc.save(`Expediente_${(patient.full_name || "Paciente").replace(/\s+/g, "_")}.pdf`);
    toast.success("Expediente completo generado con éxito.");
  } catch (error) {
    console.error("Error generando expediente:", error);
    toast.error(error instanceof Error ? error.message : "Error al generar el expediente.");
  }
};

