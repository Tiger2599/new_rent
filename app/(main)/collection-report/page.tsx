'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';

interface CollectionReportData {
  dailyReport: Array<{ date: string; totalAmount: number; count: number }>;
  totalCollection: number;
  allTimeTotal: number;
  from: string;
  to: string;
}

export default function CollectionReportPage() {
  const now = new Date();
  const defaultTo = now.toISOString().slice(0, 10);
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29).toISOString().slice(0, 10);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [data, setData] = useState<CollectionReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    api<CollectionReportData>('/collection-report', { params: { from, to } })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex justify-center min-h-[40vh] items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-soft border-t-primary" />
      </div>
    );
  }
  if (error && !data) {
    return (
      <div className="card-soft bg-red-50/80 text-red-700 p-5">
        {error}
      </div>
    );
  }

  const d = data!;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">Collection Report</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-ink">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input-soft min-h-[44px] w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-ink">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input-soft min-h-[44px] w-auto"
            />
          </div>
          <button type="button" onClick={fetchData} className="btn-pill bg-slate-100 text-ink hover:bg-slate-200 text-sm">
            Apply
          </button>
        </div>
      </div>

      {/* Sum of whole collection + period total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-gradient-mint p-5 shadow-card">
          <p className="text-sm font-medium text-ink/80">Total collection (selected period)</p>
          <p className="text-2xl font-bold text-ink mt-1">
            ₹{d.totalCollection.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-ink-muted mt-1">
            {new Date(d.from).toLocaleDateString('en-IN')} – {new Date(d.to).toLocaleDateString('en-IN')}
          </p>
        </div>
        <div className="card-gradient-blue p-5 shadow-card">
          <p className="text-sm font-medium text-ink/80">All-time total collection</p>
          <p className="text-2xl font-bold text-primary-700 mt-1">
            ₹{d.allTimeTotal.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-ink-muted mt-1">Sum of all rent received</p>
        </div>
      </div>

      {/* Daily collection report */}
      <div className="card-soft overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 className="text-lg font-semibold text-ink">Daily collection</h2>
          <p className="text-sm text-ink-muted mt-0.5">Rent collected per day in the selected period</p>
        </div>
        {d.dailyReport.length === 0 ? (
          <div className="p-8 text-center text-ink-muted">No collections in this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[320px]">
              <thead className="bg-slate-50 text-ink-muted text-xs font-semibold uppercase tracking-wide">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Date</th>
                  <th className="px-4 sm:px-6 py-3">No. of payments</th>
                  <th className="px-4 sm:px-6 py-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {d.dailyReport.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-50/50">
                    <td className="px-4 sm:px-6 py-3 font-medium text-ink">
                      {new Date(row.date + 'T12:00:00').toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-ink">{row.count}</td>
                    <td className="px-4 sm:px-6 py-3 text-right font-medium text-emerald-700">
                      ₹{row.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
