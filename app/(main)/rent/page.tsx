'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface DueItem {
  tenant: {
    _id: string;
    name: string;
    propertyId?: { name: string };
    flatId?: { flatNumber: string };
    rentAmount: number;
  };
  dueThisMonth: number;
  paidThisMonth: number;
  lastPaidDate: string | null;
  dueAmount: number;
  depositPending: number;
}

interface Payment {
  _id: string;
  amount: number;
  paymentDate: string;
  month: number;
  year: number;
  tenantId: { name: string };
}

export default function RentPage() {
  const [dueList, setDueList] = useState<DueItem[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState<{ tenantId: string; amount: string } | null>(null);
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(0);

  const fetchData = useCallback(() => {
    return Promise.all([
      api<{ items: DueItem[]; month: number; year: number }>('/rent/due'),
      api<{ items: Payment[] }>('/rent/payments', { params: { limit: '15' } }),
    ]).then(([dueRes, payRes]) => {
      setDueList(dueRes.items ?? []);
      setMonth(dueRes.month);
      setYear(dueRes.year);
      setRecentPayments(payRes.items ?? []);
    });
  }, []);

  useEffect(() => {
    fetchData().catch(() => {}).finally(() => setLoading(false));
  }, [fetchData]);

  async function collectRent(tenantId: string, amount: number, tenantName: string) {
    if (amount <= 0) return;
    setCollecting(tenantId);
    setPartialAmount(null);
    const now = new Date();
    try {
      await api('/rent/payments', {
        method: 'POST',
        body: JSON.stringify({
          tenantId,
          amount,
          paymentDate: now.toISOString().slice(0, 10),
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          note: 'Rent collected',
        }),
      });
      await fetchData();
      setRecentPayments((prev) => [
        { _id: String(Date.now()), amount, paymentDate: now.toISOString(), month: now.getMonth() + 1, year: now.getFullYear(), tenantId: { name: tenantName } },
        ...prev.slice(0, 14),
      ]);
    } catch {}
    setCollecting(null);
  }

  function openPartialCollect(item: DueItem) {
    const t = item.tenant as { _id: string; name: string };
    setPartialAmount({ tenantId: t._id, amount: String(item.dueAmount) });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Rent Management</h1>

      <div className="rounded-xl bg-slate-900 border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Rent Due ({month}/{year})
        </h2>
        {dueList.length === 0 ? (
          <p className="text-slate-500">No pending rent.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-slate-400 text-sm">
                <tr>
                  <th className="px-4 py-2 font-medium">Tenant</th>
                  <th className="px-4 py-2 font-medium">Property</th>
                  <th className="px-4 py-2 font-medium">Flat</th>
                  <th className="px-4 py-2 font-medium">Rent</th>
                  <th className="px-4 py-2 font-medium">Rent Due</th>
                  <th className="px-4 py-2 font-medium">Deposit Pending</th>
                  <th className="px-4 py-2 font-medium">Total Pending</th>
                  <th className="px-4 py-2 font-medium">Last Paid</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-slate-300">
                {dueList.map((item) => {
                  const t = item.tenant as { _id: string; name: string; propertyId?: { name: string }; flatId?: { flatNumber: string }; rentAmount: number };
                  const totalPending = item.dueAmount + (item.depositPending ?? 0);
                  const isPartial = partialAmount?.tenantId === t._id;
                  return (
                    <tr key={t._id}>
                      <td className="px-4 py-3">
                        <Link href={`/tenants/${t._id}`} className="text-primary-400 hover:underline">
                          {t.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{t.propertyId?.name ?? '-'}</td>
                      <td className="px-4 py-3">{t.flatId?.flatNumber ?? '-'}</td>
                      <td className="px-4 py-3">₹{t.rentAmount?.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-amber-400 font-medium">₹{item.dueAmount?.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-amber-400">₹{(item.depositPending ?? 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-amber-400 font-semibold">₹{totalPending.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {item.lastPaidDate ? new Date(item.lastPaidDate).toLocaleDateString('en-IN') : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        {isPartial ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              value={partialAmount?.amount ?? ''}
                              onChange={(e) => setPartialAmount((p) => p ? { ...p, amount: e.target.value } : null)}
                              className="w-24 px-2 py-1 rounded bg-slate-800 border border-slate-600 text-white text-sm"
                            />
                            <button
                              onClick={() => collectRent(t._id, Number(partialAmount?.amount) || 0, t.name)}
                              disabled={collecting === t._id || !(Number(partialAmount?.amount) > 0)}
                              className="px-2 py-1 rounded-lg bg-primary-500 text-white text-sm hover:bg-primary-600 disabled:opacity-50"
                            >
                              {collecting === t._id ? '...' : 'OK'}
                            </button>
                            <button onClick={() => setPartialAmount(null)} className="text-slate-400 hover:text-white text-sm">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={() => collectRent(t._id, item.dueAmount, t.name)}
                              disabled={collecting === t._id}
                              className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm hover:bg-primary-600 disabled:opacity-50"
                            >
                              {collecting === t._id ? '...' : 'Full'}
                            </button>
                            <button
                              onClick={() => openPartialCollect(item)}
                              disabled={collecting === t._id}
                              className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 disabled:opacity-50"
                            >
                              Partial
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Rent Payments</h2>
        {recentPayments.length === 0 ? (
          <p className="text-slate-500">No payments yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentPayments.map((p) => (
              <li key={p._id} className="flex justify-between text-sm">
                <span className="text-slate-300">{(p.tenantId as { name: string })?.name} – {p.month}/{p.year}</span>
                <span className="text-primary-400">₹{p.amount?.toLocaleString('en-IN')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
