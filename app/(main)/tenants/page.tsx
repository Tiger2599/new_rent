'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';

interface Tenant {
  _id: string;
  name: string;
  mobile: string;
  rentAmount: number;
  depositAmount: number;
  joinDate: string;
  isActive: boolean;
  propertyId: { name: string };
  flatId: { flatNumber: string };
}

export default function TenantsPage() {
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get('active'); // 'true' | 'false' | null (all)
  const [items, setItems] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (activeFilter) params.active = activeFilter;
    api<{ items: Tenant[]; total: number }>('/tenants', { params })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [page, activeFilter]);

  async function toggleTenantStatus(id: string, current: boolean) {
    try {
      await api(`/tenants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !current }),
      });
      setItems((prev) => prev.map((t) => (t._id === id ? { ...t, isActive: !current } : t)));
    } catch {}
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tenants</h1>
        <div className="flex gap-2">
          <Link href="/tenants" className={`px-3 py-2 rounded-lg border text-sm ${activeFilter === null ? 'border-primary-500 text-primary-400' : 'border-slate-600 text-slate-300'}`}>
            All
          </Link>
          <Link href="/tenants?active=true" className={`px-3 py-2 rounded-lg border text-sm ${activeFilter === 'true' ? 'border-primary-500 text-primary-400' : 'border-slate-600 text-slate-300'}`}>
            Active
          </Link>
          <Link href="/tenants?active=false" className={`px-3 py-2 rounded-lg border text-sm ${activeFilter === 'false' ? 'border-primary-500 text-primary-400' : 'border-slate-600 text-slate-300'}`}>
            Previous
          </Link>
          <Link href="/tenants/new" className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600">
            Add Tenant
          </Link>
        </div>
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
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Flat</th>
                  <th className="px-4 py-3 font-medium">Rent</th>
                  <th className="px-4 py-3 font-medium">Deposit</th>
                  <th className="px-4 py-3 font-medium">Join Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {items.map((t) => (
                  <tr key={t._id} className="text-slate-300">
                    <td className="px-4 py-3">{t.name}</td>
                    <td className="px-4 py-3">{t.mobile}</td>
                    <td className="px-4 py-3">{(t.propertyId as { name: string })?.name}</td>
                    <td className="px-4 py-3">{(t.flatId as { flatNumber: string })?.flatNumber}</td>
                    <td className="px-4 py-3">₹{t.rentAmount?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">₹{t.depositAmount?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">{t.joinDate ? new Date(t.joinDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="px-4 py-3">
                      {t.isActive ? <span className="text-green-400">Active</span> : <span className="text-slate-500">Left</span>}
                      <button
                        onClick={() => toggleTenantStatus(t._id, t.isActive)}
                        className={`ml-2 px-2 py-1 rounded text-xs font-medium ${t.isActive ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                      >
                        {t.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/tenants/${t._id}`} className="text-primary-400 hover:underline mr-3">View</Link>
                      <Link href={`/tenants/${t._id}/edit`} className="text-slate-400 hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))}
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
