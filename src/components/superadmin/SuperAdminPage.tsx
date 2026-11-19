import { useState, useMemo, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  ShieldCheck,
  Users,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Power,
  Copy,
  Sparkles,
  Loader2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  CreditCard,
  Save,
  MessageCircle,
  KeyRound,
  FileText,
  Clock,
  DollarSign,
  Megaphone,
  Receipt,
  Trash2,
} from "lucide-react";
import {
  useClinicas,
  useSuperadminStats,
  useCreateClinica,
  useToggleClinicaStatus,
  useUpdateClinica,
  useDeleteClinica,
  useClinicStaff,
  useRemoveClinicStaffMember,
  useResetClinicUserPassword,
  useGlobalAnnouncement,
  useUpdateGlobalAnnouncement,
  parseClinicSaasMeta,
  serializeClinicSaasMeta,
  getClinicDueStatus,
  buildClinicWhatsAppUrl,
  getDefaultDueDate,
  type Clinica,
  type CreateClinicInput,
  type ClinicSaasPaymentRecord,
} from "@/lib/api/superadmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouterState } from "@tanstack/react-router";
import { AuditLogsPage } from "@/components/audit/AuditLogsPage";
import { SAAS_PLANS, getSaasPlanConfig } from "@/lib/api/clinic";

export function SuperAdminPage() {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const activeView = useMemo(() => {
    const params = new URLSearchParams(searchStr || "");
    return params.get("view") || "clinicas";
  }, [searchStr]);

  const { data: clinicas = [], isLoading: loadingClinicas } = useClinicas();
  const { stats, isLoading: loadingStats } = useSuperadminStats();
  const createMutation = useCreateClinica();
  const toggleStatusMutation = useToggleClinicaStatus();
  const updateMutation = useUpdateClinica();
  const deleteClinicaMutation = useDeleteClinica();
  const resetPasswordMutation = useResetClinicUserPassword();
  const removeStaffMutation = useRemoveClinicStaffMember();

  // Confirmación de eliminación de clínica
  const [clinicToDelete, setClinicToDelete] = useState<Clinica | null>(null);

  // Anuncio global
  const { data: globalAnnouncement } = useGlobalAnnouncement();
  const updateAnnouncementMutation = useUpdateGlobalAnnouncement();
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementType, setAnnouncementType] = useState<"info" | "warning" | "success">("info");
  const [announcementActive, setAnnouncementActive] = useState(false);

  useEffect(() => {
    if (globalAnnouncement) {
      setAnnouncementMessage(globalAnnouncement.message || "");
      setAnnouncementType(globalAnnouncement.type || "info");
      setAnnouncementActive(Boolean(globalAnnouncement.active));
    }
  }, [globalAnnouncement]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal de detalles y expediente de la clínica
  const [selectedClinica, setSelectedClinica] = useState<Clinica | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newPlan, setNewPlan] = useState<string>("");

  // Campos editables institucionales y notas
  const [editClinicName, setEditClinicName] = useState<string>("");
  const [editClinicRif, setEditClinicRif] = useState<string>("");
  const [editClinicPhone, setEditClinicPhone] = useState<string>("");
  const [editClinicEmail, setEditClinicEmail] = useState<string>("");
  const [editClinicType, setEditClinicType] = useState<string>("");
  const [editClinicAddress, setEditClinicAddress] = useState<string>("");
  const [editInternalNotes, setEditInternalNotes] = useState<string>("");
  const [editNextDueDate, setEditNextDueDate] = useState<string>("");

  // Registro rápido de pago mensual
  const [paymentMethod, setPaymentMethod] =
    useState<ClinicSaasPaymentRecord["metodo"]>("Pago Móvil");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);

  // Cambio de contraseña de administrador / usuario
  const [resetTarget, setResetTarget] = useState<{
    auth_id: string | null;
    email: string;
    nombre: string;
  } | null>(null);
  const [newUserPassword, setNewUserPassword] = useState<string>("");

  // Personal de la clínica seleccionada
  const { data: clinicStaff = [], isLoading: loadingStaff } = useClinicStaff(
    isDetailsOpen ? selectedClinica?.id_clinica : undefined
  );

  const openClinicDetails = (clinica: Clinica) => {
    const meta = parseClinicSaasMeta(clinica);
    setSelectedClinica(clinica);
    setNewPlan(clinica.plan_suscripcion);
    setEditClinicName(clinica.nombre || "");
    setEditClinicRif(clinica.rif || "");
    setEditClinicPhone(clinica.telefono || "");
    setEditClinicEmail(clinica.email_contacto || clinica.admin_email || "");
    setEditClinicType(clinica.tipo_clinica || "Consultorio Ginecológico Obstétrico");
    setEditClinicAddress(clinica.direccion || "");
    setEditInternalNotes(meta.notes || "");
    setEditNextDueDate(meta.nextDueDate || getDefaultDueDate(clinica.creado_en, clinica.estado));
    setResetTarget(null);
    setNewUserPassword("");
    setShowPaymentForm(false);
    setIsDetailsOpen(true);
  };

  useEffect(() => {
    if (selectedClinica) {
      const meta = parseClinicSaasMeta(selectedClinica);
      setEditClinicName(selectedClinica.nombre || "");
      setEditClinicRif(selectedClinica.rif || "");
      setEditClinicPhone(selectedClinica.telefono || "");
      setEditClinicEmail(selectedClinica.email_contacto || selectedClinica.admin_email || "");
      setEditClinicType(selectedClinica.tipo_clinica || "Consultorio Ginecológico Obstétrico");
      setEditClinicAddress(selectedClinica.direccion || "");
      setEditInternalNotes(meta.notes || "");
      setEditNextDueDate(
        meta.nextDueDate || getDefaultDueDate(selectedClinica.creado_en, selectedClinica.estado)
      );
      setNewPlan(selectedClinica.plan_suscripcion);
    }
  }, [selectedClinica?.id_clinica]);

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedClinica) return false;
    const meta = parseClinicSaasMeta(selectedClinica);
    return (
      editClinicName.trim() !== (selectedClinica.nombre || "") ||
      editClinicRif.trim() !== (selectedClinica.rif || "") ||
      editClinicPhone.trim() !== (selectedClinica.telefono || "") ||
      editClinicEmail.trim() !== (selectedClinica.email_contacto || selectedClinica.admin_email || "") ||
      editClinicType.trim() !== (selectedClinica.tipo_clinica || "Consultorio Ginecológico Obstétrico") ||
      editClinicAddress.trim() !== (selectedClinica.direccion || "") ||
      editInternalNotes.trim() !== (meta.notes || "") ||
      editNextDueDate !== (meta.nextDueDate || getDefaultDueDate(selectedClinica.creado_en, selectedClinica.estado))
    );
  }, [
    selectedClinica,
    editClinicName,
    editClinicRif,
    editClinicPhone,
    editClinicEmail,
    editClinicType,
    editClinicAddress,
    editInternalNotes,
    editNextDueDate,
  ]);

  const handleSaveLegalDetails = async () => {
    if (!selectedClinica) return;
    const cleanName = editClinicName.trim();
    if (!cleanName) {
      toast.error("El nombre de la clínica no puede estar vacío");
      return;
    }

    const currentMeta = parseClinicSaasMeta(selectedClinica);
    const updatedMeta = {
      ...currentMeta,
      notes: editInternalNotes.trim(),
      nextDueDate: editNextDueDate || currentMeta.nextDueDate,
    };
    const serializedMeta = serializeClinicSaasMeta(updatedMeta);

    try {
      await updateMutation.mutateAsync({
        id_clinica: selectedClinica.id_clinica,
        nombre: cleanName,
        rif: editClinicRif.trim() || null,
        telefono: editClinicPhone.trim() || null,
        email_contacto: editClinicEmail.trim() || null,
        tipo_clinica: editClinicType.trim() || "Consultorio Médico",
        direccion: editClinicAddress.trim() || null,
        notas_internas: serializedMeta,
      });
      setSelectedClinica((prev) =>
        prev
          ? {
              ...prev,
              nombre: cleanName,
              rif: editClinicRif.trim() || null,
              telefono: editClinicPhone.trim() || null,
              email_contacto: editClinicEmail.trim() || null,
              admin_email: editClinicEmail.trim() || prev.admin_email,
              tipo_clinica: editClinicType.trim() || "Consultorio Médico",
              direccion: editClinicAddress.trim() || null,
              notas_internas: serializedMeta,
            }
          : null
      );
      toast.success("Datos institucionales, fecha de corte y notas guardados");
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar datos de la clínica");
    }
  };

  const handleRegisterMonthlyPayment = async () => {
    if (!selectedClinica) return;
    const planCfg = getSaasPlanConfig(selectedClinica.plan_suscripcion);
    const currentMeta = parseClinicSaasMeta(selectedClinica);

    // Calcular nueva fecha de vencimiento (+30 días desde hoy o desde su fecha de corte si aún está vigente)
    const today = new Date();
    const currentDue = currentMeta.nextDueDate ? new Date(`${currentMeta.nextDueDate}T00:00:00`) : today;
    const baseDate = currentDue > today ? currentDue : today;
    const nextDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const nextDueStr = nextDate.toISOString().slice(0, 10);

    const newPayment: ClinicSaasPaymentRecord = {
      id: `${Date.now()}`,
      fecha: new Date().toISOString(),
      montoUsd: planCfg.priceMonthlyUsd,
      metodo: paymentMethod,
      referencia: paymentReference.trim() || undefined,
      plan: planCfg.name,
    };

    const updatedMeta = {
      ...currentMeta,
      notes: editInternalNotes.trim(),
      nextDueDate: nextDueStr,
      payments: [newPayment, ...(currentMeta.payments || [])].slice(0, 12),
    };
    const serializedMeta = serializeClinicSaasMeta(updatedMeta);

    try {
      if (selectedClinica.estado !== "activo") {
        await toggleStatusMutation.mutateAsync({
          id_clinica: selectedClinica.id_clinica,
          nuevo_estado: "activo",
        });
      }

      await updateMutation.mutateAsync({
        id_clinica: selectedClinica.id_clinica,
        notas_internas: serializedMeta,
      });

      setEditNextDueDate(nextDueStr);
      setPaymentReference("");
      setShowPaymentForm(false);
      setSelectedClinica((prev) =>
        prev
          ? {
              ...prev,
              estado: "activo",
              notas_internas: serializedMeta,
            }
          : null
      );
      toast.success(`Pago de $${planCfg.priceMonthlyUsd} registrado. Nuevo corte: ${nextDueStr}`);
    } catch (err: any) {
      toast.error(err.message || "Error al registrar el pago");
    }
  };

  const handleResetUserPassword = async () => {
    if (!resetTarget) return;
    if (newUserPassword.trim().length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    try {
      const res = await resetPasswordMutation.mutateAsync({
        auth_id: resetTarget.auth_id,
        email: resetTarget.email,
        new_password: newUserPassword.trim(),
      });
      if (res.mode === "direct") {
        toast.success(`Contraseña de ${resetTarget.nombre} actualizada correctamente.`);
      } else {
        toast.success(
          `Se envió un enlace de restablecimiento al correo ${resetTarget.email}.`
        );
      }
      setResetTarget(null);
      setNewUserPassword("");
    } catch (err: any) {
      toast.error(err.message || "No se pudo restablecer la contraseña.");
    }
  };

  const handleSaveGlobalAnnouncement = async (activeOverride?: boolean) => {
    const nextActive = activeOverride !== undefined ? activeOverride : announcementActive;
    if (nextActive && !announcementMessage.trim()) {
      toast.error("Escribe un mensaje para activar el anuncio global.");
      return;
    }
    try {
      await updateAnnouncementMutation.mutateAsync({
        active: nextActive,
        message: announcementMessage.trim(),
        type: announcementType,
        updatedAt: new Date().toISOString(),
      });
      setAnnouncementActive(nextActive);
      toast.success(
        nextActive
          ? "Anuncio global publicado en todas las clínicas"
          : "Anuncio global desactivado"
      );
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el anuncio global");
    }
  };

  const handleChangePlan = async (id_clinica: string, plan: "basico" | "pro" | "enterprise") => {
    try {
      await updateMutation.mutateAsync({
        id_clinica,
        plan_suscripcion: plan,
      });
      setSelectedClinica((prev) => (prev ? { ...prev, plan_suscripcion: plan } : null));
      toast.success(`Plan actualizado a ${plan.toUpperCase()} correctamente`);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar plan");
    }
  };

  // Formulario de nueva clínica
  const [formData, setFormData] = useState<CreateClinicInput>({
    nombre: "",
    slug: "",
    rif: "",
    telefono: "",
    direccion: "",
    plan: "pro",
    estado_inicial: "activo",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    tipo_clinica: "Consultorio Ginecológico Obstétrico",
    color_primario: "#0ea5e9",
  });

  // Autogenerar slug a partir del nombre
  const handleNameChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setFormData((prev) => ({
      ...prev,
      nombre: val,
      slug: prev.slug === "" || prev.slug === slug.slice(0, -1) ? slug : prev.slug,
    }));
  };

  const filteredClinicas = useMemo(() => {
    return clinicas.filter((c) => {
      const matchSearch =
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.rif && c.rif.toLowerCase().includes(searchTerm.toLowerCase()));

      if (filterStatus === "todos") return matchSearch;
      if (filterStatus === "por_vencer") {
        const due = getClinicDueStatus(c);
        return matchSearch && (due.status === "vencido" || due.status === "por_vencer");
      }
      return matchSearch && c.estado === filterStatus;
    });
  }, [clinicas, searchTerm, filterStatus]);

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.slug || !formData.admin_email || !formData.admin_password) {
      toast.error("Por favor completa los campos obligatorios.");
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast.success(
        formData.estado_inicial === "demo"
          ? `¡Clínica "${formData.nombre}" creada en Modo Demo (14 días)!`
          : `¡Clínica "${formData.nombre}" creada y activada con éxito!`
      );
      setIsModalOpen(false);
      setFormData({
        nombre: "",
        slug: "",
        rif: "",
        telefono: "",
        direccion: "",
        plan: "pro",
        estado_inicial: "activo",
        admin_name: "",
        admin_email: "",
        admin_password: "",
        tipo_clinica: "Consultorio Ginecológico Obstétrico",
        color_primario: "#0ea5e9",
      });
    } catch (err: any) {
      toast.error(err.message || "Error al crear la clínica.");
    }
  };

  const handleSetStatus = async (clinica: Clinica, nuevoEstado: "activo" | "suspendido" | "demo") => {
    try {
      await toggleStatusMutation.mutateAsync({
        id_clinica: clinica.id_clinica,
        nuevo_estado: nuevoEstado,
      });

      if (nuevoEstado === "demo") {
        const currentMeta = parseClinicSaasMeta(clinica);
        const demoDue = getDefaultDueDate(new Date().toISOString(), "demo");
        const serialized = serializeClinicSaasMeta({
          ...currentMeta,
          nextDueDate: demoDue,
        });
        await updateMutation.mutateAsync({
          id_clinica: clinica.id_clinica,
          notas_internas: serialized,
        });
        setEditNextDueDate(demoDue);
      }

      setSelectedClinica((prev) =>
        prev && prev.id_clinica === clinica.id_clinica ? { ...prev, estado: nuevoEstado } : prev
      );

      toast.success(
        nuevoEstado === "activo"
          ? `Clínica ${clinica.nombre} activada.`
          : nuevoEstado === "demo"
            ? `Clínica ${clinica.nombre} cambiada a Modo Demo (14 días).`
            : `Clínica ${clinica.nombre} suspendida.`
      );
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar estado.");
    }
  };

  const handleToggleStatus = async (clinica: Clinica) => {
    const nuevoEstado = clinica.estado === "suspendido" ? "activo" : "suspendido";
    await handleSetStatus(clinica, nuevoEstado);
  };

  const handleConfirmDeleteClinica = async () => {
    if (!clinicToDelete) return;
    const targetName = clinicToDelete.nombre;
    const targetId = clinicToDelete.id_clinica;
    try {
      await deleteClinicaMutation.mutateAsync({ id_clinica: targetId });
      if (selectedClinica?.id_clinica === targetId) {
        setIsDetailsOpen(false);
        setSelectedClinica(null);
      }
      setClinicToDelete(null);
      toast.success(`Clínica "${targetName}" eliminada permanentemente.`);
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar la clínica.");
    }
  };

  const copyClinicSlug = (slug: string) => {
    const url = `${window.location.origin}?clinic=${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Enlace de acceso copiado al portapapeles");
  };

  if (activeView === "auditoria") {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-1 px-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              SaaS Multi-Tenant Master
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Auditoría Global del Sistema</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro centralizado de eventos, accesos y operaciones en todas las clínicas de la plataforma.
          </p>
        </div>
        <AuditLogsPage isSuperAdminView />
      </div>
    );
  }

  if (activeView === "configuracion") {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-1 px-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              SaaS Multi-Tenant Master
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Configuración Global de la Plataforma</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Anuncios globales para las clínicas, parámetros de aislamiento Multi-Tenant (RLS) y catálogo de planes SaaS.
          </p>
        </div>

        {/* Anuncio / Banner Global para todas las clínicas */}
        <Card className="glass-card shadow-sm border border-primary/30">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" />
                  Anuncio o Aviso Global para todas las Clínicas
                </CardTitle>
                <CardDescription>
                  Publica un banner informativo en la parte superior de todas las clínicas suscritas (mantenimientos, actualizaciones o avisos).
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold w-fit",
                  announcementActive
                    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {announcementActive ? "Aviso Activo en Clínicas" : "Desactivado"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-xs">Mensaje del Banner Global</Label>
                <Input
                  placeholder="Ej: Mantenimiento programado este domingo de 10:00 PM a 11:00 PM."
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Estilo del Aviso</Label>
                <Select
                  value={announcementType}
                  onValueChange={(v: any) => setAnnouncementType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informativo (Azul)</SelectItem>
                    <SelectItem value="warning">Importante / Alerta (Ámbar)</SelectItem>
                    <SelectItem value="success">Novedad / Éxito (Verde)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {announcementActive && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updateAnnouncementMutation.isPending}
                  onClick={() => handleSaveGlobalAnnouncement(false)}
                >
                  Ocultar Aviso
                </Button>
              )}
              <Button
                size="sm"
                disabled={updateAnnouncementMutation.isPending}
                onClick={() => handleSaveGlobalAnnouncement(true)}
                className="gap-1.5"
              >
                {updateAnnouncementMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Megaphone className="h-3.5 w-3.5" />
                )}
                {announcementActive ? "Actualizar Aviso Global" : "Publicar Aviso en todas las Clínicas"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card shadow-sm border border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Seguridad y Aislamiento Multi-Tenant
              </CardTitle>
              <CardDescription>
                Estado de las políticas globales de protección de datos entre clínicas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Row Level Security (RLS) por clínica</span>
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Activo</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Edición de nombre de clínica restringida</span>
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Solo Super Admin</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Acceso maestro Super Administrador</span>
                <Badge variant="outline" className="border-primary/40 text-primary">Habilitado</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-sm border border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Resumen de Red SaaS
              </CardTitle>
              <CardDescription>
                Métricas globales consolidadas de las organizaciones suscritas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Clínicas registradas</span>
                <span className="font-bold">
                  {stats.totalClinicas} ({stats.clinicasActivas} activas · {stats.clinicasDemo} demo)
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Especialistas en la red</span>
                <span className="font-bold">{stats.totalMedicos}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Pacientes totales en plataforma</span>
                <span className="font-bold">{stats.totalPacientes.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Facturación Mensual Recurrente (MRR)</span>
                <span className="font-bold text-emerald-500">${stats.mrrUsd} USD / mes</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Catálogo de Planes SaaS (Opción A) */}
        <Card className="glass-card shadow-sm border border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Catálogo de Planes de Suscripción SaaS (Mercado Venezuela)
            </CardTitle>
            <CardDescription>
              Límites de capacidad y módulos habilitados automáticamente según el plan de cada clínica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(SAAS_PLANS).map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "rounded-xl p-4 border flex flex-col justify-between gap-3",
                    plan.id === "pro"
                      ? "border-primary/40 bg-primary/5"
                      : plan.id === "enterprise"
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-border/60 bg-muted/20"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base">{plan.name}</span>
                      <Badge variant="outline" className="font-bold text-xs">
                        ${plan.priceMonthlyUsd} / mes
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{plan.tagline}</p>
                    <ul className="mt-2.5 space-y-1 text-xs text-foreground/80">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-xs space-y-1.5 pt-2 border-t border-border/40">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Médicos máx.:</span>
                      <span className="font-semibold">
                        {plan.maxDoctors ? `Hasta ${plan.maxDoctors}` : "Ilimitados"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pacientes máx.:</span>
                      <span className="font-semibold">
                        {plan.maxPatients ? `Hasta ${plan.maxPatients}` : "Ilimitados"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-1 px-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              SaaS Multi-Tenant Master
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-2 flex items-center gap-2.5">
            Panel del Super Administrador
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión centralizada de organizaciones médicas, suscripciones, cobros mensuales, soporte y seguridad de Medizen.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className="gap-2 shadow-lg shadow-primary/20 font-semibold"
        >
          <Plus className="h-4 w-4" />
          Registrar Nueva Clínica
        </Button>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card shadow-sm border border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total de Clínicas
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? "-" : stats.totalClinicas}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              {stats.clinicasActivas} activas · {stats.clinicasDemo} demo · {stats.clinicasSuspendidas} susp.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Facturación Mensual (MRR)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {loadingStats ? "-" : `$${stats.mrrUsd} USD`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.clinicasPorVencerOVencidas > 0 ? (
                <span className="text-amber-500 font-semibold">
                  {stats.clinicasPorVencerOVencidas} clínica(s) por cobrar / vencer
                </span>
              ) : (
                "Todas las clínicas al día"
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Médicos / Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? "-" : `${stats.totalMedicos} / ${stats.totalPacientes.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Especialistas y pacientes en la red</p>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Consultas Totales
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? "-" : stats.totalConsultas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Atenciones médicas procesadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Clinics Table Section */}
      <Card className="glass-card shadow-sm border border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">Organizaciones y Clínicas Suscritas</CardTitle>
              <CardDescription>
                Supervisa el estado operativo, fechas de corte, uso del plan y contacto directo por WhatsApp.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, slug o RIF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[165px] h-9">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activo">Solo Activas</SelectItem>
                  <SelectItem value="demo">En Demo Gratuita</SelectItem>
                  <SelectItem value="por_vencer">Por vencer / Vencidas</SelectItem>
                  <SelectItem value="suspendido">Solo Suspendidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loadingClinicas ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Cargando organizaciones...</p>
            </div>
          ) : filteredClinicas.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">No se encontraron clínicas registradas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase border-b border-border/40">
                  <tr>
                    <th className="py-3 px-4">Clínica</th>
                    <th className="py-3 px-4">Administrador</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Próximo Corte</th>
                    <th className="py-3 px-4 text-center">Médicos</th>
                    <th className="py-3 px-4 text-center">Pacientes</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredClinicas.map((clinica) => {
                    const planCfg = getSaasPlanConfig(clinica.plan_suscripcion);
                    const dueInfo = getClinicDueStatus(clinica);
                    const waUrl = buildClinicWhatsAppUrl(clinica);

                    return (
                      <tr key={clinica.id_clinica} className="hover:bg-muted/40 transition-colors group">
                        <td className="py-3.5 px-4 font-medium">
                          <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => openClinicDetails(clinica)}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                              style={{ backgroundColor: clinica.color_primario || "#0ea5e9" }}
                            >
                              {clinica.nombre.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
                                {clinica.nombre}
                                {clinica.slug === "femesalud" && (
                                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                    Principal
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {clinica.rif || "Sin RIF"} · <span className="font-mono">{clinica.slug}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground text-xs">
                              {clinica.admin_nombre || "Administrador"}
                            </span>
                            <span
                              className="text-[11px] text-muted-foreground truncate max-w-[165px]"
                              title={clinica.admin_email}
                            >
                              {clinica.admin_email || "Sin correo"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium",
                              clinica.plan_suscripcion === "enterprise"
                                ? "border-amber-500/40 text-amber-600 bg-amber-500/10"
                                : clinica.plan_suscripcion === "pro"
                                  ? "border-primary/30 text-primary bg-primary/10"
                                  : "border-border text-muted-foreground bg-muted/40"
                            )}
                          >
                            {planCfg.name} · ${planCfg.priceMonthlyUsd}/m
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[11px] font-semibold w-fit gap-1",
                                dueInfo.status === "vencido"
                                  ? "border-destructive/40 text-destructive bg-destructive/10"
                                  : dueInfo.status === "por_vencer"
                                    ? "border-amber-500/40 text-amber-600 bg-amber-500/10"
                                    : "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                              )}
                            >
                              <Clock className="h-3 w-3" />
                              {dueInfo.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Corte: {dueInfo.nextDueDate}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-medium text-muted-foreground">
                          <span
                            className={cn(
                              planCfg.maxDoctors && (clinica.medicos_count || 0) >= planCfg.maxDoctors
                                ? "text-amber-500 font-bold"
                                : ""
                            )}
                          >
                            {clinica.medicos_count || 0}
                            {planCfg.maxDoctors ? ` / ${planCfg.maxDoctors}` : ""}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-medium text-muted-foreground">
                          {(clinica.pacientes_count || 0).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1 font-semibold text-xs",
                              clinica.estado === "activo"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : clinica.estado === "demo"
                                  ? "bg-violet-500/10 text-violet-600 border-violet-500/30"
                                  : "bg-destructive/10 text-destructive border-destructive/30"
                            )}
                          >
                            {clinica.estado === "activo" ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" /> Activo
                              </>
                            ) : clinica.estado === "demo" ? (
                              <>
                                <Sparkles className="h-3 w-3" /> Demo
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3" /> Suspendido
                              </>
                            )}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {waUrl && (
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                title="Contactar o enviar recordatorio por WhatsApp"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                              >
                                <a href={waUrl} target="_blank" rel="noreferrer">
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openClinicDetails(clinica)}
                              title="Ver expediente, cobros y administrador"
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyClinicSlug(clinica.slug)}
                              title="Copiar enlace de acceso"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(clinica)}
                              disabled={toggleStatusMutation.isPending}
                              title={clinica.estado === "suspendido" ? "Reactivar acceso" : "Suspender acceso"}
                              className={cn(
                                "h-8 w-8",
                                clinica.estado !== "suspendido"
                                  ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              )}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setClinicToDelete(clinica)}
                              disabled={deleteClinicaMutation.isPending}
                              title="Eliminar clínica"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Registrar Nueva Clínica */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Building2 className="h-5 w-5 text-primary" />
              Alta de Nueva Organización / Clínica
            </DialogTitle>
            <DialogDescription>
              Crea una nueva clínica con su propia base de datos aislada y genera su primer usuario administrador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClinic} className="space-y-6 pt-2">
            {/* Sección 1: Datos de la Clínica */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary border-b border-border/40 pb-1">
                1. Información Institucional
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre" className="text-xs">Nombre de la Clínica *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej. Centro Médico San Pedro"
                    value={formData.nombre}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="slug" className="text-xs">Identificador / Subdominio (Slug) *</Label>
                  <Input
                    id="slug"
                    placeholder="ej. san-pedro"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rif" className="text-xs">RIF / Identificación Fiscal</Label>
                  <Input
                    id="rif"
                    placeholder="J-12345678-9"
                    value={formData.rif}
                    onChange={(e) => setFormData({ ...formData, rif: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="telefono" className="text-xs">Teléfono de Contacto (WhatsApp)</Label>
                  <Input
                    id="telefono"
                    placeholder="+58 414 123 4567"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="direccion" className="text-xs">Dirección Física</Label>
                  <Input
                    id="direccion"
                    placeholder="Av. Bolívar, Centro Médico Torre A, Piso 2"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Administrador Principal */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary border-b border-border/40 pb-1">
                2. Cuenta del Administrador / Especialista Principal
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-1">
                  <Label htmlFor="admin_name" className="text-xs">Nombre Completo *</Label>
                  <Input
                    id="admin_name"
                    placeholder="Dra. María Pérez"
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label htmlFor="admin_email" className="text-xs">Correo Electrónico (Login) *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    placeholder="doctor@sanpedro.com"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label htmlFor="admin_password" className="text-xs">Contraseña Inicial *</Label>
                  <Input
                    id="admin_password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección 3: Plan, Modo Inicial y Marca */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary border-b border-border/40 pb-1">
                3. Suscripción, Periodo de Prueba y Personalización
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="plan" className="text-xs">Plan de Suscripción</Label>
                  <Select
                    value={formData.plan}
                    onValueChange={(val: any) => setFormData({ ...formData, plan: val })}
                  >
                    <SelectTrigger id="plan">
                      <SelectValue placeholder="Seleccionar plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico — $15/mes (Hasta 2 médicos · 500 pac.)</SelectItem>
                      <SelectItem value="pro">Pro — $25/mes (Hasta 8 médicos · Finanzas + Inventario)</SelectItem>
                      <SelectItem value="enterprise">Enterprise — $45/mes (Ilimitado + Reportes y Auditoría)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="estado_inicial" className="text-xs">Modalidad de Activación</Label>
                  <Select
                    value={formData.estado_inicial || "activo"}
                    onValueChange={(val: any) => setFormData({ ...formData, estado_inicial: val })}
                  >
                    <SelectTrigger id="estado_inicial">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Suscripción Activa (30 días)</SelectItem>
                      <SelectItem value="demo">Prueba Gratuita / Demo (14 días)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="color_primario" className="text-xs">Color de Identidad</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color_primario"
                      type="color"
                      className="w-10 h-10 p-1 rounded-lg cursor-pointer shrink-0"
                      value={formData.color_primario}
                      onChange={(e) => setFormData({ ...formData, color_primario: e.target.value })}
                    />
                    <Input
                      value={formData.color_primario}
                      onChange={(e) => setFormData({ ...formData, color_primario: e.target.value })}
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tipo_clinica" className="text-xs">Especialidad Principal</Label>
                  <Input
                    id="tipo_clinica"
                    placeholder="Consultorio Ginecológico"
                    value={formData.tipo_clinica}
                    onChange={(e) => setFormData({ ...formData, tipo_clinica: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/30">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="gap-2 font-semibold">
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Configurando Clínica...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {formData.estado_inicial === "demo" ? "Crear Clínica en Demo (14 días)" : "Crear y Activar Clínica"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Expediente, Cobros, Soporte y Administrador de la Clínica */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 pr-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                  style={{ backgroundColor: selectedClinica?.color_primario || "#0ea5e9" }}
                >
                  {selectedClinica?.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    {selectedClinica?.nombre}
                    {selectedClinica?.slug === "femesalud" && (
                      <Badge variant="secondary" className="text-[10px]">
                        Principal
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Subdominio / Slug:{" "}
                    <span className="font-mono font-semibold text-foreground">{selectedClinica?.slug}</span>
                  </DialogDescription>
                </div>
              </div>

              {selectedClinica && buildClinicWhatsAppUrl(selectedClinica) && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                >
                  <a href={buildClinicWhatsAppUrl(selectedClinica)!} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp Admin
                  </a>
                </Button>
              )}
            </div>
          </DialogHeader>

          {selectedClinica && (
            <div className="space-y-4 py-2">
              {/* 1. Administrador Responsable + Cambio de Contraseña */}
              <div className="rounded-xl p-4 bg-muted/40 border border-border/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    Administrador de la Organización y Soporte de Acceso
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setResetTarget({
                        auth_id: selectedClinica.admin_auth_id || null,
                        email: selectedClinica.admin_email || "",
                        nombre: selectedClinica.admin_nombre || "Administrador",
                      })
                    }
                    className="h-7 px-2.5 text-xs gap-1.5"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    Cambiar Contraseña del Admin
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Nombre Completo:</span>
                    <span className="font-semibold text-foreground">
                      {selectedClinica.admin_nombre || "No especificado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Correo de Acceso:</span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedClinica.admin_email || "Sin correo registrado"}
                    </span>
                  </div>
                </div>

                {resetTarget && (
                  <div className="mt-2 p-3 rounded-xl bg-background/80 border border-primary/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-primary" />
                        Nueva contraseña para: <span className="text-primary">{resetTarget.nombre}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setResetTarget(null);
                          setNewUserPassword("");
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        Cancelar
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="text"
                        placeholder="Escribe la nueva contraseña (mínimo 6 caracteres)"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button
                        size="sm"
                        disabled={resetPasswordMutation.isPending}
                        onClick={handleResetUserPassword}
                        className="h-8 text-xs font-semibold gap-1.5 shrink-0"
                      >
                        {resetPasswordMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Guardar Nueva Clave
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Datos Institucionales, Legales y Notas Internas */}
              <div className="rounded-xl p-4 bg-muted/40 border border-border/50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Datos Institucionales, Contacto y Notas (Exclusivo Super Admin)
                  </h4>
                  <Button
                    size="sm"
                    onClick={handleSaveLegalDetails}
                    disabled={updateMutation.isPending || !hasUnsavedChanges}
                    className="h-7 px-3 text-xs font-semibold gap-1.5"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    Guardar Cambios
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground block mb-1">
                      Nombre Oficial de la Clínica:
                    </Label>
                    <Input
                      value={editClinicName}
                      onChange={(e) => setEditClinicName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveLegalDetails();
                        }
                      }}
                      className="h-8 text-xs font-semibold"
                      placeholder="Nombre de la clínica"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground block mb-1">
                      Identificación Fiscal / RIF:
                    </Label>
                    <Input
                      value={editClinicRif}
                      onChange={(e) => setEditClinicRif(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveLegalDetails();
                        }
                      }}
                      className="h-8 text-xs font-semibold uppercase"
                      placeholder="J-12345678-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground block mb-1">
                      Teléfono / WhatsApp de Contacto:
                    </Label>
                    <Input
                      value={editClinicPhone}
                      onChange={(e) => setEditClinicPhone(e.target.value)}
                      className="h-8 text-xs"
                      placeholder="+58 414 123 4567"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground block mb-1">
                      Correo Corporativo:
                    </Label>
                    <Input
                      value={editClinicEmail}
                      onChange={(e) => setEditClinicEmail(e.target.value)}
                      className="h-8 text-xs"
                      placeholder="contacto@clinica.com"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground block mb-1">
                      Especialidad / Tipo de Centro:
                    </Label>
                    <Input
                      value={editClinicType}
                      onChange={(e) => setEditClinicType(e.target.value)}
                      className="h-8 text-xs"
                      placeholder="Consultorio Ginecológico Obstétrico"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground block mb-1">
                      Dirección Física:
                    </Label>
                    <Input
                      value={editClinicAddress}
                      onChange={(e) => setEditClinicAddress(e.target.value)}
                      className="h-8 text-xs"
                      placeholder="Av. Principal..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Notas Internas / Acuerdos Comerciales (Solo visible para ti):
                    </Label>
                    <Textarea
                      value={editInternalNotes}
                      onChange={(e) => setEditInternalNotes(e.target.value)}
                      className="text-xs min-h-[60px]"
                      placeholder="Ej: Paga los días 15 por Pago Móvil. Acuerdo especial de lanzamiento..."
                    />
                  </div>
                </div>
              </div>

              {/* 3. Control de Cobros, Vencimiento y Pagos Recibidos */}
              <div className="rounded-xl p-4 bg-muted/40 border border-border/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-500" />
                    Control de Pagos Mensuales y Fecha de Corte
                  </h4>
                  <Button
                    size="sm"
                    variant={showPaymentForm ? "outline" : "default"}
                    onClick={() => setShowPaymentForm((v) => !v)}
                    className="h-7 px-3 text-xs font-semibold gap-1.5"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    {showPaymentForm ? "Cerrar Registro de Pago" : "Registrar Pago Mensual (+30 días)"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <Label className="text-xs text-muted-foreground block mb-1">
                      Fecha de Próximo Corte / Vencimiento:
                    </Label>
                    <Input
                      type="date"
                      value={editNextDueDate}
                      onChange={(e) => setEditNextDueDate(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Estado de Cobranza:</span>
                    {(() => {
                      const due = getClinicDueStatus({
                        ...selectedClinica,
                        notas_internas: serializeClinicSaasMeta({
                          ...parseClinicSaasMeta(selectedClinica),
                          nextDueDate: editNextDueDate,
                        }),
                      });
                      return (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-semibold py-1 px-2.5",
                            due.status === "vencido"
                              ? "border-destructive/40 text-destructive bg-destructive/10"
                              : due.status === "por_vencer"
                                ? "border-amber-500/40 text-amber-600 bg-amber-500/10"
                                : "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                          )}
                        >
                          {due.label}
                        </Badge>
                      );
                    })()}
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Tarifa del Plan Actual:</span>
                    <span className="text-sm font-bold text-emerald-500">
                      ${getSaasPlanConfig(selectedClinica.plan_suscripcion).priceMonthlyUsd} USD / mes
                    </span>
                  </div>
                </div>

                {showPaymentForm && (
                  <div className="p-3 rounded-xl bg-background/80 border border-emerald-500/30 space-y-3">
                    <div className="text-xs font-semibold text-foreground">
                      Registrar pago recibido de {selectedClinica.nombre} ($
                      {getSaasPlanConfig(selectedClinica.plan_suscripcion).priceMonthlyUsd} USD)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Método de Pago</Label>
                        <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pago Móvil">Pago Móvil (Bs)</SelectItem>
                            <SelectItem value="Zelle">Zelle (USD)</SelectItem>
                            <SelectItem value="Efectivo USD">Efectivo Divisas ($)</SelectItem>
                            <SelectItem value="Binance">Binance Pay (USDT)</SelectItem>
                            <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Referencia / Comprobante</Label>
                        <Input
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="Ej: #849201"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          size="sm"
                          onClick={handleRegisterMonthlyPayment}
                          disabled={updateMutation.isPending}
                          className="h-8 w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Confirmar y Extender 30 Días
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {(() => {
                  const payments = parseClinicSaasMeta(selectedClinica).payments || [];
                  if (payments.length === 0) return null;
                  return (
                    <div className="pt-2 border-t border-border/40 space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Últimos Pagos Registrados:
                      </span>
                      <div className="space-y-1 max-h-28 overflow-y-auto">
                        {payments.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between text-xs bg-background/50 px-2.5 py-1.5 rounded-lg border border-border/30"
                          >
                            <span className="font-medium">
                              {new Date(p.fecha).toLocaleDateString("es-VE")} · {p.metodo}
                              {p.referencia ? ` (Ref: ${p.referencia})` : ""}
                            </span>
                            <span className="font-bold text-emerald-500">
                              +${p.montoUsd} USD ({p.plan})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 4. Límites del Plan y Personal de la Clínica */}
              <div className="rounded-xl p-4 bg-muted/40 border border-border/50 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Capacidad del Plan y Personal de la Clínica ({clinicStaff.length} usuarios)
                </h4>

                {(() => {
                  const planCfg = getSaasPlanConfig(selectedClinica.plan_suscripcion);
                  const medUsed = selectedClinica.medicos_count || 0;
                  const medMax = planCfg.maxDoctors;
                  const medPct = medMax ? Math.min(100, Math.round((medUsed / medMax) * 100)) : 25;

                  const pacUsed = selectedClinica.pacientes_count || 0;
                  const pacMax = planCfg.maxPatients;
                  const pacPct = pacMax ? Math.min(100, Math.round((pacUsed / pacMax) * 100)) : 20;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl p-3 bg-background/60 border border-border/40 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Médicos</span>
                          <span className="font-bold">
                            {medUsed} / {medMax ?? "Ilimitados"}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              medMax && medUsed >= medMax ? "bg-amber-500" : "bg-primary"
                            )}
                            style={{ width: `${medPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl p-3 bg-background/60 border border-border/40 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Pacientes</span>
                          <span className="font-bold">
                            {pacUsed.toLocaleString()} / {pacMax ? pacMax.toLocaleString() : "Ilimitados"}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              pacMax && pacUsed >= pacMax ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${pacPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl p-3 bg-background/60 border border-border/40 flex flex-col justify-center text-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          Consultas Realizadas
                        </span>
                        <div className="text-lg font-bold text-foreground">
                          {(selectedClinica.consultas_count || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {loadingStaff ? (
                  <div className="text-xs text-muted-foreground flex items-center gap-2 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando usuarios de la clínica...
                  </div>
                ) : clinicStaff.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                    {clinicStaff.map((member) => (
                      <div
                        key={member.id_usuario}
                        className="flex items-center justify-between gap-2 text-xs bg-background/60 px-3 py-1.5 rounded-lg border border-border/40"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-foreground">{member.nombre}</span>
                          <span className="text-muted-foreground ml-2">
                            ({member.rol}
                            {member.especialidad ? ` · ${member.especialidad}` : ""})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setResetTarget({
                                auth_id: member.auth_id,
                                email: member.email || selectedClinica.admin_email || "",
                                nombre: member.nombre,
                              })
                            }
                            className="h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary"
                          >
                            <KeyRound className="h-3 w-3" />
                            Clave
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={removeStaffMutation.isPending}
                            onClick={async () => {
                              try {
                                await removeStaffMutation.mutateAsync({
                                  id_usuario: member.id_usuario,
                                  auth_id: member.auth_id,
                                });
                                toast.success(`Cuenta de ${member.nombre} desvinculada de la clínica`);
                              } catch (err: any) {
                                toast.error(err.message || "Error al quitar usuario de la clínica");
                              }
                            }}
                            className="h-6 px-2 text-[11px] gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                            Quitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* 5. Suscripción y Estado (Activo / Demo / Suspendido) */}
              <div className="rounded-xl p-4 bg-muted/40 border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Plan de Suscripción:</span>
                  <Select
                    value={newPlan || selectedClinica.plan_suscripcion}
                    onValueChange={(val) => {
                      setNewPlan(val);
                      handleChangePlan(selectedClinica.id_clinica, val as any);
                    }}
                  >
                    <SelectTrigger className="h-8 w-56 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico ($15/mes · 2 médicos)</SelectItem>
                      <SelectItem value="pro">Pro ($25/mes · 8 médicos)</SelectItem>
                      <SelectItem value="enterprise">Enterprise ($45/mes · Ilimitado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Estado de la Clínica:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={selectedClinica.estado}
                      onValueChange={(val: "activo" | "demo" | "suspendido") =>
                        handleSetStatus(selectedClinica, val)
                      }
                    >
                      <SelectTrigger className="h-8 w-44 text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo (Suscripción)</SelectItem>
                        <SelectItem value="demo">Modo Demo (14 días)</SelectItem>
                        <SelectItem value="suspendido">Suspendido (Bloqueado)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 pt-2 border-t border-border/30">
            {selectedClinica ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setClinicToDelete(selectedClinica)}
                disabled={deleteClinicaMutation.isPending}
                className="w-full sm:w-auto text-xs gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar Clínica
              </Button>
            ) : (
              <div />
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              {selectedClinica && hasUnsavedChanges && (
                <Button
                  variant="default"
                  onClick={handleSaveLegalDetails}
                  disabled={updateMutation.isPending}
                  className="w-full sm:w-auto text-xs gap-1.5"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Guardar Cambios
                </Button>
              )}
              <Button
                variant={selectedClinica && hasUnsavedChanges ? "outline" : "default"}
                onClick={async () => {
                  if (selectedClinica && editClinicName.trim() && hasUnsavedChanges) {
                    await handleSaveLegalDetails();
                  }
                  setIsDetailsOpen(false);
                }}
                className="w-full sm:w-auto text-xs"
              >
                Cerrar Expediente
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación para Eliminar Clínica */}
      <Dialog
        open={Boolean(clinicToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteClinicaMutation.isPending) {
            setClinicToDelete(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Eliminar Clínica
            </DialogTitle>
            <DialogDescription className="pt-1 text-xs leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente la clínica{" "}
              <span className="font-bold text-foreground">{clinicToDelete?.nombre}</span> (
              <span className="font-mono">{clinicToDelete?.slug}</span>)? Esta acción eliminará su organización, personal asociado y registros vinculados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleteClinicaMutation.isPending}
              onClick={() => setClinicToDelete(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteClinicaMutation.isPending}
              onClick={handleConfirmDeleteClinica}
              className="text-xs gap-1.5 font-semibold"
            >
              {deleteClinicaMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Sí, Eliminar Clínica
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
