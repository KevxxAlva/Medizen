import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/descargar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Descargar e Instalar — Medizen" },
      {
        name: "description",
        content:
          "Descarga e instala la aplicación oficial Medizen en tu PC, Mac, iPhone o Android para acceso directo y rápido.",
      },
    ],
  }),
  component: DescargarPageRoute,
});

function DescargarPageRoute() {
  return <LandingPage initialSection="descargar" />;
}
