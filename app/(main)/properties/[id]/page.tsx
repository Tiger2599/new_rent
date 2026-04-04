'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface PropertyDetail {
  _id: string;
  name: string;
  propertyNumber: string;
  address: string;
  flats: Array<{ _id: string; flatNumber: string }>;
  tenantCount?: number;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<PropertyDetail>(`/properties/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSoftDelete() {
    if (!confirm('Soft delete this property?')) return;
    try {
      await api(`/properties/${id}`, { method: 'DELETE' });
      router.push('/properties');
      router.refresh();
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-soft border-t-primary" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="card-soft bg-red-50/80 text-red-700 p-4">
        Property not found. <Link href="/properties" className="font-medium underline">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">{data.name}</h1>
        <div className="flex gap-2">
          <Link href={`/properties/${id}/edit`} className="btn-pill bg-slate-50 text-ink hover:bg-slate-100 font-medium">
            Edit
          </Link>
          <button onClick={handleSoftDelete} className="btn-pill bg-red-50 text-red-600 hover:bg-red-100 font-medium">
            Soft Delete
          </button>
        </div>
      </div>

      <div className="card-soft space-y-3">
        <p><span className="text-ink-muted">Property Number:</span> <span className="text-ink font-medium">{data.propertyNumber}</span></p>
        <p><span className="text-ink-muted">Address:</span> <span className="text-ink">{data.address}</span></p>
        <p><span className="text-ink-muted">Total Flats:</span> <span className="text-ink font-medium">{data.flats?.length ?? 0}</span></p>
        <p><span className="text-ink-muted">Tenants:</span> <span className="text-ink font-medium">{data.tenantCount ?? 0}</span></p>
      </div>

      {data.flats && data.flats.length > 0 && (
        <div className="card-soft">
          <h2 className="text-lg font-semibold text-ink mb-3">Flats</h2>
          <ul className="space-y-2">
            {data.flats.map((f) => (
              <li key={f._id} className="flex items-center justify-between rounded-input bg-slate-50/60 px-4 py-3">
                <span className="font-medium text-ink">Flat {f.flatNumber}</span>
                <Link href={`/flats/${f._id}`} className="text-sm font-medium text-primary-500 hover:underline">
                  View
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/properties" className="text-sm text-ink-muted hover:text-ink font-medium">← Back to Properties</Link>
    </div>
  );
}
