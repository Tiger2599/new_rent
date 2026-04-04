'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewTenantPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [flatsLoading, setFlatsLoading] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPending, setDepositPending] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [flatId, setFlatId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ items: Property[] }>('/properties', { params: { limit: '100' } })
      .then((r) => setProperties(r.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!propertyId) {
      setFlats([]);
      setFlatId('');
      return;
    }
    setFlatsLoading(true);
    api<{ items: Flat[] }>('/flats', {
      params: { propertyId, limit: '200', vacant: 'true' },
    })
      .then((r) => setFlats(r.items))
      .catch(() => setFlats([]))
      .finally(() => setFlatsLoading(false));
    setFlatId('');
  }, [propertyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          rentAmount: Number(rentAmount) || 0,
          depositAmount: Number(depositAmount) || 0,
          depositPending: Number(depositPending) || 0,
          joinDate: joinDate || new Date().toISOString().slice(0, 10),
          propertyId,
          flatId,
          notes: notes.trim(),
        }),
      });
      router.push('/tenants');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-ink mb-6">Add Tenant</h1>
      <form onSubmit={handleSubmit} className="card-soft space-y-4">
        {error && <div className="p-3 rounded-input bg-red-50/80 text-red-700 text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Tenant Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-soft min-h-[44px]" placeholder="Full name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Mobile *</label>
          <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required className="input-soft min-h-[44px]" placeholder="e.g. 9876543210" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Rent Amount *</label>
            <input type="number" min={0} value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} required className="input-soft min-h-[44px]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Security Deposit</label>
            <input type="number" min={0} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="input-soft min-h-[44px]" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Deposit Pending (optional)</label>
          <input type="number" min={0} value={depositPending} onChange={(e) => setDepositPending(e.target.value)} className="input-soft min-h-[44px]" placeholder="Amount still to be collected" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Joining Date *</label>
          <input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} required className="input-soft min-h-[44px]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Property *</label>
          <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required className="input-soft min-h-[44px]">
            <option value="">Select property</option>
            {properties.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Flat *</label>
          <p className="text-xs text-ink-muted mb-1">Only vacant flats (no active tenant). Ordered by flat number.</p>
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
          <label className="block text-sm font-medium text-ink mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input-soft" placeholder="Optional notes" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || flatsLoading} className="btn-pill-primary min-h-[44px] px-6 inline-flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" />}
            {loading ? 'Saving…' : 'Save Tenant'}
          </button>
          <Link href="/tenants" className="min-h-[44px] px-6 py-2.5 rounded-input bg-slate-50 text-ink font-medium hover:bg-slate-100 inline-flex items-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
