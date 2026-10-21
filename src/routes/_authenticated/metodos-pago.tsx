import { createFileRoute } from "@tanstack/react-router";
import { PaymentMethodsPage } from "@/components/finance/PaymentMethodsPage";
import { requireAdminAccess } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/metodos-pago")({
  head: () => ({ meta: [{ title: "Métodos de Pago — Medizen" }] }),
  beforeLoad: async () => {
    await requireAdminAccess();
  },
  component: PaymentMethodsPage,
});
