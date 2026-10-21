import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AuditLog = {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  details: any;
  created_at: string | null;
  perfiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
};

// API to log an action manually
export async function logAuditAction(
  actionType: string,
  entityType: string,
  entityId: string,
  details: any = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        action_type: actionType,
        entity_type: entityType,
        entity_id: String(entityId),
        user_id: user.id,
        details: details,
      })
      .select()
      .single();

    if (error) {
      console.error("Audit Log Error:", error);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Audit Log Exception:", error);
    return null;
  }
}

// Hook to fetch logs for admin
export function useAuditLogs(limit = 100) {
  return useQuery({
    queryKey: ["audit_logs", limit],
    queryFn: async (): Promise<AuditLog[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      const logs = data ?? [];

      const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean))] as string[];
      const userMap = new Map<string, { full_name: string | null; email: string | null }>();

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from("usuarios")
          .select("auth_id, nombre_usuario, medicos(nombre, apellido, email)")
          .in("auth_id", userIds);

        (users ?? []).forEach((u: any) => {
          if (!u.auth_id) return;
          const doc = Array.isArray(u.medicos) ? u.medicos[0] : u.medicos;
          const fullName = doc ? `${doc.nombre} ${doc.apellido}`.trim() : u.nombre_usuario;
          const email = doc?.email || u.nombre_usuario || null;
          userMap.set(u.auth_id, { full_name: fullName, email });
        });
      }

      return logs.map((l) => ({
        ...l,
        perfiles: l.user_id ? userMap.get(l.user_id) || null : null,
      }));
    },
  });
}
