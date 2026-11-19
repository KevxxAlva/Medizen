import React, { useState, useMemo, useEffect } from "react";
import {
  useAppointments,
  useUpdateAppointment,
  type AppointmentWithPatient,
} from "@/lib/api/appointments";
import { useDoctors } from "@/lib/api/doctors";
import { useClinicInfo } from "@/lib/api/clinic";
import { useAuthSession } from "@/hooks/useAuth";
import { useMyProfile } from "@/lib/api/profiles";
import { toast } from "sonner";
import {
  exportInvoicePDF,
  exportMonthlyReportPDF,
} from "@/lib/utils/facturacionPdf";
import {
  FacturacionHeader,
  FacturacionFilterBar,
  FacturacionTable,
  EditPaymentDialog,
} from "./facturacion/FacturacionComponents";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function FacturacionPage() {
  const { data: appointments = [], isLoading } = useAppointments({ includeInvoices: true });
  const updateAppointment = useUpdateAppointment();
  const { data: doctors = [] } = useDoctors();
  const { data: clinic } = useClinicInfo();
  const { user: me } = useAuthSession();
  const { data: myProfile } = useMyProfile(me?.id);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [doctorFilter, setDoctorFilter] = useState("todos");
  const [monthFilter, setMonthFilter] = useState("todos");
  const [editOpen, setEditOpen] = useState(false);
  const [isConfirmMode, setIsConfirmMode] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppointmentWithPatient | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [newStatus, setNewStatus] = useState("completada");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [newPaymentReference, setNewPaymentReference] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [q, statusFilter, doctorFilter, monthFilter]);

  const doctorMap = useMemo(
    () => new Map(doctors.map((d) => [d.id, d.full_name || d.email])),
    [doctors],
  );

  const monthOptions = useMemo(() => {
    const map = new Map<string, string>();
    appointments.forEach((a) => {
      if (!a.scheduled_at) return;
      const d = new Date(a.scheduled_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
      map.set(key, label);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, label]) => ({ key, label }));
  }, [appointments]);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (q) {
        const query = q.toLowerCase();
        const patientMatch = (a.patient_name || "").toLowerCase().includes(query);
        const reasonMatch = (a.reason || "").toLowerCase().includes(query);
        if (!patientMatch && !reasonMatch) return false;
      }
      if (statusFilter !== "todas" && a.status !== statusFilter) return false;
      if (doctorFilter !== "todos" && a.doctor_id !== doctorFilter) return false;
      if (monthFilter !== "todos") {
        const d = new Date(a.scheduled_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (key !== monthFilter) return false;
      }
      return true;
    });
  }, [appointments, q, statusFilter, doctorFilter, monthFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const metrics = useMemo(() => {
    let totalEarnings = 0;
    let pendingEarnings = 0;
    let completedCount = 0;
    let pendingCount = 0;

    filtered.forEach((a) => {
      const price = Number(a.price) || 0;
      if (a.status === "completada") {
        totalEarnings += price;
        completedCount++;
      } else if (a.status === "programada") {
        pendingEarnings += price;
        pendingCount++;
      }
    });

    return { totalEarnings, pendingEarnings, completedCount, pendingCount };
  }, [filtered]);

  const handleEditOpen = (app: AppointmentWithPatient, confirmMode = false) => {
    setSelectedApp(app);
    setIsConfirmMode(confirmMode);
    setNewPrice(String(app.price || 0));
    setNewStatus(confirmMode ? "completada" : app.status || "programada");
    setNewPaymentMethod(app.payment_method || (confirmMode ? "Efectivo" : ""));
    setNewPaymentReference(app.payment_reference || "");
    setEditOpen(true);
  };

  const handleSavePrice = async () => {
    if (!selectedApp) return;
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("Por favor ingresa un precio válido");
      return;
    }

    try {
      await updateAppointment.mutateAsync({
        id: selectedApp.id,
        price: priceNum,
        status: newStatus as any,
        payment_method: newStatus === "completada" ? newPaymentMethod || "Efectivo" : null,
        payment_reference: newStatus === "completada" ? newPaymentReference : null,
      });
      toast.success(isConfirmMode ? "¡Pago confirmado con éxito!" : "Facturación actualizada con éxito");
      setEditOpen(false);
      setIsConfirmMode(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar facturación");
    }
  };

  const handleExportInvoice = (a: AppointmentWithPatient) => {
    const doctorName = doctorMap.get(a.doctor_id) || myProfile?.full_name || "Médico Especialista";
    exportInvoicePDF(a, doctorName, clinic);
  };

  const handleExportMonthlyReport = () => {
    const selectedMonthObj = monthOptions.find((m) => m.key === monthFilter);
    exportMonthlyReportPDF(filtered, selectedMonthObj, clinic);
  };

  return (
    <div className="space-y-6">
      <FacturacionHeader
        metrics={metrics}
        onExportReport={handleExportMonthlyReport}
      />

      <FacturacionFilterBar
        q={q}
        setQ={setQ}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        doctorFilter={doctorFilter}
        setDoctorFilter={setDoctorFilter}
        monthFilter={monthFilter}
        setMonthFilter={setMonthFilter}
        doctors={doctors}
        monthOptions={monthOptions}
      />

      <FacturacionTable
        isLoading={isLoading}
        filteredCount={filtered.length}
        paginated={paginated}
        doctorMap={doctorMap}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onEditOpen={handleEditOpen}
        onExportInvoice={handleExportInvoice}
      />

      <EditPaymentDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setIsConfirmMode(false);
        }}
        isConfirmMode={isConfirmMode}
        selectedApp={selectedApp}
        newPrice={newPrice}
        setNewPrice={setNewPrice}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        newPaymentMethod={newPaymentMethod}
        setNewPaymentMethod={setNewPaymentMethod}
        newPaymentReference={newPaymentReference}
        setNewPaymentReference={setNewPaymentReference}
        isPending={updateAppointment.isPending}
        onSave={handleSavePrice}
      />
    </div>
  );
}
