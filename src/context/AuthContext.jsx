"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  clearToken,
  getToken,
  setToken,
  UNAUTHORIZED_EVENT,
} from "@/lib/api";

const AuthContext = createContext(null);

/**
 * Single source of truth for the current user.
 *
 * - Token lives in localStorage (set by login/register, sent as Bearer by api.js).
 * - On mount the session is hydrated from GET /api/auth/me.
 * - A 401 anywhere in the app clears the session via the `auth:unauthorized`
 *   event dispatched by the API client.
 * - Roles come from the backend user object: CUSTOMER | RIDER | ADMIN.
 *
 * Public registration always creates CUSTOMER accounts (backend rule);
 * rider accounts come from the rider-application + admin-approval workflow.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!getToken()) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const data = await api.get("/auth/me");
        if (!cancelled) setUser(data.user);
      } catch {
        // 401 already cleared the token and fired the event; anything else
        // (e.g. offline) keeps us signed out until the next attempt.
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const onUnauthorized = () => setUser(null);
    hydrate();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      cancelled = true;
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    // Backend ignores any `role` field — the account is always a CUSTOMER.
    const data = await api.post("/auth/register", payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await api.get("/auth/me");
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
      /** hasRole("ADMIN") or hasRole("CUSTOMER", "RIDER") */
      hasRole: (...roles) =>
        Boolean(user) && roles.flat().includes(user.role),
    }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
