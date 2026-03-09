'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

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

  useEffect(() => {
    api<FlatDetail>(`/flats/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSoftDelete() {
    if (!confirm('Soft delete this flat?')) return;
    try {
      await api(`/flats/${id}`, { method: 'DELETE' });
      router.push('/flats');
      router.refresh();
    } catch {}
  }

  async function toggleActive() {
    if (!data) return;
    const newActive = !(data.isActive !== false);
    try {
      await api(`/flats/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: newActive }) });
      setData((d) => d ? { ...d, isActive: newActive } : null);
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
        Flat not found. <Link href="/flats" className="underline">Back to list</Link>
      </div>
    );
  }

  const prop = data.propertyId as { name: string; propertyNumber?: string; address?: string };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Flat {data.flatNumber}</h1>
        <div className="flex gap-2">
          <Link href={`/flats/${id}/edit`} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800">Edit</Link>
          <button onClick={handleSoftDelete} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">Soft Delete</button>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-700 p-6 space-y-4">
        <p><span className="text-slate-500">Property:</span> <span className="text-white">{prop?.name}</span></p>
        <p><span className="text-slate-500">Flat status:</span> {data.isActive !== false ? <span className="text-green-400">Active</span> : <span className="text-slate-500">Inactive</span>}
          <button onClick={toggleActive} className="ml-2 px-2 py-1 rounded text-xs font-medium bg-slate-600 hover:bg-slate-500 text-white">
            {data.isActive !== false ? 'Deactivate' : 'Activate'}
          </button>
        </p>
        <p><span className="text-slate-500">Occupancy:</span> <span className="text-white">{data.currentTenant ? 'Occupied' : 'Empty'}</span></p>
        {data.currentTenant && (
          <p><span className="text-slate-500">Current Tenant:</span> <Link href={`/tenants/${data.currentTenant._id}`} className="text-primary-400 hover:underline">{data.currentTenant.name}</Link> (₹{data.currentTenant.rentAmount?.toLocaleString('en-IN')})</p>
        )}
      </div>

      <Link href="/flats" className="text-slate-400 hover:text-white text-sm">← Back to Flats</Link>
    </div>
  );
}
