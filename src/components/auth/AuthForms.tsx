import React from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { QuickAccessProfile } from "@/lib/utils/pinStorage";

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
    <div className="space-y-6 text-center animate-in fade-in duration-300">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          ¡Hola de nuevo!
        </h2>
        <p className="text-xs text-muted-foreground">
          Ingresa tu clave de 4 dígitos para acceder al sistema
        </p>
      </div>

      <div className="p-4 rounded-3xl bg-muted/40 border border-border/40 text-left flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-2xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shadow-sm shadow-primary/20 flex-shrink-0">
            {selectedAccount.fullName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-sm text-foreground truncate">
                {selectedAccount.fullName}
              </h3>
              {selectedAccount.role && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                  {selectedAccount.role}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {selectedAccount.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onForgetAccount(selectedAccount.userId)}
          title="Olvidar esta cuenta en este equipo"
          className="text-muted-foreground hover:text-destructive p-2 rounded-xl hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {quickAccounts.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap text-xs">
          <span className="text-muted-foreground text-[11px] font-medium">Otras cuentas:</span>
          {quickAccounts
            .filter((acc) => acc.userId !== selectedAccount.userId)
            .map((acc) => (
              <button
                key={acc.userId}
                type="button"
                onClick={() => onSelectAccount(acc)}
                className="text-[11px] font-bold text-primary hover:underline bg-primary/5 px-2 py-0.5 rounded-lg transition-colors"
              >
                {acc.fullName.split(" ")[0]}
              </button>
            ))}
        </div>
      )}

      <div className={`space-y-4 pt-1 ${isShaking ? "animate-shake" : ""}`}>
        <div className="flex flex-col items-center justify-center gap-2">
          <InputOTP
            maxLength={4}
            value={pin}
            onChange={onPinChange}
            disabled={loading}
            autoFocus
          >
            <InputOTPGroup className="gap-2.5">
              <InputOTPSlot
                index={0}
                className={`w-12 h-14 rounded-2xl text-2xl font-bold bg-card border-2 transition-colors ${pinError ? "border-destructive text-destructive" : "border-border/60 focus:border-primary"}`}
              />
              <InputOTPSlot
                index={1}
                className={`w-12 h-14 rounded-2xl text-2xl font-bold bg-card border-2 transition-colors ${pinError ? "border-destructive text-destructive" : "border-border/60 focus:border-primary"}`}
              />
              <InputOTPSlot
                index={2}
                className={`w-12 h-14 rounded-2xl text-2xl font-bold bg-card border-2 transition-colors ${pinError ? "border-destructive text-destructive" : "border-border/60 focus:border-primary"}`}
              />
              <InputOTPSlot
                index={3}
                className={`w-12 h-14 rounded-2xl text-2xl font-bold bg-card border-2 transition-colors ${pinError ? "border-destructive text-destructive" : "border-border/60 focus:border-primary"}`}
              />
            </InputOTPGroup>
          </InputOTP>

          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Protegido con clave de 4 dígitos
          </p>
        </div>

        <Button
          type="button"
          disabled={loading || pin.length !== 4}
          onClick={() => onPinUnlock(pin)}
          className="w-full h-11 rounded-2xl bg-primary hover:bg-[#3451d6] text-primary-foreground font-semibold shadow-md shadow-blue-500/10 hover:shadow-primary/20 active:scale-[0.99] transition-colors flex items-center justify-center gap-2 border-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
              <span>Verificando...</span>
            </>
          ) : (
            <>
              <span>Continuar</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground pt-1 bg-transparent border-0 cursor-pointer transition-colors"
        >
          <Lock className="w-3.5 h-3.5" />
          Ingresar con otra cuenta o contraseña
        </button>
      </div>
    </div>
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
    <>
      {quickAccounts.length > 0 && (
        <button
          type="button"
          onClick={() => onSwitchToQuickLogin(quickAccounts[0])}
          className="w-full flex items-center justify-between p-3 mb-6 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/20 text-xs font-bold text-primary transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-primary text-primary-foreground text-[11px] font-black flex items-center justify-center shadow-xs">
              {quickAccounts[0].fullName.slice(0, 2).toUpperCase()}
            </div>
            <span>Continuar como {quickAccounts[0].fullName.split(" ")[0]} con PIN</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Iniciar sesión</h2>
      <p className="text-sm text-zinc-400 mt-2">
        Introduce tus credenciales para acceder a la suite clínica.
      </p>

      <form onSubmit={onLogin} className="mt-8 space-y-5">
        <div className="space-y-1.5 text-left">
          <Label htmlFor="email" className="text-zinc-500 font-medium text-xs">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="ejemplo@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 h-11 focus-visible:ring-2 focus-visible:ring-[#4361ee] transition-colors"
          />
        </div>

        <div className="space-y-1.5 text-left">
          <Label htmlFor="password" className="text-zinc-500 font-medium text-xs">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 pr-10 h-11 focus-visible:ring-2 focus-visible:ring-[#4361ee] transition-colors"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0 cursor-pointer bg-transparent border-0 flex items-center"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-zinc-300 dark:border-zinc-800 text-primary focus:ring-[#4361ee] w-4 h-4 cursor-pointer"
            />
            <span>Recordarme</span>
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="font-bold text-zinc-400 hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-2xl bg-primary hover:bg-[#3451d6] text-primary-foreground font-semibold shadow-md shadow-blue-500/10 hover:shadow-primary/20 active:scale-[0.99] transition-colors flex items-center justify-center gap-2 border-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : "Iniciar sesión"}
        </Button>
      </form>
    </>
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
    <>
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Recuperar contraseña</h2>
      <p className="text-sm text-zinc-400 mt-2">
        Ingresa tu correo y te enviaremos las instrucciones para restablecer tu acceso.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="space-y-1.5 text-left">
          <Label htmlFor="recovery-email" className="text-zinc-500 font-medium text-xs">Correo electrónico</Label>
          <Input
            id="recovery-email"
            type="email"
            placeholder="ejemplo@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 h-11 focus-visible:ring-2 focus-visible:ring-[#4361ee] transition-colors"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-2xl bg-primary hover:bg-[#3451d6] text-primary-foreground font-semibold shadow-md shadow-blue-500/10 hover:shadow-primary/20 active:scale-[0.99] transition-colors flex items-center justify-center gap-2 border-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : "Enviar enlace"}
        </Button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 mt-4 bg-transparent border-0 cursor-pointer p-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a iniciar sesión
        </button>
      </form>
    </>
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
    <>
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Nueva contraseña</h2>
      <p className="text-sm text-zinc-400 mt-2">
        Ingresa tu nueva contraseña para reestablecer tu acceso a la plataforma.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="space-y-1.5 text-left">
          <Label htmlFor="new-password" className="text-zinc-500 font-medium text-xs">Nueva contraseña</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 pr-10 h-11 focus-visible:ring-2 focus-visible:ring-[#4361ee] transition-colors"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0 cursor-pointer bg-transparent border-0 flex items-center"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-2xl bg-primary hover:bg-[#3451d6] text-primary-foreground font-semibold shadow-md shadow-blue-500/10 hover:shadow-primary/20 active:scale-[0.99] transition-colors flex items-center justify-center gap-2 border-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : "Actualizar contraseña"}
        </Button>
      </form>
    </>
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
    <>
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Primer Admin</h2>
      <p className="text-sm text-zinc-400 mt-2">
        Crea la primera cuenta del sistema. Quedará automáticamente como administrador.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5 text-left">
          <Label htmlFor="bfn" className="text-zinc-500 font-medium text-xs">Nombre completo</Label>
          <Input
            id="bfn"
            placeholder="Dra. Katherine Mendoza"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 h-11 focus-visible:ring-2 focus-visible:ring-[#4361ee] transition-colors"
          />
        </div>

        <div className="space-y-1.5 text-left">
          <Label htmlFor="bem" className="text-zinc-500 font-medium text-xs">E-mail</Label>
          <Input
            id="bem"
            type="email"
            placeholder="admin@femesalud.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 h-11 focus-visible:ring-2 focus-visible:ring-[#4361ee] transition-colors"
          />
        </div>

        <div className="space-y-1.5 text-left">
          <Label htmlFor="bpw" className="text-zinc-500 font-medium text-xs">Contraseña (mín. 8)</Label>
          <div className="relative">
            <Input
              id="bpw"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 pr-10 h-11 focus-visible:ring-2 focus-visible:ring-[#4361ee] transition-colors"
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0 cursor-pointer bg-transparent border-0 flex items-center"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-2xl bg-primary hover:bg-[#3451d6] text-primary-foreground font-semibold shadow-md shadow-blue-500/10 hover:shadow-primary/20 active:scale-[0.99] transition-colors flex items-center justify-center gap-2 border-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : "Crear administrador"}
        </Button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 mt-4 bg-transparent border-0 cursor-pointer p-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a iniciar sesión
        </button>
      </form>
    </>
  );
}

export function AuthCarouselBanner({
  slides,
  currentSlide,
  onSlideChange,
}: {
  slides: any[];
  currentSlide: number;
  onSlideChange: (idx: number | ((prev: number) => number)) => void;
}) {
  const SlideIcon = slides[currentSlide].featureIcon;
  return (
    <div className="hidden md:flex md:w-[50%] lg:w-[55%] flex-col justify-between p-12 lg:p-16 relative overflow-hidden bg-gradient-to-br from-[#0b1437] via-[#111c44] to-[#1b2559] text-primary-foreground">
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex justify-end z-10">
        <button
          onClick={() => toast.success("Soporte FemeSalud iniciado. Escríbenos a soporte@femesalud.com")}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card/5 hover:bg-card/10 border border-white/10 transition-colors text-xs font-semibold cursor-pointer"
        >
          <Headphones className="w-3.5 h-3.5 text-primary" />
          <span>Support</span>
        </button>
      </div>

      <div className="my-auto max-w-[440px] mx-auto w-full z-10 flex flex-col items-center">
        <div className="w-full relative min-h-[300px] flex flex-col items-center justify-center">
          <div
            key={currentSlide}
            className="w-full p-6 rounded-3xl bg-card/5 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-500"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                {slides[currentSlide].badge}
              </span>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-semibold">SSL 256-bit</span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-white">
                {slides[currentSlide].title}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {slides[currentSlide].desc}
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                <SlideIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {slides[currentSlide].featureTitle}
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                  {slides[currentSlide].featureDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between z-10">
        <div className="flex gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              onClick={() => onSlideChange(i)}
              className={`h-2 rounded-full cursor-pointer transition-[width,background-color] duration-200 border-0 p-0 ${i === currentSlide ? "w-5 bg-primary" : "w-2 bg-card/20 hover:bg-card/40"}`}
              aria-label={`Ir al slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5 border border-white/5 bg-card/5 rounded-xl p-0.5">
          <button
            onClick={() => onSlideChange((prev) => (prev - 1 + slides.length) % slides.length)}
            className="w-7 h-7 rounded-lg hover:bg-card/10 flex items-center justify-center text-primary-foreground/70 hover:text-primary-foreground transition-colors bg-transparent border-0 cursor-pointer"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSlideChange((prev) => (prev + 1) % slides.length)}
            className="w-7 h-7 rounded-lg hover:bg-card/10 flex items-center justify-center text-primary-foreground/70 hover:text-primary-foreground transition-colors bg-transparent border-0 cursor-pointer"
            aria-label="Siguiente slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
