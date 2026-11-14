import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Mapa completo entre todas las tablas de la base de datos y las Query Keys de React Query
const TABLE_TO_QUERY_KEYS: Record<string, string[][]> = {
  clinicas: [
    ["clinic_info"],
    ["superadmin_clinicas"],
    ["global_saas_announcement"],
    ["current_clinic_id"],
  ],
  clinic_info: [
    ["clinic_info"],
    ["global_saas_announcement"],
  ],
  pacientes: [
    ["patients"],
    ["patient"],
    ["patients_count"],
    ["patients_paginated"],
    ["patients_recent"],
    ["dashboard_stats"],
    ["superadmin_clinicas"],
    ["command_patients"],
  ],
  citas: [
    ["appointments"],
    ["waiting_room_appointments"],
    ["facturas"],
    ["monthly_payments"],
    ["dashboard_stats"],
    ["dashboard_trends"],
    ["dashboard_top_treatments"],
    ["ai_clinical_insights"],
    ["command_appointments"],
  ],
  consultas: [
    ["consultations"],
    ["consultation"],
    ["patient_consultations"],
    ["waiting_room_consultations"],
    ["facturas"],
    ["monthly_payments"],
    ["dashboard_stats"],
    ["dashboard_trends"],
    ["dashboard_top_treatments"],
    ["ai_clinical_insights"],
    ["superadmin_clinicas"],
  ],
  insumos_consulta: [
    ["consultation_supplies"],
    ["inventory_stocks"],
    ["stocks"],
    ["consultations"],
  ],
  historias_clinicas: [
    ["clinical-notes"],
    ["clinical_notes"],
    ["patients"],
    ["patient"],
    ["patients_paginated"],
    ["patients_recent"],
  ],
  recetas: [
    ["prescriptions"],
    ["patient_prescriptions"],
    ["consultations"],
  ],
  detalles_receta: [
    ["prescriptions"],
    ["patient_prescriptions"],
  ],
  examenes_laboratorio: [
    ["lab_orders"],
    ["patient_lab_orders"],
    ["consultations"],
  ],
  archivos_pacientes: [
    ["patient_files"],
    ["files"],
  ],
  servicios: [
    ["services"],
    ["dashboard_top_treatments"],
  ],
  facturas: [
    ["facturas"],
    ["sales_invoices"],
    ["monthly_payments"],
    ["dashboard_stats"],
    ["dashboard_trends"],
    ["dashboard_top_treatments"],
    ["ai_clinical_insights"],
    ["command_invoices"],
  ],
  detalles_factura: [
    ["facturas"],
    ["sales_invoices"],
    ["dashboard_top_treatments"],
  ],
  pagos: [
    ["facturas"],
    ["sales_invoices"],
    ["monthly_payments"],
    ["dashboard_stats"],
    ["financial_accounts"],
    ["accounts"],
  ],
  financial_purchases: [
    ["financial_purchases"],
    ["purchases"],
    ["financial_accounts"],
    ["accounts"],
    ["dashboard_stats"],
  ],
  inventory_stocks: [
    ["inventory_stocks"],
    ["stocks"],
    ["ai_clinical_insights"],
  ],
  inventario: [
    ["inventory_stocks"],
    ["stocks"],
  ],
  movimientos_inventario: [
    ["inventory_stocks"],
    ["stocks"],
  ],
  financial_accounts: [
    ["financial_accounts"],
    ["accounts"],
  ],
  payment_methods: [["payment_methods"]],
  support_tickets: [["support_tickets"], ["tickets"]],
  daily_goals: [["daily_goals"]],
  medicos: [
    ["doctors"],
    ["profiles_with_roles"],
    ["profile"],
    ["my_profile"],
    ["superadmin_clinicas"],
    ["superadmin_clinic_staff"],
  ],
  horarios_medicos: [
    ["doctor_schedules"],
    ["schedules"],
    ["doctors"],
  ],
  usuarios: [
    ["users"],
    ["doctors"],
    ["profiles_with_roles"],
    ["profile"],
    ["my_profile"],
    ["user_roles"],
    ["roles"],
    ["superadmin_clinicas"],
    ["superadmin_clinic_staff"],
  ],
  audit_logs: [["audit_logs"]],
  document_verifications: [["document_verifications"], ["verifications"]],
  especialidades: [["specialties"], ["doctors"]],
  catalogo_medicamentos: [["medications"], ["prescriptions"]],
  roles: [["roles"], ["user_roles"], ["profiles_with_roles"]],
  seguros_medicos: [["insurances"]],
  polizas_pacientes: [["patient_policies"], ["patients"]],
};

const REALTIME_DEBOUNCE_MS = 250;

export function broadcastSaasSync(table: string = "clinicas") {
  try {
    const ch = supabase.channel("medizen-saas-broadcast");
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.send({
          type: "broadcast",
          event: "saas_update",
          payload: { table, ts: Date.now() },
        }).finally(() => {
          setTimeout(() => supabase.removeChannel(ch), 500);
        });
      }
    });
  } catch {
    // ignore broadcast errors
  }
}

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const pendingKeys = new Map<string, string[]>();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const clearClinicLocalStorageCache = () => {
      if (typeof window === "undefined") return;
      try {
        Object.keys(localStorage).forEach((k) => {
          if (
            k.startsWith("medizen_cached_clinic_info_") ||
            k === "medizen_global_saas_announcement"
          ) {
            localStorage.removeItem(k);
          }
        });
      } catch {
        // ignore
      }
    };

    const flushInvalidations = () => {
      debounceTimer = null;
      if (pendingKeys.size === 0) return;
      const keysToInvalidate = Array.from(pendingKeys.values());
      pendingKeys.clear();

      for (const key of keysToInvalidate) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    };

    const queueInvalidation = (key: string[]) => {
      const hash = JSON.stringify(key);
      pendingKeys.set(hash, key);
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(flushInvalidations, REALTIME_DEBOUNCE_MS);
    };

    const handleTableChange = (table?: string) => {
      if (!table) return;
      if (table === "clinicas" || table === "clinic_info") {
        clearClinicLocalStorageCache();
      }
      const queryKeys = TABLE_TO_QUERY_KEYS[table];
      if (queryKeys && queryKeys.length > 0) {
        queryKeys.forEach((key) => queueInvalidation(key));
      } else {
        queueInvalidation([table]);
      }
    };

    // 1. Escuchar cambios Postgres Realtime en todas las tablas del esquema 'public'
    const dbChannel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          handleTableChange(payload.table);
        }
      )
      .subscribe();

    // 2. Escuchar canal Broadcast multi-ventana / multi-clínica instantáneo
    const broadcastChannel = supabase
      .channel("medizen-saas-broadcast")
      .on("broadcast", { event: "saas_update" }, (payload) => {
        const table = payload?.payload?.table || "clinicas";
        handleTableChange(table);
      })
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [queryClient]);
}
