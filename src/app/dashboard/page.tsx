"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import BalanceSheetRow from "@/components/BalanceSheetRow";
import DashboardLayout from "@/components/DashboardLayout";
import DateRangePicker from "@/components/DateRangePicker";
import LedgerForm from "@/components/LedgerForm";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { formatCurrency } from "@/lib/format";
import {
  currentMonthKey,
  endOfMonthKey,
  formatDateRangeLabel,
  startOfMonthKey,
} from "@/lib/month-utils";
import type { BalanceSheetItem, LedgerEntryType } from "@/types/ledger";

export default function DashboardPage() {
  const { user } = useAuth();
  const { notifyError, notifySuccess } = useNotification();

  const [from, setFrom] = useState(() => startOfMonthKey(currentMonthKey()));
  const [to, setTo] = useState(() => endOfMonthKey(currentMonthKey()));
  const [income, setIncome] = useState<BalanceSheetItem[]>([]);
  const [expenses, setExpenses] = useState<BalanceSheetItem[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formType, setFormType] = useState<LedgerEntryType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSheet = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/ledger?from=${from}&to=${to}`);
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to load balance sheet.");
      return;
    }

    setIncome(data.income ?? []);
    setExpenses(data.expenses ?? []);
    setTotalIncome(data.totalIncome ?? 0);
    setTotalExpense(data.totalExpense ?? 0);
    setBalance(data.balance ?? 0);
  }, [from, to, notifyError]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  async function handleLedgerSubmit(payload: {
    type: LedgerEntryType;
    title: string;
    amount: number;
    date: string;
    note: string;
  }) {
    setSubmitting(true);
    const res = await fetch("/api/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        createdBy: user?.name ?? "Admin",
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to save entry.");
      return;
    }

    notifySuccess(
      payload.type === "extra_income"
        ? "Extra income added."
        : "Expense added.",
    );
    setFormType(null);
    await loadSheet();
  }

  return (
    <AuthGuard>
      <DashboardLayout title="Dashboard" showBack={false}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
              <DateRangePicker
                from={from}
                to={to}
                onChange={({ from: nextFrom, to: nextTo }) => {
                  setFrom(nextFrom);
                  setTo(nextTo);
                }}
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-green-50 px-2 py-3">
                <p className="text-[10px] uppercase tracking-wide text-green-700">
                  Income
                </p>
                <p className="mt-1 text-sm font-bold text-green-800">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 px-2 py-3">
                <p className="text-[10px] uppercase tracking-wide text-red-700">
                  Expense
                </p>
                <p className="mt-1 text-sm font-bold text-red-800">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-2 py-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-600">
                  Balance
                </p>
                <p
                  className={`mt-1 text-sm font-bold ${
                    balance >= 0 ? "text-gray-900" : "text-red-700"
                  }`}
                >
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormType("extra_income")}
              className="rounded-lg bg-green-600 px-3 py-3 text-sm font-medium text-white transition hover:bg-green-700"
            >
              Extra Income
            </button>
            <button
              type="button"
              onClick={() => setFormType("expense")}
              className="rounded-lg bg-red-600 px-3 py-3 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Expense
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading balance sheet...</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Balance Sheet
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatDateRangeLabel(from, to)}
                </p>
              </div>

              <div className="grid grid-cols-2 divide-x divide-gray-200">
                <div className="min-h-[280px]">
                  <div className="border-b border-gray-100 bg-green-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-800">
                      Income
                    </p>
                  </div>
                  <div className="grid grid-cols-[68px_28px_minmax(0,1fr)] border-b border-gray-100 bg-gray-50/70 text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                    <span className="border-r border-gray-100 px-1.5 py-1.5">Amt</span>
                    <span className="border-r border-gray-100 px-1 py-1.5 text-center">Dt</span>
                    <span className="px-1.5 py-1.5">Details</span>
                  </div>
                  {income.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-gray-400">
                      No income yet
                    </p>
                  ) : (
                    <ul>
                      {income.map((item) => (
                        <BalanceSheetRow
                          key={item.id}
                          item={item}
                          tone="income"
                        />
                      ))}
                    </ul>
                  )}
                </div>

                <div className="min-h-[280px]">
                  <div className="border-b border-gray-100 bg-red-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
                      Expense
                    </p>
                  </div>
                  <div className="grid grid-cols-[68px_28px_minmax(0,1fr)] border-b border-gray-100 bg-gray-50/70 text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                    <span className="border-r border-gray-100 px-1.5 py-1.5">Amt</span>
                    <span className="border-r border-gray-100 px-1 py-1.5 text-center">Dt</span>
                    <span className="px-1.5 py-1.5">Details</span>
                  </div>
                  {expenses.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-gray-400">
                      No expenses yet
                    </p>
                  ) : (
                    <ul>
                      {expenses.map((item) => (
                        <BalanceSheetRow
                          key={item.id}
                          item={item}
                          tone="expense"
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <LedgerForm
          open={formType !== null}
          type={formType ?? "extra_income"}
          submitting={submitting}
          onClose={() => setFormType(null)}
          onSubmit={handleLedgerSubmit}
        />
      </DashboardLayout>
    </AuthGuard>
  );
}
