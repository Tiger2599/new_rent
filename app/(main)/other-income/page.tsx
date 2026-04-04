'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Spinner } from '@/components/Spinner';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Row {
  _id: string;
  name: string;
  amount: number;
  date: string;
  note?: string;
}

export default function OtherIncomePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    api<{ items: Row[]; total: number }>('/other-income', { params: { month: String(month), year: String(year) } })
      .then((r) => {
        setItems(r.items ?? []);
        setTotal(r.total ?? 0);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    setSaving(true);
    try {
      await api('/other-income', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          amount: Number(amount),
          date,
          note: note.trim() || undefined,
        }),
      });
      setModalOpen(false);
      setName('');
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().slice(0, 10));
      fetchData();
    } catch {
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this entry?')) return;
    setDeletingId(id);
    try {
      await api(`/other-income/${id}`, { method: 'DELETE' });
      fetchData();
    } catch {
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Other Income</h1>
          <p className="text-sm text-ink-muted mt-1">Parking, shop rent, miscellaneous receipts</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-ink">Month</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input-soft min-h-[44px] py-2 w-auto min-w-[120px]">
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-ink">Year</label>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-soft min-h-[44px] py-2 w-auto min-w-[100px]">
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={() => setModalOpen(true)} className="btn-pill-primary text-sm min-h-[44px] px-4">
            + Add entry
          </button>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !saving && setModalOpen(false)}>
          <div className="card-soft max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-ink mb-4">Add other income</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Description *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input-soft min-h-[44px] w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Amount (₹) *</label>
                <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="input-soft min-h-[44px] w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Date *</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-soft min-h-[44px] w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Note</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} className="input-soft min-h-[44px] w-full" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-pill-primary flex-1 min-h-[44px] inline-flex items-center justify-center gap-2">
                  {saving && <Spinner size="sm" />}
                  Save
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-pill bg-slate-100 min-h-[44px] px-4">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card-gradient-mint p-5 shadow-card max-w-md">
        <p className="text-sm font-medium text-ink/80">Total (selected month)</p>
        <p className="text-2xl font-bold text-ink mt-1">₹{total.toLocaleString('en-IN')}</p>
      </div>

      {error && <div className="card-soft bg-red-50/80 text-red-700 p-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="card-soft overflow-hidden">
          {items.length === 0 ? (
            <p className="p-8 text-center text-ink-muted">No other income for this month. Use &quot;Add entry&quot; or add from the Dashboard.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((row) => (
                <div key={row._id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/50">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{row.name}</p>
                    <p className="text-xs text-ink-muted">
                      {new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {row.note ? ` · ${row.note}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-emerald-700">₹{row.amount?.toLocaleString('en-IN')}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(row._id)}
                      disabled={deletingId === row._id}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === row._id ? '…' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Link href="/dashboard" className="text-sm text-ink-muted hover:text-ink font-medium">← Back to Dashboard</Link>
    </div>
  );
}
