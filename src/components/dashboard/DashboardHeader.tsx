import React from "react";
import { Link } from "@tanstack/react-router";
import { Search, Bell, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LiveClockBadge } from "./DashboardCharts";

export interface DashboardNotification {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  bg: string;
}

export interface DashboardHeaderProps {
  notifications: DashboardNotification[];
}

export function DashboardHeader({ notifications }: DashboardHeaderProps) {
  const handleOpenSearch = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <button
        id="search-bar"
        type="button"
        onClick={handleOpenSearch}
        className="relative w-full max-w-sm flex items-center justify-between bg-card rounded-full px-4 py-2.5 shadow-sm text-left hover:bg-muted/40 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Search className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
          <span className="text-sm text-muted-foreground truncate">
            Buscar pacientes, citas o acciones...
          </span>
        </div>
        <kbd className="hidden sm:inline-flex items-center text-[10px] font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full border border-border/50 shrink-0">
          Ctrl + K
        </kbd>
      </button>

      <div className="flex items-center gap-3">
        {/* Reloj en Tiempo Real aislado para evitar re-renders del Dashboard */}
        <LiveClockBadge />

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Notificaciones"
              className="flex items-center justify-center h-10 w-10 bg-card rounded-full shadow-sm text-primary relative transition hover:bg-muted focus:outline-none"
            >
              <Bell className="h-5 w-5 fill-current" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 bg-destructive/100 rounded-full border border-white" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 p-0 rounded-[1.5rem] shadow-xl overflow-hidden border-border/40 font-sans"
          >
            <div className="px-4 py-3 bg-primary text-primary-foreground flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-wider">Notificaciones</span>
              <span className="text-xs bg-card/20 px-2 py-0.5 rounded-full font-bold">
                {notifications.length} nuevas
              </span>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2 bg-card">
              {notifications.length > 0 ? (
                notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className="flex gap-3 p-3 hover:bg-muted/50 rounded-xl transition cursor-default"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          n.bg,
                          n.color,
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground font-medium">{n.desc}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-sm font-medium text-muted-foreground">
                  No hay notificaciones nuevas
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Link
          to="/configuracion"
          className="flex items-center justify-center h-10 w-10 bg-card rounded-full shadow-sm text-muted-foreground transition hover:bg-muted/50 hover:text-primary focus:outline-none"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
