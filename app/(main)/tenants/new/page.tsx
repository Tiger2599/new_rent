'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewTenantPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
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
    api<{ items: Flat[] }>('/flats', { params: { propertyId, limit: '100', active: 'true' } })
      .then((r) => setFlats(r.items))
      .catch(() => setFlats([]));
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
      <h1 className="text-2xl font-bold text-white mb-6">Add Tenant</h1>
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
            <label className="block text-sm font-medium text-slate-300 mb-1">Security Deposit</label>
            <input type="number" min={0} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Deposit Pending (optional)</label>
          <input type="number" min={0} value={depositPending} onChange={(e) => setDepositPending(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Joining Date *</label>
          <input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
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
          <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Tenant'}
          </button>
          <Link href="/tenants" className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
