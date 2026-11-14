import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";
import { setSessionPersistence, supabase } from "@/integrations/supabase/client";
import { clearScreenLock } from "@/lib/auth/quickAccess";
import { clearPersistentQueryCache } from "@/lib/cache/persistentQueryCache";

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
    queryFn: async (): Promise<string | null> => {
      if (!user?.id) return null;
      const { data: userData } = await supabase
        .from("usuarios")
        .select("id_clinica")
        .eq("auth_id", user.id)
        .maybeSingle();
      return userData?.id_clinica ?? PRIMARY_CLINIC_ID;
    },
  });
  return data ?? null;
}

export async function resolveCurrentUserClinicId(userId?: string): Promise<string | null> {
  let uid = userId;
  if (!uid) {
    const { data: sessionData } = await supabase.auth.getSession();
    uid = sessionData.session?.user?.id;
  }
  if (!uid) return null;
  const { data } = await supabase
    .from("usuarios")
    .select("id_clinica")
    .eq("auth_id", uid)
    .maybeSingle();
  return data?.id_clinica ?? PRIMARY_CLINIC_ID;
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

  const { data } = await supabase
    .from("usuarios")
    .select("roles(nombre_rol)")
    .eq("auth_id", user.id)
    .maybeSingle();

  const roleObj = data?.roles;
  const roleName = Array.isArray(roleObj) ? roleObj[0]?.nombre_rol : (roleObj as any)?.nombre_rol;
  if ((roleName || "").toLowerCase() !== "admin") {
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

  supabase.auth.getSession().then(({ data }) => {
    sharedAuthState = {
      session: data.session,
      user: data.session?.user ?? null,
      loading: false,
    };
    authListeners.forEach((fn) => fn(sharedAuthState));
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      setSessionPersistence(true);
      clearScreenLock();
      clearPersistentQueryCache();
      if (typeof window !== "undefined") {
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith("medizen_cached_roles")) {
              localStorage.removeItem(k);
            }
          });
        } catch {}
      }
    }
    sharedAuthState = {
      session,
      user: session?.user ?? null,
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

export function useRoles() {
  const { user } = useAuthSession();
  const [cachedRoles, setCachedRoles] = useState<AppRole[] | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined" && user?.id) {
      try {
        const raw = localStorage.getItem(`medizen_cached_roles_${user.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setCachedRoles(parsed as AppRole[]);
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [user?.id]);

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

      const { data, error } = await supabase
        .from("usuarios")
        .select("es_superadmin, roles(nombre_rol)")
        .eq("auth_id", user!.id)
        .maybeSingle();

      if (error) {
        if (defaultRoles.length > 0) return defaultRoles;
        throw error;
      }

      if (!data) {
        return defaultRoles;
      }

      const rawRole = Array.isArray(data.roles) ? data.roles[0]?.nombre_rol : (data.roles as any)?.nombre_rol;
      const roleName = (rawRole || "").toLowerCase();
      const roles: AppRole[] = [];

      if (data.es_superadmin || roleName.includes("super")) {
        roles.push("superadmin", "admin");
      } else if (roleName.includes("admin")) {
        roles.push("admin");
      } else if (roleName.includes("recep")) {
        roles.push("recepcionista");
      } else if (roleName.includes("medic") || roleName.includes("doctor")) {
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

