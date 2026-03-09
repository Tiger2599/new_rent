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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-lg bg-red-500/10 text-red-400 p-4">
        Property not found. <Link href="/properties" className="underline">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{data.name}</h1>
        <div className="flex gap-2">
          <Link
            href={`/properties/${id}/edit`}
            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Edit
          </Link>
          <button
            onClick={handleSoftDelete}
            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            Soft Delete
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-700 p-6 space-y-4">
        <p><span className="text-slate-500">Property Number:</span> <span className="text-white">{data.propertyNumber}</span></p>
        <p><span className="text-slate-500">Address:</span> <span className="text-white">{data.address}</span></p>
        <p><span className="text-slate-500">Total Flats:</span> <span className="text-white">{data.flats?.length ?? 0}</span></p>
        <p><span className="text-slate-500">Tenants:</span> <span className="text-white">{data.tenantCount ?? 0}</span></p>
      </div>

      {data.flats?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Flats</h2>
          <ul className="space-y-2">
            {data.flats.map((f) => (
              <li key={f._id} className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-2">
                <span className="text-slate-300">{f.flatNumber}</span>
                <Link href={`/flats/${f._id}`} className="text-primary-400 hover:underline text-sm">
                  View
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/properties" className="text-slate-400 hover:text-white text-sm">
        ← Back to Properties
      </Link>
    </div>
  );
}
