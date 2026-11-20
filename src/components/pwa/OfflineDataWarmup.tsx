import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuthSession, useIsAdmin } from "@/hooks/useAuth";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { usePatients, usePaginatedPatients } from "@/lib/api/patients";
import { useAppointments } from "@/lib/api/appointments";
import { useServices, useSpecialties } from "@/lib/api/services";
import { useDoctors } from "@/lib/api/profiles";
import { useAccounts } from "@/lib/api/accounts";
import { usePaymentMethods } from "@/lib/api/paymentMethods";
import { useStocks } from "@/lib/api/inventory";
import { usePurchases } from "@/lib/api/purchases";
import { useConsultations } from "@/lib/api/consultations";
import { useAuditLogs } from "@/lib/api/audit";
import { useSalesInvoices } from "@/components/finance/useSalesInvoices";

function WarmupClinicalQueries() {
  usePatients();
  usePaginatedPatients(1, 15, undefined, undefined);
  useAppointments();
  useServices();
  useSpecialties();
  useDoctors();
  useConsultations();
  return null;
}

function WarmupAdminQueries() {
  useAccounts();
  usePaymentMethods();
  useStocks();
  usePurchases();
  useSalesInvoices();
  useAuditLogs(250);
  return null;
}

const ROUTES_TO_PRELOAD = [
  "/dashboard",
  "/sala-espera",
  "/agenda",
  "/pacientes",
  "/servicios",
  "/doctores",
  "/cuentas",
  "/facturacion",
  "/honorarios",
  "/metodos-pago",
  "/stocks",
  "/reportes",
  "/auditoria",
  "/configuracion",
  "/auth",
] as const;

/**
 * Precarga silenciosamente en segundo plano (una sola vez por sesión en línea)
 * tanto los chunks JS/CSS de TODAS las rutas (para el Service Worker) como los datos
 * de todos los módulos hacia IndexedDB para que nunca falle una ruta en modo offline.
 */
export function OfflineDataWarmup({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const { user } = useAuthSession();
  const isAdmin = useIsAdmin();
  const { isOnline } = useOfflineSync();
  const [phase, setPhase] = useState<"idle" | "warming" | "done">("idle");

  useEffect(() => {
    if (disabled || !user?.id || !isOnline || phase !== "idle") return;

    // Esperar 2.5s tras el arranque para no competir con la carga inicial de la pantalla actual
    const startTimer = window.setTimeout(() => {
      setPhase("warming");
      // Precargar todos los chunks JS/CSS de rutas en el Service Worker para navegación 100% offline
      void Promise.allSettled(
        ROUTES_TO_PRELOAD.map((to) => router.preloadRoute({ to: to as any })),
      );
    }, 2500);

    return () => window.clearTimeout(startTimer);
  }, [disabled, user?.id, isOnline, phase, router]);

  useEffect(() => {
    if (phase !== "warming") return;
    // Desmontar tras 6s para detener pollings secundarios; los datos ya quedan en IndexedDB por 30 días
    const stopTimer = window.setTimeout(() => {
      setPhase("done");
    }, 6000);

    return () => window.clearTimeout(stopTimer);
  }, [phase]);

  if (phase !== "warming" || !isOnline || disabled || !user?.id) {
    return null;
  }

  return (
    <>
      <WarmupClinicalQueries />
      {isAdmin && <WarmupAdminQueries />}
    </>
  );
}
