import { useState, useEffect, useRef } from "react";
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
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { MedizenLogo } from "@/components/MedizenLogo";
import {
  Download,
  CheckCircle2,
  Share2,
  Smartphone,
  Laptop,
  Apple,
  ExternalLink,
  Copy,
  QrCode,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface InstallAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstallAppModal({ open, onOpenChange }: InstallAppModalProps) {
  const { canInstall, isInstalled, installApp, platform } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const currentUrlRef = useRef<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/descargar`;
      currentUrlRef.current = url;
      QRCode.toDataURL(url, {
        width: 180,
        margin: 1.5,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
        },
      })
        .then((dataUrl) => setQrDataUrl(dataUrl))
        .catch((err) => console.error("Error generating QR code:", err));
    }
  }, []);

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const result = await installApp();
      if (result === "accepted") {
        toast.success("¡Medizen se ha instalado con éxito en tu sistema!");
        onOpenChange(false);
      } else if (result === "dismissed") {
        toast.info("Instalación cancelada. Puedes intentarlo de nuevo cuando desees.");
      } else {
        toast.info(
          "Tu navegador no soporta instalación automática directa. Sigue los pasos de tu dispositivo a continuación."
        );
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrlRef.current || window.location.href);
      toast.success("Enlace de instalación copiado al portapapeles.");
    }
  };

  const defaultTab =
    platform === "ios"
      ? "ios"
      : platform === "android"
      ? "android"
      : platform === "mac"
      ? "mac"
      : "windows";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl">
        {/* Header Hero */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center shadow-inner">
                <MedizenLogo className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  Instalar Medizen App
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                    PWA
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Usa Medizen en modo aplicación nativa: rápido, sin barras de navegador y con acceso directo.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Quick 1-Click Action if available */}
          {isInstalled ? (
            <div className="mt-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-xs sm:text-sm font-medium">
                ¡Medizen ya está instalado en este dispositivo como aplicación!
              </p>
            </div>
          ) : canInstall ? (
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                onClick={handleInstallClick}
                disabled={installing}
                className="flex-1 h-11 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/25 gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                {installing ? "Instalando…" : "Instalar en 1 Clic en este equipo"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="h-11 rounded-2xl border-border/60 gap-2 text-xs font-semibold"
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar Enlace
              </Button>
            </div>
          ) : (
            <div className="mt-5 flex items-center justify-between gap-3 p-3 rounded-2xl bg-background/60 border border-border/50 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>Instalable en cualquier sistema mediante el navegador.</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyLink}
                className="h-8 px-2.5 rounded-xl gap-1.5 text-xs text-foreground font-semibold hover:bg-primary/10"
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar Link
              </Button>
            </div>
          )}
        </div>

        {/* Platform Guidance & QR */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid grid-cols-4 h-10 w-full rounded-2xl bg-muted/60 p-1 mb-5">
              <TabsTrigger value="windows" className="rounded-xl text-xs gap-1.5 font-semibold">
                <Laptop className="h-3.5 w-3.5" />
                Windows
              </TabsTrigger>
              <TabsTrigger value="android" className="rounded-xl text-xs gap-1.5 font-semibold">
                <Smartphone className="h-3.5 w-3.5" />
                Android
              </TabsTrigger>
              <TabsTrigger value="ios" className="rounded-xl text-xs gap-1.5 font-semibold">
                <Apple className="h-3.5 w-3.5" />
                iPhone / iPad
              </TabsTrigger>
              <TabsTrigger value="mac" className="rounded-xl text-xs gap-1.5 font-semibold">
                <Laptop className="h-3.5 w-3.5" />
                macOS
              </TabsTrigger>
            </TabsList>

            {/* WINDOWS */}
            <TabsContent value="windows" className="space-y-3.5 focus-visible:outline-none">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-xs sm:text-sm space-y-2.5">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-primary" />
                  Instalar en PC (Microsoft Edge o Google Chrome):
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground pl-1">
                  <li>
                    Haz clic en el botón <strong className="text-foreground">"Instalar en 1 Clic"</strong> arriba si está disponible.
                  </li>
                  <li>
                    O busca el icono de instalar <strong className="text-foreground">(🖥️ o ⊕)</strong> en el extremo derecho de la barra de direcciones de tu navegador.
                  </li>
                  <li>
                    Haz clic en <strong className="text-foreground">"Instalar"</strong>. Se creará un icono directo en tu Escritorio y Menú Inicio.
                  </li>
                </ol>
              </div>
            </TabsContent>

            {/* ANDROID */}
            <TabsContent value="android" className="space-y-3.5 focus-visible:outline-none">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-xs sm:text-sm space-y-2.5">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-500" />
                  Instalar en Android (Google Chrome):
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground pl-1">
                  <li>Abre el enlace de Medizen en Chrome.</li>
                  <li>
                    Toca los tres puntos verticales <strong className="text-foreground">(⋮)</strong> en la esquina superior derecha.
                  </li>
                  <li>
                    Selecciona <strong className="text-foreground">"Instalar aplicación"</strong> o "Añadir a la pantalla de inicio".
                  </li>
                  <li>Pulsa <strong className="text-foreground">"Instalar"</strong> y se descargará al menú de apps.</li>
                </ol>
              </div>
            </TabsContent>

            {/* IOS */}
            <TabsContent value="ios" className="space-y-3.5 focus-visible:outline-none">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-xs sm:text-sm space-y-2.5">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Apple className="h-4 w-4 text-blue-500" />
                  Instalar en iPhone o iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground pl-1">
                  <li>Abre el enlace de Medizen en el navegador <strong className="text-foreground">Safari</strong>.</li>
                  <li>
                    Toca el botón <strong className="text-foreground">Compartir</strong> (el ícono del cuadrado con la flecha hacia arriba <Share2 className="inline h-3.5 w-3.5 mx-0.5" /> en la barra inferior).
                  </li>
                  <li>
                    Desliza hacia abajo y presiona <strong className="text-foreground">"Añadir a la pantalla de inicio"</strong>.
                  </li>
                  <li>
                    Toca <strong className="text-foreground">"Añadir"</strong> arriba a la derecha. ¡Aparecerá en tus apps!
                  </li>
                </ol>
              </div>
            </TabsContent>

            {/* MAC */}
            <TabsContent value="mac" className="space-y-3.5 focus-visible:outline-none">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-xs sm:text-sm space-y-2.5">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-primary" />
                  Instalar en Mac (Safari o Chrome):
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground pl-1">
                  <li>En Safari: ve al menú superior <strong className="text-foreground">Archivo → Añadir al Dock</strong>.</li>
                  <li>En Chrome: haz clic en el icono de instalar en la barra de direcciones o en Menú → Guardar y compartir → Instalar Medizen.</li>
                  <li>La app se abrirá en su propia ventana y estará en el Launchpad y Dock.</li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>

          {/* QR Code Section to install on Mobile */}
          <div className="p-4 rounded-2xl bg-card border border-border/60 flex flex-col sm:flex-row items-center gap-4">
            {qrDataUrl && (
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 shrink-0">
                <img
                  src={qrDataUrl}
                  alt="Código QR de instalación de Medizen"
                  width={112}
                  height={112}
                  className="h-28 w-28 object-contain"
                />
              </div>
            )}
            <div className="text-center sm:text-left space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-foreground font-semibold text-xs sm:text-sm">
                <QrCode className="h-4 w-4 text-primary" />
                <span>¿Quieres instalarlo en tu teléfono móvil?</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Apunta la cámara de tu teléfono al código QR para abrir el enlace directo de descarga e instalación.
              </p>
              <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                <a
                  href="/descargar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  Ver página completa de descarga <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
