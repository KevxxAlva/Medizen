import { Button } from "@/components/ui/button";
import {
  Download,
  Copy,
  MessageCircle,
  ArrowRight,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import type { PlatformType } from "@/hooks/usePWAInstall";

interface LandingDownloadSectionProps {
  platform: PlatformType;
  isInstalled: boolean;
  installing: boolean;
  qrDataUrl: string;
  onInstallClick: () => void;
  onCopyLink: () => void;
  onShareWhatsApp: () => void;
}

export function LandingDownloadSection({
  platform,
  isInstalled,
  installing,
  qrDataUrl,
  onInstallClick,
  onCopyLink,
  onShareWhatsApp,
}: LandingDownloadSectionProps) {
  return (
    <section id="seccion-descargar" className="py-16 sm:py-24 border-t border-border/40 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Instalación PWA v3 Directa • 0 MB Extra</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Instala Medizen en tu PC, Mac, iPhone o Android
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Ejecuta la plataforma en su propia ventana sin barras del navegador, con arranque
            instantáneo y acceso directo desde tu escritorio o pantalla de inicio.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-lg space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">Instalador Rápido</h3>
                  <p className="text-xs text-muted-foreground">
                    Dispositivo detectado:{" "}
                    <span className="font-semibold text-foreground">
                      {platform || "tu equipo"}
                    </span>
                  </p>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  size="lg"
                  onClick={onInstallClick}
                  disabled={installing}
                  className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 gap-2 cursor-pointer transition-[background-color,transform] active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isInstalled ? "Medizen ya está instalado" : "Instalar en este equipo"}
                  </span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={onCopyLink}
                  className="h-12 px-4 rounded-2xl border-border text-xs font-semibold gap-2 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Copiar enlace</span>
                </Button>
              </div>

              <div className="pt-2 border-t border-border/40 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-muted/40">
                  <p className="text-xs font-bold text-foreground">0 MB</p>
                  <p className="text-[10px] text-muted-foreground">Sin instaladores pesados</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/40">
                  <p className="text-xs font-bold text-foreground">Ventana Propia</p>
                  <p className="text-[10px] text-muted-foreground">100% Pantalla limpia</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/40">
                  <p className="text-xs font-bold text-foreground">Auto-Update</p>
                  <p className="text-[10px] text-muted-foreground">Siempre en última versión</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onShareWhatsApp}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 transition-colors text-xs font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>Enviar enlace de instalación por WhatsApp al equipo médico</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[320px] p-6 rounded-3xl border border-border/80 bg-card shadow-xl text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wide">
                <Smartphone className="w-3 h-3" />
                <span>Escanear con Teléfono</span>
              </div>

              <div className="p-3 bg-white rounded-2xl shadow-inner mx-auto w-fit border border-zinc-200">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Medizen" className="w-44 h-44 object-contain" />
                ) : (
                  <div className="w-44 h-44 bg-zinc-100 rounded-xl animate-pulse" />
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Abre la cámara de tu iPhone o Android para instalar Medizen de inmediato en tu
                móvil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

