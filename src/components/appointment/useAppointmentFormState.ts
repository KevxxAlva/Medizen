import { useState, useMemo, useEffect } from "react";
import { useCreateAppointment, useUpdateAppointment, type Appointment } from "@/lib/api/appointments";
import { useAuthSession } from "@/hooks/useAuth";
import type { Profile } from "@/lib/api/profiles";
import { toast } from "sonner";

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
  onOpenChange,
}: UseAppointmentFormStateProps) {
  const isEdit = !!appointment;
  const { user } = useAuthSession();

  const init = useMemo(() => splitDateTime(appointment?.scheduled_at, defaultDate), [appointment, defaultDate]);
  const [patient_id, setPatient] = useState(appointment?.patient_id ?? defaultPatientId ?? "");
  const defaultDoctorId = useMemo(
    () => doctors.find((d) => d.email === user?.email)?.id || doctors[0]?.id || "",
    [doctors, user]
  );
  const [doctor_id, setDoctorId] = useState(appointment?.doctor_id ?? defaultDoctorId);
  const [date, setDate] = useState(init.date);
  const [time, setTime] = useState(init.time);
  const [reason, setReason] = useState(appointment?.reason ?? "");
  const [status, setStatus] = useState(appointment?.status ?? "programada");
  const [duration, setDuration] = useState(String(appointment?.duration_minutes ?? 30));
  const [price, setPrice] = useState(String(appointment?.price ?? 0));
  const [selectedServiceId, setSelectedServiceId] = useState<string>("none");

  const selectedDoctor = useMemo(() => doctors.find((d) => d.id === doctor_id), [doctors, doctor_id]);

  const create = useCreateAppointment();
  const update = useUpdateAppointment();
  const busy = create.isPending || update.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient_id) {
      toast.error("Selecciona un paciente");
      return;
    }
    if (!doctor_id) {
      toast.error("Falta seleccionar un doctor");
      return;
    }
    const scheduled_at = `${date}T${time}:00`;
    const payload = {
      patient_id,
      doctor_id,
      scheduled_at,
      duration_minutes: Number(duration) || 30,
      reason: reason || null,
      status,
      price: Number(price) || 0,
    };
    try {
      if (isEdit && appointment) {
        await update.mutateAsync({ id: appointment.id, ...payload });
        toast.success("Cita actualizada");
      } else {
        await create.mutateAsync(payload);
        toast.success("Cita programada");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    }
  };

  return {
    isEdit,
    patient_id,
    setPatient,
    doctor_id,
    setDoctorId,
    selectedDoctor,
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
    busy,
    handleSubmit,
  };
}
