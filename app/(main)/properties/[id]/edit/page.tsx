'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Spinner } from '@/components/Spinner';

interface FlatItem {
  _id: string;
  flatNumber: string;
  activeTenantName?: string | null;
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
      setFlats((prev) => [...prev, { _id: created._id, flatNumber: created.flatNumber ?? num }]);
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-soft border-t-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-ink">Edit Property</h1>

      <form onSubmit={handleSubmit} className="card-soft space-y-4">
        {error && <div className="p-3 rounded-input bg-red-50/80 text-red-700 text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Property Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-soft min-h-[44px]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Property Number *</label>
          <input type="text" value={propertyNumber} onChange={(e) => setPropertyNumber(e.target.value)} required className="input-soft min-h-[44px]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Address *</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} required rows={2} className="input-soft" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-pill-primary min-h-[44px] px-6 inline-flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" />}
            {loading ? 'Saving…' : 'Update'}
          </button>
          <Link href={`/properties/${id}`} className="min-h-[44px] px-6 py-2.5 rounded-input bg-slate-50 text-ink font-medium hover:bg-slate-100 inline-flex items-center">
            Cancel
          </Link>
        </div>
      </form>

      <div className="card-soft">
        <h2 className="text-lg font-semibold text-ink mb-3">Flats</h2>
        {flats.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {flats.map((f) => (
              <li key={f._id} className="flex items-center justify-between rounded-input bg-slate-50/60 px-4 py-3 gap-3">
                <span className="font-medium text-ink">
                  Flat {f.flatNumber}
                  {f.activeTenantName ? (
                    <span className="text-ink-muted font-normal"> ({f.activeTenantName})</span>
                  ) : (
                    <span className="text-ink-muted font-normal"> (vacant)</span>
                  )}
                </span>
                <Link href={`/flats/${f._id}`} className="text-sm font-medium text-primary-500 hover:underline shrink-0">
                  View
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-muted text-sm mb-4">No flats yet. Add one below.</p>
        )}
        <form onSubmit={handleAddFlat} className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newFlatNumber}
            onChange={(e) => setNewFlatNumber(e.target.value)}
            placeholder="New flat number"
            className="input-soft flex-1 min-w-[120px] min-h-[44px]"
          />
          <button
            type="submit"
            disabled={addingFlat || !newFlatNumber.trim()}
            className="btn-pill-primary min-h-[44px] px-5 inline-flex items-center justify-center gap-2"
          >
            {addingFlat && <Spinner size="sm" />}
            {addingFlat ? 'Adding…' : 'Add Flat'}
          </button>
        </form>
      </div>
    </div>
  );
}
