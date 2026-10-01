import React, { useState, useEffect } from "react";
import { Lock, ShieldAlert, LogOut, ArrowRight, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InactivityLockOverlayProps {
  isLocked: boolean;
  onUnlock: (pin: string) => boolean;
  doctorName?: string;
  clinicName?: string;
}

export function InactivityLockOverlay({
  isLocked,
  onUnlock,
  doctorName = "Doctor(a)",
  clinicName = "Medizen Suite",
}: InactivityLockOverlayProps) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // Reset states when lock status changes
  useEffect(() => {
    if (isLocked) {
      setPin("");
      setErrorMsg("");
    }
  }, [isLocked]);

  // Support direct keyboard input
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        if (pin.length < 4) {
          handleDigitPress(e.key);
        }
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        setPin("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, pin]);

  if (!isLocked) return null;

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg("");

    if (newPin.length === 4) {
      // Auto-submit on 4th digit
      submitPin(newPin);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  const submitPin = (pinToSubmit: string) => {
    const success = onUnlock(pinToSubmit);
    if (!success) {
      setShake(true);
      setErrorMsg("PIN incorrecto. Intente nuevamente.");
      toast.error("PIN incorrecto.");
      setTimeout(() => {
        setShake(false);
        setPin("");
      }, 500);
    } else {
      toast.success("Sesión clínica restaurada.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
      <div 
        className={cn(
          "w-full max-w-sm rounded-[2.5rem] border border-border/80 bg-card/95 p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-5 transition-transform",
          shake && "animate-shake"
        )}
      >
        {/* Lock Shield Icon */}
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
            <Lock className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white font-bold ring-4 ring-card">
            ✓
          </span>
        </div>

        {/* Lock Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Sesión Protegida
          </h2>
          <p className="text-xs text-muted-foreground font-medium">
            {clinicName} · {doctorName}
          </p>
          <p className="text-[11px] text-muted-foreground/80 pt-0.5">
            Bloqueado por inactividad para resguardar la privacidad del paciente.
          </p>
        </div>

        {/* PIN 4-Dots Display */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={cn(
                  "h-4 w-4 rounded-full border-2 transition-all duration-200",
                  isFilled
                    ? "scale-110 border-primary bg-primary shadow-sm shadow-primary/50"
                    : "border-border/80 bg-muted/50"
                )}
              />
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-rose-500 animate-in fade-in">
            {errorMsg}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-12 rounded-2xl bg-muted/60 text-foreground font-bold text-lg hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin("")}
            className="h-12 rounded-2xl bg-muted/30 text-muted-foreground font-bold text-xs hover:bg-muted/80 active:scale-95 transition-all cursor-pointer"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => handleDigitPress("0")}
            className="h-12 rounded-2xl bg-muted/60 text-foreground font-bold text-lg hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Borrar dígito"
            className="h-12 rounded-2xl bg-muted/30 text-muted-foreground flex items-center justify-center hover:bg-muted/80 active:scale-95 transition-all cursor-pointer"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        <div className="w-full pt-2 border-t border-border/40 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-rose-500 transition-colors font-semibold"
          >
            <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
