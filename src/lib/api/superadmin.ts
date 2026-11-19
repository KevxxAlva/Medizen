import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSaasPlanConfig } from "./clinic";
import { broadcastSaasSync } from "@/hooks/useRealtimeSync";

export interface ClinicSaasPaymentRecord {
  id: string;
  fecha: string;
  montoUsd: number;
  metodo: "Pago Móvil" | "Zelle" | "Efectivo USD" | "Binance" | "Transferencia";
  referencia?: string;
  plan: string;
}

export interface GlobalAnnouncement {
  active: boolean;
  message: string;
  type: "info" | "warning" | "success";
  updatedAt: string;
}

export interface ClinicSaasMeta {
  notes: string;
  nextDueDate?: string; // YYYY-MM-DD
  payments?: ClinicSaasPaymentRecord[];
  globalAnnouncement?: GlobalAnnouncement;
}

export interface Clinica {
  id_clinica: string;
  slug: string;
  nombre: string;
  rif: string | null;
  telefono: string | null;
  direccion: string | null;
  email_contacto: string | null;
  plan_suscripcion: "basico" | "pro" | "enterprise";
  estado: "activo" | "suspendido" | "demo";
  logo_url: string | null;
  color_primario: string;
  tipo_clinica: string;
  header_receta?: string | null;
  footer_receta?: string | null;
  fuente_receta?: string | null;
  notas_internas?: string | null;
  creado_en: string;
  actualizado_en?: string;
  // Métricas agregadas
  medicos_count?: number;
  pacientes_count?: number;
  consultas_count?: number;
  // Administrador de la clínica
  admin_nombre?: string;
  admin_email?: string;
  admin_telefono?: string;
  admin_auth_id?: string | null;
}

export interface ClinicStaffMember {
  id_usuario: number;
  auth_id: string | null;
  nombre: string;
  email: string;
  rol: string;
  especialidad?: string | null;
  estado: boolean;
}

export interface UpdateClinicInput {
  id_clinica: string;
  nombre?: string;
  slug?: string;
  rif?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  email_contacto?: string | null;
  tipo_clinica?: string;
  plan_suscripcion?: "basico" | "pro" | "enterprise";
  estado?: "activo" | "suspendido" | "demo";
  notas_internas?: string | null;
}

export interface CreateClinicInput {
  slug: string;
  nombre: string;
  rif?: string;
  telefono?: string;
  direccion?: string;
  plan?: string;
  estado_inicial?: "activo" | "demo";
  admin_email: string;
  admin_password: string;
  admin_name: string;
  tipo_clinica?: string;
  color_primario?: string;
}

export function getDefaultDueDate(creadoEn?: string, estado?: string): string {
  const base = creadoEn ? new Date(creadoEn) : new Date();
  const daysToAdd = estado === "demo" ? 14 : 30;
  const due = new Date(base.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return due.toISOString().slice(0, 10);
}

export function parseClinicSaasMeta(clinica?: Partial<Clinica> | null): ClinicSaasMeta {
  const defaultDue = getDefaultDueDate(clinica?.creado_en, clinica?.estado);
  const raw = clinica?.notas_internas;
  if (!raw || !raw.trim()) {
    return {
      notes: "",
      nextDueDate: defaultDue,
      payments: [],
    };
  }
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        notes: typeof parsed.notes === "string" ? parsed.notes : "",
        nextDueDate: parsed.nextDueDate || defaultDue,
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        globalAnnouncement: parsed.globalAnnouncement,
      };
    } catch {
      // Fallback to plain text
    }
  }
  return {
    notes: raw,
    nextDueDate: defaultDue,
    payments: [],
  };
}

export function serializeClinicSaasMeta(meta: ClinicSaasMeta): string {
  return JSON.stringify(meta);
}

export function getClinicDueStatus(clinica: Clinica): {
  nextDueDate: string;
  daysRemaining: number;
  status: "al_dia" | "por_vencer" | "vencido";
  label: string;
} {
  const meta = parseClinicSaasMeta(clinica);
  const nextDueDate = meta.nextDueDate || getDefaultDueDate(clinica.creado_en, clinica.estado);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${nextDueDate}T00:00:00`);
  const diffMs = due.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    const abs = Math.abs(daysRemaining);
    return {
      nextDueDate,
      daysRemaining,
      status: "vencido",
      label: abs === 1 ? "Vencido ayer" : `Vencido hace ${abs} días`,
    };
  }
  if (daysRemaining === 0) {
    return {
      nextDueDate,
      daysRemaining: 0,
      status: "por_vencer",
      label: "Vence hoy",
    };
  }
  if (daysRemaining <= 5) {
    return {
      nextDueDate,
      daysRemaining,
      status: "por_vencer",
      label: daysRemaining === 1 ? "Vence mañana" : `Vence en ${daysRemaining} días`,
    };
  }
  return {
    nextDueDate,
    daysRemaining,
    status: "al_dia",
    label: clinica.estado === "demo" ? `Demo · ${daysRemaining} días` : `Al día · ${daysRemaining}d`,
  };
}

export function buildClinicWhatsAppUrl(clinica: Clinica): string | null {
  const rawPhone = clinica.telefono || clinica.admin_telefono || "";
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0") && digits.length === 11) {
    digits = "58" + digits.slice(1);
  } else if (digits.length === 10 && (digits.startsWith("41") || digits.startsWith("42"))) {
    digits = "58" + digits;
  }

  const planCfg = getSaasPlanConfig(clinica.plan_suscripcion);
  const dueInfo = getClinicDueStatus(clinica);
  const dueFormatted = new Date(`${dueInfo.nextDueDate}T12:00:00`).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  let text = "";
  if (dueInfo.status === "vencido") {
    text = `Hola ${clinica.admin_nombre || ""}, te escribimos de *Medizen SaaS*. Te recordamos que la suscripción de *${clinica.nombre}* (Plan ${planCfg.name} - $${planCfg.priceMonthlyUsd}/mes) venció el *${dueFormatted}*. Por favor indícanos tu comprobante de pago para mantener el servicio activo.`;
  } else if (dueInfo.status === "por_vencer") {
    text = `Hola ${clinica.admin_nombre || ""}, te escribimos de *Medizen SaaS*. Te recordamos que el próximo corte de *${clinica.nombre}* (Plan ${planCfg.name} - $${planCfg.priceMonthlyUsd}/mes) es el *${dueFormatted}*. ¡Quedamos atentos!`;
  } else {
    text = `Hola ${clinica.admin_nombre || ""}, te escribimos del soporte administrativo de *Medizen SaaS* respecto a tu clínica *${clinica.nombre}* (Plan ${planCfg.name}). ¿Cómo va todo con la plataforma?`;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function useClinicas() {
  return useQuery({
    queryKey: ["superadmin_clinicas"],
    staleTime: 0,
    refetchInterval: 6000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<Clinica[]> => {
      const { data: clinicasData, error } = await supabase
        .from("clinicas")
        .select("*")
        .order("creado_en", { ascending: false });

      if (error) {
        console.error("Error al obtener clínicas:", error);
        throw error;
      }

      const clinicas = (clinicasData ?? []) as Clinica[];
      if (clinicas.length === 0) return [];

      // Sincronizar anuncio global si existe en la clínica principal y falta en alguna otra clínica
      const primaryClinic = clinicas.find(
        (c) => c.id_clinica === "c0000000-0000-0000-0000-000000000001"
      );
      const primaryMeta = primaryClinic ? parseClinicSaasMeta(primaryClinic) : null;
      if (primaryMeta?.globalAnnouncement) {
        await Promise.allSettled(
          clinicas
            .filter((c) => c.id_clinica !== "c0000000-0000-0000-0000-000000000001")
            .map(async (c) => {
              const cMeta = parseClinicSaasMeta(c);
              if (
                JSON.stringify(cMeta.globalAnnouncement) !==
                JSON.stringify(primaryMeta.globalAnnouncement)
              ) {
                cMeta.globalAnnouncement = primaryMeta.globalAnnouncement;
                const serialized = serializeClinicSaasMeta(cMeta);
                c.notas_internas = serialized;
                await supabase
                  .from("clinicas")
                  .update({ notas_internas: serialized })
                  .eq("id_clinica", c.id_clinica);
              }
            })
        );
      }

      // Desvincular automáticamente la cuenta del Super Admin (kevinja1406@gmail.com) de Clínica FemeSalud
      await Promise.allSettled([
        supabase
          .from("usuarios")
          .update({ id_clinica: null } as any)
          .eq("es_superadmin", true),
        supabase
          .from("medicos")
          .delete()
          .ilike("email", "kevinja1406@gmail.com"),
      ]);

      // Conteo exacto por clínica en tiempo real (evita el límite de 1.000 filas de PostgREST)
      const clinicasConMetricas = await Promise.all(
        clinicas.map(async (c) => {
          const isPrimary =
            c.id_clinica === "c0000000-0000-0000-0000-000000000001" ||
            clinicas.length === 1 ||
            c.slug === "femesalud";

          let medQuery = supabase
            .from("medicos")
            .select("id_medico", { count: "exact", head: true })
            .not("email", "ilike", "kevinja1406@gmail.com");
          let pacQuery = supabase.from("pacientes").select("id_paciente", { count: "exact", head: true });
          let conQuery = supabase.from("consultas").select("id_consulta", { count: "exact", head: true });

          if (isPrimary) {
            medQuery = medQuery.or(`id_clinica.eq.${c.id_clinica},id_clinica.is.null`);
            pacQuery = pacQuery.or(`id_clinica.eq.${c.id_clinica},id_clinica.is.null`);
            conQuery = conQuery.or(`id_clinica.eq.${c.id_clinica},id_clinica.is.null`);
          } else {
            medQuery = medQuery.eq("id_clinica", c.id_clinica);
            pacQuery = pacQuery.eq("id_clinica", c.id_clinica);
            conQuery = conQuery.eq("id_clinica", c.id_clinica);
          }

          let adminQuery = supabase
            .from("usuarios")
            .select("id_usuario, nombre_usuario, auth_id, id_rol, es_superadmin, medicos(email)")
            .eq("es_superadmin", false)
            .not("auth_id", "is", null);

          if (isPrimary) {
            adminQuery = adminQuery
              .eq("id_clinica", c.id_clinica)
              .order("id_rol", { ascending: true });
          } else {
            adminQuery = adminQuery.eq("id_clinica", c.id_clinica).eq("id_rol", 1);
          }

          const [medicosRes, pacientesRes, consultasRes, adminRes] = await Promise.all([
            medQuery,
            pacQuery,
            conQuery,
            adminQuery.limit(1).maybeSingle(),
          ]);

          const joinedMed = Array.isArray((adminRes.data as any)?.medicos)
            ? (adminRes.data as any)?.medicos[0]
            : (adminRes.data as any)?.medicos;

          let adminNombre = adminRes.data?.nombre_usuario || "";
          const rawContactEmail =
            c.email_contacto && c.email_contacto.toLowerCase() !== "kevinja1406@gmail.com"
              ? c.email_contacto
              : "";
          let adminEmail = joinedMed?.email || rawContactEmail || "";

          if (!adminEmail && c.slug === "tecnosalud") {
            adminEmail = "ingridma1977@gmail.com";
          }

          return {
            ...c,
            email_contacto: rawContactEmail || null,
            medicos_count: medicosRes.count ?? 0,
            pacientes_count: pacientesRes.count ?? 0,
            consultas_count: consultasRes.count ?? 0,
            admin_nombre: adminNombre || "Sin administrador asignado",
            admin_email: adminEmail || "Sin correo asignado",
            admin_telefono: c.telefono || undefined,
            admin_auth_id: adminRes.data?.auth_id || null,
          };
        })
      );

      return clinicasConMetricas;
    },
  });
}

export function useClinicStaff(id_clinica?: string) {
  return useQuery({
    queryKey: ["superadmin_clinic_staff", id_clinica],
    enabled: !!id_clinica,
    staleTime: 0,
    queryFn: async (): Promise<ClinicStaffMember[]> => {
      if (!id_clinica) return [];

      const { data, error } = await supabase
        .from("usuarios")
        .select("id_usuario, nombre_usuario, auth_id, estado, id_rol, es_superadmin, roles(nombre_rol), medicos(email, especialidades(nombre))")
        .eq("id_clinica", id_clinica)
        .eq("es_superadmin", false)
        .order("id_usuario", { ascending: true });

      if (error) {
        console.warn("Error consultando personal de clínica:", error);
        return [];
      }

      return (data ?? [])
        .filter((u: any) => {
          const med = Array.isArray(u.medicos) ? u.medicos[0] : u.medicos;
          const email = (med?.email || u.nombre_usuario || "").toLowerCase();
          return !u.es_superadmin && !email.includes("kevinja1406");
        })
        .map((u: any) => {
          const rawRole = Array.isArray(u.roles) ? u.roles[0]?.nombre_rol : u.roles?.nombre_rol;
          const med = Array.isArray(u.medicos) ? u.medicos[0] : u.medicos;
          const esp = med?.especialidades
            ? Array.isArray(med.especialidades)
              ? med.especialidades[0]?.nombre
              : med.especialidades?.nombre
            : null;

          return {
            id_usuario: u.id_usuario,
            auth_id: u.auth_id || null,
            nombre: u.nombre_usuario || "Usuario",
            email: med?.email || "",
            rol: rawRole || (u.id_rol === 1 ? "Admin" : u.id_rol === 3 ? "Recepcionista" : "Médico"),
            especialidad: esp,
            estado: Boolean(u.estado),
          };
        });
    },
  });
}

export function useRemoveClinicStaffMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id_usuario }: { id_usuario: number; auth_id?: string | null }) => {
      await supabase.from("medicos").delete().eq("id_usuario", id_usuario);
      const { error } = await supabase
        .from("usuarios")
        .update({ id_clinica: null } as any)
        .eq("id_usuario", id_usuario);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin_clinic_staff"] });
      qc.invalidateQueries({ queryKey: ["superadmin_clinicas"] });
      qc.invalidateQueries({ queryKey: ["profiles_with_roles"] });
      qc.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useResetClinicUserPassword() {
  return useMutation({
    mutationFn: async ({
      auth_id,
      email,
      new_password,
    }: {
      auth_id?: string | null;
      email?: string;
      new_password: string;
    }): Promise<{ mode: "direct" | "email" }> => {
      const cleanPassword = (new_password || "").trim();
      if (cleanPassword.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres.");
      }

      let targetAuthId = auth_id || null;

      // Si no vino auth_id, buscarlo en public.usuarios o en la sesión actual
      if (!targetAuthId) {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData.session?.user;
        if (email && currentUser?.email?.toLowerCase() === email.trim().toLowerCase()) {
          targetAuthId = currentUser.id;
        }
      }

      if (!targetAuthId && email) {
        const { data: medData } = await supabase
          .from("medicos")
          .select("id_usuario, usuarios(auth_id)")
          .ilike("email", email.trim())
          .limit(1)
          .maybeSingle();
        const joinedUser = Array.isArray((medData as any)?.usuarios)
          ? (medData as any)?.usuarios[0]
          : (medData as any)?.usuarios;
        if (joinedUser?.auth_id) {
          targetAuthId = joinedUser.auth_id;
        }
      }

      if (!targetAuthId) {
        throw new Error("No se encontró el identificador de autenticación (auth_id) de este usuario.");
      }

      // Ejecutar directamente el RPC SECURITY DEFINER en PostgreSQL (no depende de GoTrue updateUser)
      const { error: rpcErr } = await supabase.rpc("superadmin_reset_user_password" as any, {
        p_auth_id: targetAuthId,
        p_new_password: cleanPassword,
      });

      if (rpcErr) {
        throw rpcErr;
      }

      return { mode: "direct" };
    },
  });
}

const GLOBAL_ANNOUNCEMENT_STORAGE_KEY = "medizen_global_saas_announcement";

export function useGlobalAnnouncement() {
  return useQuery({
    queryKey: ["global_saas_announcement"],
    staleTime: 0,
    refetchInterval: 6000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<GlobalAnnouncement | null> => {
      try {
        // Consultar las filas de clinicas visibles para el usuario actual (su propia clínica por RLS, o todas si es Super Admin)
        const { data: rows } = await supabase
          .from("clinicas")
          .select("id_clinica, notas_internas");

        if (rows && rows.length > 0) {
          let latestAnnouncement: GlobalAnnouncement | null = null;
          for (const row of rows) {
            if (row.notas_internas) {
              const meta = parseClinicSaasMeta(row as any);
              if (meta.globalAnnouncement) {
                if (
                  !latestAnnouncement ||
                  new Date(meta.globalAnnouncement.updatedAt || 0) >=
                    new Date(latestAnnouncement.updatedAt || 0)
                ) {
                  latestAnnouncement = meta.globalAnnouncement;
                }
              }
            }
          }

          if (latestAnnouncement) {
            if (typeof window !== "undefined") {
              localStorage.setItem(
                GLOBAL_ANNOUNCEMENT_STORAGE_KEY,
                JSON.stringify(latestAnnouncement)
              );
            }
            return latestAnnouncement;
          }
        }
      } catch {
        // ignore
      }

      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(GLOBAL_ANNOUNCEMENT_STORAGE_KEY);
          if (cached) return JSON.parse(cached) as GlobalAnnouncement;
        } catch {
          // ignore
        }
      }

      return null;
    },
  });
}

export function useUpdateGlobalAnnouncement() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (announcement: GlobalAnnouncement) => {
      const payloadStr = JSON.stringify(announcement);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(GLOBAL_ANNOUNCEMENT_STORAGE_KEY, payloadStr);
        } catch {
          // ignore
        }
      }

      // Propagar el anuncio global a todas las clínicas en public.clinicas para que cada clínica lo lea desde su propio registro con RLS estricto
      const { data: allClinics } = await supabase.from("clinicas").select("*");

      if (allClinics && allClinics.length > 0) {
        await Promise.all(
          allClinics.map(async (c: any) => {
            const meta = parseClinicSaasMeta(c);
            meta.globalAnnouncement = announcement;
            await supabase
              .from("clinicas")
              .update({
                notas_internas: serializeClinicSaasMeta(meta),
                actualizado_en: new Date().toISOString(),
              })
              .eq("id_clinica", c.id_clinica);
          })
        );
      }

      return announcement;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["global_saas_announcement"] });
      qc.invalidateQueries({ queryKey: ["superadmin_clinicas"] });
      qc.invalidateQueries({ queryKey: ["clinic_info"] });
      void broadcastSaasSync("clinicas");
    },
  });
}

export function useSuperadminStats() {
  const { data: clinicas = [], isLoading } = useClinicas();

  const totalClinicas = clinicas.length;
  const clinicasActivas = clinicas.filter((c) => c.estado === "activo").length;
  const clinicasDemo = clinicas.filter((c) => c.estado === "demo").length;
  const clinicasSuspendidas = clinicas.filter((c) => c.estado === "suspendido").length;
  const clinicasPorVencerOVencidas = clinicas.filter((c) => {
    if (c.estado === "suspendido") return false;
    const due = getClinicDueStatus(c);
    return due.status === "vencido" || due.status === "por_vencer";
  }).length;
  const totalPacientes = clinicas.reduce((acc, c) => acc + (c.pacientes_count || 0), 0);
  const totalMedicos = clinicas.reduce((acc, c) => acc + (c.medicos_count || 0), 0);
  const totalConsultas = clinicas.reduce((acc, c) => acc + (c.consultas_count || 0), 0);
  const mrrUsd = clinicas
    .filter((c) => c.estado === "activo")
    .reduce((acc, c) => acc + getSaasPlanConfig(c.plan_suscripcion).priceMonthlyUsd, 0);

  return {
    isLoading,
    stats: {
      totalClinicas,
      clinicasActivas,
      clinicasDemo,
      clinicasSuspendidas,
      clinicasPorVencerOVencidas,
      totalPacientes,
      totalMedicos,
      totalConsultas,
      mrrUsd,
    },
  };
}

export function useCreateClinica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateClinicInput) => {
      const { data, error } = await supabase.rpc("superadmin_create_clinic", {
        p_slug: input.slug.trim().toLowerCase(),
        p_nombre: input.nombre.trim(),
        p_rif: input.rif?.trim() || null,
        p_telefono: input.telefono?.trim() || null,
        p_direccion: input.direccion?.trim() || null,
        p_plan: input.plan || "pro",
        p_admin_email: input.admin_email.trim().toLowerCase(),
        p_admin_password: input.admin_password,
        p_admin_name: input.admin_name.trim(),
        p_tipo_clinica: input.tipo_clinica || "Consultorio Ginecológico Obstétrico",
        p_color_primario: input.color_primario || "#0ea5e9",
      });

      if (error) throw error;

      const createdId = (data as any)?.id_clinica;
      if (createdId && input.estado_inicial === "demo") {
        const trialDue = getDefaultDueDate(new Date().toISOString(), "demo");
        await supabase.rpc("superadmin_toggle_clinic_status", {
          p_id_clinica: createdId,
          p_nuevo_estado: "demo",
        });
        await supabase
          .from("clinicas")
          .update({
            notas_internas: serializeClinicSaasMeta({
              notes: "Periodo de prueba gratuito (14 días)",
              nextDueDate: trialDue,
              payments: [],
            }),
          })
          .eq("id_clinica", createdId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin_clinicas"] });
      queryClient.invalidateQueries({ queryKey: ["clinic_info"] });
      void broadcastSaasSync("clinicas");
    },
  });
}

export function useToggleClinicaStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id_clinica, nuevo_estado }: { id_clinica: string; nuevo_estado: "activo" | "suspendido" | "demo" }) => {
      const { data, error } = await supabase.rpc("superadmin_toggle_clinic_status", {
        p_id_clinica: id_clinica,
        p_nuevo_estado: nuevo_estado,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin_clinicas"] });
      queryClient.invalidateQueries({ queryKey: ["clinic_info"] });
      void broadcastSaasSync("clinicas");
    },
  });
}

export function useUpdateClinica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateClinicInput) => {
      const { id_clinica, ...updates } = input;
      const { data, error } = await supabase
        .from("clinicas")
        .update({
          ...updates,
          actualizado_en: new Date().toISOString(),
        })
        .eq("id_clinica", id_clinica)
        .select()
        .maybeSingle();

      if (error) throw error;

      // Sincronizar tabla legacy clinic_info si se actualiza la clínica principal
      if (
        id_clinica === "c0000000-0000-0000-0000-000000000001" &&
        (updates.nombre !== undefined ||
          updates.rif !== undefined ||
          updates.telefono !== undefined ||
          updates.direccion !== undefined)
      ) {
        const legacyUpdates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.nombre !== undefined) legacyUpdates.name = updates.nombre;
        if (updates.rif !== undefined) legacyUpdates.rif = updates.rif;
        if (updates.telefono !== undefined) legacyUpdates.phone = updates.telefono;
        if (updates.direccion !== undefined) legacyUpdates.address_line1 = updates.direccion;
        await supabase.from("clinic_info").update(legacyUpdates).eq("id", 1);
      }

      if (typeof window !== "undefined") {
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith("medizen_cached_clinic_info_")) {
              localStorage.removeItem(k);
            }
          });
        } catch {
          // ignore
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin_clinicas"] });
      queryClient.invalidateQueries({ queryKey: ["clinic_info"] });
      queryClient.invalidateQueries({ queryKey: ["global_saas_announcement"] });
      void broadcastSaasSync("clinicas");
    },
  });
}

export function useDeleteClinica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id_clinica }: { id_clinica: string }) => {
      // 1. Intentar eliminación atómica vía RPC SECURITY DEFINER si está disponible
      const { error: rpcError } = await supabase.rpc(
        "superadmin_delete_clinic" as any,
        { p_id_clinica: id_clinica }
      );

      if (rpcError) {
        // Fallback: eliminar en orden jerárquico estricto (hijos -> padres) para evitar violaciones de FK
        const { data: clinicUsers } = await supabase
          .from("usuarios")
          .select("id_usuario, auth_id, es_superadmin")
          .eq("id_clinica", id_clinica);

        if (clinicUsers && clinicUsers.length > 0) {
          const nonSuperAdminsWithAuth = clinicUsers.filter(
            (u: any) => !u.es_superadmin && u.auth_id
          );
          await Promise.allSettled(
            nonSuperAdminsWithAuth.map((u: any) =>
              supabase.rpc("admin_delete_staff_user", {
                p_user_id: u.auth_id,
              })
            )
          );
        }

        // Nivel 1: Tablas hoja (detalles, pagos, insumos, exámenes, archivos, finanzas, inventario)
        const leafTables = [
          "detalles_receta",
          "recetas",
          "insumos_consulta",
          "examenes_laboratorio",
          "archivos_pacientes",
          "document_verifications",
          "pagos",
          "detalles_factura",
          "facturas",
          "payment_methods",
          "financial_accounts",
          "financial_purchases",
          "inventory_stocks",
          "daily_goals",
          "support_tickets",
          "audit_logs",
          "clinic_info",
          "horarios_medicos",
        ];
        for (const table of leafTables) {
          await supabase.from(table as any).delete().eq("id_clinica", id_clinica);
        }

        // Nivel 2: Consultas -> Citas -> Historias Clínicas -> Pacientes -> Servicios
        await supabase.from("consultas").delete().eq("id_clinica", id_clinica);
        await supabase.from("citas").delete().eq("id_clinica", id_clinica);
        await supabase.from("historias_clinicas").delete().eq("id_clinica", id_clinica);
        await supabase.from("pacientes").delete().eq("id_clinica", id_clinica);
        await supabase.from("servicios").delete().eq("id_clinica", id_clinica);

        // Nivel 3: Personal y usuarios de la clínica
        await supabase
          .from("usuarios")
          .update({ id_clinica: null } as any)
          .eq("id_clinica", id_clinica)
          .eq("es_superadmin", true);
        await supabase.from("medicos").delete().eq("id_clinica", id_clinica);
        await supabase
          .from("usuarios")
          .delete()
          .eq("id_clinica", id_clinica)
          .eq("es_superadmin", false);

        // Nivel 4: Eliminar la clínica
        const { error } = await supabase
          .from("clinicas")
          .delete()
          .eq("id_clinica", id_clinica);

        if (error) throw error;
      }

      if (typeof window !== "undefined") {
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith("medizen_cached_clinic_info_")) {
              localStorage.removeItem(k);
            }
          });
        } catch {
          // ignore
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin_clinicas"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin_clinic_staff"] });
      queryClient.invalidateQueries({ queryKey: ["clinic_info"] });
      queryClient.invalidateQueries({ queryKey: ["global_saas_announcement"] });
      void broadcastSaasSync("clinicas");
    },
  });
}

