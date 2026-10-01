import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthSession } from "./useAuth";

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const LOCK_STORAGE_KEY = "medizen_screen_locked";

export function useInactivityLock(timeoutMs: number = INACTIVITY_TIMEOUT_MS) {
  const { user } = useAuthSession();
  
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(LOCK_STORAGE_KEY) === "true";
    }
    return false;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if user has a PIN configured
  const hasPinConfigured = useCallback(() => {
    if (!user?.id || typeof window === "undefined") return false;
    return !!localStorage.getItem(`femesalud_pin_${user.id}`);
  }, [user?.id]);

  const lockScreen = useCallback(() => {
    // Only lock if the user has a PIN configured
    if (!hasPinConfigured()) return;
    
    setIsLocked(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(LOCK_STORAGE_KEY, "true");
    }
  }, [hasPinConfigured]);

  const unlockScreen = useCallback((enteredPin: string): boolean => {
    if (typeof window === "undefined" || !user?.id) return false;

    const storedPin = localStorage.getItem(`femesalud_pin_${user.id}`);

    if (storedPin && enteredPin === storedPin) {
      setIsLocked(false);
      sessionStorage.removeItem(LOCK_STORAGE_KEY);
      return true;
    }
    return false;
  }, [user?.id]);

  const resetTimer = useCallback(() => {
    if (isLocked || !hasPinConfigured()) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      lockScreen();
    }, timeoutMs);
  }, [isLocked, timeoutMs, lockScreen, hasPinConfigured]);

  useEffect(() => {
    if (isLocked || !hasPinConfigured()) {
      // If we're not locked and user removes PIN, clear the timer
      if (!hasPinConfigured() && timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    let lastActivity = Date.now();

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle activity checks to once per 2 seconds
      if (now - lastActivity > 2000) {
        lastActivity = now;
        resetTimer();
      }
    };

    resetTimer();

    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, [isLocked, resetTimer, hasPinConfigured, user?.id]);

  return {
    isLocked,
    lockScreen,
    unlockScreen,
    hasPinConfigured: hasPinConfigured(),
  };
}
