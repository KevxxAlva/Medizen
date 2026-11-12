import React, { useState, useEffect } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { setSessionPersistence, supabase } from "@/integrations/supabase/client";
import { setAuthSessionManually } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MedizenLogo } from "@/components/MedizenLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RecipeVerificationModal } from "@/components/RecipeVerificationModal";
import {
  getQuickAccessAccounts,
  getLastQuickAccessAccount,
  unlockQuickAccessAccount,
  saveQuickAccessAccount,
  removeQuickAccessAccount,
  type QuickAccessProfile,
} from "@/lib/auth/quickAccess";
import { Activity, Sparkles, CreditCard, ShieldCheck } from "lucide-react";
import {
  AuthQuickLoginForm,
  AuthStandardLoginForm,
  AuthRecoveryForm,
  AuthResetPasswordForm,
  AuthBootstrapForm,
  AuthCarouselBanner,
  type AuthSlide,
} from "@/components/auth/AuthForms";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const slides: AuthSlide[] = [
  {
    badge: "Operación Clínica Integral",
    title: "Gestión médica de alta precisión y sala de espera en vivo",
    desc: "Coordina recepción, consultorios y expedientes médicos con sincronización en tiempo real y aislamiento por especialista.",
    featureIcon: Activity,
    featureTitle: "Expediente Clínico y Récipes Digitales",
    featureDesc:
      "Evolución cronológica de pacientes, notas clínicas con dictado por voz y emisión de récipes con código verificable y envío por WhatsApp.",
    metricValue: "Realtime",
    metricLabel: "WebSockets Sync",
    highlights: [
      "Sala de espera y turnos en vivo",
      "Historias gineco-obstétricas y generales",
      "Diseñador de récipes y envío WhatsApp",
      "Alcance seguro por rol médico",
    ],
  },
  {
    badge: "Control Financiero Multimoneda",
    title: "Facturación clara y tesorería sincronizada sin fricción",
    desc: "Emite comprobantes en PDF al instante, concilia cobros en divisas o Bolívares y ejecuta cierres de caja con Reporte Z.",
    featureIcon: CreditCard,
    featureTitle: "Tasas BCV, EUR y USDT en Tiempo Real",
    featureDesc:
      "Conversión automática multimoneda, partición estricta de facturas por médico, control de honorarios y reportes ejecutivos PDF/CSV.",
    metricValue: "BCV / USDT",
    metricLabel: "Tasa sincronizada",
    highlights: [
      "Conversor BCV, Euro y USDT integrado",
      "Cierre de caja diario (Reporte Z)",
      "Liquidación de honorarios médicos",
      "Recibos e informes en PDF y CSV",
    ],
  },
  {
    badge: "Seguridad y Velocidad Clínica",
    title: "Tus datos protegidos con desbloqueo instantáneo por PIN",
    desc: "Bóveda criptográfica en el dispositivo, bloqueo automático por inactividad y caché multinivel L1/L2 para respuesta inmediata.",
    featureIcon: Sparkles,
    featureTitle: "Bóveda Local AES-256 y Caché L1/L2",
    featureDesc:
      "Desbloqueo en 1 segundo mediante PIN de 4 dígitos, políticas Row Level Security (RLS) en PostgreSQL y auditoría de operaciones.",
    metricValue: "AES-256",
    metricLabel: "Bóveda local",
    highlights: [
      "Acceso rápido con PIN de 4 dígitos",
      "Bloqueo automático por inactividad",
      "Aplicación instalable PWA multiplataforma",
      "Auditoría de seguridad administrativa",
    ],
  },
];

function useAuthPageLogic() {
  const router = useRouter();
  const qc = useQueryClient();
  const [mode, setMode] = useState<
    "login" | "quick-login" | "bootstrap" | "recovery" | "reset-password"
  >("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [quickAccounts, setQuickAccounts] = useState<QuickAccessProfile[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<QuickAccessProfile | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);

    if (hash && hash.includes("type=recovery")) {
      setMode("reset-password");
    } else if (params.get("bootstrap") === "true") {
      setMode("bootstrap");
    } else {
      const accounts = getQuickAccessAccounts();
      setQuickAccounts(accounts);
      const last = getLastQuickAccessAccount();
      if (last) {
        setSelectedAccount(last);
        setMode("quick-login");
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !hash.includes("type=recovery") && mode !== "reset-password") {
        router.navigate({ to: "/", replace: true });
      }
    });
  }, [router, mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSessionPersistence(rememberMe);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (!rememberMe) {
          setSessionPersistence(true);
        }
        return toast.error(error.message);
      }

      if (rememberMe) {
        try {
          const user = data.user;
          if (user) {
            const { data: dbUser } = await supabase
              .from("usuarios")
              .select("pin_seguridad, nombre_usuario, roles(nombre_rol), medicos(nombre, apellido)")
              .eq("auth_id", user.id)
              .maybeSingle();

            const userPin = dbUser?.pin_seguridad || user.user_metadata?.security_pin;
            if (userPin && /^\d{4}$/.test(String(userPin))) {
              const roleObj = dbUser?.roles;
              const dbRole = Array.isArray(roleObj)
                ? roleObj[0]?.nombre_rol
                : (roleObj as { nombre_rol?: string } | null)?.nombre_rol;
              const medObj = dbUser?.medicos;
              const doc = Array.isArray(medObj) ? medObj[0] : medObj;
              const docName = doc ? `${doc.nombre} ${doc.apellido}`.trim() : "";

              await saveQuickAccessAccount({
                userId: user.id,
                email: user.email || email,
                fullName:
                  docName ||
                  (user.user_metadata?.full_name as string | undefined) ||
                  dbUser?.nombre_usuario ||
                  email.split("@")[0],
                role: dbRole || (user.user_metadata?.role as string | undefined),
                password,
                pin: String(userPin),
              });
            }
          }
        } catch {
          // Ignorar si la tabla o el PIN opcional no están disponibles al iniciar sesión
        }
      }

      if (data.session) {
        setAuthSessionManually(data.session);
      }
      await qc.invalidateQueries();

      toast.success("¡Bienvenido/a de nuevo!");
      router.navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  const handlePinUnlock = async (enteredPin: string) => {
    if (!selectedAccount) return;
    setLoading(true);
    setSessionPersistence(true);

    try {
      const result = await unlockQuickAccessAccount(selectedAccount.userId, enteredPin);
      if (result.success) {
        if (result.session) {
          setAuthSessionManually(result.session);
        }
        await qc.invalidateQueries();
        toast.success(`Sesión restaurada como ${selectedAccount.fullName}`);
        router.navigate({ to: "/" });
        return;
      }

      setPinError(true);
      setIsShaking(true);
      setPin("");
      setTimeout(() => setIsShaking(false), 500);
      toast.error(result.error || "Clave de 4 dígitos incorrecta.");

      if (result.error?.includes("contraseña") || result.error?.includes("registro")) {
        setEmail(selectedAccount.email);
        setMode("login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setPin(clean);
    setPinError(false);
    if (clean.length === 4) {
      handlePinUnlock(clean);
    }
  };

  const handleForgetAccount = (userId: string) => {
    removeQuickAccessAccount(userId);
    const updated = getQuickAccessAccounts();
    setQuickAccounts(updated);
    if (updated.length > 0) {
      setSelectedAccount(updated[0]);
    } else {
      setSelectedAccount(null);
      setMode("login");
    }
    toast.info("Cuenta desvinculada de este equipo.");
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Instrucciones enviadas a tu correo para restablecer la contraseña.");
        setMode("login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.");
        setMode("login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: "admin",
          },
        },
      });

      if (error) return toast.error(error.message);

      if (data.session) {
        setAuthSessionManually(data.session);
        await qc.invalidateQueries();
        toast.success("¡Administrador creado con éxito!");
        router.navigate({ to: "/" });
      } else {
        toast.success("Cuenta creada. Revisa tu correo o inicia sesión.");
        setMode("login");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    setMode,
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    loading,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    quickAccounts,
    selectedAccount,
    setSelectedAccount,
    pin,
    setPin,
    pinError,
    setPinError,
    isShaking,
    handleLogin,
    handlePinUnlock,
    handlePinChange,
    handleForgetAccount,
    handleRecovery,
    handleResetPassword,
    handleBootstrap,
  };
}

function AuthPage() {
  const {
    mode,
    setMode,
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    loading,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    quickAccounts,
    selectedAccount,
    setSelectedAccount,
    pin,
    setPin,
    pinError,
    setPinError,
    isShaking,
    handleLogin,
    handlePinUnlock,
    handlePinChange,
    handleForgetAccount,
    handleRecovery,
    handleResetPassword,
    handleBootstrap,
  } = useAuthPageLogic();

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex bg-background font-sans">
      {/* Left Column: Auth Workspace */}
      <div className="w-full md:w-[48%] lg:w-[44%] flex flex-col justify-between p-6 sm:p-10 lg:px-14 lg:py-10 bg-card dark:bg-black border-r border-border min-h-screen md:min-h-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MedizenLogo className="h-8 w-8 flex-shrink-0 transition-transform duration-300" />
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg leading-none tracking-normal text-foreground">
                Medi<span className="text-primary">zen</span>
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                Suite Clínica Inteligente
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVerifyModalOpen(true)}
              className="md:hidden inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-muted/60 hover:bg-muted border border-border/60 text-[11px] font-semibold text-foreground transition-colors cursor-pointer"
              title="Verificar autenticidad de récipe médico"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Verificar</span>
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Form Container */}
        <main className="my-auto py-8 max-w-[400px] w-full mx-auto">
          {mode === "quick-login" && selectedAccount && (
            <AuthQuickLoginForm
              selectedAccount={selectedAccount}
              quickAccounts={quickAccounts}
              pin={pin}
              pinError={pinError}
              isShaking={isShaking}
              loading={loading}
              onSelectAccount={(acc) => {
                setSelectedAccount(acc);
                setPin("");
                setPinError(false);
              }}
              onPinChange={handlePinChange}
              onPinUnlock={handlePinUnlock}
              onForgetAccount={handleForgetAccount}
              onSwitchToLogin={() => {
                setMode("login");
                setPin("");
                setPinError(false);
              }}
            />
          )}

          {mode === "login" && (
            <AuthStandardLoginForm
              quickAccounts={quickAccounts}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              loading={loading}
              onLogin={handleLogin}
              onSwitchToQuickLogin={(acc) => {
                setSelectedAccount(acc);
                setMode("quick-login");
                setPin("");
                setPinError(false);
              }}
              onForgotPassword={() => setMode("recovery")}
            />
          )}

          {mode === "recovery" && (
            <AuthRecoveryForm
              email={email}
              setEmail={setEmail}
              loading={loading}
              onSubmit={handleRecovery}
              onBackToLogin={() => setMode("login")}
            />
          )}

          {mode === "reset-password" && (
            <AuthResetPasswordForm
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              onSubmit={handleResetPassword}
            />
          )}

          {mode === "bootstrap" && (
            <AuthBootstrapForm
              fullName={fullName}
              setFullName={setFullName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              onSubmit={handleBootstrap}
              onBackToLogin={() => setMode("login")}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="flex flex-col gap-2.5 pt-4 border-t border-border/60 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Conexión protegida TLS • RLS Activo</span>
            </div>
            <nav
              aria-label="Enlaces legales y descarga"
              className="flex flex-wrap items-center gap-3 font-medium"
            >
              <Link
                to="/legal"
                search={{ doc: "terminos" }}
                className="hover:text-foreground hover:underline transition-colors"
              >
                Términos
              </Link>
              <Link
                to="/legal"
                search={{ doc: "privacidad" }}
                className="hover:text-foreground hover:underline transition-colors"
              >
                Privacidad
              </Link>
              <Link
                to="/legal"
                search={{ doc: "datos-clinicos" }}
                className="hover:text-foreground hover:underline transition-colors"
              >
                Aviso Médico
              </Link>
              <Link to="/descargar" className="text-primary hover:underline transition-colors">
                Descargar App
              </Link>
            </nav>
          </div>
          <span className="text-[10px] text-muted-foreground/80">
            © {new Date().getFullYear()} Medizen. Todos los derechos reservados.
          </span>
        </footer>
      </div>

      {/* Right Column: Clinical Showcase Banner */}
      <AuthCarouselBanner slides={slides} onVerifyRecipe={() => setVerifyModalOpen(true)} />

      <RecipeVerificationModal open={verifyModalOpen} onOpenChange={setVerifyModalOpen} />
    </div>
  );
}
