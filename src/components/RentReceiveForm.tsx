"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatRentMonth } from "@/lib/rent-utils";
import { todayInputValue } from "@/lib/format";
import type { PaymentType } from "@/types/rent";

type Tab = "pending" | "advance" | "deposit";

type RentReceiveFormProps = {
  open: boolean;
  defaultRent: number;
  pendingMonths: string[];
  pendingRemaining?: Record<string, number>;
  advanceMonths: string[];
  pendingDeposit: number;
  submitting: boolean;
  tenantName?: string;
  onClose: () => void;
  onSubmit: (data: {
    type: PaymentType;
    rentMonths?: string[];
    amount: number;
    receivedDate: string;
    note: string;
  }) => void;
};

export default function RentReceiveForm({
  open,
  defaultRent,
  pendingMonths,
  pendingRemaining = {},
  advanceMonths,
  pendingDeposit,
  submitting,
  tenantName,
  onClose,
  onSubmit,
}: RentReceiveFormProps) {
  const [tab, setTab] = useState<Tab>("pending");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [amount, setAmount] = useState(String(defaultRent));
  const [amountTouched, setAmountTouched] = useState(false);
  const [receivedDate, setReceivedDate] = useState(todayInputValue());
  const [note, setNote] = useState("");

  function monthAmount(month: string) {
    return pendingRemaining[month] ?? defaultRent;
  }

  function totalForMonths(months: string[]) {
    return months.reduce((sum, month) => sum + monthAmount(month), 0);
  }

  useEffect(() => {
    if (!open) return;

    const preferred: Tab =
      pendingMonths.length > 0
        ? "pending"
        : pendingDeposit > 0
          ? "deposit"
          : "advance";

    setTab(preferred);
    setReceivedDate(todayInputValue());
    setNote("");
    setAmountTouched(false);

    if (preferred === "pending") {
      const initial = pendingMonths[0] ? [pendingMonths[0]] : [];
      setSelectedMonths(initial);
      setAmount(String(totalForMonths(initial) || defaultRent));
    } else if (preferred === "advance") {
      const initial = advanceMonths[0] ? [advanceMonths[0]] : [];
      setSelectedMonths(initial);
      setAmount(String(initial.length * defaultRent || defaultRent));
    } else {
      setSelectedMonths([]);
      setAmount(String(pendingDeposit));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset from props when form opens
  }, [open, pendingMonths, advanceMonths, pendingDeposit, defaultRent, pendingRemaining]);

  useEffect(() => {
    if (!open) return;

    if (tab === "pending") {
      const initial = pendingMonths[0] ? [pendingMonths[0]] : [];
      setSelectedMonths(initial);
      setAmountTouched(false);
      setAmount(String(totalForMonths(initial) || defaultRent));
    } else if (tab === "advance") {
      const initial = advanceMonths[0] ? [advanceMonths[0]] : [];
      setSelectedMonths(initial);
      setAmountTouched(false);
      setAmount(String(initial.length * defaultRent || defaultRent));
    } else {
      setSelectedMonths([]);
      setAmountTouched(false);
      setAmount(String(pendingDeposit));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, open, pendingMonths, advanceMonths, pendingDeposit, defaultRent, pendingRemaining]);

  useEffect(() => {
    if (!open || tab === "deposit" || amountTouched) return;
    if (tab === "pending") {
      setAmount(String(totalForMonths(selectedMonths) || defaultRent));
      return;
    }
    setAmount(String(selectedMonths.length * defaultRent || defaultRent));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonths, defaultRent, open, tab, amountTouched, pendingRemaining]);

  if (!open) return null;

  const months = tab === "pending" ? pendingMonths : advanceMonths;

  function toggleMonth(month: string) {
    setSelectedMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month].sort(),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (tab === "deposit") {
      onSubmit({
        type: "deposit",
        amount: Number(amount),
        receivedDate,
        note,
      });
      return;
    }

    onSubmit({
      type: tab === "advance" ? "advance" : "rent",
      rentMonths: selectedMonths,
      amount: Number(amount),
      receivedDate,
      note,
    });
  }

  const canSubmit =
    tab === "deposit"
      ? pendingDeposit > 0 && Number(amount) > 0
      : months.length > 0 && selectedMonths.length > 0 && Number(amount) > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close form"
        className="absolute inset-0"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl"
      >
        <h3 className="text-base font-semibold text-gray-900">Receive Payment</h3>
        <p className="mt-1 text-sm text-gray-500">
          {tenantName
            ? `${tenantName} – record rent, advance or pending deposit`
            : "Record rent, advance or pending deposit"}
        </p>

        <div className="mt-4 flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          {(
            [
              ["pending", "Pending Rent"],
              ["advance", "Advance Rent"],
              ["deposit", "Pending Deposit"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 rounded-md px-2 py-2 text-[11px] font-medium transition sm:text-xs ${
                tab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {tab !== "deposit" && (
            <>
              {months.length === 0 ? (
                <p className="text-sm text-red-600">
                  {tab === "pending"
                    ? "No pending rent months available."
                    : "No advance months available."}
                </p>
              ) : (
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">
                    {tab === "pending"
                      ? "Select Pending Months *"
                      : "Select Advance Months *"}
                  </span>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
                    {months.map((month) => {
                      const checked = selectedMonths.includes(month);
                      const remaining =
                        tab === "pending" ? monthAmount(month) : defaultRent;
                      return (
                        <label
                          key={month}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMonth(month)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="flex-1">{formatRentMonth(month)}</span>
                          {tab === "pending" && remaining < defaultRent && (
                            <span className="text-xs text-amber-700">
                              Due {remaining}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">
                    {selectedMonths.length} month
                    {selectedMonths.length === 1 ? "" : "s"} selected
                  </p>
                </div>
              )}
            </>
          )}

          {tab === "deposit" && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Pending deposit:{" "}
              <span className="font-semibold text-gray-900">
                {pendingDeposit}
              </span>
            </p>
          )}

          {(tab === "deposit" ? pendingDeposit > 0 : months.length > 0) && (
            <>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Amount *
                </span>
                <input
                  required
                  type="number"
                  min="1"
                  max={tab === "deposit" ? pendingDeposit : undefined}
                  value={amount}
                  onChange={(e) => {
                    setAmountTouched(true);
                    setAmount(e.target.value);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
                />
                {tab === "pending" && selectedMonths.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Due for selection = {totalForMonths(selectedMonths)}
                  </p>
                )}
                {tab === "advance" && selectedMonths.length > 1 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Auto total = {selectedMonths.length} × {defaultRent}
                  </p>
                )}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Received Date *
                </span>
                <input
                  required
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Note
                </span>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
                />
              </label>
            </>
          )}

          {tab === "deposit" && pendingDeposit <= 0 && (
            <p className="text-sm text-red-600">No pending deposit remaining.</p>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
