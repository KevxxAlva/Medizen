import { useState, useMemo } from "react";
import { HandCoins, Loader2 } from "lucide-react";
import { useSalesInvoices } from "./useSalesInvoices";
import { useAppointments } from "@/lib/api/appointments";
import { useDoctors } from "@/lib/api/profiles";
import { useUserRoleScope } from "@/hooks/useUserRoleScope";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { partitionInvoicesByDoctor } from "@/lib/utils/invoiceDoctorPartition";
import {
  buildDoctorSettlements,
  computeSettlementTotals,
  exportDoctorSettlementPdf,
  readDoctorCommissions,
  writeDoctorCommissions,
} from "./doctor-fees/doctorFeesHelpers";
import { DoctorFeesHeaderAndKpis } from "./doctor-fees/DoctorFeesHeaderAndKpis";
import { DoctorSettlementCard } from "./doctor-fees/DoctorSettlementCard";

export function DoctorFeesPage() {
  const { facturas, isLoading } = useSalesInvoices();
  const { data: appointments = [] } = useAppointments();
  const { data: doctors = [] } = useDoctors();
  const { isDoctorOnly, doctorId: currentDoctorId, isAdmin, canViewAllDoctors } =
    useUserRoleScope();
  const { rate } = useExchangeRate();

  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
  const [commissions, setCommissions] = useState<Record<string, number>>(() =>
    readDoctorCommissions(),
  );
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  const handleCommissionChange = (docId: string, rawVal: string) => {
    const num = Math.max(0, Math.min(100, Number(rawVal) || 0));
    const next = { ...commissions, [docId]: num };
    setCommissions(next);
    writeDoctorCommissions(next);
  };

  const invoiceToDoctorMap = useMemo(
    () => partitionInvoicesByDoctor({ invoices: facturas, appointments }),
    [facturas, appointments],
  );

  const visibleDoctors = useMemo(() => {
    if (isDoctorOnly) {
      return doctors.filter((d) => String(d.id) === String(currentDoctorId));
    }
    if (selectedDoctorId !== "all") {
      return doctors.filter((d) => String(d.id) === selectedDoctorId);
    }
    return doctors;
  }, [doctors, isDoctorOnly, currentDoctorId, selectedDoctorId]);

  const settlements = useMemo(
    () =>
      buildDoctorSettlements({
        visibleDoctors,
        facturas,
        invoiceToDoctorMap,
        selectedMonth,
        commissions,
      }),
    [visibleDoctors, facturas, invoiceToDoctorMap, selectedMonth, commissions],
  );

  const totals = useMemo(() => computeSettlementTotals(settlements), [settlements]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-card border border-border rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <HandCoins className="h-10 w-10 text-muted-foreground/50" />
        <h2 className="text-lg font-bold text-foreground">Acceso restringido a Administración</h2>
        <p className="text-xs text-muted-foreground max-w-md">
          El cálculo y liquidación de honorarios médicos es gestionado exclusivamente por la
          Administración de la clínica.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] flex flex-col gap-6">
      <DoctorFeesHeaderAndKpis
        isDoctorOnly={isDoctorOnly}
        canViewAllDoctors={canViewAllDoctors}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedDoctorId={selectedDoctorId}
        onDoctorChange={setSelectedDoctorId}
        doctors={doctors}
        totals={totals}
        rate={rate}
      />

      <div className="flex flex-col gap-4">
        {settlements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
            No se encontraron especialistas registrados.
          </div>
        ) : (
          settlements.map((s) => {
            const docKey = String(s.doctor.id);
            return (
              <DoctorSettlementCard
                key={docKey}
                settlement={s}
                isAdmin={isAdmin}
                isExpanded={expandedDocId === docKey}
                onToggleExpand={() =>
                  setExpandedDocId(expandedDocId === docKey ? null : docKey)
                }
                onCommissionChange={(rawVal) => handleCommissionChange(docKey, rawVal)}
                onExportPdf={() => exportDoctorSettlementPdf(s, selectedMonth, rate)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
