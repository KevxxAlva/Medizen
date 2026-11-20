import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAuditAction } from "@/lib/api/audit";
import { getSaasPlanConfig } from "@/lib/api/clinic";
import { useAuthSession, resolveCurrentUserClinicId } from "@/hooks/useAuth";
import { isDeviceOffline } from "@/lib/offline/networkState";
import { shouldServeLocalCacheOnly } from "@/lib/offline/syncEngine";

export type PatientStatus = "activo" | "en_tratamiento" | "alta" | "nuevo";

export interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  blood_type: string | null;
  emergency_contact: string | null;
  insurance_provider: string | null;
  address: string | null;
  status: string;
  assigned_doctor_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  document_id: string | null;
  historia_number: string | null;
  first_visit_date: string | null;
  marital_status: string | null;
  birthplace: string | null;
  education_level: string | null;
  occupation: string | null;
  ethnicity: string | null;
  family_history: {
    mother: string | null;
    father: string | null;
    siblings: string | null;
    children: string | null;
  } | null;
  personal_history: {
    alcohol: string | null;
    drugs: string | null;
    tobacco: string | null;
    base_pathology: string | null;
    surgical: string | null;
    allergies: string | null;
    current_medications?: string | null;
    transfusions?: string | null;
  } | null;
  gynecological_data: {
    menarche: number | string | null;
    sexarche: number | string | null;
    menstrual_cycle: string | null;
    dysmenorrhea: string | null;
    nps: number | string | null;
    its: string | null;
    cytology: string | null;
    contraceptives: string | null;
  } | null;
  obstetric_data: {
    g: number | string | null;
    p: number | string | null;
    c: number | string | null;
    a: number | string | null;
    pig: string | null;
    em: number | string | null;
    ee: number | string | null;
    complications: string | null;
    fum: string | null;
    eg: string | null;
    fpp: string | null;
    num_consultations: number | string | null;
    vaccines: string | null;
  } | null;
  consultation_reason: string | null;
  current_illness: string | null;
}

export type PatientInput = Omit<Patient, "id" | "created_at" | "updated_at">;

// Helper to map DB record to Patient interface
const mapPatient = (p: any): Patient => {
  const hc = Array.isArray(p.historias_clinicas) ? p.historias_clinicas[0] : (p.historias_clinicas || {});
  const extras = typeof hc.datos_extras === 'object' && hc.datos_extras !== null ? hc.datos_extras : {};

  return {
    id: p.id_paciente?.toString(),
    full_name: `${p.nombre} ${p.apellido}`.trim(),
    email: p.email,
    phone: p.telefono,
    birth_date: p.fecha_nacimiento,
    gender: p.genero || extras.gender || null,
    blood_type: hc.tipo_sangre || extras.blood_type || null,
    emergency_contact: p.contacto_emergencia || extras.emergency_contact || null,
    insurance_provider: extras.insurance_provider || null,
    address: p.direccion,
    status: extras.status || "activo",
    assigned_doctor_id: extras.assigned_doctor_id || null,
    notes: extras.notes || null,
    created_at: p.creado_en || new Date().toISOString(),
    updated_at: hc.actualizado_en || p.creado_en || new Date().toISOString(),
    document_id: p.documento_identidad,
    historia_number: extras.historia_number || hc.id_historia?.toString() || p.id_paciente?.toString() || null,
    first_visit_date: extras.first_visit_date || (p.creado_en ? String(p.creado_en).slice(0, 10) : null),
    marital_status: extras.marital_status || null,
    birthplace: extras.birthplace || null,
    education_level: extras.education_level || null,
    occupation: extras.occupation || null,
    ethnicity: extras.ethnicity || null,
    family_history: {
      mother: extras.family_history?.mother || null,
      father: extras.family_history?.father || null,
      siblings: extras.family_history?.siblings || null,
      children: hc.antecedentes_familiares || extras.family_history?.children || null,
    },
    personal_history: {
      alcohol: extras.personal_history?.alcohol || null,
      drugs: extras.personal_history?.drugs || null,
      tobacco: extras.personal_history?.tobacco || null,
      base_pathology: hc.enfermedades_cronicas || extras.personal_history?.base_pathology || null,
      surgical: extras.personal_history?.surgical || null,
      allergies: hc.alergias || extras.personal_history?.allergies || null,
      current_medications: extras.personal_history?.current_medications || null,
      transfusions: extras.personal_history?.transfusions || null,
    },
    gynecological_data: extras.gynecological_data || null,
    obstetric_data: extras.obstetric_data || null,
    consultation_reason: extras.consultation_reason || null,
    current_illness: extras.current_illness || null,
  };
};

const PATIENT_LIST_SELECT =
  "id_paciente, nombre, apellido, email, telefono, fecha_nacimiento, genero, contacto_emergencia, direccion, creado_en, documento_identidad, historias_clinicas(id_historia, tipo_sangre, actualizado_en, datos_extras, alergias, enfermedades_cronicas, antecedentes_familiares)";

export function usePatients() {
  const { user } = useAuthSession();
  return useQuery({
    queryKey: ["patients", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Patient[]> => {
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      let query = supabase
        .from("pacientes")
        .select(PATIENT_LIST_SELECT)
        .order("creado_en", { ascending: false });
      if (clinicId) {
        query = (query as any).eq("id_clinica", clinicId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapPatient);
    },
  });
}

export function usePatientCount() {
  const { user } = useAuthSession();
  return useQuery({
    queryKey: ["patients_count", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<number> => {
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      let query = supabase
        .from("pacientes")
        .select("id_paciente", { count: "exact", head: true });
      if (clinicId) {
        query = (query as any).eq("id_clinica", clinicId);
      }
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function usePatientsGrowth() {
  const { user } = useAuthSession();
  return useQuery({
    queryKey: ["patients_growth", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<{ created_at: string }[]> => {
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      let query = supabase
        .from("pacientes")
        .select("creado_en")
        .gte("creado_en", fourteenDaysAgo.toISOString());
      if (clinicId) {
        query = (query as any).eq("id_clinica", clinicId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(d => ({ created_at: d.creado_en || "" }));
    },
  });
}

export function usePatientsCountByDateRange(
  from?: string,
  to?: string,
  options?: { enabled?: boolean; doctorId?: string | number | null; isDoctorOnly?: boolean }
) {
  const { user } = useAuthSession();
  const doctorId = options?.doctorId ? Number(options.doctorId) : undefined;
  const isDoctorOnly = options?.isDoctorOnly;
  return useQuery({
    queryKey: ["patients_count_range", from, to, user?.id, doctorId, isDoctorOnly],
    enabled: (options?.enabled ?? true) && !!user,
    queryFn: async (): Promise<number> => {
      if (isDoctorOnly && !doctorId) return 0;
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      if (doctorId) {
        let citasQ = supabase
          .from("citas")
          .select("id_paciente")
          .eq("id_medico", doctorId);
        if (clinicId) {
          citasQ = (citasQ as any).eq("id_clinica", clinicId);
        }
        const { data: citas } = await citasQ;

        const uniquePatientIds = new Set((citas || []).map((c) => c.id_paciente).filter(Boolean));
        return uniquePatientIds.size;
      }
      let query = supabase
        .from("pacientes")
        .select("id_paciente", { count: "exact", head: true });
      if (clinicId) {
        query = (query as any).eq("id_clinica", clinicId);
      }
      if (from) {
        query = query.gte("creado_en", from);
      }
      if (to) {
        query = query.lte("creado_en", to + "T23:59:59.999Z");
      }
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useRecentPatients(
  limit: number = 5,
  options?: { enabled?: boolean; doctorId?: string | number | null; isDoctorOnly?: boolean }
) {
  const { user } = useAuthSession();
  const doctorId = options?.doctorId ? Number(options.doctorId) : undefined;
  const isDoctorOnly = options?.isDoctorOnly;
  return useQuery({
    queryKey: ["patients_recent", limit, user?.id, doctorId, isDoctorOnly],
    enabled: (options?.enabled ?? true) && !!user,
    queryFn: async (): Promise<Patient[]> => {
      if (isDoctorOnly && !doctorId) return [];
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      if (doctorId) {
        let citasQ = supabase.from("citas").select("id_paciente").eq("id_medico", doctorId);
        let consQ = supabase.from("consultas").select("id_paciente").eq("id_medico", doctorId);
        let hcQ = supabase.from("historias_clinicas").select("id_paciente, datos_extras");
        let medQ = supabase.from("medicos").select("id_medico", { count: "exact", head: true });
        if (clinicId) {
          citasQ = (citasQ as any).eq("id_clinica", clinicId);
          consQ = (consQ as any).eq("id_clinica", clinicId);
          hcQ = (hcQ as any).eq("id_clinica", clinicId);
          medQ = (medQ as any).eq("id_clinica", clinicId);
        }
        const [citasRes, consultasRes, hcRes, medicosCountRes] = await Promise.all([
          citasQ,
          consQ,
          hcQ,
          medQ,
        ]);

        const uniquePatientIds = new Set<number>();
        (citasRes.data || []).forEach((c) => {
          if (c.id_paciente) uniquePatientIds.add(Number(c.id_paciente));
        });
        (consultasRes.data || []).forEach((c) => {
          if (c.id_paciente) uniquePatientIds.add(Number(c.id_paciente));
        });
        (hcRes.data || []).forEach((hc: any) => {
          const assigned = hc.datos_extras?.assigned_doctor_id;
          if (assigned && String(assigned) === String(doctorId) && hc.id_paciente) {
            uniquePatientIds.add(Number(hc.id_paciente));
          }
        });

        const totalMedicos = medicosCountRes.count ?? 0;
        if (totalMedicos <= 1) {
          let allPQ = supabase.from("pacientes").select("id_paciente");
          if (clinicId) {
            allPQ = (allPQ as any).eq("id_clinica", clinicId);
          }
          const { data: allP } = await allPQ;
          (allP || []).forEach((p) => uniquePatientIds.add(Number(p.id_paciente)));
        }

        if (uniquePatientIds.size === 0) return [];

        let pQuery = supabase
          .from("pacientes")
          .select(PATIENT_LIST_SELECT)
          .in("id_paciente", Array.from(uniquePatientIds))
          .order("creado_en", { ascending: false })
          .limit(limit);
        if (clinicId) {
          pQuery = (pQuery as any).eq("id_clinica", clinicId);
        }

        const { data, error } = await pQuery;
        if (error) throw error;
        return (data ?? []).map(mapPatient);
      }

      let pQuery = supabase
        .from("pacientes")
        .select(PATIENT_LIST_SELECT)
        .order("creado_en", { ascending: false })
        .limit(limit);
      if (clinicId) {
        pQuery = (pQuery as any).eq("id_clinica", clinicId);
      }
      const { data, error } = await pQuery;
      if (error) throw error;
      return (data ?? []).map(mapPatient);
    },
  });
}

export function usePaginatedPatients(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  status?: PatientStatus | string
) {
  const { user } = useAuthSession();
  const qc = useQueryClient();
  const queryKey = ["patients_paginated", user?.id, page, pageSize, search, status];
  return useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async (): Promise<{ data: Patient[]; count: number }> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      if (shouldServeLocalCacheOnly()) {
        const existingExact = qc.getQueryData<{ data: Patient[]; count: number }>(queryKey);
        if (existingExact && Array.isArray(existingExact.data) && existingExact.data.length > 0) {
          return existingExact;
        }
        // Recolectar pacientes cacheados localmente para soportar filtros y búsqueda offline
        const byId = new Map<string, Patient>();
        for (const [, d] of qc.getQueriesData<Patient[]>({ queryKey: ["patients"] })) {
          if (Array.isArray(d)) d.forEach((p) => byId.set(p.id, p));
        }
        for (const [, d] of qc.getQueriesData<{ data: Patient[]; count: number }>({
          queryKey: ["patients_paginated"],
        })) {
          if (d && Array.isArray(d.data)) d.data.forEach((p) => byId.set(p.id, p));
        }
        let list = Array.from(byId.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        if (search) {
          const term = search.toLowerCase();
          list = list.filter(
            (p) =>
              (p.full_name || "").toLowerCase().includes(term) ||
              (p.email || "").toLowerCase().includes(term) ||
              (p.document_id || "").toLowerCase().includes(term),
          );
        }
        if (status) {
          list = list.filter((p) => p.status === status);
        }
        return {
          data: list.slice(from, to + 1),
          count: list.length,
        };
      }

      const clinicId = await resolveCurrentUserClinicId(user?.id);

      let query = supabase
        .from("pacientes")
        .select(PATIENT_LIST_SELECT, { count: "exact" })
        .order("creado_en", { ascending: false });

      if (clinicId) {
        query = (query as any).eq("id_clinica", clinicId);
      }

      if (search) {
        query = query.or(
          `nombre.ilike.%${search}%,apellido.ilike.%${search}%,email.ilike.%${search}%,documento_identidad.ilike.%${search}%`
        );
      }

      if (!status) {
        query = query.range(from, to);
        const { data, error, count } = await query;
        if (error) throw error;
        return { data: (data ?? []).map(mapPatient), count: count ?? 0 };
      }

      const { data, error } = await query;
      if (error) throw error;
      const mapped = (data ?? []).map(mapPatient).filter((p) => p.status === status);
      return {
        data: mapped.slice(from, to + 1),
        count: mapped.length,
      };
    },
  });
}

export const fetchPatientById = async (id: string): Promise<Patient | null> => {
  if (!id) throw new Error("No patient ID provided");
  if (typeof window !== "undefined") {
    await supabase.auth.getSession();
  }
  const { data, error } = await supabase
    .from("pacientes")
    .select("*, historias_clinicas(*)")
    .eq("id_paciente", parseInt(id))
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapPatient(data);
};

export function usePatient(id: string | undefined | null) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      if (!id) return null;
      if (shouldServeLocalCacheOnly()) {
        const direct = qc.getQueryData<Patient | null>(["patient", id]);
        if (direct) return direct;
        const fromLists = [
          ...qc.getQueriesData<Patient[]>({ queryKey: ["patients"] }).flatMap(([, d]) => (Array.isArray(d) ? d : [])),
          ...qc.getQueriesData<Patient[]>({ queryKey: ["patients_recent"] }).flatMap(([, d]) => (Array.isArray(d) ? d : [])),
          ...qc
            .getQueriesData<{ data?: Patient[] }>({ queryKey: ["patients_paginated"] })
            .flatMap(([, d]) => (Array.isArray(d?.data) ? d.data : [])),
        ];
        const found = fromLists.find((p) => String(p.id) === String(id));
        if (found) return found;
      }
      return fetchPatientById(id as string);
    },
    enabled: !!id,
  });
}

function withTimeout<T>(promise: PromiseLike<T>, ms = 20000, label = "La operación"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} tardó demasiado en responder. Verifica tu conexión o recarga la página.`));
    }, ms);
    Promise.resolve(promise).then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  const { user } = useAuthSession();
  return useMutation({
    mutationFn: async (input: Partial<PatientInput> & { full_name: string; assigned_doctor_id: string }) => {
      const names = (input.full_name || "").trim().split(/\s+/);
      const nombre = names[0] || "Paciente";
      const apellido = names.slice(1).join(" ") || ".";

      const cleanDocId = input.document_id?.trim() || `S/C-${Date.now().toString().slice(-6)}`;
      const cleanEmail = input.email?.trim() || null;
      const cleanPhone = input.phone?.trim() || null;
      const cleanBirth = input.birth_date?.trim() || null;
      const cleanAddress = input.address?.trim() || null;
      const cleanGender = input.gender?.trim() || null;
      const cleanEmergency = input.emergency_contact?.trim() || null;

      let idClinica: string | undefined;
      if (user?.id) {
        const resolvedClinic = await resolveCurrentUserClinicId(user.id);
        if (resolvedClinic) {
          idClinica = resolvedClinic;
          if (!isDeviceOffline()) {
            const [{ data: clinicaRow }, { count: currentPatientCount }] = await Promise.all([
              (supabase.from("clinicas") as any)
                .select("plan_suscripcion")
                .eq("id_clinica", idClinica)
                .maybeSingle(),
              (supabase.from("pacientes") as any)
                .select("id_paciente", { count: "exact", head: true })
                .eq("id_clinica", idClinica),
            ]);
            const planCfg = getSaasPlanConfig(clinicaRow?.plan_suscripcion);
            if (planCfg.maxPatients !== null && (currentPatientCount ?? 0) >= planCfg.maxPatients) {
              throw new Error(
                `El Plan ${planCfg.name} ($${planCfg.priceMonthlyUsd}/mes) permite hasta ${planCfg.maxPatients} pacientes. Actualiza tu suscripción a Plan Pro o Enterprise para pacientes ilimitados.`,
              );
            }
          }
        }
      }

      const patientPayload: Record<string, any> = {
        nombre,
        apellido,
        email: cleanEmail,
        telefono: cleanPhone,
        documento_identidad: cleanDocId,
        fecha_nacimiento: cleanBirth,
        genero: cleanGender,
        contacto_emergencia: cleanEmergency,
        direccion: cleanAddress,
      };
      if (idClinica) {
        patientPayload.id_clinica = idClinica;
      }

      const { error: patientError, data: patientData } = await withTimeout(
        supabase
          .from("pacientes")
          .insert(patientPayload as any)
          .select()
          .single(),
        20000,
        "El registro del paciente"
      );
      if (patientError) {
        console.error("Error creating patient in pacientes:", patientError);
        throw patientError;
      }

      const {
        status, assigned_doctor_id, notes, historia_number, first_visit_date, 
        marital_status, birthplace, education_level, occupation, ethnicity,
        gender, blood_type, emergency_contact, insurance_provider,
        family_history, personal_history, gynecological_data, obstetric_data,
        consultation_reason, current_illness
      } = input;
      
      const datos_extras = {
        status, assigned_doctor_id, notes, historia_number, first_visit_date, 
        marital_status, birthplace, education_level, occupation, ethnicity,
        gender, blood_type, emergency_contact, insurance_provider,
        family_history, personal_history, gynecological_data, obstetric_data,
        consultation_reason, current_illness
      };

      const hcPayload: Record<string, any> = {
        id_paciente: patientData.id_paciente,
        tipo_sangre: input.blood_type?.trim() || null,
        alergias: input.personal_history?.allergies || null,
        enfermedades_cronicas: input.personal_history?.base_pathology || null,
        antecedentes_familiares: input.family_history?.children || null,
        datos_extras,
      };
      if (idClinica || (patientData as any)?.id_clinica) {
        hcPayload.id_clinica = idClinica || (patientData as any).id_clinica;
      }

      const { error: hcError, data: hcData } = await withTimeout(
        supabase
          .from("historias_clinicas")
          .insert(hcPayload as any)
          .select()
          .single(),
        20000,
        "El guardado de la historia clínica"
      );
      if (hcError) {
        console.error("Error creating historia clinica", hcError);
        throw hcError;
      }

      await logAuditAction("CREATE", "PATIENT", String(patientData.id_paciente), {
        message: `Paciente registrado: ${nombre} ${apellido} (${cleanDocId})`,
        id_clinica: idClinica || (patientData as any)?.id_clinica || null,
      });

      return mapPatient({ ...patientData, historias_clinicas: hcData });
    },
    onSuccess: (createdPatient) => {
      if (createdPatient) {
        qc.setQueriesData<Patient[]>({ queryKey: ["patients"] }, (old) =>
          Array.isArray(old) ? [createdPatient, ...old.filter((p) => p.id !== createdPatient.id)] : [createdPatient],
        );
        qc.setQueriesData<Patient[]>({ queryKey: ["patients_recent"] }, (old) =>
          Array.isArray(old) ? [createdPatient, ...old.filter((p) => p.id !== createdPatient.id)] : [createdPatient],
        );
        qc.setQueriesData<{ data: Patient[]; count: number }>({ queryKey: ["patients_paginated"] }, (old) => {
          if (!old || !Array.isArray(old.data)) {
            return { data: [createdPatient], count: 1 };
          }
          const filtered = old.data.filter((p) => p.id !== createdPatient.id);
          return {
            data: [createdPatient, ...filtered],
            count: (typeof old.count === "number" ? old.count : filtered.length) + 1,
          };
        });
        qc.setQueriesData<number>({ queryKey: ["patients_count"] }, (old) =>
          typeof old === "number" ? old + 1 : 1,
        );
        qc.setQueriesData<number>({ queryKey: ["patients_count_range"] }, (old) =>
          typeof old === "number" ? old + 1 : 1,
        );
        qc.setQueryData(["patient", createdPatient.id], createdPatient);
      }
      if (!isDeviceOffline()) {
        qc.invalidateQueries({ queryKey: ["patients"] });
        qc.invalidateQueries({ queryKey: ["patients_count"] });
        qc.invalidateQueries({ queryKey: ["patients_paginated"] });
        qc.invalidateQueries({ queryKey: ["patients_recent"] });
        qc.invalidateQueries({ queryKey: ["audit_logs"] });
      }
    },
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<PatientInput> & { id: string }) => {
      const updateData: any = {};
      if (patch.full_name) {
        const names = patch.full_name.trim().split(/\s+/);
        updateData.nombre = names[0] || "Paciente";
        updateData.apellido = names.slice(1).join(" ") || ".";
      }
      if (patch.email !== undefined) updateData.email = patch.email?.trim() || null;
      if (patch.phone !== undefined) updateData.telefono = patch.phone?.trim() || null;
      if (patch.document_id !== undefined) updateData.documento_identidad = patch.document_id?.trim() || null;
      if (patch.birth_date !== undefined) updateData.fecha_nacimiento = patch.birth_date?.trim() || null;
      if (patch.gender !== undefined) updateData.genero = patch.gender?.trim() || null;
      if (patch.emergency_contact !== undefined) updateData.contacto_emergencia = patch.emergency_contact?.trim() || null;
      if (patch.address !== undefined) updateData.direccion = patch.address?.trim() || null;

      const { error: patientError, data: patientData } = await supabase
        .from("pacientes")
        .update(updateData)
        .eq("id_paciente", parseInt(id))
        .select()
        .single();
      if (patientError) {
        console.error("Error updating patient in pacientes:", patientError);
        throw patientError;
      }

      const {
        status, assigned_doctor_id, notes, historia_number, first_visit_date, 
        marital_status, birthplace, education_level, occupation, ethnicity,
        gender, blood_type, emergency_contact, insurance_provider,
        family_history, personal_history, gynecological_data, obstetric_data,
        consultation_reason, current_illness
      } = patch;
      
      const extrasToMerge: any = {};
      if (status !== undefined) extrasToMerge.status = status;
      if (assigned_doctor_id !== undefined) extrasToMerge.assigned_doctor_id = assigned_doctor_id;
      if (notes !== undefined) extrasToMerge.notes = notes;
      if (historia_number !== undefined) extrasToMerge.historia_number = historia_number;
      if (first_visit_date !== undefined) extrasToMerge.first_visit_date = first_visit_date;
      if (marital_status !== undefined) extrasToMerge.marital_status = marital_status;
      if (birthplace !== undefined) extrasToMerge.birthplace = birthplace;
      if (education_level !== undefined) extrasToMerge.education_level = education_level;
      if (occupation !== undefined) extrasToMerge.occupation = occupation;
      if (ethnicity !== undefined) extrasToMerge.ethnicity = ethnicity;
      if (gender !== undefined) extrasToMerge.gender = gender;
      if (blood_type !== undefined) extrasToMerge.blood_type = blood_type;
      if (emergency_contact !== undefined) extrasToMerge.emergency_contact = emergency_contact;
      if (insurance_provider !== undefined) extrasToMerge.insurance_provider = insurance_provider;
      if (family_history !== undefined) extrasToMerge.family_history = family_history;
      if (personal_history !== undefined) extrasToMerge.personal_history = personal_history;
      if (gynecological_data !== undefined) extrasToMerge.gynecological_data = gynecological_data;
      if (obstetric_data !== undefined) extrasToMerge.obstetric_data = obstetric_data;
      if (consultation_reason !== undefined) extrasToMerge.consultation_reason = consultation_reason;
      if (current_illness !== undefined) extrasToMerge.current_illness = current_illness;

      let currentHc: any = null;
      if (!isDeviceOffline()) {
        const { data } = await supabase.from("historias_clinicas").select("*").eq("id_paciente", parseInt(id)).maybeSingle();
        currentHc = data;
      }
      const currentExtras = typeof currentHc?.datos_extras === 'object' && currentHc?.datos_extras !== null ? currentHc.datos_extras : {};
      const newExtras = { ...currentExtras, ...extrasToMerge };

      const { error: hcError, data: hcData } = await supabase
        .from("historias_clinicas")
        .upsert({
          ...(currentHc?.id_historia ? { id_historia: currentHc.id_historia } : {}),
          id_paciente: parseInt(id),
          tipo_sangre: patch.blood_type !== undefined ? patch.blood_type : currentHc?.tipo_sangre,
          alergias: patch.personal_history?.allergies !== undefined ? patch.personal_history?.allergies : currentHc?.alergias,
          enfermedades_cronicas: patch.personal_history?.base_pathology !== undefined ? patch.personal_history?.base_pathology : currentHc?.enfermedades_cronicas,
          antecedentes_familiares: patch.family_history?.children !== undefined ? patch.family_history?.children : currentHc?.antecedentes_familiares,
          datos_extras: newExtras
        }, { onConflict: "id_paciente" })
        .select()
        .single();
      
      if (hcError && hcError.code !== '23505') console.error("Error upserting historia clinica", hcError);

      return mapPatient({ ...patientData, historias_clinicas: hcData || currentHc });
    },
    onSuccess: (updatedPatient) => {
      if (updatedPatient) {
        const mergePatient = (p: Patient) => (p.id === updatedPatient.id ? { ...p, ...updatedPatient } : p);
        qc.setQueriesData<Patient[]>({ queryKey: ["patients"] }, (old) =>
          Array.isArray(old) ? old.map(mergePatient) : old,
        );
        qc.setQueriesData<Patient[]>({ queryKey: ["patients_recent"] }, (old) =>
          Array.isArray(old) ? old.map(mergePatient) : old,
        );
        qc.setQueriesData<any>({ queryKey: ["patients_paginated"] }, (old: any) =>
          old && Array.isArray(old.data) ? { ...old, data: old.data.map(mergePatient) } : old,
        );
        qc.setQueryData<Patient>(["patient", updatedPatient.id], (old) =>
          old ? { ...old, ...updatedPatient } : updatedPatient,
        );
      }
      if (!isDeviceOffline()) {
        qc.invalidateQueries({ queryKey: ["patients"] });
        qc.invalidateQueries({ queryKey: ["patient"] });
        qc.invalidateQueries({ queryKey: ["patients_count"] });
        qc.invalidateQueries({ queryKey: ["patients_paginated"] });
        qc.invalidateQueries({ queryKey: ["patients_recent"] });
      }
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pacientes").delete().eq("id_paciente", parseInt(id));
      if (error) throw error;

      // Log audit action silently
      await logAuditAction("DELETE", "PATIENT", id, { message: "Paciente eliminado" });
    },
    onSuccess: (_data, deletedId) => {
      qc.setQueriesData<Patient[]>({ queryKey: ["patients"] }, (old) =>
        Array.isArray(old) ? old.filter((p) => p.id !== deletedId) : old,
      );
      qc.setQueriesData<Patient[]>({ queryKey: ["patients_recent"] }, (old) =>
        Array.isArray(old) ? old.filter((p) => p.id !== deletedId) : old,
      );
      qc.setQueriesData<{ data: Patient[]; count: number }>({ queryKey: ["patients_paginated"] }, (old) => {
        if (!old || !Array.isArray(old.data)) return old;
        const nextData = old.data.filter((p) => p.id !== deletedId);
        const removed = nextData.length < old.data.length ? 1 : 0;
        return {
          data: nextData,
          count: Math.max(0, (typeof old.count === "number" ? old.count : old.data.length) - removed),
        };
      });
      qc.setQueriesData<number>({ queryKey: ["patients_count"] }, (old) =>
        typeof old === "number" ? Math.max(0, old - 1) : old,
      );
      qc.setQueriesData<number>({ queryKey: ["patients_count_range"] }, (old) =>
        typeof old === "number" ? Math.max(0, old - 1) : old,
      );
      if (!isDeviceOffline()) {
        qc.invalidateQueries({ queryKey: ["patients"] });
        qc.invalidateQueries({ queryKey: ["patients_count"] });
        qc.invalidateQueries({ queryKey: ["patients_paginated"] });
        qc.invalidateQueries({ queryKey: ["patients_recent"] });
        qc.invalidateQueries({ queryKey: ["appointments"] });
      }
    },
  });
}
