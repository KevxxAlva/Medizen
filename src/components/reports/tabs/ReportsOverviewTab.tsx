import { CalendarClock, Stethoscope, Download } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { APP_TIME_ZONE } from "@/lib/constants/locale";
import { formatBs } from "@/hooks/useExchangeRate";

export interface DoctorStatItem {
  id: string;
  name: string;
  completedCount: number;
  totalCount: number;
  revenueUsd: number;
}

export interface ReportsOverviewTabProps {
  upcoming: Array<{
    id: string;
    scheduled_at: string;
    patient_name?: string;
    doctor_id?: string;
    reason?: string | null;
  }>;
  doctorStats: DoctorStatItem[];
  doctorMap: Map<string, string>;
  rate: number;
  onExportAppointmentsPdf: () => void;
}

export function ReportsOverviewTab({
  upcoming,
  doctorStats,
  doctorMap,
  rate,
  onExportAppointmentsPdf,
}: ReportsOverviewTabProps) {
  return (
    <TabsContent value="overview" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-0 outline-none">
      {/* Productividad por Especialista */}
      <div className="lg:col-span-1 bg-card border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Rendimiento Médico
              </p>
              <h3 className="mt-0.5 text-base font-bold flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" /> Consultas por Especialista
              </h3>
            </div>
          </div>

          {doctorStats.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">
              No hay consultas registradas en este rango.
            </p>
          ) : (
            <div className="space-y-3 mt-2">
              {doctorStats.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{doc.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {doc.completedCount} completadas de {doc.totalCount} citas
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      ${doc.revenueUsd.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatBs(doc.revenueUsd, rate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onExportAppointmentsPdf}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Descargar Libro de Citas PDF
        </button>
      </div>

      {/* Próximas Citas */}
      <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Planificación Operativa
            </p>
            <h3 className="mt-0.5 text-base font-bold flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" /> Próximas citas programadas (
              {upcoming.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm min-w-[540px]">
            <thead className="bg-muted/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Fecha / Hora</th>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Especialista</th>
                <th className="px-4 py-3">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {upcoming.slice(0, 10).map((a) => {
                const dt = new Date(a.scheduled_at);
                const pad = (n: number) => String(n).padStart(2, "0");
                return (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                      {dt.toLocaleDateString("es-ES", {
                        timeZone: APP_TIME_ZONE,
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      · {pad(dt.getHours())}:{pad(dt.getMinutes())}
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">{a.patient_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {(a.doctor_id && doctorMap.get(a.doctor_id)) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {a.reason ?? "Consulta"}
                    </td>
                  </tr>
                );
              })}
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No hay citas próximas programadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </TabsContent>
  );
}
