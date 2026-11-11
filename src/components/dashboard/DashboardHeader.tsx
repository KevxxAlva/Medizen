import React, { useState, useEffect, useMemo, useTransition, lazy, Suspense, memo } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Bell, Settings, Calculator, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LiveClockBadge } from "./DashboardCharts";
import { useExchangeRate, type ExchangeRates } from "@/hooks/useExchangeRate";

const BcvCalculatorDialog = lazy(() =>
  import("./BcvCalculatorDialog").then((m) => ({ default: m.BcvCalculatorDialog }))
);

const preloadBcvDialog = () => {
  void import("./BcvCalculatorDialog");
};

export interface DashboardNotification {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  bg: string;
  href?: string;
}

export interface DashboardHeaderProps {
  notifications: DashboardNotification[];
}

const BcvQuickConverter = memo(function BcvQuickConverter({
  rate,
  rates,
}: {
  rate: number;
  rates: ExchangeRates;
}) {
  const [hasMountedDialog, setHasMountedDialog] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleOpenCalculator = () => {
    startTransition(() => {
      setHasMountedDialog(true);
      setCalcOpen(true);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenCalculator}
        onPointerEnter={preloadBcvDialog}
        onFocus={preloadBcvDialog}
        aria-busy={isPending}
        aria-label={`Abrir conversor BCV, tasa actual ${rate.toFixed(2)} bolívares`}
        className="flex items-center gap-2 min-h-11 sm:min-h-10 px-3.5 bg-card hover:bg-muted/50 border border-border hover:border-primary/40 rounded-full shadow-sm text-xs font-bold text-foreground transition-[transform,colors] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer group"
        title="Abrir Calculadora y Conversor BCV (Actualizado en tiempo real)"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" aria-hidden="true" />
        ) : (
          <Calculator
            className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-150 shrink-0"
            aria-hidden="true"
          />
        )}
        <span className="hidden sm:inline">Conversor</span>
        <span>BCV</span>
        <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
          Bs. {rate.toFixed(2)}
        </span>
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
      </button>

      {hasMountedDialog && (
        <Suspense fallback={null}>
          <BcvCalculatorDialog
            open={calcOpen}
            onOpenChange={setCalcOpen}
            rates={rates}
          />
        </Suspense>
      )}
    </>
  );
});

export const DashboardHeader = memo(function DashboardHeader({
  notifications,
}: DashboardHeaderProps) {
  const [open, setOpen] = useState(false);
  const [readKeys, setReadKeys] = useState<string[]>([]);
  const { rate, rates } = useExchangeRate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("medizen_read_notifications");
      if (stored) {
        setReadKeys(JSON.parse(stored));
      }
    } catch {
      // ignore storage access error in private browsing/SSR
    }
  }, []);

  const getNotificationKey = (n: DashboardNotification) => `${n.id}:${n.desc}`;

  const readKeySet = useMemo(() => new Set(readKeys), [readKeys]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readKeySet.has(getNotificationKey(n))).length,
    [notifications, readKeySet]
  );

  const handleMarkAllAsRead = () => {
    const allKeys = notifications.map(getNotificationKey);
    const updated = Array.from(new Set([...readKeys, ...allKeys]));
    setReadKeys(updated);
    try {
      localStorage.setItem("medizen_read_notifications", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && unreadCount > 0) {
      handleMarkAllAsRead();
    }
  };

  const handleOpenSearch = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <button
        id="search-bar"
        type="button"
        onClick={handleOpenSearch}
        className="relative w-full max-w-sm min-h-11 flex items-center justify-between bg-card border border-border rounded-full px-4 py-2.5 shadow-sm text-left hover:border-primary/40 hover:bg-muted/40 transition-[transform,colors] duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Search
            className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors"
            aria-hidden="true"
          />
          <span className="text-sm text-muted-foreground truncate">
            Buscar pacientes, citas o acciones…
          </span>
        </div>
        <kbd className="hidden sm:inline-flex items-center text-[10px] font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full border border-border/50 shrink-0">
          Ctrl + K
        </kbd>
      </button>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Conversor BCV Directo aislado para no re-renderizar el header */}
        <BcvQuickConverter rate={rate} rates={rates} />

        {/* Reloj en Tiempo Real aislado para evitar re-renders del Dashboard */}
        <LiveClockBadge />

        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={
                unreadCount > 0
                  ? `Notificaciones (${unreadCount} sin leer)`
                  : "Notificaciones"
              }
              className={cn(
                "flex items-center justify-center h-11 w-11 sm:h-10 sm:w-10 bg-card border border-border rounded-full shadow-sm text-muted-foreground relative transition-[transform,colors] duration-150 active:scale-95 hover:bg-muted/50 hover:text-primary hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                open && "text-primary bg-muted/50 border-primary/40"
              )}
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-2.5 right-2.5 sm:top-2 sm:right-2 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-card ring-0"
                />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 p-0 rounded-2xl shadow-xl overflow-hidden overscroll-contain border border-border font-sans"
          >
            <div className="px-4 py-3 bg-primary text-primary-foreground flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-wider">Notificaciones</span>
              <span className="text-xs bg-card/20 px-2 py-0.5 rounded-full font-bold">
                {notifications.length > 0
                  ? `${notifications.length} ${notifications.length === 1 ? "aviso" : "avisos"}`
                  : "0 nuevas"}
              </span>
            </div>
            <div className="max-h-[300px] overflow-y-auto overscroll-contain p-2 bg-card space-y-1">
              {notifications.length > 0 ? (
                notifications.map((n) => {
                  const Icon = n.icon;
                  const itemContent = (
                    <div
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl transition-colors text-left",
                        n.href
                          ? "hover:bg-muted/70 active:bg-muted cursor-pointer group"
                          : "hover:bg-muted/40 cursor-default"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5",
                          n.bg,
                          n.color
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5 leading-relaxed">
                          {n.desc}
                        </p>
                      </div>
                    </div>
                  );

                  return n.href ? (
                    <Link
                      key={n.id}
                      to={n.href}
                      onClick={() => setOpen(false)}
                      className="block min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                    >
                      {itemContent}
                    </Link>
                  ) : (
                    <div key={n.id}>{itemContent}</div>
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
          aria-label="Configuración"
          className="flex items-center justify-center h-11 w-11 sm:h-10 sm:w-10 bg-card border border-border rounded-full shadow-sm text-muted-foreground transition-[transform,colors] duration-150 active:scale-95 hover:bg-muted/50 hover:text-primary hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
});
