import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import { LandingHeader } from "./LandingHeader";
import { LandingHeroSection } from "./LandingHeroSection";
import { LandingShowcaseSection } from "./LandingShowcaseSection";
import { LandingFeaturesSection } from "./LandingFeaturesSection";
import { LandingDownloadSection } from "./LandingDownloadSection";
import { LandingFooter } from "./LandingFooter";

interface LandingPageProps {
  initialSection?: "hero" | "descargar";
}

export function LandingPage({ initialSection = "hero" }: LandingPageProps) {
  const { canInstall, isInstalled, installApp, platform } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/descargar`;
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
  }, []);

  useEffect(() => {
    if (initialSection !== "descargar") return;
    const el = document.getElementById("seccion-descargar");
    if (!el) return;
    const timer = setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 200);
    return () => clearTimeout(timer);
  }, [initialSection]);

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const result = await installApp();
      if (result === "accepted") {
        toast.success("¡Medizen se ha instalado en tu equipo con éxito!");
      } else if (result === "dismissed") {
        toast.info("Instalación cancelada.");
      } else {
        toast.info("Sigue los pasos indicados abajo para tu navegador.");
        const el = document.getElementById("seccion-descargar");
        el?.scrollIntoView({ behavior: "smooth" });
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado al portapapeles.");
    }
  };

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const text = encodeURIComponent(
      `🏥 *Medizen — Suite Clínica Inteligente*\n\nConoce e instala la aplicación oficial para consultorios y clínicas desde este enlace:\n${url}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleScrollToShowcase = () => {
    const el = document.getElementById("showcase");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground flex flex-col selection:bg-primary/20 font-sans">
      <LandingHeader
        isInstalled={isInstalled}
        installing={installing}
        onInstallClick={handleInstallClick}
      />

      <LandingHeroSection
        isInstalled={isInstalled}
        installing={installing}
        onInstallClick={handleInstallClick}
        onScrollToShowcase={handleScrollToShowcase}
      />

      <LandingShowcaseSection />

      <LandingFeaturesSection />

      <LandingDownloadSection
        platform={platform}
        isInstalled={isInstalled}
        installing={installing}
        qrDataUrl={qrDataUrl}
        onInstallClick={handleInstallClick}
        onCopyLink={handleCopyLink}
        onShareWhatsApp={handleShareWhatsApp}
      />

      <LandingFooter />
    </div>
  );
}
