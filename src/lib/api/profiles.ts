import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession, resolveCurrentUserClinicId } from "@/hooks/useAuth";
import { isDeviceOffline } from "@/lib/offline/networkState";
import { shouldServeLocalCacheOnly } from "@/lib/offline/syncEngine";

export interface Profile {
  id: string;
  doctor_id?: string | null;
  auth_id?: string | null;
  full_name: string;
  email: string;
  specialty: string | null;
  specialty_id?: number | null;
  avatar_url: string | null;
  university?: string | null;
  mpps?: string | null;
  cmc?: string | null;
  role?: string | null;
}

export interface ProfileWithRoles extends Profile {
  roles: ("admin" | "doctor" | "recepcionista" | "medico")[];
}

const mapProfile = (u: any, fallbackEmail?: string): Profile => {
  // Try to find if this user is a doctor
  const isDoctor = !!u.medicos;
  const docInfo = isDoctor ? (Array.isArray(u.medicos) ? u.medicos[0] : u.medicos) : null;
  const roleName = Array.isArray(u.roles) ? u.roles[0]?.nombre_rol : u.roles?.nombre_rol;

  return {
    id: u.auth_id || u.id_usuario?.toString(),
    doctor_id: docInfo?.id_medico ? String(docInfo.id_medico) : null,
    full_name: docInfo ? `${docInfo.nombre} ${docInfo.apellido}`.trim() : u.nombre_usuario,
    email: u.email || docInfo?.email || fallbackEmail || "",
    specialty: docInfo?.especialidades?.nombre || null,
    specialty_id: docInfo?.id_especialidad || docInfo?.especialidades?.id_especialidad || null,
    avatar_url: null,
    mpps: docInfo?.numero_licencia || null,
    university: docInfo?.universidad || null,
    cmc: docInfo?.cmc || null,
    role: roleName || null,
  };
};

export function useMyProfile(userId: string | undefined) {
  const qc = useQueryClient();
  const queryKey = ["profile", userId];
  return useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      if (shouldServeLocalCacheOnly()) {
        const cached = qc.getQueryData<Profile | null>(queryKey);
        if (cached) return cached;
      }
      // First try to match by auth_id (UUID from Supabase Auth)
      const { data, error } = await supabase
        .from("usuarios")
        .select("*, roles(nombre_rol), medicos(id_medico, id_especialidad, nombre, apellido, email, numero_licencia, universidad, cmc, especialidades(id_especialidad, nombre))")
        .eq("auth_id", userId!)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        // Fallback or handle cases where user is not yet synced in public.usuarios
        return null; 
      }
      return mapProfile(data);
    },
  });
}

// Doctors picker
export function useDoctors(options?: { enabled?: boolean }) {
  const { user } = useAuthSession();
  return useQuery({
    queryKey: ["doctors", user?.id],
    enabled: (options?.enabled ?? true) && !!user,
    queryFn: async (): Promise<Profile[]> => {
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      let medQuery = supabase
        .from("medicos")
        .select("id_medico, id_especialidad, nombre, apellido, email, numero_licencia, universidad, cmc, especialidades(id_especialidad, nombre), usuarios(auth_id, nombre_usuario)");
      if (clinicId) {
        medQuery = (medQuery as any).eq("id_clinica", clinicId);
      }

      const [{ data: rawMedicos, error: medError }, { data: rawSpecialties }] = await Promise.all([
        medQuery,
        supabase.from("especialidades").select("id_especialidad, nombre"),
      ]);
        
      if (medError) throw medError;

      const specMap = new Map<number, string>();
      (rawSpecialties || []).forEach((esp) => {
        specMap.set(esp.id_especialidad, esp.nombre);
      });
      
      return (rawMedicos ?? [])
        .filter((m: any) => (m.email || "").toLowerCase() !== "kevinja1406@gmail.com")
        .map((m: any) => {
          const joinedSpec = Array.isArray(m.especialidades) ? m.especialidades[0]?.nombre : m.especialidades?.nombre;
          const mappedSpec = (m.id_especialidad && specMap.get(m.id_especialidad)) || joinedSpec || null;
          return {
            id: m.id_medico?.toString(),
            doctor_id: m.id_medico?.toString(),
            auth_id: m.usuarios?.auth_id || null,
            full_name: `${m.nombre} ${m.apellido}`.trim(),
            email: m.email || "",
            specialty: mappedSpec,
            specialty_id: m.id_especialidad || null,
            avatar_url: null,
            mpps: m.numero_licencia,
            university: m.universidad || null,
            cmc: m.cmc || null,
          };
        });
    },
  });
}

export function useAllProfilesWithRoles() {
  const { user } = useAuthSession();
  return useQuery({
    queryKey: ["profiles_with_roles", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ProfileWithRoles[]> => {
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      let query = supabase
        .from("usuarios")
        .select("*, roles(nombre_rol), medicos(nombre, apellido, email, numero_licencia, universidad, cmc, especialidades(nombre))")
        .eq("es_superadmin", false);
      if (clinicId) {
        query = (query as any).eq("id_clinica", clinicId);
      }
        
      const { data, error } = await query;
      if (error) throw error;
      
      return (data ?? [])
        .filter((u: any) => {
          const med = Array.isArray(u.medicos) ? u.medicos[0] : u.medicos;
          const email = (med?.email || u.nombre_usuario || "").toLowerCase();
          return !u.es_superadmin && !email.includes("kevinja1406");
        })
        .map((u: any) => {
          const rawRoleObj = Array.isArray(u.roles) ? u.roles[0] : u.roles;
          const rawRoleName = (rawRoleObj?.nombre_rol || "").toLowerCase();
          let normalizedRole: "admin" | "doctor" | "recepcionista" = "doctor";
          if (u.id_rol === 1 || rawRoleName.includes("admin")) {
            normalizedRole = "admin";
          } else if (u.id_rol === 3 || rawRoleName.includes("recep")) {
            normalizedRole = "recepcionista";
          } else if (
            u.id_rol === 2 ||
            rawRoleName.includes("medic") ||
            rawRoleName.includes("médic") ||
            rawRoleName.includes("doctor")
          ) {
            normalizedRole = "doctor";
          }
          return {
            ...mapProfile(u, u.auth_id === user?.id ? user?.email : undefined),
            roles: [normalizedRole],
          };
        });
    },
  });
}

export function useToggleRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role, enable }: { userId: string; role: "admin" | "doctor" | "recepcionista"; enable: boolean }) => {
      const targetRoleId = enable
        ? role === "admin"
          ? 1
          : role === "recepcionista"
            ? 3
            : 2
        : role === "admin"
          ? 2
          : 3;

      // Match usuario by auth_id or numeric id_usuario
      const isNumericId = /^\d+$/.test(userId);
      const query = supabase.from("usuarios").update({ id_rol: targetRoleId });
      const { error } = isNumericId
        ? await query.eq("id_usuario", parseInt(userId, 10))
        : await query.eq("auth_id", userId);

      if (error) throw error;

      // Si pasa a rol doctor (targetRoleId === 2), asegurar registro en public.medicos
      if (targetRoleId === 2) {
        const userLookup = supabase
          .from("usuarios")
          .select("id_usuario, id_clinica, nombre_usuario, email");
        const { data: uRow } = isNumericId
          ? await userLookup.eq("id_usuario", parseInt(userId, 10)).maybeSingle()
          : await userLookup.eq("auth_id", userId).maybeSingle();

        if (uRow) {
          const { data: existingMed } = await supabase
            .from("medicos")
            .select("id_medico")
            .eq("id_usuario", uRow.id_usuario)
            .maybeSingle();

          if (!existingMed) {
            const parts = (uRow.nombre_usuario || "").trim().split(" ");
            const nombre = parts[0] || "Doctor";
            const apellido = parts.slice(1).join(" ");
            await supabase.from("medicos").insert({
              id_usuario: uRow.id_usuario,
              id_clinica: uRow.id_clinica,
              nombre,
              apellido,
              email: (uRow as any).email || null,
              estado: true,
            } as any);
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles_with_roles"] });
      qc.invalidateQueries({ queryKey: ["user_roles"] });
      qc.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, fullName, specialty, university, mpps, cmc }: { userId: string; fullName: string; specialty: string | null; university: string | null; mpps: string | null; cmc: string | null }) => {
      const parts = fullName.trim().split(" ");
      const nombre = parts[0] || "";
      const apellido = parts.slice(1).join(" ");

      if (isDeviceOffline()) {
        // En modo offline, actualizar directamente por auth_id (encolado en syncOutbox) sin requerir SELECT previo
        await supabase.from("usuarios").update({ nombre_usuario: fullName }).eq("auth_id", userId);
        const cachedProfile = qc.getQueryData<Profile | null>(["profile", userId]);
        const cachedDoctorId = cachedProfile?.doctor_id ? parseInt(cachedProfile.doctor_id, 10) : null;
        if (cachedDoctorId && !Number.isNaN(cachedDoctorId)) {
          await supabase
            .from("medicos")
            .update({
              nombre,
              apellido,
              numero_licencia: mpps,
              universidad: university,
              cmc: cmc,
            })
            .eq("id_medico", cachedDoctorId);
        }
        return;
      }

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id_usuario, id_clinica, nombre_usuario, email")
        .eq("auth_id", userId)
        .maybeSingle();

      if (usuario) {
        await supabase.from("usuarios").update({ nombre_usuario: fullName }).eq("id_usuario", usuario.id_usuario);

        let id_especialidad = null;
        if (specialty) {
          const { data: esp } = await supabase.from("especialidades").select("id_especialidad").ilike("nombre", specialty).maybeSingle();
          if (esp) {
            id_especialidad = esp.id_especialidad;
          } else {
            const { data: newEsp } = await supabase.from("especialidades").insert({ nombre: specialty }).select("id_especialidad").single();
            if (newEsp) id_especialidad = newEsp.id_especialidad;
          }
        }

        const medicoUpdate = {
          nombre,
          apellido,
          numero_licencia: mpps,
          universidad: university,
          cmc: cmc,
          ...(id_especialidad ? { id_especialidad } : {}),
        };

        // Check if there is an associated medico
        const { data: medico } = await supabase.from("medicos").select("id_medico").eq("id_usuario", usuario.id_usuario).maybeSingle();
        if (medico) {
          const { error } = await supabase.from("medicos").update(medicoUpdate).eq("id_medico", medico.id_medico);
          if (error) throw error;
        } else if (specialty || mpps || university || cmc) {
          const { error } = await supabase.from("medicos").insert({
            id_usuario: usuario.id_usuario,
            id_clinica: (usuario as any).id_clinica,
            email: (usuario as any).email || null,
            estado: true,
            ...medicoUpdate,
          } as any);
          if (error) throw error;
        }
      }
    },
    onSuccess: (_, variables) => {
      const patchProfile = (old: any) =>
        old
          ? {
              ...old,
              full_name: variables.fullName,
              specialty: variables.specialty,
              university: variables.university,
              mpps: variables.mpps,
              cmc: variables.cmc,
            }
          : old;
      qc.setQueryData(["profile", variables.userId], patchProfile);
      qc.setQueriesData<any>({ queryKey: ["my_profile"] }, patchProfile);
      if (!shouldServeLocalCacheOnly()) {
        qc.invalidateQueries({ queryKey: ["profile", variables.userId] });
        qc.invalidateQueries({ queryKey: ["my_profile"] });
        qc.invalidateQueries({ queryKey: ["profiles_with_roles"] });
        qc.invalidateQueries({ queryKey: ["doctors"] });
      }
    },
  });
}
