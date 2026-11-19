import { createFileRoute } from "@tanstack/react-router";
import { AccountsPage } from "@/components/finance/AccountsPage";
import { requireAdminAccess } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/cuentas")({
  beforeLoad: async () => {
    await requireAdminAccess();
  },
  head: () => ({ meta: [{ title: "Cuentas — Medizen" }] }),
  component: AccountsPage,
});
