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
  const [depositAmount, setDepositAmount] = useState('');
  const [collectingDeposit, setCollectingDeposit] = useState(false);
  const [depositError, setDepositError] = useState('');

  function loadTenant() {
    return api<TenantDetail>(`/tenants/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTenant();
  }, [id]);

  async function handleSoftDelete() {
    if (!confirm('Soft delete this tenant?')) return;
    try {
      await api(`/tenants/${id}`, { method: 'DELETE' });
      router.push('/tenants');
      router.refresh();
    } catch {}
  }

  async function handleCollectDeposit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!data || !Number.isFinite(amount) || amount <= 0) {
      setDepositError('Enter a valid amount.');
      return;
    }
    if (amount > (data.depositPending ?? 0)) {
      setDepositError('Amount cannot exceed pending deposit.');
      return;
    }
    setDepositError('');
    setCollectingDeposit(true);
    try {
      const newPending = Math.max(0, (data.depositPending ?? 0) - amount);
      await api(`/tenants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ depositPending: newPending }),
      });
      setDepositAmount('');
      await loadTenant();
      router.refresh();
    } catch {
      setDepositError('Failed to update. Try again.');
    } finally {
      setCollectingDeposit(false);
    }
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
        Tenant not found. <Link href="/tenants" className="font-medium underline">Back to list</Link>
      </div>
    );
  }

  const prop = data.propertyId as { name: string };
  const flat = data.flatId as { flatNumber: string };
  const pending = data.depositPending ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">{data.name}</h1>
        <div className="flex gap-2">
          <Link href={`/tenants/${id}/edit`} className="btn-pill bg-slate-50 text-ink hover:bg-slate-100 font-medium">Edit</Link>
          <button onClick={handleSoftDelete} className="btn-pill bg-red-50 text-red-600 hover:bg-red-100 font-medium">Soft Delete</button>
        </div>
      </div>

      <div className="card-soft space-y-3">
        <p><span className="text-ink-muted">Mobile:</span> <span className="text-ink font-medium">{data.mobile}</span></p>
        <p><span className="text-ink-muted">Property:</span> <span className="text-ink">{prop?.name}</span></p>
        <p><span className="text-ink-muted">Flat:</span> <span className="text-ink">{flat?.flatNumber}</span></p>
        <p><span className="text-ink-muted">Rent:</span> <span className="text-ink font-medium">₹{data.rentAmount?.toLocaleString('en-IN')}</span></p>
        <p><span className="text-ink-muted">Deposit:</span> <span className="text-ink font-medium">₹{data.depositAmount?.toLocaleString('en-IN')}</span></p>
        <p><span className="text-ink-muted">Deposit Pending:</span> <span className="text-ink font-medium">₹{pending.toLocaleString('en-IN')}</span></p>
        <p><span className="text-ink-muted">Join Date:</span> <span className="text-ink">{data.joinDate ? new Date(data.joinDate).toLocaleDateString('en-IN') : '-'}</span></p>
        {data.leaveDate && <p><span className="text-ink-muted">Leave Date:</span> <span className="text-ink">{new Date(data.leaveDate).toLocaleDateString('en-IN')}</span></p>}
        <p><span className="text-ink-muted">Status:</span> <span className={data.isActive ? 'text-green-600 font-medium' : 'text-ink-muted'}>{data.isActive ? 'Active' : 'Left'}</span></p>
        {data.notes && <p><span className="text-ink-muted">Notes:</span> <span className="text-ink">{data.notes}</span></p>}
      </div>

      {pending > 0 && (
        <div className="card-soft">
          <h2 className="text-lg font-semibold text-ink mb-2">Collect Pending Deposit</h2>
          <p className="text-sm text-ink-muted mb-3">Pending: ₹{pending.toLocaleString('en-IN')}. Enter amount received to reduce pending.</p>
          <form onSubmit={handleCollectDeposit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-ink mb-1">Amount (₹)</label>
              <input
                type="number"
                min={1}
                max={pending}
                step={1}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0"
                className="input-soft min-h-[44px]"
              />
            </div>
            <button type="submit" disabled={collectingDeposit || !depositAmount.trim()} className="btn-pill-primary min-h-[44px] px-5">
              {collectingDeposit ? 'Saving...' : 'Collect Deposit'}
            </button>
          </form>
          {depositError && <p className="mt-2 text-sm text-red-600">{depositError}</p>}
        </div>
      )}

      <Link href="/tenants" className="text-sm text-ink-muted hover:text-ink font-medium">← Back to Tenants</Link>
    </div>
  );
}
