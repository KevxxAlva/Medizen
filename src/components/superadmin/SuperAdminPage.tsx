import { useState, useMemo } from "react";
import {
  Building2,
  Plus,
  Search,
  ShieldCheck,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Power,
  Copy,
  Sparkles,
  Loader2,
  Eye,
  MessageCircle,
  Clock,
  DollarSign,
  Trash2,
} from "lucide-react";
import {
  useClinicas,
  useSuperadminStats,
  useToggleClinicaStatus,
  useDeleteClinica,
  getClinicDueStatus,
  buildClinicWhatsAppUrl,
  type Clinica,
} from "@/lib/api/superadmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { getSaasPlanConfig } from "@/lib/api/clinic";
import { SuperAdminGlobalConfigView } from "./SuperAdminGlobalConfigView";
import { SuperAdminCreateClinicDialog } from "./SuperAdminCreateClinicDialog";
import { SuperAdminClinicDetailsDialog } from "./SuperAdminClinicDetailsDialog";

function SuperAdminKpiCards({
  loadingStats,
  stats,
}: {
  loadingStats: boolean;
  stats: ReturnType<typeof useSuperadminStats>["stats"];
}) {
  return (
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
            {loadingStats ? "-" : `${stats.totalMedicos} / ${stats.totalPacientes}`}
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
          <div className="text-2xl font-bold">{loadingStats ? "-" : stats.totalConsultas}</div>
          <p className="text-xs text-muted-foreground mt-1">Atenciones médicas procesadas</p>
        </CardContent>
      </Card>
    </div>
  );
}

const PLAN_BADGE_CLASSES: Record<string, string> = {
  enterprise: "border-amber-500/40 text-amber-600 bg-amber-500/10",
  pro: "border-primary/30 text-primary bg-primary/10",
  basico: "border-border text-muted-foreground bg-muted/40",
};

const DUE_BADGE_CLASSES: Record<string, string> = {
  vencido: "border-destructive/40 text-destructive bg-destructive/10",
  por_vencer: "border-amber-500/40 text-amber-600 bg-amber-500/10",
  al_dia: "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  activo: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  demo: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  suspendido: "bg-destructive/10 text-destructive border-destructive/30",
};

function ClinicStatusBadge({ estado }: { estado: string }) {
  const cls = STATUS_BADGE_CLASSES[estado] || STATUS_BADGE_CLASSES.suspendido;
  return (
    <Badge variant="outline" className={cn("gap-1 font-semibold text-xs", cls)}>
      {estado === "activo" ? (
        <><CheckCircle2 className="h-3 w-3" /> Activo</>
      ) : estado === "demo" ? (
        <><Sparkles className="h-3 w-3" /> Demo</>
      ) : (
        <><AlertTriangle className="h-3 w-3" /> Suspendido</>
      )}
    </Badge>
  );
}

function getClinicRowViewModel(clinica: Clinica) {
  const planCfg = getSaasPlanConfig(clinica.plan_suscripcion);
  const dueInfo = getClinicDueStatus(clinica);
  const medicosCount = clinica.medicos_count || 0;
  return {
    planLabel: `${planCfg.name} · $${planCfg.priceMonthlyUsd}/m`,
    planBadgeClass: PLAN_BADGE_CLASSES[clinica.plan_suscripcion] || PLAN_BADGE_CLASSES.basico,
    dueLabel: dueInfo.label,
    dueDate: dueInfo.nextDueDate,
    dueBadgeClass: DUE_BADGE_CLASSES[dueInfo.status] || DUE_BADGE_CLASSES.al_dia,
    waUrl: buildClinicWhatsAppUrl(clinica),
    isDoctorLimitReached: Boolean(planCfg.maxDoctors && medicosCount >= planCfg.maxDoctors),
    doctorsText: planCfg.maxDoctors ? `${medicosCount} / ${planCfg.maxDoctors}` : String(medicosCount),
    patientsCount: clinica.pacientes_count || 0,
    isSuspended: clinica.estado === "suspendido",
    avatarBg: clinica.color_primario || "#0ea5e9",
    rifText: clinica.rif || "Sin RIF",
    adminName: clinica.admin_nombre || "Administrador",
    adminEmail: clinica.admin_email || "Sin correo",
    isMainClinic: clinica.slug === "femesalud",
  };
}

function SuperAdminClinicRowActions({
  clinica,
  waUrl,
  isSuspended,
  togglePending,
  deletePending,
  onOpenDetails,
  onCopySlug,
  onToggleStatus,
  onRequestDelete,
}: {
  clinica: Clinica;
  waUrl: string | null;
  isSuspended: boolean;
  togglePending: boolean;
  deletePending: boolean;
  onOpenDetails: (c: Clinica) => void;
  onCopySlug: (slug: string) => void;
  onToggleStatus: (c: Clinica) => void;
  onRequestDelete: (c: Clinica) => void;
}) {
  const toggleTitle = isSuspended ? "Reactivar acceso" : "Suspender acceso";
  const toggleClass = isSuspended
    ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
    : "text-amber-600 hover:text-amber-700 hover:bg-amber-50";

  return (
    <div className="flex items-center justify-end gap-1">
      {waUrl && (
        <Button variant="ghost" size="icon" asChild title="Contactar o enviar recordatorio por WhatsApp" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10">
          <a href={waUrl} target="_blank" rel="noreferrer" aria-label={`Contactar a ${clinica.nombre} por WhatsApp`}>
            <MessageCircle className="h-3.5 w-3.5" />
          </a>
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={() => onOpenDetails(clinica)} title="Ver expediente, cobros y administrador" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
        <Eye className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onCopySlug(clinica.slug)} title="Copiar enlace de acceso" className="h-8 w-8 text-muted-foreground hover:text-foreground">
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onToggleStatus(clinica)} disabled={togglePending} title={toggleTitle} className={cn("h-8 w-8", toggleClass)}>
        <Power className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onRequestDelete(clinica)} disabled={deletePending} title="Eliminar clínica" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function SuperAdminClinicRow({
  clinica,
  togglePending,
  deletePending,
  onOpenDetails,
  onCopySlug,
  onToggleStatus,
  onRequestDelete,
}: {
  clinica: Clinica;
  togglePending: boolean;
  deletePending: boolean;
  onOpenDetails: (c: Clinica) => void;
  onCopySlug: (slug: string) => void;
  onToggleStatus: (c: Clinica) => void;
  onRequestDelete: (c: Clinica) => void;
}) {
  const vm = getClinicRowViewModel(clinica);

  return (
    <tr className="hover:bg-muted/40 transition-colors group">
      <td className="py-3.5 px-4 font-medium">
        <button type="button" className="flex items-center gap-3 cursor-pointer text-left" onClick={() => onOpenDetails(clinica)}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm" style={{ backgroundColor: vm.avatarBg }}>
            {clinica.nombre.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
              {clinica.nombre}
              {vm.isMainClinic && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Principal</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {vm.rifText} · <span className="font-mono">{clinica.slug}</span>
            </div>
          </div>
        </button>
      </td>

      <td className="py-3.5 px-4">
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-xs">{vm.adminName}</span>
          <span className="text-[11px] text-muted-foreground truncate max-w-[165px]" title={clinica.admin_email}>
            {vm.adminEmail}
          </span>
        </div>
      </td>

      <td className="py-3.5 px-4">
        <Badge variant="outline" className={cn("text-xs font-medium", vm.planBadgeClass)}>
          {vm.planLabel}
        </Badge>
      </td>

      <td className="py-3.5 px-4">
        <div className="flex flex-col gap-0.5">
          <Badge variant="outline" className={cn("text-[11px] font-semibold w-fit gap-1", vm.dueBadgeClass)}>
            <Clock className="h-3 w-3" />
            {vm.dueLabel}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono">Corte: {vm.dueDate}</span>
        </div>
      </td>

      <td className="py-3.5 px-4 text-center font-medium text-muted-foreground">
        <span className={cn(vm.isDoctorLimitReached && "text-amber-500 font-bold")}>
          {vm.doctorsText}
        </span>
      </td>

      <td className="py-3.5 px-4 text-center font-medium text-muted-foreground">
        {vm.patientsCount}
      </td>

      <td className="py-3.5 px-4 text-center">
        <ClinicStatusBadge estado={clinica.estado} />
      </td>

      <td className="py-3.5 px-4 text-right">
        <SuperAdminClinicRowActions
          clinica={clinica}
          waUrl={vm.waUrl}
          isSuspended={vm.isSuspended}
          togglePending={togglePending}
          deletePending={deletePending}
          onOpenDetails={onOpenDetails}
          onCopySlug={onCopySlug}
          onToggleStatus={onToggleStatus}
          onRequestDelete={onRequestDelete}
        />
      </td>
    </tr>
  );
}

function SuperAdminDeleteClinicDialog({
  clinicToDelete,
  isPending,
  onClose,
  onConfirm,
}: {
  clinicToDelete: Clinica | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(clinicToDelete)} onOpenChange={(open) => !open && !isPending && onClose()}>
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
          <Button type="button" variant="outline" disabled={isPending} onClick={onClose} className="text-xs">
            Cancelar
          </Button>
          <Button type="button" variant="destructive" disabled={isPending} onClick={onConfirm} className="text-xs gap-1.5 font-semibold">
            {isPending ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Eliminando...</>
            ) : (
              <><Trash2 className="h-3.5 w-3.5" /> Sí, Eliminar Clínica</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function filterClinicasList(clinicas: Clinica[], searchTerm: string, filterStatus: string): Clinica[] {
  const q = searchTerm.toLowerCase();
  return clinicas.filter((c) => {
    const matchSearch =
      c.nombre.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      Boolean(c.rif && c.rif.toLowerCase().includes(q));
    if (!matchSearch) return false;
    if (filterStatus === "todos") return true;
    if (filterStatus === "por_vencer") {
      const due = getClinicDueStatus(c);
      return due.status === "vencido" || due.status === "por_vencer";
    }
    return c.estado === filterStatus;
  });
}

export function SuperAdminPage() {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const activeView = useMemo(() => new URLSearchParams(searchStr || "").get("view") || "clinicas", [searchStr]);

  const { data: clinicas = [], isLoading: loadingClinicas } = useClinicas();
  const { stats, isLoading: loadingStats } = useSuperadminStats();
  const toggleStatusMutation = useToggleClinicaStatus();
  const deleteClinicaMutation = useDeleteClinica();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClinica, setSelectedClinica] = useState<Clinica | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState<Clinica | null>(null);

  const filteredClinicas = useMemo(
    () => filterClinicasList(clinicas, searchTerm, filterStatus),
    [clinicas, searchTerm, filterStatus],
  );

  const handleToggleStatus = async (clinica: Clinica) => {
    if (toggleStatusMutation.isPending) return;
    const nuevoEstado = clinica.estado === "suspendido" ? "activo" : "suspendido";
    try {
      await toggleStatusMutation.mutateAsync({ id_clinica: clinica.id_clinica, nuevo_estado: nuevoEstado });
      setSelectedClinica((prev) => (prev?.id_clinica === clinica.id_clinica ? { ...prev, estado: nuevoEstado } : prev));
      toast.success(nuevoEstado === "activo" ? `Clínica ${clinica.nombre} activada.` : `Clínica ${clinica.nombre} suspendida.`);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar estado.");
    }
  };

  const handleConfirmDeleteClinica = async () => {
    if (!clinicToDelete || deleteClinicaMutation.isPending) return;
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
    navigator.clipboard.writeText(`${window.location.origin}?clinic=${slug}`);
    toast.success("Enlace de acceso copiado al portapapeles");
  };

  if (activeView === "auditoria") {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-1 px-3">
            <ShieldCheck className="h-3.5 w-3.5" /> SaaS Multi-Tenant Master
          </Badge>
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
    return <SuperAdminGlobalConfigView stats={stats} />;
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-1 px-3">
            <ShieldCheck className="h-3.5 w-3.5" /> SaaS Multi-Tenant Master
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Panel del Super Administrador</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión centralizada de organizaciones médicas, suscripciones, cobros mensuales, soporte y seguridad de Medizen.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2 shadow-lg shadow-primary/20 font-semibold">
          <Plus className="h-4 w-4" /> Registrar Nueva Clínica
        </Button>
      </div>

      <SuperAdminKpiCards loadingStats={loadingStats} stats={stats} />

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
                <Input placeholder="Buscar por nombre, slug o RIF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[165px] h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
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
                  {filteredClinicas.map((clinica) => (
                    <SuperAdminClinicRow
                      key={clinica.id_clinica}
                      clinica={clinica}
                      togglePending={toggleStatusMutation.isPending}
                      deletePending={deleteClinicaMutation.isPending}
                      onOpenDetails={(c) => {
                        setSelectedClinica(c);
                        setIsDetailsOpen(true);
                      }}
                      onCopySlug={copyClinicSlug}
                      onToggleStatus={handleToggleStatus}
                      onRequestDelete={setClinicToDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <SuperAdminCreateClinicDialog open={isModalOpen} onOpenChange={setIsModalOpen} />

      <SuperAdminClinicDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        clinica={selectedClinica}
        onClinicaUpdated={setSelectedClinica}
        onRequestDelete={setClinicToDelete}
        deletePending={deleteClinicaMutation.isPending}
      />

      <SuperAdminDeleteClinicDialog
        clinicToDelete={clinicToDelete}
        isPending={deleteClinicaMutation.isPending}
        onClose={() => setClinicToDelete(null)}
        onConfirm={handleConfirmDeleteClinica}
      />
    </div>
  );
}
