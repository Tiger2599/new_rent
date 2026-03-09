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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600"
        >
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-slate-900 border border-slate-700 p-6 space-y-4 max-w-md">
          <h2 className="text-lg font-semibold text-white">Create Sub-User</h2>
          {error && <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Password *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Mobile</label>
            <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'manager' | 'accountant' | 'viewer')} className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white">
              <option value="manager">Manager</option>
              <option value="accountant">Accountant</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button type="submit" disabled={submitLoading} className="px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50">
            {submitLoading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-800 text-slate-300 text-sm">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-slate-300">
              {items.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">{u.isActive ? <span className="text-green-400">Active</span> : <span className="text-slate-500">Inactive</span>}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u._id, u.isActive)}
                      className={`text-sm ${u.isActive ? 'text-red-400 hover:underline' : 'text-green-400 hover:underline'}`}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="p-6 text-slate-500 text-center">No sub-users. Only owners see this page. Create sub-users to give access to managers, accountants, or viewers.</p>
          )}
        </div>
      )}
    </div>
  );
}
