import { useState, useMemo } from "react";
import {
  Building2,
  Stethoscope,
  Loader2,
  Mail,
  UserCheck,
  Save,
  MessageCircle,
  KeyRound,
  FileText,
  DollarSign,
  Receipt,
  Trash2,
} from "lucide-react";
import {
  useToggleClinicaStatus,
  useUpdateClinica,
  useClinicStaff,
  useRemoveClinicStaffMember,
  useResetClinicUserPassword,
  parseClinicSaasMeta,
  serializeClinicSaasMeta,
  getClinicDueStatus,
  buildClinicWhatsAppUrl,
  getDefaultDueDate,
  type Clinica,
  type ClinicSaasPaymentRecord,
} from "@/lib/api/superadmin";
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
import { getSaasPlanConfig } from "@/lib/api/clinic";

const VE_DATE_FMT = new Intl.DateTimeFormat("es-VE");

interface ResetTarget {
  auth_id: string | null;
  email: string;
  nombre: string;
}

function ClinicAdminAccessSection({
  clinica,
  resetTarget,
  setResetTarget,
  newUserPassword,
  setNewUserPassword,
  isPending,
  onResetPassword,
}: {
  clinica: Clinica;
  resetTarget: ResetTarget | null;
  setResetTarget: (t: ResetTarget | null) => void;
  newUserPassword: string;
  setNewUserPassword: (v: string) => void;
  isPending: boolean;
  onResetPassword: () => void;
}) {
  return (
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
              auth_id: clinica.admin_auth_id || null,
              email: clinica.admin_email || "",
              nombre: clinica.admin_nombre || "Administrador",
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
          <span className="font-semibold text-foreground">{clinica.admin_nombre || "No especificado"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block">Correo de Acceso:</span>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            {clinica.admin_email || "Sin correo registrado"}
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
              disabled={isPending}
              onClick={onResetPassword}
              className="h-8 text-xs font-semibold gap-1.5 shrink-0"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar Nueva Clave
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ClinicLegalInfoSection({
  editClinicName,
  setEditClinicName,
  editClinicRif,
  setEditClinicRif,
  editClinicPhone,
  setEditClinicPhone,
  editClinicEmail,
  setEditClinicEmail,
  editClinicType,
  setEditClinicType,
  editClinicAddress,
  setEditClinicAddress,
  editInternalNotes,
  setEditInternalNotes,
  hasUnsavedChanges,
  isPending,
  onSave,
}: {
  editClinicName: string;
  setEditClinicName: (v: string) => void;
  editClinicRif: string;
  setEditClinicRif: (v: string) => void;
  editClinicPhone: string;
  setEditClinicPhone: (v: string) => void;
  editClinicEmail: string;
  setEditClinicEmail: (v: string) => void;
  editClinicType: string;
  setEditClinicType: (v: string) => void;
  editClinicAddress: string;
  setEditClinicAddress: (v: string) => void;
  editInternalNotes: string;
  setEditInternalNotes: (v: string) => void;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  onSave: () => void;
}) {
  return (
    <div className="rounded-xl p-4 bg-muted/40 border border-border/50 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Datos Institucionales, Contacto y Notas (Exclusivo Super Admin)
        </h4>
        <Button size="sm" onClick={onSave} disabled={isPending || !hasUnsavedChanges} className="h-7 px-3 text-xs font-semibold gap-1.5">
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Guardar Cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <Label className="text-xs text-muted-foreground block mb-1">Nombre Oficial de la Clínica:</Label>
          <Input value={editClinicName} onChange={(e) => setEditClinicName(e.target.value)} className="h-8 text-xs font-semibold" placeholder="Nombre de la clínica" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground block mb-1">Identificación Fiscal / RIF:</Label>
          <Input value={editClinicRif} onChange={(e) => setEditClinicRif(e.target.value)} className="h-8 text-xs font-semibold uppercase" placeholder="J-12345678-9" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground block mb-1">Teléfono / WhatsApp de Contacto:</Label>
          <Input value={editClinicPhone} onChange={(e) => setEditClinicPhone(e.target.value)} className="h-8 text-xs" placeholder="+58 414 123 4567" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground block mb-1">Correo Corporativo:</Label>
          <Input value={editClinicEmail} onChange={(e) => setEditClinicEmail(e.target.value)} className="h-8 text-xs" placeholder="contacto@clinica.com" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground block mb-1">Especialidad / Tipo de Centro:</Label>
          <Input value={editClinicType} onChange={(e) => setEditClinicType(e.target.value)} className="h-8 text-xs" placeholder="Consultorio Ginecológico Obstétrico" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground block mb-1">Dirección Física:</Label>
          <Input value={editClinicAddress} onChange={(e) => setEditClinicAddress(e.target.value)} className="h-8 text-xs" placeholder="Av. Principal..." />
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
  );
}

function ClinicBillingSection({
  clinica,
  editNextDueDate,
  setEditNextDueDate,
  showPaymentForm,
  setShowPaymentForm,
  paymentMethod,
  setPaymentMethod,
  paymentReference,
  setPaymentReference,
  isPending,
  onRegisterPayment,
}: {
  clinica: Clinica;
  editNextDueDate: string;
  setEditNextDueDate: (v: string) => void;
  showPaymentForm: boolean;
  setShowPaymentForm: (fn: (v: boolean) => boolean) => void;
  paymentMethod: ClinicSaasPaymentRecord["metodo"];
  setPaymentMethod: (v: ClinicSaasPaymentRecord["metodo"]) => void;
  paymentReference: string;
  setPaymentReference: (v: string) => void;
  isPending: boolean;
  onRegisterPayment: () => void;
}) {
  const planCfg = getSaasPlanConfig(clinica.plan_suscripcion);
  const due = getClinicDueStatus({
    ...clinica,
    notas_internas: serializeClinicSaasMeta({
      ...parseClinicSaasMeta(clinica),
      nextDueDate: editNextDueDate,
    }),
  });
  const payments = parseClinicSaasMeta(clinica).payments || [];

  return (
    <div className="rounded-xl p-4 bg-muted/40 border border-border/50 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Receipt className="h-4 w-4 text-emerald-500" />
          Control de Pagos Mensuales y Fecha de Corte
        </h4>
        <Button size="sm" variant={showPaymentForm ? "outline" : "default"} onClick={() => setShowPaymentForm((v) => !v)} className="h-7 px-3 text-xs font-semibold gap-1.5">
          <DollarSign className="h-3.5 w-3.5" />
          {showPaymentForm ? "Cerrar Registro de Pago" : "Registrar Pago Mensual (+30 días)"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <Label className="text-xs text-muted-foreground block mb-1">Fecha de Próximo Corte / Vencimiento:</Label>
          <Input type="date" value={editNextDueDate} onChange={(e) => setEditNextDueDate(e.target.value)} className="h-8 text-xs font-mono" />
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Estado de Cobranza:</span>
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-semibold py-1 px-2.5",
              due.status === "vencido"
                ? "border-destructive/40 text-destructive bg-destructive/10"
                : due.status === "por_vencer"
                  ? "border-amber-500/40 text-amber-600 bg-amber-500/10"
                  : "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
            )}
          >
            {due.label}
          </Badge>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Tarifa del Plan Actual:</span>
          <span className="text-sm font-bold text-emerald-500">${planCfg.priceMonthlyUsd} USD / mes</span>
        </div>
      </div>

      {showPaymentForm && (
        <div className="p-3 rounded-xl bg-background/80 border border-emerald-500/30 space-y-3">
          <div className="text-xs font-semibold text-foreground">
            Registrar pago recibido de {clinica.nombre} (${planCfg.priceMonthlyUsd} USD)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <Label className="text-[11px] text-muted-foreground">Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
              <Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Ej: #849201" className="h-8 text-xs" />
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={onRegisterPayment} disabled={isPending} className="h-8 w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                Confirmar y Extender 30 Días
              </Button>
            </div>
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="pt-2 border-t border-border/40 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Últimos Pagos Registrados:</span>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs bg-background/50 px-2.5 py-1.5 rounded-lg border border-border/30">
                <span className="font-medium">
                  {VE_DATE_FMT.format(new Date(p.fecha))} · {p.metodo}
                  {p.referencia ? ` (Ref: ${p.referencia})` : ""}
                </span>
                <span className="font-bold text-emerald-500">+${p.montoUsd} USD ({p.plan})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ClinicStaffCapacitySection({
  clinica,
  clinicStaff,
  loadingStaff,
  removePending,
  onSelectResetTarget,
  onRemoveStaff,
}: {
  clinica: Clinica;
  clinicStaff: Array<{ id_usuario: number; auth_id: string | null; nombre: string; email?: string | null; rol: string; especialidad?: string | null }>;
  loadingStaff: boolean;
  removePending: boolean;
  onSelectResetTarget: (t: ResetTarget) => void;
  onRemoveStaff: (member: { id_usuario: number; auth_id: string | null; nombre: string }) => void;
}) {
  const planCfg = getSaasPlanConfig(clinica.plan_suscripcion);
  const medUsed = clinica.medicos_count || 0;
  const medMax = planCfg.maxDoctors;
  const medPct = medMax ? Math.min(100, Math.round((medUsed / medMax) * 100)) : 25;
  const pacUsed = clinica.pacientes_count || 0;
  const pacMax = planCfg.maxPatients;
  const pacPct = pacMax ? Math.min(100, Math.round((pacUsed / pacMax) * 100)) : 20;

  return (
    <div className="rounded-xl p-4 bg-muted/40 border border-border/50 space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Stethoscope className="h-4 w-4 text-primary" />
        Capacidad del Plan y Personal de la Clínica ({clinicStaff.length} usuarios)
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl p-3 bg-background/60 border border-border/40 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium">Médicos</span>
            <span className="font-bold">{medUsed} / {medMax ?? "Ilimitados"}</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full", medMax && medUsed >= medMax ? "bg-amber-500" : "bg-primary")} style={{ width: `${medPct}%` }} />
          </div>
        </div>
        <div className="rounded-xl p-3 bg-background/60 border border-border/40 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium">Pacientes</span>
            <span className="font-bold">{pacUsed} / {pacMax ?? "Ilimitados"}</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full", pacMax && pacUsed >= pacMax ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${pacPct}%` }} />
          </div>
        </div>
        <div className="rounded-xl p-3 bg-background/60 border border-border/40 flex flex-col justify-center text-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Consultas Realizadas</span>
          <div className="text-lg font-bold text-foreground">{clinica.consultas_count || 0}</div>
        </div>
      </div>

      {loadingStaff ? (
        <div className="text-xs text-muted-foreground flex items-center gap-2 py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando usuarios de la clínica...
        </div>
      ) : clinicStaff.length > 0 ? (
        <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
          {clinicStaff.map((member) => (
            <div key={member.id_usuario} className="flex items-center justify-between gap-2 text-xs bg-background/60 px-3 py-1.5 rounded-lg border border-border/40">
              <div className="min-w-0">
                <span className="font-semibold text-foreground">{member.nombre}</span>
                <span className="text-muted-foreground ml-2">
                  ({member.rol}{member.especialidad ? ` · ${member.especialidad}` : ""})
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectResetTarget({ auth_id: member.auth_id, email: member.email || clinica.admin_email || "", nombre: member.nombre })}
                  className="h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary"
                >
                  <KeyRound className="h-3 w-3" /> Clave
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={removePending}
                  onClick={() => onRemoveStaff(member)}
                  className="h-6 px-2 text-[11px] gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" /> Quitar
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SuperAdminClinicDetailsDialog({
  open,
  onOpenChange,
  clinica,
  onClinicaUpdated,
  onRequestDelete,
  deletePending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinica: Clinica | null;
  onClinicaUpdated: (updated: Clinica) => void;
  onRequestDelete: (c: Clinica) => void;
  deletePending: boolean;
}) {
  if (!open || !clinica) return null;
  return (
    <SuperAdminClinicDetailsInner
      key={clinica.id_clinica}
      open={open}
      onOpenChange={onOpenChange}
      clinica={clinica}
      onClinicaUpdated={onClinicaUpdated}
      onRequestDelete={onRequestDelete}
      deletePending={deletePending}
    />
  );
}

function computeHasUnsavedLegalChanges(
  clinica: Clinica,
  fields: {
    name: string;
    rif: string;
    phone: string;
    email: string;
    type: string;
    address: string;
    notes: string;
    nextDueDate: string;
  },
): boolean {
  const meta = parseClinicSaasMeta(clinica);
  return (
    fields.name.trim() !== (clinica.nombre || "") ||
    fields.rif.trim() !== (clinica.rif || "") ||
    fields.phone.trim() !== (clinica.telefono || "") ||
    fields.email.trim() !== (clinica.email_contacto || clinica.admin_email || "") ||
    fields.type.trim() !== (clinica.tipo_clinica || "Consultorio Ginecológico Obstétrico") ||
    fields.address.trim() !== (clinica.direccion || "") ||
    fields.notes.trim() !== (meta.notes || "") ||
    fields.nextDueDate !== (meta.nextDueDate || getDefaultDueDate(clinica.creado_en, clinica.estado))
  );
}

function buildNextDueDateStr(currentDueStr?: string): string {
  const today = new Date();
  const currentDue = currentDueStr ? new Date(`${currentDueStr}T00:00:00`) : today;
  const baseDate = currentDue > today ? currentDue : today;
  return new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function ClinicDetailsDialogHeader({ clinica }: { clinica: Clinica }) {
  const waUrl = buildClinicWhatsAppUrl(clinica);
  return (
    <DialogHeader>
      <div className="flex items-center justify-between gap-3 pr-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
            style={{ backgroundColor: clinica.color_primario || "#0ea5e9" }}
          >
            {clinica.nombre.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <DialogTitle className="text-xl flex items-center gap-2">
              {clinica.nombre}
              {clinica.slug === "femesalud" && <Badge variant="secondary" className="text-[10px]">Principal</Badge>}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Subdominio / Slug: <span className="font-mono font-semibold text-foreground">{clinica.slug}</span>
            </DialogDescription>
          </div>
        </div>
        {waUrl && (
          <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10">
            <a href={waUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Admin
            </a>
          </Button>
        )}
      </div>
    </DialogHeader>
  );
}

function ClinicPlanStatusControls({
  plan,
  estado,
  onChangePlan,
  onSetStatus,
}: {
  plan: string;
  estado: "activo" | "demo" | "suspendido";
  onChangePlan: (v: "basico" | "pro" | "enterprise") => void;
  onSetStatus: (v: "activo" | "demo" | "suspendido") => void;
}) {
  return (
    <div className="rounded-xl p-4 bg-muted/40 border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <span className="text-xs text-muted-foreground block mb-1">Plan de Suscripción:</span>
        <Select value={plan} onValueChange={(v) => onChangePlan(v as any)}>
          <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="basico">Básico ($15/mes · 2 médicos)</SelectItem>
            <SelectItem value="pro">Pro ($25/mes · 8 médicos)</SelectItem>
            <SelectItem value="enterprise">Enterprise ($45/mes · Ilimitado)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <span className="text-xs text-muted-foreground block mb-1">Estado de la Clínica:</span>
        <Select value={estado} onValueChange={(v: "activo" | "demo" | "suspendido") => onSetStatus(v)}>
          <SelectTrigger className="h-8 w-44 text-xs font-semibold"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="activo">Activo (Suscripción)</SelectItem>
            <SelectItem value="demo">Modo Demo (14 días)</SelectItem>
            <SelectItem value="suspendido">Suspendido (Bloqueado)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function useClinicDetailsState(clinica: Clinica, onClinicaUpdated: (updated: Clinica) => void) {
  const initialMeta = parseClinicSaasMeta(clinica);
  const toggleStatusMutation = useToggleClinicaStatus();
  const updateMutation = useUpdateClinica();
  const resetPasswordMutation = useResetClinicUserPassword();
  const removeStaffMutation = useRemoveClinicStaffMember();
  const { data: clinicStaff = [], isLoading: loadingStaff } = useClinicStaff(clinica.id_clinica);

  const [newPlan, setNewPlan] = useState<string>(clinica.plan_suscripcion);
  const [editClinicName, setEditClinicName] = useState(clinica.nombre || "");
  const [editClinicRif, setEditClinicRif] = useState(clinica.rif || "");
  const [editClinicPhone, setEditClinicPhone] = useState(clinica.telefono || "");
  const [editClinicEmail, setEditClinicEmail] = useState(clinica.email_contacto || clinica.admin_email || "");
  const [editClinicType, setEditClinicType] = useState(clinica.tipo_clinica || "Consultorio Ginecológico Obstétrico");
  const [editClinicAddress, setEditClinicAddress] = useState(clinica.direccion || "");
  const [editInternalNotes, setEditInternalNotes] = useState(initialMeta.notes || "");
  const [editNextDueDate, setEditNextDueDate] = useState(initialMeta.nextDueDate || getDefaultDueDate(clinica.creado_en, clinica.estado));
  const [paymentMethod, setPaymentMethod] = useState<ClinicSaasPaymentRecord["metodo"]>("Pago Móvil");
  const [paymentReference, setPaymentReference] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [resetTarget, setResetTarget] = useState<ResetTarget | null>(null);
  const [newUserPassword, setNewUserPassword] = useState("");

  const hasUnsavedChanges = useMemo(
    () =>
      computeHasUnsavedLegalChanges(clinica, {
        name: editClinicName,
        rif: editClinicRif,
        phone: editClinicPhone,
        email: editClinicEmail,
        type: editClinicType,
        address: editClinicAddress,
        notes: editInternalNotes,
        nextDueDate: editNextDueDate,
      }),
    [clinica, editClinicName, editClinicRif, editClinicPhone, editClinicEmail, editClinicType, editClinicAddress, editInternalNotes, editNextDueDate],
  );

  const handleSaveLegalDetails = async () => {
    if (updateMutation.isPending) return;
    const cleanName = editClinicName.trim();
    if (!cleanName) {
      toast.error("El nombre de la clínica no puede estar vacío");
      return;
    }
    const currentMeta = parseClinicSaasMeta(clinica);
    const serializedMeta = serializeClinicSaasMeta({
      ...currentMeta,
      notes: editInternalNotes.trim(),
      nextDueDate: editNextDueDate || currentMeta.nextDueDate,
    });
    const patch = {
      nombre: cleanName,
      rif: editClinicRif.trim() || null,
      telefono: editClinicPhone.trim() || null,
      email_contacto: editClinicEmail.trim() || null,
      tipo_clinica: editClinicType.trim() || "Consultorio Médico",
      direccion: editClinicAddress.trim() || null,
      notas_internas: serializedMeta,
    };
    try {
      await updateMutation.mutateAsync({ id_clinica: clinica.id_clinica, ...patch });
      onClinicaUpdated({ ...clinica, ...patch, admin_email: patch.email_contacto || clinica.admin_email });
      toast.success("Datos institucionales, fecha de corte y notas guardados");
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar datos de la clínica");
    }
  };

  const handleRegisterMonthlyPayment = async () => {
    if (updateMutation.isPending) return;
    const planCfg = getSaasPlanConfig(clinica.plan_suscripcion);
    const currentMeta = parseClinicSaasMeta(clinica);
    const nextDueStr = buildNextDueDateStr(currentMeta.nextDueDate);
    const newPayment: ClinicSaasPaymentRecord = {
      id: `${Date.now()}`,
      fecha: new Date().toISOString(),
      montoUsd: planCfg.priceMonthlyUsd,
      metodo: paymentMethod,
      referencia: paymentReference.trim() || undefined,
      plan: planCfg.name,
    };
    const serializedMeta = serializeClinicSaasMeta({
      ...currentMeta,
      notes: editInternalNotes.trim(),
      nextDueDate: nextDueStr,
      payments: [newPayment, ...(currentMeta.payments || [])].slice(0, 12),
    });
    try {
      if (clinica.estado !== "activo") {
        await toggleStatusMutation.mutateAsync({ id_clinica: clinica.id_clinica, nuevo_estado: "activo" });
      }
      await updateMutation.mutateAsync({ id_clinica: clinica.id_clinica, notas_internas: serializedMeta });
      setEditNextDueDate(nextDueStr);
      setPaymentReference("");
      setShowPaymentForm(false);
      onClinicaUpdated({ ...clinica, estado: "activo", notas_internas: serializedMeta });
      toast.success(`Pago de $${planCfg.priceMonthlyUsd} registrado. Nuevo corte: ${nextDueStr}`);
    } catch (err: any) {
      toast.error(err.message || "Error al registrar el pago");
    }
  };

  const handleResetUserPassword = async () => {
    if (!resetTarget || resetPasswordMutation.isPending) return;
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
      toast.success(
        res.mode === "direct"
          ? `Contraseña de ${resetTarget.nombre} actualizada correctamente.`
          : `Se envió un enlace de restablecimiento al correo ${resetTarget.email}.`,
      );
      setResetTarget(null);
      setNewUserPassword("");
    } catch (err: any) {
      toast.error(err.message || "No se pudo restablecer la contraseña.");
    }
  };

  const handleChangePlan = async (plan: "basico" | "pro" | "enterprise") => {
    setNewPlan(plan);
    try {
      await updateMutation.mutateAsync({ id_clinica: clinica.id_clinica, plan_suscripcion: plan });
      onClinicaUpdated({ ...clinica, plan_suscripcion: plan });
      toast.success(`Plan actualizado a ${plan.toUpperCase()} correctamente`);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar plan");
    }
  };

  const handleSetStatus = async (nuevoEstado: "activo" | "suspendido" | "demo") => {
    try {
      await toggleStatusMutation.mutateAsync({ id_clinica: clinica.id_clinica, nuevo_estado: nuevoEstado });
      let updatedNotes = clinica.notas_internas;
      if (nuevoEstado === "demo") {
        const demoDue = getDefaultDueDate(new Date().toISOString(), "demo");
        updatedNotes = serializeClinicSaasMeta({ ...parseClinicSaasMeta(clinica), nextDueDate: demoDue });
        await updateMutation.mutateAsync({ id_clinica: clinica.id_clinica, notas_internas: updatedNotes });
        setEditNextDueDate(demoDue);
      }
      onClinicaUpdated({ ...clinica, estado: nuevoEstado, notas_internas: updatedNotes });
      toast.success(`Estado de ${clinica.nombre} actualizado a ${nuevoEstado}.`);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar estado.");
    }
  };

  const handleRemoveStaff = async (member: { id_usuario: number; auth_id: string | null; nombre: string }) => {
    if (removeStaffMutation.isPending) return;
    try {
      await removeStaffMutation.mutateAsync({ id_usuario: member.id_usuario, auth_id: member.auth_id });
      toast.success(`Cuenta de ${member.nombre} desvinculada de la clínica`);
    } catch (err: any) {
      toast.error(err.message || "Error al quitar usuario de la clínica");
    }
  };

  return {
    clinicStaff,
    loadingStaff,
    updatePending: updateMutation.isPending,
    resetPending: resetPasswordMutation.isPending,
    removePending: removeStaffMutation.isPending,
    newPlan,
    editClinicName,
    setEditClinicName,
    editClinicRif,
    setEditClinicRif,
    editClinicPhone,
    setEditClinicPhone,
    editClinicEmail,
    setEditClinicEmail,
    editClinicType,
    setEditClinicType,
    editClinicAddress,
    setEditClinicAddress,
    editInternalNotes,
    setEditInternalNotes,
    editNextDueDate,
    setEditNextDueDate,
    paymentMethod,
    setPaymentMethod,
    paymentReference,
    setPaymentReference,
    showPaymentForm,
    setShowPaymentForm,
    resetTarget,
    setResetTarget,
    newUserPassword,
    setNewUserPassword,
    hasUnsavedChanges,
    handleSaveLegalDetails,
    handleRegisterMonthlyPayment,
    handleResetUserPassword,
    handleChangePlan,
    handleSetStatus,
    handleRemoveStaff,
  };
}

function SuperAdminClinicDetailsInner({
  open,
  onOpenChange,
  clinica,
  onClinicaUpdated,
  onRequestDelete,
  deletePending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinica: Clinica;
  onClinicaUpdated: (updated: Clinica) => void;
  onRequestDelete: (c: Clinica) => void;
  deletePending: boolean;
}) {
  const s = useClinicDetailsState(clinica, onClinicaUpdated);

  const handleClose = async () => {
    if (s.editClinicName.trim() && s.hasUnsavedChanges) await s.handleSaveLegalDetails();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <ClinicDetailsDialogHeader clinica={clinica} />

        <div className="space-y-4 py-2">
          <ClinicAdminAccessSection
            clinica={clinica}
            resetTarget={s.resetTarget}
            setResetTarget={s.setResetTarget}
            newUserPassword={s.newUserPassword}
            setNewUserPassword={s.setNewUserPassword}
            isPending={s.resetPending}
            onResetPassword={s.handleResetUserPassword}
          />
          <ClinicLegalInfoSection
            editClinicName={s.editClinicName}
            setEditClinicName={s.setEditClinicName}
            editClinicRif={s.editClinicRif}
            setEditClinicRif={s.setEditClinicRif}
            editClinicPhone={s.editClinicPhone}
            setEditClinicPhone={s.setEditClinicPhone}
            editClinicEmail={s.editClinicEmail}
            setEditClinicEmail={s.setEditClinicEmail}
            editClinicType={s.editClinicType}
            setEditClinicType={s.setEditClinicType}
            editClinicAddress={s.editClinicAddress}
            setEditClinicAddress={s.setEditClinicAddress}
            editInternalNotes={s.editInternalNotes}
            setEditInternalNotes={s.setEditInternalNotes}
            hasUnsavedChanges={s.hasUnsavedChanges}
            isPending={s.updatePending}
            onSave={s.handleSaveLegalDetails}
          />
          <ClinicBillingSection
            clinica={clinica}
            editNextDueDate={s.editNextDueDate}
            setEditNextDueDate={s.setEditNextDueDate}
            showPaymentForm={s.showPaymentForm}
            setShowPaymentForm={s.setShowPaymentForm}
            paymentMethod={s.paymentMethod}
            setPaymentMethod={s.setPaymentMethod}
            paymentReference={s.paymentReference}
            setPaymentReference={s.setPaymentReference}
            isPending={s.updatePending}
            onRegisterPayment={s.handleRegisterMonthlyPayment}
          />
          <ClinicStaffCapacitySection
            clinica={clinica}
            clinicStaff={s.clinicStaff}
            loadingStaff={s.loadingStaff}
            removePending={s.removePending}
            onSelectResetTarget={s.setResetTarget}
            onRemoveStaff={s.handleRemoveStaff}
          />
          <ClinicPlanStatusControls
            plan={s.newPlan || clinica.plan_suscripcion}
            estado={clinica.estado}
            onChangePlan={s.handleChangePlan}
            onSetStatus={s.handleSetStatus}
          />
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 pt-2 border-t border-border/30">
          <Button
            type="button"
            variant="outline"
            onClick={() => onRequestDelete(clinica)}
            disabled={deletePending}
            className="w-full sm:w-auto text-xs gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar Clínica
          </Button>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {s.hasUnsavedChanges && (
              <Button variant="default" onClick={s.handleSaveLegalDetails} disabled={s.updatePending} className="w-full sm:w-auto text-xs gap-1.5">
                {s.updatePending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Guardar Cambios
              </Button>
            )}
            <Button variant={s.hasUnsavedChanges ? "outline" : "default"} onClick={handleClose} className="w-full sm:w-auto text-xs">
              Cerrar Expediente
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
