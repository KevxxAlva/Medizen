import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RateType } from "@/hooks/useExchangeRate";

export type VePaymentCategory =
  | "Pago Móvil"
  | "Transferencia"
  | "Binance"
  | "Divisas"
  | "Efectivo"
  | "Cashea"
  | "Punto de Venta";

export interface PaymentMethodDetails {
  /** Código y nombre del banco en Venezuela (ej. "0134 - Banesco") */
  bank?: string;
  /** Teléfono afiliado a Pago Móvil (ej. "0414-1234567") */
  phone?: string;
  /** Cédula o RIF del titular (ej. "J-12345678-9" o "V-12345678") */
  documentId?: string;
  /** Número de cuenta bancaria de 20 dígitos para transferencias */
  accountNumber?: string;
  /** Tipo de cuenta bancaria */
  accountType?: "Corriente" | "Ahorro";
  /** Nombre o razón social del titular */
  holderName?: string;
  /** Correo o Binance ID (UID) para Binance Pay / USDT */
  binanceId?: string;
  /** Moneda principal en la que opera el método */
  currency?: "VES" | "USD" | "EUR" | "USDT";
  /** Tasa de cambio sugerida automáticamente al cobrar */
  defaultRateType?: RateType;
  /** Si solicita número de referencia / orden obligatoriamente */
  requiresReference?: boolean;
  /** Porcentaje de inicial por defecto para Cashea (40, 50 o 60) */
  casheaDefaultInitialPct?: number;
  /** Notas o instrucciones adicionales (ej. "Solo billetes en buen estado") */
  instructions?: string;
}

export type PaymentMethod = {
  id: string;
  name: string;
  category: string;
  account_id?: string;
  status: "Active" | "Inactive";
  details?: PaymentMethodDetails;
};

export const VENEZUELAN_BANKS = [
  { code: "0102", name: "Banco de Venezuela (BDV)" },
  { code: "0134", name: "Banesco Banco Universal" },
  { code: "0105", name: "Banco Mercantil" },
  { code: "0108", name: "BBVA Provincial" },
  { code: "0191", name: "Banco Nacional de Crédito (BNC)" },
  { code: "0172", name: "Bancamiga" },
  { code: "0114", name: "Bancaribe" },
  { code: "0151", name: "BFC Banco Fondo Común" },
  { code: "0163", name: "Banco del Tesoro" },
  { code: "0175", name: "Banco Bicentenario" },
  { code: "0138", name: "Banco Plaza" },
  { code: "0174", name: "Banplus" },
  { code: "0115", name: "Banco Exterior" },
  { code: "0128", name: "Banco Caroní" },
  { code: "0156", name: "100% Banco" },
  { code: "0168", name: "Bancrecer" },
  { code: "0171", name: "Banco Activo" },
  { code: "0177", name: "BANFANB" },
] as const;

export const VE_PAYMENT_PRESETS: Array<{
  name: string;
  category: VePaymentCategory;
  description: string;
  badgeColor: string;
  details: PaymentMethodDetails;
}> = [
  {
    name: "Pago Móvil",
    category: "Pago Móvil",
    description: "Cobro inmediato interbancario en Bolívares a tasa BCV",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    details: {
      currency: "VES",
      defaultRateType: "bcv",
      requiresReference: true,
      bank: "0134 - Banesco Banco Universal",
      phone: "",
      documentId: "",
      instructions: "Verificar los últimos 4 a 6 dígitos de la referencia bancaria.",
    },
  },
  {
    name: "Transferencia Bancaria",
    category: "Transferencia",
    description: "Transferencia en Bolívares (mismo banco o interbancaria) a tasa BCV",
    badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
    details: {
      currency: "VES",
      defaultRateType: "bcv",
      requiresReference: true,
      bank: "0134 - Banesco Banco Universal",
      accountNumber: "",
      accountType: "Corriente",
      documentId: "",
      holderName: "",
      instructions: "Confirmar acreditación en cuenta y registrar número de recibo.",
    },
  },
  {
    name: "Binance Pay (USDT)",
    category: "Binance",
    description: "Pago digital en criptomoneda estable USDT vía Binance Pay",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    details: {
      currency: "USDT",
      defaultRateType: "usdt",
      requiresReference: true,
      binanceId: "",
      holderName: "",
      instructions: "Registrar el Order ID de Binance Pay o captura de confirmación.",
    },
  },
  {
    name: "Divisas (Efectivo $ / €)",
    category: "Divisas",
    description: "Efectivo en moneda extranjera (Dólares USD o Euros EUR)",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    details: {
      currency: "USD",
      defaultRateType: "bcv",
      requiresReference: false,
      instructions: "Opcional: anotar denominación y seriales de billetes recibidos.",
    },
  },
  {
    name: "Efectivo (Bolívares)",
    category: "Efectivo",
    description: "Pago por taquilla/caja en Bolívares en efectivo",
    badgeColor: "bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400",
    details: {
      currency: "VES",
      defaultRateType: "bcv",
      requiresReference: false,
      instructions: "Recepción directa en caja chica en Bolívares.",
    },
  },
  {
    name: "Cashea",
    category: "Cashea",
    description: "Compra ahora y paga después: cobro de inicial + 3 cuotas sin interés",
    badgeColor: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20 dark:text-fuchsia-400",
    details: {
      currency: "USD",
      defaultRateType: "bcv",
      requiresReference: true,
      casheaDefaultInitialPct: 50,
      instructions: "Cobrar inicial en clínica según nivel del paciente (40%, 50% o 60%) y escanear QR Cashea.",
    },
  },
];

const DETAILS_STORAGE_KEY = "medizen_payment_methods_details_v1";
const CATEGORY_DELIMITER = ":::";

function readLocalDetailsMap(): Record<string, PaymentMethodDetails> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DETAILS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalDetails(key: string, details?: PaymentMethodDetails) {
  if (typeof window === "undefined" || !details) return;
  try {
    const current = readLocalDetailsMap();
    current[key] = details;
    localStorage.setItem(DETAILS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore storage errors
  }
}

export function inferCategoryFromMethod(name: string, rawCategory?: string): VePaymentCategory {
  const combined = `${name} ${rawCategory || ""}`.toLowerCase();
  if (combined.includes("pago móvil") || combined.includes("pago movil")) return "Pago Móvil";
  if (combined.includes("binance") || combined.includes("usdt") || combined.includes("crypto")) return "Binance";
  if (combined.includes("cashea")) return "Cashea";
  if (combined.includes("divisa") || combined.includes("efectivo usd") || combined.includes("efectivo eur") || combined.includes("dólar") || combined.includes("dolar")) return "Divisas";
  if (combined.includes("transferencia") || combined.includes("bank") || combined.includes("zelle")) return "Transferencia";
  if (combined.includes("punto") || combined.includes("tarjeta") || combined.includes("card")) return "Punto de Venta";
  if (combined.includes("efectivo") || combined.includes("cash") || combined.includes("bolívares") || combined.includes("bolivares")) return "Efectivo";
  return "Pago Móvil";
}

export function getDefaultDetailsForCategory(category: string, name = ""): PaymentMethodDetails {
  const inferred = inferCategoryFromMethod(name, category);
  const preset = VE_PAYMENT_PRESETS.find((p) => p.category === inferred);
  return preset ? { ...preset.details } : { currency: "VES", defaultRateType: "bcv", requiresReference: true };
}

function encodeCategoryWithDetails(category: string, details?: PaymentMethodDetails): string {
  const cleanCat = category.split(CATEGORY_DELIMITER)[0].trim();
  if (!details || Object.keys(details).length === 0) return cleanCat;
  try {
    return `${cleanCat}${CATEGORY_DELIMITER}${JSON.stringify(details)}`;
  } catch {
    return cleanCat;
  }
}

function decodeMethodRow(row: any): PaymentMethod {
  const rawCategory = String(row.category || "Pago Móvil");
  const [cleanCategory, encodedJson] = rawCategory.split(CATEGORY_DELIMITER);
  const localMap = readLocalDetailsMap();

  let parsedDetails: PaymentMethodDetails | undefined;
  if (encodedJson) {
    try {
      parsedDetails = JSON.parse(encodedJson);
    } catch {
      parsedDetails = undefined;
    }
  }

  const normalizedCategory = inferCategoryFromMethod(row.name || "", cleanCategory);
  const fallbackDetails = getDefaultDetailsForCategory(normalizedCategory, row.name || "");
  const storedByIdOrName = localMap[row.id] || localMap[row.name];

  const mergedDetails: PaymentMethodDetails = {
    ...fallbackDetails,
    ...(storedByIdOrName || {}),
    ...(parsedDetails || {}),
  };

  return {
    id: row.id,
    name: row.name,
    category: normalizedCategory,
    account_id: row.account_id || undefined,
    status: row.status === "Inactive" ? "Inactive" : "Active",
    details: mergedDetails,
  };
}

export function formatPaymentMethodCopyText(
  method: PaymentMethod,
  amountUsd?: number,
  rateBs?: number
): string {
  const d = method.details || getDefaultDetailsForCategory(method.category, method.name);
  const lines: string[] = [`Método: ${method.name}`];

  if (method.category === "Pago Móvil") {
    if (d.bank) lines.push(`Banco: ${d.bank}`);
    if (d.phone) lines.push(`Teléfono: ${d.phone}`);
    if (d.documentId) lines.push(`RIF / Cédula: ${d.documentId}`);
  } else if (method.category === "Transferencia") {
    if (d.bank) lines.push(`Banco: ${d.bank}`);
    if (d.accountNumber) lines.push(`Cuenta (${d.accountType || "Corriente"}): ${d.accountNumber}`);
    if (d.documentId) lines.push(`RIF / Cédula: ${d.documentId}`);
    if (d.holderName) lines.push(`Titular: ${d.holderName}`);
  } else if (method.category === "Binance") {
    if (d.binanceId) lines.push(`Binance ID / Correo: ${d.binanceId}`);
    if (d.holderName) lines.push(`Usuario: ${d.holderName}`);
  } else if (method.category === "Cashea") {
    lines.push(`Inicial sugerida: ${d.casheaDefaultInitialPct || 50}% + 3 cuotas sin interés`);
  }

  if (amountUsd !== undefined && amountUsd > 0) {
    if (d.currency === "VES" && rateBs && rateBs > 0) {
      const totalBs = (amountUsd * rateBs).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      lines.push(`Monto a pagar: Bs. ${totalBs} (Ref: $${amountUsd.toFixed(2)} a tasa Bs. ${rateBs.toFixed(2)})`);
    } else if (d.currency === "USDT") {
      lines.push(`Monto a enviar: ${amountUsd.toFixed(2)} USDT`);
    } else {
      lines.push(`Monto a pagar: $${amountUsd.toFixed(2)} USD`);
    }
  }

  return lines.join(" | ");
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment_methods"],
    queryFn: async (): Promise<PaymentMethod[]> => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []).map(decodeMethodRow);
    },
  });
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (method: Omit<PaymentMethod, "id">) => {
      const encodedCategory = encodeCategoryWithDetails(method.category, method.details);
      writeLocalDetails(method.name, method.details);

      let result = await supabase
        .from("payment_methods")
        .insert({
          name: method.name,
          category: encodedCategory,
          account_id: method.account_id || null,
          status: method.status,
        })
        .select()
        .single();

      if (result.error) {
        // Fallback if category column has a length constraint
        result = await supabase
          .from("payment_methods")
          .insert({
            name: method.name,
            category: method.category.split(CATEGORY_DELIMITER)[0].trim(),
            account_id: method.account_id || null,
            status: method.status,
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;
      if (result.data?.id && method.details) {
        writeLocalDetails(result.data.id, method.details);
      }
      return decodeMethodRow(result.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
    },
  });
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (method: PaymentMethod) => {
      const encodedCategory = encodeCategoryWithDetails(method.category, method.details);
      writeLocalDetails(method.id, method.details);
      writeLocalDetails(method.name, method.details);

      let result = await supabase
        .from("payment_methods")
        .update({
          name: method.name,
          category: encodedCategory,
          account_id: method.account_id || null,
          status: method.status,
        })
        .eq("id", method.id)
        .select()
        .single();

      if (result.error) {
        result = await supabase
          .from("payment_methods")
          .update({
            name: method.name,
            category: method.category.split(CATEGORY_DELIMITER)[0].trim(),
            account_id: method.account_id || null,
            status: method.status,
          })
          .eq("id", method.id)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      return decodeMethodRow(result.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
    },
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
      qc.invalidateQueries({ queryKey: ["financial_accounts"] });
    },
  });
}

export function useSeedVenezuelanPaymentMethods() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (existingMethods: PaymentMethod[]) => {
      const existingCategories = new Set(
        existingMethods.map((m) => inferCategoryFromMethod(m.name, m.category))
      );

      const toInsert = VE_PAYMENT_PRESETS.filter(
        (preset) => !existingCategories.has(preset.category)
      );

      if (toInsert.length === 0) return [];

      const created: PaymentMethod[] = [];
      for (const preset of toInsert) {
        const encodedCategory = encodeCategoryWithDetails(preset.category, preset.details);
        writeLocalDetails(preset.name, preset.details);

        let res = await supabase
          .from("payment_methods")
          .insert({
            name: preset.name,
            category: encodedCategory,
            account_id: null,
            status: "Active",
          })
          .select()
          .single();

        if (res.error) {
          res = await supabase
            .from("payment_methods")
            .insert({
              name: preset.name,
              category: preset.category,
              account_id: null,
              status: "Active",
            })
            .select()
            .single();
        }

        if (!res.error && res.data) {
          writeLocalDetails(res.data.id, preset.details);
          created.push(decodeMethodRow(res.data));
        }
      }
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
    },
  });
}
