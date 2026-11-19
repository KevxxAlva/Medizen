import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Service } from "@/lib/api/services";
import type { Profile } from "@/lib/api/profiles";
import { Sparkles } from "lucide-react";

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

function normalizeStr(str?: string | null): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .trim();
}

function checkServiceMatchesDoctor(service: Service, doctor?: Profile): boolean {
  if (!doctor) return true;

  // 1. Exact ID match (if both doctor and service have specialty_id)
  if (
    doctor.specialty_id &&
    service.id_especialidad &&
    Number(service.id_especialidad) === Number(doctor.specialty_id)
  ) {
    return true;
  }

  const docSpecNorm = normalizeStr(doctor.specialty);
  if (!docSpecNorm) return true;

  const servSpecNorm = normalizeStr(service.especialidades?.nombre);
  const servNameNorm = normalizeStr(service.nombre_servicio);

  // 2. Direct string containment
  if (
    servSpecNorm &&
    (servSpecNorm.includes(docSpecNorm) || docSpecNorm.includes(servSpecNorm))
  ) {
    return true;
  }

  // 3. Keyword token matching (e.g., "ginecologia", "obstetricia", "dermatologia", "pediatria")
  const docTokens = docSpecNorm.split(/\s+/).filter((t) => t.length >= 4);
  const matchedToken = docTokens.some(
    (token) => servSpecNorm.includes(token) || servNameNorm.includes(token)
  );

  return matchedToken;
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
  const [showOtherSpecialties, setShowOtherSpecialties] = useState(false);

  const { matchingServices, generalServices, otherServices } = useMemo(() => {
    const matching: Service[] = [];
    const general: Service[] = [];
    const others: Service[] = [];

    services.forEach((s) => {
      if (!s.id_especialidad) {
        general.push(s);
      } else if (checkServiceMatchesDoctor(s, selectedDoctor)) {
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
          normalizeStr(d.specialty).includes(normalizeStr(s.especialidades!.nombre)) ||
          normalizeStr(s.especialidades!.nombre).includes(normalizeStr(d.specialty))
        );
        if (match) onAutoSelectDoctor(match.id);
      }
    }
  };

  const hasSpecialty = Boolean(selectedDoctor?.specialty);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>Servicio Médico</Label>
        {hasSpecialty && matchingServices.length > 0 && otherServices.length > 0 && (
          <button
            type="button"
            onClick={() => setShowOtherSpecialties((prev) => !prev)}
            className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
          >
            {showOtherSpecialties ? "Mostrar solo mi especialidad" : "Ver otras especialidades"}
          </button>
        )}
      </div>

      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona servicio médico…" />
        </SelectTrigger>
        <SelectContent className="max-h-[320px]">
          <SelectItem value="none">Ninguno (Consulta General)</SelectItem>

          {matchingServices.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs font-extrabold text-primary px-2 py-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>Servicios de {selectedDoctor?.specialty || "su especialidad"}</span>
              </SelectLabel>
              {matchingServices.map((s) => (
                <SelectItem
                  key={s.id_servicio}
                  value={String(s.id_servicio)}
                  className="text-xs font-bold"
                >
                  {s.nombre_servicio}{" "}
                  {s.costo_base ? `($${Number(s.costo_base).toFixed(2)})` : ""}
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {generalServices.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs font-bold text-muted-foreground px-2 py-1">
                Servicios Generales
              </SelectLabel>
              {generalServices.map((s) => (
                <SelectItem
                  key={s.id_servicio}
                  value={String(s.id_servicio)}
                  className="text-xs font-medium"
                >
                  {s.nombre_servicio}{" "}
                  {s.costo_base ? `($${Number(s.costo_base).toFixed(2)})` : ""}
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {(showOtherSpecialties || matchingServices.length === 0) &&
            otherServices.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-xs font-bold text-muted-foreground px-2 py-1 border-t border-border/50 mt-1 pt-1.5">
                  {hasSpecialty ? "Otras Especialidades" : "Todos los Servicios"}
                </SelectLabel>
                {otherServices.map((s) => (
                  <SelectItem
                    key={s.id_servicio}
                    value={String(s.id_servicio)}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {s.nombre_servicio}{" "}
                    {s.costo_base ? `($${Number(s.costo_base).toFixed(2)})` : ""}{" "}
                    {s.especialidades?.nombre ? `(${s.especialidades.nombre})` : ""}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
        </SelectContent>
      </Select>
    </div>
  );
}
