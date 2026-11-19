import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Appointment } from "@/lib/api/appointments";
import { useDoctors } from "@/lib/api/profiles";
import { useServices } from "@/lib/api/services";
import { Loader2, Stethoscope } from "lucide-react";
import { AppointmentPatientSelect } from "./appointment/AppointmentPatientSelect";
import { AppointmentServiceSelect } from "./appointment/AppointmentServiceSelect";
import { useAppointmentFormState } from "./appointment/useAppointmentFormState";

const STATUSES = ["programada", "completada", "cancelada"];

export function AppointmentForm({
  open,
  onOpenChange,
  appointment,
  defaultPatientId,
  defaultDate,
  initialDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment?: Appointment | null;
  defaultPatientId?: string;
  defaultDate?: string;
  initialDate?: string;
}) {
  const { data: doctors = [] } = useDoctors();
  const { data: services = [] } = useServices();

  const effectiveDefaultDate = defaultDate || initialDate;

  const {
    isEdit,
    patient_id,
    setPatient,
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
    busy,
    handleSubmit,
  } = useAppointmentFormState({
    open,
    appointment,
    defaultPatientId,
    defaultDate: effectiveDefaultDate,
    doctors,
    onOpenChange,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cita" : "Nueva cita"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Actualiza los datos de la cita." : "Programa una cita médica."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <AppointmentPatientSelect value={patient_id} onChange={setPatient} />

          <div className="grid gap-2">
            <Label>Médico</Label>
            {isDoctorOnly ? (
              <div className="flex items-center gap-2.5 h-10 px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/[0.07] text-sm font-bold text-foreground">
                <Stethoscope className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">Dr(a). {selectedDoctor?.full_name || doctorName || "Especialista asignado"}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                  Tú
                </span>
              </div>
            ) : (
              <Select value={doctor_id || undefined} onValueChange={setDoctorId}>
                <SelectTrigger><SelectValue placeholder="Selecciona doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.length === 0 ? (
                    <SelectItem value="none" disabled>No hay doctores registrados</SelectItem>
                  ) : (
                    doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name || d.email}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Hora</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Duración (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Precio</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={status || undefined} onValueChange={setStatus}>
                <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <AppointmentServiceSelect
            value={selectedServiceId}
            services={services}
            doctors={doctors}
            selectedDoctor={selectedDoctor}
            doctor_id={doctor_id}
            onSelectService={(s) => {
              setSelectedServiceId(String(s.id_servicio));
              setPrice(String(s.costo_base || 0));
              setReason(s.nombre_servicio);
            }}
            onResetService={() => setSelectedServiceId("none")}
            onAutoSelectDoctor={(matchId) => setDoctorId(matchId)}
          />

          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo o Detalles Adicionales</Label>
            <Input id="reason" value={reason ?? ""} onChange={(e) => setReason(e.target.value)} placeholder="Control, ecografía…" />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy} className="bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground hover:opacity-95">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear cita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
