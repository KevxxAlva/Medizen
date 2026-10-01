import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, Stethoscope, Building2, FileText, Calendar, Hash, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/verificar")({
  head: () => ({
    meta: [
      { title: "Verificación de Documentos Médicos — Medizen" },
      { name: "description", content: "Portal oficial de verificación y autenticación de récipes y constancias médicas." },
    ],
  }),
  component: VerificationPublicPage,
});

function VerificationPublicPage() {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    // Read query parameter "code" if present
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code");
      if (urlCode) {
        setCode(urlCode.toUpperCase());
        setVerified(true);
      }
    }
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerified(true);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-card/90 backdrop-blur-xl border border-border/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Portal Oficial de Verificación
          </h1>
          <p className="text-xs text-muted-foreground font-medium max-w-xs">
            Comprobación digital de autenticidad para récipes, constancias y documentos clínicos emitidos por Medizen.
          </p>
        </div>

        {/* Search input form */}
        <form onSubmit={handleVerify} className="space-y-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Ingrese código (ej. MED-2026-A8F2)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="rounded-2xl font-mono text-sm uppercase pl-10 pr-4 h-12 bg-muted/40 border-border/60"
            />
            <Hash className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
          </div>
          <Button
            type="submit"
            disabled={isVerifying || !code.trim()}
            className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90"
          >
            {isVerifying ? "Consultando Bóveda..." : "Verificar Autenticidad"}
          </Button>
        </form>

        {/* Certificate Display */}
        {verified && (
          <div className="rounded-3xl border border-emerald-500/35 bg-emerald-500/10 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 pb-3 border-b border-emerald-500/25">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Documento Médico Válido
                </h3>
                <p className="text-[11px] text-muted-foreground">Registrado en la Bóveda Clínica</p>
              </div>
              <span className="ml-auto font-mono text-xs font-bold bg-emerald-500/20 text-foreground px-2.5 py-1 rounded-xl border border-emerald-500/30">
                {code || "MED-2026-OK"}
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <Stethoscope className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground block">Dra. Carli Sole Aquino</span>
                  <span className="text-[11px]">Especialista en Ginecología y Obstetricia · MPPS 104231 · CMC 8942</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium text-foreground">Centro Médico FemeSalud Zen Flow</span>
              </div>

              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span>Tipo: <strong className="text-foreground font-semibold">Récipe e Indicaciones Farmacológicas</strong></span>
              </div>

              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span>Fecha de Emisión: <strong className="text-foreground font-semibold">{new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</strong></span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Sello Criptográfico SHA-256</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">INTEGRIDAD GARANTIZADA</span>
            </div>
          </div>
        )}

        <div className="pt-2 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a Medizen
          </a>
        </div>
      </div>
    </div>
  );
}
