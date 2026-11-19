import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function subscribeDarkQuery(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const matchMedia = window.matchMedia("(prefers-color-scheme: dark)");
  matchMedia.addEventListener("change", callback);
  return () => matchMedia.removeEventListener("change", callback);
}

function getSystemPrefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSystemPrefersDark() {
  return false;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const systemPrefersDark = useSyncExternalStore(
    subscribeDarkQuery,
    getSystemPrefersDark,
    getServerSystemPrefersDark,
  );

  const isDark = mounted
    ? theme === "dark" || (theme === "system" && systemPrefersDark)
    : false;

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex items-center justify-center h-8 w-8 bg-card border border-border/60 rounded-xl shadow-2xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shrink-0 transition-colors"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label="Alternar Tema (Claro / Oscuro)"
    >
      {isDark ? (
        <Moon className="h-3.5 w-3.5 text-primary transition-transform" />
      ) : (
        <Sun className="h-3.5 w-3.5 text-amber-500 transition-transform" />
      )}
    </button>
  );
}
