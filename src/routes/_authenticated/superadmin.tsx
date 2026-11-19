import { createFileRoute } from "@tanstack/react-router";
import { SuperAdminPage } from "@/components/superadmin/SuperAdminPage";

export const Route = createFileRoute("/_authenticated/superadmin")({
  head: () => ({ meta: [{ title: "Super Administrador — Medizen SaaS" }] }),
  component: SuperAdminPage,
});
