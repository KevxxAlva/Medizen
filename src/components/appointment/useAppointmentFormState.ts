import { useState, useMemo, useEffect, useCallback } from "react";
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  type Appointment,
  type AppointmentWithPatient,
} from "@/lib/api/appointments";
import { useAuthSession } from "@/hooks/useAuth";
import { useUserRoleScope } from "@/hooks/useUserRoleScope";
import type { Profile } from "@/lib/api/profiles";
import type { Patient } from "@/lib/api/patients";
import { toast } from "sonner";

export interface SavedAppointmentSummary {
  isEdit: boolean;
  patientName: string;
  patientPhone: string | null;
  patientDocumentId: string | null;
  doctorName: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  reason: string;
  status: string;
}

export function splitDateTime(iso: string | null | undefined, defaultDate?: string) {
  if (!iso) {
    return {
      date: defaultDate && defaultDate !== "" ? defaultDate : new Date().toISOString().slice(0, 10),
      time: "09:00",
    };
  }
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

interface UseAppointmentFormStateProps {
  open: boolean;
  appointment?: Appointment | null;
  defaultPatientId?: string;
  defaultDate?: string;
  doctors: Profile[];
  onOpenChange: (open: boolean) => void;
}

export function useAppointmentFormState({
  open,
  appointment,
  defaultPatientId,
  defaultDate,
  doctors,
}: UseAppointmentFormStateProps) {
  const isEdit = !!appointment;
  const { user } = useAuthSession();
  const { doctorId: authDoctorId, isDoctorOnly, doctorName } = useUserRoleScope();

  const init = useMemo(() => splitDateTime(appointment?.scheduled_at, defaultDate), [appointment, defaultDate]);
  const [patient_id, setPatient] = useState(appointment?.patient_id ?? defaultPatientId ?? "");
  const [resolvedPatient, setResolvedPatient] = useState<Patient | null>(null);

  const defaultDoctorId = useMemo(() => {
    if (appointment?.doctor_id) return appointment.doctor_id;
    if (authDoctorId) return authDoctorId;
    const match = doctors.find(
      (d) =>
        (d.auth_id && user?.id && d.auth_id === user.id) ||
        (d.email && user?.email && d.email.toLowerCase() === user.email.toLowerCase())
    );
    return match?.id || doctors[0]?.id || "";
  }, [appointment?.doctor_id, authDoctorId, doctors, user]);

  const [doctor_id, setDoctorId] = useState(() => appointment?.doctor_id ?? defaultDoctorId);

  useEffect(() => {
    if (open) {
      if (!appointment?.doctor_id) {
        if (defaultDoctorId) setDoctorId(defaultDoctorId);
      } else {
        setDoctorId(appointment.doctor_id);
      }
    } else if (!appointment?.doctor_id && defaultDoctorId && (!doctor_id || isDoctorOnly)) {
      setDoctorId(defaultDoctorId);
    }
  }, [open, appointment?.doctor_id, defaultDoctorId, isDoctorOnly, doctor_id]);

  const [date, setDate] = useState(init.date);
  const [time, setTime] = useState(init.time);
  const [reason, setReason] = useState(appointment?.reason ?? "");
  const [status, setStatus] = useState(appointment?.status ?? "programada");
  const [duration, setDuration] = useState(String(appointment?.duration_minutes ?? 30));
  const [price, setPrice] = useState(String(appointment?.price ?? 0));
  const [selectedServiceId, setSelectedServiceId] = useState<string>("none");
  const [savedSummary, setSavedSummary] = useState<SavedAppointmentSummary | null>(null);

  useEffect(() => {
    if (!open) {
      setSavedSummary(null);
    }
  }, [open]);

  const selectedDoctor = useMemo(() => doctors.find((d) => d.id === doctor_id), [doctors, doctor_id]);

  // Real-time doctor availability for the selected date
  const { data: doctorDayAppointments = [] } = useAppointments({
    from: date || undefined,
    to: date || undefined,
    doctorId: doctor_id || undefined,
  });

  const activeDayAppointments = useMemo(() => {
    return doctorDayAppointments.filter((a) => {
      if (appointment && String(a.id) === String(appointment.id)) return false;
      const st = String(a.status || "").toLowerCase();
      return st !== "cancelada" && st !== "cancelled";
    });
  }, [doctorDayAppointments, appointment]);

  const findConflictForRange = useCallback(
    (candidateTime: string, candidateDurationMin: number): AppointmentWithPatient | null => {
      if (!date || !candidateTime || !doctor_id) return null;
      if (status.toLowerCase() === "cancelada") return null;
      const startMs = new Date(`${date}T${candidateTime}:00`).getTime();
      if (Number.isNaN(startMs)) return null;
      const endMs = startMs + Math.max(15, candidateDurationMin || 30) * 60 * 1000;

      for (const existing of activeDayAppointments) {
        const exStart = new Date(existing.scheduled_at.replace(" ", "T")).getTime();
        if (Number.isNaN(exStart)) continue;
        const exEnd = exStart + Math.max(15, existing.duration_minutes || 30) * 60 * 1000;
        if (startMs < exEnd && exStart < endMs) {
          return existing;
        }
      }
      return null;
    },
    [date, doctor_id, status, activeDayAppointments]
  );

  const conflictingAppointment = useMemo(
    () => findConflictForRange(time, Number(duration) || 30),
    [findConflictForRange, time, duration]
  );

  const isSlotOccupied = useCallback(
    (slotTime: string) => Boolean(findConflictForRange(slotTime, Number(duration) || 30)),
    [findConflictForRange, duration]
  );

  const create = useCreateAppointment();
  const update = useUpdateAppointment();
  const busy = create.isPending || update.isPending;

  const resetForAnother = useCallback(() => {
    setSavedSummary(null);
    setPatient(defaultPatientId ?? "");
    setResolvedPatient(null);
    setSelectedServiceId("none");
    setReason("");
    setPrice("0");
    setDuration("30");
    setStatus("programada");
  }, [defaultPatientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient_id) {
      toast.error("Selecciona o registra un paciente");
      return;
    }
    if (!doctor_id) {
      toast.error("Selecciona un especialista");
      return;
    }
    if (conflictingAppointment && status.toLowerCase() !== "cancelada") {
      toast.error(
        `Conflicto de horario: este médico ya tiene una cita con ${conflictingAppointment.patient_name || "otro paciente"} en ese horario.`
      );
      return;
    }
    const scheduled_at = `${date}T${time}:00`;
    const durationNum = Number(duration) || 30;
    const priceNum = Number(price) || 0;
    const payload = {
      patient_id,
      doctor_id,
      scheduled_at,
      duration_minutes: durationNum,
      reason: reason || null,
      status,
      price: priceNum,
    };
    try {
      if (isEdit && appointment) {
        await update.mutateAsync({ id: appointment.id, ...payload });
        toast.success("Cita actualizada");
      } else {
        await create.mutateAsync(payload);
        toast.success("Cita programada correctamente");
      }

      const resolvedDocName =
        selectedDoctor?.full_name ||
        doctorName ||
        selectedDoctor?.email ||
        "Especialista asignado";

      setSavedSummary({
        isEdit,
        patientName:
          resolvedPatient?.full_name ||
          (appointment as any)?.patient_name ||
          "Paciente",
        patientPhone: resolvedPatient?.phone || null,
        patientDocumentId: resolvedPatient?.document_id || null,
        doctorName: resolvedDocName,
        date,
        time,
        duration: durationNum,
        price: priceNum,
        reason: reason || "Consulta Médica",
        status,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar la cita");
    }
  };

  return {
    isEdit,
    patient_id,
    setPatient,
    resolvedPatient,
    setResolvedPatient,
    doctor_id,
    setDoctorId,
    selectedDoctor,
    isDoctorOnly,
    doctorName,
    date,
    setDate,
    time,
    setTime,
    reason,
    setReason,
    status,
    setStatus,
    duration,
    setDuration,
    price,
    setPrice,
    selectedServiceId,
    setSelectedServiceId,
    savedSummary,
    resetForAnother,
    conflictingAppointment,
    isSlotOccupied,
    busy,
    handleSubmit,
  };
}
