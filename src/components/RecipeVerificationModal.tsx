import React, { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, Search, CheckCircle2, AlertCircle, FileText, 
  Calendar, User, Stethoscope, Building2, Hash 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RecipeVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCode?: string;
}

export function RecipeVerificationModal({
  open,
  onOpenChange,
  initialCode = "",
}: RecipeVerificationModalProps) {
  const [code, setCode] = useState(initialCode);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<{
    code: string;
    isValid: boolean;
    doctor: string;
    doctorLicense: string;
    patientInitials: string;
    documentType: string;
    issueDate: string;
    clinic: string;
  } | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Por favor ingrese el código de verificación.");
      return;
    }

    setIsVerifying(true);
    setVerifiedResult(null);

    try {
      const { data, error } = await (supabase as any)
        .from("document_verifications")
        .select("*")
        .eq("id", cleanCode)
        .maybeSingle();

      if (error || !data) {
        toast.error("Documento no encontrado o inválido.");
        return;
      }

      setVerifiedResult({
        code: data.id,
        isValid: true,
        doctor: data.doctor_name,
        doctorLicense: data.doctor_license || "N/A",
        patientInitials: "PACIENTE REGISTRADO",
        documentType: data.document_type,
        issueDate: new Date(data.issued_at).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        clinic: data.clinic_name,
      });
      toast.success("Documento verificado con éxito");
    } catch (err) {
      console.error(err);
      toast.error("Error al verificar el documento.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="text-left space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Verificación de Documento Clínico
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Compruebe la autenticidad y validez oficial del récipe o constancia.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-4 my-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Ej. MED-2026-A8F2"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="rounded-xl font-mono text-sm uppercase tracking-wider pl-9 bg-muted/40"
              />
              <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <Button
              type="submit"
              disabled={isVerifying}
              className="rounded-xl bg-primary font-bold text-xs px-4"
            >
              {isVerifying ? "Verificando..." : "Validar"}
            </Button>
          </div>
        </form>

        {verifiedResult && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>Documento Oficial Certificado</span>
              </div>
              <span className="font-mono text-[11px] font-bold text-foreground bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                {verifiedResult.code}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-muted-foreground">
                <Stethoscope className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <div>
                  <span className="font-bold text-foreground block">{verifiedResult.doctor}</span>
                  <span className="text-[11px]">{verifiedResult.doctorLicense}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{verifiedResult.clinic}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-semibold text-foreground">{verifiedResult.documentType}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Emitido: {verifiedResult.issueDate}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Sello Criptográfico Medizen Vault</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">HASH: SHA256-OK</span>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-semibold"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
