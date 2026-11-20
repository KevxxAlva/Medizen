import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession, resolveCurrentUserClinicId } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/api/audit";
import { isDeviceOffline } from "@/lib/offline/networkState";

const APPOINTMENT_PRICE_STORAGE_KEY = "medizen_cita_prices";

export function saveStoredAppointmentPrice(citaId: string | number, price: number) {
  if (typeof window === "undefined" || !citaId || !(price > 0)) return;
  try {
    const raw = window.localStorage.getItem(APPOINTMENT_PRICE_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[String(citaId)] = Number(price);
    window.localStorage.setItem(APPOINTMENT_PRICE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function getStoredAppointmentPrice(citaId: string | number): number | null {
  if (typeof window === "undefined" || !citaId) return null;
  try {
    const raw = window.localStorage.getItem(APPOINTMENT_PRICE_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    const val = Number(map[String(citaId)]);
    return val > 0 ? val : null;
  } catch {
    return null;
  }
}

export function resolveServiceFromReason(
  reason: string | null | undefined,
  services: { id_servicio: number; nombre_servicio: string | null; costo_base: number | null }[]
) {
  if (!reason || !services || services.length === 0) return null;
  const clean = reason.trim().toLowerCase();
  if (!clean || clean.includes("[test-load]")) return null;

  // 1. Coincidencia exacta por nombre del servicio
  const exact = services.find(
    (s) => (s.nombre_servicio || "").trim().toLowerCase() === clean
  );
  if (exact) return exact;

  // 2. Coincidencia parcial (el motivo contiene el nombre del servicio o viceversa)
  const partial = services.find((s) => {
    const name = (s.nombre_servicio || "").trim().toLowerCase();
    return name.length >= 3 && (name.includes(clean) || clean.includes(name));
  });
  if (partial) return partial;

  return null;
}


export type AppointmentStatus = "programada" | "completada" | "cancelada" | "no_asistio";

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  reason: string | null;
  notes: string | null;
  price: number | null;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithPatient extends Appointment {
  patient_name?: string;
  has_consultation?: boolean;
}

export type AppointmentInput = {
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_minutes?: number;
  status?: string;
  reason?: string | null;
  notes?: string | null;
  price?: number | null;
  payment_method?: string | null;
  payment_reference?: string | null;
};

export interface AppointmentFilters {
  from?: string;
  to?: string;
  status?: string;
  doctorId?: string;
  limit?: number;
  ascending?: boolean;
  includeInvoices?: boolean;
  includeTestLoad?: boolean;
}

export function useAppointments(filters?: AppointmentFilters, options?: { enabled?: boolean }) {
  const { user } = useAuthSession();
  const qc = useQueryClient();
  const queryKey = filters ? ["appointments", filters, user?.id] : ["appointments", user?.id];
  return useQuery({
    queryKey,
    enabled: (options?.enabled ?? true) && !!user,
    staleTime: 0,
    refetchOnMount: () => (isDeviceOffline() ? false : "always"),
    refetchOnWindowFocus: () => !isDeviceOffline(),
    queryFn: async (): Promise<AppointmentWithPatient[]> => {
      if (isDeviceOffline()) {
        const cached = qc.getQueryData<AppointmentWithPatient[]>(queryKey);
        if (Array.isArray(cached)) return cached;
        const anyCached = qc
          .getQueriesData<AppointmentWithPatient[]>({ queryKey: ["appointments"] })
          .flatMap(([, d]) => (Array.isArray(d) ? d : []));
        const dedup = new Map<string, AppointmentWithPatient>();
        anyCached.forEach((a) => dedup.set(a.id, a));
        return Array.from(dedup.values());
      }
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      const ascending = filters?.ascending ?? true;
      const PAGE_SIZE = 1000;
      let allResults: any[] = [];
      let page = 0;

      while (true) {
        let query = supabase
          .from("citas")
          .select(`
            id_cita, 
            id_paciente, 
            id_medico, 
            fecha_hora, 
            estado, 
            motivo, 
            pacientes(nombre, apellido), 
            consultas(id_consulta)
          `)
          .order("fecha_hora", { ascending });

        if (clinicId) {
          query = (query as any).eq("id_clinica", clinicId);
        }

        if (!filters?.includeTestLoad) {
          query = query.or("motivo.is.null,motivo.not.ilike.%[TEST-LOAD]%");
        }

        if (filters?.from) {
          query = query.gte("fecha_hora", filters.from);
        }
        if (filters?.to) {
          query = query.lte("fecha_hora", filters.to + "T23:59:59.999Z");
        }
        if (filters?.status) {
          query = query.eq("estado", filters.status);
        }
        if (filters?.doctorId) {
          const parsedDocId = parseInt(filters.doctorId, 10);
          if (!isNaN(parsedDocId)) {
            query = query.eq("id_medico", parsedDocId);
          }
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        } else {
          query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        const rows = data ?? [];
        allResults.push(...rows);

        if (filters?.limit || rows.length < PAGE_SIZE) {
          break;
        }
        page++;
      }

      const results = allResults;
      const patientIds = [...new Set(results.map((a: any) => a.id_paciente).filter(Boolean))];
      const invoicesByPatient = new Map<number, any[]>();

      let servQuery = supabase
        .from("servicios")
        .select("id_servicio, nombre_servicio, costo_base");
      if (clinicId) {
        servQuery = (servQuery as any).eq("id_clinica", clinicId);
      }
      const { data: allServices } = await servQuery;
      const servicesList = allServices || [];

      // Only fetch invoices if explicitly requested (e.g. in Facturación), avoids dozens of queries in Agenda
      if (filters?.includeInvoices && patientIds.length > 0) {
        const CHUNK_SIZE = 50;
        for (let i = 0; i < patientIds.length; i += CHUNK_SIZE) {
          const chunk = patientIds.slice(i, i + CHUNK_SIZE);
          let fQuery = supabase
            .from("facturas")
            .select("id_factura, id_paciente, total_general, estado_pago, fecha_emision, pagos(metodo_pago, referencia)")
            .in("id_paciente", chunk)
            .order("id_factura", { ascending: false });

          if (clinicId) {
            fQuery = (fQuery as any).eq("id_clinica", clinicId);
          }

          if (filters?.from) {
            fQuery = fQuery.gte("fecha_emision", filters.from);
          }
          if (filters?.to) {
            fQuery = fQuery.lte("fecha_emision", filters.to + "T23:59:59.999Z");
          }

          const { data: fData, error: fError } = await fQuery;
          if (!fError && fData) {
            for (const fac of fData) {
              const pId = Number(fac.id_paciente);
              const list = invoicesByPatient.get(pId) || [];
              list.push(fac);
              invoicesByPatient.set(pId, list);
            }
          }
        }
      }

      // Emparejar citas con sus facturas correspondientes de manera 1-a-1
      const claimedInvoiceIds = new Set<number>();

      return results.map((a: any) => {
        const pId = Number(a.id_paciente);
        const patientInvoices = invoicesByPatient.get(pId) || [];
        const aTime = a.fecha_hora ? new Date(a.fecha_hora).getTime() : 0;

        let bestF: any = null;
        let minDiff = Infinity;
        for (const fac of patientInvoices) {
          if (claimedInvoiceIds.has(Number(fac.id_factura))) continue;
          const fTime = fac.fecha_emision ? new Date(fac.fecha_emision).getTime() : 0;
          const diff = Math.abs(fTime - aTime);
          if (diff < minDiff && diff <= 12 * 60 * 60 * 1000) {
            minDiff = diff;
            bestF = fac;
          }
        }

        if (bestF) {
          claimedInvoiceIds.add(Number(bestF.id_factura));
        }

        const f = bestF;
        const pago = Array.isArray(f?.pagos) ? f.pagos[0] : f?.pagos;
        const isPaid = ["pagada", "pagado", "paid"].includes((f?.estado_pago || "").toLowerCase());

        const storedPrice = getStoredAppointmentPrice(a.id_cita);
        const matchedServ = resolveServiceFromReason(a.motivo, servicesList);
        const fallbackServicePrice = matchedServ?.costo_base ? Number(matchedServ.costo_base) : null;
        const resolvedPrice = f
          ? Number(f.total_general)
          : storedPrice ?? fallbackServicePrice;
        
        return {
          id: a.id_cita.toString(),
          patient_id: a.id_paciente?.toString() || "",
          doctor_id: a.id_medico?.toString() || "",
          scheduled_at: a.fecha_hora,
          duration_minutes: 30, // mock duration
          status: a.estado?.toLowerCase() || "programada",
          reason: a.motivo,
          notes: null,
          price: resolvedPrice,
          payment_method: pago?.metodo_pago || (isPaid ? 'Pagado' : null),
          payment_reference: pago?.referencia || null,
          created_at: a.fecha_hora,
          updated_at: a.fecha_hora,
          patient_name: a.pacientes ? `${a.pacientes.nombre} ${a.pacientes.apellido}` : "—",
          has_consultation: !!a.consultas && a.consultas.length > 0,
        };
      });
    },
  });
}

async function assertNoDoctorTimeConflict({
  doctorId,
  scheduledAt,
  durationMinutes = 30,
  excludeCitaId,
  clinicId,
}: {
  doctorId: number;
  scheduledAt: string;
  durationMinutes?: number;
  excludeCitaId?: number;
  clinicId?: string | null;
}) {
  if (!doctorId || !scheduledAt) return;
  if (isDeviceOffline()) return;
  const safeIso = scheduledAt.replace(" ", "T");
  const datePart = safeIso.slice(0, 10);
  const newStart = new Date(safeIso).getTime();
  if (Number.isNaN(newStart)) return;
  const newEnd = newStart + Math.max(15, durationMinutes || 30) * 60 * 1000;

  let query = supabase
    .from("citas")
    .select("id_cita, fecha_hora, estado, pacientes(nombre, apellido)")
    .eq("id_medico", doctorId)
    .gte("fecha_hora", `${datePart}T00:00:00`)
    .lte("fecha_hora", `${datePart}T23:59:59`);

  if (clinicId) {
    query = (query as any).eq("id_clinica", clinicId);
  }

  const { data: sameDayCitas, error } = await query;
  if (error || !sameDayCitas) return;

  for (const row of sameDayCitas as any[]) {
    if (excludeCitaId && Number(row.id_cita) === Number(excludeCitaId)) continue;
    const st = String(row.estado || "").toLowerCase();
    if (st === "cancelada" || st === "cancelled") continue;

    const exStart = new Date(String(row.fecha_hora || "").replace(" ", "T")).getTime();
    if (Number.isNaN(exStart)) continue;
    const exEnd = exStart + 30 * 60 * 1000;

    if (newStart < exEnd && exStart < newEnd) {
      const pac = Array.isArray(row.pacientes) ? row.pacientes[0] : row.pacientes;
      const pacName = pac ? `${pac.nombre || ""} ${pac.apellido || ""}`.trim() : "otro paciente";
      const exDate = new Date(exStart);
      const timeStr = exDate.toLocaleTimeString("es-VE", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      throw new Error(
        `Conflicto de horario: este especialista ya tiene una cita con ${pacName} a las ${timeStr}. Elige otra hora.`
      );
    }
  }
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  const { user } = useAuthSession();
  return useMutation({
    mutationFn: async (input: AppointmentInput) => {
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      const statusCheck = (input.status || "Programada").toLowerCase();
      if (statusCheck !== "cancelada") {
        await assertNoDoctorTimeConflict({
          doctorId: parseInt(input.doctor_id, 10),
          scheduledAt: input.scheduled_at,
          durationMinutes: input.duration_minutes || 30,
          clinicId,
        });
      }

      const citaInsertPayload: Record<string, any> = {
        id_paciente: parseInt(input.patient_id),
        id_medico: parseInt(input.doctor_id),
        fecha_hora: input.scheduled_at,
        motivo: input.reason,
        estado: input.status || 'Programada',
      };
      if (clinicId) {
        citaInsertPayload.id_clinica = clinicId;
      }

      const { error, data: citaData } = await supabase
        .from("citas")
        .insert(citaInsertPayload as any)
        .select()
        .single();
        
      if (error) throw error;

      if (citaData?.id_cita && Number(input.price) > 0) {
        saveStoredAppointmentPrice(citaData.id_cita, Number(input.price));
      }

      // La factura NO se crea al agendar en la agenda; ÚNICAMENTE se crea automáticamente cuando la consulta se completa
      const statusLower = (input.status || 'Programada').toLowerCase();
      const isCompleted = statusLower === 'completada' || Boolean(input.payment_method);

      if (isCompleted) {
        let finalPrice = Number(input.price) || 0;
        let matchedServiceId: number | null = null;

        let servQuery = supabase
          .from("servicios")
          .select("id_servicio, nombre_servicio, costo_base")
          .order("id_servicio", { ascending: true });
        if (clinicId) {
          servQuery = (servQuery as any).eq("id_clinica", clinicId);
        }
        const { data: allServices } = await servQuery;
        const servicesList = allServices || [];

        const matchedServ = resolveServiceFromReason(input.reason, servicesList);
        if (matchedServ) {
          matchedServiceId = matchedServ.id_servicio;
          if (finalPrice <= 0 && matchedServ.costo_base) {
            finalPrice = Number(matchedServ.costo_base);
          }
        }

        if (!matchedServiceId && servicesList.length > 0) {
          const defServ = servicesList[0];
          matchedServiceId = defServ.id_servicio;
          if (finalPrice <= 0 && defServ.costo_base) {
            finalPrice = Number(defServ.costo_base);
          }
        }

        if (finalPrice <= 0) {
          finalPrice = 35;
        }

        const invoiceDate = input.scheduled_at || new Date().toISOString();
        const facturaInsertPayload: Record<string, any> = {
          id_paciente: parseInt(input.patient_id),
          total_general: finalPrice,
          subtotal: finalPrice,
          monto_paciente: finalPrice,
          estado_pago: input.payment_method ? 'Pagada' : 'Pendiente',
          fecha_emision: invoiceDate,
        };
        if (clinicId) {
          facturaInsertPayload.id_clinica = clinicId;
        }

        const { data: newF } = await supabase
          .from("facturas")
          .insert(facturaInsertPayload as any)
          .select("id_factura")
          .single();

        if (newF?.id_factura && matchedServiceId) {
          const detPayload: Record<string, any> = {
            id_factura: newF.id_factura,
            id_servicio: matchedServiceId,
            cantidad: 1,
            precio_unitario: finalPrice,
            subtotal: finalPrice,
          };
          if (clinicId) {
            detPayload.id_clinica = clinicId;
          }
          await supabase.from("detalles_factura").insert(detPayload as any);
        }
      }
      
      await logAuditAction("CREATE", "APPOINTMENT", String(citaData.id_cita), {
        message: `Cita agendada: ${input.title || "Consulta médica"} (${input.status || "pendiente"})`,
      });

      return citaData;
    },
    onSuccess: (createdCita, input) => {
      if (createdCita?.id_cita) {
        const cachedPatients = qc.getQueriesData<any[]>({ queryKey: ["patients"] }).flatMap(([, d]) => (Array.isArray(d) ? d : []));
        const matchedPatient = cachedPatients.find((p) => String(p.id) === String(input.patient_id));
        const optimisticAppt: AppointmentWithPatient = {
          id: String(createdCita.id_cita),
          patient_id: String(input.patient_id),
          doctor_id: String(input.doctor_id),
          scheduled_at: input.scheduled_at,
          duration_minutes: input.duration_minutes || 30,
          status: (input.status || "programada").toLowerCase(),
          reason: input.reason ?? null,
          notes: input.notes ?? null,
          price: input.price ?? null,
          payment_method: input.payment_method ?? null,
          payment_reference: input.payment_reference ?? null,
          created_at: input.scheduled_at,
          updated_at: input.scheduled_at,
          patient_name: matchedPatient?.full_name || "Paciente",
          has_consultation: false,
        };
        qc.setQueriesData<AppointmentWithPatient[]>({ queryKey: ["appointments"] }, (old) =>
          Array.isArray(old) ? [optimisticAppt, ...old.filter((a) => a.id !== optimisticAppt.id)] : [optimisticAppt],
        );
      }
      if (!isDeviceOffline()) {
        qc.invalidateQueries({ queryKey: ["appointments"] });
        qc.invalidateQueries({ queryKey: ["facturas"] });
        qc.invalidateQueries({ queryKey: ["dashboard_top_treatments"] });
        qc.invalidateQueries({ queryKey: ["audit_logs"] });
      }
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<AppointmentInput> & { id: string }) => {
      const idCita = parseInt(id);

      if (patch.price !== undefined && patch.price !== null && Number(patch.price) > 0) {
        saveStoredAppointmentPrice(idCita, Number(patch.price));
      }

      // Fetch existing cita to get patient_id, motivo, and fecha_hora for Facturas
      const { data: existingCita } = await supabase
        .from("citas")
        .select("id_paciente, id_medico, motivo, fecha_hora, estado")
        .eq("id_cita", idCita)
        .single();

      // Validate doctor schedule conflict when changing date/time or doctor (unless cancelling)
      const nextStatus = (patch.status || existingCita?.estado || "").toLowerCase();
      if ((patch.scheduled_at || patch.doctor_id) && nextStatus !== "cancelada") {
        const nextDoctorId = patch.doctor_id
          ? parseInt(patch.doctor_id, 10)
          : Number(existingCita?.id_medico || 0);
        const nextScheduledAt = patch.scheduled_at || existingCita?.fecha_hora || "";
        await assertNoDoctorTimeConflict({
          doctorId: nextDoctorId,
          scheduledAt: nextScheduledAt,
          durationMinutes: patch.duration_minutes || 30,
          excludeCitaId: idCita,
        });
      }

      // 1. Update Citas table
      const updateData: any = {};
      if (patch.scheduled_at) updateData.fecha_hora = patch.scheduled_at;
      if (patch.reason) updateData.motivo = patch.reason;
      if (patch.status) updateData.estado = patch.status;
      if (patch.patient_id) updateData.id_paciente = parseInt(patch.patient_id);
      if (patch.doctor_id) updateData.id_medico = parseInt(patch.doctor_id);

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase.from("citas").update(updateData).eq("id_cita", idCita);
        if (error) throw error;
      }

      // 2. Handle Facturas and Pagos
      if (patch.price !== undefined || patch.payment_method !== undefined || patch.status !== undefined || patch.scheduled_at !== undefined) {
        let facturaId: number | undefined;
        const statusLower = (patch.status || existingCita?.estado || "").toLowerCase();
        const targetPatientId = patch.patient_id ? parseInt(patch.patient_id) : (existingCita?.id_paciente || 0);
        const { data: patientInvoices } = await supabase
          .from("facturas")
          .select("id_factura, total_general, estado_pago, fecha_emision")
          .eq("id_paciente", targetPatientId)
          .order("id_factura", { ascending: false });

        const invoicesList = patientInvoices || [];
        const citaTimestamp = patch.scheduled_at || existingCita?.fecha_hora;
        const existF = citaTimestamp
          ? invoicesList.find(f => f.fecha_emision === citaTimestamp)
          : null;

        // Lookup service for exact price and detalles_factura
        const { data: allServices } = await supabase
          .from("servicios")
          .select("id_servicio, nombre_servicio, costo_base")
          .order("id_servicio", { ascending: true });
        const servicesList = allServices || [];

        const reasonToSearch = patch.reason || existingCita?.motivo;
        const matchedServ = resolveServiceFromReason(reasonToSearch, servicesList);
        let matchedServiceId: number | null = matchedServ ? matchedServ.id_servicio : null;
        const serviceBasePrice = matchedServ?.costo_base ? Number(matchedServ.costo_base) : 0;
        const storedPrice = getStoredAppointmentPrice(idCita) || 0;
        const explicitPatchPrice = patch.price !== undefined && patch.price !== null && Number(patch.price) > 0
          ? Number(patch.price)
          : 0;

        let targetPrice =
          explicitPatchPrice ||
          storedPrice ||
          serviceBasePrice ||
          (existF && Number(existF.total_general) > 0 ? Number(existF.total_general) : 0);

        if (targetPrice <= 0 && statusLower === "completada") {
          targetPrice = servicesList[0]?.costo_base ? Number(servicesList[0].costo_base) : 35;
        }

        const existingPaid = ["pagada", "pagado", "paid"].includes((existF?.estado_pago || "").toLowerCase());
        // Al completarse la consulta, la factura se mantiene Pendiente hasta que se confirme cómo pagó el paciente
        let fEstado = (patch.payment_method || existingPaid) ? 'Pagada' : 'Pendiente';
        if (statusLower === 'cancelada') fEstado = 'Cancelada';

        if (existF) {
          facturaId = existF.id_factura;
          const facturaUpdate: any = {
            total_general: targetPrice,
            subtotal: targetPrice,
            monto_paciente: targetPrice,
            estado_pago: fEstado,
          };
          if (patch.scheduled_at) {
            facturaUpdate.fecha_emision = patch.scheduled_at;
          }
          await supabase.from("facturas").update(facturaUpdate).eq("id_factura", facturaId);
        } else {
          // La factura se crea ÚNICAMENTE si la consulta fue completada o si se ingresó un método de cobro
          const shouldCreateInvoice = statusLower === 'completada' || Boolean(patch.payment_method);
          if (shouldCreateInvoice) {
            const invoiceDate = existingCita?.fecha_hora || patch.scheduled_at || new Date().toISOString();
            const { data: newF, error: newFError } = await supabase.from("facturas").insert({
              id_paciente: targetPatientId,
              total_general: targetPrice,
              subtotal: targetPrice,
              monto_paciente: targetPrice,
              estado_pago: fEstado,
              fecha_emision: invoiceDate,
            }).select("id_factura").single();
            if (newFError) throw newFError;
            facturaId = newF?.id_factura;
          }
        }

        if (facturaId && targetPrice > 0) {
          if (!matchedServiceId && servicesList.length > 0) {
            matchedServiceId = servicesList[0].id_servicio;
          }

          if (matchedServiceId) {
            const { data: existDet } = await supabase
              .from("detalles_factura")
              .select("id_detalle")
              .eq("id_factura", facturaId)
              .maybeSingle();
            if (existDet) {
              await supabase
                .from("detalles_factura")
                .update({ id_servicio: matchedServiceId, precio_unitario: targetPrice, subtotal: targetPrice })
                .eq("id_detalle", existDet.id_detalle);
            } else {
              await supabase.from("detalles_factura").insert({
                id_factura: facturaId,
                id_servicio: matchedServiceId,
                cantidad: 1,
                precio_unitario: targetPrice,
                subtotal: targetPrice,
              });
            }
          }
        }

        // 3. Handle Pagos únicamente cuando se especifica un método de pago
        const effectivePaymentMethod = patch.payment_method || null;
        if (facturaId && effectivePaymentMethod) {
           const { data: existP } = await supabase
             .from("pagos")
             .select("id_pago, monto_pagado, metodo_pago")
             .eq("id_factura", facturaId)
             .maybeSingle();
           
           // Fetch the payment method to get its account_id
           const { data: pm } = await supabase.from("payment_methods").select("account_id").eq("name", effectivePaymentMethod).maybeSingle();
           const newAccountId = pm?.account_id;

           if (existP) {
              // Revert old account balance if it was a different method or different amount
              let oldAccountId = null;
              if (existP.metodo_pago !== effectivePaymentMethod && existP.metodo_pago) {
                 const { data: oldPm } = await supabase.from("payment_methods").select("account_id").eq("name", existP.metodo_pago).maybeSingle();
                 oldAccountId = oldPm?.account_id;
              } else {
                 oldAccountId = newAccountId;
              }

              if (oldAccountId) {
                 const { data: oldAcc } = await supabase.from("financial_accounts").select("balance").eq("id", oldAccountId).maybeSingle();
                 if (oldAcc) {
                    await supabase.from("financial_accounts").update({ balance: (oldAcc.balance || 0) - (existP.monto_pagado || 0) }).eq("id", oldAccountId);
                 }
              }

              // Add to new account balance
              if (newAccountId) {
                 const { data: newAcc } = await supabase.from("financial_accounts").select("balance").eq("id", newAccountId).maybeSingle();
                 if (newAcc) {
                    await supabase.from("financial_accounts").update({ balance: (newAcc.balance || 0) + targetPrice }).eq("id", newAccountId);
                 }
              }

              await supabase.from("pagos").update({ 
                metodo_pago: effectivePaymentMethod, 
                referencia: patch.payment_reference || null,
                monto_pagado: targetPrice
              }).eq("id_pago", existP.id_pago);
           } else {
              // Add to new account balance
              if (newAccountId) {
                 const { data: newAcc } = await supabase.from("financial_accounts").select("balance").eq("id", newAccountId).maybeSingle();
                 if (newAcc) {
                    await supabase.from("financial_accounts").update({ balance: (newAcc.balance || 0) + targetPrice }).eq("id", newAccountId);
                 }
              }

              await supabase.from("pagos").insert({
                id_factura: facturaId,
                metodo_pago: effectivePaymentMethod,
                referencia: patch.payment_reference || null,
                monto_pagado: targetPrice
              });
           }
        }
      }
      
      await logAuditAction("UPDATE", "APPOINTMENT", String(id), {
        message: `Cita #${id} actualizada${patch.status ? ` — Estado: ${patch.status}` : ""}`,
      });

      return { id };
    },
    onSuccess: (_res, vars) => {
      qc.setQueriesData<AppointmentWithPatient[]>({ queryKey: ["appointments"] }, (old) =>
        Array.isArray(old)
          ? old.map((a) =>
              a.id === vars.id
                ? {
                    ...a,
                    ...(vars.scheduled_at !== undefined ? { scheduled_at: vars.scheduled_at } : {}),
                    ...(vars.status !== undefined ? { status: vars.status.toLowerCase() } : {}),
                    ...(vars.reason !== undefined ? { reason: vars.reason } : {}),
                    ...(vars.doctor_id !== undefined ? { doctor_id: vars.doctor_id } : {}),
                    ...(vars.price !== undefined ? { price: vars.price } : {}),
                    ...(vars.payment_method !== undefined ? { payment_method: vars.payment_method } : {}),
                  }
                : a,
            )
          : old,
      );
      if (!isDeviceOffline()) {
        qc.invalidateQueries({ queryKey: ["appointments"], refetchType: "all" });
        qc.invalidateQueries({ queryKey: ["facturas"], refetchType: "all" });
        qc.invalidateQueries({ queryKey: ["financial_accounts"], refetchType: "all" });
        qc.invalidateQueries({ queryKey: ["dashboard_stats"], refetchType: "all" });
        qc.invalidateQueries({ queryKey: ["monthly_payments"], refetchType: "all" });
        qc.invalidateQueries({ queryKey: ["audit_logs"], refetchType: "all" });
      }
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete related consultas first to avoid foreign key constraint
      await supabase.from("consultas").delete().eq("id_cita", parseInt(id));

      const { error } = await supabase.from("citas").delete().eq("id_cita", parseInt(id));
      if (error) throw error;

      // Log audit action silently
      await logAuditAction("DELETE", "APPOINTMENT", id, { message: "Cita eliminada" });
    },
    onSuccess: (_data, deletedId) => {
      qc.setQueriesData<AppointmentWithPatient[]>({ queryKey: ["appointments"] }, (old) =>
        Array.isArray(old) ? old.filter((a) => a.id !== deletedId) : old,
      );
      if (!isDeviceOffline()) {
        qc.invalidateQueries({ queryKey: ["appointments"] });
      }
    },
  });
}
