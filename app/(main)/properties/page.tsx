'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface Property {
  _id: string;
  name: string;
  propertyNumber: string;
  address: string;
  totalFlats?: number;
  totalTenants?: number;
}

export default function PropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    api<{ items: Property[]; total: number }>('/properties', { params: { page: String(page), limit: String(limit) } })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Properties</h1>
        <Link
          href="/properties/new"
          className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600"
        >
          Add Property
        </Link>
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
                  <th className="px-4 py-3 font-medium">Property Name</th>
                  <th className="px-4 py-3 font-medium">Property Number</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Flats</th>
                  <th className="px-4 py-3 font-medium">Tenants</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {items.map((p) => (
                  <tr key={p._id} className="text-slate-300">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">{p.propertyNumber}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{p.address}</td>
                    <td className="px-4 py-3">{p.totalFlats ?? 0}</td>
                    <td className="px-4 py-3">{p.totalTenants ?? 0}</td>
                    <td className="px-4 py-3">
                      <Link href={`/properties/${p._id}`} className="text-primary-400 hover:underline mr-3">
                        View
                      </Link>
                      <Link href={`/properties/${p._id}/edit`} className="text-slate-400 hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded bg-slate-700 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 rounded bg-slate-700 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
