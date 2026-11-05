import { TrendingUp, DollarSign, Download } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { formatBs } from "@/hooks/useExchangeRate";

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export interface ReportsFinancialTabProps {
  monthlyData: Array<{ month: string; amount: number }>;
  maxAmount: number;
  rate: number;
  onExportSalesPdf: () => void;
}

export function ReportsFinancialTab({
  monthlyData,
  maxAmount,
  rate,
  onExportSalesPdf,
}: ReportsFinancialTabProps) {
  return (
    <TabsContent
      value="financial"
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-0 outline-none"
    >
      <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Histórico de Ingresos
            </p>
            <h3 className="mt-0.5 text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Evolución de Facturación (Últimos 12
              meses)
            </h3>
          </div>
          <button
            type="button"
            onClick={onExportSalesPdf}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar Ventas PDF
          </button>
        </div>

        {monthlyData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-20">
            No hay transacciones registradas en los últimos meses.
          </p>
        ) : (
          <div className="flex h-60 items-end gap-3 pt-8 border-b border-border/60 mt-4 px-2">
            {monthlyData.map((d) => {
              const pct = Math.max((d.amount / maxAmount) * 100, 6);
              const [yr, mn] = d.month.split("-");
              const label = `${(MONTHS_ES[parseInt(mn, 10) - 1] || mn).slice(0, 3)} '${yr.slice(2)}`;
              return (
                <div
                  key={d.month}
                  className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
                >
                  <div className="text-[10px] font-extrabold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${d.amount.toLocaleString("es-VE")}
                  </div>
                  <div
                    style={{ height: `${pct}%` }}
                    className="w-full max-w-[44px] bg-gradient-to-t from-primary to-primary/75 rounded-t-xl transition-all duration-300 group-hover:brightness-110 shadow-xs"
                  />
                  <div className="text-[10px] text-muted-foreground font-bold truncate w-full text-center pb-1">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="lg:col-span-1 bg-card border border-border rounded-3xl p-6 shadow-xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary mb-4 flex items-center gap-1.5">
          <DollarSign className="h-4 w-4" /> Desglose Mensual Multimoneda
        </h3>
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 text-left font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3.5 py-2.5">Mes / Año</th>
                <th className="px-3.5 py-2.5 text-right">USD ($)</th>
                <th className="px-3.5 py-2.5 text-right">Ref. BCV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {monthlyData
                .slice()
                .reverse()
                .map((d) => {
                  const [yr, mn] = d.month.split("-");
                  return (
                    <tr key={d.month} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3.5 py-2.5 font-semibold text-foreground">
                        {MONTHS_ES[parseInt(mn, 10) - 1] || mn} {yr}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                        ${d.amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-medium text-muted-foreground">
                        {formatBs(d.amount, rate)}
                      </td>
                    </tr>
                  );
                })}
              {monthlyData.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    Sin movimientos registrados.
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
