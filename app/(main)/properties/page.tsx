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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">Properties</h1>
        <Link href="/properties/new" className="btn-pill-primary">
          Add Property
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="card-soft overflow-hidden">
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-ink-muted mb-2">No properties yet.</p>
                <Link href="/properties/new" className="btn-pill-primary inline-flex">Add your first property</Link>
              </div>
            ) : items.map((p) => (
              <div key={p._id} className="rounded-input bg-slate-50/60 p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{p.name}</p>
                  <p className="text-sm text-ink-muted">{p.propertyNumber} · {p.address && (p.address.length > 40 ? p.address.slice(0, 40) + '…' : p.address)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-ink-muted">{p.totalFlats ?? 0} flats · {p.totalTenants ?? 0} tenants</span>
                  <Link href={`/properties/${p._id}`} className="text-sm font-medium text-primary-500 hover:underline">View</Link>
                  <Link href={`/properties/${p._id}/edit`} className="text-sm text-ink-muted hover:text-ink">Edit</Link>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <p className="text-sm text-ink-muted">Page {page} of {totalPages} ({total} total)</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-pill bg-slate-50 text-ink hover:bg-slate-100 disabled:opacity-50 text-sm">Previous</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-pill bg-slate-50 text-ink hover:bg-slate-100 disabled:opacity-50 text-sm">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
