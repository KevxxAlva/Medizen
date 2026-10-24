import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/api/audit";

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
  limit?: number;
  ascending?: boolean;
}

export function useAppointments(filters?: AppointmentFilters) {
  const queryKey = filters ? ["appointments", filters] : ["appointments"];
  return useQuery({
    queryKey,
    queryFn: async (): Promise<AppointmentWithPatient[]> => {
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

        if (filters?.from) {
          query = query.gte("fecha_hora", filters.from);
        }
        if (filters?.to) {
          query = query.lte("fecha_hora", filters.to + "T23:59:59.999Z");
        }
        if (filters?.status) {
          query = query.eq("estado", filters.status);
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
      const invoiceByPatientAndDate = new Map<string, any>();

      if (patientIds.length > 0) {
        // Chunk patientIds in batches of 50 to avoid URL length overflow
        const CHUNK_SIZE = 50;
        for (let i = 0; i < patientIds.length; i += CHUNK_SIZE) {
          const chunk = patientIds.slice(i, i + CHUNK_SIZE);
          let fQuery = supabase
            .from("facturas")
            .select("id_factura, id_paciente, total_general, estado_pago, fecha_emision, pagos(metodo_pago, referencia)")
            .in("id_paciente", chunk)
            .order("id_factura", { ascending: false });

          if (filters?.from) {
            fQuery = fQuery.gte("fecha_emision", filters.from);
          }
          if (filters?.to) {
            fQuery = fQuery.lte("fecha_emision", filters.to + "T23:59:59.999Z");
          }

          const { data: fData, error: fError } = await fQuery;
          if (!fError && fData) {
            for (const fac of fData) {
              const dStr = (fac.fecha_emision || "").split("T")[0];
              const key = `${fac.id_paciente}_${dStr}`;
              if (!invoiceByPatientAndDate.has(key)) {
                invoiceByPatientAndDate.set(key, fac);
              }
            }
          }
        }
      }

      return results.map((a: any) => {
        const citaDate = (a.fecha_hora || "").split('T')[0];
        const f = invoiceByPatientAndDate.get(`${a.id_paciente}_${citaDate}`);
        const pago = Array.isArray(f?.pagos) ? f.pagos[0] : f?.pagos;
        const isPaid = ["pagada", "pagado", "paid"].includes((f?.estado_pago || "").toLowerCase());
        
        return {
          id: a.id_cita.toString(),
          patient_id: a.id_paciente?.toString() || "",
          doctor_id: a.id_medico?.toString() || "",
          scheduled_at: a.fecha_hora,
          duration_minutes: 30, // mock duration
          status: a.estado?.toLowerCase() || "programada",
          reason: a.motivo,
          notes: null,
          price: f ? f.total_general : null,
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

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppointmentInput) => {
      const { error, data: citaData } = await supabase
        .from("citas")
        .insert({ 
          id_paciente: parseInt(input.patient_id),
          id_medico: parseInt(input.doctor_id),
          fecha_hora: input.scheduled_at,
          motivo: input.reason,
          estado: input.status || 'Programada'
        })
        .select()
        .single();
        
      if (error) throw error;

      // Handle price / invoice creation from service price or input
      let finalPrice = Number(input.price) || 0;
      let matchedServiceId: number | null = null;
      if (input.reason) {
        const { data: serv } = await supabase
          .from("servicios")
          .select("id_servicio, costo_base")
          .ilike("nombre_servicio", input.reason.trim())
          .maybeSingle();
        if (serv) {
          matchedServiceId = serv.id_servicio;
          if (finalPrice <= 0 && serv.costo_base) {
            finalPrice = Number(serv.costo_base);
          }
        }
      }

      if (finalPrice > 0) {
        const { data: newF } = await supabase
          .from("facturas")
          .insert({
            id_paciente: parseInt(input.patient_id),
            total_general: finalPrice,
            subtotal: finalPrice,
            monto_paciente: finalPrice,
            estado_pago: 'Pendiente',
            fecha_emision: input.scheduled_at || new Date().toISOString()
          })
          .select("id_factura")
          .single();

        if (newF?.id_factura && matchedServiceId) {
          await supabase.from("detalles_factura").insert({
            id_factura: newF.id_factura,
            id_servicio: matchedServiceId,
            cantidad: 1,
            precio_unitario: finalPrice,
            subtotal: finalPrice,
          });
        }
      }
      
      return citaData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["facturas"] });
      qc.invalidateQueries({ queryKey: ["dashboard_top_treatments"] });
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<AppointmentInput> & { id: string }) => {
      const idCita = parseInt(id);

      // Fetch existing cita to get patient_id, motivo, and fecha_hora for Facturas
      const { data: existingCita } = await supabase
        .from("citas")
        .select("id_paciente, motivo, fecha_hora")
        .eq("id_cita", idCita)
        .single();

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
        const targetPatientId = patch.patient_id ? parseInt(patch.patient_id) : (existingCita?.id_paciente || 0);
        const oldCitaDate = (existingCita?.fecha_hora || "").split('T')[0];
        const newCitaDate = (patch.scheduled_at || existingCita?.fecha_hora || new Date().toISOString()).split('T')[0];
        const today = new Date().toISOString().split('T')[0];

        const { data: patientInvoices } = await supabase
          .from("facturas")
          .select("id_factura, total_general, estado_pago, fecha_emision")
          .eq("id_paciente", targetPatientId)
          .order("id_factura", { ascending: false });

        const invoicesList = patientInvoices || [];
        const existF =
          invoicesList.find(f => oldCitaDate && (f.fecha_emision || "").startsWith(oldCitaDate)) ||
          invoicesList.find(f => newCitaDate && (f.fecha_emision || "").startsWith(newCitaDate)) ||
          invoicesList.find(f => (f.fecha_emision || "").startsWith(today)) ||
          null;
        
        let targetPrice = patch.price !== undefined && patch.price !== null ? Number(patch.price) : (existF ? Number(existF.total_general) : 0);

        // Lookup service for price fallback and detalles_factura
        let matchedServiceId: number | null = null;
        const reasonToSearch = patch.reason || existingCita?.motivo;
        if (reasonToSearch) {
          const { data: serv } = await supabase
            .from("servicios")
            .select("id_servicio, costo_base")
            .ilike("nombre_servicio", reasonToSearch.trim())
            .maybeSingle();
          if (serv) {
            matchedServiceId = serv.id_servicio;
            if (targetPrice <= 0 && serv.costo_base) {
              targetPrice = Number(serv.costo_base);
            }
          }
        }

        const statusLower = (patch.status || "").toLowerCase();
        const existingPaid = ["pagada", "pagado", "paid"].includes((existF?.estado_pago || "").toLowerCase());
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
          // Create invoice if price > 0, or payment is attempted, or appointment is completed
          if (targetPrice > 0 || patch.payment_method || statusLower === 'completada') {
            const { data: newF, error: newFError } = await supabase.from("facturas").insert({
              id_paciente: targetPatientId,
              total_general: targetPrice,
              subtotal: targetPrice,
              monto_paciente: targetPrice,
              estado_pago: fEstado,
              fecha_emision: patch.scheduled_at || existingCita?.fecha_hora || new Date().toISOString()
            }).select("id_factura").single();
            if (newFError) throw newFError;
            facturaId = newF?.id_factura;
          }
        }

        if (facturaId && matchedServiceId && targetPrice > 0) {
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

        // 3. Handle Pagos
        if (facturaId && patch.payment_method) {
           const { data: existP } = await supabase
             .from("pagos")
             .select("id_pago, monto_pagado, metodo_pago")
             .eq("id_factura", facturaId)
             .maybeSingle();
           
           // Fetch the payment method to get its account_id
           const { data: pm } = await supabase.from("payment_methods").select("account_id").eq("name", patch.payment_method).maybeSingle();
           const newAccountId = pm?.account_id;

           if (existP) {
              // Revert old account balance if it was a different method or different amount
              let oldAccountId = null;
              if (existP.metodo_pago !== patch.payment_method && existP.metodo_pago) {
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
                metodo_pago: patch.payment_method, 
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
                metodo_pago: patch.payment_method,
                referencia: patch.payment_reference || null,
                monto_pagado: targetPrice
              });
           }
        }
      }
      
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["facturas"] });
      qc.invalidateQueries({ queryKey: ["financial_accounts"] });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}
