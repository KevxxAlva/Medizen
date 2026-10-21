import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    ["dashboard_stats"],
    ["ai_clinical_insights"],
  ],
  consultas: [
    ["consultations"],
    ["consultation"],
    ["patient_consultations"],
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

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Escuchar cambios globales en toda la base de datos (schema 'public')
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const table = payload.table;

          // Encontrar las keys a invalidar según la tabla modificada
          const queryKeys = TABLE_TO_QUERY_KEYS[table];

          if (queryKeys && queryKeys.length > 0) {
            queryKeys.forEach((key) => {
              // Invalidar el query en react-query para que haga refetch automáticamente en background
              queryClient.invalidateQueries({ queryKey: key });
            });
          } else {
             // Fallback si no está explícitamente definida: invalidar el nombre de la tabla
             queryClient.invalidateQueries({ queryKey: [table] });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Conectado a Supabase exitosamente.');
        }
      });

    // Cleanup: desuscribirse cuando se desmonte el layout para no duplicar escuchas
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
