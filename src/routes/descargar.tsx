import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import QRCode from "qrcode";
import { usePWAInstall, type PlatformType } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import {
  DescargarHeader,
  DescargarHeroSection,
  DescargarFeaturesSection,
  DescargarInstructionsSection,
  DescargarFooter,
} from "@/components/pwa/DescargarSections";

export const Route = createFileRoute("/descargar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Descargar e Instalar — Medizen" },
      {
        name: "description",
        content:
          "Descarga e instala la aplicación Medizen en tu PC, Mac, iPhone o Android para acceso directo y rápido.",
      },
    ],
  }),
  component: DescargarPage,
});

function getPlatformName(platform: PlatformType): string {
  switch (platform) {
    case "windows":
      return "Windows PC";
    case "android":
      return "Android";
    case "ios":
      return "iPhone / iPad";
    case "mac":
      return "macOS";
    default:
      return "tu dispositivo";
  }
}

function getDefaultTab(platform: PlatformType): string {
  if (platform === "ios" || platform === "android" || platform === "mac") {
    return platform;
  }
  return "windows";
}

function DescargarPage() {
  const { canInstall, isInstalled, installApp, platform } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const currentUrlRef = useRef<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      currentUrlRef.current = url;
      QRCode.toDataURL(url, {
        width: 220,
        margin: 1.5,
        color: {
          dark: "#09090b",
          light: "#ffffff",
        },
      })
        .then((dataUrl) => setQrDataUrl(dataUrl))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, []);

  const scrollToInstructions = () => {
    const el = document.getElementById("instrucciones-instalacion");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const result = await installApp();
      if (result === "accepted") {
        toast.success("¡Medizen se ha instalado en tu equipo exitosamente!");
      } else if (result === "dismissed") {
        toast.info("Instalación cancelada.");
      } else {
        toast.info(
          "Tu navegador requiere confirmación manual. Revisa los 3 pasos para tu dispositivo abajo.",
        );
        scrollToInstructions();
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrlRef.current || window.location.href);
      toast.success("Enlace de descarga copiado al portapapeles.");
    }
  };

  const handleShareWhatsApp = () => {
    const url = currentUrlRef.current || window.location.href;
    const text = encodeURIComponent(
      `🏥 *Medizen — Suite Clínica Inteligente*\n\nAbre este enlace para instalar la aplicación oficial en tu PC, Mac, Android o iPhone:\n${url}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const platformName = getPlatformName(platform);
  const defaultTab = getDefaultTab(platform);

  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground flex flex-col selection:bg-primary/20 font-sans">
      <DescargarHeader onCopyLink={handleCopyLink} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 space-y-14">
        <DescargarHeroSection
          platformName={platformName}
          isInstalled={isInstalled}
          canInstall={canInstall}
          installing={installing}
          qrDataUrl={qrDataUrl}
          onInstallClick={handleInstallClick}
          onScrollToInstructions={scrollToInstructions}
          onShareWhatsApp={handleShareWhatsApp}
          onCopyLink={handleCopyLink}
        />

        <DescargarFeaturesSection />

        <DescargarInstructionsSection platformName={platformName} defaultTab={defaultTab} />

        <DescargarFooter />
      </main>
    </div>
  );
}
