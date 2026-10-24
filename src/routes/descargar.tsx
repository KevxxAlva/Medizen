import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import QRCode from "qrcode";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { MedizenLogo } from "@/components/MedizenLogo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  CheckCircle2,
  Share2,
  Smartphone,
  Laptop,
  Apple,
  Copy,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

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

function getPlatformName(platform: string): string {
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

function getDefaultTab(platform: string): string {
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
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((dataUrl) => setQrDataUrl(dataUrl))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, []);

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
          "Tu navegador no ejecutó la instalación directa. Consulta la guía paso a paso abajo para tu dispositivo."
        );
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

  const platformName = getPlatformName(platform);
  const defaultTab = getDefaultTab(platform);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <MedizenLogo className="h-7 w-7 transition-transform group-hover:scale-105" />
            <span className="font-display font-bold text-lg tracking-tight text-foreground">
              Medizen
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl hover:bg-muted/60"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Entrar al sistema</span>
            </Link>
            <Button
              size="sm"
              onClick={handleCopyLink}
              variant="outline"
              className="rounded-xl border-border/60 text-xs gap-1.5 font-semibold"
            >
              <Copy className="h-3.5 w-3.5" />
              Compartir link
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 space-y-16">
        <InstallationHero
          isInstalled={isInstalled}
          canInstall={canInstall}
          installing={installing}
          platformName={platformName}
          onInstall={handleInstallClick}
          onCopyLink={handleCopyLink}
        />

        <ValuePropositionCards />

        <InstallationInstructionsTabs defaultTab={defaultTab} />

        <QrCodeSection qrDataUrl={qrDataUrl} onCopyLink={handleCopyLink} />

        <div className="text-center pt-6 pb-12">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <span>Ir a la pantalla de inicio de sesión de Medizen</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

function InstallationHero({
  isInstalled,
  canInstall,
  installing,
  platformName,
  onInstall,
  onCopyLink,
}: {
  isInstalled: boolean;
  canInstall: boolean;
  installing: boolean;
  platformName: string;
  onInstall: () => void;
  onCopyLink: () => void;
}) {
  return (
    <div className="text-center space-y-5 max-w-3xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold animate-in fade-in duration-500">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Aplicación Oficial Instalable</span>
      </div>

      <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
        Instala Medizen en tu dispositivo mediante este enlace
      </h1>

      <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
        Disfruta de la suite clínica en modo aplicación independiente: acceso directo desde tu
        escritorio o pantalla de inicio, sin barras de navegación y con máxima fluidez.
      </p>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
        {isInstalled ? (
          <div className="w-full p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-3 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="h-5 w-5" />
            Medizen ya está instalada en este equipo
          </div>
        ) : canInstall ? (
          <Button
            size="lg"
            onClick={onInstall}
            disabled={installing}
            className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 gap-2.5 text-base"
          >
            <Download className="h-5 w-5" />
            {installing ? "Instalando..." : `Instalar ahora en ${platformName}`}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => {
              const el = document.getElementById("instrucciones-instalacion");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 gap-2.5 text-base"
          >
            <Download className="h-5 w-5" />
            Ver pasos para instalar en {platformName}
          </Button>
        )}

        <Button
          size="lg"
          variant="outline"
          onClick={onCopyLink}
          className="w-full sm:w-auto h-12 px-6 rounded-2xl border-border/60 font-semibold gap-2 text-sm"
        >
          <Copy className="h-4 w-4" />
          Copiar enlace
        </Button>
      </div>
    </div>
  );
}

function ValuePropositionCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-sm space-y-3">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Zap className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-base text-foreground">Acceso Ultrarrápido</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Ábrelo directamente desde tu escritorio o barra de tareas sin tener que escribir URLs ni abrir pestañas de navegación.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-sm space-y-3">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Layers className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-base text-foreground">Ventana Limpia y Nativa</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Diseño 100% libre de barras de navegador para una concentración total en la consulta médica y gestión de pacientes.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-sm space-y-3">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h3 className="font-bold text-base text-foreground">Siempre Actualizado</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          No necesitas descargar archivos pesados de actualización: cada mejora de Medizen se sincroniza de inmediato de forma transparente.
        </p>
      </div>
    </div>
  );
}

function InstallationInstructionsTabs({ defaultTab }: { defaultTab: string }) {
  return (
    <div id="instrucciones-instalacion" className="space-y-6 pt-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
          Instrucciones según tu sistema operativo
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Sigue estos sencillos pasos para tener el icono de la aplicación en tu pantalla.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-12 w-full rounded-2xl bg-muted/60 p-1 mb-8">
          <TabsTrigger value="windows" className="rounded-xl text-xs sm:text-sm font-semibold gap-2">
            <Laptop className="h-4 w-4" />
            Windows (PC)
          </TabsTrigger>
          <TabsTrigger value="android" className="rounded-xl text-xs sm:text-sm font-semibold gap-2">
            <Smartphone className="h-4 w-4" />
            Android
          </TabsTrigger>
          <TabsTrigger value="ios" className="rounded-xl text-xs sm:text-sm font-semibold gap-2">
            <Apple className="h-4 w-4" />
            iPhone / iPad
          </TabsTrigger>
          <TabsTrigger value="mac" className="rounded-xl text-xs sm:text-sm font-semibold gap-2">
            <Laptop className="h-4 w-4" />
            macOS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="windows" className="focus-visible:outline-none">
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/60 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                🪟
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  Instalación en Windows con Microsoft Edge o Google Chrome
                </h3>
                <p className="text-xs text-muted-foreground">
                  Compatible con Windows 10 y Windows 11.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="font-semibold text-sm text-foreground">Abre este enlace</h4>
                <p className="text-xs text-muted-foreground">
                  Abre este enlace en Microsoft Edge o Google Chrome.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="font-semibold text-sm text-foreground">Haz clic en Instalar</h4>
                <p className="text-xs text-muted-foreground">
                  En la barra de direcciones arriba a la derecha, haz clic en el icono de
                  instalación <strong>(🖥️ o ⊕)</strong> o en el botón "Instalar" de esta página.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="font-semibold text-sm text-foreground">Confirmar</h4>
                <p className="text-xs text-muted-foreground">
                  Presiona "Instalar". Medizen se abrirá como ventana independiente y se creará el
                  acceso en tu Escritorio y Menú Inicio.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="android" className="focus-visible:outline-none">
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/60 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  Instalación en Android con Google Chrome
                </h3>
                <p className="text-xs text-muted-foreground">
                  Se integra en tu cajón de aplicaciones como una app nativa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <span className="h-6 w-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="font-semibold text-sm text-foreground">Menú de Chrome</h4>
                <p className="text-xs text-muted-foreground">
                  Toca los tres puntos <strong>(⋮)</strong> en la esquina superior derecha del navegador.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <span className="h-6 w-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="font-semibold text-sm text-foreground">Instalar Aplicación</h4>
                <p className="text-xs text-muted-foreground">
                  Selecciona la opción <strong>"Instalar aplicación"</strong> o "Añadir a la pantalla de inicio".
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <span className="h-6 w-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="font-semibold text-sm text-foreground">Listo</h4>
                <p className="text-xs text-muted-foreground">
                  Confirma la descarga. El icono de Medizen aparecerá junto a tus otras aplicaciones.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ios" className="focus-visible:outline-none">
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/60 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-500/10 text-foreground flex items-center justify-center font-bold">
                🍎
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  Instalación en iPhone / iPad con Safari
                </h3>
                <p className="text-xs text-muted-foreground">
                  Funciona a pantalla completa sin barra de navegación de iOS.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="font-semibold text-sm text-foreground">Botón Compartir</h4>
                <p className="text-xs text-muted-foreground">
                  Abre este enlace en <strong>Safari</strong> y toca el botón Compartir{" "}
                  <Share2 className="inline h-3.5 w-3.5" /> en la parte inferior.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="font-semibold text-sm text-foreground">Pantalla de Inicio</h4>
                <p className="text-xs text-muted-foreground">
                  Desliza hacia abajo y presiona{" "}
                  <strong>"Añadir a la pantalla de inicio"</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="font-semibold text-sm text-foreground">Añadir</h4>
                <p className="text-xs text-muted-foreground">
                  Toca <strong>"Añadir"</strong> en la esquina superior derecha. ¡Ya tienes el icono listo!
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mac" className="focus-visible:outline-none">
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/60 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-500/10 text-foreground flex items-center justify-center font-bold">
                🍏
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  Instalación en macOS con Safari o Chrome
                </h3>
                <p className="text-xs text-muted-foreground">
                  Añade Medizen directamente a tu Dock y Launchpad.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Opción A: Desde Safari</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  En la barra de menús superior de tu Mac, ve a <strong>Archivo</strong> →{" "}
                  <strong>Añadir al Dock...</strong>. Asigna el nombre y presiona Añadir.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-muted/40 border border-border/40 space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Opción B: Desde Chrome</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Haz clic en el icono de instalación en la barra de direcciones o ve a los tres puntos{" "}
                  <strong>(⋮) → Guardar y compartir → Instalar Medizen</strong>.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QrCodeSection({
  qrDataUrl,
  onCopyLink,
}: {
  qrDataUrl: string;
  onCopyLink: () => void;
}) {
  return (
    <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-card via-card to-muted/20 border border-border/60 shadow-lg flex flex-col md:flex-row items-center gap-8">
      {qrDataUrl && (
        <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 shrink-0">
          <img
            src={qrDataUrl}
            alt="Código QR para descargar Medizen"
            className="h-36 w-36 sm:h-44 sm:w-44 object-contain"
          />
        </div>
      )}

      <div className="space-y-3 text-center md:text-left flex-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <QrCode className="h-3.5 w-3.5" />
          <span>Escanea con tu teléfono</span>
        </div>

        <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
          ¿Quieres descargar la app en tu teléfono o tableta?
        </h3>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Apunta con la cámara de tu teléfono al código QR para abrir instantáneamente este enlace
          en tu móvil y añadir Medizen a tu pantalla de inicio en segundos.
        </p>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCopyLink}
            className="rounded-xl border-border/60 gap-2 text-xs font-semibold"
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar enlace para enviar por WhatsApp o correo
          </Button>
        </div>
      </div>
    </div>
  );
}
