import { useMemo, useState, useEffect } from "react";
import {
  Search,
  Plus,
  Users,
  Pencil,
  Trash2,
  X,
  Phone,
  ChevronLeft,
  ChevronDown,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PatientForm } from "@/components/PatientForm";
import {
  usePaginatedPatients,
  useDeletePatient,
  type Patient,
} from "@/lib/api/patients";
import { useDoctors, useMyProfile } from "@/lib/api/profiles";
import { useClinicInfo } from "@/lib/api/clinic";
import { Link } from "@tanstack/react-router";
import { useAuthSession } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { differenceInYears } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const STATUSES = ["Todos", "nuevo", "activo", "en_tratamiento", "alta"];
const statusLabel = (s: string) =>
  (
    ({
      Todos: "Todos",
      nuevo: "Nuevo",
      activo: "Activo",
      en_tratamiento: "En tratamiento",
      alta: "Alta",
    }) as Record<string, string>
  )[s] ?? s;

const initials = (n: string) =>
  (n || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function PatientsPage() {
  const now = useMemo(() => new Date(), []);
  const { data: doctors = [] } = useDoctors();
  const del = useDeletePatient();

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("Todos");
  const [doctorFilter, setDoctorFilter] = useState("Todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [toDelete, setToDelete] = useState<Patient | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQ, status, doctorFilter]);

  const serverStatus = status === "Todos" ? undefined : status;
  const {
    data: paginatedResult,
    isLoading,
  } = usePaginatedPatients(currentPage, itemsPerPage, debouncedQ || undefined, serverStatus);
  const patients = paginatedResult?.data ?? [];
  const totalCount = paginatedResult?.count ?? 0;

  const doctorMap = useMemo(
    () => new Map(doctors.map((d) => [d.id, d.full_name || d.email])),
    [doctors],
  );

  const { user: me } = useAuthSession();
  const { data: myProfile } = useMyProfile(me?.id);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const filteredByDoctor =
    doctorFilter === "Todos"
      ? patients
      : patients.filter((p) => p.assigned_doctor_id === doctorFilter);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Paciente eliminado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
    setToDelete(null);
  };

  return (
    <div className="bg-card rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-sm min-h-[calc(100vh-8rem)] font-sans flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-muted-foreground hover:text-foreground"
            title="Volver"
            aria-label="Volver"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Pacientes</h1>
        </div>
        <div className="flex-1 max-w-xl mx-auto w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-full bg-muted border border-border/50 px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar paciente…"
              aria-label="Buscar paciente"
              className="w-full bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40 rounded-lg px-1 placeholder:text-muted-foreground text-foreground"
            />
            {q && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setQ("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 hidden md:flex">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 ml-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                {initials(myProfile?.full_name || "U")}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-bold text-foreground">{myProfile?.full_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {myProfile?.roles?.[0] === "admin" ? "Super admin" : "Doctor"}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between border-b border-border/40 pb-0 mb-6">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
                status === s
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "activo"
                ? "Activos"
                : s === "nuevo"
                  ? "Nuevos"
                  : s === "alta"
                    ? "De Alta"
                    : statusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Users className="h-4 w-4" /> {totalCount} pacientes
        </div>
        <div className="flex items-center gap-3">
          <PatientsFilterPopover
            status={status}
            setStatus={setStatus}
            doctorFilter={doctorFilter}
            setDoctorFilter={setDoctorFilter}
            doctors={doctors}
            onReset={() => {
              setStatus("Todos");
              setDoctorFilter("Todos");
            }}
          />
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#3451d6] transition"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir Paciente
          </button>
        </div>
      </div>

      <PatientsTable
        isLoading={isLoading}
        patients={filteredByDoctor}
        now={now}
        doctorMap={doctorMap}
        onEdit={(p) => {
          setEditing(p);
          setFormOpen(true);
        }}
        onDelete={(p) => setToDelete(p)}
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        entityLabel="pacientes"
        onPageChange={setCurrentPage}
      />

      <PatientForm open={formOpen} onOpenChange={setFormOpen} patient={editing} />

      <PatientDeleteDialog
        patient={toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function PatientsFilterPopover({
  status,
  setStatus,
  doctorFilter,
  setDoctorFilter,
  doctors,
  onReset,
}: {
  status: string;
  setStatus: (s: string) => void;
  doctorFilter: string;
  setDoctorFilter: (d: string) => void;
  doctors: any[];
  onReset: () => void;
}) {
  const isFiltered = status !== "Todos" || doctorFilter !== "Todos";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-bold text-foreground border border-border/40 rounded-xl hover:bg-muted transition-colors",
            isFiltered && "bg-primary/10 border-primary text-primary",
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          {isFiltered ? "Filtrado" : "Filtros"}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 rounded-2xl glass-card border-0 shadow-2xl p-4"
        align="end"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Estado del Paciente
            </h4>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full rounded-xl h-9 bg-transparent border-input text-xs font-semibold">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s === "activo"
                      ? "Activos"
                      : s === "nuevo"
                        ? "Nuevos"
                        : s === "alta"
                          ? "De Alta"
                          : statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Médico Asignado
            </h4>
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="w-full rounded-xl h-9 bg-transparent border-input text-xs font-semibold">
                <SelectValue placeholder="Todos los médicos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Todos" className="text-xs">
                  Todos los médicos
                </SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-xs">
                    {d.full_name || d.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="w-full rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PatientsTable({
  isLoading,
  patients,
  now,
  doctorMap,
  onEdit,
  onDelete,
}: {
  isLoading: boolean;
  patients: Patient[];
  now: Date;
  doctorMap: Map<string, string>;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}) {
  return (
    <div className="flex-1 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[720px]">
        <thead>
          <tr className="bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <th className="p-4 w-12 rounded-tl-xl">
              <input type="checkbox" aria-label="Seleccionar todos los pacientes" className="rounded border-gray-300" />
            </th>
            <th className="p-4">
              Nombre del Paciente <span className="ml-1">↕</span>
            </th>
            <th className="p-4">
              ID / DNI <span className="ml-1">↕</span>
            </th>
            <th className="p-4">
              Contacto <span className="ml-1">↕</span>
            </th>
            <th className="p-4">
              Edad <span className="ml-1">↕</span>
            </th>
            <th className="p-4">
              Estado <span className="ml-1">↕</span>
            </th>
            <th className="p-4 rounded-tr-xl">
              Acción <span className="ml-1">↕</span>
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {isLoading ? (
            <tr>
              <td colSpan={7} className="p-4">
                <div className="space-y-3 py-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-4 py-2 border-b border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 animate-pulse shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-36 bg-primary/10 rounded-md animate-pulse" />
                          <div className="h-3 w-24 bg-primary/10 rounded-md animate-pulse" />
                        </div>
                      </div>
                      <div className="h-4 w-24 bg-primary/10 rounded-md animate-pulse hidden sm:block" />
                      <div className="h-6 w-20 bg-primary/10 rounded-full animate-pulse" />
                      <div className="h-8 w-16 bg-primary/10 rounded-xl animate-pulse" />
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ) : patients.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-12 text-center text-muted-foreground font-medium">
                No se encontraron pacientes.
              </td>
            </tr>
          ) : (
            patients.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border/40 hover:bg-muted/50 transition group"
              >
                <td className="p-4">
                  <input type="checkbox" aria-label={`Seleccionar paciente ${p.full_name}`} className="rounded border-gray-300" />
                </td>
                <td className="p-4 font-bold text-foreground flex items-center gap-2">
                  {p.full_name}
                  {p.status === "nuevo" && (
                    <span className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0.5 rounded-md uppercase">
                      Nuevo
                    </span>
                  )}
                </td>
                <td className="p-4 text-muted-foreground font-medium">
                  DNI {p.document_id || "—"}
                </td>
                <td className="p-4">
                  <p className="text-foreground font-bold text-xs flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" /> {p.phone || "—"}
                  </p>
                </td>
                <td className="p-4">
                  <span
                    suppressHydrationWarning
                    className="bg-primary/10 text-primary border border-blue-100 text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"
                  >
                    {(() => {
                      if (!p.birth_date) return "DESCONOCIDO";
                      const d = new Date(p.birth_date);
                      if (isNaN(d.getTime())) return "DESCONOCIDO";
                      return `${differenceInYears(now, d)} AÑOS`;
                    })()}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        p.status === "activo"
                          ? "bg-green-500"
                          : p.status === "nuevo"
                            ? "bg-primary/100"
                            : p.status === "alta"
                              ? "bg-gray-400"
                              : "bg-purple-500",
                      )}
                    ></span>
                    {statusLabel(p.status)}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Link
                      to={`/pacientes/${p.id}`}
                      className="hover:text-primary font-bold text-xs tracking-wide uppercase"
                    >
                      Ver
                    </Link>
                    <div className="h-3 w-px bg-gray-200"></div>
                    <button
                      type="button"
                      aria-label={`Editar paciente ${p.full_name}`}
                      onClick={() => onEdit(p)}
                      className="hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label={`Eliminar paciente ${p.full_name}`} onClick={() => onDelete(p)} className="hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function PatientDeleteDialog({
  patient,
  onOpenChange,
  onConfirm,
}: {
  patient: Patient | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!patient} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminarán {patient?.full_name} y todas sus citas. Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
