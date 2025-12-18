export interface UserData {
  userId: number;
  name: string;
  phoneNumber: string;
}

export interface StoredUserSession extends UserData {
  expiresAt: number;
}

const USER_SESSION_KEY = "userData";

// Default: 2 hours. Adjust as desired.
export const DEFAULT_AUTH_SESSION_TTL_MS = 2 * 60 * 60 * 1000;

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Reads current user session from localStorage.
 * - Returns null if missing/invalid/expired.
 * - If expired, clears stored auth state.
 *
 * Backward compatibility:
 * - If `userData` exists but has no `expiresAt`, treat as expired (security-first).
 */
export function getUserSession(): StoredUserSession | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_SESSION_KEY);
  if (!raw) return null;

  const parsed = safeJsonParse<Partial<StoredUserSession>>(raw);
  if (!parsed) {
    clearAuthState();
    return null;
  }

  const expiresAt = parsed?.expiresAt;

  if (typeof expiresAt !== "number") {
    clearAuthState();
    return null;
  }

  if (Date.now() > expiresAt) {
    clearAuthState();
    return null;
  }

  if (
    typeof parsed.userId !== "number" ||
    typeof parsed.name !== "string" ||
    typeof parsed.phoneNumber !== "string"
  ) {
    clearAuthState();
    return null;
  }

  return parsed as StoredUserSession;
}

export function setUserSession(user: UserData, ttlMs: number = DEFAULT_AUTH_SESSION_TTL_MS): void {
  if (typeof window === "undefined") return;

  const session: StoredUserSession = {
    ...user,
    expiresAt: Date.now() + ttlMs,
  };

  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthState(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("userData");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}



