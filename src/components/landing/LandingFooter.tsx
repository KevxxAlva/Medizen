import { Link } from "@tanstack/react-router";
import { MedizenLogo } from "@/components/MedizenLogo";
import { ShieldCheck } from "lucide-react";

export function LandingFooter() {
  return (
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

          <nav
            aria-label="Enlaces del pie de página"
            className="flex flex-wrap items-center gap-4 text-xs font-medium"
          >
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
  );
}

