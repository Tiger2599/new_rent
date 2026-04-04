'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface Flat {
  _id: string;
  flatNumber: string;
  isActive?: boolean;
  hasActiveTenant?: boolean;
  propertyId: { _id: string; name: string; propertyNumber?: string };
}

export default function FlatsPage() {
  const [items, setItems] = useState<Flat[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [propertyId, setPropertyId] = useState('');
  const [properties, setProperties] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    api<{ items: { _id: string; name: string }[] }>('/properties', { params: { limit: '100' } })
      .then((r) => setProperties(r.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (propertyId) params.propertyId = propertyId;
    api<{ items: Flat[]; total: number }>('/flats', { params })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [page, propertyId]);

  const totalPages = Math.ceil(total / limit) || 1;

  async function toggleFlatStatus(flatId: string, current: boolean) {
    try {
      await api(`/flats/${flatId}`, { method: 'PATCH', body: JSON.stringify({ isActive: !current }) });
      setItems((prev) => prev.map((f) => (f._id === flatId ? { ...f, isActive: !current } : f)));
    } catch {}
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Flats</h1>

      <div className="flex flex-wrap gap-4 items-center">
        <label className="text-sm font-medium text-ink">Property</label>
        <select
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="min-h-[44px] sm:min-h-0 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-ink focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">All</option>
          {properties.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

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
                  <th className="px-4 sm:px-6 py-3">Flat Number</th>
                  <th className="px-4 sm:px-6 py-3">Property</th>
                  <th className="px-4 sm:px-6 py-3">Status</th>
                  <th className="px-4 sm:px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((f) => {
                  const active = f.isActive !== false;
                  const occupied = f.hasActiveTenant === true;
                  const displayVacant = !occupied;
                  return (
                    <tr key={f._id} className="hover:bg-slate-50/50">
                      <td className="px-4 sm:px-6 py-3 text-ink font-medium">{f.flatNumber}</td>
                      <td className="px-4 sm:px-6 py-3 text-ink">{(f.propertyId as { name: string })?.name ?? '-'}</td>
                      <td className="px-4 sm:px-6 py-3">
                        {displayVacant ? <span className="text-ink-muted">Vacant</span> : <span className="text-green-600 font-medium">Occupied</span>}
                        <button
                          onClick={() => toggleFlatStatus(f._id, active)}
                          className={`ml-2 min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-medium ${active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-secondary-50 text-secondary-700 hover:bg-secondary-100'}`}
                        >
                          {active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <Link href={`/flats/${f._id}`} className="text-primary font-medium hover:underline mr-3">View</Link>
                        <Link href={`/flats/${f._id}/edit`} className="text-ink-muted hover:text-ink">Edit</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-slate-100">
              <p className="text-sm text-ink-muted">Page {page} of {totalPages} ({total} total)</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl border border-slate-200 text-ink text-sm font-medium hover:bg-slate-50 disabled:opacity-50">Previous</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl border border-slate-200 text-ink text-sm font-medium hover:bg-slate-50 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
