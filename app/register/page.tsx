'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password, mobile: mobile || undefined });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md card-soft p-6 sm:p-8 shadow-soft-lg">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-12 h-12 rounded-2xl bg-gradient-blue flex items-center justify-center text-primary-600 text-xl font-bold shadow-soft">T</span>
          <span className="text-xl font-bold text-ink">Tenant Manager</span>
        </div>
        <h1 className="text-2xl font-bold text-ink mb-6">Create account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-input bg-red-50/80 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-soft min-h-[48px]" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-soft min-h-[48px]" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Mobile</label>
            <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className="input-soft min-h-[48px]" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="input-soft min-h-[48px]" placeholder="Min 6 characters" />
          </div>
          <button type="submit" disabled={loading} className="w-full min-h-[48px] btn-pill-primary">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-ink-muted text-sm">
          Already have an account? <Link href="/login" className="text-primary-500 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
