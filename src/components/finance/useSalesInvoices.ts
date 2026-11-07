import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/api/audit";
import { inferCategoryFromMethod } from "@/lib/api/paymentMethods";
import type { RateType } from "@/hooks/useExchangeRate";
import type { Invoice } from "./ViewInvoiceDialog";

async function creditAccountForMethod(targetMethodName: string, usdAmount: number) {
  if (!usdAmount || usdAmount <= 0) return;
  const [{ data: allMethods }, { data: allAccounts }] = await Promise.all([
    supabase.from("payment_methods").select("name, category, account_id"),
    supabase.from("financial_accounts").select("id, name, type, balance"),
  ]);

  if (!allAccounts || allAccounts.length === 0) return;

  const targetCategory = inferCategoryFromMethod(targetMethodName, targetMethodName);

  let targetAccount = null;
  const matchingMethod = (allMethods || []).find((m) => m.name === targetMethodName);
  if (matchingMethod?.account_id) {
    targetAccount = allAccounts.find((a) => a.id === matchingMethod.account_id);
  }

  if (!targetAccount) {
    targetAccount = allAccounts.find((a) => {
      const norm = (a.name || "").toLowerCase();
      if (
        targetCategory === "Pago Móvil" ||
        targetCategory === "Transferencia" ||
        targetCategory === "Punto de Venta"
      ) {
        return norm.includes("banc") || a.type === "Bank";
      }
      if (targetCategory === "Divisas") {
        return norm.includes("divisa") || norm.includes("dólar") || a.type === "Cash";
      }
      if (targetCategory === "Efectivo") {
        return norm.includes("efectivo") || a.type === "CashVES" || a.type === "Cash";
      }
      if (targetCategory === "Binance") {
        return norm.includes("binance") || a.type === "Digital";
      }
      if (targetCategory === "Cashea") return norm.includes("cashea");
      return false;
    });
  }

  if (!targetAccount) {
    targetAccount = allAccounts[0];
  }

  if (targetAccount) {
    const newBalance = Number((Number(targetAccount.balance || 0) + usdAmount).toFixed(2));
    await supabase
      .from("financial_accounts")
      .update({ balance: newBalance })
      .eq("id", targetAccount.id);
  }
}

export function useSalesInvoices() {
  const queryClient = useQueryClient();

  const { data: facturas = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["facturas"],
    staleTime: 0, // Inmediato: siempre evaluar datos frescos
    refetchOnMount: "always", // Cada vez que el usuario abre Ventas, consultar de inmediato a Supabase
    refetchOnWindowFocus: true, // Si regresa a la pestaña o ventana, refresca
    refetchInterval: 5000, // Sincronización en tiempo real cada 5 segundos
    queryFn: async () => {
      const [{ data, error }, { data: allServices }, { data: recentCitas }] = await Promise.all([
        supabase
          .from("facturas")
          .select(`
            id_factura, 
            id_paciente,
            fecha_emision,
            subtotal,
            monto_paciente,
            total_general,
            estado_pago,
            pacientes (nombre, apellido),
            pagos (id_pago, metodo_pago, referencia, monto_pagado, fecha_pago),
            detalles_factura (
              id_detalle,
              id_servicio,
              cantidad,
              precio_unitario,
              subtotal,
              servicios (nombre_servicio)
            )
          `)
          .order("id_factura", { ascending: false }),
        supabase.from("servicios").select("id_servicio, nombre_servicio, costo_base"),
        supabase
          .from("citas")
          .select("id_cita, id_paciente, id_medico, fecha_hora, motivo, medicos(nombre, apellido, especialidades(nombre))")
          .or("motivo.is.null,motivo.not.ilike.%[TEST-LOAD]%")
          .order("fecha_hora", { ascending: false })
          .limit(500),
      ]);

      if (error) throw error;

      const mapped = (data || []).map((f: any) => {
        const pago = Array.isArray(f.pagos) ? f.pagos[0] : f.pagos;

        // 1. Obtener items desde detalles_factura si existen
        let items: any[] = [];
        if (Array.isArray(f.detalles_factura) && f.detalles_factura.length > 0) {
          items = f.detalles_factura.map((d: any) => {
            const servName =
              d.servicios?.nombre_servicio ||
              allServices?.find((s: any) => s.id_servicio === d.id_servicio)?.nombre_servicio ||
              null;
            return {
              id: d.id_detalle,
              descripcion: servName,
              cantidad: Number(d.cantidad) || 1,
              precio_unitario: Number(d.precio_unitario) || Number(d.subtotal) || 0,
              subtotal: Number(d.subtotal) || Number(d.precio_unitario) || 0,
            };
          }).filter((it: any) => Boolean(it.descripcion));
        }

        // 2. Determinar el concepto principal
        let concepto: string | null = null;
        if (items.length > 0) {
          concepto = items.map((i) => i.descripcion).join(", ");
        }

        // 3. Si no hay concepto en detalles_factura, buscar en citas del paciente por cercanía temporal
        if (!concepto && f.id_paciente && recentCitas) {
          const patientCitas = recentCitas.filter((c: any) => Number(c.id_paciente) === Number(f.id_paciente));
          if (patientCitas.length > 0) {
            const fTime = f.fecha_emision ? new Date(f.fecha_emision).getTime() : 0;
            let bestCita: any = null;
            let minDiff = Infinity;
            for (const c of patientCitas) {
              const cTime = c.fecha_hora ? new Date(c.fecha_hora).getTime() : 0;
              const diff = Math.abs(cTime - fTime);
              if (diff < minDiff) {
                minDiff = diff;
                bestCita = c;
              }
            }

            if (bestCita) {
              const mot = (bestCita.motivo || "").trim();
              if (mot && !mot.toLowerCase().includes("[test-load]")) {
                concepto = mot;
              } else if (bestCita.medicos?.especialidades?.nombre) {
                concepto = `Consulta de ${bestCita.medicos.especialidades.nombre}`;
              } else if (bestCita.medicos?.nombre) {
                concepto = `Consulta con Dr(a). ${bestCita.medicos.nombre} ${bestCita.medicos.apellido || ""}`.trim();
              }
            }
          }
        }

        // 4. Si aún no hay concepto, deducir por el monto exacto del servicio en catálogo
        if (!concepto && allServices && allServices.length > 0) {
          const matchedByPrice = allServices.find(
            (s: any) => Math.abs(Number(s.costo_base) - Number(f.total_general)) < 0.01
          );
          if (matchedByPrice?.nombre_servicio) {
            concepto = matchedByPrice.nombre_servicio;
          }
        }

        // 5. Fallback a primer servicio disponible en catálogo o nombre descriptivo
        if (!concepto) {
          const firstService = allServices?.[0]?.nombre_servicio;
          concepto = firstService || "Consulta Médica Especializada";
        }

        if (items.length === 0) {
          items = [
            {
              descripcion: concepto,
              cantidad: 1,
              precio_unitario: Number(f.total_general) || 0,
              subtotal: Number(f.total_general) || 0,
            },
          ];
        } else {
          // Si algún item tenía descripción vacía o genérica, completarlo con el concepto
          items = items.map((it) => ({
            ...it,
            descripcion: (!it.descripcion || it.descripcion === "Servicio Médico") ? concepto! : it.descripcion,
          }));
        }

        return {
          id_factura: f.id_factura,
          id_paciente: f.id_paciente,
          paciente_nombre: f.pacientes
            ? `${f.pacientes.nombre} ${f.pacientes.apellido}`
            : "Paciente Desconocido",
          fecha_emision: f.fecha_emision,
          subtotal: f.subtotal,
          monto_paciente: f.monto_paciente,
          total_general: f.total_general,
          estado_pago: f.estado_pago || "Pendiente",
          metodo_pago: pago?.metodo_pago || null,
          referencia: pago?.referencia || null,
          concepto,
          items,
        };
      }) as Invoice[];

      // Garantizar orden descendente: las facturas más recientes arriba siempre
      return mapped.sort((a, b) => (b.id_factura || 0) - (a.id_factura || 0));
    },
  });

  const updatePaymentStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      method,
      reference,
      usdAmount,
    }: {
      id: number;
      status: string;
      method?: string;
      reference?: string;
      usedRate?: number;
      usedRateType?: RateType;
      usdAmount?: number;
    }) => {
      const { error: facturaError } = await supabase
        .from("facturas")
        .update({ estado_pago: status })
        .eq("id_factura", id);

      if (facturaError) throw facturaError;

      if (status === "Pagado" && method) {
        const { data: existingPagos } = await supabase
          .from("pagos")
          .select("id_pago")
          .eq("id_factura", id);

        if (existingPagos && existingPagos.length > 0) {
          await supabase
            .from("pagos")
            .update({
              metodo_pago: method,
              referencia: reference || null,
              monto_pagado: usdAmount || 0,
              fecha_pago: new Date().toISOString(),
            })
            .eq("id_factura", id);
        } else {
          await supabase.from("pagos").insert({
            id_factura: id,
            monto_pagado: usdAmount || 0,
            fecha_pago: new Date().toISOString(),
            metodo_pago: method,
            referencia: reference || null,
          });
        }

        if (usdAmount && usdAmount > 0) {
          await creditAccountForMethod(method, usdAmount);
        }
      }

      await logAuditAction("UPDATE", "INVOICE", id.toString(), {
        message: `Factura INV-${id.toString().padStart(4, "0")} actualizada a ${status}`,
        estado_pago: status,
        metodo_pago: method || null,
        referencia: reference || null,
        monto_usd: usdAmount || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["financial_accounts"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["monthly_payments"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["dashboard_trends"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["appointments"], refetchType: "all" });
      toast.success("Factura cobrada y conciliada exitosamente");
    },
    onError: () => {
      toast.error("Error al actualizar la factura");
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("facturas").delete().eq("id_factura", id);
      if (error) throw error;
      await logAuditAction("DELETE", "INVOICE", id.toString(), {
        message: `Factura INV-${id.toString().padStart(4, "0")} eliminada`,
      });
      return id;
    },
    onSuccess: (id) => {
      toast.success(`Factura INV-${id.toString().padStart(4, "0")} eliminada`);
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      queryClient.invalidateQueries({ queryKey: ["financial_accounts"] });
    },
    onError: () => {
      toast.error("No se pudo eliminar la factura");
    },
  });

  return {
    facturas,
    isLoading,
    isFetching,
    refetch,
    updatePaymentStatus,
    deleteInvoice,
  };
}

export type InvoiceSortField =
  | "id_factura"
  | "fecha_emision"
  | "paciente_nombre"
  | "total_general"
  | "estado_pago";

export type SortDirection = "asc" | "desc";

export function useSalesFilteredStats({
  facturas,
  q,
  filterMonth,
  filterStatus,
  filterMethod,
  sortField = "id_factura",
  sortDirection = "desc",
}: {
  facturas: Invoice[];
  q: string;
  filterMonth: string;
  filterStatus: string;
  filterMethod: string;
  sortField?: InvoiceSortField;
  sortDirection?: SortDirection;
}) {
  const filtered = useMemo(() => {
    const list = facturas.filter((f) => {
      if (q) {
        const term = q.toLowerCase();
        const numStr = `inv-${f.id_factura.toString().padStart(4, "0")}`;
        const matchName = f.paciente_nombre?.toLowerCase().includes(term);
        const matchNum = numStr.includes(term) || f.id_factura.toString().includes(term);
        const matchRef = f.referencia?.toLowerCase().includes(term);
        if (!matchName && !matchNum && !matchRef) return false;
      }
      if (filterMonth && !f.fecha_emision.startsWith(filterMonth)) {
        return false;
      }
      if (filterStatus !== "all" && f.estado_pago.toLowerCase() !== filterStatus.toLowerCase()) {
        return false;
      }
      if (filterMethod !== "all") {
        const rawMethod = (f.metodo_pago || "").toLowerCase();
        const selectedCat = filterMethod.toLowerCase();
        const normalizedCat = f.metodo_pago
          ? inferCategoryFromMethod(f.metodo_pago, f.metodo_pago).toLowerCase()
          : "";
        if (!rawMethod.includes(selectedCat) && normalizedCat !== selectedCat) {
          return false;
        }
      }
      return true;
    });

    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === "id_factura") {
        comparison = (a.id_factura || 0) - (b.id_factura || 0);
      } else if (sortField === "fecha_emision") {
        const timeA = new Date(a.fecha_emision).getTime() || 0;
        const timeB = new Date(b.fecha_emision).getTime() || 0;
        comparison = timeA - timeB;
        if (comparison === 0) {
          comparison = (a.id_factura || 0) - (b.id_factura || 0);
        }
      } else if (sortField === "paciente_nombre") {
        comparison = (a.paciente_nombre || "").localeCompare(b.paciente_nombre || "");
      } else if (sortField === "total_general") {
        comparison = (Number(a.total_general) || 0) - (Number(b.total_general) || 0);
      } else if (sortField === "estado_pago") {
        comparison = (a.estado_pago || "").localeCompare(b.estado_pago || "");
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [facturas, q, filterMonth, filterStatus, filterMethod, sortField, sortDirection]);

  const kpiStats = useMemo(() => {
    let paidTotal = 0;
    let paidCount = 0;
    let pendingTotal = 0;
    let pendingCount = 0;
    let totalEmitted = 0;
    let activeCount = 0;

    for (const f of facturas) {
      const st = f.estado_pago.toLowerCase();
      const amt = Number(f.total_general) || 0;
      if (st === "cancelado" || st === "cancelada") continue;
      activeCount += 1;
      totalEmitted += amt;
      if (st === "pagado" || st === "pagada") {
        paidTotal += amt;
        paidCount += 1;
      } else {
        pendingTotal += amt;
        pendingCount += 1;
      }
    }
    const avgTicket = activeCount > 0 ? totalEmitted / activeCount : 0;
    return {
      paidTotal,
      paidCount,
      pendingTotal,
      pendingCount,
      totalEmitted,
      activeCount,
      avgTicket,
    };
  }, [facturas]);

  return { filtered, kpiStats };
}
