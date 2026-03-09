'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface FlatItem {
  _id: string;
  flatNumber: string;
}

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [name, setName] = useState('');
  const [propertyNumber, setPropertyNumber] = useState('');
  const [address, setAddress] = useState('');
  const [flats, setFlats] = useState<FlatItem[]>([]);
  const [newFlatNumber, setNewFlatNumber] = useState('');
  const [addingFlat, setAddingFlat] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  function loadProperty() {
    return api<{ name: string; propertyNumber: string; address: string; flats?: FlatItem[] }>(`/properties/${id}`)
      .then((d) => {
        setName(d.name);
        setPropertyNumber(d.propertyNumber);
        setAddress(d.address);
        setFlats(d.flats ?? []);
      })
      .catch(() => setError('Failed to load'));
  }

  useEffect(() => {
    loadProperty().finally(() => setFetching(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api(`/properties/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim(), propertyNumber: propertyNumber.trim(), address: address.trim() }),
      });
      router.push(`/properties/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFlat(e: React.FormEvent) {
    e.preventDefault();
    const num = newFlatNumber.trim();
    if (!num) return;
    setAddingFlat(true);
    setError('');
    try {
      const created = await api<FlatItem>('/flats', {
        method: 'POST',
        body: JSON.stringify({ flatNumber: num, propertyId: id }),
      });
      setFlats((prev) => [...prev, created]);
      setNewFlatNumber('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add flat');
    } finally {
      setAddingFlat(false);
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
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Edit Property</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-slate-900 border border-slate-700 p-6">
        {error && <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{error}</div>}
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
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Update'}
          </button>
          <Link href={`/properties/${id}`} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800">
            Cancel
          </Link>
        </div>
      </form>

      {/* Flats section - separate from main form so Add Flat submits correctly */}
      <div className="rounded-xl bg-slate-900 border border-slate-700 p-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Flats</label>
        {flats.length > 0 && (
          <ul className="space-y-2 mb-4">
            {flats.map((f) => (
              <li key={f._id} className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-2">
                <span className="text-slate-300">{f.flatNumber}</span>
                <Link href={`/flats/${f._id}`} className="text-primary-400 hover:underline text-sm">
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAddFlat} className="flex gap-2">
          <input
            type="text"
            value={newFlatNumber}
            onChange={(e) => setNewFlatNumber(e.target.value)}
            placeholder="Flat number"
            className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={addingFlat || !newFlatNumber.trim()}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
          >
            {addingFlat ? 'Adding...' : 'Add Flat'}
          </button>
        </form>
      </div>
    </div>
  );
}
