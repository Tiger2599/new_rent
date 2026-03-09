'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface Property {
  _id: string;
  name: string;
}
interface Flat {
  _id: string;
  flatNumber: string;
  propertyId: { _id: string };
}

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [properties, setProperties] = useState<Property[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPending, setDepositPending] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [flatId, setFlatId] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api<{ items: Property[] }>('/properties', { params: { limit: '100' } })
      .then((r) => setProperties(r.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api<{
      name: string;
      mobile: string;
      rentAmount: number;
      depositAmount: number;
      depositPending: number;
      joinDate: string;
      leaveDate?: string;
      propertyId: string;
      flatId: string;
      notes?: string;
      isActive: boolean;
    }>(`/tenants/${id}`)
      .then((d) => {
        setName(d.name);
        setMobile(d.mobile);
        setRentAmount(String(d.rentAmount));
        setDepositAmount(String(d.depositAmount));
        setDepositPending(String(d.depositPending));
        setJoinDate(d.joinDate ? new Date(d.joinDate).toISOString().slice(0, 10) : '');
        setLeaveDate(d.leaveDate ? new Date(d.leaveDate).toISOString().slice(0, 10) : '');
        setPropertyId(d.propertyId);
        setFlatId(d.flatId);
        setNotes(d.notes ?? '');
        setIsActive(d.isActive);
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setFetching(false));
  }, [id]);

  useEffect(() => {
    if (!propertyId) {
      setFlats([]);
      return;
    }
    api<{ items: Flat[] }>('/flats', { params: { propertyId, limit: '100', active: 'true' } })
      .then((r) => setFlats(r.items))
      .catch(() => setFlats([]));
  }, [propertyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api(`/tenants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          rentAmount: Number(rentAmount) || 0,
          depositAmount: Number(depositAmount) || 0,
          depositPending: Number(depositPending) || 0,
          joinDate: joinDate || undefined,
          leaveDate: leaveDate || undefined,
          propertyId,
          flatId,
          notes: notes.trim(),
          isActive,
        }),
      });
      router.push(`/tenants/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">Edit Tenant</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-slate-900 border border-slate-700 p-6">
        {error && <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Tenant Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Mobile *</label>
          <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Rent Amount *</label>
            <input type="number" min={0} value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Deposit</label>
            <input type="number" min={0} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Deposit Pending</label>
          <input type="number" min={0} value={depositPending} onChange={(e) => setDepositPending(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Join Date</label>
            <input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Leave Date</label>
            <input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Property *</label>
          <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white">
            <option value="">Select</option>
            {properties.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Flat *</label>
          <select value={flatId} onChange={(e) => setFlatId(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" disabled={!propertyId}>
            <option value="">Select</option>
            {flats.map((f) => (
              <option key={f._id} value={f._id}>{f.flatNumber}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
            <span className="text-sm text-slate-300">Active tenant</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50">
            {loading ? 'Saving...' : 'Update'}
          </button>
          <Link href={`/tenants/${id}`} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
