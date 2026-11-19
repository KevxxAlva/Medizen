import { useEffect, useId, useState } from "react";

const SPLASH_SEEN_KEY = "medizen_splash_seen";
const SPLASH_DURATION_MS = 1600;
const SPLASH_REDUCED_DURATION_MS = 350;
const SPLASH_EXIT_MS = 400;

/**
 * Fullscreen animated launch preloader featuring only the Medizen emblem
 * with 3D orbital rotation, light-sweep ribbon pulse, and zoom-dissolve exit.
 */
export function AppSplashScreen() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9]/g, "_");
  const gradId = `medizenSplashGrad_${safeId}`;
  const ringGradId = `medizenSplashRing_${safeId}`;
  const glowFilterId = `medizenSplashGlow_${safeId}`;

  useEffect(() => {
    if (document.documentElement.dataset.splash === "skip") {
      setVisible(false);
      return;
    }

    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
    } catch {
      // Ignore storage errors in restricted browsing contexts
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const holdDuration = prefersReducedMotion ? SPLASH_REDUCED_DURATION_MS : SPLASH_DURATION_MS;

    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, holdDuration);

    const unmountTimer = window.setTimeout(() => {
      setVisible(false);
    }, holdDuration + SPLASH_EXIT_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(unmountTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      id="medizen-app-splash"
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white select-none overflow-hidden transition-opacity duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        exiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Ambient radial glow */}
      <div
        className="medizen-splash-glow absolute w-80 h-80 rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: "var(--primary, #4361ee)" }}
      />

      {/* Center Stage with Zoom-Exit */}
      <div
        className={`relative z-10 flex items-center justify-center transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          exiting ? "scale-[1.18]" : "scale-100"
        }`}
      >
        <div className="medizen-splash-stage relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
          {/* Outer Precision Orbital Scanner Arc */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            fill="none"
            className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
          >
            <defs>
              <linearGradient id={ringGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--splash-arc-head)" stopOpacity="0.9" />
                <stop offset="45%" stopColor="var(--primary, #4361ee)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="var(--primary, #4361ee)" stopOpacity="0" />
              </linearGradient>
            </defs>

            <circle
              cx="50"
              cy="50"
              r="46"
              stroke="var(--splash-track)"
              strokeWidth="1.15"
              className="medizen-splash-orbit-track"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              pathLength={1}
              stroke={`url(#${ringGradId})`}
              strokeWidth="1.85"
              strokeLinecap="round"
              className="medizen-splash-orbit-arc"
            />
          </svg>

          {/* True Hardware-Accelerated 3D Rotating Emblem */}
          <div className="medizen-splash-emblem w-24 h-20 sm:w-28 sm:h-22 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="10 14 80 60"
              fill="none"
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary, #4361ee)" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="var(--primary, #4361ee)" />
                  <stop offset="100%" stopColor="var(--primary, #4361ee)" stopOpacity="0.75" />
                </linearGradient>

                <filter id={glowFilterId} x="-35%" y="-35%" width="170%" height="170%">
                  <feDropShadow
                    dx="0"
                    dy="0"
                    stdDeviation="3.5"
                    floodColor="var(--primary, #4361ee)"
                    floodOpacity="0.55"
                  />
                </filter>
              </defs>

              <g strokeLinecap="round" strokeLinejoin="round">
                {/* Back Loop */}
                <path
                  d="M26 50 C14 30, 34 18, 50 38 C66 58, 86 70, 74 50 C60 30, 42 18, 26 50 Z"
                  stroke={`url(#${gradId})`}
                  strokeWidth="7.5"
                />

                {/* Front Crossing Ribbon with depth glow */}
                <path
                  filter={`url(#${glowFilterId})`}
                  d="M74 50 C86 30, 66 18, 50 38 C34 58, 14 70, 26 50"
                  stroke={`url(#${gradId})`}
                  strokeWidth="7.5"
                />

                {/* Travelling Luminous Energy Pulse along the ribbon */}
                <path
                  pathLength={1}
                  d="M26 50 C14 30, 34 18, 50 38 C66 58, 86 70, 74 50 C60 30, 42 18, 26 50 Z"
                  stroke="#ffffff"
                  strokeOpacity="0.7"
                  strokeWidth="2.4"
                  className="medizen-splash-pulse-beam"
                />

                {/* Central Focus Point & Shockwave Halo */}
                <circle
                  cx="50"
                  cy="38"
                  r="7.5"
                  stroke="var(--splash-halo)"
                  strokeWidth="1.5"
                  className="medizen-splash-halo"
                />
                <circle cx="50" cy="38" r="4" fill="var(--primary, #4361ee)" />
                <circle cx="50" cy="38" r="2" fill="#ffffff" opacity="0.75" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
