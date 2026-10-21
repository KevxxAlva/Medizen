import { supabase } from "@/integrations/supabase/client";

export interface QuickAccessProfile {
  userId: string;
  email: string;
  fullName: string;
  role?: string;
  avatarUrl?: string | null;
  lastLogin: string;
  hasPin: boolean;
}

interface EncryptedVault {
  ciphertext: string;
  iv: string;
  salt: string;
}

interface StoredAccountData {
  profile: QuickAccessProfile;
  vault: EncryptedVault;
}

const STORAGE_KEY = "femesalud_quick_accounts_vault";
const LAST_ACCOUNT_KEY = "femesalud_quick_last_user";
const PIN_HASH_PREFIX = "femesalud_pin_hash_";
const LEGACY_PIN_PREFIX = "femesalud_pin_";
const LOCKOUT_KEY_PREFIX = "femesalud_pin_lockout_";
const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds

// --- BRUTE-FORCE RATE LIMITING ---

interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
}

function getLockoutState(userId: string): LockoutState {
  try {
    const raw = sessionStorage.getItem(`${LOCKOUT_KEY_PREFIX}${userId}`);
    if (!raw) return { attempts: 0, lockedUntil: null };
    const parsed = JSON.parse(raw) as LockoutState;
    if (parsed.lockedUntil && Date.now() > parsed.lockedUntil) {
      sessionStorage.removeItem(`${LOCKOUT_KEY_PREFIX}${userId}`);
      return { attempts: 0, lockedUntil: null };
    }
    return parsed;
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}

function recordFailedPinAttempt(userId: string): { locked: boolean; remainingSeconds: number } {
  try {
    const state = getLockoutState(userId);
    const attempts = state.attempts + 1;
    const lockedUntil = attempts >= MAX_PIN_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : null;
    sessionStorage.setItem(`${LOCKOUT_KEY_PREFIX}${userId}`, JSON.stringify({ attempts, lockedUntil }));
    return {
      locked: !!lockedUntil,
      remainingSeconds: lockedUntil ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0,
    };
  } catch {
    return { locked: false, remainingSeconds: 0 };
  }
}

function clearPinAttempts(userId: string): void {
  try {
    sessionStorage.removeItem(`${LOCKOUT_KEY_PREFIX}${userId}`);
  } catch {
    // ignore
  }
}

export function checkPinLockout(userId: string): { locked: boolean; remainingSeconds: number } {
  const state = getLockoutState(userId);
  if (state.lockedUntil && state.lockedUntil > Date.now()) {
    return {
      locked: true,
      remainingSeconds: Math.ceil((state.lockedUntil - Date.now()) / 1000),
    };
  }
  return { locked: false, remainingSeconds: 0 };
}

// --- WEB CRYPTO API HELPERS (PBKDF2 + AES-GCM 256-bit & Salted SHA-256) ---

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const hasSubtleCrypto = typeof window !== "undefined" && !!window.crypto && !!window.crypto.subtle;

function computeFallbackTag(payload: string, pin: string, salt: string): string {
  let h1 = 0xdeadbeef ^ seedCharSum(pin, salt);
  let h2 = 0x41c6ce57 ^ seedCharSum(salt, pin);
  const combined = `${pin}:${salt}:${payload}:medizen-tag-v2`;
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

function seedCharSum(a: string, b: string): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s = (s * 31 + a.charCodeAt(i)) | 0;
  for (let i = 0; i < b.length; i++) s = (s * 31 + b.charCodeAt(i)) | 0;
  return s;
}

export async function hashPin(userId: string, pin: string): Promise<string> {
  const input = `medizen-pin-v2:${userId}:${pin}`;
  if (hasSubtleCrypto) {
    const enc = new TextEncoder();
    const digest = await window.crypto.subtle.digest("SHA-256", enc.encode(input));
    return bufferToHex(digest);
  }
  return computeFallbackTag(input, pin, userId);
}

export async function saveUserPinHash(userId: string, pin: string): Promise<void> {
  if (typeof window === "undefined" || !userId || !pin) return;
  const digest = await hashPin(userId, pin);
  localStorage.setItem(`${PIN_HASH_PREFIX}${userId}`, digest);
  // Remove any legacy plaintext PIN immediately
  localStorage.removeItem(`${LEGACY_PIN_PREFIX}${userId}`);
}

export function removeUserPinHash(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  localStorage.removeItem(`${PIN_HASH_PREFIX}${userId}`);
  localStorage.removeItem(`${LEGACY_PIN_PREFIX}${userId}`);
  clearPinAttempts(userId);
}

export function hasUserPinConfigured(userId: string | undefined): boolean {
  if (typeof window === "undefined" || !userId) return false;
  if (localStorage.getItem(`${PIN_HASH_PREFIX}${userId}`)) return true;
  const legacyPlain = localStorage.getItem(`${LEGACY_PIN_PREFIX}${userId}`);
  if (legacyPlain && /^\d{4}$/.test(legacyPlain)) {
    // Migrate legacy plaintext PIN asynchronously and remove plaintext
    void saveUserPinHash(userId, legacyPlain);
    return true;
  }
  return false;
}

export async function verifyUserPin(userId: string, enteredPin: string): Promise<boolean> {
  if (typeof window === "undefined" || !userId || !enteredPin) return false;

  const lockout = checkPinLockout(userId);
  if (lockout.locked) {
    return false;
  }

  // Migrate legacy plaintext PIN if present
  const legacyPlain = localStorage.getItem(`${LEGACY_PIN_PREFIX}${userId}`);
  if (legacyPlain) {
    await saveUserPinHash(userId, legacyPlain);
  }

  const storedHash = localStorage.getItem(`${PIN_HASH_PREFIX}${userId}`);
  if (!storedHash) return false;

  const candidateHash = await hashPin(userId, enteredPin);
  const candidateFallback = computeFallbackTag(`medizen-pin-v2:${userId}:${enteredPin}`, enteredPin, userId);

  if (storedHash === candidateHash || storedHash === candidateFallback) {
    clearPinAttempts(userId);
    return true;
  }

  recordFailedPinAttempt(userId);
  return false;
}

function fallbackEncrypt(data: object, pin: string): EncryptedVault {
  const json = JSON.stringify(data);
  const randomBytes = new Uint8Array(12);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < randomBytes.length; i++) randomBytes[i] = Math.floor(Math.random() * 256);
  }
  const salt = Array.from(randomBytes, (b) => b.toString(16).padStart(2, "0")).join("");
  let hash = 0;
  const seed = `${pin}:${salt}:femesalud-pin-vault`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  let cipher = "";
  for (let i = 0; i < json.length; i++) {
    const keyByte = (Math.abs(hash) + i * 31 + pin.charCodeAt(i % pin.length)) % 256;
    cipher += String.fromCharCode(json.charCodeAt(i) ^ keyByte);
  }
  const tag = computeFallbackTag(cipher, pin, salt);
  return {
    ciphertext: btoa(cipher),
    iv: btoa(` fb2:${tag}`),
    salt: btoa(salt),
  };
}

function fallbackDecrypt(vault: EncryptedVault, pin: string): any {
  let decodedIv = "";
  try {
    decodedIv = atob(vault.iv);
  } catch {
    throw new Error("Clave de seguridad incorrecta");
  }

  const cipher = atob(vault.ciphertext);
  const salt = atob(vault.salt);

  if (decodedIv.startsWith(" fb2:")) {
    const expectedTag = decodedIv.slice(5);
    const actualTag = computeFallbackTag(cipher, pin, salt);
    if (expectedTag !== actualTag) {
      throw new Error("Clave de seguridad incorrecta");
    }
  } else if (decodedIv !== `fb-${pin}`) {
    throw new Error("Clave de seguridad incorrecta");
  }

  let hash = 0;
  const seed = `${pin}:${salt}:femesalud-pin-vault`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  let json = "";
  for (let i = 0; i < cipher.length; i++) {
    const keyByte = (Math.abs(hash) + i * 31 + pin.charCodeAt(i % pin.length)) % 256;
    json += String.fromCharCode(cipher.charCodeAt(i) ^ keyByte);
  }
  return JSON.parse(json);
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(`femesalud-pin-${pin}`),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(data: object, pin: string): Promise<EncryptedVault> {
  if (!hasSubtleCrypto) {
    return fallbackEncrypt(data, pin);
  }
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pin, salt);

    const enc = new TextEncoder();
    const encodedData = enc.encode(JSON.stringify(data));

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encodedData
    );

    return {
      ciphertext: bufferToBase64(cipherBuffer),
      iv: bufferToBase64(iv),
      salt: bufferToBase64(salt),
    };
  } catch {
    return fallbackEncrypt(data, pin);
  }
}

async function decryptData(vault: EncryptedVault, pin: string): Promise<any> {
  if (!hasSubtleCrypto || (vault.iv && vault.iv.startsWith("ZmIt"))) {
    return fallbackDecrypt(vault, pin);
  }
  try {
    const salt = new Uint8Array(base64ToBuffer(vault.salt));
    const iv = new Uint8Array(base64ToBuffer(vault.iv));
    const ciphertext = base64ToBuffer(vault.ciphertext);

    const key = await deriveKey(pin, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decryptedBuffer));
  } catch (e) {
    try {
      return fallbackDecrypt(vault, pin);
    } catch {
      throw e;
    }
  }
}

// --- VAULT STORAGE MANAGEMENT ---

function getStoredVault(): Record<string, StoredAccountData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredVault(data: Record<string, StoredAccountData>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving quick access vault", e);
  }
}

/**
 * Saves or updates a user account in the quick access vault.
 * The password is encrypted with the 4-digit PIN.
 */
export async function saveQuickAccessAccount(params: {
  userId: string;
  email: string;
  fullName: string;
  role?: string;
  avatarUrl?: string | null;
  password?: string;
  pin: string;
}): Promise<void> {
  const { userId, email, fullName, role, avatarUrl, password, pin } = params;

  if (!pin || pin.length !== 4) return;

  const vault = getStoredVault();
  let existingPassword = password;

  // If password is not provided, try to recover from existing vault entry if PIN matches
  if (!existingPassword && vault[userId]) {
    try {
      const decrypted = await decryptData(vault[userId].vault, pin);
      existingPassword = decrypted.password;
    } catch {
      // PIN changed without old password
    }
  }

  if (!existingPassword) {
    // If we still don't have password, we can't create an autologin vault
    return;
  }

  const encryptedVault = await encryptData(
    { email, password: existingPassword, userId },
    pin
  );

  const profile: QuickAccessProfile = {
    userId,
    email,
    fullName: fullName || email.split("@")[0],
    role: role || "Usuario",
    avatarUrl: avatarUrl || null,
    lastLogin: new Date().toISOString(),
    hasPin: true,
  };

  vault[userId] = {
    profile,
    vault: encryptedVault,
  };

  setStoredVault(vault);
  localStorage.setItem(LAST_ACCOUNT_KEY, userId);
  await saveUserPinHash(userId, pin);
}

/**
 * Returns all saved accounts for this device/browser
 */
export function getQuickAccessAccounts(): QuickAccessProfile[] {
  const vault = getStoredVault();
  return Object.values(vault).map((v) => v.profile);
}

/**
 * Returns the most recently used quick access account
 */
export function getLastQuickAccessAccount(): QuickAccessProfile | null {
  const vault = getStoredVault();
  const lastId = localStorage.getItem(LAST_ACCOUNT_KEY);
  if (lastId && vault[lastId]) {
    return vault[lastId].profile;
  }
  const accounts = Object.values(vault);
  if (accounts.length > 0) {
    // Sort by lastLogin desc
    accounts.sort((a, b) => new Date(b.profile.lastLogin).getTime() - new Date(a.profile.lastLogin).getTime());
    return accounts[0].profile;
  }
  return null;
}

/**
 * Checks if there is at least one quick access account saved
 */
export function hasQuickAccessAccounts(): boolean {
  const vault = getStoredVault();
  return Object.keys(vault).length > 0;
}

/**
 * Removes an account from the device's quick access vault
 */
export function removeQuickAccessAccount(userId: string): void {
  const vault = getStoredVault();
  delete vault[userId];
  setStoredVault(vault);

  const lastId = localStorage.getItem(LAST_ACCOUNT_KEY);
  if (lastId === userId) {
    localStorage.removeItem(LAST_ACCOUNT_KEY);
  }
}

/**
 * Unlocks the account with the 4-digit PIN and signs into Supabase Auth.
 */
export async function unlockQuickAccessAccount(
  userId: string,
  pin: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  const lockout = checkPinLockout(userId);
  if (lockout.locked) {
    return {
      success: false,
      error: `Demasiados intentos fallidos. Espera ${lockout.remainingSeconds}s o ingresa con contraseña.`,
    };
  }

  const vault = getStoredVault();
  const entry = vault[userId];

  if (!entry) {
    return { success: false, error: "No se encontró el registro de esta cuenta en este equipo." };
  }

  try {
    const credentials = await decryptData(entry.vault, pin);

    if (!credentials || !credentials.email || !credentials.password) {
      return { success: false, error: "Credenciales corruptas en este equipo." };
    }

    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return {
          success: false,
          error: "La contraseña de la cuenta ha cambiado. Por favor inicia sesión con correo y contraseña.",
        };
      }
      return { success: false, error: error.message };
    }

    clearPinAttempts(userId);
    await saveUserPinHash(userId, pin);

    // Update lastLogin timestamp
    entry.profile.lastLogin = new Date().toISOString();
    vault[userId] = entry;
    setStoredVault(vault);
    localStorage.setItem(LAST_ACCOUNT_KEY, userId);

    return { success: true, user: data.user };
  } catch (err: any) {
    const status = recordFailedPinAttempt(userId);
    if (status.locked) {
      return {
        success: false,
        error: `Demasiados intentos fallidos. Bloqueado temporalmente por ${status.remainingSeconds}s.`,
      };
    }
    return { success: false, error: "Clave de seguridad incorrecta. Verifica los 4 dígitos." };
  }
}
