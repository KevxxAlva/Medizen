import { useState, useEffect, useRef, memo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import QRCode from "qrcode";
import { MedizenLogo } from "@/components/MedizenLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePWAInstall, type PlatformType } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Download,
  Smartphone,
  Laptop,
  CheckCircle2,
  Lock,
  Zap,
  Activity,
  ReceiptText,
  FileCheck2,
  MessageCircle,
  Copy,
  ChevronRight,
  Database,
  Building2,
  UserRound,
  HeartHandshake,
} from "lucide-react";

interface LandingPageProps {
  initialSection?: "hero" | "descargar";
}

export function LandingPage({ initialSection = "hero" }: LandingPageProps) {
  const navigate = useNavigate();
  const { canInstall, isInstalled, installApp, platform } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"agenda" | "expediente" | "sala" | "facturacion">(
    "agenda",
  );
  const [platformTab, setPlatformTab] = useState<PlatformType>(platform || "windows");

  useEffect(() => {
    if (platform) setPlatformTab(platform);
  }, [platform]);

  useEffect(() => {
    if (typeof window !== "undefined") {
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
    }
  }, []);

  useEffect(() => {
    if (initialSection === "descargar") {
      const el = document.getElementById("seccion-descargar");
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 200);
      }
    }
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

  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground flex flex-col selection:bg-primary/20 font-sans">
      {/* 1. Header de Navegación Comercial */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 dark:bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <MedizenLogo className="h-8 w-8 transition-transform group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg leading-none tracking-normal text-foreground">
                  Medi<span className="text-primary">zen</span>
                </span>
                <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                  Suite Clínica Inteligente
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1.5 ml-4 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Edición Especialistas & Clínicas</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#caracteristicas" className="hover:text-foreground transition-colors">
              Módulos
            </a>
            <a href="#showcase" className="hover:text-foreground transition-colors">
              Vista Previa
            </a>
            <a href="#seguridad" className="hover:text-foreground transition-colors">
              Seguridad
            </a>
            <a href="#seccion-descargar" className="hover:text-foreground transition-colors">
              Instalar App
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleInstallClick}
              disabled={installing}
              className="hidden sm:inline-flex h-9 rounded-xl border-border text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>{isInstalled ? "Instalado" : "Instalar"}</span>
            </Button>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-[background-color,transform] active:scale-95"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section Principal */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-border/40">
        {/* Glow de fondo ambiental */}
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
              onClick={handleInstallClick}
              disabled={installing}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-md shadow-primary/25 gap-2 cursor-pointer transition-transform active:scale-95"
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
              onClick={() => {
                const el = document.getElementById("showcase");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto h-12 px-4 rounded-2xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <span>Explorar funciones</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Badges de especificaciones arquitectónicas */}
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

      {/* 3. Interactive Showcase (Simulador de la Plataforma) */}
      <section
        id="showcase"
        className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border/60 text-xs font-semibold text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Experiencia de Usuario Diseñada para Doctores</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Una suite clínica sin fricción ni curvas complejas
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Haz clic en los módulos para explorar cómo opera cada área del sistema.
          </p>
        </div>

        {/* Selector de pestañas del Showcase */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "agenda" as const, label: "Agenda & Citas", icon: Calendar },
            { id: "expediente" as const, label: "Expediente & Récipes", icon: Stethoscope },
            { id: "sala" as const, label: "Sala de Espera en Vivo", icon: Clock },
            { id: "facturacion" as const, label: "Facturación & Divisas", icon: ReceiptText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tarjeta Visual de la Ventana Clínica */}
        <div className="p-4 sm:p-6 lg:p-8 rounded-3xl border border-border/80 bg-card/90 dark:bg-zinc-950/90 shadow-2xl backdrop-blur-xl">
          {/* Barra de título de la ventana simulada */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-xs font-mono text-muted-foreground hidden sm:inline">
                medizen://app/{activeTab}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Sistema en Línea
              </span>
            </div>
          </div>

          {/* Contenido según la pestaña activa */}
          {activeTab === "agenda" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">08:30 AM</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Atendido
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">Dra. Coromoto Sánchez</h3>
                <p className="text-xs text-muted-foreground">
                  Control prenatal mensual • Semana 28
                </p>
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Historia #MD-2026-081</span>
                  <span className="font-medium text-foreground">Dr. Rodríguez</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">09:15 AM (En Curso)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    En Consulta
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">María Valentina Pérez</h3>
                <p className="text-xs text-muted-foreground">
                  Eco Doppler obstétrico y nota evolutiva
                </p>
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Historia #MD-2026-104</span>
                  <span className="font-medium text-primary">Dr. Rodríguez</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">10:00 AM</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    En Sala
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">Lucía Mendoza</h3>
                <p className="text-xs text-muted-foreground">Revisión de citología y laboratorio</p>
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Historia #MD-2026-112</span>
                  <span className="font-medium text-foreground">Dr. Rodríguez</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "expediente" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
              <div className="p-5 rounded-2xl bg-muted/30 border border-border/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">
                    Nota Evolutiva y Exploración
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    Dictado por voz habilitado
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-card border border-border/60 text-xs text-muted-foreground leading-relaxed">
                  "Paciente femenina de 31 años acude a consulta de control. Signos vitales
                  estables, PA 115/75 mmHg, FC 74 lpm. Fondo uterino acorde a EG. FCF 142 lpm
                  rítmico. Se indican exámenes de rutina y suplemento de hierro."
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary">
                    Eco Obstétrico Adjunto
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500">
                    Firma Electrónica Médica
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">
                    Récipe Médico Digital Oficial
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary">
                    MED-2026-A8F2
                  </span>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between border-b border-border/40 pb-1">
                    <span className="font-medium text-foreground">Sulfato Ferroso 200mg</span>
                    <span>1 tableta cada 24 hrs x 30 días</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-1">
                    <span className="font-medium text-foreground">Ácido Fólico 5mg</span>
                    <span>1 cápsula diaria con el desayuno</span>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Verificable por farmacias</span>
                  </div>
                  <span className="text-xs text-primary font-semibold">Envío WhatsApp directo</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sala" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                  1. Registrados en Recepción
                </p>
                <p className="text-2xl font-extrabold text-foreground">4 Pacientes</p>
                <p className="text-xs text-muted-foreground">
                  Llegada verificada con cédula y turno
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  2. En Sala de Espera
                </p>
                <p className="text-2xl font-extrabold text-foreground">2 Pacientes</p>
                <p className="text-xs text-muted-foreground">
                  Tiempo promedio de espera: 8 minutos
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  3. En Consultorio
                </p>
                <p className="text-2xl font-extrabold text-foreground">1 En Atención</p>
                <p className="text-xs text-muted-foreground">Dr. Rodríguez • Consultorio 2</p>
              </div>
            </div>
          )}

          {activeTab === "facturacion" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Tasa Oficial BCV</span>
                  <span className="text-[10px] font-bold text-emerald-500">En Vivo</span>
                </div>
                <p className="text-2xl font-extrabold text-foreground">Bs. / USD</p>
                <p className="text-xs text-muted-foreground">
                  Sincronización automática sin discrepancias
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Cierre Diario Z</span>
                  <span className="text-[10px] font-bold text-primary">Tesorería</span>
                </div>
                <p className="text-2xl font-extrabold text-foreground">Multi-método</p>
                <p className="text-xs text-muted-foreground">
                  Pago Móvil, Zelle, Efectivo, Punto y USDT
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Honorarios</span>
                  <span className="text-[10px] font-bold text-amber-500">Liquidación</span>
                </div>
                <p className="text-2xl font-extrabold text-foreground">Porcentaje / Monto</p>
                <p className="text-xs text-muted-foreground">
                  Partición transparente médico y clínica
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Módulos y Bento Grid de Capacidades */}
      <section
        id="caracteristicas"
        className="py-16 border-t border-border/40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Diseñado para Médicos, Especialistas y Centros Clínicos</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Todo lo que tu práctica médica necesita en un solo lugar
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">
              Agenda Médica Inteligente
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Citas con aislamiento por especialista, vista semanal o diaria, estados en vivo y
              recordatorios automáticos para reducir inasistencias.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">
              Récipes con Validación Oficial
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Diseñador de recetas médicas con firma, membrete corporativo, código verificable y
              envío con 1 toque vía WhatsApp al paciente.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">
              Sala de Espera Sincronizada
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Monitoreo de flujo de pacientes en recepción y consultorios. Sincronización
              instantánea por WebSockets sin necesidad de llamadas internas.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">
              Tesorería y Tasa BCV Oficial
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cobranza transparente en Bolívares, Dólares, Euros o USDT con conversión automática en
              tiempo real y cierre de caja diario (Reporte Z).
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">
              Bóveda Criptográfica por PIN
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Desbloqueo clínico en 1 segundo con PIN personal de 4 dígitos, cifrado AES-256 local y
              bloqueo automático por inactividad.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-foreground">
              Multi-Consultorio & Roles
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permisos estrictos para médicos, enfermería, recepción y administración con políticas
              Row Level Security (RLS) en base de datos.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Sección de Descarga e Instalación (PWA) */}
      <section
        id="seccion-descargar"
        className="py-16 sm:py-24 border-t border-border/40 bg-muted/20"
      >
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
            {/* Columna Izquierda: Acciones de Instalación */}
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
                    onClick={handleInstallClick}
                    disabled={installing}
                    className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 gap-2 cursor-pointer transition-transform active:scale-95"
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
                    onClick={handleCopyLink}
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

              {/* Botón compartir WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 transition-colors text-xs font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <span>Enviar enlace de instalación por WhatsApp al equipo médico</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Columna Derecha: Tarjeta QR para Escaneo Móvil */}
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

      {/* 6. Footer Comercial y Enlaces Legales */}
      <footer className="border-t border-border/60 py-10 bg-card/60 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MedizenLogo className="h-6 w-6" />
              <span className="font-display font-bold text-sm text-foreground">
                Medi<span className="text-primary">zen</span>
              </span>
              <span className="text-[11px] text-muted-foreground/80">
                — Plataforma de Alta Resolución Clínica
              </span>
            </div>

            <nav className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <Link
                to="/legal"
                search={{ doc: "terminos" }}
                className="hover:text-foreground transition-colors"
              >
                Términos
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
                search={{ doc: "datos-clinicos" }}
                className="hover:text-foreground transition-colors"
              >
                Aviso Médico
              </Link>
              <Link
                to="/descargar"
                className="text-primary hover:underline transition-colors font-semibold"
              >
                Instalar App
              </Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">
                Acceso Médicos
              </Link>
            </nav>
          </div>

          <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground/80">
            <p>© {new Date().getFullYear()} Medizen. Todos los derechos reservados.</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Conexión cifrada TLS • Row Level Security (RLS) Activo</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
