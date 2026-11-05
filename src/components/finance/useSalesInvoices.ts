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
      const { data, error } = await supabase
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
          pagos (id_pago, metodo_pago, referencia, monto_pagado, fecha_pago)
        `)
        .order("id_factura", { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((f: any) => {
        const pago = Array.isArray(f.pagos) ? f.pagos[0] : f.pagos;
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

      await logAuditAction({
        action: "UPDATE",
        table_name: "facturas",
        record_id: id.toString(),
        new_data: { estado_pago: status, metodo_pago: method, referencia: reference },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      queryClient.invalidateQueries({ queryKey: ["financial_accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
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
