'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function NewPropertyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [propertyNumber, setPropertyNumber] = useState('');
  const [address, setAddress] = useState('');
  const [flats, setFlats] = useState<{ flatNumber: string }[]>([{ flatNumber: '' }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function addFlat() {
    setFlats((f) => [...f, { flatNumber: '' }]);
  }
  function removeFlat(i: number) {
    setFlats((f) => f.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const flatList = flats.map((f) => f.flatNumber.trim()).filter(Boolean);
      await api('/properties', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          propertyNumber: propertyNumber.trim(),
          address: address.trim(),
          flats: flatList.map((flatNumber) => ({ flatNumber })),
        }),
      });
      router.push('/properties');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-ink mb-6">Add Property</h1>
      <form onSubmit={handleSubmit} className="card-soft space-y-4">
        {error && (
          <div className="p-3 rounded-input bg-red-50/80 text-red-700 text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Property Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-soft min-h-[44px]" placeholder="e.g. Tower A" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Property Number *</label>
          <input type="text" value={propertyNumber} onChange={(e) => setPropertyNumber(e.target.value)} required className="input-soft min-h-[44px]" placeholder="e.g. PROP-001" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Address *</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} required rows={2} className="input-soft" placeholder="Full address" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-ink">Flats (optional)</label>
            <button type="button" onClick={addFlat} className="text-sm font-medium text-primary-500 hover:underline">
              + Add flat
            </button>
          </div>
          {flats.map((f, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                value={f.flatNumber}
                onChange={(e) =>
                  setFlats((prev) => prev.map((x, j) => (j === i ? { flatNumber: e.target.value } : x)))
                }
                placeholder="Flat number"
                className="input-soft flex-1 min-h-[44px]"
              />
              <button type="button" onClick={() => removeFlat(i)} className="px-3 py-2 rounded-input bg-red-50 text-red-600 hover:bg-red-100 font-medium text-sm">
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-pill-primary min-h-[44px] px-6">
            {loading ? 'Saving...' : 'Save Property'}
          </button>
          <Link href="/properties" className="min-h-[44px] px-6 py-2.5 rounded-input bg-slate-50 text-ink font-medium hover:bg-slate-100 inline-flex items-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
