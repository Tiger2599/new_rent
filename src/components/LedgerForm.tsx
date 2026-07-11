"use client";

import { FormEvent, useEffect, useState } from "react";
import { todayInputValue } from "@/lib/format";
import type { LedgerEntry, LedgerEntryType } from "@/types/ledger";

type LedgerFormProps = {
  open: boolean;
  type: LedgerEntryType;
  submitting: boolean;
  initial?: LedgerEntry | null;
  onClose: () => void;
  onSubmit: (data: {
    type: LedgerEntryType;
    title: string;
    amount: number;
    date: string;
    note: string;
  }) => void;
};

export default function LedgerForm({
  open,
  type,
  submitting,
  initial = null,
  onClose,
  onSubmit,
}: LedgerFormProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;

    if (initial) {
      setTitle(initial.title);
      setAmount(String(initial.amount));
      setDate(initial.date);
      setNote(initial.note ?? "");
      return;
    }

    setTitle("");
    setAmount("");
    setDate(todayInputValue());
    setNote("");
  }, [open, type, initial]);

  if (!open) return null;

  const isIncome = type === "extra_income";
  const isEdit = Boolean(initial);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      type,
      title,
      amount: Number(amount),
      date,
      note,
    });
  }

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
        className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl"
      >
        <h3 className="text-base font-semibold text-gray-900">
          {isEdit
            ? isIncome
              ? "Edit Extra Income"
              : "Edit Expense"
            : isIncome
              ? "Extra Income"
              : "Add Expense"}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {isIncome
            ? "This will appear on the income side"
            : "This will appear on the expense side"}
        </p>

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Title *
            </span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isIncome ? "e.g. Parking fee" : "e.g. Maintenance"}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Amount *
            </span>
            <input
              required
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Date *
            </span>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
            disabled={submitting}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 ${
              isIncome
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {submitting ? "Saving..." : isEdit ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
