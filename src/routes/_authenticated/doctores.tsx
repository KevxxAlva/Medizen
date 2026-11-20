import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
  UserPlus,
  Sparkles,
  Mail,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { WorkspaceStepper, WorkspaceStepperFooter } from "@/components/ui/workspace-stepper";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession, requireAdminAccess } from "@/hooks/useAuth";
import { useClinicInfo, getSaasPlanConfig } from "@/lib/api/clinic";
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

      {/* Lista de ramas sugeridas para selección rápida múltiple (amplia y sin caja pequeña de scroll) */}
      {!disabled && (
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            Ramas sugeridas (haz clic para activar o desactivar 1, 2, 3 o más):
          </span>
          <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl border border-border/60 bg-muted/20">
            {COMMON_SPECIALTIES.map((spec) => {
              const active = selectedList.includes(spec);
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialty(spec)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer border flex items-center gap-1.5",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
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

function DoctoresStaffListView({
  q,
  setQ,
  filteredCount,
  isLoading,
  paginated,
  meId,
  togglePending,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onOpenCreate,
  onEdit,
  onToggleAdmin,
  onToggleDoctor,
  onToggleRecep,
  onDelete,
}: {
  q: string;
  setQ: (v: string) => void;
  filteredCount: number;
  isLoading: boolean;
  paginated: ProfileWithRoles[];
  meId?: string;
  togglePending: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (p: number) => void;
  onOpenCreate: () => void;
  onEdit: (p: ProfileWithRoles) => void;
  onToggleAdmin: (p: ProfileWithRoles) => void;
  onToggleDoctor: (p: ProfileWithRoles) => void;
  onToggleRecep: (p: ProfileWithRoles) => void;
  onDelete: (p: ProfileWithRoles) => void;
}) {
  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Control de Accesos</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Personal y Especialistas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Administra médicos, especialidades (simples o múltiples), recepción y administradores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2 w-full md:w-64">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                onPageChange(1);
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

        <div className="items-center gap-4 hidden md:flex">
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#3451d6] transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir Personal
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Users className="h-4 w-4" /> {filteredCount} miembros registrados
        </div>
        <div className="flex items-center gap-3 md:hidden">
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-[#3451d6] transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir Personal
          </button>
        </div>
      </div>

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
                  isMe={p.id === meId}
                  togglePending={togglePending}
                  onEdit={() => onEdit(p)}
                  onToggleAdmin={() => onToggleAdmin(p)}
                  onToggleDoctor={() => onToggleDoctor(p)}
                  onToggleRecep={() => onToggleRecep(p)}
                  onDelete={() => onDelete(p)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredCount}
        itemsPerPage={itemsPerPage}
        entityLabel="miembros"
        onPageChange={onPageChange}
      />
    </>
  );
}

function DoctoresAdmin() {
  const { data: profiles = [], isLoading } = useAllProfilesWithRoles();
  const toggle = useToggleRole();
  const updateProfile = useUpdateProfile();
  const qc = useQueryClient();
  const { user: me } = useAuthSession();
  const { data: clinicInfo } = useClinicInfo();
  const planConfig = getSaasPlanConfig(clinicInfo?.plan_suscripcion);

  const [openCreate, setOpenCreate] = useState(false);
  const [toEdit, setToEdit] = useState<ProfileWithRoles | null>(null);
  const [toDelete, setToDelete] = useState<ProfileWithRoles | null>(null);
  const [busy, setBusy] = useState(false);
  const [createdSummary, setCreatedSummary] = useState<{
    full_name: string;
    email: string;
    password?: string;
    role: "admin" | "doctor" | "recepcionista";
    specialty: string;
  } | null>(null);

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
    if (!form.full_name.trim() || !form.email.trim() || form.password.length < 8) {
      toast.error("Completa nombre, correo válido y contraseña (mín. 8 caracteres)");
      return;
    }
    if (form.role === "doctor" && planConfig.maxDoctors !== null) {
      const currentDoctorsCount = profiles.filter(
        (p) => p.roles.includes("doctor") || p.roles.includes("medico"),
      ).length;
      if (currentDoctorsCount >= planConfig.maxDoctors) {
        toast.error(
          `El Plan ${planConfig.name} ($${planConfig.priceMonthlyUsd}/mes) permite hasta ${planConfig.maxDoctors} médicos. Actualiza tu plan para registrar más especialistas.`,
        );
        return;
      }
    }
    setBusy(true);
    try {
      const { error: rpcError } = await (supabase as any).rpc("admin_create_staff_user", {
        p_email: form.email.trim().toLowerCase(),
        p_password: form.password,
        p_full_name: form.full_name.trim(),
        p_role: form.role,
        p_specialty: form.specialty?.trim() || null,
      });
      if (rpcError) throw new Error(rpcError.message);
      toast.success("Usuario creado exitosamente");
      setCreatedSummary({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        specialty: form.role === "doctor" ? form.specialty?.trim() || "Medicina General" : "",
      });
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
    if (toDelete.id === me?.id) {
      toast.error("No puedes eliminarte a ti mismo");
      setToDelete(null);
      return;
    }
    setBusy(true);
    try {
      const { error: rpcError } = await (supabase as any).rpc("admin_delete_staff_user", {
        p_user_id: toDelete.id,
      });
      if (rpcError) throw new Error(rpcError.message);
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

  if (openCreate) {
    return (
      <CreateUserPageView
        form={form}
        setForm={setForm}
        onSubmit={handleCreate}
        busy={busy}
        createdSummary={createdSummary}
        onResetForNew={() => {
          setCreatedSummary(null);
          setForm({ email: "", password: "", full_name: "", specialty: "", role: "doctor" });
        }}
        onClose={() => {
          setCreatedSummary(null);
          setForm({ email: "", password: "", full_name: "", specialty: "", role: "doctor" });
          setOpenCreate(false);
        }}
      />
    );
  }

  if (toEdit) {
    return (
      <EditUserPageView
        key={toEdit.id}
        profile={toEdit}
        onClose={() => setToEdit(null)}
        updateProfile={updateProfile}
      />
    );
  }

  return (
    <div className="flex-1 w-full min-w-0 p-4 md:p-8 space-y-6">
      <DoctoresStaffListView
        q={q}
        setQ={setQ}
        filteredCount={filtered.length}
        isLoading={isLoading}
        paginated={paginated}
        meId={me?.id}
        togglePending={toggle.isPending}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onOpenCreate={() => setOpenCreate(true)}
        onEdit={setToEdit}
        onToggleAdmin={handleToggleAdmin}
        onToggleDoctor={handleToggleDoctor}
        onToggleRecep={handleToggleRecep}
        onDelete={setToDelete}
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

const STAFF_STEPS = [
  {
    id: "credentials",
    title: "Datos y Credenciales",
    subtitle: "Nombre, correo y contraseña",
  },
  {
    id: "role_specialties",
    title: "Rol y Especialidades",
    subtitle: "Permisos y ramas médicas",
  },
];

function getRoleDisplayLabel(role: string): string {
  if (role === "admin") return "Administrador del Sistema";
  if (role === "recepcionista") return "Recepción / Facturación";
  return "Doctor / Especialista Médico";
}

function StaffSuccessAnimationCard({
  isEdit,
  fullName,
  email,
  password,
  role,
  specialty,
  onResetForNew,
  onClose,
}: {
  isEdit?: boolean;
  fullName: string;
  email: string;
  password?: string;
  role: string;
  specialty?: string;
  onResetForNew?: () => void;
  onClose: () => void;
}) {
  const [copiedCreds, setCopiedCreds] = useState(false);
  const specList = (specialty || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const handleCopyCredentials = () => {
    const text = [
      `Acceso a Medizen Suite — ${fullName}`,
      `Correo: ${email}`,
      password ? `Contraseña: ${password}` : null,
      `Rol: ${getRoleDisplayLabel(role)}`,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    toast.success("Credenciales copiadas al portapapeles");
    setTimeout(() => setCopiedCreds(false), 1800);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
      <style>{`
        @keyframes medizen-badge-draw {
          0% { stroke-dashoffset: 300; opacity: 0; transform: translateY(6px); }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; transform: translateY(0); }
        }
        @keyframes medizen-staff-seal-pop {
          0% { transform: scale(0.35); opacity: 0; }
          70% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes medizen-staff-check {
          0% { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        .medizen-staff-stroke {
          stroke-dasharray: 300;
          stroke-dashoffset: 300;
          animation: medizen-badge-draw 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .medizen-staff-seal {
          transform-origin: 72px 70px;
          opacity: 0;
          animation: medizen-staff-seal-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.35s forwards;
        }
        .medizen-staff-check-path {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: medizen-staff-check 0.38s cubic-bezier(0.22, 1, 0.36, 1) 0.52s forwards;
        }
      `}</style>

      {/* Ilustración SVG: Credencial Médica + Sello Checkmark Esmeralda */}
      <div className="relative flex items-center justify-center mb-5">
        <div className="absolute h-28 w-28 rounded-full bg-emerald-500/15 animate-ping [animation-duration:1.8s]" />
        <div className="absolute h-24 w-24 rounded-full bg-primary/5" />
        <svg
          className="h-28 w-28 relative z-10"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gafete / Credencial Institucional */}
          <rect
            x="18"
            y="18"
            width="54"
            height="62"
            rx="11"
            className="fill-primary/10 stroke-primary medizen-staff-stroke"
            strokeWidth="3.5"
          />
          {/* Avatar en la credencial */}
          <circle
            cx="45"
            cy="39"
            r="8"
            className="stroke-primary medizen-staff-stroke"
            strokeWidth="3.2"
          />
          <path
            d="M32 58C34.5 52.5 39.2 50 45 50C50.8 50 55.5 52.5 58 58"
            className="stroke-primary medizen-staff-stroke"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Línea inferior del gafete */}
          <path
            d="M31 68H55"
            className="stroke-primary/65 medizen-staff-stroke"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Sello Circular Esmeralda con Checkmark */}
          <g className="medizen-staff-seal">
            <circle
              cx="72"
              cy="70"
              r="18"
              className="fill-emerald-500 stroke-card"
              strokeWidth="4"
            />
            <path
              d="M63.5 70.5L69 76L80.5 64"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="medizen-staff-check-path"
            />
          </g>
        </svg>
      </div>

      <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 rounded-full">
        {isEdit ? "Credencial Clínica Actualizada" : "Credencial Institucional Activada"}
      </span>

      <h3 className="text-xl sm:text-2xl font-black text-foreground mt-3">
        {isEdit ? "¡Perfil Profesional Actualizado!" : "¡Personal Registrado con Éxito!"}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md">
        La cuenta de <strong className="text-foreground">{fullName}</strong> ya tiene acceso activo
        en la clínica con sus permisos y especialidades configurados.
      </p>

      {/* Carnet Digital del Profesional */}
      <div className="mt-6 w-full max-w-md rounded-2xl border border-border/80 bg-muted/30 p-4 text-left shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary font-black text-sm flex items-center justify-center shrink-0">
              {initials(fullName || email)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-foreground truncate">{fullName}</p>
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <Mail className="h-3 w-3 text-primary shrink-0" />
                {email}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg shrink-0">
            {role === "admin" ? "Admin" : role === "recepcionista" ? "Recepción" : "Doctor"}
          </span>
        </div>

        {specList.length > 0 && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Especialidades Habilitadas
            </span>
            <div className="flex flex-wrap gap-1.5">
              {specList.map((sp) => (
                <span
                  key={sp}
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 inline-flex items-center gap-1"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {sp}
                </span>
              ))}
            </div>
          </div>
        )}

        {password && (
          <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Clave Inicial de Acceso
              </span>
              <span className="font-mono font-bold text-foreground">{password}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCredentials}
              className="h-8 px-2.5 rounded-xl text-[11px] font-bold gap-1.5 cursor-pointer"
            >
              {copiedCreds ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-primary" />
              )}
              Copiar Acceso
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
        {!isEdit && onResetForNew && (
          <Button
            type="button"
            variant="outline"
            onClick={onResetForNew}
            className="w-full sm:w-auto h-10 rounded-2xl font-bold text-xs gap-1.5 cursor-pointer"
          >
            <UserPlus className="h-4 w-4 text-primary" />
            Registrar Otro Miembro
          </Button>
        )}

        <Button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto flex-1 h-10 rounded-2xl bg-primary text-primary-foreground hover:bg-[#3451d6] font-bold text-xs shadow-sm shadow-primary/20 cursor-pointer"
        >
          Listo, Volver a Personal
        </Button>
      </div>
    </div>
  );
}

function CreateUserPageView({
  form,
  setForm,
  onSubmit,
  busy,
  createdSummary,
  onResetForNew,
  onClose,
}: {
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
  createdSummary: {
    full_name: string;
    email: string;
    password?: string;
    role: "admin" | "doctor" | "recepcionista";
    specialty: string;
  } | null;
  onResetForNew: () => void;
  onClose: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentStep = STAFF_STEPS[activeIndex] ?? STAFF_STEPS[0];
  const isFirstStep = activeIndex === 0;
  const isLastStep = activeIndex === STAFF_STEPS.length - 1;
  const isAllSealed = Boolean(createdSummary);

  const handleNextStep = () => {
    if (activeIndex === 0) {
      if (!form.full_name.trim() || !form.email.trim() || form.password.length < 8) {
        toast.error("Completa nombre, correo válido y contraseña (mín. 8 caracteres) para continuar");
        return;
      }
    }
    setActiveIndex((i) => Math.min(STAFF_STEPS.length - 1, i + 1));
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] flex flex-col text-foreground w-full min-w-0 animate-in fade-in duration-200">
      {/* Cabecera Superior Unificada */}
      <header className="mb-6 space-y-3.5 pb-5 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 shrink-0 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver a Personal</span>
            </Button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                  Registrar Nuevo Personal
                </h1>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Control de Accesos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Resumen en Vivo del Miembro */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-muted/35 border border-border/60 items-center">
          <div className="md:col-span-4 flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <UserRound className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                Profesional
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-foreground truncate mt-1">
                {form.full_name.trim() || "Nuevo Miembro"}
              </p>
            </div>
          </div>

          <div className="md:col-span-4 flex items-center gap-2.5 min-w-0 md:border-l md:border-border/60 md:pl-3.5">
            <div className="h-9 w-9 rounded-xl bg-background border border-border/70 text-primary flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                Rol Asignado
              </span>
              <p className="text-xs font-extrabold text-foreground truncate mt-1">
                {getRoleDisplayLabel(form.role)}
              </p>
            </div>
          </div>

          <div className="md:col-span-4 flex items-center gap-2.5 min-w-0 md:border-l md:border-border/60 md:pl-3.5">
            <div className="h-9 w-9 rounded-xl bg-background border border-border/70 text-primary flex items-center justify-center shrink-0">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                Especialidades
              </span>
              <p className="text-xs font-bold text-foreground truncate mt-1">
                {form.role !== "doctor"
                  ? "No aplica para este rol"
                  : form.specialty.trim() || "Pendiente por seleccionar"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <form onSubmit={onSubmit} className="flex-1 flex flex-col lg:flex-row min-w-0">
        <WorkspaceStepper
          steps={STAFF_STEPS}
          activeIndex={activeIndex}
          isAllCompleted={isAllSealed}
          sealedBadge="Registro Completado"
          sealedTitle="Credencial Activada"
          onSelectStep={setActiveIndex}
        />

        {/* Contenido Derecho: Paso Activo o Animación de Éxito */}
        <div className="flex-1 min-w-0 lg:pl-8 flex flex-col justify-between">
          {createdSummary ? (
            <StaffSuccessAnimationCard
              fullName={createdSummary.full_name}
              email={createdSummary.email}
              password={createdSummary.password}
              role={createdSummary.role}
              specialty={createdSummary.specialty}
              onResetForNew={() => {
                setActiveIndex(0);
                onResetForNew();
              }}
              onClose={onClose}
            />
          ) : (
            <>
              <div className="min-w-0">
                <div className="hidden lg:flex items-center justify-between pb-3.5 mb-5 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-extrabold">
                      {activeIndex + 1}
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-foreground leading-tight">
                        {currentStep.title}
                      </h2>
                      <p className="text-xs text-muted-foreground">{currentStep.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-3 py-1 rounded-xl border border-border/60">
                    Paso {activeIndex + 1} de {STAFF_STEPS.length}
                  </span>
                </div>

                {activeIndex === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1 max-w-2xl">
                    <div className="md:col-span-2 space-y-1.5">
                      <Label htmlFor="fn" className="text-xs font-bold">
                        Nombre Completo del Profesional *
                      </Label>
                      <Input
                        id="fn"
                        placeholder="Ej. Dra. María Pérez"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        className="h-10 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="em" className="text-xs font-bold flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-primary" /> Correo Electrónico (Login) *
                      </Label>
                      <Input
                        id="em"
                        type="email"
                        placeholder="profesional@clinica.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="h-10 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="pw" className="text-xs font-bold flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-primary" /> Contraseña Inicial (mín. 8 caracteres) *
                      </Label>
                      <Input
                        id="pw"
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="h-10 rounded-xl"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 py-1">
                    <div className="space-y-2 max-w-2xl">
                      <Label className="text-xs font-bold">Rol del Personal en la Clínica</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          {
                            id: "doctor" as const,
                            title: "Doctor / Especialista",
                            desc: "Consultas, historias y récipes",
                            icon: Stethoscope,
                          },
                          {
                            id: "recepcionista" as const,
                            title: "Recepción / Caja",
                            desc: "Agenda, sala de espera y cobros",
                            icon: UserRound,
                          },
                          {
                            id: "admin" as const,
                            title: "Administrador",
                            desc: "Control total de la clínica",
                            icon: Shield,
                          },
                        ].map((r) => {
                          const Icon = r.icon;
                          const active = form.role === r.id;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setForm({ ...form, role: r.id })}
                              className={cn(
                                "flex flex-col items-start gap-1.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                                active
                                  ? "border-primary bg-primary/10 text-foreground shadow-xs ring-2 ring-primary/25"
                                  : "border-border/70 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                                <span className="text-xs font-extrabold text-foreground">{r.title}</span>
                              </div>
                              <span className="text-[11px] text-muted-foreground leading-tight">
                                {r.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={cn("text-xs font-bold", form.role !== "doctor" && "text-muted-foreground")}>
                        Especialidad(es) o Ramas Médicas {form.role !== "doctor" && "(No aplica para este rol)"}
                      </Label>
                      <SpecialtyMultiSelector
                        value={form.specialty}
                        onChange={(val) => setForm({ ...form, specialty: val })}
                        disabled={form.role !== "doctor"}
                      />
                    </div>
                  </div>
                )}
              </div>

              <WorkspaceStepperFooter
                isFirstStep={isFirstStep}
                isLastStep={isLastStep}
                isPending={busy}
                canQuickSubmit={false}
                submitLabel="Crear Personal"
                onCancel={onClose}
                onPrev={() => setActiveIndex((i) => Math.max(0, i - 1))}
                onNext={handleNextStep}
              />
            </>
          )}
        </div>
      </form>
    </div>
  );
}

function EditUserPageView({
  profile,
  onClose,
  updateProfile,
}: {
  profile: ProfileWithRoles;
  onClose: () => void;
  updateProfile: ReturnType<typeof useUpdateProfile>;
}) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [specialty, setSpecialty] = useState(profile?.specialty || "");
  const [mpps, setMpps] = useState(profile?.mpps || "");
  const [cmc, setCmc] = useState(profile?.cmc || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isDoctor = profile?.roles.includes("doctor") || profile?.roles.includes("medico") || profile?.roles.includes("admin");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updateProfile.isPending) return;
    try {
      await updateProfile.mutateAsync({
        userId: profile.id,
        fullName,
        specialty,
        mpps: mpps || null,
        university: profile.university || null,
        cmc: cmc || null,
      });
      toast.success("Perfil y especialidades actualizadas correctamente");
      setSavedSuccess(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] flex flex-col text-foreground w-full min-w-0 animate-in fade-in duration-200">
      <header className="mb-6 space-y-3.5 pb-5 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 px-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 shrink-0 cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver a Personal</span>
          </Button>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
            Editar Especialidades y Credenciales
          </h1>
        </div>
      </header>

      {savedSuccess ? (
        <StaffSuccessAnimationCard
          isEdit
          fullName={fullName}
          email={profile.email}
          role={profile.roles[0] || "doctor"}
          specialty={specialty}
          onClose={onClose}
        />
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-6">
          <div className="space-y-5 max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="efn" className="text-xs font-bold">Nombre Completo</Label>
                <Input
                  id="efn"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="empps" className="text-xs font-bold">MPPS / Nro. Licencia</Label>
                <Input
                  id="empps"
                  placeholder="Ej. 102.927"
                  value={mpps}
                  onChange={(e) => setMpps(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ecmc" className="text-xs font-bold">Colegiado / CMC</Label>
                <Input
                  id="ecmc"
                  placeholder="Ej. CMC-4589"
                  value={cmc}
                  onChange={(e) => setCmc(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Ramas Médicas o Especialidades</Label>
              <SpecialtyMultiSelector
                value={specialty}
                onChange={setSpecialty}
                disabled={!isDoctor}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-2xl h-10 text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className="rounded-2xl bg-primary text-primary-foreground hover:bg-[#3451d6] h-10 px-6 text-xs font-bold cursor-pointer"
            >
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      )}
    </div>
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
