import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Loader2,
  CreditCard,
  Megaphone,
} from "lucide-react";
import {
  useGlobalAnnouncement,
  useUpdateGlobalAnnouncement,
} from "@/lib/api/superadmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SAAS_PLANS } from "@/lib/api/clinic";

interface SuperAdminStatsSummary {
  totalClinicas: number;
  clinicasActivas: number;
  clinicasDemo: number;
  totalMedicos: number;
  totalPacientes: number;
  mrrUsd: number;
}

export function SuperAdminGlobalConfigView({ stats }: { stats: SuperAdminStatsSummary }) {
  const { data: globalAnnouncement } = useGlobalAnnouncement();
  const key = globalAnnouncement?.updatedAt ?? "init";
  return (
    <SuperAdminGlobalConfigInner
      key={key}
      initialMessage={globalAnnouncement?.message || ""}
      initialType={globalAnnouncement?.type || "info"}
      initialActive={Boolean(globalAnnouncement?.active)}
      stats={stats}
    />
  );
}

function SuperAdminGlobalConfigInner({
  initialMessage,
  initialType,
  initialActive,
  stats,
}: {
  initialMessage: string;
  initialType: "info" | "warning" | "success";
  initialActive: boolean;
  stats: SuperAdminStatsSummary;
}) {
  const updateAnnouncementMutation = useUpdateGlobalAnnouncement();
  const [announcementMessage, setAnnouncementMessage] = useState(initialMessage);
  const [announcementType, setAnnouncementType] = useState<"info" | "warning" | "success">(initialType);
  const [announcementActive, setAnnouncementActive] = useState(initialActive);

  const handleSaveGlobalAnnouncement = async (activeOverride?: boolean) => {
    if (updateAnnouncementMutation.isPending) return;
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
          : "Anuncio global desactivado",
      );
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el anuncio global");
    }
  };

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
                  : "bg-muted text-muted-foreground",
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
              <Select value={announcementType} onValueChange={(v: any) => setAnnouncementType(v)}>
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
            <CardDescription>Métricas globales consolidadas de las organizaciones suscritas.</CardDescription>
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
              <span className="font-bold">{stats.totalPacientes}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Facturación Mensual Recurrente (MRR)</span>
              <span className="font-bold text-emerald-500">${stats.mrrUsd} USD / mes</span>
            </div>
          </CardContent>
        </Card>
      </div>

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
                      : "border-border/60 bg-muted/20",
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
