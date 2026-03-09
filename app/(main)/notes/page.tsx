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
      <h1 className="text-2xl font-bold text-white">Notes</h1>

      <form onSubmit={handleSubmit} className="rounded-xl bg-slate-900 border border-slate-700 p-6 space-y-4 max-w-xl">
        <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit Note' : 'New Note'}</h2>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="rounded" />
          <span className="text-sm text-slate-300">Pin to Dashboard</span>
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={submitLoading} className="px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50">
            {submitLoading ? 'Saving...' : editingId ? 'Update' : 'Save'}
          </button>
          {editingId && (
            <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300">
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((n) => (
            <div key={n._id} className="rounded-xl bg-slate-900 border border-slate-700 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-white">{n.title}</h3>
                  {n.description && <p className="text-sm text-slate-500 mt-1">{n.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => togglePin(n._id, n.isPinned)} className="text-slate-400 hover:text-amber-400" title={n.isPinned ? 'Unpin' : 'Pin'}>
                    {n.isPinned ? '📌' : '📍'}
                  </button>
                  <button onClick={() => setEditingId(n._id)} className="text-slate-400 hover:text-white">Edit</button>
                  <button onClick={() => deleteNote(n._id)} className="text-slate-400 hover:text-red-400">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
