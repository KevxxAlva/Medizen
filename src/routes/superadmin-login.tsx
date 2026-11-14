import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { setAuthSessionManually } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { MedizenLogo } from "@/components/MedizenLogo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/superadmin-login")({
  head: () => ({ meta: [{ title: "Bóveda Maestra SaaS — Super Administrador" }] }),
  component: SuperAdminLoginPage,
});

function SuperAdminLoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Iniciar sesión en Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error("Credenciales inválidas o cuenta no registrada.");
      }

      if (!data.user) {
        throw new Error("No se pudo obtener la información de usuario.");
      }

      // 2. Verificar estrictamente que este usuario sea SUPER ADMINISTRADOR
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("es_superadmin, id_rol, roles(nombre_rol)")
        .eq("auth_id", data.user.id)
        .maybeSingle();

      const roleName = (
        Array.isArray(userData?.roles)
          ? userData?.roles[0]?.nombre_rol
          : (userData?.roles as any)?.nombre_rol || ""
      ).toLowerCase();

      const isSuper = !!userData?.es_superadmin || roleName.includes("super");

      if (!isSuper) {
        // Desconectar inmediatamente por seguridad
        await supabase.auth.signOut();
        throw new Error(
          "Acceso denegado: Esta cuenta no posee credenciales de Super Administrador para la plataforma SaaS."
        );
      }

      // 3. Limpiar cachés y configurar sesión
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(`medizen_cached_roles_${data.user.id}`);
        } catch {}
      }

      if (data.session) {
        setAuthSessionManually(data.session);
      }
      qc.clear();
      await qc.invalidateQueries();

      toast.success("Autenticación maestra concedida. Bienvenido al Control SaaS.");
      router.navigate({ to: "/superadmin" });
    } catch (err: any) {
      setErrorMessage(err.message || "Error al autenticar en la bóveda maestra.");
      toast.error(err.message || "Error al autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 relative overflow-hidden">
      {/* Fondo estético con destellos sutiles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Logo y Encabezado */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-inner mb-1">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[11px] py-0.5 px-3 mb-2 font-mono">
                SaaS Master Vault · Medizen
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight text-white">Bóveda de Super Administrador</h1>
              <p className="text-xs text-slate-400 mt-1">
                Portal de control maestro para administración y alta de clínicas privadas.
              </p>
            </div>
          </div>

          {/* Mensaje de Error */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in-50">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSuperAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="master-email" className="text-xs text-slate-300">
                Correo Maestro del Propietario
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="master-email"
                  type="email"
                  placeholder="admin@medizen.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-primary h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="master-password" className="text-xs text-slate-300">
                Contraseña de Seguridad
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="master-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-primary h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando Privilegios Maestros...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Acceder al Panel Maestro
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </>
              )}
            </Button>
          </form>

          {/* Footer de navegación */}
          <div className="pt-4 border-t border-slate-800/80 text-center">
            <Link
              to="/auth"
              className="text-xs text-slate-400 hover:text-primary transition-colors inline-flex items-center gap-1.5"
            >
              ← Volver al Acceso Clínico Regular
            </Link>
          </div>
        </div>

        {/* Cifrado y Cumplimiento */}
        <p className="text-[11px] text-center text-slate-600 mt-4">
          Sesión protegida mediante tokens JWT criptográficos y Row Level Security (RLS).
        </p>
      </div>
    </div>
  );
}
