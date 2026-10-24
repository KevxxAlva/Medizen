import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import {
  LayoutGrid, Calendar, UserRound, Stethoscope, Users,
  Wallet, ReceiptText, CreditCard,
  Box, RotateCw, Headphones, Settings,
  LogOut, ChevronLeft, ChevronRight, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useClinicInfo } from "@/lib/api/clinic";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { MedizenLogo } from "@/components/MedizenLogo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ModuleDef = {
  category?: string;
  title?: string;
  url?: string;
  icon?: any;
  badge?: number;
  adminOnly?: boolean;
};

const navigation: ModuleDef[] = [
  { title: "Dashboard", url: "/", icon: LayoutGrid },
  { category: "CLÍNICA" },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Pacientes", url: "/pacientes", icon: UserRound },
  { title: "Servicios Médicos", url: "/servicios", icon: Stethoscope },
  { title: "Personal", url: "/doctores", icon: Users, adminOnly: true },
  { category: "FINANZAS" },
  { title: "Cuentas", url: "/cuentas", icon: Wallet, adminOnly: true },
  { title: "Ventas", url: "/facturacion", icon: ReceiptText },
  { title: "Métodos de Pago", url: "/metodos-pago", icon: CreditCard, adminOnly: true },
  { category: "ACTIVOS FÍSICOS", adminOnly: true },
  { title: "Inventario", url: "/stocks", icon: Box, adminOnly: true },
  { category: "OTROS" },
  { title: "Reportes", url: "/reportes", icon: RotateCw },
  { title: "Atención al Cliente", url: "/support", icon: Headphones },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

function SidebarBody({ onNavigate, isCollapsed }: { onNavigate?: () => void; isCollapsed?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: clinic } = useClinicInfo();

  const handleLogout = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground overflow-hidden">
        {/* Logo Area (Header with crisp bottom divider line matching react.doctor) */}
        <div className={cn("h-16 flex items-center border-b border-sidebar-border shrink-0", isCollapsed ? "justify-center px-2" : "px-6 gap-3")}>
          <MedizenLogo className="h-8 w-8 flex-shrink-0 transition-transform duration-300" />
          {!isCollapsed && (
            <span
              className="font-display font-bold text-xl tracking-tight text-sidebar-foreground truncate"
              title={clinic?.name || "Medizen"}
            >
              {clinic?.name || "Medizen"}
            </span>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 w-full overflow-y-auto overscroll-contain no-scrollbar px-3 pt-3 pb-4 flex flex-col gap-1">
          {navigation.map((m) => {
            if (m.adminOnly && !isAdmin) return null;

            if (m.category) {
              if (isCollapsed) {
                return (
                  <div
                    key={`cat-${m.category}`}
                    className="my-2.5 mx-2 border-t border-sidebar-border"
                    title={m.category}
                  />
                );
              }
              return (
                <div key={`cat-${m.category}`} className="mt-5 mb-1.5 px-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                    {m.category}
                  </span>
                  <div className="flex-1 border-t border-sidebar-border" />
                </div>
              );
            }

            const active = pathname === m.url || (m.url !== "/" && !m.url?.startsWith("#") && pathname.startsWith(m.url || ""));
            const Icon = m.icon;
            const isDummy = m.url?.startsWith("#");

            const linkContent = (
              <Link
                key={m.title}
                to={isDummy ? "/" : m.url!}
                onClick={(e) => {
                  if (isDummy) e.preventDefault();
                  else if (onNavigate) onNavigate();
                }}
                className={cn(
                  "flex items-center rounded-xl transition-colors duration-150 group text-sm font-semibold",
                  isCollapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    active ? "text-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                  )}
                  strokeWidth={2.2}
                />
                {!isCollapsed && <span className="truncate">{m.title}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={m.title}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10} className="font-semibold">
                    {m.title}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })}
        </nav>

        {/* Footer Area with crisp top divider line */}
        <div className={cn("mt-auto pt-3 pb-3 border-t border-sidebar-border flex flex-col gap-2 shrink-0", isCollapsed ? "items-center px-1" : "px-4")}>
          <div className={cn("flex items-center w-full", isCollapsed ? "flex-col gap-2" : "justify-between gap-1")}>
            {/* Logout */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                  className={cn(
                    "flex items-center rounded-xl transition-colors duration-150 group text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer",
                    isCollapsed ? "justify-center h-8 w-8" : "gap-2 px-2 py-1.5"
                  )}
                >
                  <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-destructive flex-shrink-0" strokeWidth={2.2} />
                  {!isCollapsed && <span>Cerrar sesión</span>}
                </button>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right" sideOffset={10} className="font-semibold">Cerrar Sesión</TooltipContent>}
            </Tooltip>

            {/* Theme & Palette Controls */}
            <div className={cn("flex items-center gap-1.5 shrink-0", isCollapsed && "flex-col")}>
              <ThemeCustomizer />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function AppSidebar({ 
  isCollapsed, 
  onToggle,
  mobileOpen,
  onMobileClose
}: { 
  isCollapsed?: boolean; 
  onToggle?: () => void; 
  mobileOpen?: boolean; 
  onMobileClose?: () => void; 
}) {
  return (
    <>
      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Cerrar menú móvil"
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity border-none cursor-default"
            onClick={onMobileClose}
          />
          {/* Sliding Drawer */}
          <div className="relative w-[280px] max-w-[85vw] h-full bg-sidebar border-r border-sidebar-border shadow-2xl z-50 flex flex-col overscroll-contain animate-in slide-in-from-left duration-300">
            <button
              onClick={onMobileClose}
              className="absolute right-3 top-5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-50 cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarBody onNavigate={onMobileClose} isCollapsed={false} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar with crisp right border line matching react.doctor */}
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 z-30 hidden flex-col bg-sidebar border-r border-sidebar-border md:flex transition-[width] duration-300",
        isCollapsed ? "w-[80px]" : "w-[260px]"
      )}>
        {/* Collapse Button placed cleanly at the intersection of the header line and right border */}
        <button
          type="button"
          aria-label={isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          onClick={onToggle}
          className="absolute -right-3 top-5 h-6 w-6 bg-sidebar border border-sidebar-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-xs z-40 transition hover:scale-110 cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
          ) : (
            <ChevronLeft className="h-3 w-3" strokeWidth={2.5} />
          )}
        </button>
        <SidebarBody isCollapsed={isCollapsed} />
      </aside>
    </>
  );
}
