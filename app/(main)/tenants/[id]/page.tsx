'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface TenantDetail {
  _id: string;
  name: string;
  mobile: string;
  rentAmount: number;
  depositAmount: number;
  depositPending: number;
  joinDate: string;
  leaveDate?: string;
  notes?: string;
  isActive: boolean;
  propertyId: { name: string; propertyNumber?: string; address?: string };
  flatId: { flatNumber: string };
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<TenantDetail>(`/tenants/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSoftDelete() {
    if (!confirm('Soft delete this tenant?')) return;
    try {
      await api(`/tenants/${id}`, { method: 'DELETE' });
      router.push('/tenants');
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
        Tenant not found. <Link href="/tenants" className="underline">Back to list</Link>
      </div>
    );
  }

  const prop = data.propertyId as { name: string };
  const flat = data.flatId as { flatNumber: string };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{data.name}</h1>
        <div className="flex gap-2">
          <Link href={`/tenants/${id}/edit`} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800">Edit</Link>
          <button onClick={handleSoftDelete} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">Soft Delete</button>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-700 p-6 space-y-4">
        <p><span className="text-slate-500">Mobile:</span> <span className="text-white">{data.mobile}</span></p>
        <p><span className="text-slate-500">Property:</span> <span className="text-white">{prop?.name}</span></p>
        <p><span className="text-slate-500">Flat:</span> <span className="text-white">{flat?.flatNumber}</span></p>
        <p><span className="text-slate-500">Rent:</span> <span className="text-white">₹{data.rentAmount?.toLocaleString('en-IN')}</span></p>
        <p><span className="text-slate-500">Deposit:</span> <span className="text-white">₹{data.depositAmount?.toLocaleString('en-IN')}</span></p>
        <p><span className="text-slate-500">Deposit Pending:</span> <span className="text-white">₹{data.depositPending?.toLocaleString('en-IN')}</span></p>
        <p><span className="text-slate-500">Join Date:</span> <span className="text-white">{data.joinDate ? new Date(data.joinDate).toLocaleDateString('en-IN') : '-'}</span></p>
        {data.leaveDate && <p><span className="text-slate-500">Leave Date:</span> <span className="text-white">{new Date(data.leaveDate).toLocaleDateString('en-IN')}</span></p>}
        <p><span className="text-slate-500">Status:</span> <span className={data.isActive ? 'text-green-400' : 'text-slate-500'}>{data.isActive ? 'Active' : 'Left'}</span></p>
        {data.notes && <p><span className="text-slate-500">Notes:</span> <span className="text-white">{data.notes}</span></p>}
      </div>

      <Link href="/tenants" className="text-slate-400 hover:text-white text-sm">← Back to Tenants</Link>
    </div>
  );
}
