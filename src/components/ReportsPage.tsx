import { useMemo, useState } from "react";
import { FileBarChart, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePatientsCountByDateRange } from "@/lib/api/patients";
import { useAppointments } from "@/lib/api/appointments";
import { useDoctors } from "@/lib/api/profiles";
import { useConsultations } from "@/lib/api/consultations";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useSalesInvoices } from "@/components/finance/useSalesInvoices";
import { CashCloseDialog } from "@/components/finance/CashCloseDialog";
import { ReportsDateFilterBar } from "./reports/ReportsDateFilterBar";
import { ReportsExportHub } from "./reports/ReportsExportHub";
import { ReportsKpiGrid } from "./reports/ReportsKpiGrid";
import { ReportsOverviewTab, type DoctorStatItem } from "./reports/tabs/ReportsOverviewTab";
import { ReportsFinancialTab } from "./reports/tabs/ReportsFinancialTab";
import { ReportsMarketingTab } from "./reports/tabs/ReportsMarketingTab";
import {
  generateExecutiveReport,
  exportSalesReportByRange,
  exportAppointmentsReportByRange,
  exportPatientsReportByRange,
  exportAppointmentsCsv,
} from "@/lib/utils/generateExecutiveReport";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function ReportsPage() {
  const [from, setFrom] = useState(() => daysAgoISO(30));
  const [to, setTo] = useState(() => todayISO());
  const [selectedDoctorId, setSelectedDoctorId] = useState("all");
  const [cashCloseOpen, setCashCloseOpen] = useState(false);

  const { rate, rates, isSyncing, syncWithBcv } = useExchangeRate();
  const { facturas = [] } = useSalesInvoices();
  const { data: newPatientsCount = 0 } = usePatientsCountByDateRange(from, to);
  const { data: appointments = [] } = useAppointments({ from, to });
  const { data: doctors = [] } = useDoctors();
  const { data: consultations = [] } = useConsultations({ from, to });

  const today = todayISO();
  const { data: upcomingAppointments = [] } = useAppointments({
    from: today,
    status: "programada",
    limit: 15,
  });

  const doctorMap = useMemo(
    () => new Map(doctors.map((d) => [d.id, d.full_name || d.email || "Especialista"])),
    [doctors]
  );

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const d = a.scheduled_at.slice(0, 10);
      const inRange = d >= from && d <= to;
      if (!inRange) return false;
      if (selectedDoctorId !== "all" && a.doctor_id !== selectedDoctorId) return false;
      return true;
    });
  }, [appointments, from, to, selectedDoctorId]);

  const stats = useMemo(() => {
    const completed = filtered.filter((a) => a.status === "completada");
    const scheduled = filtered.filter((a) => a.status === "programada");
    const cancelled = filtered.filter((a) => a.status === "cancelada");
    const income = completed.reduce((acc, a) => acc + (Number(a.price) || 0), 0);
    return {
      total: filtered.length,
      completed: completed.length,
      scheduled: scheduled.length,
      cancelled: cancelled.length,
      income,
      newPatients: newPatientsCount,
    };
  }, [filtered, newPatientsCount]);

  const doctorStats = useMemo<DoctorStatItem[]>(() => {
    const byDoc = new Map<string, DoctorStatItem>();
    filtered.forEach((a) => {
      const docId = a.doctor_id || "unassigned";
      const docName = doctorMap.get(docId) || "Dr(a). General";
      const current = byDoc.get(docId) || {
        id: docId,
        name: docName,
        completedCount: 0,
        totalCount: 0,
        revenueUsd: 0,
      };
      current.totalCount += 1;
      if (a.status === "completada") {
        current.completedCount += 1;
        current.revenueUsd += Number(a.price) || 0;
      }
      byDoc.set(docId, current);
    });
    return Array.from(byDoc.values()).sort((a, b) => b.revenueUsd - a.revenueUsd);
  }, [filtered, doctorMap]);

  const upcoming = useMemo(() => {
    return upcomingAppointments.slice().sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [upcomingAppointments]);

  const monthlyData = useMemo(() => {
    const completed = appointments.filter((a) => a.status === "completada" && a.price);
    const groups: Record<string, number> = {};
    completed.forEach((a) => {
      const date = new Date(a.scheduled_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      groups[key] = (groups[key] || 0) + (Number(a.price) || 0);
    });
    return Object.entries(groups)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [appointments]);

  const maxAmount = useMemo(() => {
    return Math.max(...monthlyData.map((d) => d.amount), 1);
  }, [monthlyData]);

  const marketingData = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalConsultations = 0;
    consultations.forEach((c) => {
      if (c.contact_channel) {
        counts[c.contact_channel] = (counts[c.contact_channel] || 0) + 1;
        totalConsultations++;
      }
    });
    return Object.entries(counts)
      .map(([channel, count]) => ({
        channel,
        count,
        percentage:
          totalConsultations > 0 ? ((count / totalConsultations) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.count - a.count);
  }, [consultations]);

  const handleExportExecutive = () =>
    generateExecutiveReport({ from, to, rate, stats, marketingData, monthlyData });

  const handleExportSales = () => exportSalesReportByRange(from, to, rate);
  const handleExportAppointments = () => exportAppointmentsReportByRange(from, to);
  const handleExportPatients = () => exportPatientsReportByRange(from, to);
  const handleExportCsv = () => exportAppointmentsCsv(filtered, doctorMap, from, to, rate);

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[240px]">
          <p className="text-[11px] font-extrabold text-primary uppercase tracking-wider mb-1">
            Inteligencia Clínica y Auditoría
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <FileBarChart className="h-7 w-7 text-primary shrink-0" />
            Centro de Reportes y Analítica
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => syncWithBcv(false)}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-border bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Sincronizar tasa oficial BCV"
          >
            <span>Tasa BCV:</span>
            <strong className="text-foreground">Bs. {rate.toFixed(2)}</strong>
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
          </button>

          <Button
            onClick={handleExportExecutive}
            className="rounded-2xl bg-primary text-primary-foreground hover:opacity-95 font-bold cursor-pointer shadow-xs"
          >
            <Download className="mr-1.5 h-4 w-4" /> Exportar Reporte Ejecutivo
          </Button>
        </div>
      </header>

      <ReportsDateFilterBar
        from={from}
        to={to}
        selectedDoctorId={selectedDoctorId}
        doctors={doctors}
        onChangeRange={(nextFrom, nextTo) => {
          setFrom(nextFrom);
          setTo(nextTo);
        }}
        onChangeDoctor={setSelectedDoctorId}
      />

      <ReportsExportHub
        from={from}
        to={to}
        onExportExecutive={handleExportExecutive}
        onExportSales={handleExportSales}
        onExportAppointments={handleExportAppointments}
        onExportPatients={handleExportPatients}
        onOpenCashClose={() => setCashCloseOpen(true)}
        onExportCsv={handleExportCsv}
      />

      <ReportsKpiGrid stats={stats} rate={rate} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1.5 rounded-2xl">
          <TabsTrigger value="overview" className="rounded-xl font-bold text-xs">
            Operaciones y Médicos
          </TabsTrigger>
          <TabsTrigger value="financial" className="rounded-xl font-bold text-xs">
            Ventas y Evolución BCV
          </TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-xl font-bold text-xs">
            Marketing y Captación
          </TabsTrigger>
        </TabsList>

        <ReportsOverviewTab
          upcoming={upcoming}
          doctorStats={doctorStats}
          doctorMap={doctorMap}
          rate={rate}
          onExportAppointmentsPdf={handleExportAppointments}
        />
        <ReportsFinancialTab
          monthlyData={monthlyData}
          maxAmount={maxAmount}
          rate={rate}
          onExportSalesPdf={handleExportSales}
        />
        <ReportsMarketingTab
          marketingData={marketingData}
          onExportPatientsPdf={handleExportPatients}
        />
      </Tabs>

      <CashCloseDialog
        open={cashCloseOpen}
        onOpenChange={setCashCloseOpen}
        invoices={facturas as any}
        rate={rate}
        rates={rates}
      />
    </div>
  );
}
