import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppointments, type AppointmentWithPatient } from "@/lib/api/appointments";
import type { DoctorOption } from "@/lib/api/profiles";
import type { InvoiceRecord } from "@/components/finance/useSalesInvoices";
import { logAuditAction } from "@/lib/api/audit";
import { toast } from "sonner";
import {
  getInvoiceStatusForApp,
  mergeAuditStageRows,
  partitionAppointmentsIntoColumns,
  readLocalStages,
  writeLocalStage,
  type StageRecord,
  type TriageStage,
} from "./waitingRoomHelpers";

function notifyStageTransition(patientName: string, nextStage: TriageStage) {
  if (nextStage === "en_espera") {
    toast.success(`${patientName} registrado en Sala de Espera`);
  } else if (nextStage === "en_consulta") {
    toast.success(`${patientName} ingresó a Consultorio`);
  } else if (nextStage === "por_llegar") {
    toast.info(`${patientName} devuelto a Por Llegar`);
  }
}

function buildPatientContactMap(
  rows: Array<{
    id_paciente: number;
    telefono: string | null;
    documento_identidad: string | null;
  }>,
) {
  const map = new Map<string, { phone: string | null; doc: string | null }>();
  for (const p of rows) {
    map.set(String(p.id_paciente), {
      phone: p.telefono || null,
      doc: p.documento_identidad || null,
    });
  }
  return map;
}

export function useWaitingRoomData(params: {
  selectedDate: string;
  effectiveDoctorFilter?: string;
  doctors: DoctorOption[];
  facturas: InvoiceRecord[];
}) {
  const { selectedDate, effectiveDoctorFilter, doctors, facturas } = params;
  const qc = useQueryClient();

  const { data: appointments = [], isLoading } = useAppointments({
    from: `${selectedDate}T00:00:00`,
    to: selectedDate,
    doctorId: effectiveDoctorFilter,
    includeInvoices: true,
    ascending: true,
  });

  const { data: sharedStages = {} } = useQuery({
    queryKey: ["waiting_room_stages", selectedDate],
    staleTime: 0,
    refetchInterval: 4000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<Record<string, StageRecord>> => {
      const { data } = await supabase
        .from("audit_logs")
        .select("entity_id, details, created_at")
        .eq("entity_type", "WAITING_ROOM")
        .order("created_at", { ascending: true })
        .limit(300);

      return mergeAuditStageRows(data ?? [], readLocalStages());
    },
  });

  const patientIds = useMemo(
    () => [
      ...new Set(appointments.map((a) => Number(a.patient_id)).filter((n) => !isNaN(n) && n > 0)),
    ],
    [appointments],
  );

  const {
    data: patientContactMap = new Map<string, { phone: string | null; doc: string | null }>(),
  } = useQuery({
    queryKey: ["waiting_room_contacts", patientIds.join(",")],
    enabled: patientIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("pacientes")
        .select("id_paciente, telefono, documento_identidad")
        .in("id_paciente", patientIds);
      return buildPatientContactMap(data ?? []);
    },
  });

  const doctorMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of doctors) {
      m.set(String(d.id), d.full_name || d.email || "Especialista");
    }
    return m;
  }, [doctors]);

  const activeAppointments = useMemo(
    () => appointments.filter((a) => (a.status || "").toLowerCase() !== "cancelada"),
    [appointments],
  );

  const columns = useMemo(
    () => partitionAppointmentsIntoColumns(activeAppointments, sharedStages),
    [activeAppointments, sharedStages],
  );

  const pendingCashCount = useMemo(() => {
    return columns.atendidos.filter((a) => {
      const inv = getInvoiceStatusForApp(a, facturas);
      return !inv || !inv.isPaid;
    }).length;
  }, [columns.atendidos, facturas]);

  const handleStageTransition = async (app: AppointmentWithPatient, nextStage: TriageStage) => {
    const nowIso = new Date().toISOString();
    const currentRecord = sharedStages[app.id];
    const arrivedAt =
      nextStage === "en_espera"
        ? nowIso
        : currentRecord?.arrivedAt || (nextStage === "en_consulta" ? nowIso : undefined);

    const nextRecord: StageRecord = {
      stage: nextStage,
      arrivedAt,
      updatedAt: nowIso,
    };

    writeLocalStage(app.id, nextRecord);
    await logAuditAction("STAGE_CHANGE", "WAITING_ROOM", app.id, {
      stage: nextStage,
      arrivedAt,
      updatedAt: nowIso,
      patient_name: app.patient_name,
      message: `Paciente ${app.patient_name} pasó a etapa: ${nextStage.replace("_", " ")}`,
    });

    await qc.invalidateQueries({ queryKey: ["waiting_room_stages"] });
    await qc.invalidateQueries({ queryKey: ["audit_logs"] });
    notifyStageTransition(app.patient_name || "Paciente", nextStage);
  };

  return {
    isLoading,
    sharedStages,
    patientContactMap,
    doctorMap,
    columns,
    pendingCashCount,
    handleStageTransition,
  };
}
