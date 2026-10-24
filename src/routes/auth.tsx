import React, { useState, useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MedizenLogo } from "@/components/MedizenLogo";
import { 
  getQuickAccessAccounts, 
  getLastQuickAccessAccount, 
  verifyUserPin, 
  saveQuickAccessAccount,
  removeQuickAccessAccount,
  type QuickAccessProfile 
} from "@/lib/auth/quickAccess";
import {
  Activity,
  Sparkles,
  CreditCard,
} from "lucide-react";
import {
  AuthQuickLoginForm,
  AuthStandardLoginForm,
  AuthRecoveryForm,
  AuthResetPasswordForm,
  AuthBootstrapForm,
  AuthCarouselBanner,
} from "@/components/auth/AuthForms";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const slides = [
  {
    badge: "Plataforma Integral de Salud",
    title: "Gestión médica de alta precisión",
    desc: "Optimiza la administración de tu consultorio con historiales clínicos completos, agenda médica sincronizada y facturación inteligente.",
    featureIcon: Activity,
    featureTitle: "Historial Clínico Inteligente",
    featureDesc: "Evolución cronológica de pacientes, antecedentes gineco-obstétricos y emisión rápida de recetas con firma digital.",
  },
  {
    badge: "Control Financiero y Facturación",
    title: "Facturación clara, sin complicaciones",
    desc: "Emite recibos profesionales en PDF al instante, controla los cobros en divisas o moneda local y mantén tus cuentas al día.",
    featureIcon: CreditCard,
    featureTitle: "Recibos y Comprobantes en PDF",
    featureDesc: "Generación automática de recibos con logo de la clínica y control en tiempo real de ingresos por paciente o período.",
  },
  {
    badge: "Seguridad y Accesibilidad Médica",
    title: "Tus datos siempre seguros y a mano",
    desc: "Cumplimiento con estándares de protección de datos médicos, respaldos automáticos continuos y acceso rápido con PIN de 4 dígitos.",
    featureIcon: Sparkles,
    featureTitle: "Métricas y Análisis de Crecimiento",
    featureDesc: "Toma decisiones basadas en datos reales. Analiza el rendimiento de tu clínica y optimiza la atención.",
  },
];

function useAuthPageLogic() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "quick-login" | "bootstrap" | "recovery" | "reset-password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return toast.error(error.message);
      }

      try {
        const user = data.user;
        if (user) {
          const { data: dbUser } = await supabase
            .from("usuarios")
            .select("pin_seguridad")
            .eq("auth_id", user.id)
            .maybeSingle();

          const userPin = dbUser?.pin_seguridad || user.user_metadata?.security_pin;
          if (userPin && String(userPin).length === 4) {
            await saveQuickAccessAccount({
              userId: user.id,
              email: user.email || email,
              fullName: user.user_metadata?.full_name || email.split("@")[0],
              pin: String(userPin),
            });
          }
        }
      } catch {}

      toast.success("¡Bienvenido/a de nuevo!");
      router.navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  const handlePinUnlock = async (enteredPin: string) => {
    if (!selectedAccount) return;
    setLoading(true);

    try {
      const isValid = await verifyUserPin(selectedAccount.userId, enteredPin);
      if (isValid) {
        const { data } = await supabase.auth.getSession();
        if (data.session && data.session.user.id === selectedAccount.userId) {
          toast.success(`Sesión restaurada como ${selectedAccount.fullName}`);
          router.navigate({ to: "/" });
          return;
        }

        toast.info("Ingresa tu contraseña para sincronizar este dispositivo.");
        setEmail(selectedAccount.email);
        setMode("login");
      } else {
        setPinError(true);
        setIsShaking(true);
        setPin("");
        setTimeout(() => setIsShaking(false), 500);
        toast.error("Clave de 4 dígitos incorrecta.");
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
    currentSlide,
    setCurrentSlide,
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
    currentSlide,
    setCurrentSlide,
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

  return (
    <div className="min-h-screen w-full flex bg-background font-sans">
      <div className="w-full md:w-[50%] lg:w-[45%] flex flex-col justify-between p-6 sm:p-10 lg:p-16 bg-card dark:bg-zinc-950 min-h-screen md:min-h-0">
        <div className="flex items-center gap-3">
          <MedizenLogo className="h-8 w-8 flex-shrink-0 transition-transform duration-300" />
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Medi<span className="text-primary">zen</span>
          </span>
        </div>

        <div className="my-auto py-8 max-w-[360px] w-full mx-auto">
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
        </div>

        <div className="text-center text-[10px] text-zinc-400 font-medium">
          © {new Date().getFullYear()} Medizen. Todos los derechos reservados.
        </div>
      </div>

      <AuthCarouselBanner
        slides={slides}
        currentSlide={currentSlide}
        onSlideChange={setCurrentSlide}
      />
    </div>
  );
}
