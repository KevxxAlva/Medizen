import { useState, useMemo } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { generateSalesReport } from "@/lib/utils/generateSalesReport";
import { toast } from "sonner";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePaymentMethods } from "@/lib/api/paymentMethods";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useUserRoleScope } from "@/hooks/useUserRoleScope";
import { useAppointments } from "@/lib/api/appointments";
import { getInvoicesForDoctor } from "@/lib/utils/invoiceDoctorPartition";
import { ExchangeRateToolbarPill } from "./ExchangeRateToolbarPill";
import { ViewInvoiceDialog, type Invoice } from "./ViewInvoiceDialog";
import { ConfirmPaymentDialog } from "./ConfirmPaymentDialog";
import { CashCloseDialog } from "./CashCloseDialog";
import { SalesInvoiceTable } from "./SalesInvoiceTable";
import { SalesKpiCards } from "./SalesKpiCards";
import { SalesSecondaryToolbar } from "./SalesSecondaryToolbar";
import { FinancePageHeader } from "./FinancePageHeader";
import {
  useSalesInvoices,
  useSalesFilteredStats,
  type InvoiceSortField,
  type SortDirection,
} from "./useSalesInvoices";

export type { Invoice };

export function SalesPage() {
  const [q, setQ] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [sortField, setSortField] = useState<InvoiceSortField>("id_factura");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [cashCloseOpen, setCashCloseOpen] = useState(false);

  const {
    rate,
    rates,
    activeType,
    setActiveType,
    updatedAt,
    isManual,
    isSyncing,
    updateRates,
    syncWithBcv,
  } = useExchangeRate();

  const { data: methods = [] } = usePaymentMethods();
  const { facturas, isLoading, updatePaymentStatus, deleteInvoice } = useSalesInvoices();
  const { isDoctorOnly, doctorId: currentDoctorId } = useUserRoleScope();

  const { data: allAppointments = [] } = useAppointments();

  const scopedFacturas = useMemo(() => {
    if (!isDoctorOnly) return facturas;
    if (!currentDoctorId || allAppointments.length === 0) return [];
    return getInvoicesForDoctor(facturas, allAppointments, currentDoctorId);
  }, [facturas, isDoctorOnly, allAppointments, currentDoctorId]);

  const handleSort = (field: InvoiceSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "id_factura" || field === "fecha_emision" ? "desc" : "asc");
    }
    setCurrentPage(1);
  };

  const { filtered, kpiStats } = useSalesFilteredStats({
    facturas: scopedFacturas,
    q,
    filterMonth,
    filterStatus,
    filterMethod,
    sortField,
    sortDirection,
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownloadMonthlyReport = async () => {
    const reportMonth = filterMonth || new Date().toISOString().slice(0, 7);
    const monthInvoices = facturas.filter((f) => f.fecha_emision.startsWith(reportMonth));
    if (monthInvoices.length === 0) {
      toast.error(`No hay facturas registradas en el mes ${reportMonth}`);
      return;
    }
    try {
      await generateSalesReport(monthInvoices, reportMonth, rate);
      toast.success("Reporte mensual descargado exitosamente");
    } catch {
      toast.error("Error al generar el reporte PDF");
    }
  };

  const handleOpenConfirm = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentMethod(invoice.metodo_pago || "");
    setPaymentReference(invoice.referencia || "");
    setConfirmOpen(true);
  };

  const handleOpenView = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setViewOpen(true);
  };

  const handleDeleteInvoice = async (id: number) => {
    if (
      window.confirm(
        `¿Estás segura de que deseas eliminar la factura INV-${id.toString().padStart(4, "0")}?`
      )
    ) {
      deleteInvoice.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-3.5 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] font-sans flex flex-col w-full min-w-0 overflow-hidden">
      <FinancePageHeader
        title="Ventas y Facturación"
        subtitle="Control multimoneda en USD ($), Bolívares (BCV), Euros (€) y USDT"
      >
        <div className="flex-1 max-w-md mx-auto w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-full bg-muted border border-border px-4 py-2 w-full">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por paciente o N° Factura (ej: 0001)…"
              aria-label="Buscar por paciente o N° Factura"
              className="w-full bg-transparent text-sm focus-visible:outline-none rounded-lg px-1 placeholder:text-muted-foreground text-foreground"
            />
            {q && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  setQ("");
                  setCurrentPage(1);
                }}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <ExchangeRateToolbarPill
          rate={rate}
          rates={rates}
          activeType={activeType}
          onSelectType={setActiveType}
          updatedAt={updatedAt}
          isManual={isManual}
          isSyncing={isSyncing}
          onUpdateRates={updateRates}
          onSync={() => syncWithBcv(false)}
        />
      </FinancePageHeader>

      <SalesKpiCards
        kpiStats={kpiStats}
        rate={rate}
        rates={rates}
        activeType={activeType}
        filterStatus={filterStatus}
        onSelectStatus={(st) => {
          setFilterStatus((prev) => (prev === st ? "all" : st));
          setCurrentPage(1);
        }}
      />

      <SalesSecondaryToolbar
        totalCount={filtered.length}
        filterMonth={filterMonth}
        setFilterMonth={(val) => {
          setFilterMonth(val);
          setCurrentPage(1);
        }}
        filterStatus={filterStatus}
        setFilterStatus={(val) => {
          setFilterStatus(val);
          setCurrentPage(1);
        }}
        filterMethod={filterMethod}
        setFilterMethod={(val) => {
          setFilterMethod(val);
          setCurrentPage(1);
        }}
        onResetFilters={() => {
          setFilterMonth("");
          setFilterStatus("all");
          setFilterMethod("all");
          setCurrentPage(1);
        }}
        onOpenCashClose={() => setCashCloseOpen(true)}
        onDownloadMonthlyReport={handleDownloadMonthlyReport}
      />

      <SalesInvoiceTable
        paginated={paginated}
        rate={rate}
        rates={rates}
        activeType={activeType}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onView={handleOpenView}
        onConfirm={handleOpenConfirm}
        onDelete={handleDeleteInvoice}
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        entityLabel="facturas"
        onPageChange={setCurrentPage}
      />

      <ViewInvoiceDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        invoice={viewingInvoice}
        rate={rate}
        rates={rates}
        onConfirmPayment={(inv) => {
          setViewOpen(false);
          handleOpenConfirm(inv);
        }}
      />

      <ConfirmPaymentDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        invoice={selectedInvoice}
        rates={rates}
        defaultRateType={activeType}
        methods={methods}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentReference={paymentReference}
        setPaymentReference={setPaymentReference}
        isPending={updatePaymentStatus.isPending}
        onConfirm={(composedRef, activeRateVal, rateType, finalMethod, creditedUsd) => {
          if (!selectedInvoice) return;
          updatePaymentStatus.mutate({
            id: selectedInvoice.id_factura,
            status: "Pagado",
            method: finalMethod || paymentMethod || "Pago Móvil",
            reference: composedRef,
            usedRate: activeRateVal,
            usedRateType: rateType,
            usdAmount: creditedUsd || selectedInvoice.total_general,
          }, {
            onSuccess: () => {
              setConfirmOpen(false);
              setSelectedInvoice(null);
            }
          });
        }}
      />

      <CashCloseDialog
        open={cashCloseOpen}
        onOpenChange={setCashCloseOpen}
        invoices={facturas}
        rate={rate}
        rates={rates}
      />
    </div>
  );
}

export default SalesPage;
