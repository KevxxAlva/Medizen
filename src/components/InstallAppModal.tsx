import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePWAInstall, type PlatformType } from "@/hooks/usePWAInstall";
import { MedizenLogo } from "@/components/MedizenLogo";
import {
  Download,
  CheckCircle2,
  Share2,
  Smartphone,
  Laptop,
  Monitor,
  MonitorDown,
  MoreVertical,
  Apple,
  ArrowUpRight,
  Copy,
  QrCode,
  ShieldCheck,
  MessageCircle,
  Search,
  KeyRound,
  Star,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

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

  // Reset inline alert whenever modal opens/closes
  useEffect(() => {
    if (!open) {
      setShowManualAlert(false);
      return;
    }
    if (typeof window === "undefined") return;
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
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header Hero */}
        <DialogHeader className="relative p-6 border-b border-border bg-muted/30 dark:bg-zinc-950 text-left">
          <div className="flex items-start justify-between gap-4 pr-6">
            <div className="flex items-center gap-3.5">
              {/* Official Medizen App Icon Preview */}
              <div
                className="h-13 w-13 rounded-2xl bg-[#090d16] border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/15 shrink-0"
                title="Ícono oficial de la app Medizen"
              >
                <MedizenLogo className="h-8 w-8" color="#607AF6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="font-display text-lg sm:text-xl font-bold tracking-normal text-foreground">
                    Instalar Medizen en {platformLabel}
                  </DialogTitle>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary font-bold uppercase tracking-wide">
                    App de Escritorio / Móvil
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Crea la aplicación independiente de Medizen con su ícono oficial para abrirla en
                  ventana propia sin pestañas del navegador.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Primary Action Banner */}
          {isInstalled ? (
            <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-xs sm:text-sm font-semibold">
                Medizen ya está abierta en modo aplicación instalada en este equipo.
              </p>
            </div>
          ) : (
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <Button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>
                  {installing
                    ? "Abriendo instalador…"
                    : canInstall
                      ? `Instalar ahora en ${platformLabel}`
                      : `Instalar Medizen en ${platformLabel}`}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleShareWhatsApp}
                className="h-11 rounded-xl border-border gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="h-11 rounded-xl border-border gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar link</span>
              </Button>
            </div>
          )}

          {/* Contextual Alert when browser blocks programmatic prompt or app was previously installed */}
          {showManualAlert && !isInstalled && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Haz clic en el icono de Chrome arriba a la derecha</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Por seguridad de Chrome/Edge, si el diálogo no abrió automáticamente o si ya tenías
                una versión previa instalada, usa el icono{" "}
                <strong className="text-foreground">Instalar Medizen</strong> en la barra de
                direcciones (señalado abajo) o el menú{" "}
                <strong className="text-foreground">⋮</strong>.
              </p>
            </div>
          )}
        </DialogHeader>

        {/* Platform Guidance & Visual Diagram */}
        <div className="p-6 space-y-5 max-h-[64vh] overflow-y-auto no-scrollbar">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid grid-cols-4 h-10 w-full rounded-xl bg-muted/70 p-1 mb-4 border border-border/60">
              <TabsTrigger value="windows" className="rounded-lg text-xs gap-1.5 font-semibold">
                <Monitor className="h-3.5 w-3.5" />
                <span>Windows</span>
              </TabsTrigger>
              <TabsTrigger value="android" className="rounded-lg text-xs gap-1.5 font-semibold">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Android</span>
              </TabsTrigger>
              <TabsTrigger value="ios" className="rounded-lg text-xs gap-1.5 font-semibold">
                <Apple className="h-3.5 w-3.5" />
                <span>iOS</span>
              </TabsTrigger>
              <TabsTrigger value="mac" className="rounded-lg text-xs gap-1.5 font-semibold">
                <Laptop className="h-3.5 w-3.5" />
                <span>macOS</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="windows" className="focus-visible:outline-none space-y-3">
              {/* Visual Chrome / Edge Address Bar Diagram */}
              <div className="p-4 rounded-xl bg-muted/30 dark:bg-zinc-900/70 border border-border space-y-3">
                <p className="text-xs font-semibold text-foreground">
                  Dónde hacer clic en Google Chrome o Microsoft Edge:
                </p>

                <div className="rounded-xl bg-background dark:bg-zinc-950 border border-border px-3 py-2 flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground truncate font-mono text-[11px]">
                    app.medizen / auth
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="p-1 text-muted-foreground/60">
                      <Search className="h-3.5 w-3.5" />
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] shadow-sm animate-pulse">
                      <MonitorDown className="h-3.5 w-3.5" />
                      <span>Instalar aquí</span>
                    </span>
                    <span className="p-1 text-muted-foreground/60">
                      <KeyRound className="h-3.5 w-3.5" />
                    </span>
                    <span className="p-1 text-muted-foreground/60">
                      <Star className="h-3.5 w-3.5" />
                    </span>
                    <span className="p-1 text-muted-foreground/80">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-background dark:bg-zinc-950 border border-border space-y-1">
                    <p className="font-semibold text-foreground">Opción 1: Botón en la barra URL</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Haz clic en el monitor con flecha{" "}
                      <strong className="text-foreground">Instalar Medizen</strong> entre la lupa y
                      la llave, y pulsa <strong className="text-foreground">Instalar</strong>.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background dark:bg-zinc-950 border border-border space-y-1">
                    <p className="font-semibold text-foreground">
                      Opción 2: Menú (⋮) arriba a la derecha
                    </p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Chrome:{" "}
                      <strong className="text-foreground">
                        ⋮ → Guardar y compartir → Instalar página como aplicación…
                      </strong>
                      <br />
                      Edge:{" "}
                      <strong className="text-foreground">
                        ⋯ → Aplicaciones → Instalar este sitio como aplicación
                      </strong>
                      .
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                  <strong className="text-foreground">¿Tenías un ícono anterior?</strong> Si Chrome
                  dice <em>&ldquo;Abrir en la aplicación&rdquo;</em>, abre{" "}
                  <strong className="text-foreground">
                    ⋮ → Guardar y compartir → Desinstalar Medizen…
                  </strong>{" "}
                  y vuelve a instalar para actualizar al ícono oficial de Medizen.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="android" className="focus-visible:outline-none">
              <div className="p-4 rounded-xl bg-muted/30 dark:bg-zinc-900/70 border border-border space-y-3">
                <p className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-500" />
                  <span>Google Chrome en Android</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-background dark:bg-zinc-950 border border-border space-y-1">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-500 font-bold text-[11px]">
                      1
                    </span>
                    <p className="font-semibold text-foreground">Menú de Chrome</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Toca los tres puntos <strong className="text-foreground">(⋮)</strong> arriba a
                      la derecha.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background dark:bg-zinc-950 border border-border space-y-1">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-500 font-bold text-[11px]">
                      2
                    </span>
                    <p className="font-semibold text-foreground">Instalar aplicación</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Toca <strong className="text-foreground">Instalar aplicación</strong> (o
                      Añadir a pantalla de inicio).
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background dark:bg-zinc-950 border border-border space-y-1">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-500 font-bold text-[11px]">
                      3
                    </span>
                    <p className="font-semibold text-foreground">App instalada</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Confirma y verás el ícono oficial azul de Medizen en tu inicio.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ios" className="focus-visible:outline-none">
              <div className="p-4 rounded-xl bg-muted/30 dark:bg-zinc-900/70 border border-border space-y-3">
                <p className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-2">
                  <Apple className="h-4 w-4 text-foreground" />
                  <span>Safari en iPhone o iPad</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-background dark:bg-zinc-950 border border-border space-y-1">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-primary font-bold text-[11px]">
                      1
                    </span>
                    <p className="font-semibold text-foreground">Botón Compartir</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      En Safari, toca <strong className="text-foreground">Compartir</strong>{" "}
                      <Share2 className="inline h-3 w-3" /> abajo.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background dark:bg-zinc-950 border border-border space-y-1">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-primary font-bold text-[11px]">
                      2
                    </span>
                    <p className="font-semibold text-foreground">Pantalla de inicio</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Elige <strong className="text-foreground">Añadir a pantalla de inicio</strong>
                      .
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background dark:bg-zinc-950 border border-border space-y-1">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-primary font-bold text-[11px]">
                      3
                    </span>
                    <p className="font-semibold text-foreground">Confirmar</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Toca <strong className="text-foreground">Añadir</strong> arriba a la derecha.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="mac" className="focus-visible:outline-none">
              <div className="p-4 rounded-xl bg-muted/30 dark:bg-zinc-900/70 border border-border space-y-3">
                <p className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-primary" />
                  <span>Safari o Google Chrome en macOS</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-background dark:bg-zinc-950 border border-border space-y-1">
                    <p className="font-semibold text-foreground">Desde Safari (macOS Sonoma+)</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      En el menú superior elige{" "}
                      <strong className="text-foreground">Archivo → Añadir al Dock…</strong> y
                      confirma Medizen.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background dark:bg-zinc-950 border border-border space-y-1">
                    <p className="font-semibold text-foreground">Desde Google Chrome</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Pulsa el ícono <MonitorDown className="inline h-3 w-3" /> en la barra URL o{" "}
                      <strong className="text-foreground">
                        ⋮ → Guardar y compartir → Instalar Medizen
                      </strong>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* QR Code & Full Page Link */}
          <div className="p-4 rounded-xl bg-muted/20 dark:bg-zinc-900/40 border border-border flex flex-col sm:flex-row items-center gap-4">
            {qrDataUrl && (
              <div className="p-2 bg-white rounded-xl shadow-xs border border-zinc-200 shrink-0">
                <img
                  src={qrDataUrl}
                  alt="Código QR de instalación de Medizen"
                  width={104}
                  height={104}
                  className="h-24 w-24 object-contain"
                />
              </div>
            )}
            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-foreground font-semibold text-xs sm:text-sm">
                <QrCode className="h-4 w-4 text-primary" />
                <span>Instalar en teléfono o tableta con código QR</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Escanea con la cámara de tu teléfono para abrir esta guía e instalar Medizen en tu
                pantalla de inicio.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                <Link
                  to="/descargar"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  <span>Abrir página completa /descargar</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <span className="text-border">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Ícono oficial Medizen</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
