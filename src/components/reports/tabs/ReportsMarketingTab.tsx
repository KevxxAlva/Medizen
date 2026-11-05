import { Megaphone, Users, Download } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface ReportsMarketingTabProps {
  marketingData: Array<{
    channel: string;
    count: number;
    percentage: string;
  }>;
  onExportPatientsPdf: () => void;
}

export function ReportsMarketingTab({
  marketingData,
  onExportPatientsPdf,
}: ReportsMarketingTabProps) {
  return (
    <TabsContent
      value="marketing"
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-0 outline-none"
    >
      <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Estrategia y Crecimiento
            </p>
            <h3 className="mt-0.5 text-base font-bold flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" /> Canales de Captación de Pacientes
            </h3>
          </div>
          <button
            type="button"
            onClick={onExportPatientsPdf}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar Padrón Pacientes PDF
          </button>
        </div>

        <div className="space-y-4 mt-6">
          {marketingData.map((d, idx) => {
            const colors = [
              "bg-primary",
              "bg-emerald-500",
              "bg-blue-500",
              "bg-violet-500",
              "bg-amber-500",
            ];
            const colorClass = colors[idx % colors.length];
            return (
              <div key={d.channel} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-foreground">{d.channel}</span>
                  <span className="text-muted-foreground">
                    {d.count} consultas (<strong className="text-primary">{d.percentage}%</strong>)
                  </span>
                </div>
                <div className="w-full bg-muted/60 h-3 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${d.percentage}%` }}
                    className={cn(
                      "h-full rounded-full transition-[width] duration-500",
                      colorClass
                    )}
                  />
                </div>
              </div>
            );
          })}
          {marketingData.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-14">
              No hay datos de canales de captación en este período. Al completar una consulta,
              puedes registrar cómo nos conoció el paciente.
            </p>
          )}
        </div>
      </div>

      <div className="lg:col-span-1 bg-card border border-border rounded-3xl p-6 shadow-xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary mb-4 flex items-center gap-1.5">
          <Users className="h-4 w-4" /> Tabla de Impacto por Canal
        </h3>
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 text-left font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3.5 py-2.5">Canal</th>
                <th className="px-3.5 py-2.5 text-center">Consultas</th>
                <th className="px-3.5 py-2.5 text-right">Impacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {marketingData.map((d) => (
                <tr key={d.channel} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3.5 py-2.5 font-semibold text-foreground">{d.channel}</td>
                  <td className="px-3.5 py-2.5 text-center font-bold">{d.count}</td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-primary">
                    {d.percentage}%
                  </td>
                </tr>
              ))}
              {marketingData.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    Sin datos de marketing.
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
