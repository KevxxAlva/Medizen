import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isDeviceOffline } from "@/lib/offline/networkState";
import { shouldServeLocalCacheOnly } from "@/lib/offline/syncEngine";

export type SupportTicket = {
  id: string;
  patient_name: string;
  subject: string;
  description: string | null;
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Resolved";
  created_at: string;
};

export function useTickets() {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["support_tickets"],
    queryFn: async (): Promise<SupportTicket[]> => {
      if (shouldServeLocalCacheOnly()) {
        const cached = qc.getQueryData<SupportTicket[]>(["support_tickets"]);
        if (Array.isArray(cached)) return cached;
      }
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data as SupportTicket[];
    },
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ticket: Omit<SupportTicket, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("support_tickets")
        .insert(ticket)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (created) => {
      if (created) {
        qc.setQueriesData<SupportTicket[]>({ queryKey: ["support_tickets"] }, (old) =>
          Array.isArray(old) ? [created as SupportTicket, ...old.filter((t) => t.id !== created.id)] : [created as SupportTicket],
        );
      }
      if (!isDeviceOffline()) {
        qc.invalidateQueries({ queryKey: ["support_tickets"] });
      }
    },
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ticket: Partial<SupportTicket> & { id: string }) => {
      const { data, error } = await supabase
        .from("support_tickets")
        .update(ticket)
        .eq("id", ticket.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (updated, vars) => {
      qc.setQueriesData<SupportTicket[]>({ queryKey: ["support_tickets"] }, (old) =>
        Array.isArray(old) ? old.map((t) => (t.id === vars.id ? { ...t, ...vars, ...(updated || {}) } : t)) : old,
      );
      if (!isDeviceOffline()) {
        qc.invalidateQueries({ queryKey: ["support_tickets"] });
      }
    },
  });
}

export function useDeleteTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("support_tickets")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, deletedId) => {
      qc.setQueriesData<SupportTicket[]>({ queryKey: ["support_tickets"] }, (old) =>
        Array.isArray(old) ? old.filter((t) => t.id !== deletedId) : old,
      );
      if (!isDeviceOffline()) {
        qc.invalidateQueries({ queryKey: ["support_tickets"] });
      }
    },
  });
}
