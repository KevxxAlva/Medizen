import { createFileRoute, Outlet, redirect, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { CommandMenu } from "@/components/CommandMenu";
import { BottomNavBar } from "@/components/BottomNavBar";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useLocation } from "@tanstack/react-router";
import { Menu, Lock } from "lucide-react";
import { useClinicInfo } from "@/lib/api/clinic";
import { useAuthSession, useRoles } from "@/hooks/useAuth";
import { useMyProfile } from "@/lib/api/profiles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { MedizenLogo } from "@/components/MedizenLogo";
import { useInactivityLock } from "@/hooks/useInactivityLock";
import { InactivityLockOverlay } from "@/components/InactivityLockOverlay";

const ADMIN_ONLY_PATHS = ["/doctores", "/cuentas", "/metodos-pago", "/stocks"];

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // Session is persisted in browser localStorage; skip redirect during SSR
    if (typeof window === "undefined") {
      return { user: null };
    }
    let sessionUser = null;
    try {
      const { data } = await supabase.auth.getSession();
      sessionUser = data.session?.user ?? null;
    } catch {
      // If reading session fails, sessionUser remains null
    }

    if (!sessionUser) {
      throw redirect({ to: "/auth" });
    }

    return { user: sessionUser };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { data: clinic } = useClinicInfo();
  const { user, loading: authLoading } = useAuthSession();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: profile } = useMyProfile(user?.id);

  // Automatic & manual screen lock for clinical privacy
  const { isLocked, lockScreen, unlockScreen, hasPinConfigured } = useInactivityLock();

  useRealtimeSync();

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/auth", replace: true });
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && user && !rolesLoading && roles) {
      const isAdminPath = ADMIN_ONLY_PATHS.some((p) => location.pathname.startsWith(p));
      if (isAdminPath && !roles.includes("admin")) {
        router.navigate({ to: "/", replace: true });
      }
    }
  }, [authLoading, user, rolesLoading, roles, location.pathname, router]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.navigate({ to: "/auth", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-muted pb-20 md:pb-0 flex flex-col">
      {/* Mobile Top Header (md:hidden) */}
      <header className="sticky top-0 z-40 md:hidden flex items-center justify-between px-3 sm:px-4 h-14 bg-card/95 backdrop-blur-md border-b border-border/40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <MedizenLogo className="h-7 w-7 flex-shrink-0 transition-transform duration-300" />
            <span className="font-display font-bold text-base tracking-tight text-foreground truncate max-w-[170px]">
              {clinic?.name || "Medizen"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Lock Button for Doctor */}
          {hasPinConfigured && (
            <button
              type="button"
              onClick={lockScreen}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              title="Bloquear pantalla (Privacidad médica)"
            >
              <Lock className="h-4 w-4" />
            </button>
          )}
          <ThemeCustomizer />
          <ThemeToggle />
          <Link
            to="/configuracion"
            className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shadow-xs hover:bg-primary/20 transition-colors"
            title="Mi Perfil"
          >
            {profile?.full_name ? profile.full_name.slice(0, 2).toUpperCase() : "U"}
          </Link>
        </div>
      </header>

      {/* Floating Desktop Quick Lock & Security Indicator (Hidden on Mobile) */}
      {hasPinConfigured && (
        <aside
          aria-label="Seguridad y accesos rápidos"
          className="hidden md:flex fixed top-4 right-6 z-30 items-center gap-2"
        >
          <button
            type="button"
            onClick={lockScreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-card/85 backdrop-blur-md border border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 shadow-xs transition-colors cursor-pointer"
            title="Bloquear sesión clínica inmediatamente"
          >
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span>Bloquear</span>
          </button>
        </aside>
      )}

      <AppSidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main
        className={`px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 pb-6 h-full flex-1 transition-[margin] duration-300 ${isCollapsed ? "md:ml-[80px]" : "md:ml-[260px]"}`}
      >
        <div
          key={location.pathname}
          className="max-w-7xl mx-auto w-full animate-in fade-in duration-150"
        >
          <Outlet />
        </div>
      </main>

      <CommandMenu />
      <BottomNavBar />

      {/* Full-Screen Inactivity & Privacy Screen Lock */}
      <InactivityLockOverlay
        isLocked={isLocked}
        onUnlock={unlockScreen}
        doctorName={profile?.full_name || "Doctor(a)"}
        clinicName={clinic?.name || "Medizen Suite"}
      />
    </div>
  );
}
