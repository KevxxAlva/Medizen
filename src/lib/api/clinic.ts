import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClinicInfo {
  id: number;
  name: string;
  address_line1: string;
  address_line2: string;
  phone: string;
  rif: string;
  recipe_logo_url?: string;
  recipe_primary_color?: string;
  recipe_header_text?: string;
  recipe_footer_text?: string;
  recipe_font_family?: string;
  recipe_clinic_type?: string;
  updated_at: string;
}

const LIGHTWEIGHT_CLINIC_COLUMNS =
  "id, name, address_line1, address_line2, phone, rif, recipe_primary_color, recipe_header_text, recipe_footer_text, recipe_font_family, recipe_clinic_type, updated_at";

const CACHED_CLINIC_KEY = "medizen_cached_clinic_info";

function readCachedClinicInfo(): ClinicInfo | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(CACHED_CLINIC_KEY);
    return raw ? (JSON.parse(raw) as ClinicInfo) : undefined;
  } catch {
    return undefined;
  }
}

function writeCachedClinicInfo(info: ClinicInfo | null) {
  if (typeof window === "undefined" || !info) return;
  try {
    const { recipe_logo_url: _omitLogo, ...lightweight } = info;
    localStorage.setItem(CACHED_CLINIC_KEY, JSON.stringify(lightweight));
  } catch {
    // ignore storage quota errors
  }
}

export function useClinicInfo(options?: { includeLogo?: boolean }) {
  const includeLogo = options?.includeLogo ?? false;
  return useQuery({
    queryKey: includeLogo ? ["clinic_info", "with_logo"] : ["clinic_info"],
    staleTime: 1000 * 60 * 30, // 30 minutos
    placeholderData: () => (!includeLogo ? readCachedClinicInfo() : undefined),
    queryFn: async (): Promise<ClinicInfo | null> => {
      try {
        const { data, error } = await supabase
          .from("clinic_info")
          .select(includeLogo ? "*" : LIGHTWEIGHT_CLINIC_COLUMNS)
          .eq("id", 1)
          .maybeSingle();
        if (error) {
          console.warn("clinic_info query warning:", error);
          return null;
        }
        const result = (data as unknown as ClinicInfo) ?? null;
        if (result) {
          writeCachedClinicInfo(result);
        }
        return result;
      } catch {
        return null;
      }
    },
  });
}

export function useUpdateClinicInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (info: Partial<Omit<ClinicInfo, "id" | "updated_at">>) => {
      const { error } = await supabase
        .from("clinic_info")
        .update({
          ...info,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinic_info"] });
    },
  });
}
