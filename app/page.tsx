'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './providers';

export default function Home() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      window.location.href = '/dashboard';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }
  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 px-4">
      <h1 className="text-4xl font-bold text-white mb-2">Tenant Manager</h1>
      <p className="text-slate-400 mb-8">Manage properties, tenants, and rent collection</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="px-6 py-3 rounded-lg border border-slate-600 text-slate-200 font-medium hover:bg-slate-800 transition"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
