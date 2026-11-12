import React, { memo, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock,
  Trash2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Mail,
  KeyRound,
  User,
  Sparkles,
  CheckCircle2,
  Zap,
  Database,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import type { QuickAccessProfile } from "@/lib/auth/quickAccess";

export interface AuthSlide {
  badge: string;
  title: string;
  desc: string;
  featureIcon: LucideIcon;
  featureTitle: string;
  featureDesc: string;
  highlights?: string[];
  metricLabel?: string;
  metricValue?: string;
}

export function AuthQuickLoginForm({
  selectedAccount,
  quickAccounts,
  pin,
  pinError,
  isShaking,
  loading,
  onSelectAccount,
  onPinChange,
  onPinUnlock,
  onForgetAccount,
  onSwitchToLogin,
}: {
  selectedAccount: QuickAccessProfile;
  quickAccounts: QuickAccessProfile[];
  pin: string;
  pinError: boolean;
  isShaking: boolean;
  loading: boolean;
  onSelectAccount: (acc: QuickAccessProfile) => void;
  onPinChange: (val: string) => void;
  onPinUnlock: (pin: string) => void;
  onForgetAccount: (userId: string) => void;
  onSwitchToLogin: () => void;
}) {
  return (
    <div className="space-y-6 text-center animate-in fade-in duration-200">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Acceso Rápido Verificado</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
          ¡Hola de nuevo!
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tu PIN de 4 dígitos para desbloquear tu sesión clínica.
        </p>
      </div>

      <div className="p-3.5 rounded-2xl bg-muted/40 dark:bg-zinc-900/70 border border-border text-left flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shadow-sm shadow-primary/20 flex-shrink-0">
            {selectedAccount.fullName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-sm text-foreground truncate">
                {selectedAccount.fullName}
              </h2>
              {selectedAccount.role && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary uppercase tracking-wide">
                  {selectedAccount.role}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{selectedAccount.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onForgetAccount(selectedAccount.userId)}
          title="Olvidar esta cuenta en este equipo"
          aria-label={`Desvincular cuenta de ${selectedAccount.fullName}`}
          className="text-muted-foreground hover:text-destructive h-9 w-9 inline-flex items-center justify-center rounded-xl hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {quickAccounts.length > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
          <span className="text-muted-foreground text-xs font-medium">Cambiar cuenta:</span>
          {quickAccounts
            .filter((acc) => acc.userId !== selectedAccount.userId)
            .map((acc) => (
              <button
                key={acc.userId}
                type="button"
                onClick={() => onSelectAccount(acc)}
                className="text-xs font-semibold text-primary hover:bg-primary/15 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                {acc.fullName.split(" ")[0]}
              </button>
            ))}
        </div>
      )}

      <div className={`space-y-5 pt-1 ${isShaking ? "animate-shake" : ""}`}>
        <div className="flex flex-col items-center justify-center gap-2.5">
          <InputOTP maxLength={4} value={pin} onChange={onPinChange} disabled={loading} autoFocus>
            <InputOTPGroup className="gap-3">
              {[0, 1, 2, 3].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={`w-13 h-15 rounded-2xl text-2xl font-bold bg-background dark:bg-zinc-900/90 border-2 transition-colors ${
                    pinError
                      ? "border-destructive text-destructive bg-destructive/5"
                      : "border-border focus:border-primary"
                  }`}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Bóveda local cifrada con AES-256 GCM</span>
          </p>
        </div>

        <Button
          type="button"
          disabled={loading || pin.length !== 4}
          onClick={() => onPinUnlock(pin)}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
              <span>Verificando acceso...</span>
            </>
          ) : (
            <>
              <span>Desbloquear sesión</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full h-10 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Ingresar con correo y contraseña</span>
        </button>
      </div>
    </div>
  );
}

function AuthLegalNotice() {
  return (
    <p className="pt-2 text-center text-[11px] text-muted-foreground leading-relaxed">
      Al continuar, aceptas nuestros{" "}
      <Link
        to="/legal"
        search={{ doc: "terminos" }}
        className="font-semibold text-foreground/90 hover:text-primary hover:underline"
      >
        Términos de Uso
      </Link>{" "}
      y la{" "}
      <Link
        to="/legal"
        search={{ doc: "privacidad" }}
        className="font-semibold text-foreground/90 hover:text-primary hover:underline"
      >
        Política de Privacidad
      </Link>
      .
    </p>
  );
}

export function AuthStandardLoginForm({
  quickAccounts,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  onLogin,
  onSwitchToQuickLogin,
  onForgotPassword,
}: {
  quickAccounts: QuickAccessProfile[];
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  loading: boolean;
  onLogin: (e: React.FormEvent) => void;
  onSwitchToQuickLogin: (acc: QuickAccessProfile) => void;
  onForgotPassword: () => void;
}) {
  return (
    <div className="animate-in fade-in duration-200">
      {quickAccounts.length > 0 && (
        <button
          type="button"
          onClick={() => onSwitchToQuickLogin(quickAccounts[0])}
          className="w-full flex items-center justify-between p-3 mb-6 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/25 text-xs font-semibold text-primary transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-2xs shrink-0">
              {quickAccounts[0].fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left min-w-0">
              <p className="font-bold text-foreground truncate">
                Continuar como {quickAccounts[0].fullName.split(" ")[0]}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Desbloqueo rápido con PIN de 4 dígitos
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground text-[11px] font-medium">
          <Lock className="h-3 w-3 text-primary" />
          <span>Portal Clínico y Administrativo</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
          Iniciar sesión
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Introduce tus credenciales para acceder a la suite clínica Medizen.
        </p>
      </div>

      <form onSubmit={onLogin} className="mt-7 space-y-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="email" className="text-foreground/90 font-medium text-xs">
            Correo electrónico
          </Label>
          <div className="relative">
            <Mail className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="doctora@femesalud.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="rounded-xl border-border bg-muted/30 dark:bg-zinc-900/70 pl-10 pr-4 h-12 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-foreground/90 font-medium text-xs">
              Contraseña
            </Label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1 py-0.5 transition-colors cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="relative">
            <KeyRound className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="rounded-xl border-border bg-muted/30 dark:bg-zinc-900/70 pl-10 pr-12 h-12 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-colors"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer flex items-center justify-center transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="inline-flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none py-1">
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-border bg-background text-primary focus:ring-primary h-4 w-4 cursor-pointer accent-primary"
            />
            <span>Mantener sesión activa en este equipo</span>
          </label>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
              <span>Iniciando sesión...</span>
            </>
          ) : (
            <>
              <span>Iniciar sesión</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <AuthLegalNotice />
      </form>
    </div>
  );
}

export function AuthRecoveryForm({
  email,
  setEmail,
  loading,
  onSubmit,
  onBackToLogin,
}: {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBackToLogin: () => void;
}) {
  return (
    <div className="animate-in fade-in duration-200">
      <div className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
          Recuperar contraseña
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ingresa tu correo electrónico y te enviaremos un enlace seguro para restablecer tu acceso.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="recovery-email" className="text-foreground/90 font-medium text-xs">
            Correo electrónico
          </Label>
          <div className="relative">
            <Mail className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="recovery-email"
              type="email"
              placeholder="doctora@femesalud.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border-border bg-muted/30 dark:bg-zinc-900/70 pl-10 pr-4 h-12 text-sm focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
              <span>Enviando instrucciones...</span>
            </>
          ) : (
            <>
              <span>Enviar enlace de recuperación</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full h-10 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a iniciar sesión</span>
        </button>
      </form>
    </div>
  );
}

export function AuthResetPasswordForm({
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  onSubmit,
}: {
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="animate-in fade-in duration-200">
      <div className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
          Nueva contraseña
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Define tu nueva contraseña segura para restablecer el acceso a Medizen.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="new-password" className="text-foreground/90 font-medium text-xs">
            Nueva contraseña
          </Label>
          <div className="relative">
            <KeyRound className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl border-border bg-muted/30 dark:bg-zinc-900/70 pl-10 pr-12 h-12 text-sm focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer flex items-center justify-center transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
              <span>Actualizando...</span>
            </>
          ) : (
            "Actualizar contraseña"
          )}
        </Button>
      </form>
    </div>
  );
}

export function AuthBootstrapForm({
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  onSubmit,
  onBackToLogin,
}: {
  fullName: string;
  setFullName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBackToLogin: () => void;
}) {
  return (
    <div className="animate-in fade-in duration-200">
      <div className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
          Administrador Inicial
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Configura la primera cuenta principal del sistema con permisos de administración total.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="bfn" className="text-foreground/90 font-medium text-xs">
            Nombre completo
          </Label>
          <div className="relative">
            <User className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="bfn"
              placeholder="Dra. Katherine Mendoza"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="rounded-xl border-border bg-muted/30 dark:bg-zinc-900/70 pl-10 pr-4 h-12 text-sm focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="bem" className="text-foreground/90 font-medium text-xs">
            Correo electrónico
          </Label>
          <div className="relative">
            <Mail className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="bem"
              type="email"
              placeholder="admin@femesalud.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border-border bg-muted/30 dark:bg-zinc-900/70 pl-10 pr-4 h-12 text-sm focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="bpw" className="text-foreground/90 font-medium text-xs">
            Contraseña (mínimo 8 caracteres)
          </Label>
          <div className="relative">
            <KeyRound className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="bpw"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl border-border bg-muted/30 dark:bg-zinc-900/70 pl-10 pr-12 h-12 text-sm focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer flex items-center justify-center transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
              <span>Creando cuenta...</span>
            </>
          ) : (
            "Crear administrador"
          )}
        </Button>

        <AuthLegalNotice />

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full h-10 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a iniciar sesión</span>
        </button>
      </form>
    </div>
  );
}

export const AuthCarouselBanner = memo(function AuthCarouselBanner({
  slides,
  onVerifyRecipe,
}: {
  slides: AuthSlide[];
  onVerifyRecipe?: () => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const active = slides[currentSlide] ?? slides[0];
  const SlideIcon = active.featureIcon;

  return (
    <div className="hidden md:flex md:w-[52%] lg:w-[56%] flex-col justify-between p-10 lg:p-14 xl:p-16 relative overflow-hidden bg-[#070b19] text-white select-none">
      {/* Architectural Grid & Ambient Radial Glow */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-primary/25 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-24 w-[440px] h-[440px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-4 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-medium text-zinc-200 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Suite Clínica FemeSalud • En línea</span>
        </div>

        <div className="flex items-center gap-2">
          {onVerifyRecipe && (
            <button
              type="button"
              onClick={onVerifyRecipe}
              className="flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-colors text-xs font-semibold text-zinc-100 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verificar Récipe</span>
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              toast.success("Soporte FemeSalud activo. Escríbenos a soporte@femesalud.com")
            }
            className="flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-colors text-xs font-semibold text-zinc-100 cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5 text-blue-400" />
            <span>Soporte Técnico</span>
          </button>
        </div>
      </div>

      {/* Center Showcase Card */}
      <div className="my-auto max-w-[520px] mx-auto w-full z-10 space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-[11px] font-semibold tracking-wide uppercase">
            <Sparkles className="w-3 h-3" />
            <span>{active.badge}</span>
          </div>
          <h2
            key={`title-${currentSlide}`}
            className="font-display font-bold text-2xl lg:text-3xl text-white tracking-normal leading-tight animate-in fade-in duration-300"
          >
            {active.title}
          </h2>
          <p
            key={`desc-${currentSlide}`}
            className="text-sm text-zinc-300/90 leading-relaxed animate-in fade-in duration-300"
          >
            {active.desc}
          </p>
        </div>

        {/* Glass Feature Card */}
        <div
          key={`card-${currentSlide}`}
          className="w-full p-6 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/12 shadow-2xl space-y-5 animate-in fade-in zoom-in-98 duration-300"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-primary/25 border border-primary/40 flex items-center justify-center text-blue-300 flex-shrink-0">
                <SlideIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white tracking-normal">
                  {active.featureTitle}
                </h3>
                <p className="text-xs text-zinc-300/85 leading-relaxed mt-1">
                  {active.featureDesc}
                </p>
              </div>
            </div>

            {active.metricValue && (
              <div className="hidden sm:flex flex-col items-end px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 shrink-0">
                <span className="font-display font-bold text-sm text-emerald-400">
                  {active.metricValue}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">{active.metricLabel}</span>
              </div>
            )}
          </div>

          {active.highlights && active.highlights.length > 0 && (
            <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {active.highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-xs text-zinc-200/90 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Architectural System Pillars */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">AES-256 & RLS</p>
              <p className="text-[10px] text-zinc-400 truncate">Bóveda PIN y roles</p>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Tiempo Real</p>
              <p className="text-[10px] text-zinc-400 truncate">Sala, agenda y BCV</p>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5">
            <Database className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Caché L1/L2</p>
              <p className="text-[10px] text-zinc-400 truncate">Respuesta instantánea</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Carousel Controls */}
      <div className="flex items-center justify-between z-10 pt-4">
        <div className="flex items-center gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => setCurrentSlide(i)}
              className="group py-2 px-1 cursor-pointer bg-transparent border-0 flex items-center"
              aria-label={`Ir a la diapositiva ${i + 1}: ${slide.badge}`}
            >
              <span
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === currentSlide ? "w-7 bg-blue-400" : "w-2 bg-white/25 group-hover:bg-white/50"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 border border-white/10 bg-white/[0.04] rounded-xl p-1">
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
            aria-label="Diapositiva anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
            aria-label="Siguiente diapositiva"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
