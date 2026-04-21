import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  AuthSessionDto,
  AuthUserDto,
  LoginRequestDto,
  SignupRequestDto,
} from '@gradion/shared/auth';
import { apiClient } from '@client/lib/api-client';
import {
  clearStoredAuthSession,
  readStoredAuthSession,
  writeStoredAuthSession,
} from '@client/lib/auth-storage';

export interface AuthContextValue {
  readonly session: AuthSessionDto | null;
  readonly user: AuthUserDto | null;
  readonly isAuthenticated: boolean;
  readonly login: (payload: LoginRequestDto) => Promise<AuthSessionDto>;
  readonly signup: (payload: SignupRequestDto) => Promise<AuthSessionDto>;
  readonly logout: () => void;
  readonly setSession: (session: AuthSessionDto | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSessionState] = useState<AuthSessionDto | null>(() => readStoredAuthSession());

  useEffect(() => {
    function handleStorage(event: StorageEvent): void {
      if (event.key === 'gradion.auth.session' || event.key === null) {
        setSessionState(readStoredAuthSession());
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setSession = useCallback((nextSession: AuthSessionDto | null) => {
    setSessionState(nextSession);
    writeStoredAuthSession(nextSession);
  }, []);

  const login = useCallback(
    async (payload: LoginRequestDto) => {
      const nextSession = await apiClient.auth.login(payload);
      setSession(nextSession);
      return nextSession;
    },
    [setSession],
  );

  const signup = useCallback(
    async (payload: SignupRequestDto) => {
      const nextSession = await apiClient.auth.signup(payload);
      setSession(nextSession);
      return nextSession;
    },
    [setSession],
  );

  const logout = useCallback(() => {
    void apiClient.auth.logout().catch(() => {
      // ignore server errors on logout — clear local state regardless
    });
    clearStoredAuthSession();
    setSessionState(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.user),
      login,
      signup,
      logout,
      setSession,
    }),
    [login, logout, session, setSession, signup],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
