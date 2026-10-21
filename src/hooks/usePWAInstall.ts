import { useState, useEffect, useCallback } from "react";

// Global holder for deferred prompt so any component can trigger install without re-binding
let deferredPrompt: any = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: any) => {
    // Prevent default mini-infobar on mobile
    e.preventDefault();
    deferredPrompt = e;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

export type PlatformType = "windows" | "android" | "ios" | "mac" | "other";

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState<boolean>(!!deferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [platform, setPlatform] = useState<PlatformType>("other");

  useEffect(() => {
    // Check if running in standalone / installed mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsInstalled(isStandalone);

    // Detect user platform
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) {
      setPlatform("android");
    } else if (/iPad|iPhone|iPod/i.test(ua) && !(window as any).MSStream) {
      setPlatform("ios");
    } else if (/Win/i.test(ua)) {
      setPlatform("windows");
    } else if (/Mac/i.test(ua)) {
      setPlatform("mac");
    } else {
      setPlatform("other");
    }

    const updateState = () => {
      setCanInstall(!!deferredPrompt);
    };

    listeners.add(updateState);
    updateState();

    return () => {
      listeners.delete(updateState);
    };
  }, []);

  const installApp = useCallback(async (): Promise<"accepted" | "dismissed" | "unsupported"> => {
    if (!deferredPrompt) {
      return "unsupported";
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        deferredPrompt = null;
        notifyListeners();
        return "accepted";
      }
      return "dismissed";
    } catch (err) {
      console.error("Error triggering PWA prompt:", err);
      return "unsupported";
    }
  }, []);

  return {
    canInstall,
    isInstalled,
    installApp,
    platform,
  };
}
