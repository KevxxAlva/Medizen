import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/Dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Medizen" },
      { name: "description", content: "Panel de inicio del profesional de la salud." },
    ],
  }),
  component: Dashboard,
});
