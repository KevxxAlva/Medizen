import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getEffectiveSession } from "@/lib/offline/offlineAuth";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medizen — Suite Clínica Inteligente" },
      {
        name: "description",
        content:
          "Plataforma médica integral para consultorios y clínicas. Agenda en vivo, expedientes, sala de espera, facturación BCV y récipes verificables.",
      },
    ],
  }),
  component: RootIndexRoute,
});

function RootIndexRoute() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    getEffectiveSession().then((session) => {
      if (session) {
        setHasSession(true);
        navigate({ to: "/dashboard", replace: true });
      } else {
        setCheckingAuth(false);
      }
    });
  }, [navigate]);

  if (checkingAuth && hasSession) {
    return null;
  }

  return <LandingPage initialSection="hero" />;
}
