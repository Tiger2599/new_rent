'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Spinner } from '@/components/Spinner';

interface FlatDetail {
  _id: string;
  flatNumber: string;
  isActive?: boolean;
  propertyId: { _id: string; name: string; propertyNumber?: string; address?: string };
  currentTenant?: { _id: string; name: string; rentAmount: number } | null;
}

export default function FlatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<FlatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    api<FlatDetail>(`/flats/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSoftDelete() {
    if (!confirm('Soft delete this flat?')) return;
    setDeleting(true);
    try {
      await api(`/flats/${id}`, { method: 'DELETE' });
      router.push('/flats');
      router.refresh();
    } catch {
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive() {
    if (!data) return;
    const newActive = !(data.isActive !== false);
    setToggling(true);
    try {
      await api(`/flats/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: newActive }) });
      setData((d) => (d ? { ...d, isActive: newActive } : null));
    } catch {
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="card-soft bg-red-50/80 text-red-700 p-4">
        Flat not found. <Link href="/flats" className="font-medium underline">Back to list</Link>
      </div>
    );
  }

  const prop = data.propertyId as { name: string; propertyNumber?: string; address?: string };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">Flat {data.flatNumber}</h1>
        <div className="flex gap-2">
          <Link href={`/flats/${id}/edit`} className="btn-pill bg-slate-50 text-ink hover:bg-slate-100 font-medium">Edit</Link>
          <button type="button" onClick={handleSoftDelete} disabled={deleting} className="btn-pill bg-red-50 text-red-600 hover:bg-red-100 font-medium inline-flex items-center gap-2">
            {deleting && <Spinner size="sm" />}
            Soft Delete
          </button>
        </div>
      </div>

      <div className="card-soft space-y-3">
        <p><span className="text-ink-muted">Property:</span> <span className="text-ink font-medium">{prop?.name}</span></p>
        <p>
          <span className="text-ink-muted">Flat status:</span>{' '}
          {data.isActive !== false ? <span className="text-emerald-600 font-medium">Active</span> : <span className="text-ink-muted">Inactive</span>}
          <button type="button" onClick={toggleActive} disabled={toggling} className="ml-2 btn-pill text-xs bg-slate-100 text-ink hover:bg-slate-200 inline-flex items-center gap-1">
            {toggling && <Spinner size="sm" />}
            {data.isActive !== false ? 'Deactivate' : 'Activate'}
          </button>
        </p>
        <p><span className="text-ink-muted">Occupancy:</span> <span className="text-ink font-medium">{data.currentTenant ? 'Occupied' : 'Vacant'}</span></p>
        {data.currentTenant && (
          <p>
            <span className="text-ink-muted">Current tenant:</span>{' '}
            <Link href={`/tenants/${data.currentTenant._id}`} className="font-medium text-primary-500 hover:underline">
              {data.currentTenant.name}
            </Link>
            <span className="text-ink"> (₹{data.currentTenant.rentAmount?.toLocaleString('en-IN')})</span>
          </p>
        )}
      </div>

      <Link href="/flats" className="text-sm text-ink-muted hover:text-ink font-medium">← Back to Flats</Link>
    </div>
  );
}
