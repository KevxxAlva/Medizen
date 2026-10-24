import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "doctor" | "recepcionista" | "medico";

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
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
    throw redirect({ to: "/" });
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

  supabase.auth.onAuthStateChange((_e, session) => {
    sharedAuthState = {
      session,
      user: session?.user ?? null,
      loading: false,
    };
    authListeners.forEach((fn) => fn(sharedAuthState));
  });
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

const CACHED_ROLES_KEY = "medizen_cached_roles";

export function useRoles() {
  const { user } = useAuthSession();
  const [cachedRoles, setCachedRoles] = useState<AppRole[] | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(CACHED_ROLES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setCachedRoles(parsed as AppRole[]);
        }
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  return useQuery({
    queryKey: ["user_roles", user?.id],
    enabled: !!user,
    placeholderData: cachedRoles,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("roles(nombre_rol)")
        .eq("auth_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data || !data.roles) return [];
      const roleName = Array.isArray(data.roles) ? data.roles[0]?.nombre_rol : (data.roles as any).nombre_rol;
      const roles: AppRole[] = roleName ? [roleName.toLowerCase() as AppRole] : [];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(CACHED_ROLES_KEY, JSON.stringify(roles));
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
  return (data ?? []).includes("admin");
}
