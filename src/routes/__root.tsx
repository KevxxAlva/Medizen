import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouter,
  Link,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { applySavedThemeColor } from "@/components/ThemeCustomizer";
import "../styles.css";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">Esta ruta no existe en Medizen.</p>
        <Link
          to="/"
          preload="intent"
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  console.error("Root route error:", error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-2xl text-center bg-card p-8 rounded-3xl border border-destructive/20 shadow-xl">
        <h1 className="text-xl font-bold text-destructive">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">Error detectado en la aplicación:</p>

        <div className="mt-4 p-4 bg-muted rounded-2xl text-left font-mono text-xs overflow-auto max-h-[300px] border border-border/60">
          <p className="font-bold text-foreground mb-1">
            {error?.message || "Se produjo un error inesperado en la aplicación."}
          </p>
          {import.meta.env.DEV && error?.stack && (
            <pre className="text-muted-foreground whitespace-pre-wrap">{error.stack}</pre>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
          >
            Reintentar
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl border border-border px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
          >
            Forzar Recarga (F5)
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
      },
      { title: "Medizen — Suite Clínica Inteligente" },
      {
        name: "description",
        content:
          "Plataforma de alta resolución para la gestión médica integral, administración clínica y flujo de trabajo sin fricción.",
      },
      { name: "theme-color", content: "#4361ee" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Medizen" },
      { name: "application-name", content: "Medizen" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    applySavedThemeColor();

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const isLocalhost =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

      if (import.meta.env.DEV || isLocalhost) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister());
        });
        if ("caches" in window) {
          caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
        }
      } else {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registrado con éxito:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Error al registrar Service Worker:", err);
          });
      }
    }
  }, []);

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var map={blue:'#4361EE',emerald:'#059669',purple:'#7C3AED',teal:'#0D9488',rose:'#E11D48'};var saved=localStorage.getItem('medizen-accent-color');var hex=map[saved]||'#4361EE';var r=document.documentElement.style;r.setProperty('--primary',hex);r.setProperty('--sidebar-primary',hex);r.setProperty('--ring',hex);r.setProperty('--sidebar-ring',hex);if(location.hostname==='localhost'||location.hostname==='127.0.0.1'){var hadSw=!!(navigator.serviceWorker&&navigator.serviceWorker.controller);var p1=('serviceWorker' in navigator)?navigator.serviceWorker.getRegistrations().then(function(rs){return Promise.all(rs.map(function(reg){return reg.unregister()}))}):Promise.resolve();var p2=('caches' in window)?caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k)}))}):Promise.resolve();if(hadSw&&!sessionStorage.getItem('medizen_sw_cleaned')){Promise.all([p1,p2]).then(function(){sessionStorage.setItem('medizen_sw_cleaned','1');location.reload()})}}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="theme">
          <QueryClientProvider client={queryClient}>
            <Outlet />
            <Toaster richColors position="top-right" />
          </QueryClientProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
