import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession, resolveCurrentUserClinicId } from "@/hooks/useAuth";

export type StockItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
};

export function useStocks() {
  const { user } = useAuthSession();
  return useQuery({
    queryKey: ["inventory_stocks", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<StockItem[]> => {
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      let query = supabase
        .from("inventory_stocks")
        .select("*")
        .order("created_at", { ascending: true });
      if (clinicId) {
        query = (query as any).eq("id_clinica", clinicId);
      }
        
      const { data, error } = await query;
      if (error) throw error;
      return data as StockItem[];
    },
  });
}

export function useCreateStock() {
  const qc = useQueryClient();
  const { user } = useAuthSession();
  return useMutation({
    mutationFn: async (item: Omit<StockItem, "id">) => {
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      const payload: Record<string, any> = { ...item };
      if (clinicId) payload.id_clinica = clinicId;
      const { data, error } = await supabase
        .from("inventory_stocks")
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_stocks"] });
    },
  });
}

export function useUpdateStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: StockItem) => {
      const { data, error } = await supabase
        .from("inventory_stocks")
        .update({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          status: item.status,
        })
        .eq("id", item.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_stocks"] });
    },
  });
}

export function useDeleteStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inventory_stocks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_stocks"] });
    },
  });
}
