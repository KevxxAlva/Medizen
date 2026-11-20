import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";
import { setSessionPersistence, supabase } from "@/integrations/supabase/client";
import { clearScreenLock } from "@/lib/auth/quickAccess";
import { clearPersistentQueryCache } from "@/lib/cache/persistentQueryCache";
import { isDeviceOffline } from "@/lib/offline/networkState";
import {
  clearActiveOfflineSession,
  getEffectiveSession,
  getActiveOfflineSession,
} from "@/lib/offline/offlineAuth";

const CLINIC_ID_CACHE_PREFIX = "medizen_cached_clinic_id_";

function readCachedClinicId(uid: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(`${CLINIC_ID_CACHE_PREFIX}${uid}`);
  } catch {
    return null;
  }
}

function writeCachedClinicId(uid: string, clinicId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${CLINIC_ID_CACHE_PREFIX}${uid}`, clinicId);
  } catch {
    // ignore
  }
}

export type AppRole = "admin" | "doctor" | "recepcionista" | "medico" | "superadmin";

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

export const PRIMARY_CLINIC_ID = "c0000000-0000-0000-0000-000000000001";

export function useCurrentClinicId() {
  const { user } = useAuthSession();
  const { data } = useQuery({
    queryKey: ["current_clinic_id", user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
    placeholderData: user?.id ? (readCachedClinicId(user.id) ?? undefined) : undefined,
    queryFn: async (): Promise<string | null> => {
      if (!user?.id) return null;
      const cached = readCachedClinicId(user.id);
      if (isDeviceOffline()) {
        return cached ?? PRIMARY_CLINIC_ID;
      }
      try {
        const { data: userData } = await supabase
          .from("usuarios")
          .select("id_clinica")
          .eq("auth_id", user.id)
          .maybeSingle();
        const resolved = userData?.id_clinica ?? cached ?? PRIMARY_CLINIC_ID;
        writeCachedClinicId(user.id, resolved);
        return resolved;
      } catch {
        return cached ?? PRIMARY_CLINIC_ID;
      }
    },
  });
  return data ?? (user?.id ? readCachedClinicId(user.id) : null) ?? null;
}

export async function resolveCurrentUserClinicId(userId?: string): Promise<string | null> {
  let uid = userId;
  if (!uid) {
    const { data: sessionData } = await supabase.auth.getSession();
    uid = sessionData.session?.user?.id;
  }
  if (!uid) return null;
  const cached = readCachedClinicId(uid);
  if (isDeviceOffline()) {
    return cached ?? PRIMARY_CLINIC_ID;
  }
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id_clinica")
      .eq("auth_id", uid)
      .maybeSingle();
    if (error) {
      return cached ?? PRIMARY_CLINIC_ID;
    }
    const resolved = data?.id_clinica ?? cached ?? PRIMARY_CLINIC_ID;
    writeCachedClinicId(uid, resolved);
    return resolved;
  } catch {
    return cached ?? PRIMARY_CLINIC_ID;
  }
}

export async function requireAdminAccess() {
  if (typeof window === "undefined") {
    return { user: null };
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) {
    throw redirect({ to: "/auth" });
  }

  const metaRole = (user.user_metadata?.role || "").toLowerCase();

  if (isDeviceOffline()) {
    try {
      const raw = localStorage.getItem(`medizen_cached_roles_${user.id}`);
      const cachedRoles: string[] = raw ? JSON.parse(raw) : [];
      const isCachedAdmin =
        cachedRoles.includes("admin") ||
        cachedRoles.includes("superadmin") ||
        metaRole.includes("admin") ||
        metaRole.includes("super");
      if (!isCachedAdmin) {
        throw redirect({ to: "/dashboard" });
      }
      return { user };
    } catch (e) {
      if (e && typeof e === "object" && "to" in e) throw e;
      return { user };
    }
  }

  const { data } = await supabase
    .from("usuarios")
    .select("id_rol, es_superadmin, roles(nombre_rol)")
    .eq("auth_id", user.id)
    .maybeSingle();

  const roleObj = data?.roles;
  const rawRoleName = Array.isArray(roleObj) ? roleObj[0]?.nombre_rol : (roleObj as any)?.nombre_rol;
  const roleName = (rawRoleName || "").toLowerCase();

  const isAdmin =
    Boolean(data?.es_superadmin) ||
    data?.id_rol === 1 ||
    data?.id_rol === 4 ||
    roleName.includes("admin") ||
    roleName.includes("super") ||
    metaRole.includes("admin") ||
    metaRole.includes("super");

  if (!isAdmin) {
    throw redirect({ to: "/dashboard" });
  }

  return { user };
}

let sharedAuthState: AuthState = { session: null, user: null, loading: true };
let authInitialized = false;
const authListeners = new Set<(state: AuthState) => void>();

function ensureAuthSubscription() {
  if (authInitialized || typeof window === "undefined") return;
  authInitialized = true;

  getEffectiveSession().then((session) => {
    sharedAuthState = {
      session,
      user: session?.user ?? null,
      loading: false,
    };
    authListeners.forEach((fn) => fn(sharedAuthState));
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      clearActiveOfflineSession();
      setSessionPersistence(true);
      clearScreenLock();
      if (!isDeviceOffline()) {
        clearPersistentQueryCache();
      }
      if (typeof window !== "undefined") {
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith("medizen_cached_roles") || k.startsWith(CLINIC_ID_CACHE_PREFIX)) {
              localStorage.removeItem(k);
            }
          });
        } catch {}
      }
    }
    const effective = session ?? (event === "SIGNED_OUT" ? null : getActiveOfflineSession());
    sharedAuthState = {
      session: effective,
      user: effective?.user ?? null,
      loading: false,
    };
    authListeners.forEach((fn) => fn(sharedAuthState));
  });
}

export function setAuthSessionManually(session: Session | null) {
  sharedAuthState = {
    session,
    user: session?.user ?? null,
    loading: false,
  };
  authListeners.forEach((fn) => fn(sharedAuthState));
}

export function useAuthSession(): AuthState {
  const [state, setState] = useState<AuthState>(() => sharedAuthState);

  useEffect(() => {
    ensureAuthSubscription();
    setState((current) => (current !== sharedAuthState ? sharedAuthState : current));
    authListeners.add(setState);
    return () => {
      authListeners.delete(setState);
    };
  }, []);

  return state;
}

function readCachedRolesSync(userId?: string): AppRole[] | undefined {
  if (typeof window === "undefined" || !userId) return undefined;
  try {
    const raw = localStorage.getItem(`medizen_cached_roles_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as AppRole[];
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function useRoles() {
  const { user } = useAuthSession();
  const cachedRoles = readCachedRolesSync(user?.id);

  return useQuery({
    queryKey: ["user_roles", user?.id],
    enabled: !!user,
    placeholderData: cachedRoles,
    queryFn: async () => {
      // 1. Check user_metadata first as fast reliable source
      const metaRole = (user?.user_metadata?.role || "").toLowerCase();
      let defaultRoles: AppRole[] = [];
      if (metaRole === "admin" || metaRole === "doctor" || metaRole === "medico" || metaRole === "recepcionista") {
        defaultRoles = [metaRole as AppRole];
      }

      if (isDeviceOffline()) {
        if (cachedRoles && cachedRoles.length > 0) return cachedRoles;
        return defaultRoles;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select("id_rol, es_superadmin, roles(nombre_rol)")
        .eq("auth_id", user!.id)
        .maybeSingle();

      if (error) {
        if (cachedRoles && cachedRoles.length > 0) return cachedRoles;
        if (defaultRoles.length > 0) return defaultRoles;
        throw error;
      }

      if (!data) {
        return defaultRoles;
      }

      const rawRole = Array.isArray(data.roles) ? data.roles[0]?.nombre_rol : (data.roles as any)?.nombre_rol;
      const roleName = (rawRole || "").toLowerCase();
      const roles: AppRole[] = [];

      if (data.es_superadmin || data.id_rol === 4 || roleName.includes("super")) {
        roles.push("superadmin", "admin");
      } else if (data.id_rol === 1 || roleName.includes("admin")) {
        roles.push("admin");
      } else if (data.id_rol === 3 || roleName.includes("recep")) {
        roles.push("recepcionista");
      } else if (data.id_rol === 2 || roleName.includes("medic") || roleName.includes("médic") || roleName.includes("doctor")) {
        roles.push("doctor");
      } else if (defaultRoles.length > 0) {
        roles.push(...defaultRoles);
      }
      if (typeof window !== "undefined" && user?.id) {
        try {
          localStorage.setItem(`medizen_cached_roles_${user.id}`, JSON.stringify(roles));
        } catch {
          // ignore
        }
      }
      return roles;
    },
  });
}

export function useIsAdmin() {
  const { data } = useRoles();
  return (data ?? []).includes("admin") || (data ?? []).includes("superadmin");
}

export function useIsSuperAdmin() {
  const { data } = useRoles();
  return (data ?? []).includes("superadmin");
}

