import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Service } from "@/lib/api/services";
import type { Profile } from "@/lib/api/profiles";

interface AppointmentServiceSelectProps {
  value: string;
  services: Service[];
  doctors: Profile[];
  selectedDoctor?: Profile;
  doctor_id: string;
  onSelectService: (service: Service) => void;
  onResetService: () => void;
  onAutoSelectDoctor: (doctorId: string) => void;
}

export function AppointmentServiceSelect({
  value,
  services,
  doctors,
  selectedDoctor,
  doctor_id,
  onSelectService,
  onResetService,
  onAutoSelectDoctor,
}: AppointmentServiceSelectProps) {
  const { matchingServices, generalServices, otherServices } = useMemo(() => {
    const docSpec = selectedDoctor?.specialty?.toLowerCase().trim() || "";
    const matching: Service[] = [];
    const general: Service[] = [];
    const others: Service[] = [];

    services.forEach((s) => {
      const sSpec = s.especialidades?.nombre?.toLowerCase().trim() || "";
      if (!s.id_especialidad) {
        general.push(s);
      } else if (docSpec && (sSpec.includes(docSpec) || docSpec.includes(sSpec))) {
        matching.push(s);
      } else {
        others.push(s);
      }
    });

    return { matchingServices: matching, generalServices: general, otherServices: others };
  }, [services, selectedDoctor]);

  const handleChange = (val: string) => {
    if (val === "none") {
      onResetService();
      return;
    }
    const s = services.find((x) => String(x.id_servicio) === val);
    if (s) {
      onSelectService(s);
      if (s.especialidades?.nombre && (!doctor_id || doctor_id === "none")) {
        const match = doctors.find((d) =>
          d.specialty?.toLowerCase().includes(s.especialidades!.nombre.toLowerCase()) ||
          s.especialidades!.nombre.toLowerCase().includes(d.specialty?.toLowerCase() || "")
        );
        if (match) onAutoSelectDoctor(match.id);
      }
    }
  };

  return (
    <div className="grid gap-2">
      <Label>Servicio Médico</Label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger><SelectValue placeholder="Selecciona servicio médico…" /></SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <SelectItem value="none">Ninguno (Consulta General)</SelectItem>

          {matchingServices.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs font-bold text-primary px-2 py-1">
                Servicios de {selectedDoctor?.specialty}
              </SelectLabel>
              {matchingServices.map((s) => (
                <SelectItem key={s.id_servicio} value={String(s.id_servicio)} className="text-xs font-medium">
                  {s.nombre_servicio} {s.costo_base ? `($${Number(s.costo_base).toFixed(2)})` : ""}
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {generalServices.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs font-bold text-muted-foreground px-2 py-1">
                Servicios Generales / Multidisciplinarios
              </SelectLabel>
              {generalServices.map((s) => (
                <SelectItem key={s.id_servicio} value={String(s.id_servicio)} className="text-xs font-medium">
                  {s.nombre_servicio} {s.costo_base ? `($${Number(s.costo_base).toFixed(2)})` : ""}
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {otherServices.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs font-bold text-muted-foreground px-2 py-1">
                {selectedDoctor?.specialty ? "Otras Especialidades" : "Todos los Servicios"}
              </SelectLabel>
              {otherServices.map((s) => (
                <SelectItem key={s.id_servicio} value={String(s.id_servicio)} className="text-xs font-medium">
                  {s.nombre_servicio} {s.costo_base ? `($${Number(s.costo_base).toFixed(2)})` : ""} {s.especialidades?.nombre ? `(${s.especialidades.nombre})` : ""}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
