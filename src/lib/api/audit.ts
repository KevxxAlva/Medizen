import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AuditLog = {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  details: any;
  created_at: string | null;
  id_clinica?: string | null;
  clinic_name?: string | null;
  perfiles?: {
    full_name: string | null;
    email: string | null;
    role?: string | null;
    id_clinica?: string | null;
    clinic_name?: string | null;
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    let idClinica: string | null = null;
    const { data: userData } = await (supabase.from("usuarios") as any)
      .select("id_clinica")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (userData?.id_clinica) {
      idClinica = userData.id_clinica;
    }

    const enrichedDetails =
      typeof details === "object" && details !== null
        ? { ...details, ...(idClinica ? { id_clinica: idClinica } : {}) }
        : details;

    const payload: Record<string, any> = {
      action_type: actionType,
      entity_type: entityType,
      entity_id: String(entityId),
      user_id: user.id,
      details: enrichedDetails,
    };
    if (idClinica) {
      payload.id_clinica = idClinica;
    }

    const { data, error } = await (supabase.from("audit_logs") as any)
      .insert(payload)
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

// Hook to fetch logs for admin / superadmin
export function useAuditLogs(limit = 200) {
  return useQuery({
    queryKey: ["audit_logs", limit],
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 8000,
    queryFn: async (): Promise<AuditLog[]> => {
      const [
        { data: sessionData },
        { data, error },
        { data: clinicasData },
        { data: allUsersData },
        { data: recentCitas },
        { data: recentPacientes },
        { data: recentConsultas },
      ] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit),
        (supabase.from("clinicas") as any).select("id_clinica, nombre"),
        (supabase.from("usuarios") as any).select(
          "auth_id, nombre_usuario, id_clinica, id_rol, es_superadmin, roles(nombre_rol), medicos(id_medico, nombre, apellido, email)"
        ),
        (supabase.from("citas") as any)
          .select("id_cita, id_clinica, id_paciente, id_medico, fecha_hora, motivo, estado, pacientes(nombre, apellido)")
          .order("id_cita", { ascending: false })
          .limit(60),
        (supabase.from("pacientes") as any)
          .select("id_paciente, id_clinica, nombre, apellido, documento_identidad, creado_en")
          .order("id_paciente", { ascending: false })
          .limit(40),
        (supabase.from("consultas") as any)
          .select("id_consulta, id_clinica, id_cita, id_medico, fecha_consulta, diagnostico")
          .order("id_consulta", { ascending: false })
          .limit(40),
      ]);

      if (error) throw error;
      const logs = data ?? [];

      const clinicMap = new Map<string, string>();
      (clinicasData ?? []).forEach((c: any) => {
        if (c.id_clinica && c.nombre) {
          clinicMap.set(String(c.id_clinica), String(c.nombre));
        }
      });

      const currentAuthId = sessionData.session?.user?.id || null;
      let currentUserClinicId: string | null = null;
      let currentUserIsSuperAdmin = false;

      const userMap = new Map<
        string,
        {
          full_name: string | null;
          email: string | null;
          role?: string | null;
          id_clinica?: string | null;
          clinic_name?: string | null;
        }
      >();
      const clinicAdminByClinicId = new Map<
        string,
        {
          auth_id: string | null;
          full_name: string | null;
          email: string | null;
          role?: string | null;
          id_clinica?: string | null;
          clinic_name?: string | null;
        }
      >();
      const doctorUserByMedicoId = new Map<
        number,
        {
          auth_id: string | null;
          full_name: string | null;
          email: string | null;
          role?: string | null;
          id_clinica?: string | null;
          clinic_name?: string | null;
        }
      >();

      (allUsersData ?? []).forEach((u: any) => {
        if (u.auth_id === currentAuthId) {
          currentUserClinicId = u.id_clinica || null;
          currentUserIsSuperAdmin = Boolean(u.es_superadmin);
        }
        const doc = Array.isArray(u.medicos) ? u.medicos[0] : u.medicos;
        const roleObj = Array.isArray(u.roles) ? u.roles[0] : u.roles;
        const fullName = doc ? `${doc.nombre} ${doc.apellido}`.trim() : u.nombre_usuario;
        const email = doc?.email || null;
        const cId = u.id_clinica ? String(u.id_clinica) : null;
        const cName = cId ? clinicMap.get(cId) || null : null;
        const profileEntry = {
          auth_id: u.auth_id || null,
          full_name: fullName,
          email,
          role: roleObj?.nombre_rol || null,
          id_clinica: cId,
          clinic_name: cName,
        };
        if (u.auth_id) {
          userMap.set(u.auth_id, profileEntry);
        }
        if (doc?.id_medico) {
          doctorUserByMedicoId.set(Number(doc.id_medico), profileEntry);
        }
        if (cId && !u.es_superadmin && (u.id_rol === 1 || !clinicAdminByClinicId.has(cId))) {
          clinicAdminByClinicId.set(cId, profileEntry);
        }
      });

      const defaultSeedClinicId = "c0000000-0000-0000-0000-000000000001";
      const defaultSeedClinicName = clinicMap.get(defaultSeedClinicId) || "Clínica FemeSalud";

      const mappedLogs: AuditLog[] = logs.map((l: any) => {
        const perfil = l.user_id ? userMap.get(l.user_id) || null : null;
        const rawClinicId =
          l.id_clinica ||
          l.details?.id_clinica ||
          perfil?.id_clinica ||
          defaultSeedClinicId;
        const clinicId = rawClinicId ? String(rawClinicId) : null;
        const clinicName =
          (clinicId && clinicMap.get(clinicId)) ||
          perfil?.clinic_name ||
          defaultSeedClinicName;

        const resolvedPerfil =
          perfil || (clinicId ? clinicAdminByClinicId.get(clinicId) || null : null);

        return {
          ...l,
          id_clinica: clinicId,
          clinic_name: clinicName,
          perfiles: resolvedPerfil,
        };
      });

      // Combinar movimientos reales de citas, pacientes y consultas que no estén ya en audit_logs
      const existingKeys = new Set(
        mappedLogs.map((l) => `${(l.entity_type || "").toUpperCase()}:${l.entity_id}`)
      );

      (recentCitas ?? []).forEach((c: any) => {
        const key = `APPOINTMENT:${c.id_cita}`;
        if (existingKeys.has(key)) return;
        const clinicId = c.id_clinica ? String(c.id_clinica) : defaultSeedClinicId;
        const clinicName = clinicMap.get(clinicId) || defaultSeedClinicName;
        const pac = Array.isArray(c.pacientes) ? c.pacientes[0] : c.pacientes;
        const pacName = pac ? `${pac.nombre || ""} ${pac.apellido || ""}`.trim() : `Paciente #${c.id_paciente}`;
        const actor =
          (c.id_medico && doctorUserByMedicoId.get(Number(c.id_medico))) ||
          clinicAdminByClinicId.get(clinicId) ||
          null;
        const estadoLower = String(c.estado || "pendiente").toLowerCase();
        const isCompleted = estadoLower.includes("complet") || estadoLower.includes("atendid");

        mappedLogs.push({
          id: `cita-${c.id_cita}`,
          action_type: isCompleted ? "UPDATE" : "CREATE",
          entity_type: "APPOINTMENT",
          entity_id: String(c.id_cita),
          user_id: actor?.auth_id || null,
          created_at: c.fecha_hora || new Date().toISOString(),
          id_clinica: clinicId,
          clinic_name: clinicName,
          details: {
            message: isCompleted
              ? `Cita completada: ${pacName}${c.motivo ? ` (${c.motivo})` : ""}`
              : `Cita agendada (${c.estado || "pendiente"}): ${pacName}${c.motivo ? ` — ${c.motivo}` : ""}`,
          },
          perfiles: actor,
        });
      });

      (recentConsultas ?? []).forEach((con: any) => {
        const key = `CONSULTATION:${con.id_consulta}`;
        if (existingKeys.has(key)) return;
        const clinicId = con.id_clinica ? String(con.id_clinica) : defaultSeedClinicId;
        const clinicName = clinicMap.get(clinicId) || defaultSeedClinicName;
        const actor =
          (con.id_medico && doctorUserByMedicoId.get(Number(con.id_medico))) ||
          clinicAdminByClinicId.get(clinicId) ||
          null;

        mappedLogs.push({
          id: `consulta-${con.id_consulta}`,
          action_type: "CREATE",
          entity_type: "CONSULTATION",
          entity_id: String(con.id_consulta),
          user_id: actor?.auth_id || null,
          created_at: con.fecha_consulta || new Date().toISOString(),
          id_clinica: clinicId,
          clinic_name: clinicName,
          details: {
            message: `Consulta médica registrada #${con.id_consulta}${con.diagnostico ? ` — Diagnóstico: ${con.diagnostico}` : ""}`,
          },
          perfiles: actor,
        });
      });

      (recentPacientes ?? []).forEach((p: any) => {
        const key = `PATIENT:${p.id_paciente}`;
        if (existingKeys.has(key)) return;
        const clinicId = p.id_clinica ? String(p.id_clinica) : defaultSeedClinicId;
        const clinicName = clinicMap.get(clinicId) || defaultSeedClinicName;
        const actor = clinicAdminByClinicId.get(clinicId) || null;

        mappedLogs.push({
          id: `paciente-${p.id_paciente}`,
          action_type: "CREATE",
          entity_type: "PATIENT",
          entity_id: String(p.id_paciente),
          user_id: actor?.auth_id || null,
          created_at: p.creado_en || new Date().toISOString(),
          id_clinica: clinicId,
          clinic_name: clinicName,
          details: {
            message: `Paciente registrado: ${p.nombre || ""} ${p.apellido || ""} (${p.documento_identidad || "S/D"})`.trim(),
          },
          perfiles: actor,
        });
      });

      mappedLogs.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });

      // Si NO es superadmin, filtrar estrictamente los eventos de su propia clínica
      if (!currentUserIsSuperAdmin && currentUserClinicId) {
        return mappedLogs.filter((l) => l.id_clinica === currentUserClinicId);
      }

      return mappedLogs.slice(0, limit);
    },
  });
}
