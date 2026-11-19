import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, ArrowRight } from "lucide-react";
import { LandingBrandLogo } from "./LandingBrandLogo";

interface LandingHeaderProps {
  isInstalled: boolean;
  installing: boolean;
  onInstallClick: () => void;
}

export function LandingHeader({
  isInstalled,
  installing,
  onInstallClick,
}: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 dark:bg-black/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LandingBrandLogo />

          <div className="hidden md:flex items-center gap-1.5 ml-4 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>Edición Especialistas & Clínicas</span>
          </div>
        </div>

        <nav
          aria-label="Navegación principal"
          className="hidden lg:flex items-center gap-6 text-xs font-semibold text-muted-foreground"
        >
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
            onClick={onInstallClick}
            disabled={installing}
            className="hidden sm:inline-flex h-9 rounded-xl border-border text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>{isInstalled ? "Instalado" : "Instalar"}</span>
          </Button>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-[background-color,transform] active:scale-95"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

