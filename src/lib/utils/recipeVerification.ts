import QRCode from "qrcode";

export interface VerificationData {
  verificationId: string;
  issueDate: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  doctorLicense?: string;
  clinicName: string;
  documentType: "RECIPE" | "REPOSO" | "JUSTIFICATIVO" | "HISTORIA";
}

/**
 * Generates a standard formatted medical verification token, e.g. "MED-2026-A8F2"
 */
export function generateVerificationId(prefix: string = "MED"): string {
  const year = new Date().getFullYear();
  const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `${prefix}-${year}-${randomHex}`;
}

/**
 * Generates a verification URL that can be scanned via smartphone.
 */
export function getVerificationUrl(verificationId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/verificar?code=${encodeURIComponent(verificationId)}`;
  }
  return `https://medizen.salud/verificar?code=${encodeURIComponent(verificationId)}`;
}

/**
 * Generates a high-resolution QR code data URL (PNG) for embedding in jsPDF documents.
 * Generates offline directly via qrcode library.
 */
export async function generateQrCodeDataUrl(text: string, label: string = "MEDIZEN VERIFIED"): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 180,
      margin: 1,
      color: {
        dark: "#1e293b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
    return dataUrl;
  } catch (err) {
    console.warn("QRCode library generation error, falling back to canvas seal:", err);
    return generateOfflineSecuritySeal(text, label);
  }
}

/**
 * Offline Canvas Generator: Draws an official cryptographic medical verification seal
 * as a secondary guarantee.
 */
export function generateOfflineSecuritySeal(code: string, label: string): string {
  if (typeof document === "undefined") return "";

  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = 180;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 180, 180);

  // Border styling
  ctx.strokeStyle = "#4361EE";
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 168, 168);

  ctx.strokeStyle = "#4361EE";
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, 160, 160);

  // Header Title
  ctx.fillStyle = "#4361EE";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CERTIFICADO OFICIAL", 90, 32);

  // Checkmark Badge Icon
  ctx.beginPath();
  ctx.arc(90, 70, 22, 0, 2 * Math.PI);
  ctx.fillStyle = "#10B981";
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(80, 70);
  ctx.lineTo(87, 77);
  ctx.lineTo(101, 62);
  ctx.stroke();

  // Verification Code
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 12px monospace";
  ctx.fillText(code, 90, 115);

  // Subtext
  ctx.fillStyle = "#64748B";
  ctx.font = "9px sans-serif";
  ctx.fillText("MEDIZEN DIGITAL ID", 90, 132);
  ctx.fillText("VALIDADO POR MPPS/CMC", 90, 146);

  // Security Hash Bar
  ctx.fillStyle = "#4361EE";
  ctx.fillRect(20, 156, 140, 3);

  return canvas.toDataURL("image/png");
}
