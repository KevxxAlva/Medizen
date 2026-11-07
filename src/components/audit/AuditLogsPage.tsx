import { useState, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  Download,
  Activity,
  Trash2,
  Edit3,
  PlusCircle,
  UserCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuditLogs, type AuditLog } from "@/lib/api/audit";
import { useUserRoleScope } from "@/hooks/useUserRoleScope";
import { getClinicPdfConfig, drawPdfHeader, drawPdfFooter } from "@/lib/utils/pdfConfig";
import { toast } from "sonner";

const auditDateTimeFormatter = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatAuditDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : auditDateTimeFormatter.format(d);
}

function getActionMeta(action: string) {
  const upper = (action || "").toUpperCase();
  if (upper === "DELETE") {
    return {
      label: "Eliminación",
      badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      icon: Trash2,
    };
  }
  if (upper === "CREATE") {
    return {
      label: "Creación",
      badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      icon: PlusCircle,
    };
  }
  if (upper === "STAGE_CHANGE") {
    return {
      label: "Flujo Sala",
      badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      icon: UserCheck,
    };
  }
  return {
    label: "Actualización",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: Edit3,
  };
}

function getEntityLabel(entity: string) {
  const map: Record<string, string> = {
    INVOICE: "Facturación / Ventas",
    APPOINTMENT: "Agenda de Citas",
    PATIENT: "Pacientes",
    WAITING_ROOM: "Sala de Espera",
    MEDICATION: "Vademécum",
    CONSULTATION: "Consulta Clínica",
  };
  return map[(entity || "").toUpperCase()] || entity || "Sistema";
}

function summarizeDetails(log: AuditLog): string {
  const d = log.details;
  if (!d) return `Registro #${log.entity_id || "—"}`;
  if (typeof d === "string") return d;
  if (d.message) return String(d.message);
  const parts: string[] = [];
  if (d.estado_pago) parts.push(`Estado: ${d.estado_pago}`);
  if (d.metodo_pago) parts.push(`Método: ${d.metodo_pago}`);
  if (d.monto_usd) parts.push(`Monto: $${Number(d.monto_usd).toFixed(2)}`);
  if (d.referencia) parts.push(`Ref: ${d.referencia}`);
  if (parts.length > 0) return parts.join(" • ");
  return JSON.stringify(d);
}

async function exportAuditLogsPdf(logs: AuditLog[]) {
  try {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const config = await getClinicPdfConfig();

    drawPdfHeader(doc, config, pageWidth);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("REPORTE DE AUDITORÍA Y TRAZABILIDAD DEL SISTEMA", pageWidth / 2, 175, {
      align: "center",
    });

    const rows = logs.slice(0, 80).map((l) => [
      formatAuditDate(l.created_at),
      l.perfiles?.full_name || l.perfiles?.email || "Usuario Autenticado",
      getActionMeta(l.action_type).label,
      getEntityLabel(l.entity_type),
      summarizeDetails(l),
    ]);

    autoTable(doc, {
      startY: 195,
      head: [["Fecha y Hora", "Usuario Responsable", "Acción", "Módulo", "Detalle Auditado"]],
      body: rows.length > 0 ? rows : [["—", "—", "—", "—", "Sin eventos registrados"]],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
      margin: { left: 36, right: 36 },
    });

    drawPdfFooter(doc, config, pageWidth, pageHeight);
    doc.save(`Bitacora_Auditoria_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("Bitácora de auditoría exportada en PDF");
  } catch {
    toast.error("Error al exportar la bitácora en PDF");
  }
}

export function AuditLogsPage() {
  const { isAdmin, isLoading: roleLoading } = useUserRoleScope();
  const { data: logs = [], isLoading } = useAuditLogs(250);
  const [searchQ, setSearchQ] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const filteredLogs = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return logs
      .filter((log) => {
        if (actionFilter !== "all" && (log.action_type || "").toUpperCase() !== actionFilter) {
          return false;
        }
        if (entityFilter !== "all" && (log.entity_type || "").toUpperCase() !== entityFilter) {
          return false;
        }
        if (!q) return true;
        const haystack = [
          log.perfiles?.full_name || "",
          log.perfiles?.email || "",
          summarizeDetails(log),
          getEntityLabel(log.entity_type),
          log.entity_id || "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .map((log) => ({
        log,
        formattedDate: formatAuditDate(log.created_at),
        meta: getActionMeta(log.action_type),
        entityLabel: getEntityLabel(log.entity_type),
        summary: summarizeDetails(log),
      }));
  }, [logs, actionFilter, entityFilter, searchQ]);

  const stats = useMemo(() => {
    const deletes = logs.filter((l) => (l.action_type || "").toUpperCase() === "DELETE").length;
    const financial = logs.filter((l) => (l.entity_type || "").toUpperCase() === "INVOICE").length;
    const uniqueUsers = new Set(logs.map((l) => l.user_id).filter(Boolean)).size;
    return { total: logs.length, deletes, financial, uniqueUsers };
  }, [logs]);

  if (isLoading || roleLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-card border border-border rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <ShieldCheck className="h-10 w-10 text-muted-foreground/50" />
        <h2 className="text-lg font-bold text-foreground">Acceso restringido a Administración</h2>
        <p className="text-xs text-muted-foreground max-w-md">
          La bitácora de auditoría y seguridad del sistema está reservada para cuentas de Administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
            Seguridad Clínica y Control Interno
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mt-0.5">
            Bitácora de Auditoría y Trazabilidad
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro inmutable de cobros, modificaciones, movimientos en sala de espera y eliminaciones críticas
          </p>
        </div>

        <Button
          onClick={() => exportAuditLogsPdf(filteredLogs.map((r) => r.log))}
          className="h-9 rounded-xl text-xs font-bold gap-1.5"
        >
          <Download className="h-4 w-4" />
          Exportar Bitácora PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-border bg-muted/25 p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Eventos Registrados
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{stats.total}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Operaciones Financieras
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{stats.financial}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Eliminaciones Auditadas
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{stats.deletes}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Trash2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/25 p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Usuarios Activos
            </p>
            <p className="text-2xl font-extrabold text-foreground mt-0.5">{stats.uniqueUsers}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
          <Input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Filtrar por usuario, factura, paciente o detalle…"
            className="h-9 pl-9 rounded-xl text-xs"
          />
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px] h-9 rounded-xl text-xs font-semibold">
            <SelectValue placeholder="Tipo de acción" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Todas las acciones</SelectItem>
            <SelectItem value="CREATE">Creación</SelectItem>
            <SelectItem value="UPDATE">Actualización / Cobro</SelectItem>
            <SelectItem value="STAGE_CHANGE">Flujo Sala de Espera</SelectItem>
            <SelectItem value="DELETE">Eliminación</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[190px] h-9 rounded-xl text-xs font-semibold">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Todos los módulos</SelectItem>
            <SelectItem value="INVOICE">Facturación / Ventas</SelectItem>
            <SelectItem value="APPOINTMENT">Agenda de Citas</SelectItem>
            <SelectItem value="PATIENT">Pacientes</SelectItem>
            <SelectItem value="WAITING_ROOM">Sala de Espera</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden flex-1">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No se encontraron registros de auditoría para los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider font-extrabold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Módulo</th>
                  <th className="py-3 px-4">Detalle de la Operación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLogs.map(({ log, formattedDate, meta, entityLabel, summary }) => {
                  const Icon = meta.icon;
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                        {formattedDate}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-foreground">
                          {log.perfiles?.full_name || "Usuario del Sistema"}
                        </p>
                        {log.perfiles?.email && (
                          <p className="text-[10px] text-muted-foreground">{log.perfiles.email}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase",
                            meta.badgeClass,
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground/90">{entityLabel}</td>
                      <td className="py-3 px-4 text-muted-foreground max-w-md">{summary}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
