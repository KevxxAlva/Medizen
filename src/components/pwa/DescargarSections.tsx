import { Link } from "@tanstack/react-router";
import { MedizenLogo } from "@/components/MedizenLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  CheckCircle2,
  Share2,
  Smartphone,
  Laptop,
  Monitor,
  MonitorDown,
  MoreVertical,
  Search,
  KeyRound,
  Star,
  Apple,
  Copy,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  ArrowLeft,
  Sparkles,
  MessageCircle,
  Lock,
} from "lucide-react";

export function DescargarHeader({ onCopyLink }: { onCopyLink: () => void }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 dark:bg-black/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <MedizenLogo className="h-8 w-8 transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg leading-none tracking-normal text-foreground">
                Medi<span className="text-primary">zen</span>
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                Instalador Multiplataforma
              </span>
            </div>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            PWA v3 Standalone
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Iniciar sesión</span>
          </Link>
          <Button
            type="button"
            size="sm"
            onClick={onCopyLink}
            variant="outline"
            className="hidden sm:inline-flex h-9 rounded-xl border-border text-xs gap-1.5 font-semibold cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copiar link</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

interface DescargarHeroSectionProps {
  platformName: string;
  isInstalled: boolean;
  canInstall: boolean;
  installing: boolean;
  qrDataUrl: string;
  onInstallClick: () => void;
  onScrollToInstructions: () => void;
  onShareWhatsApp: () => void;
  onCopyLink: () => void;
}

export function DescargarHeroSection({
  platformName,
  isInstalled,
  canInstall,
  installing,
  qrDataUrl,
  onInstallClick,
  onScrollToInstructions,
  onShareWhatsApp,
  onCopyLink,
}: DescargarHeroSectionProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
      <div className="lg:col-span-7 space-y-6 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Detectado automáticamente: {platformName}</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-normal text-foreground leading-[1.15]">
          Instala Medizen como aplicación nativa en tu consultorio o móvil
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
          Ejecuta la suite clínica en su propia ventana independiente, con arranque instantáneo
          desde caché L1/L2, desbloqueo por PIN de 4 dígitos y sin barras de distracción del
          navegador.
        </p>

        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>Medizen ya está instalada en este dispositivo</span>
            </div>
          ) : canInstall ? (
            <Button
              type="button"
              size="lg"
              onClick={onInstallClick}
              disabled={installing}
              className="h-12 px-7 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 gap-2.5 text-sm cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{installing ? "Instalando…" : `Instalar en 1 clic (${platformName})`}</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={onScrollToInstructions}
              className="h-12 px-7 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 gap-2.5 text-sm cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Ver pasos para {platformName}</span>
            </Button>
          )}

          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={onShareWhatsApp}
            className="h-12 px-5 rounded-xl border-border font-semibold gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <MessageCircle className="h-4 w-4 text-emerald-500" />
            <span>Enviar por WhatsApp</span>
          </Button>

          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={onCopyLink}
            className="h-12 px-5 rounded-xl border-border font-semibold gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <Copy className="h-4 w-4" />
            <span>Copiar enlace</span>
          </Button>
        </div>

        <div className="pt-2 grid grid-cols-3 gap-3 max-w-lg">
          <div className="p-3 rounded-xl bg-card dark:bg-zinc-950 border border-border">
            <p className="font-display font-bold text-sm text-foreground">0 MB extra</p>
            <p className="text-[11px] text-muted-foreground">Sin instaladores pesados</p>
          </div>
          <div className="p-3 rounded-xl bg-card dark:bg-zinc-950 border border-border">
            <p className="font-display font-bold text-sm text-foreground">Standalone</p>
            <p className="text-[11px] text-muted-foreground">Ventana clínica dedicada</p>
          </div>
          <div className="p-3 rounded-xl bg-card dark:bg-zinc-950 border border-border">
            <p className="font-display font-bold text-sm text-foreground">Auto-Update</p>
            <p className="text-[11px] text-muted-foreground">Siempre en última versión</p>
          </div>
        </div>
      </div>

      <DescargarWindowPreview qrDataUrl={qrDataUrl} />
    </section>
  );
}

function DescargarWindowPreview({ qrDataUrl }: { qrDataUrl: string }) {
  return (
    <div className="lg:col-span-5">
      <div className="rounded-2xl border border-border bg-[#070b19] text-white shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MedizenLogo className="h-4 w-4" />
            <span className="text-xs font-semibold text-zinc-200">
              Medizen — Suite Clínica Inteligente
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-[#090d16] border border-primary/40 flex items-center justify-center shadow-md shrink-0">
                <MedizenLogo className="h-7 w-7" color="#607AF6" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Ícono oficial de Medizen</p>
                <p className="text-[11px] text-zinc-400">
                  Acceso directo en Escritorio, Barra de tareas, Dock e Inicio
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row items-center gap-4">
            {qrDataUrl ? (
              <div className="p-2.5 bg-white rounded-xl shadow-md shrink-0">
                <img
                  src={qrDataUrl}
                  alt="Código QR para instalar Medizen en móvil"
                  width={136}
                  height={136}
                  className="h-32 w-32 object-contain"
                />
              </div>
            ) : (
              <div className="h-32 w-32 rounded-xl bg-white/10 animate-pulse shrink-0" />
            )}

            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-bold uppercase tracking-wide">
                <QrCode className="h-3 w-3" />
                <span>Escaneo Móvil</span>
              </div>
              <h2 className="font-display font-bold text-sm text-white">
                Instalar en iPhone, iPad o Android
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Apunta con la cámara de tu teléfono al código QR para abrir esta página en tu
                dispositivo móvil.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Bóveda PIN AES-256 compatible</span>
            </span>
            <span>Windows • macOS • iOS • Android</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DescargarFeaturesSection() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-6 rounded-2xl bg-card dark:bg-zinc-950 border border-border space-y-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
          <Zap className="h-5 w-5" />
        </div>
        <h2 className="font-display font-bold text-base text-foreground">
          Apertura Inmediata y Atajos
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Inicia desde el icono en tu Escritorio o Barra de tareas con accesos directos a Agenda,
          Pacientes y Facturación desde el menú contextual del icono.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-card dark:bg-zinc-950 border border-border space-y-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
          <Layers className="h-5 w-5" />
        </div>
        <h2 className="font-display font-bold text-base text-foreground">
          Ventana Clínica Sin Distracciones
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Aprovecha el 100% del alto de la pantalla para la Sala de Espera, el calendario semanal y
          las historias médicas sin pestañas de navegador.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-card dark:bg-zinc-950 border border-border space-y-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h2 className="font-display font-bold text-base text-foreground">
          Sincronización Silenciosa
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Cada mejora clínica o financiera se activa automáticamente al abrir la aplicación, sin
          descargar instaladores .exe o .dmg manuales.
        </p>
      </div>
    </section>
  );
}

function WindowsInstructionsTab() {
  return (
    <TabsContent value="windows" className="focus-visible:outline-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-card dark:bg-zinc-950 border border-border space-y-6">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-foreground">
              Windows 10 y Windows 11 (Microsoft Edge o Google Chrome)
            </h3>
            <p className="text-xs text-muted-foreground">
              Crea un acceso directo en el Escritorio, Menú Inicio y Barra de tareas.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-muted/30 dark:bg-zinc-900/70 border border-border space-y-2.5">
          <p className="text-xs font-semibold text-foreground">
            Ubicación exacta del botón de instalación en Chrome o Edge:
          </p>
          <div className="rounded-xl bg-background dark:bg-zinc-950 border border-border px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground truncate font-mono text-[11px]">
              https://medizen / descargar
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="p-1 text-muted-foreground/60">
                <Search className="h-3.5 w-3.5" />
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] shadow-sm">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-muted/30 dark:bg-zinc-900/60 border border-border space-y-2">
            <span className="h-7 w-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h4 className="font-semibold text-sm text-foreground">
              Haz clic en el monitor (barra URL)
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              En la parte derecha de la barra de direcciones (entre la lupa y la llave), haz clic en
              el icono <strong className="text-foreground">Instalar Medizen</strong>.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-muted/30 dark:bg-zinc-900/60 border border-border space-y-2">
            <span className="h-7 w-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h4 className="font-semibold text-sm text-foreground">O desde el menú (⋮ / ⋯)</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
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

          <div className="p-5 rounded-xl bg-muted/30 dark:bg-zinc-900/60 border border-border space-y-2">
            <span className="h-7 w-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h4 className="font-semibold text-sm text-foreground">Si ya estaba instalada antes</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Si tenías el ícono anterior, haz clic en{" "}
              <strong className="text-foreground">
                ⋮ → Guardar y compartir → Desinstalar Medizen…
              </strong>{" "}
              y vuelve a instalarla para actualizar al ícono oficial de Medizen.
            </p>
          </div>
        </div>
      </div>
    </TabsContent>
  );
}

function MobileAndMacInstructionsTabs() {
  return (
    <>
      <TabsContent value="android" className="focus-visible:outline-none">
        <div className="p-6 sm:p-8 rounded-2xl bg-card dark:bg-zinc-950 border border-border space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                Teléfonos y Tabletas Android (Google Chrome)
              </h3>
              <p className="text-xs text-muted-foreground">
                Se instala en tu cajón de aplicaciones como una app nativa de Android.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-muted/30 dark:bg-zinc-900/60 border border-border space-y-2">
              <span className="h-7 w-7 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="font-semibold text-sm text-foreground">Abre el menú de Chrome</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Toca el botón de tres puntos verticales <strong>(⋮)</strong> en la esquina superior
                derecha de Chrome.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-muted/30 dark:bg-zinc-900/60 border border-border space-y-2">
              <span className="h-7 w-7 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="font-semibold text-sm text-foreground">Instalar aplicación</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Selecciona <strong>&quot;Instalar aplicación&quot;</strong> o{" "}
                <strong>&quot;Añadir a la pantalla de inicio&quot;</strong>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-muted/30 dark:bg-zinc-900/60 border border-border space-y-2">
              <span className="h-7 w-7 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h4 className="font-semibold text-sm text-foreground">Confirma la descarga</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Acepta el diálogo y el icono de Medizen quedará disponible junto a tus demás
                aplicaciones.
              </p>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="ios" className="focus-visible:outline-none">
        <div className="p-6 sm:p-8 rounded-2xl bg-card dark:bg-zinc-950 border border-border space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-muted border border-border text-foreground flex items-center justify-center shrink-0">
              <Apple className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                iPhone y iPad (Navegador Safari)
              </h3>
              <p className="text-xs text-muted-foreground">
                Ejecución a pantalla completa en iOS y iPadOS sin barras de Safari.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-muted/30 dark:bg-zinc-900/60 border border-border space-y-2">
              <span className="h-7 w-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="font-semibold text-sm text-foreground">Toca Compartir</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Abre este enlace en <strong>Safari</strong> y pulsa el icono{" "}
                <strong>Compartir</strong> <Share2 className="inline h-3.5 w-3.5" /> en la barra
                inferior.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-muted/30 dark:bg-zinc-900/60 border border-border space-y-2">
              <span className="h-7 w-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="font-semibold text-sm text-foreground">Añadir a pantalla de inicio</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Desliza la lista de opciones hacia abajo y elige{" "}
                <strong>&quot;Añadir a la pantalla de inicio&quot;</strong>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-muted/30 dark:bg-zinc-900/60 border border-border space-y-2">
              <span className="h-7 w-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h4 className="font-semibold text-sm text-foreground">Pulsa Añadir</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Toca <strong>&quot;Añadir&quot;</strong> en la esquina superior derecha para crear
                el icono directo en tu iPhone o iPad.
              </p>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="mac" className="focus-visible:outline-none">
        <div className="p-6 sm:p-8 rounded-2xl bg-card dark:bg-zinc-950 border border-border space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                macOS (Safari o Google Chrome)
              </h3>
              <p className="text-xs text-muted-foreground">
                Añade Medizen directamente al Dock y Launchpad de tu Mac.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-muted/30 dark:bg-zinc-900/60 border border-border space-y-2">
              <h4 className="font-semibold text-sm text-foreground">
                Opción A: Desde Safari (macOS Sonoma o superior)
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                En la barra de menús superior de tu Mac, haz clic en{" "}
                <strong>Archivo → Añadir al Dock…</strong> y confirma con el botón Añadir.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-muted/30 dark:bg-zinc-900/60 border border-border space-y-2">
              <h4 className="font-semibold text-sm text-foreground">Opción B: Desde Google Chrome</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Haz clic en el icono de instalación de la barra de direcciones o ve a{" "}
                <strong>(⋮) → Guardar y compartir → Instalar Medizen</strong>.
              </p>
            </div>
          </div>
        </div>
      </TabsContent>
    </>
  );
}

export function DescargarInstructionsSection({
  platformName,
  defaultTab,
}: {
  platformName: string;
  defaultTab: string;
}) {
  return (
    <section id="instrucciones-instalacion" className="space-y-6 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
            Guía de instalación por sistema operativo
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Selecciona tu plataforma para ver cómo añadir el icono de Medizen en menos de 15
            segundos.
          </p>
        </div>
        <span className="text-xs font-semibold text-primary">Plataforma actual: {platformName}</span>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-12 w-full rounded-xl bg-muted/60 p-1 mb-6 border border-border">
          <TabsTrigger value="windows" className="rounded-lg text-xs sm:text-sm font-semibold gap-2">
            <Monitor className="h-4 w-4" />
            <span>Windows (PC)</span>
          </TabsTrigger>
          <TabsTrigger value="android" className="rounded-lg text-xs sm:text-sm font-semibold gap-2">
            <Smartphone className="h-4 w-4" />
            <span>Android</span>
          </TabsTrigger>
          <TabsTrigger value="ios" className="rounded-lg text-xs sm:text-sm font-semibold gap-2">
            <Apple className="h-4 w-4" />
            <span>iPhone / iPad</span>
          </TabsTrigger>
          <TabsTrigger value="mac" className="rounded-lg text-xs sm:text-sm font-semibold gap-2">
            <Laptop className="h-4 w-4" />
            <span>macOS</span>
          </TabsTrigger>
        </TabsList>

        <WindowsInstructionsTab />
        <MobileAndMacInstructionsTabs />
      </Tabs>
    </section>
  );
}

export function DescargarFooter() {
  return (
    <footer className="pt-5 pb-10 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
      <span>© {new Date().getFullYear()} Medizen — Suite Clínica Inteligente.</span>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/legal"
          search={{ doc: "terminos" }}
          className="hover:text-foreground transition-colors"
        >
          Términos de Uso
        </Link>
        <Link
          to="/legal"
          search={{ doc: "privacidad" }}
          className="hover:text-foreground transition-colors"
        >
          Privacidad
        </Link>
        <Link
          to="/legal"
          search={{ doc: "cookies" }}
          className="hover:text-foreground transition-colors"
        >
          Cookies y PWA
        </Link>
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
        >
          <span>Ir a la pantalla de inicio de sesión</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </footer>
  );
}
