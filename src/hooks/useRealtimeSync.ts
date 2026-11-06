import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Tablas de solo escritura/auditoría que no deben disparar recargas globales en la UI
const IGNORED_REALTIME_TABLES = new Set<string>([
  "auditoria_logs",
  "audit_logs",
]);

// Mapping between DB tables and their corresponding React Query keys.
const TABLE_TO_QUERY_KEYS: Record<string, string[][]> = {
  pacientes: [
    ["patients"],
    ["patient"],
    ["patients_count"],
    ["patients_paginated"],
    ["patients_recent"],
    ["dashboard_stats"],
  ],
  citas: [
    ["appointments"],
    ["facturas"],
    ["monthly_payments"],
    ["dashboard_stats"],
    ["dashboard_trends"],
    ["dashboard_top_treatments"],
    ["ai_clinical_insights"],
  ],
  consultas: [
    ["consultations"],
    ["consultation"],
    ["patient_consultations"],
    ["facturas"],
    ["monthly_payments"],
    ["dashboard_stats"],
    ["dashboard_trends"],
    ["dashboard_top_treatments"],
    ["ai_clinical_insights"],
  ],
  historias_clinicas: [
    ["clinical-notes"],
    ["clinical_notes"],
    ["patients"],
    ["patient"],
    ["patients_paginated"],
    ["patients_recent"],
  ],
  servicios: [
    ["services"],
    ["dashboard_top_treatments"],
  ],
  facturas: [
    ["facturas"],
    ["monthly_payments"],
    ["dashboard_stats"],
    ["dashboard_trends"],
    ["dashboard_top_treatments"],
    ["ai_clinical_insights"],
  ],
  detalles_factura: [
    ["facturas"],
    ["dashboard_top_treatments"],
  ],
  pagos: [
    ["facturas"],
    ["monthly_payments"],
    ["dashboard_stats"],
    ["financial_accounts"],
    ["accounts"],
  ],
  clinic_info: [["clinic_info"]],
  financial_purchases: [
    ["financial_purchases"],
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
    ["my_profile"],
  ],
  usuarios: [
    ["users"],
    ["doctors"],
    ["profiles_with_roles"],
    ["my_profile"],
    ["roles"],
  ],
};

const REALTIME_DEBOUNCE_MS = 350;

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const pendingKeys = new Map<string, string[]>();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

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

    // Escuchar cambios globales en toda la base de datos (schema 'public')
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          const table = payload.table;
          if (!table || IGNORED_REALTIME_TABLES.has(table)) {
            return;
          }

          const queryKeys = TABLE_TO_QUERY_KEYS[table];
          if (queryKeys && queryKeys.length > 0) {
            queryKeys.forEach((key) => queueInvalidation(key));
          } else {
            queueInvalidation([table]);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Conectado a Supabase con Debounce de Caché L1/L2 activo.");
        }
      });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
