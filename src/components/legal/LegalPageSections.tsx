import { Link } from "@tanstack/react-router";
import { MedizenLogo } from "@/components/MedizenLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  LEGAL_DOCUMENTS,
  LEGAL_DOC_IDS,
  LEGAL_LAST_UPDATED,
  LEGAL_VERSION,
  type LegalDoc,
  type LegalDocId,
} from "@/lib/legal/legalDocuments";
import {
  Scale,
  ShieldCheck,
  Stethoscope,
  Database,
  Lock,
  ArrowLeft,
  ArrowRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const DOC_ICONS: Record<LegalDocId, LucideIcon> = {
  terminos: Scale,
  privacidad: ShieldCheck,
  "datos-clinicos": Stethoscope,
  cookies: Database,
  seguridad: Lock,
};

export function LegalHeader({ onPrint }: { onPrint: () => void }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 dark:bg-black/85 backdrop-blur-md print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/auth" className="flex items-center gap-2.5 group min-w-0">
            <MedizenLogo className="h-8 w-8 shrink-0 transition-transform group-hover:scale-105" />
            <div className="flex flex-col min-w-0">
              <span className="font-display font-bold text-lg leading-none tracking-normal text-foreground">
                Medi<span className="text-primary">zen</span>
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-0.5 truncate">
                Centro Legal y Privacidad
              </span>
            </div>
          </Link>
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-semibold shrink-0">
            <Scale className="h-3 w-3" />
            <span>Cumplimiento {LEGAL_VERSION}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Acceso</span>
          </Link>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onPrint}
            className="h-9 rounded-xl border-border text-xs gap-1.5 font-semibold cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function LegalPrintLetterhead() {
  return (
    <div className="hidden print:flex items-center justify-between border-b border-zinc-300 px-8 py-5 mb-6">
      <div>
        <p className="font-display text-lg font-bold text-black">
          Medizen — Suite Clínica Inteligente
        </p>
        <p className="text-xs text-zinc-600">Centro Legal, Privacidad y Cumplimiento Sanitario</p>
      </div>
      <div className="text-right text-xs text-zinc-600">
        <p>Versión {LEGAL_VERSION}</p>
        <p>Actualización: {LEGAL_LAST_UPDATED}</p>
      </div>
    </div>
  );
}

export function LegalIntroBanner() {
  return (
    <section className="rounded-2xl border border-border bg-card dark:bg-zinc-950 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
      <div className="space-y-2 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Documentación Institucional Oficial</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
          Centro Legal, Privacidad y Confidencialidad Clínica
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Consulta las reglas de uso, medidas de protección de historias clínicas (RLS y cifrado
          AES-256), alcance médico-sanitario y almacenamiento local PWA de Medizen.
        </p>
      </div>

      <div className="flex flex-row md:flex-col items-start md:items-end justify-between gap-2 px-4 py-3 rounded-xl bg-muted/40 dark:bg-zinc-900/70 border border-border/80 shrink-0 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span>
            Versión vigente: <strong className="text-foreground">{LEGAL_VERSION}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>
            Revisión: <strong className="text-foreground">{LEGAL_LAST_UPDATED}</strong>
          </span>
        </div>
      </div>
    </section>
  );
}

export function LegalMobileNav({ activeDocId }: { activeDocId: LegalDocId }) {
  return (
    <nav
      aria-label="Documentos legales"
      className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar print:hidden"
    >
      {LEGAL_DOC_IDS.map((docId) => {
        const doc = LEGAL_DOCUMENTS[docId];
        const Icon = DOC_ICONS[docId];
        const isActive = docId === activeDocId;
        return (
          <Link
            key={docId}
            to="/legal"
            search={{ doc: docId }}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors shrink-0",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card dark:bg-zinc-950 text-muted-foreground border-border hover:text-foreground hover:bg-muted/50",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{doc.shortTitle}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function LegalDesktopSidebar({
  activeDocId,
  activeDoc,
}: {
  activeDocId: LegalDocId;
  activeDoc: LegalDoc;
}) {
  return (
    <aside className="hidden lg:flex lg:col-span-4 flex-col gap-5 sticky top-24 print:hidden">
      <nav
        aria-label="Navegación de documentos legales"
        className="rounded-2xl border border-border bg-card dark:bg-zinc-950 p-3 space-y-1"
      >
        <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Documentos Vigentes
        </p>
        {LEGAL_DOC_IDS.map((docId) => {
          const doc = LEGAL_DOCUMENTS[docId];
          const Icon = DOC_ICONS[docId];
          const isActive = docId === activeDocId;
          return (
            <Link
              key={docId}
              to="/legal"
              search={{ doc: docId }}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{doc.shortTitle}</span>
              </span>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0",
                  isActive ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {doc.clauses.length}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-border bg-card dark:bg-zinc-950 p-4 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          En este documento
        </p>
        <ul className="space-y-1.5">
          {activeDoc.clauses.map((clause) => (
            <li key={clause.id}>
              <a
                href={`#${clause.id}`}
                className="block text-xs text-muted-foreground hover:text-primary transition-colors py-1 leading-snug"
              >
                {clause.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export function LegalDocumentBody({
  activeDoc,
  activeIcon: ActiveIcon,
}: {
  activeDoc: LegalDoc;
  activeIcon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card dark:bg-zinc-950 p-6 sm:p-8 space-y-6 print:border-0 print:p-0">
      <header className="space-y-3 border-b border-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-bold uppercase tracking-wide">
            <ActiveIcon className="h-3.5 w-3.5" />
            <span>{activeDoc.badge}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>{activeDoc.readingTime}</span>
          </span>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-normal text-foreground print:text-black">
          {activeDoc.title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed print:text-zinc-700">
          {activeDoc.subtitle}
        </p>
      </header>

      <div className="p-4 sm:p-5 rounded-xl bg-muted/40 dark:bg-zinc-900/70 border border-border space-y-3 print:bg-zinc-50 print:border-zinc-300">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground print:text-black">
          Puntos clave de este documento
        </p>
        <ul className="space-y-2">
          {activeDoc.summaryPoints.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-xs sm:text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-muted-foreground leading-relaxed print:text-zinc-800">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {activeDoc.callout && (
        <div
          className={cn(
            "p-4 sm:p-5 rounded-xl border flex items-start gap-3.5",
            activeDoc.callout.tone === "warning" &&
              "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100",
            activeDoc.callout.tone === "security" &&
              "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100",
            activeDoc.callout.tone === "info" && "bg-primary/10 border-primary/25 text-foreground",
          )}
        >
          {activeDoc.callout.tone === "warning" ? (
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          ) : activeDoc.callout.tone === "security" ? (
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
            <p className="font-bold text-foreground print:text-black">{activeDoc.callout.title}</p>
            <p className="text-muted-foreground print:text-zinc-800">{activeDoc.callout.body}</p>
          </div>
        </div>
      )}

      <div className="space-y-8 pt-2">
        {activeDoc.clauses.map((clause) => (
          <section
            key={clause.id}
            id={clause.id}
            className="scroll-mt-24 space-y-3 border-b border-border/60 last:border-b-0 pb-6 last:pb-0"
          >
            <h3 className="font-display text-base sm:text-lg font-bold text-foreground print:text-black">
              {clause.title}
            </h3>
            <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed print:text-zinc-800">
              {clause.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            {clause.bullets && clause.bullets.length > 0 && (
              <ul className="space-y-2 pt-1 pl-1">
                {clause.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed print:text-zinc-800"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

export function LegalPagination({
  prevDoc,
  nextDoc,
}: {
  prevDoc: LegalDoc | null;
  nextDoc: LegalDoc | null;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
      {prevDoc ? (
        <Link
          to="/legal"
          search={{ doc: prevDoc.id }}
          className="p-4 rounded-2xl border border-border bg-card dark:bg-zinc-950 hover:border-primary/40 hover:bg-muted/30 transition-colors flex items-center gap-3 text-left"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Anterior
            </p>
            <p className="text-xs sm:text-sm font-bold text-foreground truncate">
              {prevDoc.shortTitle}
            </p>
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {nextDoc && (
        <Link
          to="/legal"
          search={{ doc: nextDoc.id }}
          className="p-4 rounded-2xl border border-border bg-card dark:bg-zinc-950 hover:border-primary/40 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 text-right sm:col-start-2"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Siguiente documento
            </p>
            <p className="text-xs sm:text-sm font-bold text-foreground truncate">
              {nextDoc.shortTitle}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-primary shrink-0" />
        </Link>
      )}
    </div>
  );
}

export function LegalFooter() {
  return (
    <footer className="pt-6 pb-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground print:hidden">
      <span>
        © {new Date().getFullYear()} Medizen — Suite Clínica Inteligente • Marco Legal{" "}
        {LEGAL_VERSION}
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/descargar" className="hover:text-foreground transition-colors font-medium">
          Descargar App
        </Link>
        <Link to="/auth" className="text-primary hover:underline font-semibold">
          Ir al inicio de sesión
        </Link>
      </div>
    </footer>
  );
}
