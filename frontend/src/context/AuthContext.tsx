'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearPersistedCache, queryClientSingleton } from '@/providers/QueryProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
const AUTH_CACHE_KEY = 'zhi_auth_user';

type UserRole = 'super_admin' | 'school_admin' | 'parent' | 'student';

export type AuthUser = {
  id: string;
  email: string | null;
  role: UserRole;
  profileId: string;
  schoolId?: string | null;
  name: string;
};

type AuthResponse = {
  user?: AuthUser;
  error?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  registerParent: (payload: { name: string; email: string; password: string; phone?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCachedUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(AUTH_CACHE_KEY);
  } catch {}
}

async function api(path: string, options: RequestInit = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...options, headers });
  return res;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadCachedUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    setError(null);
    try {
      const res = await api('/api/auth/me');
      if (!res.ok) {
        saveCachedUser(null);
        setUser(null);
        return;
      }
      const data = (await res.json()) as AuthResponse & { plan_expired?: boolean };
      if (data.plan_expired) {
        saveCachedUser(null);
        setUser(null);
        document.cookie = 'zhi_user_role=; path=/; max-age=0';
        window.location.href = `${window.location.origin}/${window.location.pathname.split('/')[1] || 'en'}/login?expired=1`;
        return;
      }
      if (data.user) saveCachedUser(data.user);
      setUser(data.user ?? null);
    } catch {
      // Network error — keep cached user, don't force logout
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      const data = (await res.json()) as AuthResponse;
      if (!res.ok) { setError(data.error || 'Login failed'); return null; }
      if (!data.user) { setError('Login failed'); return null; }
      saveCachedUser(data.user);
      setUser(data.user);
      document.cookie = `zhi_user_role=${data.user.role}; path=/; max-age=${60 * 60 * 24 * 30}`;
      // Warm admin cache immediately after login
      if (data.user.role === 'super_admin' || data.user.role === 'school_admin') {
        Promise.all([
          import('@/core/services/adminApi'),
          import('@/core/constants/queryKeys'),
        ]).then(([{ adminApi }, { adminKeys }]) => {
          const qc = queryClientSingleton;
          qc.prefetchQuery({ queryKey: adminKeys.dashboard, queryFn: adminApi.dashboard, staleTime: 60000 });
          qc.prefetchQuery({ queryKey: adminKeys.paymentsStats, queryFn: adminApi.paymentsStats, staleTime: 60000 });
          qc.prefetchQuery({ queryKey: adminKeys.paymentsTab('approvals'), queryFn: adminApi.paymentsApprovals, staleTime: 60000 });
          qc.prefetchQuery({ queryKey: adminKeys.students, queryFn: adminApi.students, staleTime: 60000 });
          qc.prefetchQuery({ queryKey: adminKeys.schoolDirectory, queryFn: adminApi.schoolDirectory, staleTime: 60000 });
        }).catch(() => {});
      }
      return data.user;
    } catch { setError('Unable to reach auth server'); return null; }
    finally { setLoading(false); }
  };

  const registerParent = async ({ name, email, password, phone }: { name: string; email: string; password: string; phone?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, phone, role: 'parent' }) });
      const data = (await res.json()) as AuthResponse & { ok?: boolean };
      if (!res.ok) { setError(data.error || 'Registration failed'); return false; }
      return true;
    } catch { setError('Unable to reach auth server'); return false; }
    finally { setLoading(false); }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api('/api/auth/logout', { method: 'POST' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as AuthResponse;
        setError(data.error || 'Logout failed');
      }
    } catch { setError('Unable to reach auth server'); }
    finally {
      saveCachedUser(null);
      setUser(null);
      document.cookie = 'zhi_user_role=; path=/; max-age=0';
      clearPersistedCache();
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, login, registerParent, logout, refreshUser }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
