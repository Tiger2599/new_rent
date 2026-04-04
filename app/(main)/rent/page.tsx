'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { StatusBadge } from '@/components/StatusBadge';

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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-2xl font-bold text-ink">Rent Payments</h1>

      <div className="card-soft overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-ink">
            Rent Due ({month}/{year})
          </h2>
        </div>
        {dueList.length === 0 ? (
          <p className="p-5 text-ink-muted">No pending rent.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead className="bg-slate-50 text-ink-muted text-xs font-semibold uppercase tracking-wide">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Tenant</th>
                  <th className="px-4 sm:px-6 py-3">Property</th>
                  <th className="px-4 sm:px-6 py-3">Flat</th>
                  <th className="px-4 sm:px-6 py-3">Rent</th>
                  <th className="px-4 sm:px-6 py-3">Due</th>
                  <th className="px-4 sm:px-6 py-3 hidden md:table-cell">Deposit Pending</th>
                  <th className="px-4 sm:px-6 py-3">Last Paid</th>
                  <th className="px-4 sm:px-6 py-3">Status</th>
                  <th className="px-4 sm:px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dueList.map((item) => {
                  const t = item.tenant as { _id: string; name: string; propertyId?: { name: string }; flatId?: { flatNumber: string }; rentAmount: number };
                  const isPartial = partialAmount?.tenantId === t._id;
                  const isOverdue = item.lastPaidDate ? (new Date().getTime() - new Date(item.lastPaidDate).getTime()) > 35 * 24 * 60 * 60 * 1000 : true;
                  return (
                    <tr key={t._id} className="hover:bg-slate-50/50">
                      <td className="px-4 sm:px-6 py-3">
                        <Link href={`/tenants/${t._id}`} className="text-primary font-medium hover:underline">
                          {t.name}
                        </Link>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-ink">{t.propertyId?.name ?? '-'}</td>
                      <td className="px-4 sm:px-6 py-3 text-ink">{t.flatId?.flatNumber ?? '-'}</td>
                      <td className="px-4 sm:px-6 py-3 text-ink">₹{t.rentAmount?.toLocaleString('en-IN')}</td>
                      <td className="px-4 sm:px-6 py-3 text-amber-600 font-medium">₹{item.dueAmount?.toLocaleString('en-IN')}</td>
                      <td className="px-4 sm:px-6 py-3 text-ink hidden md:table-cell">₹{(item.depositPending ?? 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 sm:px-6 py-3 text-ink-muted text-sm">
                        {item.lastPaidDate ? new Date(item.lastPaidDate).toLocaleDateString('en-IN') : 'Never'}
                      </td>
                      <td className="px-4 sm:px-6 py-3"><StatusBadge status={isOverdue ? 'overdue' : 'pending'} /></td>
                      <td className="px-4 sm:px-6 py-3">
                        {isPartial ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              value={partialAmount?.amount ?? ''}
                              onChange={(e) => setPartialAmount((p) => p ? { ...p, amount: e.target.value } : null)}
                              className="w-24 min-h-[44px] sm:min-h-0 px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-ink text-sm"
                            />
                            <button
                              onClick={() => collectRent(t._id, Number(partialAmount?.amount) || 0, t.name)}
                              disabled={collecting === t._id || !(Number(partialAmount?.amount) > 0)}
                              className="btn-pill-primary min-h-[44px] sm:min-h-0 disabled:opacity-50"
                            >
                              {collecting === t._id ? '...' : 'OK'}
                            </button>
                            <button onClick={() => setPartialAmount(null)} className="text-ink-muted hover:text-ink text-sm">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => collectRent(t._id, item.dueAmount, t.name)}
                              disabled={collecting === t._id}
                              className="btn-pill-primary min-h-[44px] sm:min-h-0 disabled:opacity-50"
                            >
                              {collecting === t._id ? '...' : 'Full'}
                            </button>
                            <button
                              onClick={() => openPartialCollect(item)}
                              disabled={collecting === t._id}
                              className="min-h-[44px] sm:min-h-0 px-3 py-2 rounded-xl border border-slate-200 text-ink text-sm hover:bg-slate-50 disabled:opacity-50"
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

      <div className="card-soft overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-ink">Recent Rent Payments</h2>
        </div>
        {recentPayments.length === 0 ? (
          <p className="p-5 text-ink-muted">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[280px]">
              <thead className="bg-slate-50 text-ink-muted text-xs font-semibold uppercase tracking-wide">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Tenant</th>
                  <th className="px-4 sm:px-6 py-3">Period</th>
                  <th className="px-4 sm:px-6 py-3 text-right">Amount</th>
                  <th className="px-4 sm:px-6 py-3 hidden sm:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50">
                    <td className="px-4 sm:px-6 py-3 text-ink">{(p.tenantId as { name: string })?.name}</td>
                    <td className="px-4 sm:px-6 py-3 text-ink-muted">{p.month}/{p.year}</td>
                    <td className="px-4 sm:px-6 py-3 text-right font-medium text-secondary">₹{p.amount?.toLocaleString('en-IN')}</td>
                    <td className="px-4 sm:px-6 py-3 hidden sm:table-cell"><StatusBadge status="paid" /></td>
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
