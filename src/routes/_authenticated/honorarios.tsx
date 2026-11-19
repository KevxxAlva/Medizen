import { createFileRoute } from "@tanstack/react-router";
import { DoctorFeesPage } from "@/components/finance/DoctorFeesPage";

export const Route = createFileRoute("/_authenticated/honorarios")({
  head: () => ({ meta: [{ title: "Honorarios Médicos — FemeSalud" }] }),
  component: DoctorFeesPage,
});
