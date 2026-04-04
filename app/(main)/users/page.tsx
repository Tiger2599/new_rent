'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface SubUser {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  isActive: boolean;
  permissions?: Record<string, boolean>;
}

export default function UsersPage() {
  const [items, setItems] = useState<SubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<'manager' | 'accountant' | 'viewer'>('viewer');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ items: SubUser[] }>('/users')
      .then((r) => setItems(r.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, mobile: mobile.trim() || undefined, role }),
      });
      setName('');
      setEmail('');
      setPassword('');
      setMobile('');
      setShowForm(false);
      const res = await api<{ items: SubUser[] }>('/users');
      setItems(res.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
    setSubmitLoading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      if (current) {
        await api(`/users/${id}`, { method: 'DELETE' });
      } else {
        await api(`/users/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: true }) });
      }
      setItems((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: !current } : u)));
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">Users</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-pill-primary"
        >
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-soft p-6 space-y-4 max-w-md">
          <h2 className="text-lg font-semibold text-ink">Create Sub-User</h2>
          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-ink placeholder-ink-muted focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-ink placeholder-ink-muted focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-ink placeholder-ink-muted focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Mobile</label>
            <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-ink placeholder-ink-muted focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'manager' | 'accountant' | 'viewer')} className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-ink focus:ring-2 focus:ring-primary focus:border-primary">
              <option value="manager">Manager</option>
              <option value="accountant">Accountant</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button type="submit" disabled={submitLoading} className="min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-700 disabled:opacity-50 shadow-soft">
            {submitLoading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="card-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-slate-50 text-ink-muted text-xs font-semibold uppercase tracking-wide">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Name</th>
                  <th className="px-4 sm:px-6 py-3">Email</th>
                  <th className="px-4 sm:px-6 py-3">Role</th>
                  <th className="px-4 sm:px-6 py-3">Status</th>
                  <th className="px-4 sm:px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50">
                    <td className="px-4 sm:px-6 py-3 text-ink font-medium">{u.name}</td>
                    <td className="px-4 sm:px-6 py-3 text-ink">{u.email}</td>
                    <td className="px-4 sm:px-6 py-3 text-ink capitalize">{u.role}</td>
                    <td className="px-4 sm:px-6 py-3">{u.isActive ? <span className="text-secondary font-medium">Active</span> : <span className="text-ink-muted">Inactive</span>}</td>
                    <td className="px-4 sm:px-6 py-3">
                      <button
                        onClick={() => toggleActive(u._id, u.isActive)}
                        className={`text-sm font-medium ${u.isActive ? 'text-red-600 hover:underline' : 'text-secondary hover:underline'}`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <p className="p-6 text-ink-muted text-center">No sub-users. Only owners see this page. Create sub-users to give access to managers, accountants, or viewers.</p>
          )}
        </div>
      )}
    </div>
  );
}
