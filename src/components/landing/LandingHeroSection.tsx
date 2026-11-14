import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Download,
  ArrowRight,
  ChevronRight,
  Zap,
  CreditCard,
  ShieldCheck,
  Laptop,
} from "lucide-react";

interface LandingHeroSectionProps {
  isInstalled: boolean;
  installing: boolean;
  onInstallClick: () => void;
  onScrollToShowcase: () => void;
}

export function LandingHeroSection({
  isInstalled,
  installing,
  onInstallClick,
  onScrollToShowcase,
}: LandingHeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-border/40">
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[340px] rounded-full blur-[140px] opacity-25 pointer-events-none"
        style={{ backgroundColor: "var(--primary, #4361ee)" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold shadow-xs">
          <Activity className="w-3.5 h-3.5" />
          <span>Sincronización en Tiempo Real • Recepción, Médicos y Facturación</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12] max-w-4xl mx-auto">
          La suite médica inteligente para consultorios de alto rendimiento
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Coordina tu sala de espera en vivo, expide récipes oficiales verificables, gestiona
          expedientes cronológicos y concilia pagos multimoneda con tasa BCV al instante.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Button
            type="button"
            size="lg"
            onClick={onInstallClick}
            disabled={installing}
            className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-md shadow-primary/25 gap-2 cursor-pointer transition-[background-color,transform] active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isInstalled ? "Aplicación Instalada" : "Instalar en este equipo"}</span>
          </Button>

          <Link
            to="/auth"
            className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-6 rounded-2xl border border-border bg-card hover:bg-muted font-semibold text-sm text-foreground transition-colors shadow-2xs gap-2"
          >
            <span>Acceder al Sistema</span>
            <ArrowRight className="w-4 h-4 text-primary" />
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onScrollToShowcase}
            className="w-full sm:w-auto h-12 px-4 rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <span>Explorar funciones</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          <div className="p-3 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xs flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold text-foreground">Tiempo Real</p>
              <p className="text-[10px] text-muted-foreground">WebSockets Sync</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xs flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold text-foreground">Tasa BCV & USDT</p>
              <p className="text-[10px] text-muted-foreground">Conversión en vivo</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xs flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold text-foreground">Bóveda AES-256</p>
              <p className="text-[10px] text-muted-foreground">Desbloqueo por PIN</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xs flex items-center justify-center gap-2">
            <Laptop className="w-4 h-4 text-primary shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold text-foreground">Multiplataforma</p>
              <p className="text-[10px] text-muted-foreground">PC, Mac, iOS y Android</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

