'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Spinner } from '@/components/Spinner';

interface Property {
  _id: string;
  name: string;
}
interface Flat {
  _id: string;
  flatNumber: string;
  propertyId: { _id: string };
}

function idFromRef(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && '_id' in (v as object)) return String((v as { _id: unknown })._id);
  return String(v);
}

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [properties, setProperties] = useState<Property[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [flatsLoading, setFlatsLoading] = useState(false);
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
    api<Record<string, unknown>>(`/tenants/${id}`)
      .then((d) => {
        setName(String(d.name ?? ''));
        setMobile(String(d.mobile ?? ''));
        setRentAmount(String(d.rentAmount ?? ''));
        setDepositAmount(String(d.depositAmount ?? ''));
        setDepositPending(String(d.depositPending ?? ''));
        setJoinDate(d.joinDate ? new Date(d.joinDate as string).toISOString().slice(0, 10) : '');
        setLeaveDate(d.leaveDate ? new Date(d.leaveDate as string).toISOString().slice(0, 10) : '');
        setPropertyId(idFromRef(d.propertyId));
        setFlatId(idFromRef(d.flatId));
        setNotes(String(d.notes ?? ''));
        setIsActive(d.isActive !== false);
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setFetching(false));
  }, [id]);

  useEffect(() => {
    if (!propertyId) {
      setFlats([]);
      return;
    }
    setFlatsLoading(true);
    const params: Record<string, string> = { propertyId, limit: '200', vacant: 'true' };
    if (flatId) params.includeFlatId = flatId;
    api<{ items: Flat[] }>('/flats', { params })
      .then((r) => setFlats(r.items))
      .catch(() => setFlats([]))
      .finally(() => setFlatsLoading(false));
  }, [propertyId, flatId]);

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
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-ink">Edit Tenant</h1>
      <form onSubmit={handleSubmit} className="card-soft space-y-4">
        {error && <div className="p-3 rounded-input bg-red-50/80 text-red-700 text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Tenant Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-soft min-h-[44px]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Mobile *</label>
          <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required className="input-soft min-h-[44px]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Rent Amount *</label>
            <input type="number" min={0} value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} required className="input-soft min-h-[44px]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Deposit</label>
            <input type="number" min={0} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="input-soft min-h-[44px]" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Deposit Pending</label>
          <input type="number" min={0} value={depositPending} onChange={(e) => setDepositPending(e.target.value)} className="input-soft min-h-[44px]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Join Date</label>
            <input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className="input-soft min-h-[44px]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Leave Date</label>
            <input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} className="input-soft min-h-[44px]" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Property *</label>
          <select
            value={propertyId}
            onChange={(e) => {
              setPropertyId(e.target.value);
              setFlatId('');
            }}
            required
            className="input-soft min-h-[44px]"
          >
            <option value="">Select</option>
            {properties.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Flat *</label>
          <div className="relative">
            <select
              value={flatId}
              onChange={(e) => setFlatId(e.target.value)}
              required
              className="input-soft min-h-[44px] w-full disabled:opacity-60"
              disabled={!propertyId || flatsLoading}
            >
              <option value="">{flatsLoading ? 'Loading flats…' : 'Select flat'}</option>
              {flats.map((f) => (
                <option key={f._id} value={f._id}>{f.flatNumber}</option>
              ))}
            </select>
            {flatsLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Spinner size="sm" />
              </span>
            )}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-slate-300 text-primary" />
            <span className="text-sm text-ink">Active tenant</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input-soft" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || flatsLoading} className="btn-pill-primary min-h-[44px] px-6 inline-flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" />}
            {loading ? 'Saving…' : 'Update'}
          </button>
          <Link href={`/tenants/${id}`} className="min-h-[44px] px-6 py-2.5 rounded-input bg-slate-50 text-ink font-medium hover:bg-slate-100 inline-flex items-center">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
