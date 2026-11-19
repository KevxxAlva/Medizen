import { createFileRoute } from "@tanstack/react-router";
import { WaitingRoomPage } from "@/components/waiting-room/WaitingRoomPage";

export const Route = createFileRoute("/_authenticated/sala-espera")({
  head: () => ({ meta: [{ title: "Sala de Espera — FemeSalud" }] }),
  component: WaitingRoomPage,
});
