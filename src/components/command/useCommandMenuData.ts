import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SearchPatient, SearchAppointment, SearchInvoice } from "./CommandSearchResults";

export function useCommandMenuData(open: boolean, deferredSearch: string) {
  const { data: patients = [] } = useQuery<SearchPatient[]>({
    queryKey: ["global-search-patients"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pacientes")
        .select("id_paciente, nombre, apellido, documento_identidad")
        .order("creado_en", { ascending: false })
        .limit(200);
      return (data ?? []).map((p: any) => ({
        id: String(p.id_paciente),
        full_name: `${p.nombre || ""} ${p.apellido || ""}`.trim(),
        document_id: p.documento_identidad || "",
      }));
    },
    enabled: open,
  });

  const { data: appointments = [] } = useQuery<SearchAppointment[]>({
    queryKey: ["global-search-appointments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("citas")
        .select("id_cita, fecha_hora, motivo, pacientes(nombre, apellido)")
        .order("fecha_hora", { ascending: false })
        .limit(50);
      return (data ?? []).map((a: any) => ({
        id: String(a.id_cita),
        scheduled_at: a.fecha_hora,
        reason: a.motivo || "",
        patient_name: a.pacientes ? `${a.pacientes.nombre || ""} ${a.pacientes.apellido || ""}`.trim() : "—",
      }));
    },
    enabled: open,
  });

  const { data: invoices = [] } = useQuery<SearchInvoice[]>({
    queryKey: ["global-search-invoices"],
    queryFn: async () => {
      const { data } = await supabase
        .from("facturas")
        .select("id_factura, total_general, fecha_emision, pacientes(nombre, apellido)")
        .order("id_factura", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: open,
  });

  const q = deferredSearch.trim().toLowerCase();

  const filteredPatients = useMemo(() => {
    if (!q) {
      return patients.slice(0, 5);
    }
    const terms = q.split(/\s+/);
    return patients
      .filter((p) => {
        const name = (p.full_name || "").toLowerCase();
        const doc = (p.document_id || "").toLowerCase();
        return terms.every((t) => name.includes(t) || doc.includes(t));
      })
      .slice(0, 8);
  }, [patients, q]);

  const filteredAppointments = useMemo(() => {
    if (!q) {
      return appointments.slice(0, 3);
    }
    const terms = q.split(/\s+/);
    return appointments
      .filter((a) => {
        const name = (a.patient_name || "").toLowerCase();
        const reason = (a.reason || "").toLowerCase();
        return terms.every((t) => name.includes(t) || reason.includes(t));
      })
      .slice(0, 4);
  }, [appointments, q]);

  const filteredInvoices = useMemo(() => {
    if (!q) return [];
    const terms = q.split(/\s+/);
    return invoices
      .filter((f) => {
        const name = `${f.pacientes?.nombre || ""} ${f.pacientes?.apellido || ""}`.toLowerCase();
        const invId = f.id_factura?.toString() || "";
        return terms.every((t) => name.includes(t) || invId.includes(t));
      })
      .slice(0, 4);
  }, [invoices, q]);

  const hasResults =
    filteredPatients.length > 0 ||
    filteredAppointments.length > 0 ||
    filteredInvoices.length > 0;

  return {
    q,
    hasResults,
    filteredPatients,
    filteredAppointments,
    filteredInvoices,
  };
}
