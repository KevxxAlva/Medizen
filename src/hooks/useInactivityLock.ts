import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { useAuthSession } from "./useAuth";
import { hasUserPinConfigured, verifyUserPin } from "@/lib/auth/quickAccess";

const emptySubscribe = () => () => {};
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const LOCK_STORAGE_KEY = "medizen_screen_locked";

export function useInactivityLock(timeoutMs: number = INACTIVITY_TIMEOUT_MS) {
  const { user } = useAuthSession();

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(LOCK_STORAGE_KEY) === "true") {
      setIsLocked(true);
    }
  }, []);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if user has a PIN configured
  const hasPinConfigured = useCallback(() => {
    if (!mounted) return false;
    return hasUserPinConfigured(user?.id);
  }, [user?.id, mounted]);

  const lockScreen = useCallback(() => {
    // Only lock if the user has a PIN configured
    if (!hasPinConfigured()) return;

    setIsLocked(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(LOCK_STORAGE_KEY, "true");
    }
  }, [hasPinConfigured]);

  const unlockScreen = useCallback(
    async (enteredPin: string): Promise<boolean> => {
      if (typeof window === "undefined" || !user?.id) return false;

      const ok = await verifyUserPin(user.id, enteredPin);
      if (ok) {
        setIsLocked(false);
        sessionStorage.removeItem(LOCK_STORAGE_KEY);
        return true;
      }
      return false;
    },
    [user?.id],
  );

  useEffect(() => {
    if (isLocked || !hasPinConfigured()) {
      return () => {};
    }

    let timer = setTimeout(() => {
      lockScreen();
    }, timeoutMs);

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        lockScreen();
      }, timeoutMs);
    };

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

    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, [isLocked, timeoutMs, lockScreen, hasPinConfigured]);

  return {
    isLocked,
    lockScreen,
    unlockScreen,
    hasPinConfigured: hasPinConfigured(),
  };
}
