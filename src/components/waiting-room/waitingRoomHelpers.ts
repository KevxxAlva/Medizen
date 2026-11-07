import type { AppointmentWithPatient } from "@/lib/api/appointments";
import type { InvoiceRecord } from "@/components/finance/useSalesInvoices";
import { toast } from "sonner";

export type TriageStage = "por_llegar" | "en_espera" | "en_consulta" | "atendido";

export interface StageRecord {
  stage: TriageStage;
  arrivedAt?: string;
  updatedAt: string;
}

export interface InvoiceAppStatus {
  id_factura: number;
  total: number;
  isPaid: boolean;
  estado: "Pagada" | "Pendiente";
}

export interface WaitingRoomColumns {
  porLlegar: AppointmentWithPatient[];
  enEspera: AppointmentWithPatient[];
  enConsulta: AppointmentWithPatient[];
  atendidos: AppointmentWithPatient[];
}

const LOCAL_STAGE_KEY = "medizen_waiting_room_stages";

const whatsappDateFormatter = new Intl.DateTimeFormat("es-VE", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

export function readLocalStages(): Record<string, StageRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_STAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeLocalStage(citaId: string, record: StageRecord) {
  if (typeof window === "undefined") return;
  try {
    const map = readLocalStages();
    map[citaId] = record;
    window.localStorage.setItem(LOCAL_STAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function mergeAuditStageRows(
  rows: Array<{ entity_id: string | null; details: unknown; created_at: string | null }>,
  localStages: Record<string, StageRecord>,
): Record<string, StageRecord> {
  const merged: Record<string, StageRecord> = { ...localStages };
  for (const row of rows) {
    if (!row.entity_id || !row.details) continue;
    const det = row.details as { stage?: TriageStage; arrivedAt?: string; updatedAt?: string };
    if (!det?.stage) continue;
    const prev = merged[row.entity_id];
    const rowUpdated = row.created_at || det.updatedAt || "";
    if (!prev || rowUpdated >= prev.updatedAt) {
      merged[row.entity_id] = {
        stage: det.stage,
        arrivedAt: det.arrivedAt || prev?.arrivedAt,
        updatedAt: rowUpdated,
      };
    }
  }
  return merged;
}

export function formatWaitMinutes(arrivedIso?: string, nowMs?: number): string | null {
  if (!arrivedIso) return null;
  const start = new Date(arrivedIso).getTime();
  if (isNaN(start)) return null;
  const diffMin = Math.max(0, Math.floor(((nowMs || Date.now()) - start) / 60000));
  if (diffMin < 1) return "Recién llegó";
  if (diffMin < 60) return `${diffMin} min en espera`;
  const hrs = Math.floor(diffMin / 60);
  const rem = diffMin % 60;
  return `${hrs}h ${rem}m en espera`;
}

function normalizeVenezuelanPhone(phone?: string | null): string {
  const clean = (phone || "").replace(/\D/g, "");
  if (clean.startsWith("0")) {
    return "58" + clean.substring(1);
  }
  if (clean.length === 10 && (clean.startsWith("4") || clean.startsWith("2"))) {
    return "58" + clean;
  }
  return clean;
}

export function openAppointmentWhatsAppReminder(params: {
  patientName: string;
  phone?: string | null;
  dateYmd: string;
  timeStr: string;
  doctorName: string;
  reason?: string | null;
  clinicName: string;
}) {
  const { patientName, phone, dateYmd, timeStr, doctorName, reason, clinicName } = params;
  const formattedDate = whatsappDateFormatter.format(new Date(`${dateYmd}T12:00:00`));

  const msg =
    `🏥 *${clinicName.toUpperCase()}*\n\n` +
    `Hola *${patientName}*, te escribimos para confirmar tu cita médica:\n\n` +
    `📅 *Fecha:* ${formattedDate}\n` +
    `🕒 *Hora:* ${timeStr}\n` +
    `👩‍⚕️ *Especialista:* Dr(a). ${doctorName}\n` +
    (reason ? `🩺 *Servicio:* ${reason}\n` : "") +
    `\nPor favor confírmanos tu asistencia por esta vía. ¡Te esperamos!`;

  const cleanPhone = normalizeVenezuelanPhone(phone);
  const encoded = encodeURIComponent(msg);
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, "_blank");
  toast.success("Abriendo recordatorio en WhatsApp...");
}

export function getInvoiceStatusForApp(
  app: AppointmentWithPatient,
  facturas: InvoiceRecord[],
): InvoiceAppStatus | null {
  const matched = facturas.find(
    (f) =>
      Number(f.id_paciente) === Number(app.patient_id) &&
      (f.fecha_emision === app.scheduled_at ||
        Math.abs(new Date(f.fecha_emision).getTime() - new Date(app.scheduled_at).getTime()) <=
          12 * 60 * 60 * 1000),
  );
  if (!matched) return null;
  const isPaid = ["pagado", "pagada", "paid"].includes((matched.estado_pago || "").toLowerCase());
  return {
    id_factura: matched.id_factura,
    total: Number(matched.total_general) || 0,
    isPaid,
    estado: isPaid ? "Pagada" : "Pendiente",
  };
}

export function partitionAppointmentsIntoColumns(
  activeAppointments: AppointmentWithPatient[],
  sharedStages: Record<string, StageRecord>,
): WaitingRoomColumns {
  const porLlegar: AppointmentWithPatient[] = [];
  const enEspera: AppointmentWithPatient[] = [];
  const enConsulta: AppointmentWithPatient[] = [];
  const atendidos: AppointmentWithPatient[] = [];

  for (const app of activeAppointments) {
    const statusLower = (app.status || "").toLowerCase();
    if (statusLower === "completada" || app.has_consultation) {
      atendidos.push(app);
      continue;
    }
    const st = sharedStages[app.id]?.stage || "por_llegar";
    if (st === "en_espera") enEspera.push(app);
    else if (st === "en_consulta") enConsulta.push(app);
    else if (st === "atendido") atendidos.push(app);
    else porLlegar.push(app);
  }

  return { porLlegar, enEspera, enConsulta, atendidos };
}
