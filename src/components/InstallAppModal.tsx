import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePWAInstall, type PlatformType } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import {
  InstallModalHeader,
  InstallPlatformTabs,
  InstallQrSection,
} from "@/components/pwa/InstallModalSections";

interface InstallAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getPlatformLabel(platform: PlatformType): string {
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

export function InstallAppModal({ open, onOpenChange }: InstallAppModalProps) {
  const { canInstall, isInstalled, installApp, platform } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [showManualAlert, setShowManualAlert] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const currentUrlRef = useRef<string>("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShowManualAlert(false);
    }
    onOpenChange(nextOpen);
  };

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const url = `${window.location.origin}/descargar`;
    currentUrlRef.current = url;
    if (qrDataUrl) return;

    QRCode.toDataURL(url, {
      width: 180,
      margin: 1.5,
      color: {
        dark: "#09090b",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((err) => console.error("Error generating QR code:", err));
  }, [open, qrDataUrl]);

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const result = await installApp();
      if (result === "accepted") {
        setShowManualAlert(false);
        toast.success("¡Medizen se ha instalado con éxito en tu dispositivo!");
        handleOpenChange(false);
      } else if (result === "dismissed") {
        toast.info("Instalación cancelada. Puedes volver a intentarlo en cualquier momento.");
      } else {
        setShowManualAlert(true);
        toast.info("Completa el paso en la barra superior de tu navegador.");
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      const url = currentUrlRef.current || `${window.location.origin}/descargar`;
      navigator.clipboard.writeText(url);
      toast.success("Enlace de instalación copiado al portapapeles.");
    }
  };

  const handleShareWhatsApp = () => {
    const url = currentUrlRef.current || `${window.location.origin}/descargar`;
    const text = encodeURIComponent(
      `🏥 *Medizen — Suite Clínica Inteligente*\n\nInstala la aplicación oficial en tu computadora, teléfono o tableta desde este enlace:\n${url}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const defaultTab =
    platform === "ios"
      ? "ios"
      : platform === "android"
        ? "android"
        : platform === "mac"
          ? "mac"
          : "windows";

  const platformLabel = getPlatformLabel(platform);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <InstallModalHeader
          platformLabel={platformLabel}
          isInstalled={isInstalled}
          canInstall={canInstall}
          installing={installing}
          showManualAlert={showManualAlert}
          onInstallClick={handleInstallClick}
          onShareWhatsApp={handleShareWhatsApp}
          onCopyLink={handleCopyLink}
        />

        <div className="p-6 space-y-5 max-h-[64vh] overflow-y-auto no-scrollbar">
          <InstallPlatformTabs defaultTab={defaultTab} />
          <InstallQrSection
            qrDataUrl={qrDataUrl}
            onNavigateFullPage={() => handleOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
