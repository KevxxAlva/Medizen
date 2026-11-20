import { useEffect, useRef, useState } from "react";
import {
  WifiOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Cloud,
  CloudUpload,
} from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function formatShortTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString("es-VE", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

type OverlayMode = "offline" | "online" | null;

function ConnectionTransitionOverlay({
  mode,
  pendingCount,
  isSyncing,
  onClose,
}: {
  mode: OverlayMode;
  pendingCount: number;
  isSyncing: boolean;
  onClose: () => void;
}) {
  if (!mode) return null;

  const isOffline = mode === "offline";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/55 backdrop-blur-md animate-in fade-in duration-250"
    >
      <style>{`
        @keyframes medizen-net-circle-draw {
          0% { stroke-dashoffset: 264; transform: scale(0.88); opacity: 0; }
          50% { opacity: 1; transform: scale(1.04); }
          100% { stroke-dashoffset: 0; transform: scale(1); opacity: 1; }
        }
        @keyframes medizen-net-icon-draw {
          0% { stroke-dashoffset: 100; opacity: 0.2; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes medizen-net-slash-draw {
          0% { stroke-dashoffset: 90; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .medizen-net-circle {
          stroke-dasharray: 264;
          stroke-dashoffset: 264;
          transform-origin: center;
          animation: medizen-net-circle-draw 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .medizen-net-stroke {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: medizen-net-icon-draw 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.28s forwards;
        }
        .medizen-net-slash {
          stroke-dasharray: 90;
          stroke-dashoffset: 90;
          animation: medizen-net-slash-draw 0.38s cubic-bezier(0.22, 1, 0.36, 1) 0.48s forwards;
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm rounded-3xl border bg-card/95 backdrop-blur-xl p-6 sm:p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300 ${
          isOffline ? "border-amber-500/30 shadow-amber-500/10" : "border-emerald-500/30 shadow-emerald-500/10"
        }`}
      >
        <div className="relative flex items-center justify-center mb-5">
          <div
            className={`absolute h-28 w-28 rounded-full animate-ping [animation-duration:1.6s] ${
              isOffline ? "bg-amber-500/15" : "bg-emerald-500/15"
            }`}
          />
          <div
            className={`absolute h-24 w-24 rounded-full ${
              isOffline ? "bg-amber-500/10" : "bg-emerald-500/10"
            }`}
          />

          {isOffline ? (
            <svg className="h-24 w-24 text-amber-500 relative z-10" viewBox="0 0 96 96" fill="none">
              <circle
                cx="48"
                cy="48"
                r="42"
                stroke="currentColor"
                strokeWidth="5.5"
                strokeLinecap="round"
                className="medizen-net-circle"
              />
              {/* Arcos de Wi-Fi */}
              <path
                d="M28 43C33.5 37.8 40.4 35 48 35C55.6 35 62.5 37.8 68 43"
                stroke="currentColor"
                strokeWidth="4.8"
                strokeLinecap="round"
                className="medizen-net-stroke"
              />
              <path
                d="M35.5 51.5C38.8 48.3 43.2 46.5 48 46.5C52.8 46.5 57.2 48.3 60.5 51.5"
                stroke="currentColor"
                strokeWidth="4.8"
                strokeLinecap="round"
                className="medizen-net-stroke"
              />
              <circle cx="48" cy="60.5" r="3.2" fill="currentColor" className="medizen-net-stroke" />
              {/* Diagonal de desconexión */}
              <path
                d="M27 27L69 69"
                stroke="currentColor"
                strokeWidth="5.5"
                strokeLinecap="round"
                className="medizen-net-slash"
              />
            </svg>
          ) : (
            <svg className="h-24 w-24 text-emerald-500 relative z-10" viewBox="0 0 96 96" fill="none">
              <circle
                cx="48"
                cy="48"
                r="42"
                stroke="currentColor"
                strokeWidth="5.5"
                strokeLinecap="round"
                className="medizen-net-circle"
              />
              <path
                d="M30 49.5L42.5 62L67 36.5"
                stroke="currentColor"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="medizen-net-stroke"
              />
            </svg>
          )}
        </div>

        <span
          className={`inline-block text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${
            isOffline
              ? "text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30"
              : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
          }`}
        >
          {isOffline
            ? "Modo Local · PWA Offline"
            : isSyncing || pendingCount > 0
              ? "Conexión Restablecida · Sincronizando"
              : "Conexión Restablecida"}
        </span>

        <h3 className="text-xl sm:text-2xl font-black text-foreground mt-3">
          {isOffline ? "Sin Conexión a Internet" : "¡De Vuelta en Línea!"}
        </h3>

        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {isOffline ? (
            <>
              Puedes seguir trabajando normalmente. Tus registros se guardan de forma segura en{" "}
              <strong className="text-foreground">este dispositivo</strong> y se subirán solos al reconectar.
            </>
          ) : pendingCount > 0 || isSyncing ? (
            <>
              Tu conexión ha vuelto. Estamos subiendo{" "}
              <strong className="text-foreground">
                {pendingCount} cambio{pendingCount === 1 ? "" : "s"} local{pendingCount === 1 ? "" : "es"}
              </strong>{" "}
              automáticamente a la nube.
            </>
          ) : (
            <>
              Conexión activa con <strong className="text-foreground">Medizen Cloud</strong>. Todos tus datos están sincronizados.
            </>
          )}
        </p>

        <Button
          type="button"
          onClick={onClose}
          className={`mt-6 w-full h-10 rounded-2xl text-white font-bold text-xs shadow-sm cursor-pointer ${
            isOffline
              ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
              : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
          }`}
        >
          {isOffline ? "Entendido, Seguir Trabajando" : "Continuar"}
        </Button>
      </div>
    </div>
  );
}

export function OfflineSyncIndicator() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    totalCount,
    items,
    lastSyncedAt,
    syncNow,
    retryItem,
    discardItem,
  } = useOfflineSync();

  const [queueOpen, setQueueOpen] = useState(false);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>(null);
  const prevOnlineRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (prevOnlineRef.current === null) {
      prevOnlineRef.current = isOnline;
      // Si el usuario abre la app ya estando sin internet, mostrar la animación offline una vez
      if (!isOnline) {
        setOverlayMode("offline");
      }
      return;
    }

    if (prevOnlineRef.current !== isOnline) {
      prevOnlineRef.current = isOnline;
      setOverlayMode(isOnline ? "online" : "offline");
    }
  }, [isOnline]);

  // Auto-cerrar la animación después de unos segundos para no interrumpir el flujo clínico
  useEffect(() => {
    if (!overlayMode) return;
    const ms = overlayMode === "offline" ? 4200 : 3200;
    const timer = setTimeout(() => {
      setOverlayMode(null);
    }, ms);
    return () => clearTimeout(timer);
  }, [overlayMode]);

  const showFloatingChip = !isOnline || totalCount > 0 || isSyncing;
  const hasFailures = failedCount > 0;

  return (
    <>
      <ConnectionTransitionOverlay
        mode={overlayMode}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onClose={() => setOverlayMode(null)}
      />

      {/* Chip flotante discreto (solo aparece sin conexión o con cambios pendientes/errores) */}
      {showFloatingChip && (
        <button
          type="button"
          onClick={() => setQueueOpen(true)}
          aria-label="Abrir centro de sincronización local"
          className={`fixed bottom-20 md:bottom-5 right-4 md:right-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full border backdrop-blur-md shadow-lg text-xs font-bold transition-all duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer ${
            !isOnline
              ? "bg-card/90 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-amber-500/10"
              : hasFailures
                ? "bg-card/90 border-destructive/40 text-destructive shadow-destructive/10"
                : "bg-card/90 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10"
          }`}
        >
          {!isOnline ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Modo Local</span>
              {totalCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-extrabold">
                  {totalCount}
                </span>
              )}
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span>Sincronizando…</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-extrabold">
                  {pendingCount}
                </span>
              )}
            </>
          ) : hasFailures ? (
            <>
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{failedCount} error{failedCount === 1 ? "" : "es"} sync</span>
            </>
          ) : (
            <>
              <CloudUpload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{pendingCount} pendiente{pendingCount === 1 ? "" : "s"}</span>
            </>
          )}
        </button>
      )}

      <Dialog open={queueOpen} onOpenChange={setQueueOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isOnline ? (
                <Cloud className="h-5 w-5 text-emerald-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-amber-500" />
              )}
              Centro de Sincronización Local
            </DialogTitle>
            <DialogDescription>
              {isOnline
                ? "Conectado a internet. Tus cambios locales se envían en orden a Supabase."
                : "Sin conexión a internet. Todos tus cambios están protegidos en este dispositivo."}
              {lastSyncedAt && (
                <span className="block mt-1 text-xs">
                  Última sincronización exitosa: {formatShortTime(lastSyncedAt)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <span>No hay cambios pendientes. Todo está sincronizado.</span>
              </div>
            ) : (
              items.map((item) => {
                const isFailed = item.status === "failed";
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-3 text-sm flex items-start justify-between gap-3 ${
                      isFailed
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{item.label}</span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isFailed
                              ? "bg-destructive/15 text-destructive"
                              : item.status === "syncing"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {isFailed
                            ? "Error"
                            : item.status === "syncing"
                              ? "Sincronizando"
                              : "Pendiente"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Guardado localmente a las {formatShortTime(item.createdAt)} · tabla{" "}
                        <code className="font-mono">{item.table}</code>
                      </p>
                      {item.lastError && (
                        <p className="text-xs text-destructive mt-1 break-words">
                          {item.lastError}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isFailed && isOnline && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-xl"
                          title="Reintentar sincronización"
                          onClick={() => void retryItem(item.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
                        title="Descartar cambio local"
                        onClick={() => void discardItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setQueueOpen(false)}
            >
              Cerrar
            </Button>
            {isOnline && items.length > 0 && (
              <Button
                type="button"
                className="rounded-xl gap-2"
                disabled={isSyncing}
                onClick={() => void syncNow(true)}
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Sincronizando…" : "Sincronizar todo"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
