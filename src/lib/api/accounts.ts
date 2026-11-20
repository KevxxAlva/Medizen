import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession, resolveCurrentUserClinicId } from "@/hooks/useAuth";
import { isDeviceOffline } from "@/lib/offline/networkState";
import { shouldServeLocalCacheOnly } from "@/lib/offline/syncEngine";
import {
  VE_PAYMENT_PRESETS,
  inferCategoryFromMethod,
  type PaymentMethod,
} from "@/lib/api/paymentMethods";

export type VeAccountCategory =
  | "Bank"
  | "Cash"
  | "CashVES"
  | "Digital"
  | "Cashea";

export interface AccountMetadata {
  currency?: "VES" | "USD" | "USDT" | "EUR";
  bankName?: string;
  accountNumber?: string;
  holderInfo?: string;
  notes?: string;
}

export type FinancialAccount = {
  id: string;
  name: string;
  type: string;
  balance: number;
  status: "Active" | "Inactive";
  meta?: AccountMetadata;
};

const ACCOUNT_META_STORAGE_KEY = "medizen_accounts_meta_v1";
const TYPE_DELIMITER = ":::";

export const VE_ACCOUNT_TYPES: Array<{
  value: VeAccountCategory;
  label: string;
  shortLabel: string;
  currency: "VES" | "USD" | "USDT";
  description: string;
  badgeClass: string;
}> = [
  {
    value: "Bank",
    label: "Banco Nacional (Bs. · Pago Móvil / Transferencia)",
    shortLabel: "Banco Nacional (Bs.)",
    currency: "VES",
    description: "Recibe cobros en Bolívares por Pago Móvil, Transferencia y Punto de Venta",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  {
    value: "Cash",
    label: "Caja Física Divisas (Efectivo $ USD / € EUR)",
    shortLabel: "Caja Divisas ($ / €)",
    currency: "USD",
    description: "Custodia de billetes físicos en Dólares ($) y Euros (€) en clínica",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
  {
    value: "CashVES",
    label: "Caja Física Bolívares (Efectivo Bs.)",
    shortLabel: "Caja Efectivo (Bs.)",
    currency: "VES",
    description: "Efectivo en Bolívares recibido directamente por taquilla",
    badgeClass: "bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400",
  },
  {
    value: "Digital",
    label: "Billetera Digital / Cripto (Binance USDT)",
    shortLabel: "Billetera Digital (USDT)",
    currency: "USDT",
    description: "Fondos digitales en Binance Pay (USDT) o billeteras electrónicas",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
  {
    value: "Cashea",
    label: "Cartera Financiada (Cashea — Cuotas por Liquidar)",
    shortLabel: "Financiamiento Cashea",
    currency: "USD",
    description: "Saldo financiado en cuotas sin interés pendiente de liquidación por Cashea",
    badgeClass: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20 dark:text-fuchsia-400",
  },
];

function readLocalAccountMeta(): Record<string, AccountMetadata> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ACCOUNT_META_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalAccountMeta(key: string, meta?: AccountMetadata) {
  if (typeof window === "undefined" || !meta) return;
  try {
    const map = readLocalAccountMeta();
    map[key] = meta;
    localStorage.setItem(ACCOUNT_META_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function normalizeAccountType(type: string, name = ""): VeAccountCategory {
  const cleanType = (type || "").split(TYPE_DELIMITER)[0].trim();
  const combined = `${cleanType} ${name}`.toLowerCase();

  if (cleanType === "Cashea" || combined.includes("cashea")) return "Cashea";
  if (cleanType === "CashVES" || combined.includes("efectivo bs") || combined.includes("bolívares") || combined.includes("bolivares")) {
    return "CashVES";
  }
  if (
    cleanType === "Digital" ||
    combined.includes("binance") ||
    combined.includes("usdt") ||
    combined.includes("zelle") ||
    combined.includes("digital") ||
    combined.includes("crypto")
  ) {
    return "Digital";
  }
  if (
    cleanType === "Cash" ||
    combined.includes("caja") ||
    combined.includes("divisa") ||
    combined.includes("cash") ||
    combined.includes("efectivo")
  ) {
    return "Cash";
  }
  return "Bank";
}

export function getAccountTypeInfo(type: string, name = "") {
  const norm = normalizeAccountType(type, name);
  return (
    VE_ACCOUNT_TYPES.find((t) => t.value === norm) || VE_ACCOUNT_TYPES[0]
  );
}

function encodeTypeWithMeta(type: string, meta?: AccountMetadata): string {
  const cleanType = (type || "Bank").split(TYPE_DELIMITER)[0].trim();
  if (!meta || Object.keys(meta).length === 0) return cleanType;
  try {
    return `${cleanType}${TYPE_DELIMITER}${JSON.stringify(meta)}`;
  } catch {
    return cleanType;
  }
}

function decodeAccountRow(row: any): FinancialAccount {
  const rawType = String(row.type || "Bank");
  const [cleanType, encodedJson] = rawType.split(TYPE_DELIMITER);
  const localMap = readLocalAccountMeta();

  let parsedMeta: AccountMetadata | undefined;
  if (encodedJson) {
    try {
      parsedMeta = JSON.parse(encodedJson);
    } catch {
      parsedMeta = undefined;
    }
  }

  const normType = normalizeAccountType(cleanType, row.name || "");
  const typeInfo = getAccountTypeInfo(normType, row.name || "");
  const storedMeta = localMap[row.id] || localMap[row.name];

  return {
    id: row.id,
    name: row.name,
    type: normType,
    balance: Number(row.balance) || 0,
    status: row.status === "Inactive" ? "Inactive" : "Active",
    meta: {
      currency: typeInfo.currency,
      ...(storedMeta || {}),
      ...(parsedMeta || {}),
    },
  };
}

export function useAccounts() {
  const { user } = useAuthSession();
  const qc = useQueryClient();
  const queryKey = ["financial_accounts", user?.id];
  return useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async (): Promise<FinancialAccount[]> => {
      if (shouldServeLocalCacheOnly()) {
        const cached = qc.getQueryData<FinancialAccount[]>(queryKey);
        if (Array.isArray(cached)) return cached;
      }
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      let query = supabase
        .from("financial_accounts")
        .select("*")
        .order("created_at", { ascending: true });
      if (clinicId) {
        query = (query as any).eq("id_clinica", clinicId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(decodeAccountRow);
    },
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  const { user } = useAuthSession();
  return useMutation({
    mutationFn: async (acc: Omit<FinancialAccount, "id">) => {
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      const encodedType = encodeTypeWithMeta(acc.type, acc.meta);
      writeLocalAccountMeta(acc.name, acc.meta);

      const safeDbType =
        acc.type === "CashVES"
          ? "Cash"
          : acc.type === "Cashea"
          ? "Digital"
          : acc.type;
      const dbType = encodedType.length <= 50 && !isDeviceOffline() ? encodedType : safeDbType;

      const basePayload: Record<string, any> = {
        name: acc.name,
        type: dbType,
        balance: acc.balance,
        status: acc.status,
      };
      if (clinicId) basePayload.id_clinica = clinicId;

      let res = await supabase
        .from("financial_accounts")
        .insert(basePayload as any)
        .select()
        .single();

      if (res.error) {
        // Fallback to standard Bank/Cash/Digital if DB has a check constraint on type
        const safeDbType =
          acc.type === "CashVES"
            ? "Cash"
            : acc.type === "Cashea"
            ? "Digital"
            : acc.type;
        const fallbackPayload: Record<string, any> = {
          name: acc.name,
          type: safeDbType,
          balance: acc.balance,
          status: acc.status,
        };
        if (clinicId) fallbackPayload.id_clinica = clinicId;
        res = await supabase
          .from("financial_accounts")
          .insert(fallbackPayload as any)
          .select()
          .single();
      }

      if (res.error) throw res.error;
      if (res.data?.id && acc.meta) {
        writeLocalAccountMeta(res.data.id, acc.meta);
      }
      return decodeAccountRow(res.data);
    },
    onSuccess: (created) => {
      if (created) {
        qc.setQueriesData<FinancialAccount[]>({ queryKey: ["financial_accounts"] }, (old) =>
          Array.isArray(old) ? [...old.filter((a) => a.id !== created.id), created] : [created],
        );
      }
      if (!isDeviceOffline()) {
        qc.invalidateQueries({ queryKey: ["financial_accounts"] });
      }
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (acc: FinancialAccount) => {
      const encodedType = encodeTypeWithMeta(acc.type, acc.meta);
      writeLocalAccountMeta(acc.id, acc.meta);
      writeLocalAccountMeta(acc.name, acc.meta);

      const safeDbType =
        acc.type === "CashVES"
          ? "Cash"
          : acc.type === "Cashea"
          ? "Digital"
          : acc.type;
      const dbType = encodedType.length <= 50 && !isDeviceOffline() ? encodedType : safeDbType;

      let res = await supabase
        .from("financial_accounts")
        .update({
          name: acc.name,
          type: dbType,
          balance: acc.balance,
          status: acc.status,
        })
        .eq("id", acc.id)
        .select()
        .single();

      if (res.error) {
        const safeDbType =
          acc.type === "CashVES"
            ? "Cash"
            : acc.type === "Cashea"
            ? "Digital"
            : acc.type;
        res = await supabase
          .from("financial_accounts")
          .update({
            name: acc.name,
            type: safeDbType,
            balance: acc.balance,
            status: acc.status,
          })
          .eq("id", acc.id)
          .select()
          .single();
      }

      if (res.error) throw res.error;
      return decodeAccountRow(res.data);
    },
    onSuccess: (updated, vars) => {
      const merged = updated || vars;
      qc.setQueriesData<FinancialAccount[]>({ queryKey: ["financial_accounts"] }, (old) =>
        Array.isArray(old) ? old.map((a) => (a.id === vars.id ? { ...a, ...merged } : a)) : old,
      );
      if (!isDeviceOffline()) {
        qc.invalidateQueries({ queryKey: ["financial_accounts"] });
      }
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Desvincular primero cualquier método de pago que apunte a esta cuenta
      // para evitar el error de clave foránea (payment_methods_account_id_fkey)
      const { error: unlinkError } = await supabase
        .from("payment_methods")
        .update({ account_id: null })
        .eq("account_id", id);

      if (unlinkError) {
        console.warn("Advertencia al desvincular métodos de pago:", unlinkError.message);
      }

      // 2. Eliminar la cuenta financiera
      const { error } = await supabase
        .from("financial_accounts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, deletedId) => {
      qc.setQueriesData<FinancialAccount[]>({ queryKey: ["financial_accounts"] }, (old) =>
        Array.isArray(old) ? old.filter((a) => a.id !== deletedId) : old,
      );
      qc.setQueriesData<any[]>({ queryKey: ["payment_methods"] }, (old) =>
        Array.isArray(old)
          ? old.map((m) => (m.account_id === deletedId ? { ...m, account_id: null } : m))
          : old,
      );
      if (!isDeviceOffline()) {
        qc.invalidateQueries({ queryKey: ["financial_accounts"] });
        qc.invalidateQueries({ queryKey: ["payment_methods"] });
      }
    },
  });
}

/**
 * Sincroniza las Cuentas Financieras de Venezuela y vincula automáticamente
 * los 6 métodos de pago (Efectivo, Pago Móvil, Transferencia, Binance, Divisas y Cashea)
 * a su cuenta correspondiente.
 */
export function useSyncVenezuelanAccountsAndMethods() {
  const qc = useQueryClient();
  const { user } = useAuthSession();
  return useMutation({
    mutationFn: async ({
      accounts,
      methods,
    }: {
      accounts: FinancialAccount[];
      methods: PaymentMethod[];
    }) => {
      const clinicId = await resolveCurrentUserClinicId(user?.id);
      const currentAccounts = [...accounts];

      const ensureAccount = async (
        targetType: VeAccountCategory,
        defaultName: string,
        meta: AccountMetadata
      ): Promise<FinancialAccount | null> => {
        const existing = currentAccounts.find(
          (a) => normalizeAccountType(a.type, a.name) === targetType
        );
        if (existing) return existing;

        const encodedType = encodeTypeWithMeta(targetType, meta);
        writeLocalAccountMeta(defaultName, meta);

        const safeDbType =
          targetType === "CashVES"
            ? "Cash"
            : targetType === "Cashea"
            ? "Digital"
            : targetType;
        const dbType = encodedType.length <= 50 && !isDeviceOffline() ? encodedType : safeDbType;

        const basePayload: Record<string, any> = {
          name: defaultName,
          type: dbType,
          balance: 0,
          status: "Active",
        };
        if (clinicId) basePayload.id_clinica = clinicId;

        let res = await supabase
          .from("financial_accounts")
          .insert(basePayload as any)
          .select()
          .single();

        if (res.error) {
          const safeDbType =
            targetType === "CashVES"
              ? "Cash"
              : targetType === "Cashea"
              ? "Digital"
              : targetType;
          const fallbackPayload: Record<string, any> = {
            name: defaultName,
            type: safeDbType,
            balance: 0,
            status: "Active",
          };
          if (clinicId) fallbackPayload.id_clinica = clinicId;
          res = await supabase
            .from("financial_accounts")
            .insert(fallbackPayload as any)
            .select()
            .single();
        }

        if (!res.error && res.data) {
          writeLocalAccountMeta(res.data.id, meta);
          const decoded = decodeAccountRow(res.data);
          currentAccounts.push(decoded);
          return decoded;
        }
        return null;
      };

      // 1. Asegurar las cuentas clave para Venezuela
      const [bankAcc, cashUsdAcc, cashVesAcc, binanceAcc, casheaAcc] = await Promise.all([
        ensureAccount("Bank", "Cuenta Bancaria Nacional (Bs.)", {
          currency: "VES",
          notes: "Recibe Pago Móvil, Transferencias y Punto de Venta",
        }),
        ensureAccount("Cash", "Caja Clínica Divisas ($)", {
          currency: "USD",
          notes: "Efectivo en Dólares ($) y Euros (€)",
        }),
        ensureAccount("CashVES", "Caja Efectivo Bolívares (Bs.)", {
          currency: "VES",
          notes: "Efectivo físico en Bolívares",
        }),
        ensureAccount("Digital", "Billetera Binance Pay (USDT)", {
          currency: "USDT",
          notes: "Pagos recibidos en USDT vía Binance Pay",
        }),
        ensureAccount("Cashea", "Cartera Cashea (Cuotas)", {
          currency: "USD",
          notes: "Cuotas financiadas por Cashea pendientes de liquidación",
        }),
      ]);

      const categoryToAccountMap: Record<string, string | undefined> = {
        "Pago Móvil": bankAcc?.id,
        Transferencia: bankAcc?.id,
        "Punto de Venta": bankAcc?.id,
        Divisas: cashUsdAcc?.id,
        Efectivo: cashVesAcc?.id || cashUsdAcc?.id,
        Binance: binanceAcc?.id,
        Cashea: casheaAcc?.id,
      };

      // 2. Crear los métodos de Venezuela que falten y vincular todos a su cuenta
      const nextMethods: PaymentMethod[] = [...methods];
      const existingByCat = new Map<string, PaymentMethod>();
      for (const m of nextMethods) {
        const cat = inferCategoryFromMethod(m.name, m.category);
        if (!existingByCat.has(cat)) {
          existingByCat.set(cat, m);
        }
      }

      const presetSyncPromises = VE_PAYMENT_PRESETS.map(async (preset) => {
        const targetAccId = categoryToAccountMap[preset.category];
        const existingMethod = existingByCat.get(preset.category);

        if (!existingMethod) {
          const insertPayload: Record<string, any> = {
            name: preset.name,
            category: preset.category,
            account_id: targetAccId || null,
            status: "Active",
          };
          if (clinicId) insertPayload.id_clinica = clinicId;
          const res = await supabase
            .from("payment_methods")
            .insert(insertPayload as any)
            .select()
            .single();
          if (!res.error && res.data) {
            nextMethods.push({
              id: res.data.id,
              name: res.data.name,
              category: preset.category,
              account_id: targetAccId || null,
              status: "Active",
              details: preset.details,
            });
          }
          return res;
        } else if (!existingMethod.account_id && targetAccId) {
          existingMethod.account_id = targetAccId;
          return supabase
            .from("payment_methods")
            .update({ account_id: targetAccId })
            .eq("id", existingMethod.id);
        }
      });
      await Promise.all(presetSyncPromises);

      // También vincular cualquier otro método existente sin cuenta
      const unlinkedSyncPromises = nextMethods
        .filter((m) => !m.account_id)
        .map(async (m) => {
          const cat = inferCategoryFromMethod(m.name, m.category);
          const targetAccId = categoryToAccountMap[cat];
          if (targetAccId) {
            m.account_id = targetAccId;
            return supabase
              .from("payment_methods")
              .update({ account_id: targetAccId })
              .eq("id", m.id);
          }
        });
      await Promise.all(unlinkedSyncPromises);

      return { accounts: currentAccounts, methods: nextMethods };
    },
    onSuccess: (result) => {
      if (result) {
        qc.setQueriesData<FinancialAccount[]>({ queryKey: ["financial_accounts"] }, () => result.accounts);
        qc.setQueriesData<PaymentMethod[]>({ queryKey: ["payment_methods"] }, () => result.methods);
      }
      if (!shouldServeLocalCacheOnly()) {
        qc.invalidateQueries({ queryKey: ["financial_accounts"] });
        qc.invalidateQueries({ queryKey: ["payment_methods"] });
      }
    },
  });
}
