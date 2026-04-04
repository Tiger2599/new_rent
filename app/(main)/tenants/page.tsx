'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Spinner } from '@/components/Spinner';

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
  const router = useRouter();
  const activeFilter = searchParams.get('active');
  const [items, setItems] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const initialFetchDone = useRef(false);
  const limit = 20;

  useEffect(() => {
    if (activeFilter === null) {
      router.replace('/tenants?active=true');
    }
  }, [activeFilter, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

  useEffect(() => {
    if (activeFilter === null) return;
    let cancelled = false;
    const subtle = initialFetchDone.current;
    if (subtle) setRefreshing(true);
    else setLoading(true);

    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (activeFilter === 'true' || activeFilter === 'false') params.active = activeFilter;
    if (debouncedQ) params.q = debouncedQ;

    api<{ items: Tenant[]; total: number }>('/tenants', { params })
      .then((res) => {
        if (!cancelled) {
          setItems(res.items);
          setTotal(res.total);
          initialFetchDone.current = true;
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, activeFilter, debouncedQ]);

  async function toggleTenantStatus(tenantId: string, current: boolean) {
    setTogglingId(tenantId);
    try {
      await api(`/tenants/${tenantId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !current }),
      });
      router.refresh();
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (activeFilter === 'true' || activeFilter === 'false') params.active = activeFilter;
      if (debouncedQ) params.q = debouncedQ;
      const res = await api<{ items: Tenant[]; total: number }>('/tenants', { params });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      setPopupMessage(msg);
    } finally {
      setTogglingId(null);
    }
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {popupMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setPopupMessage(null)}>
          <div className="card-soft max-w-sm w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-ink font-medium mb-4">{popupMessage}</p>
            <button type="button" onClick={() => setPopupMessage(null)} className="btn-pill-primary w-full">
              OK
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">Tenants</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/tenants?active=all" className={`btn-pill text-sm ${activeFilter === 'all' ? 'bg-gradient-blue text-primary-700' : 'bg-slate-50 text-ink-muted hover:bg-slate-100'}`}>All</Link>
          <Link href="/tenants?active=true" className={`btn-pill text-sm ${activeFilter === 'true' ? 'bg-gradient-blue text-primary-700' : 'bg-slate-50 text-ink-muted hover:bg-slate-100'}`}>Active</Link>
          <Link href="/tenants?active=false" className={`btn-pill text-sm ${activeFilter === 'false' ? 'bg-gradient-blue text-primary-700' : 'bg-slate-50 text-ink-muted hover:bg-slate-100'}`}>Previous</Link>
          <Link href="/tenants/new" className="btn-pill-primary">
            Add Tenant
          </Link>
        </div>
      </div>

      <div className="relative">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or mobile…"
          className="input-soft min-h-[44px] w-full max-w-md pl-10"
          aria-label="Search tenants"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        {refreshing && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={`card-soft overflow-hidden transition-opacity ${refreshing ? 'opacity-80' : ''}`}>
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-ink-muted mb-2">{debouncedQ ? 'No tenants match your search.' : 'No tenants yet.'}</p>
                {!debouncedQ && <Link href="/tenants/new" className="btn-pill-primary inline-flex">Add your first tenant</Link>}
              </div>
            ) : items.map((t) => (
              <div key={t._id} className="rounded-input bg-slate-50/60 p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{t.name}</p>
                  <p className="text-sm text-ink-muted">{t.mobile} · {(t.propertyId as { name: string })?.name} / {(t.flatId as { flatNumber: string })?.flatNumber}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-ink font-medium">₹{t.rentAmount?.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-ink-muted">{t.joinDate ? new Date(t.joinDate).toLocaleDateString('en-IN') : '-'}</span>
                  {t.isActive ? <span className="text-xs font-medium text-emerald-600 bg-mint-light/80 px-2 py-1 rounded-pill">Active</span> : <span className="text-xs text-ink-muted">Left</span>}
                  <button
                    type="button"
                    onClick={() => toggleTenantStatus(t._id, t.isActive)}
                    disabled={togglingId === t._id}
                    className={`text-xs font-medium px-2.5 py-1.5 rounded-pill inline-flex items-center gap-1.5 min-w-[88px] justify-center ${t.isActive ? 'bg-amber-50 text-amber-700' : 'bg-mint-light/80 text-emerald-700'} disabled:opacity-60`}
                  >
                    {togglingId === t._id && <Spinner size="sm" />}
                    {t.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link href={`/tenants/${t._id}`} className="text-sm font-medium text-primary-500 hover:underline">View</Link>
                  <Link href={`/tenants/${t._id}/edit`} className="text-sm text-ink-muted hover:text-ink">Edit</Link>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <p className="text-sm text-ink-muted">Page {page} of {totalPages} ({total} total)</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || refreshing} className="btn-pill bg-slate-50 text-ink hover:bg-slate-100 disabled:opacity-50 text-sm">Previous</button>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || refreshing} className="btn-pill bg-slate-50 text-ink hover:bg-slate-100 disabled:opacity-50 text-sm">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
