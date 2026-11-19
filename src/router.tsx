import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { setupPersistentQueryCache } from "@/lib/cache/persistentQueryCache";

let browserQueryClient: QueryClient | undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutos de datos frescos en Caché L1 (RAM)
        gcTime: 1000 * 60 * 30, // 30 minutos de retención en memoria (Garbage Collection)
        refetchOnWindowFocus: false, // Evita re-consultar al cambiar de pestaña/aplicación
        refetchOnMount: false, // Usa la caché existente; Supabase Realtime invalida cuando hay cambios
        refetchOnReconnect: true,
        retry: 1,
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
