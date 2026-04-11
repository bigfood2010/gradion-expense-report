import type { AuthSessionDto, AuthUserDto } from '@gradion/shared/auth';

const AUTH_SESSION_STORAGE_KEY = 'gradion.auth.session';

/** Stored session contains only user identity — no tokens. The JWT travels only via httpOnly cookie. */
interface StoredSession {
  user: AuthUserDto;
}

export function readStoredAuthSession(): AuthSessionDto | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
  }
}

export function writeStoredAuthSession(session: AuthSessionDto | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }

  const stored: StoredSession = { user: session.user };
  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(stored));
}

export function clearStoredAuthSession(): void {
  writeStoredAuthSession(null);
}
