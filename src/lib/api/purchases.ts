import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession, resolveCurrentUserClinicId } from "@/hooks/useAuth";

export type FinancialPurchase = {
  id: string;
  vendor: string;
  purchase_date: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
};

export function usePurchases() {
  const { user } = useAuthSession();
  return useQuery({
    queryKey: ["financial_purchases", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<FinancialPurchase[]> => {
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      let query = supabase
        .from("financial_purchases")
        .select("*")
        .order("created_at", { ascending: true });
      if (clinicId) {
        query = (query as any).eq("id_clinica", clinicId);
      }
        
      const { data, error } = await query;
      if (error) throw error;
      return data as FinancialPurchase[];
    },
  });
}

export function useCreatePurchase() {
  const qc = useQueryClient();
  const { user } = useAuthSession();
  return useMutation({
    mutationFn: async (pur: Omit<FinancialPurchase, "id">) => {
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      const payload: Record<string, any> = { ...pur };
      if (clinicId) payload.id_clinica = clinicId;
      const { data, error } = await supabase
        .from("financial_purchases")
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_purchases"] });
    },
  });
}

export function useUpdatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pur: FinancialPurchase) => {
      const { data, error } = await supabase
        .from("financial_purchases")
        .update({
          vendor: pur.vendor,
          purchase_date: pur.purchase_date,
          amount: pur.amount,
          status: pur.status,
        })
        .eq("id", pur.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_purchases"] });
    },
  });
}

export function useDeletePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_purchases")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_purchases"] });
    },
  });
}
