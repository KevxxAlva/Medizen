import { useState, useMemo } from "react";
import { useServices, useDeleteService, useSpecialties, type Service } from "@/lib/api/services";
import { useUserRoleScope } from "@/hooks/useUserRoleScope";
import { useDoctors } from "@/lib/api/profiles";
import { ServiceForm } from "@/components/ServiceForm";
import { TablePagination } from "@/components/ui/table-pagination";
import { ServiciosHeader } from "@/components/services/ServiciosHeader";
import { ServiciosSpecialtyPills } from "@/components/services/ServiciosSpecialtyPills";
import { ServiciosTable } from "@/components/services/ServiciosTable";

const ITEMS_PER_PAGE = 8;

function matchesSpecialtyFilter(s: Service, specialtyFilter: string): boolean {
  if (specialtyFilter === "all") return true;
  if (specialtyFilter === "none") {
    return s.id_especialidad === null || s.id_especialidad === undefined;
  }
  return String(s.id_especialidad) === specialtyFilter;
}

function matchesSearchQuery(s: Service, term: string): boolean {
  if (!term) return true;
  const haystack = [
    s.nombre_servicio,
    s.descripcion || "",
    s.codigo_medico || "",
    s.especialidades?.nombre || "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

function countServicesBySpecialty(services: Service[]): Record<string, number> {
  const map: Record<string, number> = { all: services.length, none: 0 };
  for (const s of services) {
    if (s.id_especialidad) {
      const key = String(s.id_especialidad);
      map[key] = (map[key] || 0) + 1;
    } else {
      map.none = (map.none || 0) + 1;
    }
  }
  return map;
}

export function ServiciosPage() {
  const { data: services = [], isLoading } = useServices();
  const { data: specialties = [] } = useSpecialties();
  const { data: doctors = [] } = useDoctors();
  const {
    isDoctorOnly,
    doctorId,
    doctorSpecialtyId: scopedSpecialtyId,
    doctorSpecialtyName: scopedSpecialtyName,
  } = useUserRoleScope();
  const deleteService = useDeleteService();

  const currentDoctorProfile = useMemo(
    () => (doctorId ? doctors.find((d) => d.id === doctorId) || null : null),
    [doctors, doctorId],
  );

  const doctorSpecialtyId = scopedSpecialtyId || currentDoctorProfile?.specialty_id;
  const doctorSpecialtyName = scopedSpecialtyName || currentDoctorProfile?.specialty;

  const [q, setQ] = useState("");
  const [userSelectedFilter, setUserSelectedFilter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const specialtyFilter =
    userSelectedFilter ??
    (isDoctorOnly && doctorSpecialtyId ? String(doctorSpecialtyId) : "all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return services.filter(
      (s) => matchesSpecialtyFilter(s, specialtyFilter) && matchesSearchQuery(s, term),
    );
  }, [services, q, specialtyFilter]);

  const countsBySpecialty = useMemo(() => countServicesBySpecialty(services), [services]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleDelete = (s: Service) => {
    if (
      confirm(`¿Estás seguro de que deseas eliminar el servicio médico "${s.nombre_servicio}"?`)
    ) {
      deleteService.mutate(s.id_servicio);
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-3.5 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] font-sans flex flex-col w-full min-w-0 overflow-hidden">
      <ServiciosHeader
        q={q}
        onSearchChange={(val) => {
          setQ(val);
          setCurrentPage(1);
        }}
        onClearSearch={() => setQ("")}
        onAddService={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      />

      <ServiciosSpecialtyPills
        isDoctorOnly={isDoctorOnly}
        doctorSpecialtyId={doctorSpecialtyId}
        doctorSpecialtyName={doctorSpecialtyName}
        specialtyFilter={specialtyFilter}
        onSelectFilter={(next) => {
          setUserSelectedFilter(next);
          setCurrentPage(1);
        }}
        specialties={specialties}
        countsBySpecialty={countsBySpecialty}
        totalServicesCount={services.length}
        filteredCount={filtered.length}
      />

      <ServiciosTable
        isLoading={isLoading}
        services={paginated}
        onEdit={(s) => {
          setEditing(s);
          setFormOpen(true);
        }}
        onDelete={handleDelete}
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={ITEMS_PER_PAGE}
        entityLabel="servicios"
        onPageChange={setCurrentPage}
      />

      <ServiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editing}
        defaultSpecialtyId={doctorSpecialtyId}
        isDoctorOnly={isDoctorOnly}
      />
    </div>
  );
}
