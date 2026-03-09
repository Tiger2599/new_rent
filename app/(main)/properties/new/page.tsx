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
      <h1 className="text-2xl font-bold text-white mb-6">Add Property</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-slate-900 border border-slate-700 p-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Property Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Property Number *</label>
          <input
            type="text"
            value={propertyNumber}
            onChange={(e) => setPropertyNumber(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Address *</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            rows={2}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-300">Flats (optional)</label>
            <button type="button" onClick={addFlat} className="text-sm text-primary-400 hover:underline">
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
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
              />
              <button type="button" onClick={() => removeFlat(i)} className="px-3 py-2 text-red-400 hover:bg-slate-700 rounded">
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Property'}
          </button>
          <Link href="/properties" className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
