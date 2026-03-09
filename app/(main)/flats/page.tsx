'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface Flat {
  _id: string;
  flatNumber: string;
  isActive?: boolean;
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
      <h1 className="text-2xl font-bold text-white">Flats</h1>

      <div className="flex gap-4 items-center">
        <label className="text-sm text-slate-400">Property</label>
        <select
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
        >
          <option value="">All</option>
          {properties.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-800 text-slate-300 text-sm">
                <tr>
                  <th className="px-4 py-3 font-medium">Flat Number</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {items.map((f) => {
                  const active = f.isActive !== false;
                  return (
                    <tr key={f._id} className="text-slate-300">
                      <td className="px-4 py-3">{f.flatNumber}</td>
                      <td className="px-4 py-3">{(f.propertyId as { name: string })?.name ?? '-'}</td>
                      <td className="px-4 py-3">
                        {active ? <span className="text-green-400">Active</span> : <span className="text-slate-500">Inactive</span>}
                        <button
                          onClick={() => toggleFlatStatus(f._id, active)}
                          className={`ml-2 px-2 py-1 rounded text-xs font-medium ${active ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                        >
                          {active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/flats/${f._id}`} className="text-primary-400 hover:underline mr-3">View</Link>
                        <Link href={`/flats/${f._id}/edit`} className="text-slate-400 hover:underline">Edit</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <p className="text-sm text-slate-500">Page {page} of {totalPages} ({total} total)</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 rounded bg-slate-700 text-sm disabled:opacity-50">Previous</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 rounded bg-slate-700 text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
