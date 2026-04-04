'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-8">
      <div className="w-full max-w-md card-soft p-6 sm:p-8 shadow-soft-lg">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-12 h-12 rounded-2xl bg-gradient-blue flex items-center justify-center text-primary-600 text-xl font-bold shadow-soft">T</span>
          <span className="text-xl font-bold text-ink">Tenant Manager</span>
        </div>
        <h1 className="text-2xl font-bold text-ink mb-6">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-input bg-red-50/80 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-soft min-h-[48px]" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-soft min-h-[48px]" />
          </div>
          <button type="submit" disabled={loading} className="w-full min-h-[48px] btn-pill-primary">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-ink-muted text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary-500 font-medium hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
