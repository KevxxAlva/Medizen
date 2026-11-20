/**
 * Gestión de autenticación y sesiones locales para el modo Offline-First de Medizen.
 *
 * Permite:
 * 1. Guardar una instantánea segura de la sesión + hash de credenciales por usuario
 *    cuando el usuario inicia sesión con internet.
 * 2. Iniciar sesión con correo/contraseña o PIN de 4 dígitos estando SIN internet
 *    para cuentas que ya hayan iniciado sesión previamente en este dispositivo.
 * 3. Restaurar el rol exacto del usuario (evitando redirecciones erróneas a /superadmin
 *    o bucles entre /auth y /dashboard cuando no hay conexión).
 */

import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isDeviceOffline } from "@/lib/offline/networkState";

const OFFLINE_SESSIONS_KEY = "medizen_offline_sessions_v1";
const ACTIVE_OFFLINE_SESSION_KEY = "medizen_active_offline_session_v1";

export interface OfflineAccountSnapshot {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  isSuperAdmin: boolean;
  clinicId: string | null;
  passwordHash?: string;
  session: Session;
  savedAt: number;
}

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fallbackHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

async function hashOfflineCredentials(email: string, password: string): Promise<string> {
  const normalized = `medizen-offline-auth-v1:${email.trim().toLowerCase()}:${password}`;
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    try {
      const enc = new TextEncoder();
      const digest = await window.crypto.subtle.digest("SHA-256", enc.encode(normalized));
      return bufferToHex(digest);
    } catch {
      // fallback below
    }
  }
  return fallbackHash(normalized);
}

function readAllSnapshots(): Record<string, OfflineAccountSnapshot> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OFFLINE_SESSIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAllSnapshots(map: Record<string, OfflineAccountSnapshot>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OFFLINE_SESSIONS_KEY, JSON.stringify(map));
  } catch {
    // ignore quota errors
  }
}

export async function saveOfflineAccountSnapshot(params: {
  session: Session;
  email: string;
  password?: string;
  fullName?: string;
  role?: string;
  isSuperAdmin?: boolean;
  clinicId?: string | null;
}): Promise<void> {
  if (typeof window === "undefined" || !params.session?.user?.id) return;
  const userId = params.session.user.id;
  const all = readAllSnapshots();
  const prev = all[userId];

  const passwordHash = params.password
    ? await hashOfflineCredentials(params.email, params.password)
    : prev?.passwordHash;

  all[userId] = {
    userId,
    email: params.email.trim().toLowerCase(),
    fullName:
      params.fullName ||
      prev?.fullName ||
      (params.session.user.user_metadata?.full_name as string | undefined) ||
      params.email.split("@")[0],
    role: params.role || prev?.role || "Usuario",
    isSuperAdmin: params.isSuperAdmin ?? prev?.isSuperAdmin ?? false,
    clinicId: params.clinicId !== undefined ? params.clinicId : (prev?.clinicId ?? null),
    passwordHash,
    session: params.session,
    savedAt: Date.now(),
  };

  writeAllSnapshots(all);
}

export function getOfflineAccountSnapshotByUserId(userId: string): OfflineAccountSnapshot | null {
  const all = readAllSnapshots();
  return all[userId] ?? null;
}

export function getActiveOfflineSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_OFFLINE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    return parsed?.user?.id ? parsed : null;
  } catch {
    return null;
  }
}

export function setActiveOfflineSession(session: Session | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(ACTIVE_OFFLINE_SESSION_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(ACTIVE_OFFLINE_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

export function clearActiveOfflineSession(): void {
  setActiveOfflineSession(null);
}

/**
 * Obtiene la sesión efectiva: primero intenta Supabase Auth (localStorage),
 * y si estamos sin conexión y existe una sesión offline restaurada, la devuelve.
 */
export async function getEffectiveSession(): Promise<Session | null> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      return data.session;
    }
  } catch {
    // ignore
  }
  return getActiveOfflineSession();
}

/**
 * Restaura una sesión offline para un usuario específico ya verificado por PIN.
 */
export function activateOfflineSessionForUser(userId: string): {
  success: boolean;
  session?: Session;
  user?: User;
  isSuperAdmin?: boolean;
  error?: string;
} {
  const snapshot = getOfflineAccountSnapshotByUserId(userId);
  if (!snapshot?.session) {
    return {
      success: false,
      error:
        "Sin conexión a internet. Esta cuenta debe iniciar sesión una vez con internet en este equipo para habilitar el acceso sin conexión.",
    };
  }

  setActiveOfflineSession(snapshot.session);
  return {
    success: true,
    session: snapshot.session,
    user: snapshot.session.user,
    isSuperAdmin: snapshot.isSuperAdmin,
  };
}

/**
 * Verifica correo y contraseña localmente contra el hash guardado en este dispositivo
 * para permitir iniciar sesión sin internet con cuentas previamente autenticadas.
 */
export async function verifyOfflinePasswordLogin(
  email: string,
  password: string,
): Promise<{
  success: boolean;
  session?: Session;
  user?: User;
  isSuperAdmin?: boolean;
  fullName?: string;
  error?: string;
}> {
  const normalizedEmail = email.trim().toLowerCase();
  const all = readAllSnapshots();
  const match = Object.values(all).find((s) => s.email === normalizedEmail);

  if (!match || !match.passwordHash) {
    return {
      success: false,
      error:
        "Sin conexión a internet. Para iniciar sesión por primera vez con esta cuenta necesitas conexión.",
    };
  }

  const candidateHash = await hashOfflineCredentials(normalizedEmail, password);
  if (candidateHash !== match.passwordHash) {
    return {
      success: false,
      error: "Correo o contraseña incorrectos.",
    };
  }

  setActiveOfflineSession(match.session);
  return {
    success: true,
    session: match.session,
    user: match.session.user,
    isSuperAdmin: match.isSuperAdmin,
    fullName: match.fullName,
  };
}

/**
 * Cuando regresa el internet y el usuario inició sesión en modo offline,
 * intenta rehidratar la sesión oficial en Supabase con el refresh_token guardado.
 */
export async function hydrateSupabaseSessionIfNeeded(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    clearActiveOfflineSession();
    return data.session.access_token;
  }

  if (isDeviceOffline()) {
    return getActiveOfflineSession()?.access_token ?? null;
  }

  const offlineSession = getActiveOfflineSession();
  if (!offlineSession?.refresh_token) return null;

  try {
    const { data: refreshed, error } = await supabase.auth.setSession({
      access_token: offlineSession.access_token,
      refresh_token: offlineSession.refresh_token,
    });
    if (!error && refreshed.session) {
      clearActiveOfflineSession();
      return refreshed.session.access_token;
    }
  } catch {
    // ignore
  }

  return offlineSession.access_token;
}
