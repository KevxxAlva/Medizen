import {
  Boxes,
  Package,
  Layers,
  Syringe,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import type { StockItem } from "@/lib/api/inventory";

export const CATEGORY_MAP: Record<
  string,
  { label: string; icon: LucideIcon; color: string; bg: string }
> = {
  "Medical Supplies": {
    label: "Insumos Médicos",
    icon: Stethoscope,
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  Consumables: {
    label: "Material Descartable",
    icon: Syringe,
    color: "text-purple-500 dark:text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  Equipment: {
    label: "Equipos Médicos",
    icon: Package,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  Office: {
    label: "Papelería y Oficina",
    icon: Layers,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
};

export function getCategoryMeta(categoryName: string) {
  return (
    CATEGORY_MAP[categoryName] || {
      label: categoryName || "General",
      icon: Boxes,
      color: "text-slate-500 dark:text-slate-400",
      bg: "bg-slate-500/10 border-slate-500/20",
    }
  );
}

export function formatSku(id: string): string {
  if (!id) return "SKU-0000";
  if (id.includes("-")) {
    const parts = id.split("-");
    const prefix = parts[0].slice(0, 3).toUpperCase();
    const suffix = parts[parts.length - 1].slice(-4).toUpperCase();
    return `MED-${prefix}${suffix}`;
  }
  return id.length > 10 ? `SKU-${id.slice(-6).toUpperCase()}` : id.toUpperCase();
}

export interface StockStats {
  totalArticles: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  inStockCount: number;
}

export function computeStockStats(items: StockItem[]): StockStats {
  const totalArticles = items.length;
  const totalUnits = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  const lowStockCount = items.filter(
    (it) => it.status === "Low Stock" || (it.quantity > 0 && it.quantity <= 100),
  ).length;
  const outOfStockCount = items.filter(
    (it) => it.status === "Out of Stock" || it.quantity === 0,
  ).length;
  const inStockCount = items.filter(
    (it) => it.status === "In Stock" && it.quantity > 100,
  ).length;

  return { totalArticles, totalUnits, lowStockCount, outOfStockCount, inStockCount };
}

export type StockSortBy = "name" | "quantity-asc" | "quantity-desc";

export function filterAndSortStocks(
  items: StockItem[],
  q: string,
  filterCategory: string,
  filterStatus: string,
  sortBy: StockSortBy,
): StockItem[] {
  const result = items.filter((item) => {
    if (q) {
      const term = q.toLowerCase();
      const skuFormatted = formatSku(item.id).toLowerCase();
      const catMeta = getCategoryMeta(item.category);
      const matchName = item.name.toLowerCase().includes(term);
      const matchCat =
        item.category.toLowerCase().includes(term) ||
        catMeta.label.toLowerCase().includes(term);
      const matchSku = item.id.toLowerCase().includes(term) || skuFormatted.includes(term);
      if (!matchName && !matchCat && !matchSku) return false;
    }
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    if (filterStatus !== "all") {
      if (filterStatus === "In Stock" && (item.status !== "In Stock" || item.quantity <= 100)) {
        return false;
      }
      if (
        filterStatus === "Low Stock" &&
        item.status !== "Low Stock" &&
        !(item.quantity > 0 && item.quantity <= 100)
      ) {
        return false;
      }
      if (filterStatus === "Out of Stock" && item.status !== "Out of Stock" && item.quantity !== 0) {
        return false;
      }
    }
    return true;
  });

  result.sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "quantity-asc") return a.quantity - b.quantity;
    if (sortBy === "quantity-desc") return b.quantity - a.quantity;
    return 0;
  });

  return result;
}

export function buildStocksCsvUri(items: StockItem[]): string {
  const headers = ["ID", "SKU", "Nombre", "Categoría", "Cantidad", "Estado"];
  const rows = items.map((it) => [
    `"${it.id}"`,
    `"${formatSku(it.id)}"`,
    `"${it.name.replace(/"/g, '""')}"`,
    `"${getCategoryMeta(it.category).label}"`,
    it.quantity,
    `"${it.status === "In Stock" ? "En Stock" : it.status === "Low Stock" ? "Stock Bajo" : "Agotado"}"`,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  return encodeURI(csvContent);
}
