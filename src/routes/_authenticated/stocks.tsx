import { createFileRoute } from "@tanstack/react-router";
import { StocksPage } from "@/components/physical-asset/StocksPage";
import { requireAdminAccess } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/stocks")({
  head: () => ({ meta: [{ title: "Inventario — Medizen" }] }),
  beforeLoad: async () => {
    await requireAdminAccess();
  },
  component: StocksPage,
});
