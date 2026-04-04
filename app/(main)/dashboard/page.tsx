'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Spinner } from '@/components/Spinner';
import { StatusBadge } from '@/components/StatusBadge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Icons
const BuildingIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const UserGroupIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const CurrencyIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AlertIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const WrenchIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ChartIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>;
const CalendarIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ClockIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ActivityIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

interface DashboardData {
  stats: {
    totalProperties: number;
    totalFlats: number;
    activeTenants: number;
    inactiveTenants: number;
    totalMonthlyRentIncome: number;
    totalExpenses: number;
    currentBalance: number;
    otherIncomeMonth?: number;
  };
  recentRentPayments: Array<{
    _id: string;
    amount: number;
    paymentDate: string;
    month?: number;
    year?: number;
    tenantId: { name: string; propertyId?: { name: string }; flatId?: { flatNumber: string } };
  }>;
  pendingRentList: Array<{ tenant: { _id: string; name: string }; dueAmount: number }>;
  totalPendingRent: number;
  totalPendingDeposit: number;
  pinnedNotes: Array<{ _id: string; title: string; description?: string }>;
  cashFlowLast6Months?: Array<{ monthLabel: string; income: number; expenses: number }>;
  financialOverview?: {
    monthlyRentCollected: number;
    otherIncome: number;
    totalIncome: number;
    maintenanceCost: number;
    utilities: number;
    otherExpenses: number;
    totalExpenses: number;
    netBalance: number;
  };
  recentActivity?: Array<{ type: string; label: string; date?: string }>;
  otherIncomeItems?: Array<{ _id: string; name: string; amount: number; date: string; note?: string }>;
}

const quickStatCards = [
  { key: 'totalProperties', label: 'Total Properties', icon: BuildingIcon, href: '/properties', color: 'text-primary' },
  { key: 'activeTenants', label: 'Total Tenants', icon: UserGroupIcon, href: '/tenants', color: 'text-primary' },
  { key: 'totalMonthlyRentIncome', label: 'Monthly Rent Collected', icon: CurrencyIcon, href: '/rent', color: 'text-secondary' },
  { key: 'pending', label: 'Pending Payments', icon: AlertIcon, href: '/rent', color: 'text-amber-600' },
  { key: 'maintenance', label: 'Maintenance Requests', icon: WrenchIcon, href: '/notes', color: 'text-ink-muted' },
];

const RENT_DUE_DAY = 5; // Assume rent due by 5th of month

function getDueLabel(): string {
  const now = new Date();
  const day = now.getDate();
  if (day <= RENT_DUE_DAY) {
    const daysLeft = RENT_DUE_DAY - day;
    return daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  }
  const overdue = day - RENT_DUE_DAY;
  return `Overdue by ${overdue} day${overdue === 1 ? '' : 's'}`;
}

function LiveClock() {
  const [dateTime, setDateTime] = useState({ date: '', time: '', tz: 'Asia/Kolkata' });
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const format = () => {
      const now = new Date();
      setDateTime({
        date: now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        tz,
      });
    };
    format();
    const id = setInterval(format, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-ink-muted">
      <span className="flex items-center gap-1.5">
        <CalendarIcon />
        {dateTime.date}
      </span>
      <span className="hidden sm:inline text-slate-300">|</span>
      <span className="flex items-center gap-1.5">
        <ClockIcon />
        {dateTime.time}
      </span>
      <span className="hidden sm:inline text-slate-300">|</span>
      <span>{dateTime.tz}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otherIncomeOpen, setOtherIncomeOpen] = useState(false);
  const [oiName, setOiName] = useState('');
  const [oiAmount, setOiAmount] = useState('');
  const [oiDate, setOiDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [oiNote, setOiNote] = useState('');
  const [oiSaving, setOiSaving] = useState(false);
  const [oiError, setOiError] = useState('');

  function loadDashboard() {
    return api<DashboardData>('/dashboard').then(setData);
  }

  useEffect(() => {
    loadDashboard()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAddOtherIncome(e: React.FormEvent) {
    e.preventDefault();
    setOiError('');
    if (!oiName.trim() || !oiAmount) {
      setOiError('Enter description and amount.');
      return;
    }
    setOiSaving(true);
    try {
      await api('/other-income', {
        method: 'POST',
        body: JSON.stringify({
          name: oiName.trim(),
          amount: Number(oiAmount),
          date: oiDate,
          note: oiNote.trim() || undefined,
        }),
      });
      setOtherIncomeOpen(false);
      setOiName('');
      setOiAmount('');
      setOiNote('');
      setOiDate(new Date().toISOString().slice(0, 10));
      await loadDashboard();
    } catch (err) {
      setOiError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setOiSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-4">
        {error || 'Failed to load dashboard'}
      </div>
    );
  }

  const { stats, recentRentPayments, pendingRentList, totalPendingRent, totalPendingDeposit, pinnedNotes, cashFlowLast6Months, financialOverview, recentActivity, otherIncomeItems } = data;
  const otherIncomeRows = otherIncomeItems ?? [];
  const pendingTotal = totalPendingRent + totalPendingDeposit;
  const fin = financialOverview ?? {
    monthlyRentCollected: stats.totalMonthlyRentIncome,
    otherIncome: 0,
    totalIncome: stats.totalMonthlyRentIncome,
    maintenanceCost: 0,
    utilities: 0,
    otherExpenses: stats.totalExpenses,
    totalExpenses: stats.totalExpenses,
    netBalance: stats.currentBalance,
  };
  const occupancyTotal = stats.totalFlats || 1;
  const occupancyOccupied = stats.activeTenants;
  const occupancyPct = Math.round((occupancyOccupied / occupancyTotal) * 100);
  const dueLabel = getDueLabel();
  const chartData = cashFlowLast6Months ?? [];

  const gradientClasses = ['card-gradient-blue', 'card-gradient-purple', 'card-gradient-blue', 'card-gradient-mint', 'card-gradient-purple'];

  return (
    <div className="space-y-5 sm:space-y-6">
      {otherIncomeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !oiSaving && setOtherIncomeOpen(false)}>
          <div className="card-soft max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-ink mb-1">Add other income</h3>
            <p className="text-sm text-ink-muted mb-4">Parking, shop rent, ad-hoc receipts, etc.</p>
            <form onSubmit={handleAddOtherIncome} className="space-y-3">
              {oiError && <div className="p-3 rounded-input bg-red-50/80 text-red-700 text-sm">{oiError}</div>}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Description *</label>
                <input value={oiName} onChange={(e) => setOiName(e.target.value)} className="input-soft min-h-[44px] w-full" placeholder="e.g. Parking fee" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Amount (₹) *</label>
                <input type="number" min={0} step={1} value={oiAmount} onChange={(e) => setOiAmount(e.target.value)} className="input-soft min-h-[44px] w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Date *</label>
                <input type="date" value={oiDate} onChange={(e) => setOiDate(e.target.value)} className="input-soft min-h-[44px] w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Note (optional)</label>
                <input value={oiNote} onChange={(e) => setOiNote(e.target.value)} className="input-soft min-h-[44px] w-full" placeholder="Optional" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={oiSaving} className="btn-pill-primary flex-1 min-h-[44px] inline-flex items-center justify-center gap-2">
                  {oiSaving && <Spinner size="sm" />}
                  {oiSaving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setOtherIncomeOpen(false)} disabled={oiSaving} className="btn-pill bg-slate-100 text-ink min-h-[44px] px-4">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Dashboard</h1>
        <div className="card-soft flex flex-wrap items-center justify-between gap-2">
          <LiveClock />
        </div>
      </div>

      {/* Quick Statistics - gradient fintech cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {quickStatCards.map(({ key, label, icon: Icon, href }, idx) => {
          const value = key === 'pending' ? pendingTotal : key === 'maintenance' ? pinnedNotes.length : (stats as Record<string, number>)[key] ?? 0;
          const isMoney = key === 'totalMonthlyRentIncome' || key === 'pending';
          return (
            <Link
              key={key}
              href={href}
              className={`block ${gradientClasses[idx % gradientClasses.length]} p-5 hover:shadow-soft-lg transition-all duration-200`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink/80">{label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-ink mt-1">
                    {isMoney ? `₹${Number(value).toLocaleString('en-IN')}` : value}
                  </p>
                </div>
                <div className="p-2.5 rounded-input bg-white/50 flex-shrink-0 text-primary-600">
                  <Icon />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Financial Overview + Occupancy */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="xl:col-span-3 card-soft overflow-hidden">
          <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="flex items-center gap-2">
              <ChartIcon />
              <h2 className="text-lg font-semibold text-ink">Financial Overview</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/other-income" className="text-sm font-medium text-primary-600 hover:text-primary-700 min-h-[40px] inline-flex items-center px-2">
                View list
              </Link>
              <button
                type="button"
                onClick={() => setOtherIncomeOpen(true)}
                className="btn-pill-primary text-sm min-h-[40px] px-4"
              >
                + Add other income
              </button>
            </div>
          </div>
          <div className="p-5 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-3">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Income</p>
              <div className="flex justify-between text-ink"><span>Monthly Rent Collected</span><span className="font-medium text-emerald-600">₹{fin.monthlyRentCollected?.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between items-center gap-2 text-ink">
                <span>Other Income</span>
                <span className="font-medium text-emerald-600">₹{fin.otherIncome?.toLocaleString('en-IN')}</span>
              </div>
              {otherIncomeRows.length > 0 && (
                <ul className="pl-2 space-y-1.5 text-xs text-ink-muted border-l-2 border-emerald-200/90 ml-0.5">
                  {otherIncomeRows.map((row) => (
                    <li key={row._id} className="flex justify-between gap-2">
                      <span className="truncate">{row.name}</span>
                      <span className="text-emerald-700 font-medium shrink-0">₹{row.amount?.toLocaleString('en-IN')}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/other-income" className="text-xs font-medium text-primary-600 hover:underline inline-block">
                View all other income →
              </Link>
              <div className="flex justify-between font-semibold text-ink pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}><span>Total Income</span><span className="text-emerald-600">₹{fin.totalIncome?.toLocaleString('en-IN')}</span></div>
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Expenses</p>
              <div className="flex justify-between text-ink"><span>Maintenance</span><span className="font-medium text-red-600">₹{fin.maintenanceCost?.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-ink"><span>Utilities</span><span className="font-medium text-red-600">₹{fin.utilities?.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-ink"><span>Other Expenses</span><span className="font-medium text-red-600">₹{fin.otherExpenses?.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-semibold text-ink pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}><span>Total Expenses</span><span className="text-red-600">₹{fin.totalExpenses?.toLocaleString('en-IN')}</span></div>
            </div>
            <div className="flex flex-col items-center justify-center md:min-w-[140px] py-4 md:py-0 md:border-l border-slate-100/80" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Net Balance</p>
              <p className={`text-2xl sm:text-3xl font-bold mt-1 ${fin.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>₹{fin.netBalance?.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
        <div className="card-soft">
          <h2 className="text-lg font-semibold text-ink mb-3">Occupancy</h2>
          <p className="text-ink-muted text-sm">Occupied Flats</p>
          <p className="text-2xl font-bold text-ink mt-1">{occupancyOccupied} <span className="text-lg font-normal text-ink-muted">/ {occupancyTotal}</span></p>
          <div className="mt-3 h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-mint-soft to-mint-light rounded-full transition-all" style={{ width: `${Math.min(100, occupancyPct)}%` }} />
          </div>
          <p className="text-sm font-medium text-emerald-600 mt-2">{occupancyPct}% occupied</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="card-soft overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}><h2 className="text-lg font-semibold text-ink">Monthly Cash Flow (Last 6 Months)</h2></div>
          <div className="p-4 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`} />
                <Tooltip formatter={(v: number) => `₹${Number(v).toLocaleString('en-IN')}`} labelFormatter={(l) => l} />
                <Legend />
                <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f87171" strokeWidth={2} dot={{ fill: '#f87171', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-soft overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <h2 className="text-lg font-semibold text-ink">Recent Rent Payments</h2>
            <Link href="/rent" className="text-sm font-medium text-primary-500 hover:text-primary-600 whitespace-nowrap btn-pill bg-primary-soft/50">View all</Link>
          </div>
          <div className="p-4 space-y-2">
            {recentRentPayments.length === 0 ? (
              <p className="text-ink-muted text-sm">No recent payments</p>
            ) : (
              recentRentPayments.slice(0, 5).map((p) => {
                const tenant = p.tenantId as { name?: string; propertyId?: { name: string }; flatId?: { flatNumber: string } };
                const propertyFlat = tenant?.flatId?.flatNumber ? `${tenant?.propertyId?.name ?? ''} / ${tenant.flatId.flatNumber}` : (tenant?.propertyId?.name ?? '-');
                const payDate = p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-';
                return (
                  <div key={p._id} className="rounded-input bg-slate-50/60 p-3 flex flex-wrap items-center justify-between gap-2 hover:bg-slate-50 transition">
                    <div>
                      <p className="font-medium text-ink">{tenant?.name ?? '-'}</p>
                      <p className="text-xs text-ink-muted">{propertyFlat} · {payDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-600">₹{p.amount?.toLocaleString('en-IN')}</span>
                      <StatusBadge status="paid" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card-soft overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <h2 className="text-lg font-semibold text-ink">Pending Payments</h2>
            <Link href="/rent" className="text-sm font-medium text-primary-500 btn-pill bg-primary-soft/50">Collect rent</Link>
          </div>
          <div className="p-4 space-y-2">
            {pendingRentList.length === 0 ? (
              <p className="text-ink-muted text-sm">No pending rent</p>
            ) : (
              pendingRentList.slice(0, 5).map((item) => (
                <div key={(item.tenant as { _id: string })._id} className="rounded-input bg-amber-50/50 p-3 flex flex-wrap items-center justify-between gap-2 hover:bg-amber-50/70 transition">
                  <p className="font-medium text-ink">{item.tenant.name}</p>
                  <div className="text-right">
                    <p className="font-semibold text-amber-700">₹{item.dueAmount?.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-ink-muted">{dueLabel}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-soft overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <h2 className="text-lg font-semibold text-ink">Maintenance Requests</h2>
            <Link href="/notes" className="text-sm font-medium text-primary-500 btn-pill bg-primary-soft/50">View all</Link>
          </div>
          <div className="p-4 space-y-2">
            {pinnedNotes.length === 0 ? (
              <p className="text-ink-muted text-sm">No maintenance requests</p>
            ) : (
              pinnedNotes.slice(0, 5).map((n, idx) => (
                <Link key={n._id} href={`/notes?edit=${n._id}`} className="block rounded-input bg-purple-100/50 p-3 hover:bg-purple-200/50 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{n.title}</p>
                      {n.description && <p className="text-sm text-ink-muted truncate mt-0.5">{n.description}</p>}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-pill shrink-0 ${idx === 0 ? 'bg-primary-200/60 text-primary-700' : 'bg-amber-100 text-amber-700'}`}>{idx === 0 ? 'In progress' : 'Pending'}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="card-soft overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <ActivityIcon />
            <h2 className="text-lg font-semibold text-ink">Activity Timeline</h2>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto space-y-2">
            {(!recentActivity || recentActivity.length === 0) ? (
              <p className="text-ink-muted text-sm">No recent activity</p>
            ) : (
              recentActivity.slice(0, 6).map((a, i) => (
                <div key={i} className="flex gap-3 rounded-input bg-slate-50/50 p-3">
                  <span className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-ink">{a.label}</p>
                    {a.date && <p className="text-xs text-ink-muted mt-0.5">{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
