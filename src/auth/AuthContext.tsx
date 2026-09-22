import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AuthUser,
  getToken,
  setToken,
  login as apiLogin,
  register as apiRegister,
  me as apiMe,
} from '../api/authApi';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  register: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const res = await apiMe();
    if (res.success && res.data?.user) {
      setUser(res.data.user);
    } else {
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    if (res.success && res.data?.token && res.data?.user) {
      setToken(res.data.token);
      setUser(res.data.user);
      return { ok: true };
    }
    return { ok: false, message: res.message || 'Login failed' };
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    const res = await apiRegister(email, password, fullName);
    if (res.success && res.data?.token && res.data?.user) {
      setToken(res.data.token);
      setUser(res.data.user);
      return { ok: true };
    }
    return { ok: false, message: res.message || 'Register failed' };
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
