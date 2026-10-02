import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted 
    ? (theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches))
    : false;

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex items-center justify-center h-8 w-8 bg-card border border-border/60 rounded-xl shadow-2xs hover:bg-muted focus:outline-none cursor-pointer shrink-0 transition-colors"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label="Alternar Tema (Claro / Oscuro)"
    >
      {isDark ? (
        <Moon className="h-3.5 w-3.5 text-primary transition-all" />
      ) : (
        <Sun className="h-3.5 w-3.5 text-amber-500 transition-all" />
      )}
    </button>
  );
}
