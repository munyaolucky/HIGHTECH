import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  fetchCurrentUser,
  logoutAllRequest,
  logoutRequest,
} from './auth-api';
import type { AuthContextValue, AuthState, PortalUser } from './auth-types';

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    sessionExpired: false,
    error: null,
  });

  const hadAuthenticatedSessionRef = useRef(false);

  const refreshSession = useCallback(async (): Promise<PortalUser | null> => {
    setState((prev) => ({
      ...prev,
      isLoading: prev.user === null,
      error: null,
    }));

    try {
      const { user, unauthorized } = await fetchCurrentUser();
      if (user) {
        hadAuthenticatedSessionRef.current = true;
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          sessionExpired: false,
          error: null,
        });
        return user;
      }

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        sessionExpired: Boolean(unauthorized && hadAuthenticatedSessionRef.current),
        error: null,
      });
      return null;
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Unable to verify session status right now.',
      }));
      return null;
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const setAuthenticatedUser = useCallback((user: PortalUser | null) => {
    hadAuthenticatedSessionRef.current = Boolean(user);
    setState({
      user,
      isAuthenticated: Boolean(user),
      isLoading: false,
      sessionExpired: false,
      error: null,
    });
  }, []);

  const signOut = useCallback(async () => {
    hadAuthenticatedSessionRef.current = false;
    await logoutRequest();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionExpired: false,
      error: null,
    });
  }, []);

  const signOutAll = useCallback(async () => {
    hadAuthenticatedSessionRef.current = false;
    await logoutAllRequest();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionExpired: false,
      error: null,
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      refreshSession,
      setAuthenticatedUser,
      signOut,
      signOutAll,
    }),
    [state, refreshSession, setAuthenticatedUser, signOut, signOutAll]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
