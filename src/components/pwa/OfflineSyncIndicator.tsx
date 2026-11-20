import { useState } from "react";
import {
  WifiOff,
  RefreshCw,
  CloudUpload,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Cloud,
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
  const [open, setOpen] = useState(false);

  // Cuando está en línea, sin cambios pendientes ni errores y no sincronizando: 0 ruido visual
  if (isOnline && totalCount === 0 && !isSyncing) {
    return null;
  }

  const hasFailures = failedCount > 0;
  const toneClass = !isOnline
    ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
    : hasFailures
      ? "bg-destructive/10 border-destructive/30 text-destructive"
      : "bg-primary/10 border-primary/30 text-primary";

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className={`rounded-2xl border px-3.5 py-2.5 text-xs sm:text-sm font-medium flex flex-wrap items-center justify-between gap-2.5 shadow-xs transition-colors ${toneClass}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {!isOnline ? (
            <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : isSyncing ? (
            <RefreshCw className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          ) : hasFailures ? (
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <CloudUpload className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}

          <span className="truncate">
            {!isOnline ? (
              <>
                <strong>Modo sin conexión</strong>
                <span className="hidden sm:inline">
                  {" "}
                  — Los cambios se guardan localmente y se sincronizarán al volver el internet.
                </span>
                {totalCount > 0 && (
                  <span className="ml-1.5 font-bold">
                    ({totalCount} pendiente{totalCount === 1 ? "" : "s"})
                  </span>
                )}
              </>
            ) : isSyncing ? (
              <>
                <strong>Sincronizando datos locales</strong> ({pendingCount} pendiente
                {pendingCount === 1 ? "" : "s"})…
              </>
            ) : hasFailures ? (
              <>
                <strong>
                  {failedCount} cambio{failedCount === 1 ? "" : "s"} con error al sincronizar
                </strong>
                {pendingCount > 0 ? ` y ${pendingCount} pendiente${pendingCount === 1 ? "" : "s"}` : ""}
              </>
            ) : (
              <>
                <strong>
                  {pendingCount} cambio{pendingCount === 1 ? "" : "s"} pendiente
                  {pendingCount === 1 ? "" : "s"}
                </strong>{" "}
                por subir a la nube
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOnline && !isSyncing && totalCount > 0 && (
            <button
              type="button"
              onClick={() => void syncNow(true)}
              className="px-2.5 py-1 rounded-xl bg-background/80 hover:bg-background text-foreground border border-border/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sincronizar ahora
            </button>
          )}
          {totalCount > 0 && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-background/60 hover:bg-background/90 text-current border border-current/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              Ver cola ({totalCount})
            </button>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isOnline ? (
                <Cloud className="h-5 w-5 text-primary" />
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
                                ? "bg-primary/15 text-primary"
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
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
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
