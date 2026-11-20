import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession, resolveCurrentUserClinicId } from "@/hooks/useAuth";
import { broadcastSaasSync } from "@/hooks/useRealtimeSync";
import { isDeviceOffline } from "@/lib/offline/networkState";
import { shouldServeLocalCacheOnly } from "@/lib/offline/syncEngine";

export type SaasPlanId = "basico" | "pro" | "enterprise";

export interface SaasPlanConfig {
  id: SaasPlanId;
  name: string;
  priceMonthlyUsd: number;
  tagline: string;
  maxDoctors: number | null;
  maxPatients: number | null;
  includesFinance: boolean;
  includesInventory: boolean;
  includesReportsAndAudit: boolean;
  features: string[];
}

export const SAAS_PLANS: Record<SaasPlanId, SaasPlanConfig> = {
  basico: {
    id: "basico",
    name: "Básico",
    priceMonthlyUsd: 15,
    tagline: "Médico independiente",
    maxDoctors: 2,
    maxPatients: 500,
    includesFinance: false,
    includesInventory: false,
    includesReportsAndAudit: false,
    features: [
      "Hasta 2 médicos especialistas",
      "Hasta 500 pacientes registrados",
      "Dashboard, Sala de Espera y Agenda",
      "Historias Clínicas, Recetas y Servicios",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthlyUsd: 25,
    tagline: "Consultorio o grupo médico",
    maxDoctors: 8,
    maxPatients: null,
    includesFinance: true,
    includesInventory: true,
    includesReportsAndAudit: false,
    features: [
      "Hasta 8 médicos · Pacientes ilimitados",
      "Todo lo del Plan Básico",
      "Finanzas completas con tasa BCV (Cuentas, Ventas, Honorarios, Métodos)",
      "Control de Inventario e Insumos",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthlyUsd: 45,
    tagline: "Clínica o centro médico",
    maxDoctors: null,
    maxPatients: null,
    includesFinance: true,
    includesInventory: true,
    includesReportsAndAudit: true,
    features: [
      "Médicos, pacientes y consultas ilimitados",
      "Todo lo del Plan Pro (Finanzas + Inventario)",
      "Reportes Ejecutivos PDF y Analítica",
      "Bitácora de Auditoría, Trazabilidad y Soporte Prioritario",
    ],
  },
};

export function getSaasPlanConfig(plan?: string | null): SaasPlanConfig {
  const key = (plan || "pro").toLowerCase().trim() as SaasPlanId;
  return SAAS_PLANS[key] || SAAS_PLANS.pro;
}

export interface ClinicInfo {
  id: number | string;
  id_clinica?: string;
  name: string;
  tagline?: string;
  plan_suscripcion?: SaasPlanId;
  estado?: "activo" | "suspendido" | "demo";
  notas_internas?: string | null;
  creado_en?: string;
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

const CACHED_CLINIC_KEY_PREFIX = "medizen_cached_clinic_info_";

function readCachedClinicInfo(userId?: string): ClinicInfo | undefined {
  if (typeof window === "undefined" || !userId) return undefined;
  try {
    const raw = localStorage.getItem(`${CACHED_CLINIC_KEY_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as ClinicInfo) : undefined;
  } catch {
    return undefined;
  }
}

function writeCachedClinicInfo(userId: string | undefined, info: ClinicInfo | null) {
  if (typeof window === "undefined" || !userId || !info) return;
  try {
    const { recipe_logo_url: _omitLogo, ...lightweight } = info;
    localStorage.setItem(`${CACHED_CLINIC_KEY_PREFIX}${userId}`, JSON.stringify(lightweight));
  } catch {
    // ignore storage quota errors
  }
}

function mapClinicaToClinicInfo(c: any): ClinicInfo {
  const planConfig = getSaasPlanConfig(c.plan_suscripcion);
  return {
    id: c.id_clinica,
    id_clinica: c.id_clinica,
    name: c.nombre || "Medizen",
    tagline: `Plan ${planConfig.name} · ${c.tipo_clinica || "Suite Clínica"}`,
    plan_suscripcion: planConfig.id,
    estado: c.estado || "activo",
    notas_internas: c.notas_internas || null,
    creado_en: c.creado_en,
    address_line1: c.direccion || "",
    address_line2: "",
    phone: c.telefono || "",
    rif: c.rif || "",
    recipe_logo_url: c.logo_url || undefined,
    recipe_primary_color: c.color_primario || "#0ea5e9",
    recipe_header_text: c.header_receta || "",
    recipe_footer_text: c.footer_receta || "",
    recipe_font_family: c.fuente_receta || "Inter",
    recipe_clinic_type: c.tipo_clinica || "",
    updated_at: c.actualizado_en || c.creado_en || new Date().toISOString(),
  };
}

export function useClinicInfo(options?: { includeLogo?: boolean }) {
  const includeLogo = options?.includeLogo ?? false;
  const { user } = useAuthSession();
  const qc = useQueryClient();
  const queryKey = includeLogo ? ["clinic_info", user?.id, "with_logo"] : ["clinic_info", user?.id];

  return useQuery({
    queryKey,
    enabled: !!user?.id,
    staleTime: 0,
    refetchInterval: () => (shouldServeLocalCacheOnly() ? false : 6000),
    refetchOnMount: () => (shouldServeLocalCacheOnly() ? false : "always"),
    refetchOnWindowFocus: () => !shouldServeLocalCacheOnly(),
    placeholderData: () => readCachedClinicInfo(user?.id),
    queryFn: async (): Promise<ClinicInfo | null> => {
      if (!user?.id) return null;
      if (shouldServeLocalCacheOnly()) {
        const cached = qc.getQueryData<ClinicInfo | null>(queryKey) ?? readCachedClinicInfo(user.id);
        if (cached) return cached;
      }
      try {
        // 1. Obtener el id_clinica del usuario autenticado
        const { data: usuarioData, error: userErr } = await supabase
          .from("usuarios")
          .select("id_clinica")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (userErr) {
          console.warn("usuarios id_clinica query warning:", userErr);
        }

        const clinicId = usuarioData?.id_clinica || "c0000000-0000-0000-0000-000000000001";

        // 2. Consultar la tabla multi-tenant public.clinicas
        if (clinicId) {
          const selectCols = includeLogo
            ? "*"
            : "id_clinica, nombre, direccion, telefono, rif, plan_suscripcion, estado, notas_internas, color_primario, header_receta, footer_receta, fuente_receta, tipo_clinica, actualizado_en, creado_en";

          const { data: clinicaData, error: clinicaErr } = await supabase
            .from("clinicas")
            .select(selectCols)
            .eq("id_clinica", clinicId)
            .maybeSingle();

          if (!clinicaErr && clinicaData) {
            const mapped = mapClinicaToClinicInfo(clinicaData);
            if (includeLogo && !mapped.recipe_logo_url && clinicId === "c0000000-0000-0000-0000-000000000001") {
              const { data: legacyLogo } = await supabase
                .from("clinic_info")
                .select("recipe_logo_url")
                .eq("id", 1)
                .maybeSingle();
              if (legacyLogo?.recipe_logo_url) {
                mapped.recipe_logo_url = legacyLogo.recipe_logo_url;
              }
            }
            writeCachedClinicInfo(user.id, mapped);
            return mapped;
          }
        }

        // 3. Fallback a clinic_info legacy solo si no tiene id_clinica asignado
        const { data, error } = await supabase
          .from("clinic_info")
          .select(
            includeLogo
              ? "*"
              : "id, name, address_line1, address_line2, phone, rif, recipe_primary_color, recipe_header_text, recipe_footer_text, recipe_font_family, recipe_clinic_type, updated_at"
          )
          .eq("id", 1)
          .maybeSingle();

        if (error) {
          console.warn("clinic_info query warning:", error);
          return null;
        }
        const result = (data as unknown as ClinicInfo) ?? null;
        if (result) {
          writeCachedClinicInfo(user.id, result);
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
  const { user } = useAuthSession();

  return useMutation({
    mutationFn: async (info: Partial<Omit<ClinicInfo, "id" | "updated_at">>) => {
      if (!user?.id) throw new Error("Usuario no autenticado");

      const resolvedClinicId = await resolveCurrentUserClinicId(user.id);
      let isSuperAdmin = false;
      try {
        const { data: usuarioData } = await supabase
          .from("usuarios")
          .select("es_superadmin")
          .eq("auth_id", user.id)
          .maybeSingle();
        isSuperAdmin = Boolean(usuarioData?.es_superadmin);
      } catch {
        isSuperAdmin = false;
      }

      const clinicId = resolvedClinicId || "c0000000-0000-0000-0000-000000000001";

      if (clinicId) {
        const clinicaUpdate: Record<string, any> = {
          actualizado_en: new Date().toISOString(),
        };
        if (isSuperAdmin && info.name !== undefined && info.name.trim()) {
          clinicaUpdate.nombre = info.name.trim();
        }
        if (isSuperAdmin && info.rif !== undefined) {
          clinicaUpdate.rif = info.rif;
        }
        if (info.address_line1 !== undefined) clinicaUpdate.direccion = info.address_line1;
        if (info.phone !== undefined) clinicaUpdate.telefono = info.phone;
        if (info.recipe_logo_url !== undefined) clinicaUpdate.logo_url = info.recipe_logo_url;
        if (info.recipe_primary_color !== undefined) clinicaUpdate.color_primario = info.recipe_primary_color;
        if (info.recipe_header_text !== undefined) clinicaUpdate.header_receta = info.recipe_header_text;
        if (info.recipe_footer_text !== undefined) clinicaUpdate.footer_receta = info.recipe_footer_text;
        if (info.recipe_font_family !== undefined) clinicaUpdate.fuente_receta = info.recipe_font_family;
        if (info.recipe_clinic_type !== undefined) clinicaUpdate.tipo_clinica = info.recipe_clinic_type;

        const { error } = await supabase
          .from("clinicas")
          .update(clinicaUpdate)
          .eq("id_clinica", clinicId);
        if (error) throw error;

        if (clinicId === "c0000000-0000-0000-0000-000000000001") {
          const legacyUpdate: Record<string, any> = {
            ...info,
            updated_at: new Date().toISOString(),
          };
          if (!isSuperAdmin) {
            delete legacyUpdate.name;
            delete legacyUpdate.rif;
          }
          await supabase.from("clinic_info").update(legacyUpdate).eq("id", 1);
        }
      }

      if (typeof window !== "undefined" && !isDeviceOffline()) {
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith(CACHED_CLINIC_KEY_PREFIX)) {
              localStorage.removeItem(k);
            }
          });
        } catch {
          // ignore
        }
      }
    },
    onSuccess: (_data, info) => {
      qc.setQueriesData<ClinicInfo | null>({ queryKey: ["clinic_info"] }, (old) => {
        if (!old) return old;
        const next = { ...old, ...info, updated_at: new Date().toISOString() };
        if (user?.id) writeCachedClinicInfo(user.id, next);
        return next;
      });
      if (!isDeviceOffline()) {
        qc.invalidateQueries({ queryKey: ["clinic_info"] });
        qc.invalidateQueries({ queryKey: ["superadmin_clinicas"] });
        void broadcastSaasSync("clinicas");
      }
    },
  });
}
