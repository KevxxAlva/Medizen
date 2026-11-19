import { memo } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Calendar, UserRound, Stethoscope, Building2, ShieldCheck, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Pacientes", url: "/pacientes", icon: UserRound },
  { title: "Servicios", url: "/servicios", icon: Stethoscope },
] as const;

const SUPERADMIN_NAV_ITEMS = [
  { title: "Clínicas", url: "/superadmin", icon: Building2 },
  { title: "Auditoría", url: "/auditoria", icon: ShieldCheck },
  { title: "Config", url: "/configuracion", icon: Settings },
  { title: "Ir Clínica", url: "/dashboard", icon: Stethoscope },
] as const;

export const BottomNavBar = memo(function BottomNavBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isSuperAdminMode = pathname.startsWith("/superadmin");
  const items = isSuperAdminMode ? SUPERADMIN_NAV_ITEMS : NAV_ITEMS;

  return (
    <nav
      aria-label="Navegación inferior"
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around bg-card border-t border-border md:hidden pb-safe"
    >
      {items.map((item) => {
        const active =
          pathname === item.url ||
          (item.url !== "/dashboard" && item.url !== "/superadmin" && pathname.startsWith(item.url));
        const Icon = item.icon;

        return (
          <Link
            key={item.title}
            to={item.url}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full min-h-11 space-y-1 transition-[transform,colors] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center p-1 rounded-full",
                active ? "bg-primary/10" : "bg-transparent",
              )}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-[10px] font-medium leading-none">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
});
