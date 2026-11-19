import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __medizenInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

// Global holder for deferred prompt so any component can trigger install without re-binding
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  if (window.__medizenInstallPrompt) {
    deferredPrompt = window.__medizenInstallPrompt;
  }

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    const promptEvent = e as BeforeInstallPromptEvent;
    deferredPrompt = promptEvent;
    window.__medizenInstallPrompt = promptEvent;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    window.__medizenInstallPrompt = null;
    notifyListeners();
  });
}

export type PlatformType = "windows" | "android" | "ios" | "mac" | "other";

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState<boolean>(
    () => !!deferredPrompt || (typeof window !== "undefined" && !!window.__medizenInstallPrompt),
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [platform, setPlatform] = useState<PlatformType>("other");

  useEffect(() => {
    if (!deferredPrompt && window.__medizenInstallPrompt) {
      deferredPrompt = window.__medizenInstallPrompt;
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    setIsInstalled(isStandalone);

    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) {
      setPlatform("android");
    } else if (
      /iPad|iPhone|iPod/i.test(ua) &&
      !(window as Window & { MSStream?: unknown }).MSStream
    ) {
      setPlatform("ios");
    } else if (/Win/i.test(ua)) {
      setPlatform("windows");
    } else if (/Mac/i.test(ua)) {
      setPlatform("mac");
    } else {
      setPlatform("other");
    }

    const updateState = () => {
      setCanInstall(!!deferredPrompt || !!window.__medizenInstallPrompt);
    };

    listeners.add(updateState);
    updateState();

    return () => {
      listeners.delete(updateState);
    };
  }, []);

  const installApp = useCallback(async (): Promise<"accepted" | "dismissed" | "unsupported"> => {
    const promptToUse =
      deferredPrompt || (typeof window !== "undefined" ? window.__medizenInstallPrompt : null);
    if (!promptToUse) {
      return "unsupported";
    }

    try {
      await promptToUse.prompt();
      const choiceResult = await promptToUse.userChoice;
      if (choiceResult.outcome === "accepted") {
        deferredPrompt = null;
        window.__medizenInstallPrompt = null;
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
