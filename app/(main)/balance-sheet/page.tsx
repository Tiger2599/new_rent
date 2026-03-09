'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface BalanceData {
  month: number;
  year: number;
  totalRentIncome: number;
  totalDepositReceived: number;
  totalExpenses: number;
  finalBalance: number;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function BalanceSheetPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<BalanceData>('/balance-sheet', { params: { month: String(month), year: String(year) } })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [month, year]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Balance Sheet</h1>

      <div className="flex gap-4 items-center">
        <label className="text-slate-400">Month</label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <label className="text-slate-400">Year</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
        >
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : data ? (
        <div className="rounded-xl bg-slate-900 border border-slate-700 p-6 max-w-md space-y-4">
          <p className="text-slate-400">
            {MONTHS[data.month - 1]} {data.year}
          </p>
          <div className="flex justify-between text-slate-300">
            <span>Total Rent Income</span>
            <span className="text-green-400">₹{data.totalRentIncome?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Total Deposit Received</span>
            <span className="text-slate-300">₹{data.totalDepositReceived?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Total Expenses</span>
            <span className="text-red-400">₹{data.totalExpenses?.toLocaleString('en-IN')}</span>
          </div>
          <div className="border-t border-slate-700 pt-4 flex justify-between text-lg font-semibold">
            <span className="text-white">Final Balance</span>
            <span className={data.finalBalance >= 0 ? 'text-green-400' : 'text-red-400'}>
              ₹{data.finalBalance?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-slate-500">Failed to load balance sheet.</p>
      )}
    </div>
  );
}
