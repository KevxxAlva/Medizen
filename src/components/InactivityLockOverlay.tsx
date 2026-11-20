import { useState, useEffect, useCallback, useEffectEvent } from "react";
import { Lock, LockOpen, ShieldCheck, LogOut, Delete, Keyboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { clearScreenLock } from "@/lib/auth/quickAccess";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InactivityLockOverlayProps {
  isLocked: boolean;
  onUnlock: (pin: string) => Promise<boolean> | boolean;
  doctorName?: string;
  clinicName?: string;
}

const KEYPAD_KEYS: Array<{ digit: string; letters?: string }> = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
];

function getInitials(name: string): string {
  const parts = (name || "DR").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function LockPinBoxes({
  pinLength,
  unlockedAnim,
  shake,
}: {
  pinLength: number;
  unlockedAnim: boolean;
  shake: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-3 mb-2">
      {[0, 1, 2, 3].map((index) => {
        const isFilled = pinLength > index;
        const isNext = pinLength === index && !unlockedAnim && !shake;
        return (
          <div
            key={index}
            className={cn(
              "h-13 w-12 rounded-2xl border-2 flex items-center justify-center transition-[background-color,border-color,box-shadow] duration-200",
              unlockedAnim
                ? "border-emerald-500 bg-emerald-500/10"
                : shake
                  ? "border-rose-500 bg-rose-500/10"
                  : isFilled
                    ? "border-primary bg-primary/10 shadow-xs"
                    : isNext
                      ? "border-primary/60 bg-background ring-4 ring-primary/10"
                      : "border-border/70 bg-muted/35",
            )}
          >
            {isFilled && (
              <span
                className={cn(
                  "h-3 w-3 rounded-full pin-dot-anim",
                  unlockedAnim ? "bg-emerald-500" : shake ? "bg-rose-500" : "bg-primary",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LockKeypad({
  disabled,
  pinEmpty,
  onDigit,
  onClear,
  onBackspace,
}: {
  disabled: boolean;
  pinEmpty: boolean;
  onDigit: (d: string) => void;
  onClear: () => void;
  onBackspace: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5 w-full max-w-[264px]">
      {KEYPAD_KEYS.map(({ digit, letters }) => (
        <button
          key={digit}
          type="button"
          disabled={disabled}
          onClick={() => onDigit(digit)}
          className="group h-14 rounded-2xl border border-border/60 bg-background/80 hover:bg-primary hover:border-primary hover:text-primary-foreground active:scale-95 transition-[background-color,border-color,color,transform] duration-150 shadow-2xs flex flex-col items-center justify-center cursor-pointer disabled:opacity-60"
        >
          <span className="text-xl font-extrabold leading-none">{digit}</span>
          {letters ? (
            <span className="text-[9px] font-bold tracking-widest text-muted-foreground group-hover:text-primary-foreground/80 mt-0.5 leading-none">
              {letters}
            </span>
          ) : (
            <span className="text-[9px] opacity-0 mt-0.5 leading-none">·</span>
          )}
        </button>
      ))}

      <button
        type="button"
        disabled={disabled || pinEmpty}
        onClick={onClear}
        className="h-14 rounded-2xl border border-transparent bg-muted/40 text-muted-foreground font-bold text-xs hover:bg-muted hover:text-foreground active:scale-95 transition-[background-color,color,transform] cursor-pointer disabled:opacity-40"
      >
        Limpiar
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit("0")}
        className="h-14 rounded-2xl border border-border/60 bg-background/80 hover:bg-primary hover:border-primary hover:text-primary-foreground active:scale-95 transition-[background-color,border-color,color,transform] duration-150 shadow-2xs flex flex-col items-center justify-center cursor-pointer disabled:opacity-60"
      >
        <span className="text-xl font-extrabold leading-none">0</span>
      </button>

      <button
        type="button"
        disabled={disabled || pinEmpty}
        onClick={onBackspace}
        aria-label="Borrar dígito"
        className="h-14 rounded-2xl border border-transparent bg-muted/40 text-muted-foreground flex items-center justify-center hover:bg-muted hover:text-foreground active:scale-95 transition-[background-color,color,transform] cursor-pointer disabled:opacity-40"
      >
        <Delete className="h-5 w-5" />
      </button>
    </div>
  );
}

export function InactivityLockOverlay(props: InactivityLockOverlayProps) {
  if (!props.isLocked) return null;
  return <InactivityLockOverlayModal key="locked" {...props} />;
}

function InactivityLockOverlayModal({
  onUnlock,
  doctorName = "Doctor(a)",
  clinicName = "Medizen Suite",
}: InactivityLockOverlayProps) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [unlockedAnim, setUnlockedAnim] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const submitPin = useCallback(
    async (pinToSubmit: string) => {
      setVerifying(true);
      try {
        const success = await onUnlock(pinToSubmit);
        if (!success) {
          setShake(true);
          setErrorMsg("PIN incorrecto. Verifica e intenta nuevamente.");
          toast.error("PIN incorrecto.");
          setTimeout(() => {
            setShake(false);
            setPin("");
            setVerifying(false);
          }, 480);
        } else {
          setUnlockedAnim(true);
          toast.success("Sesión clínica restaurada.");
        }
      } catch {
        setVerifying(false);
        setPin("");
      }
    },
    [onUnlock],
  );

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (verifying || unlockedAnim || pin.length >= 4) return;
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg("");
      if (newPin.length === 4) {
        void submitPin(newPin);
      }
    },
    [pin, verifying, unlockedAnim, submitPin],
  );

  const handleBackspace = useCallback(() => {
    if (verifying || unlockedAnim) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg("");
  }, [verifying, unlockedAnim]);

  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (verifying || unlockedAnim) return;
    if (e.key >= "0" && e.key <= "9" && pin.length < 4) {
      handleDigitPress(e.key);
    } else if (e.key === "Backspace") {
      handleBackspace();
    } else if (e.key === "Escape") {
      setPin("");
      setErrorMsg("");
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => onKeyDown(e);
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    clearScreenLock();
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const initials = getInitials(doctorName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-3xl p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-80 w-[34rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-28 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <style>{`
        @keyframes pin-dot-pop {
          0% { transform: scale(0.4); opacity: 0; }
          70% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pin-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .pin-dot-anim { animation: pin-dot-pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .pin-shake-anim { animation: pin-shake 0.38s ease-in-out; }
      `}</style>

      <div
        className={cn(
          "relative z-10 w-full max-w-[390px] rounded-[2rem] border border-border/70 bg-card/95 shadow-2xl ring-1 ring-primary/10 overflow-hidden transition-transform",
          shake && "pin-shake-anim",
        )}
      >
        <div
          className={cn(
            "h-1.5 w-full transition-colors duration-300",
            unlockedAnim
              ? "bg-emerald-500"
              : shake
                ? "bg-rose-500"
                : "bg-gradient-to-r from-primary via-violet-500 to-primary",
          )}
        />

        <div className="px-6 pt-6 pb-5 sm:px-7 sm:pt-7 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/70 border border-border/60 text-[11px] font-bold text-muted-foreground mb-4">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="truncate max-w-[200px]">{clinicName}</span>
          </div>

          <div className="relative mb-3">
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl border transition-[background-color,border-color,color,transform] duration-300 shadow-sm",
                unlockedAnim
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500 scale-105"
                  : shake
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-500"
                    : "bg-gradient-to-br from-primary/15 to-violet-500/10 border-primary/25 text-primary",
              )}
            >
              {unlockedAnim ? <LockOpen className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
            </div>
            <span
              className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-card border-2 border-card shadow-sm text-[10px] font-extrabold text-primary ring-1 ring-border"
              title={doctorName}
            >
              {initials}
            </span>
          </div>

          <div className="space-y-1 mb-5">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              {unlockedAnim ? "Acceso Concedido" : "Sesión Protegida"}
            </h2>
            <p className="text-xs font-bold text-foreground/80">{doctorName}</p>
            <p className="text-[11px] text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
              Ingresa tu PIN de 4 dígitos para retomar la sesión clínica.
            </p>
          </div>

          <LockPinBoxes pinLength={pin.length} unlockedAnim={unlockedAnim} shake={shake} />

          <div className="min-h-[22px] flex items-center justify-center mb-3">
            {errorMsg ? (
              <p role="alert" aria-live="polite" className="text-[11px] font-bold text-rose-500 animate-in fade-in">
                {errorMsg}
              </p>
            ) : (
              <p className="text-[10px] font-medium text-muted-foreground/75 flex items-center gap-1">
                <Keyboard className="h-3 w-3" />
                También puedes escribir con el teclado
              </p>
            )}
          </div>

          <LockKeypad
            disabled={verifying || unlockedAnim}
            pinEmpty={pin.length === 0}
            onDigit={handleDigitPress}
            onClear={() => {
              setPin("");
              setErrorMsg("");
            }}
            onBackspace={handleBackspace}
          />
        </div>

        <div className="px-6 py-3.5 bg-muted/30 border-t border-border/50 flex items-center justify-between text-xs">
          <span className="text-[11px] text-muted-foreground font-medium">Bloqueo por inactividad</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-rose-500 transition-colors font-bold cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
