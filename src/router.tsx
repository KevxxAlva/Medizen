import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { setupPersistentQueryCache } from "@/lib/cache/persistentQueryCache";
import { isOfflineError } from "@/lib/offline/networkState";
import { registerSyncRuntime } from "@/lib/offline/syncEngine";

let browserQueryClient: QueryClient | undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: "offlineFirst",
        staleTime: 1000 * 60 * 5, // 5 minutos de datos frescos en Caché L1 (RAM)
        gcTime: 1000 * 60 * 60 * 24, // 24 horas de retención en memoria para modo offline
        refetchOnWindowFocus: false, // Evita re-consultar al cambiar de pestaña/aplicación
        refetchOnMount: false, // Usa la caché existente; Supabase Realtime invalida cuando hay cambios
        refetchOnReconnect: false, // syncEngine invalida DESPUÉS de subir la cola offline para evitar sobrescribir cambios pendientes
        retry: (failureCount, error) => !isOfflineError(error) && failureCount < 1,
      },
      mutations: {
        networkMode: "offlineFirst",
        retry: false,
      },
    },
  });
}

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
    setupPersistentQueryCache(browserQueryClient);
    registerSyncRuntime({ queryClient: browserQueryClient });
  }
  return browserQueryClient;
}

export const getRouter = () => {
  const queryClient = getQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 1000 * 60 * 5, // Respeta los 5 min de caché al pasar el cursor por el menú
  });

  return router;
};
