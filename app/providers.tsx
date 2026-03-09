'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, clearToken } from '@/lib/api-client';

export interface UserInfo {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  ownerId?: string;
  permissions?: Record<string, boolean>;
}

const AuthContext = createContext<{
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; mobile?: string }) => Promise<void>;
  logout: () => void;
  refetch: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api<{ user: UserInfo }>('/auth/me');
      setUser(data.user);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api<{ token: string; user: UserInfo }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (data: { name: string; email: string; password: string; mobile?: string }) => {
    await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await login(data.email, data.password);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
