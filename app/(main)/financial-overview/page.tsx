'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
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
import { PieChart, Pie, Cell, ResponsiveContainer as PieResponsive, Tooltip as PieTooltip, Legend as PieLegend } from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CATEGORIES = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
];

const DONUT_COLORS = ['#5B8DEF', '#10b981', '#E9D8FD', '#8b5cf6', '#94A3B8'];

interface FinancialData {
  summary: { totalRentIncome: number; totalDeposits: number; totalExpenses: number; netBalance: number };
  monthlySheet: Array<{
    month: number;
    year: number;
    monthLabel: string;
    rentIncome: number;
    depositReceived: number;
    expenses: number;
    netBalance: number;
  }>;
  expenses: Array<{
    _id: string;
    name: string;
    amount: number;
    date: string;
    note?: string;
    category: string;
    propertyFlat: string;
  }>;
  categoryBreakdown: Array<{ name: string; value: number; key: string }>;
}

export default function FinancialOverviewPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    amount: '',
    date: now.toISOString().slice(0, 10),
    note: '',
    category: 'other',
    propertyId: '',
    flatId: '',
  });
  const [properties, setProperties] = useState<Array<{ _id: string; name: string }>>([]);
  const [flats, setFlats] = useState<Array<{ _id: string; flatNumber: string; propertyId: { _id: string; name: string } }>>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    api<FinancialData>('/financial-overview', { params: { month: String(month), year: String(year) } })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    api<{ items: Array<{ _id: string; name: string }> }>('/properties', { params: { limit: '100' } })
      .then((r) => setProperties(r.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (addForm.propertyId) {
      api<{ items: Array<{ _id: string; flatNumber: string; propertyId: { _id: string; name: string } }> }>('/flats', {
        params: { propertyId: addForm.propertyId, limit: '100' },
      })
        .then((r) => setFlats(r.items ?? []))
        .catch(() => setFlats([]));
    } else {
      setFlats([]);
      setAddForm((f) => ({ ...f, flatId: '' }));
    }
  }, [addForm.propertyId]);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.amount) return;
    setSubmitLoading(true);
    try {
      await api('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          name: addForm.name.trim(),
          amount: Number(addForm.amount),
          date: addForm.date,
          note: addForm.note.trim() || undefined,
          category: addForm.category,
          propertyId: addForm.propertyId || undefined,
          flatId: addForm.flatId || undefined,
        }),
      });
      setShowAddModal(false);
      setAddForm({ name: '', amount: '', date: now.toISOString().slice(0, 10), note: '', category: 'other', propertyId: '', flatId: '' });
      fetchData();
    } catch {}
    setSubmitLoading(false);
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-soft border-t-primary" />
      </div>
    );
  }
  if (error && !data) {
    return (
      <div className="rounded-card bg-red-50/80 text-red-700 p-5 shadow-card">
        {error}
      </div>
    );
  }

  const d = data!;
  const chartData = d.monthlySheet.map((row) => ({
    monthLabel: row.monthLabel,
    income: row.rentIncome + row.depositReceived,
    expenses: row.expenses,
  }));
  const donutData = d.categoryBreakdown.filter((c) => c.value > 0);

  return (
    <div className="space-y-6">
      {/* Title + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Financial Overview</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-ink">Month</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input-soft min-h-[44px] sm:min-h-0 py-2.5 w-auto min-w-[120px]">
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-ink">Year</label>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-soft min-h-[44px] sm:min-h-0 py-2.5 w-auto min-w-[100px]">
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 1 — Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Rent Income', value: d.summary.totalRentIncome, gradient: 'card-gradient-mint' },
          { label: 'Total Deposits', value: d.summary.totalDeposits, gradient: 'card-gradient-blue' },
          { label: 'Total Expenses', value: d.summary.totalExpenses, gradient: 'card-soft', color: 'text-red-600' },
          { label: 'Net Balance', value: d.summary.netBalance, gradient: d.summary.netBalance >= 0 ? 'card-gradient-mint' : 'card-soft', color: d.summary.netBalance >= 0 ? 'text-emerald-700' : 'text-red-600' },
        ].map((card) => (
          <div key={card.label} className={`${card.gradient} p-5 shadow-card`}>
            <p className="text-sm font-medium text-ink/80">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color ?? 'text-ink'}`}>
              ₹{card.value?.toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>

      {/* Section 2 — Line chart + Monthly Balance Sheet Table */}
      <div className="card-soft overflow-hidden">
<div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <h2 className="text-lg font-semibold text-ink">Monthly Balance Sheet — {year}</h2>
          </div>
        <div className="p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`} />
              <Tooltip formatter={(v: number) => `₹${Number(v).toLocaleString('en-IN')}`} labelFormatter={(l) => l} />
              <Legend />
              <Line type="monotone" dataKey="income" name="Income (Rent + Deposit)" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[520px]">
            <thead>
              <tr className="text-ink-muted text-xs font-semibold uppercase tracking-wide">
                <th className="px-4 sm:px-5 py-3">Month</th>
                <th className="px-4 sm:px-5 py-3 text-right">Rent Income</th>
                <th className="px-4 sm:px-5 py-3 text-right">Deposit Received</th>
                <th className="px-4 sm:px-5 py-3 text-right">Expenses</th>
                <th className="px-4 sm:px-5 py-3 text-right">Net Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {d.monthlySheet.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50/50">
                  <td className="px-4 sm:px-5 py-3 font-medium text-ink">{row.monthLabel}</td>
                  <td className="px-4 sm:px-5 py-3 text-right text-emerald-600">₹{row.rentIncome?.toLocaleString('en-IN')}</td>
                  <td className="px-4 sm:px-5 py-3 text-right text-ink">₹{row.depositReceived?.toLocaleString('en-IN')}</td>
                  <td className="px-4 sm:px-5 py-3 text-right text-red-600">₹{row.expenses?.toLocaleString('en-IN')}</td>
                  <td className={`px-4 sm:px-5 py-3 text-right font-medium ${row.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ₹{row.netBalance?.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3 — Expenses List + Section 4 — Donut (side by side on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-soft overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <h2 className="text-lg font-semibold text-ink">Expenses — {MONTHS[month - 1]} {year}</h2>
            <button onClick={() => setShowAddModal(true)} className="btn-pill-primary">
              Add Expense
            </button>
          </div>
          <div className="p-4 space-y-2">
            {d.expenses.length === 0 ? (
              <p className="text-ink-muted text-sm">No expenses this month.</p>
            ) : (
              d.expenses.map((ex) => (
                <div key={ex._id} className="rounded-input bg-slate-50/60 p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition">
                  <div>
                    <p className="font-medium text-ink">{ex.name}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{ex.category} · {ex.propertyFlat}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">₹{ex.amount?.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-ink-muted">{ex.date ? new Date(ex.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}</p>
                  </div>
                  {ex.note && <p className="text-xs text-ink-muted w-full sm:max-w-[200px] truncate">{ex.note}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 4 — Expense Categories Donut */}
        <div className="card-soft overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <h2 className="text-lg font-semibold text-ink">Expense Categories</h2>
          </div>
          <div className="p-4">
            {donutData.length === 0 ? (
              <p className="text-ink-muted text-sm text-center py-8">No expenses this month.</p>
            ) : (
              <div className="h-64">
                <PieResponsive width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {donutData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <PieTooltip formatter={(v: number) => `₹${Number(v).toLocaleString('en-IN')}`} />
                    <PieLegend />
                  </PieChart>
                </PieResponsive>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="card-soft w-full max-w-md max-h-[90vh] overflow-y-auto shadow-soft-lg">
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <h3 className="text-lg font-semibold text-ink">Add Expense</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-input hover:bg-slate-50 text-ink-muted">✕</button>
              </div>
              <form onSubmit={handleAddExpense} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Expense Name *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="input-soft"
                    placeholder="e.g. Electric Repair"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Category</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
                    className="input-soft min-h-[44px]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Property</label>
                  <select
                    value={addForm.propertyId}
                    onChange={(e) => setAddForm((f) => ({ ...f, propertyId: e.target.value }))}
                    className="input-soft min-h-[44px]"
                  >
                    <option value="">— Select —</option>
                    {properties.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Flat</label>
                  <select
                    value={addForm.flatId}
                    onChange={(e) => setAddForm((f) => ({ ...f, flatId: e.target.value }))}
                    className="input-soft min-h-[44px]"
                  >
                    <option value="">— Select —</option>
                    {flats.map((f) => (
                      <option key={f._id} value={f._id}>{f.flatNumber} ({f.propertyId?.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Amount *</label>
                  <input
                    type="number"
                    min={0}
                    value={addForm.amount}
                    onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                    className="input-soft"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Date *</label>
                  <input
                    type="date"
                    value={addForm.date}
                    onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
                    required
                    className="input-soft min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Notes</label>
                  <textarea
                    value={addForm.note}
                    onChange={(e) => setAddForm((f) => ({ ...f, note: e.target.value }))}
                    rows={2}
                    className="input-soft"
                    placeholder="e.g. Wiring issue"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="flex-1 btn-pill-primary min-h-[44px] disabled:opacity-50"
                  >
                    {submitLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="min-h-[44px] px-4 py-2.5 rounded-input bg-slate-50 text-ink hover:bg-slate-100 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
