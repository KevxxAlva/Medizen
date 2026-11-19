import { ReceiptText, Calculator, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SalesFilterPopover } from "./SalesFilterPopover";

export interface SalesSecondaryToolbarProps {
  totalCount: number;
  filterMonth: string;
  setFilterMonth: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterMethod: string;
  setFilterMethod: (val: string) => void;
  onResetFilters: () => void;
  onOpenCashClose: () => void;
  onDownloadMonthlyReport: () => void;
}

export function SalesSecondaryToolbar({
  totalCount,
  filterMonth,
  setFilterMonth,
  filterStatus,
  setFilterStatus,
  filterMethod,
  setFilterMethod,
  onResetFilters,
  onOpenCashClose,
  onDownloadMonthlyReport,
}: SalesSecondaryToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border pb-4 mt-2">
      <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted-foreground">
        <ReceiptText className="h-4 w-4 shrink-0" /> {totalCount} facturas registradas
        {filterStatus !== "all" && (
          <span className="ml-1 text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase">
            Filtro: {filterStatus}
          </span>
        )}
        {filterMethod !== "all" && (
          <span className="ml-1 text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
            Método: {filterMethod}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
        <SalesFilterPopover
          filterMonth={filterMonth}
          setFilterMonth={setFilterMonth}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterMethod={filterMethod}
          setFilterMethod={setFilterMethod}
          onReset={onResetFilters}
        />

        <Button
          type="button"
          variant="outline"
          onClick={onOpenCashClose}
          className="flex items-center gap-1.5 text-xs font-bold text-foreground rounded-xl border-border bg-card hover:bg-muted cursor-pointer"
        >
          <Calculator className="h-3.5 w-3.5 text-primary" />
          Cierre de Caja (Reporte Z)
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onDownloadMonthlyReport}
          className="flex items-center gap-1.5 text-xs font-bold text-foreground rounded-xl border-border bg-card hover:bg-muted cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Reporte Mensual
        </Button>
      </div>
    </div>
  );
}

export default SalesSecondaryToolbar;
