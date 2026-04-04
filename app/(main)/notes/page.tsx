'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';

interface Note {
  _id: string;
  title: string;
  description?: string;
  isPinned: boolean;
}

export default function NotesPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(editId);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    api<{ items: Note[] }>('/notes')
      .then((r) => setItems(r.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (editingId && items.length > 0) {
      const n = items.find((x) => x._id === editingId);
      if (n) {
        setTitle(n.title);
        setDescription(n.description ?? '');
        setIsPinned(n.isPinned);
      }
    } else if (!editingId) {
      setTitle('');
      setDescription('');
      setIsPinned(false);
    }
  }, [editingId, items]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (editingId) {
        await api(`/notes/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({ title: title.trim(), description: description.trim(), isPinned }),
        });
        setItems((prev) =>
          prev.map((n) => (n._id === editingId ? { ...n, title: title.trim(), description: description.trim(), isPinned } : n))
        );
        setEditingId(null);
      } else {
        const created = await api<Note>('/notes', {
          method: 'POST',
          body: JSON.stringify({ title: title.trim(), description: description.trim(), isPinned }),
        });
        setItems((prev) => [created, ...prev]);
      }
      setTitle('');
      setDescription('');
      setIsPinned(false);
    } catch {}
    setSubmitLoading(false);
  }

  async function togglePin(id: string, current: boolean) {
    try {
      await api(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify({ isPinned: !current }) });
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isPinned: !current } : n)));
    } catch {}
  }

  async function deleteNote(id: string) {
    if (!confirm('Delete this note?')) return;
    try {
      await api(`/notes/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((n) => n._id !== id));
      if (editingId === id) setEditingId(null);
    } catch {}
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Notes / Maintenance</h1>

      <form onSubmit={handleSubmit} className="card-soft p-6 space-y-4 max-w-xl">
        <h2 className="text-lg font-semibold text-ink">{editingId ? 'Edit Note' : 'New Note'}</h2>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-ink placeholder-ink-muted focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-ink placeholder-ink-muted focus:ring-2 focus:ring-primary focus:border-primary" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
          <span className="text-sm text-ink">Pin to Dashboard</span>
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={submitLoading} className="min-h-[44px] px-4 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-700 disabled:opacity-50 shadow-soft">
            {submitLoading ? 'Saving...' : editingId ? 'Update' : 'Save'}
          </button>
          {editingId && (
            <button type="button" onClick={() => setEditingId(null)} className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-ink hover:bg-slate-50">
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((n) => (
            <div key={n._id} className="card-soft p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-ink">{n.title}</h3>
                  {n.description && <p className="text-sm text-ink-muted mt-1">{n.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => togglePin(n._id, n.isPinned)} className="p-2 rounded-lg text-ink-muted hover:text-amber-600 hover:bg-amber-50" title={n.isPinned ? 'Unpin' : 'Pin'}>
                    {n.isPinned ? '📌' : '📍'}
                  </button>
                  <button onClick={() => setEditingId(n._id)} className="p-2 rounded-lg text-ink-muted hover:text-primary hover:bg-primary-50">Edit</button>
                  <button onClick={() => deleteNote(n._id)} className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
