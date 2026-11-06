import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserRound,
  Plus,
  Shield,
  Stethoscope,
  Trash2,
  Loader2,
  ShieldOff,
  Search,
  X,
  Users,
  Pencil,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import {
  useAllProfilesWithRoles,
  useToggleRole,
  useUpdateProfile,
  type ProfileWithRoles,
} from "@/lib/api/profiles";
import { adminCreateUser, adminDeleteUser } from "@/lib/admin.functions";
import { useAuthSession, requireAdminAccess } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/doctores")({
  beforeLoad: async () => {
    await requireAdminAccess();
  },
  head: () => ({ meta: [{ title: "Personal — Medizen" }] }),
  component: DoctoresAdmin,
});

const initials = (n: string) => (n || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const COMMON_SPECIALTIES = [
  "Ginecología y Obstetricia",
  "Ecografía Integral",
  "Pediatría",
  "Cardiología",
  "Dermatología",
  "Traumatología y Ortopedia",
  "Oftalmología",
  "Medicina General",
  "Neurología",
  "Gastroenterología",
  "Urología",
  "Otorrinolaringología",
  "Medicina Interna",
  "Cirugía General",
  "Fertilidad y Reproducción",
  "Mastología",
];

function SpecialtyMultiSelector({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [customInput, setCustomInput] = useState("");

  const selectedList = useMemo(() => {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [value]);

  const toggleSpecialty = (spec: string) => {
    if (disabled) return;
    const exists = selectedList.includes(spec);
    let next: string[];
    if (exists) {
      next = selectedList.filter((s) => s !== spec);
    } else {
      next = [...selectedList, spec];
    }
    onChange(next.join(", "));
  };

  const addCustomSpecialty = () => {
    if (!customInput.trim() || disabled) return;
    const clean = customInput.trim();
    if (!selectedList.includes(clean)) {
      onChange([...selectedList, clean].join(", "));
    }
    setCustomInput("");
  };

  return (
    <div className="space-y-2">
      {/* Badges de especialidades activas */}
      <div className="flex flex-wrap gap-1.5 min-h-[42px] p-2 rounded-xl border border-border bg-background/50">
        {selectedList.length === 0 ? (
          <span className="text-xs text-muted-foreground self-center">
            {disabled
              ? "No aplica para este rol"
              : "Ninguna rama seleccionada. Haz clic en las sugerencias abajo o escribe una."}
          </span>
        ) : (
          selectedList.map((spec) => (
            <span
              key={spec}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20"
            >
              {spec}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggleSpecialty(spec)}
                  className="hover:text-destructive transition ml-0.5 cursor-pointer"
                  title="Quitar esta especialidad"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {/* Input para agregar subespecialidad personalizada */}
      {!disabled && (
        <div className="flex gap-2">
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Otra rama o subespecialidad (ej. Fertilidad, Ecografía Fetal)..."
            className="text-xs h-8"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomSpecialty();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomSpecialty}
            className="text-xs h-8 shrink-0"
          >
            Añadir
          </Button>
        </div>
      )}

      {/* Lista de ramas sugeridas para selección rápida múltiple */}
      {!disabled && (
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            Ramas sugeridas (haz clic para activar/desactivar hasta 3 o más):
          </span>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 rounded-lg border border-border/50 bg-muted/20">
            {COMMON_SPECIALTIES.map((spec) => {
              const active = selectedList.includes(spec);
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialty(spec)}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-md font-medium transition cursor-pointer border flex items-center gap-1",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  {active && <Check className="h-2.5 w-2.5" />}
                  {spec}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DoctoresAdmin() {
  const { data: profiles = [], isLoading } = useAllProfilesWithRoles();
  const toggle = useToggleRole();
  const updateProfile = useUpdateProfile();
  const create = useServerFn(adminCreateUser);
  const del = useServerFn(adminDeleteUser);
  const qc = useQueryClient();
  const { user: me } = useAuthSession();

  const [openCreate, setOpenCreate] = useState(false);
  const [toEdit, setToEdit] = useState<ProfileWithRoles | null>(null);
  const [toDelete, setToDelete] = useState<ProfileWithRoles | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    specialty: "",
    role: "doctor" as "admin" | "doctor" | "recepcionista",
  });

  const [q, setQ] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = profiles.filter((p) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.specialty?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ data: form });
      toast.success("Usuario creado exitosamente");
      setOpenCreate(false);
      setForm({ email: "", password: "", full_name: "", specialty: "", role: "doctor" });
      qc.invalidateQueries({ queryKey: ["profiles_with_roles"] });
      qc.invalidateQueries({ queryKey: ["doctors"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleAdmin = async (p: ProfileWithRoles) => {
    const isAdmin = p.roles.includes("admin");
    try {
      await toggle.mutateAsync({ userId: p.id, role: "admin", enable: !isAdmin });
      toast.success(isAdmin ? "Admin removido" : "Promovido a admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const handleToggleDoctor = async (p: ProfileWithRoles) => {
    const isDoctor = p.roles.includes("doctor") || p.roles.includes("medico");
    try {
      await toggle.mutateAsync({ userId: p.id, role: "doctor", enable: !isDoctor });
      toast.success(isDoctor ? "Doctor removido" : "Promovido a doctor");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const handleToggleRecep = async (p: ProfileWithRoles) => {
    const isRecep = p.roles.includes("recepcionista");
    try {
      await toggle.mutateAsync({ userId: p.id, role: "recepcionista", enable: !isRecep });
      toast.success(isRecep ? "Recepción removida" : "Promovido a recepción");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await del({ data: { user_id: toDelete.id } });
      toast.success("Usuario eliminado");
      qc.invalidateQueries({ queryKey: ["profiles_with_roles"] });
      qc.invalidateQueries({ queryKey: ["doctors"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
      setToDelete(null);
    }
  };

  return (
    <div className="flex-1 w-full min-w-0 p-4 md:p-8 space-y-6">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Control de Accesos
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Personal y Especialistas
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administra médicos, especialidades (simples o múltiples), recepción y administradores.
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2 w-full md:w-64">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre, correo o especialidad..."
              aria-label="Buscar personal"
              className="w-full bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40 rounded-lg px-1 placeholder:text-muted-foreground text-foreground"
            />
            {q && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setQ("")}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 hidden md:flex">
          <button
            onClick={() => setOpenCreate(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#3451d6] transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir Personal
          </button>
        </div>
      </header>

      {/* SECONDARY TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Users className="h-4 w-4" /> {filtered.length} miembros registrados
        </div>
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setOpenCreate(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-[#3451d6] transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir Personal
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 w-full min-w-0 overflow-x-auto border border-border rounded-2xl bg-card shadow-xs">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-muted/70 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="p-4 w-12 rounded-tl-xl">
                <input type="checkbox" aria-label="Seleccionar todo el personal" className="rounded border-gray-300" />
              </th>
              <th className="p-4">Nombre</th>
              <th className="p-4">Correo</th>
              <th className="p-4">Especialidad(es)</th>
              <th className="p-4">Rol</th>
              <th className="p-4 rounded-tr-xl">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-muted-foreground font-medium">
                  No se encontró personal registrado.
                </td>
              </tr>
            ) : (
              paginated.map((p) => (
                <DoctorTableRow
                  key={p.id}
                  profile={p}
                  isMe={p.id === me?.id}
                  togglePending={toggle.isPending}
                  onEdit={() => setToEdit(p)}
                  onToggleAdmin={() => handleToggleAdmin(p)}
                  onToggleDoctor={() => handleToggleDoctor(p)}
                  onToggleRecep={() => handleToggleRecep(p)}
                  onDelete={() => setToDelete(p)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        entityLabel="miembros"
        onPageChange={setCurrentPage}
      />

      <CreateUserModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        form={form}
        setForm={setForm}
        onSubmit={handleCreate}
        busy={busy}
      />

      <EditUserModal
        profile={toEdit}
        onOpenChange={(open) => !open && setToEdit(null)}
        updateProfile={updateProfile}
      />

      <DeleteUserAlert
        user={toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function DoctorTableRow({
  profile: p,
  isMe,
  togglePending,
  onEdit,
  onToggleAdmin,
  onToggleDoctor,
  onToggleRecep,
  onDelete,
}: {
  profile: ProfileWithRoles;
  isMe: boolean;
  togglePending: boolean;
  onEdit: () => void;
  onToggleAdmin: () => void;
  onToggleDoctor: () => void;
  onToggleRecep: () => void;
  onDelete: () => void;
}) {
  const isAdmin = p.roles.includes("admin");
  const isDoctor = p.roles.includes("doctor") || p.roles.includes("medico");
  const isRecep = p.roles.includes("recepcionista");

  const specialties = useMemo(() => {
    if (!p.specialty) return [];
    return p.specialty
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [p.specialty]);

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition group">
      <td className="p-4">
        <input
          type="checkbox"
          aria-label={`Seleccionar miembro ${p.full_name || p.email}`}
          className="rounded border-gray-300"
        />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground text-[10px] font-bold">
            {initials(p.full_name || p.email)}
          </div>
          <span className="font-bold text-foreground">
            {p.full_name || "—"}{" "}
            {isMe && <span className="text-[10px] text-gray-400 font-normal ml-1">(tú)</span>}
          </span>
        </div>
      </td>
      <td className="p-4 text-muted-foreground font-medium">{p.email}</td>
      <td className="p-4">
        {specialties.length === 0 ? (
          <span className="text-muted-foreground text-xs">—</span>
        ) : (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {specialties.map((spec) => (
              <span
                key={spec}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-foreground border border-border"
              >
                {spec}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="p-4">
        <div className="flex flex-wrap gap-1">
          {p.roles.map((r) => {
            const isRAdmin = r === "admin";
            const isRRecep = r === "recepcionista";
            return (
              <span
                key={r}
                className={cn(
                  "text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1",
                  isRAdmin
                    ? "bg-purple-50 text-purple-600 border border-purple-100"
                    : isRRecep
                    ? "bg-blue-50 text-blue-600 border border-blue-100"
                    : "bg-green-50 text-green-600 border border-green-100"
                )}
              >
                {isRAdmin ? (
                  <Shield className="h-2.5 w-2.5" />
                ) : isRRecep ? (
                  <UserRound className="h-2.5 w-2.5" />
                ) : (
                  <Stethoscope className="h-2.5 w-2.5" />
                )}{" "}
                {isRRecep ? "Recepción" : r === "medico" ? "Médico" : r}
              </span>
            );
          })}
          {p.roles.length === 0 && (
            <span className="text-[9px] bg-muted text-gray-400 px-2 py-1 rounded-full border border-gray-100">
              Ninguno
            </span>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          {/* BOTÓN EDITAR ESPECIALIDADES Y DATOS */}
          <button
            onClick={onEdit}
            className="hover:text-primary transition flex flex-col items-center gap-1 cursor-pointer"
            title="Editar Especialidades y Datos"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <div className="h-3 w-px bg-gray-200"></div>

          <button
            onClick={onToggleAdmin}
            disabled={isMe || togglePending}
            className="hover:text-purple-600 disabled:opacity-30 flex flex-col items-center gap-1 cursor-pointer"
            title={isAdmin ? "Quitar Admin" : "Hacer Admin"}
          >
            {isAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
          </button>

          <div className="h-3 w-px bg-gray-200"></div>

          <button
            onClick={onToggleDoctor}
            disabled={togglePending}
            className="hover:text-green-600 disabled:opacity-30 flex flex-col items-center gap-1 cursor-pointer"
            title={isDoctor ? "Quitar Doctor" : "Hacer Doctor"}
          >
            {isDoctor ? <ShieldOff className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
          </button>

          <div className="h-3 w-px bg-gray-200"></div>

          <button
            onClick={onToggleRecep}
            disabled={togglePending}
            className="hover:text-blue-600 disabled:opacity-30 flex flex-col items-center gap-1 cursor-pointer"
            title={isRecep ? "Quitar Recepción" : "Hacer Recepción"}
          >
            {isRecep ? <ShieldOff className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
          </button>

          <div className="h-3 w-px bg-gray-200"></div>

          <button
            onClick={onDelete}
            disabled={isMe}
            className="hover:text-destructive disabled:opacity-30 cursor-pointer"
            title="Eliminar Usuario"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CreateUserModal({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    email: string;
    password: string;
    full_name: string;
    specialty: string;
    role: "admin" | "doctor" | "recepcionista";
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  onSubmit: (e: React.FormEvent) => void;
  busy: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Personal</DialogTitle>
          <DialogDescription>
            Crea la cuenta del profesional, define su rol y asigna sus especialidades (1, 2 o más).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="fn">Nombre Completo</Label>
            <Input
              id="fn"
              placeholder="Ej. Dra. María Pérez"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="em">Correo Electrónico</Label>
            <Input
              id="em"
              type="email"
              placeholder="profesional@clinica.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pw">Contraseña (mín. 8 caracteres)</Label>
            <Input
              id="pw"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <div className="grid gap-2">
            <Label>Rol del Personal</Label>
            <Select
              value={form.role}
              onValueChange={(v) =>
                setForm({ ...form, role: v as "admin" | "doctor" | "recepcionista" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor / Especialista Médico</SelectItem>
                <SelectItem value="recepcionista">Recepción / Facturación</SelectItem>
                <SelectItem value="admin">Administrador del Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SELECTOR MÚLTIPLE DE ESPECIALIDADES */}
          <div className="grid gap-2">
            <Label className={cn(form.role !== "doctor" && "text-muted-foreground")}>
              Especialidad(es) o Ramas Médicas {form.role !== "doctor" && "(No aplica)"}
            </Label>
            <SpecialtyMultiSelector
              value={form.specialty}
              onChange={(val) => setForm({ ...form, specialty: val })}
              disabled={form.role !== "doctor"}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="bg-primary text-primary-foreground hover:bg-[#3451d6]"
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear Personal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserModal({
  profile,
  onOpenChange,
  updateProfile,
}: {
  profile: ProfileWithRoles | null;
  onOpenChange: (open: boolean) => void;
  updateProfile: ReturnType<typeof useUpdateProfile>;
}) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [specialty, setSpecialty] = useState(profile?.specialty || "");
  const [mpps, setMpps] = useState(profile?.mpps || "");
  const [university, setUniversity] = useState(profile?.university || "");
  const [cmc, setCmc] = useState(profile?.cmc || "");

  useMemo(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setSpecialty(profile.specialty || "");
      setMpps(profile.mpps || "");
      setUniversity(profile.university || "");
      setCmc(profile.cmc || "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await updateProfile.mutateAsync({
        userId: profile.id,
        fullName,
        specialty,
        mpps: mpps || null,
        university: university || null,
        cmc: cmc || null,
      });
      toast.success("Perfil y especialidades actualizadas correctamente");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  const isDoctor = profile?.roles.includes("doctor") || profile?.roles.includes("medico");

  return (
    <Dialog open={!!profile} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Especialidades y Datos</DialogTitle>
          <DialogDescription>
            Modifica las ramas médicas y credenciales de {profile?.full_name || profile?.email}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="efn">Nombre Completo</Label>
            <Input
              id="efn"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="empps">MPPS / Nro. Licencia</Label>
              <Input
                id="empps"
                placeholder="Ej. 102.927"
                value={mpps}
                onChange={(e) => setMpps(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ecmc">Colegiado / CMC</Label>
              <Input
                id="ecmc"
                placeholder="Ej. CMC-4589"
                value={cmc}
                onChange={(e) => setCmc(e.target.value)}
              />
            </div>
          </div>

          {/* SELECTOR MÚLTIPLE DE ESPECIALIDADES */}
          <div className="grid gap-2">
            <Label className={cn(!isDoctor && "text-muted-foreground")}>
              Ramas Médicas o Especialidades {!isDoctor && "(No aplica)"}
            </Label>
            <SpecialtyMultiSelector
              value={specialty}
              onChange={setSpecialty}
              disabled={!isDoctor}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className="bg-primary text-primary-foreground hover:bg-[#3451d6]"
            >
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserAlert({
  user,
  onOpenChange,
  onConfirm,
}: {
  user: ProfileWithRoles | null;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!user} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará la cuenta de {user?.full_name || user?.email} y todos sus datos.
            Esta acción no se puede deshacer.
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
