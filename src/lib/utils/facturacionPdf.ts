import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { AppointmentWithPatient } from "@/lib/api/appointments";
import { ClinicInfo } from "@/lib/api/clinic";

export const loadLogoBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
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

export async function exportInvoicePDF(
  a: AppointmentWithPatient,
  doctorName: string,
  clinic: ClinicInfo | undefined | null,
) {
  try {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const invoiceNumber = `REC-${String(a.id).padStart(5, "0")}`;
    const clinicName = clinic?.name || "Clínica Especializada";
    const clinicAddress = clinic?.address_line1 || "Centro Profesional Médico";
    const clinicPhone = clinic?.phone || "Tel: +58 (241) 000-0000";

    if (clinic?.recipe_logo_url) {
      try {
        const logoData = await loadLogoBase64(clinic.recipe_logo_url);
        if (logoData) {
          doc.addImage(logoData, "PNG", 50, 40, 65, 65);
        }
      } catch {}
    }

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text(clinicName.toUpperCase(), 130, 60);

    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.text(clinicAddress, 130, 75);
    doc.text(clinicPhone, 130, 88);

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("COMPROBANTE DE PAGO", 400, 60);
    doc.setFontSize(10);
    doc.setTextColor(108, 92, 124);
    doc.text(`N°: ${invoiceNumber}`, 400, 75);
    doc.setTextColor(0, 0, 0);
    doc.setFont("times", "normal");
    const emissionDate = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    doc.text(`Fecha: ${emissionDate}`, 400, 88);

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.line(50, 115, 560, 115);

    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text("DATOS DEL PACIENTE", 50, 135);

    doc.setFont("times", "normal");
    doc.text(`Nombre: ${a.patient_name}`, 50, 150);
    doc.text(`Médico Tratante: Dr(a). ${doctorName}`, 50, 165);

    const aptDate = new Date(a.scheduled_at).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    doc.text(`Fecha de Atención: ${aptDate}`, 350, 150);
    doc.text(`Método de Pago: ${a.payment_method || "Efectivo"}`, 350, 165);
    if (a.payment_reference) {
      doc.text(`Referencia: ${a.payment_reference}`, 350, 180);
    }

    const tableData = [
      [
        a.reason || "Consulta Médica Especializada",
        "1",
        `$${Number(a.price || 0).toFixed(2)}`,
        `$${Number(a.price || 0).toFixed(2)}`,
      ],
    ];

    autoTable(doc, {
      head: [["Descripción del Concepto / Servicio", "Cant.", "Precio Unit.", "Total"]],
      body: tableData,
      startY: 200,
      styles: { font: "times", fontSize: 10, cellPadding: 8 },
      headStyles: { fillColor: [108, 92, 124], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 300 },
        1: { cellWidth: 50, halign: "center" },
        2: { cellWidth: 80, halign: "right" },
        3: { cellWidth: 80, halign: "right" },
      },
      margin: { left: 50, right: 50 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text(`TOTAL PAGADO: $${Number(a.price || 0).toFixed(2)} USD`, 410, finalY);

    doc.setFont("times", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Este documento es un comprobante de control interno de caja y atención clínica.", 50, 720);
    doc.text(`Emitido electrónicamente por el sistema Medizen para ${a.patient_name}.`, 50, 732);

    doc.save(`Recibo_${invoiceNumber}_${(a.patient_name || "paciente").replace(/\s+/g, "_")}.pdf`);
    toast.success("Recibo PDF descargado exitosamente");
  } catch {
    toast.error("Error al generar el recibo PDF");
  }
}

export async function exportMonthlyReportPDF(
  filtered: AppointmentWithPatient[],
  selectedMonthObj: { key: string; label: string } | undefined,
  clinic: ClinicInfo | undefined | null,
) {
  try {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const titleMonth = selectedMonthObj ? selectedMonthObj.label : "Reporte General Consolidado";
    const clinicName = clinic?.name || "Clínica Especializada";

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text(clinicName.toUpperCase(), 50, 50);

    doc.setFontSize(13);
    doc.text(`REPORTE DE FACTURACIÓN Y CAJA — ${titleMonth.toUpperCase()}`, 50, 70);

    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.text(`Fecha de Impresión: ${new Date().toLocaleDateString("es-ES")}`, 50, 85);

    const paidList = filtered.filter((f) => f.status === "completada");
    const unpaidList = filtered.filter((f) => f.status === "programada");
    const totalPaid = paidList.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
    const totalUnpaid = unpaidList.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

    doc.text(`Total Recaudado: $${totalPaid.toLocaleString("es-ES")} USD (${paidList.length} cobrados)`, 50, 110);
    doc.text(`Total por Recaudar: $${totalUnpaid.toLocaleString("es-ES")} USD (${unpaidList.length} pendientes)`, 50, 125);

    const tableHeaders = [["Fecha", "Paciente", "Concepto", "Monto", "Estado", "Método", "Referencia"]];
    const tableRows = filtered.map((a) => {
      const dateStr = new Date(a.scheduled_at).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      let displayStatus = "Pendiente";
      if (a.status === "completada") {
        displayStatus = a.payment_method ? "Cobrada" : "Por Cobrar";
      } else if (a.status === "cancelada") {
        displayStatus = "Cancelada";
      }

      return [
        dateStr,
        a.patient_name || "—",
        a.reason || "Consulta general",
        `$${Number(a.price || 0).toFixed(2)}`,
        displayStatus,
        a.payment_method || "—",
        a.payment_reference || "—",
      ];
    });

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 145,
      styles: { font: "times", fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [108, 92, 124], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 120 },
        2: { cellWidth: 100 },
        3: { cellWidth: 55, halign: "right" },
        4: { cellWidth: 65 },
        5: { cellWidth: 65 },
        6: { cellWidth: 65 },
      },
      margin: { left: 50, right: 50 },
    });

    const filename = selectedMonthObj
      ? `Reporte_Facturacion_${selectedMonthObj.key}.pdf`
      : `Reporte_Facturacion_General.pdf`;

    doc.save(filename);
    toast.success("Reporte PDF generado con éxito");
  } catch {
    toast.error("Error al exportar reporte mensual");
  }
}
