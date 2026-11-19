import { createFileRoute } from "@tanstack/react-router";
import { StocksPage } from "@/components/physical-asset/StocksPage";
import { requireAdminAccess } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/stocks")({
  beforeLoad: async () => {
    await requireAdminAccess();
  },
  head: () => ({ meta: [{ title: "Inventario — Medizen" }] }),
  component: StocksPage,
});
