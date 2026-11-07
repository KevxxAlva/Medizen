import { createFileRoute } from "@tanstack/react-router";
import { AuditLogsPage } from "@/components/audit/AuditLogsPage";

export const Route = createFileRoute("/_authenticated/auditoria")({
  head: () => ({ meta: [{ title: "Auditoría — FemeSalud" }] }),
  component: AuditLogsPage,
});
