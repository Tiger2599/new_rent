'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
const BuildingIcon = () => (
  <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
);
const HomeIcon = () => (
  <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
);
const UserGroupIcon = () => (
  <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
);
const CurrencyIcon = () => (
  <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const DocumentIcon = () => (
  <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
const PencilIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
);

interface DashboardData {
  stats: {
    totalProperties: number;
    totalFlats: number;
    activeTenants: number;
    inactiveTenants: number;
    totalMonthlyRentIncome: number;
    totalExpenses: number;
    currentBalance: number;
  };
  recentRentPayments: Array<{
    _id: string;
    amount: number;
    paymentDate: string;
    tenantId: { name: string };
  }>;
  pendingRentList: Array<{
    tenant: { _id: string; name: string; propertyId?: { name: string }; flatId?: { flatNumber: string } };
    dueAmount: number;
  }>;
  pendingDepositList: Array<{
    _id: string;
    name: string;
    depositPending: number;
    propertyId?: { name: string };
    flatId?: { flatNumber: string };
  }>;
  pinnedNotes: Array<{ _id: string; title: string; description?: string }>;
}

const statCards = [
  { key: 'totalProperties', label: 'Total Properties', icon: BuildingIcon, href: '/properties' },
  { key: 'totalFlats', label: 'Total Flats', icon: HomeIcon, href: '/flats' },
  { key: 'activeTenants', label: 'Active Tenants', icon: UserGroupIcon, href: '/tenants' },
  { key: 'inactiveTenants', label: 'Inactive Tenants', icon: UserGroupIcon, href: '/tenants?active=false' },
  { key: 'totalMonthlyRentIncome', label: 'Monthly Rent Income', icon: CurrencyIcon, href: '/rent' },
  { key: 'totalExpenses', label: 'Expenses', icon: CurrencyIcon, href: '/expenses' },
  { key: 'currentBalance', label: 'Current Balance', icon: DocumentIcon, href: '/balance-sheet' },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<DashboardData>('/dashboard')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-500/10 text-red-400 p-4">
        {error || 'Failed to load dashboard'}
      </div>
    );
  }

  const { stats, recentRentPayments, pendingRentList, pendingDepositList, pinnedNotes } = data;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map(({ key, label, icon: Icon, href }) => (
          <Link
            key={key}
            href={href}
            className="rounded-xl bg-slate-900 border border-slate-700 p-5 hover:border-slate-600 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{label}</p>
                <p className="text-2xl font-semibold text-white mt-1">
                  {key === 'currentBalance' || key === 'totalMonthlyRentIncome' || key === 'totalExpenses'
                    ? `₹${(stats as Record<string, number>)[key]?.toLocaleString('en-IN') ?? 0}`
                    : (stats as Record<string, number>)[key] ?? 0}
                </p>
              </div>
              <Icon />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-slate-900 border border-slate-700 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Rent Payments</h2>
          {recentRentPayments.length === 0 ? (
            <p className="text-slate-500 text-sm">No recent payments</p>
          ) : (
            <ul className="space-y-2">
              {recentRentPayments.map((p) => (
                <li key={p._id} className="flex justify-between text-sm">
                  <span className="text-slate-300">{(p.tenantId as { name: string })?.name}</span>
                  <span className="text-primary-400">₹{p.amount?.toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/rent" className="mt-3 text-sm text-primary-400 hover:underline block">View all →</Link>
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-700 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Pending Rent</h2>
          {pendingRentList.length === 0 ? (
            <p className="text-slate-500 text-sm">No pending rent</p>
          ) : (
            <ul className="space-y-2">
              {pendingRentList.slice(0, 5).map((item) => (
                <li key={(item.tenant as { _id: string })._id} className="flex justify-between text-sm">
                  <span className="text-slate-300">{item.tenant.name}</span>
                  <span className="text-amber-400">₹{item.dueAmount?.toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/rent" className="mt-3 text-sm text-primary-400 hover:underline block">Collect rent →</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-slate-900 border border-slate-700 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Pending Deposits</h2>
          {pendingDepositList.length === 0 ? (
            <p className="text-slate-500 text-sm">No pending deposits</p>
          ) : (
            <ul className="space-y-2">
              {pendingDepositList.map((t) => (
                <li key={t._id} className="flex justify-between text-sm">
                  <span className="text-slate-300">{t.name}</span>
                  <span className="text-amber-400">₹{t.depositPending?.toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-700 p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PencilIcon />
            Pinned Notes
          </h2>
          {pinnedNotes.length === 0 ? (
            <p className="text-slate-500 text-sm">No pinned notes</p>
          ) : (
            <ul className="space-y-2">
              {pinnedNotes.map((n) => (
                <li key={n._id} className="text-sm">
                  <Link href={`/notes?edit=${n._id}`} className="text-primary-400 hover:underline font-medium">
                    {n.title}
                  </Link>
                  {n.description && <p className="text-slate-500 truncate mt-0.5">{n.description}</p>}
                </li>
              ))}
            </ul>
          )}
          <Link href="/notes" className="mt-3 text-sm text-primary-400 hover:underline block">All notes →</Link>
        </div>
      </div>
    </div>
  );
}
