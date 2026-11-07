import { Sparkles, Stethoscope, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Specialty } from "@/lib/api/services";

interface ServiciosSpecialtyPillsProps {
  isDoctorOnly: boolean;
  doctorSpecialtyId?: number | null;
  doctorSpecialtyName?: string | null;
  specialtyFilter: string;
  onSelectFilter: (filter: string) => void;
  specialties: Specialty[];
  countsBySpecialty: Record<string, number>;
  totalServicesCount: number;
  filteredCount: number;
}

function DoctorScopedPills({
  doctorSpecKey,
  doctorSpecialtyName,
  specialtyFilter,
  countsBySpecialty,
  totalServicesCount,
  onSelectFilter,
}: {
  doctorSpecKey: string;
  doctorSpecialtyName?: string | null;
  specialtyFilter: string;
  countsBySpecialty: Record<string, number>;
  totalServicesCount: number;
  onSelectFilter: (filter: string) => void;
}) {
  const isOwnActive = specialtyFilter === doctorSpecKey;
  return (
    <>
      <button
        type="button"
        onClick={() => onSelectFilter(doctorSpecKey)}
        className={cn(
          "text-xs font-semibold px-3.5 py-1.5 rounded-xl shrink-0 transition-colors border flex items-center gap-2",
          isOwnActive
            ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
            : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted",
        )}
      >
        <Sparkles className="w-3.5 h-3.5 opacity-80" />
        <span>Mi Rama: {doctorSpecialtyName || "Mi Especialidad"}</span>
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full",
            isOwnActive ? "bg-white/20 text-white" : "bg-background text-muted-foreground",
          )}
        >
          {countsBySpecialty[doctorSpecKey] || 0}
        </span>
      </button>

      {countsBySpecialty.none > 0 && (
        <button
          type="button"
          onClick={() => onSelectFilter("none")}
          className={cn(
            "text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 transition-colors border",
            specialtyFilter === "none"
              ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
              : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted",
          )}
        >
          Multidisciplinarios ({countsBySpecialty.none})
        </button>
      )}

      <button
        type="button"
        onClick={() => onSelectFilter("all")}
        className={cn(
          "text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 transition-colors border",
          specialtyFilter === "all"
            ? "bg-foreground text-background border-foreground font-bold shadow-sm"
            : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted",
        )}
      >
        Ver Todas las Especialidades ({totalServicesCount})
      </button>
    </>
  );
}

function AllSpecialtiesPills({
  specialtyFilter,
  specialties,
  countsBySpecialty,
  totalServicesCount,
  onSelectFilter,
}: {
  specialtyFilter: string;
  specialties: Specialty[];
  countsBySpecialty: Record<string, number>;
  totalServicesCount: number;
  onSelectFilter: (filter: string) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onSelectFilter("all")}
        className={cn(
          "text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 transition-colors border",
          specialtyFilter === "all"
            ? "bg-foreground text-background border-foreground font-bold shadow-sm"
            : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted",
        )}
      >
        Todas ({totalServicesCount})
      </button>

      {specialties.map((esp) => {
        const key = String(esp.id_especialidad);
        const count = countsBySpecialty[key] || 0;
        const active = specialtyFilter === key;
        if (count === 0 && !active) return null;

        return (
          <button
            type="button"
            key={esp.id_especialidad}
            onClick={() => onSelectFilter(key)}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 transition-colors border flex items-center gap-1.5",
              active
                ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted",
            )}
          >
            <span>{esp.nombre}</span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.2 rounded-full",
                active ? "bg-white/20 text-white" : "bg-background text-muted-foreground",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}

      {countsBySpecialty.none > 0 && (
        <button
          type="button"
          onClick={() => onSelectFilter("none")}
          className={cn(
            "text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 transition-colors border",
            specialtyFilter === "none"
              ? "bg-foreground text-background border-foreground font-bold shadow-sm"
              : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted",
          )}
        >
          Multidisciplinarios ({countsBySpecialty.none})
        </button>
      )}
    </>
  );
}

export function ServiciosSpecialtyPills({
  isDoctorOnly,
  doctorSpecialtyId,
  doctorSpecialtyName,
  specialtyFilter,
  onSelectFilter,
  specialties,
  countsBySpecialty,
  totalServicesCount,
  filteredCount,
}: ServiciosSpecialtyPillsProps) {
  const doctorSpecKey = doctorSpecialtyId ? String(doctorSpecialtyId) : "";
  const showDoctorSharedBadge =
    isDoctorOnly && Boolean(doctorSpecialtyName) && specialtyFilter === doctorSpecKey;

  return (
    <>
      <div className="flex items-center gap-2 pb-3 mb-2 overflow-x-auto no-scrollbar border-b border-border/40">
        {isDoctorOnly && doctorSpecKey ? (
          <DoctorScopedPills
            doctorSpecKey={doctorSpecKey}
            doctorSpecialtyName={doctorSpecialtyName}
            specialtyFilter={specialtyFilter}
            countsBySpecialty={countsBySpecialty}
            totalServicesCount={totalServicesCount}
            onSelectFilter={onSelectFilter}
          />
        ) : (
          <AllSpecialtiesPills
            specialtyFilter={specialtyFilter}
            specialties={specialties}
            countsBySpecialty={countsBySpecialty}
            totalServicesCount={totalServicesCount}
            onSelectFilter={onSelectFilter}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between mb-4 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <span>Mostrando {filteredCount} servicios</span>
          {showDoctorSharedBadge && (
            <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <Stethoscope className="w-3 h-3" />
              Rama: {doctorSpecialtyName} (compartida con tus colegas)
            </span>
          )}
          {specialtyFilter !== "all" && (
            <button
              type="button"
              onClick={() => onSelectFilter("all")}
              className="text-primary hover:underline text-xs ml-1 flex items-center gap-0.5"
            >
              <X className="w-3 h-3" /> Limpiar filtro
            </button>
          )}
        </div>
      </div>
    </>
  );
}
