'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

interface SearchResult {
  tenants: Array<{ _id: string; name: string; mobile?: string; propertyId?: { name: string }; flatId?: { flatNumber: string } }>;
  properties: Array<{ _id: string; name: string; propertyNumber?: string }>;
  flats: Array<{ _id: string; flatNumber: string; propertyId?: { name: string } }>;
}

export function GlobalSearch() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const search = useCallback(async () => {
    if (!q.trim() || q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const data = await api<SearchResult>('/search', { params: { q: q.trim() } });
      setResults(data);
      setOpen(true);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [q, search]);

  const go = (path: string) => {
    setOpen(false);
    setQ('');
    router.push(path);
  };

  return (
    <div className="relative">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results && setOpen(true)}
        placeholder="Search tenants, properties, flats..."
        className="w-64 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Searching...</span>
      )}
      {open && results && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-96 max-h-80 overflow-y-auto rounded-lg bg-slate-800 border border-slate-600 shadow-xl z-20">
            {results.tenants.length === 0 && results.properties.length === 0 && results.flats.length === 0 ? (
              <p className="p-3 text-slate-500 text-sm">No results</p>
            ) : (
              <>
                {results.tenants.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs font-medium text-slate-500 uppercase px-2 mb-1">Tenants</p>
                    {results.tenants.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => go(`/tenants/${t._id}`)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm"
                      >
                        {t.name} {t.mobile && `· ${t.mobile}`}
                      </button>
                    ))}
                  </div>
                )}
                {results.properties.length > 0 && (
                  <div className="p-2 border-t border-slate-700">
                    <p className="text-xs font-medium text-slate-500 uppercase px-2 mb-1">Properties</p>
                    {results.properties.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => go(`/properties/${p._id}`)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
                {results.flats.length > 0 && (
                  <div className="p-2 border-t border-slate-700">
                    <p className="text-xs font-medium text-slate-500 uppercase px-2 mb-1">Flats</p>
                    {results.flats.map((f) => (
                      <button
                        key={f._id}
                        onClick={() => go(`/flats/${f._id}`)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm"
                      >
                        {f.flatNumber} {f.propertyId && `· ${(f.propertyId as { name: string }).name}`}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
