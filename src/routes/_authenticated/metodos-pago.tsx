import { createFileRoute } from "@tanstack/react-router";
import { PaymentMethodsPage } from "@/components/finance/PaymentMethodsPage";
import { requireAdminAccess } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/metodos-pago")({
  beforeLoad: async () => {
    await requireAdminAccess();
  },
  head: () => ({ meta: [{ title: "Métodos de Pago — Medizen" }] }),
  component: PaymentMethodsPage,
});
