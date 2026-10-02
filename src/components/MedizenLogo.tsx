import { useId, useState, useEffect } from "react";
import { COLOR_THEMES } from "@/components/ThemeCustomizer";

interface MedizenLogoProps {
  className?: string;
  color?: string;
}

export function MedizenLogo({ className = "h-8 w-8", color }: MedizenLogoProps) {
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9]/g, "_");
  const gradId = `medizenLogoGrad_${safeId}`;
  const filterId = `medizenRibbonDepth_${safeId}`;

  const [activeHex, setActiveHex] = useState<string>(() => {
    if (color) return color;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("medizen-accent-color");
      const found = COLOR_THEMES.find((t) => t.id === saved);
      if (found) return found.primary;
    }
    return "#4361EE";
  });

  useEffect(() => {
    if (color) {
      setActiveHex(color);
      return;
    }
    const handleThemeChange = (e: any) => {
      if (e.detail?.primary) {
        setActiveHex(e.detail.primary);
      } else {
        const saved = localStorage.getItem("medizen-accent-color");
        const found = COLOR_THEMES.find((t) => t.id === saved);
        if (found) setActiveHex(found.primary);
      }
    };
    window.addEventListener("medizen-theme-changed", handleThemeChange);
    return () => window.removeEventListener("medizen-theme-changed", handleThemeChange);
  }, [color]);

  const primary = color || activeHex;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="10 14 80 60"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}
      aria-label="Medizen Logo"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primary} stopOpacity="0.9" />
          <stop offset="50%" stopColor={primary} />
          <stop offset="100%" stopColor={primary} stopOpacity="0.75" />
        </linearGradient>

        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#1E293B" floodOpacity="0.35" />
        </filter>
      </defs>

      <g strokeLinecap="round" strokeLinejoin="round">
        {/* Back Loop of the Möbius Ribbon */}
        <path
          d="M26 50 C14 30, 34 18, 50 38 C66 58, 86 70, 74 50 C60 30, 42 18, 26 50 Z"
          stroke={`url(#${gradId})`}
          strokeWidth="7.5"
        />

        {/* Front Crossing Ribbon with depth shadow */}
        <path
          filter={`url(#${filterId})`}
          d="M74 50 C86 30, 66 18, 50 38 C34 58, 14 70, 26 50"
          stroke={`url(#${gradId})`}
          strokeWidth="7.5"
        />

        {/* Central Focus Point */}
        <circle cx="50" cy="38" r="4" fill={primary} />
        <circle cx="50" cy="38" r="7" stroke={primary} strokeWidth="1.5" opacity="0.4" />
      </g>
    </svg>
  );
}
