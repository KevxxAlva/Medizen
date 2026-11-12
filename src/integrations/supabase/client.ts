import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function getEnvVar(name: string, viteAliases: string[]): string {
  // Client-side: Vite replaces import.meta.env.VITE_* at build time
  for (const alias of viteAliases) {
    const val = import.meta.env[alias];
    if (val) return val;
  }
  // SSR / server-side: read from process.env
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[name];
    if (val) return val;
  }
  throw new Error(
    `Missing environment variable: ${name}. ` +
    `Define VITE_${name} (or ${viteAliases.join(' / ')}) in your .env file.`
  );
}

const SESSION_ONLY_KEY = "medizen_auth_session_only";

/**
 * Controls whether the Supabase session is persisted across browser restarts (localStorage)
 * or scoped to the current browser tab/session only (sessionStorage).
 */
export function setSessionPersistence(keepActive: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (keepActive) {
      window.sessionStorage.removeItem(SESSION_ONLY_KEY);
    } else {
      window.sessionStorage.setItem(SESSION_ONLY_KEY, "true");
    }
  } catch {
    // Ignore storage access errors in restricted browser contexts
  }
}

export function isSessionPersistenceEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(SESSION_ONLY_KEY) !== "true";
  } catch {
    return true;
  }
}

const authStorage = {
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    try {
      return isSessionPersistenceEnabled()
        ? window.localStorage.getItem(key)
        : window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    if (typeof window === "undefined") return;
    try {
      if (isSessionPersistenceEnabled()) {
        window.localStorage.setItem(key, value);
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, value);
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage quota or access errors
    }
  },
  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      // Ignore storage access errors
    }
  },
};

function createSupabaseClient() {
  const SUPABASE_URL = getEnvVar('SUPABASE_URL', [
    'VITE_SUPABASE_URL',
  ]);

  const SUPABASE_PUBLISHABLE_KEY = getEnvVar('SUPABASE_PUBLISHABLE_KEY', [
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_ANON_KEY',
  ]);

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? authStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});

