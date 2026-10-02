import { useState, useEffect } from "react";
import { Palette, Check, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

export interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  ring: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  { id: "blue", name: "Azul Medizen", primary: "#4361EE", ring: "#4361EE" },
  { id: "emerald", name: "Verde Esmeralda", primary: "#059669", ring: "#059669" },
  { id: "purple", name: "Púrpura Real", primary: "#7C3AED", ring: "#7C3AED" },
  { id: "teal", name: "Teal Quirúrgico", primary: "#0D9488", ring: "#0D9488" },
  { id: "rose", name: "Rosa Obstétrico", primary: "#E11D48", ring: "#E11D48" },
];

/**
 * Dynamically updates the browser favicon tab icon with the selected primary color
 */
export function updateFaviconColor(hexColor: string) {
  if (typeof window === "undefined") return;
  const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
  if (!link) return;

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 14 80 60" width="100%" height="100%" fill="none">
    <defs>
      <linearGradient id="favGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${hexColor}" stop-opacity="0.9" />
        <stop offset="50%" stop-color="${hexColor}" />
        <stop offset="100%" stop-color="${hexColor}" stop-opacity="0.75" />
      </linearGradient>
      <filter id="favDepth" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#1E293B" flood-opacity="0.35" />
      </filter>
    </defs>
    <g stroke-linecap="round" stroke-linejoin="round">
      <path d="M26 50 C14 30, 34 18, 50 38 C66 58, 86 70, 74 50 C60 30, 42 18, 26 50 Z" stroke="url(#favGrad)" stroke-width="7.5" />
      <path filter="url(#favDepth)" d="M74 50 C86 30, 66 18, 50 38 C34 58, 14 70, 26 50" stroke="url(#favGrad)" stroke-width="7.5" />
      <circle cx="50" cy="38" r="4" fill="${hexColor}" />
      <circle cx="50" cy="38" r="7" stroke="${hexColor}" stroke-width="1.5" opacity="0.4" />
    </g>
  </svg>`;

  link.href = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export function applySavedThemeColor() {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem("medizen-accent-color") || "blue";
  const theme = COLOR_THEMES.find((t) => t.id === saved) || COLOR_THEMES[0];
  if (theme) {
    document.documentElement.style.setProperty("--primary", theme.primary);
    document.documentElement.style.setProperty("--sidebar-primary", theme.primary);
    document.documentElement.style.setProperty("--ring", theme.ring);
    document.documentElement.style.setProperty("--sidebar-ring", theme.ring);
    updateFaviconColor(theme.primary);
    window.dispatchEvent(new CustomEvent("medizen-theme-changed", { detail: theme }));
  }
}

export function ThemeCustomizer() {
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("medizen-accent-color") || "blue";
    }
    return "blue";
  });

  useEffect(() => {
    applySavedThemeColor();
  }, []);

  const handleSelectTheme = (theme: ColorTheme) => {
    setSelectedTheme(theme.id);
    localStorage.setItem("medizen-accent-color", theme.id);
    document.documentElement.style.setProperty("--primary", theme.primary);
    document.documentElement.style.setProperty("--sidebar-primary", theme.primary);
    document.documentElement.style.setProperty("--ring", theme.ring);
    document.documentElement.style.setProperty("--sidebar-ring", theme.ring);
    updateFaviconColor(theme.primary);
    window.dispatchEvent(new CustomEvent("medizen-theme-changed", { detail: theme }));
    toast.success(`Color de acento cambiado a ${theme.name}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center h-8 w-8 bg-card border border-border/60 rounded-xl shadow-2xs text-muted-foreground hover:text-foreground transition hover:bg-muted focus:outline-none cursor-pointer shrink-0"
          title="Personalizar color del sistema y logo"
        >
          <Palette className="h-3.5 w-3.5 text-primary" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3 rounded-2xl border-border/60 shadow-xl bg-card/95 backdrop-blur-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 pb-2 border-b border-border/40">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">Color de Acento Clínico</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 pt-1">
            {COLOR_THEMES.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelectTheme(theme)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 text-primary font-bold"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span>{theme.name}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
