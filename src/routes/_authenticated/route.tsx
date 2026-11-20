import {
  createFileRoute,
  Outlet,
  redirect,
  useRouter,
  Link,
  useLocation,
  Navigate,
} from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { CommandMenu } from "@/components/CommandMenu";
import { BottomNavBar } from "@/components/BottomNavBar";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { Menu, Lock, AlertTriangle, LogOut, Sparkles, Megaphone } from "lucide-react";
import { useClinicInfo, getSaasPlanConfig, type ClinicInfo } from "@/lib/api/clinic";
import { useGlobalAnnouncement, getClinicDueStatus } from "@/lib/api/superadmin";
import { useAuthSession, useRoles, setAuthSessionManually } from "@/hooks/useAuth";
import { useMyProfile } from "@/lib/api/profiles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { MedizenLogo } from "@/components/MedizenLogo";
import { useInactivityLock } from "@/hooks/useInactivityLock";
import { InactivityLockOverlay } from "@/components/InactivityLockOverlay";
import { OfflineSyncIndicator } from "@/components/pwa/OfflineSyncIndicator";

const ADMIN_ONLY_PATHS = ["/doctores", "/cuentas", "/metodos-pago", "/stocks"];
const PRO_PLAN_PATHS = ["/cuentas", "/facturacion", "/honorarios", "/metodos-pago", "/stocks"];
const ENTERPRISE_PLAN_PATHS = ["/reportes", "/auditoria"];

function getRedirectForPath(
  pathname: string,
  roles?: string[],
  clinic?: ClinicInfo | null,
): "/dashboard" | null {
  if (!roles) return null;
  const isSuperAdmin = roles.includes("superadmin");
  const isSuperAdminPath = pathname.startsWith("/superadmin");
  if (isSuperAdminPath) return isSuperAdmin ? null : "/dashboard";
  if (ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p)) && !roles.includes("admin") && !isSuperAdmin) {
    return "/dashboard";
  }
  if (!clinic) return null;
  const planCfg = getSaasPlanConfig(clinic.plan_suscripcion);
  if (PRO_PLAN_PATHS.some((p) => pathname.startsWith(p)) && !planCfg.includesFinance) return "/dashboard";
  if (ENTERPRISE_PLAN_PATHS.some((p) => pathname.startsWith(p)) && !planCfg.includesReportsAndAudit) return "/dashboard";
  return null;
}

function AdminPathGuard({
  authLoading,
  user,
  rolesLoading,
  roles,
  clinic,
}: {
  authLoading: boolean;
  user: unknown;
  rolesLoading: boolean;
  roles?: string[];
  clinic?: ClinicInfo | null;
}) {
  const location = useLocation();
  if (authLoading || !user || rolesLoading) return null;
  const target = getRedirectForPath(location.pathname, roles, clinic);
  return target ? <Navigate to={target} replace /> : null;
}

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

function computeDemoDueStatus(clinic?: ClinicInfo | null) {
  if (clinic?.estado !== "demo") return null;
  return getClinicDueStatus({
    id_clinica: String(clinic.id_clinica || clinic.id),
    slug: "",
    nombre: clinic.name,
    rif: clinic.rif,
    telefono: clinic.phone,
    direccion: clinic.address_line1,
    email_contacto: null,
    plan_suscripcion: clinic.plan_suscripcion || "pro",
    estado: "demo",
    logo_url: null,
    color_primario: clinic.recipe_primary_color || "#0ea5e9",
    tipo_clinica: clinic.recipe_clinic_type || "",
    notas_internas: clinic.notas_internas || null,
    creado_en: clinic.creado_en || clinic.updated_at,
  });
}

function ClinicSuspendedScreen({
  isDemoExpired,
  clinicName,
  onSignOut,
}: {
  isDemoExpired: boolean;
  clinicName?: string;
  onSignOut: () => void;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full rounded-3xl border border-destructive/30 bg-card p-8 text-center shadow-xl space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">
            {isDemoExpired ? "Periodo de Prueba Finalizado" : "Acceso de Clínica Suspendido"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isDemoExpired ? (
              <>
                El periodo de prueba gratuito (Modo Demo) de{" "}
                <span className="font-semibold text-foreground">{clinicName || "tu clínica"}</span> ha concluido.
              </>
            ) : (
              <>
                La cuenta de <span className="font-semibold text-foreground">{clinicName || "tu clínica"}</span> se
                encuentra temporalmente suspendida en la plataforma Medizen.
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            Comunícate con el administrador de la plataforma para activar o renovar tu suscripción ($15, $25 o $45/mes). Tus pacientes, historias clínicas y agendas están resguardados de forma segura.
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="w-full h-11 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/90 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function GlobalAnnouncementBanner({
  globalAnnouncement,
  isSuperAdminPath,
}: {
  globalAnnouncement?: { active?: boolean; message?: string; type?: string } | null;
  isSuperAdminPath: boolean;
}) {
  if (!globalAnnouncement?.active || !globalAnnouncement.message?.trim()) return null;
  const toneClass =
    globalAnnouncement.type === "warning"
      ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
      : globalAnnouncement.type === "success"
        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
        : "bg-primary/10 border-primary/30 text-primary";
  return (
    <div className={`rounded-2xl border px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between gap-2.5 shadow-xs ${toneClass}`}>
      <div className="flex items-center gap-2.5">
        <Megaphone className="h-4 w-4 shrink-0" />
        <span>{globalAnnouncement.message}</span>
      </div>
      {isSuperAdminPath && (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-background/60 shrink-0">
          Vista previa activa en clínicas
        </span>
      )}
    </div>
  );
}

function DemoCountdownBanner({
  isSuperAdminPath,
  clinicEstado,
  demoDueStatus,
}: {
  isSuperAdminPath: boolean;
  clinicEstado?: string;
  demoDueStatus: ReturnType<typeof computeDemoDueStatus>;
}) {
  if (isSuperAdminPath || clinicEstado !== "demo" || !demoDueStatus || demoDueStatus.daysRemaining < 0) {
    return null;
  }
  const daysLabel =
    demoDueStatus.daysRemaining === 0
      ? "menos de 24 horas"
      : `${demoDueStatus.daysRemaining} día${demoDueStatus.daysRemaining === 1 ? "" : "s"}`;
  return (
    <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-xs sm:text-sm font-medium text-violet-600 dark:text-violet-300 flex items-center justify-between gap-2 shadow-xs">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span>
          Estás en <strong>Modo Demo Gratuita</strong> de Medizen. Te quedan <strong>{daysLabel}</strong> de prueba.
        </span>
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-violet-500/20">
        Corte: {demoDueStatus.nextDueDate}
      </span>
    </div>
  );
}

function MobileTopHeader({
  isSuperAdminPath,
  clinicName,
  hasPinConfigured,
  profileName,
  onOpenMenu,
  onLock,
}: {
  isSuperAdminPath: boolean;
  clinicName?: string;
  hasPinConfigured: boolean;
  profileName?: string | null;
  onOpenMenu: () => void;
  onLock: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 md:hidden flex items-center justify-between px-3 sm:px-4 h-16 bg-card/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMenu}
          className="h-11 w-11 -ml-1.5 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-[background-color,color,transform] duration-150 active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2.5">
          <MedizenLogo className="h-7 w-7 flex-shrink-0 transition-transform duration-300" />
          <div className="flex flex-col min-w-0">
            <span className="font-display font-bold text-base tracking-tight text-foreground truncate max-w-[170px]">
              {isSuperAdminPath ? "Medizen SaaS" : clinicName || "Medizen"}
            </span>
            {isSuperAdminPath && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary -mt-0.5">
                Super Admin
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {hasPinConfigured && (
          <button
            type="button"
            onClick={onLock}
            aria-label="Bloquear pantalla"
            className="h-11 w-11 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-[background-color,color,transform] duration-150 active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            title="Bloquear pantalla (Privacidad médica)"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <ThemeCustomizer />
        <ThemeToggle />
        <Link
          to="/configuracion"
          aria-label="Mi Perfil"
          className="h-11 w-11 sm:h-8 sm:w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shadow-xs hover:bg-primary/20 transition-[background-color,transform] duration-150 active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Mi Perfil"
        >
          {profileName ? profileName.slice(0, 2).toUpperCase() : "U"}
        </Link>
      </div>
    </header>
  );
}

function AuthenticatedLayout() {
  const router = useRouter();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith("/superadmin");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: clinic } = useClinicInfo();
  const { data: globalAnnouncement } = useGlobalAnnouncement();
  const { user, loading: authLoading } = useAuthSession();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: profile } = useMyProfile(user?.id);

  // Automatic & manual screen lock for clinical privacy
  const { isLocked, lockScreen, unlockScreen, hasPinConfigured } = useInactivityLock();

  useRealtimeSync();

  const handleToggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleOpenMobileMenu = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  const handleCloseMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      let cancelled = false;
      supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        if (data.session) {
          setAuthSessionManually(data.session);
        } else {
          router.navigate({ to: "/auth", replace: true });
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" && !session) {
        router.navigate({ to: "/auth", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  const isSuperAdmin = (roles ?? []).includes("superadmin");
  const demoDueStatus = computeDemoDueStatus(clinic);
  const isDemoExpired = !isSuperAdmin && clinic?.estado === "demo" && (demoDueStatus?.daysRemaining ?? 1) < 0;
  const isClinicSuspended = !isSuperAdmin && (clinic?.estado === "suspendido" || isDemoExpired);

  if (isClinicSuspended) {
    return (
      <ClinicSuspendedScreen
        isDemoExpired={isDemoExpired}
        clinicName={clinic?.name}
        onSignOut={async () => {
          await supabase.auth.signOut();
          router.navigate({ to: "/auth", replace: true });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background pb-20 md:pb-0 flex flex-col">
      <MobileTopHeader
        isSuperAdminPath={isSuperAdminPath}
        clinicName={clinic?.name}
        hasPinConfigured={hasPinConfigured}
        profileName={profile?.full_name}
        onOpenMenu={handleOpenMobileMenu}
        onLock={lockScreen}
      />

      {/* Floating Desktop Quick Lock & Security Indicator (Hidden on Mobile) */}
      {hasPinConfigured && (
        <aside
          aria-label="Seguridad y accesos rápidos"
          className="hidden md:flex fixed top-4 right-6 z-30 items-center gap-2"
        >
          <button
            type="button"
            onClick={lockScreen}
            aria-label="Bloquear sesión clínica inmediatamente"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-card/85 backdrop-blur-md border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 shadow-xs transition-colors cursor-pointer"
            title="Bloquear sesión clínica inmediatamente"
          >
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span>Bloquear</span>
          </button>
        </aside>
      )}

      <AdminPathGuard
        authLoading={authLoading}
        user={user}
        rolesLoading={rolesLoading}
        roles={roles}
        clinic={clinic}
      />

      <AppSidebar
        isCollapsed={isCollapsed}
        onToggle={handleToggleSidebar}
        mobileOpen={mobileMenuOpen}
        onMobileClose={handleCloseMobileMenu}
      />

      <main
        id="main-content"
        className={`px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 pb-6 h-full flex-1 min-w-0 max-w-full transition-[margin] duration-300 ${isCollapsed ? "md:ml-[80px]" : "md:ml-[260px]"}`}
      >
        <div className="max-w-7xl mx-auto w-full min-w-0 space-y-3">
          <OfflineSyncIndicator />
          <GlobalAnnouncementBanner
            globalAnnouncement={globalAnnouncement}
            isSuperAdminPath={isSuperAdminPath}
          />
          <DemoCountdownBanner
            isSuperAdminPath={isSuperAdminPath}
            clinicEstado={clinic?.estado}
            demoDueStatus={demoDueStatus}
          />
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
