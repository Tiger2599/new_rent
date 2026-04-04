'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Spinner } from '@/components/Spinner';

export default function EditFlatPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [flatNumber, setFlatNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api<{ flatNumber: string }>(`/flats/${id}`)
      .then((d) => setFlatNumber(d.flatNumber))
      .catch(() => setError('Failed to load'))
      .finally(() => setFetching(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api(`/flats/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ flatNumber: flatNumber.trim() }),
      });
      router.push(`/flats/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-ink">Edit Flat</h1>
      <form onSubmit={handleSubmit} className="card-soft space-y-4">
        {error && <div className="p-3 rounded-input bg-red-50/80 text-red-700 text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Flat Number *</label>
          <input
            type="text"
            value={flatNumber}
            onChange={(e) => setFlatNumber(e.target.value)}
            required
            className="input-soft min-h-[44px]"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-pill-primary min-h-[44px] px-6 inline-flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" />}
            {loading ? 'Saving…' : 'Update'}
          </button>
          <Link href={`/flats/${id}`} className="min-h-[44px] px-6 py-2.5 rounded-input bg-slate-50 text-ink font-medium hover:bg-slate-100 inline-flex items-center">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
