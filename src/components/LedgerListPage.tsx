"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import LedgerForm from "@/components/LedgerForm";
import { useNotification } from "@/context/NotificationContext";
import { formatCurrency, formatDate } from "@/lib/format";
import type { LedgerEntry, LedgerEntryType } from "@/types/ledger";

export default function LedgerListPage({
  type,
  title,
}: {
  type: LedgerEntryType;
  title: string;
}) {
  const { notifyError, notifySuccess } = useNotification();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LedgerEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/ledger/entries");
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to load entries.");
      return;
    }

    const list = (data.entries as LedgerEntry[]).filter((e) => e.type === type);
    setEntries(list);
  }, [notifyError, type]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  async function handleUpdate(payload: {
    type: LedgerEntryType;
    title: string;
    amount: number;
    date: string;
    note: string;
  }) {
    if (!editing) return;

    setSubmitting(true);
    const res = await fetch(`/api/ledger/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to update entry.");
      return;
    }

    notifySuccess("Entry updated successfully.");
    setEditing(null);
    await loadEntries();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/ledger/${id}`, { method: "DELETE" });
    const data = await res.json();
    setDeletingId(null);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to delete entry.");
      return;
    }

    notifySuccess("Entry deleted.");
    await loadEntries();
  }

  return (
    <AuthGuard>
      <DashboardLayout title={title} backHref="/dashboard">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
            No {title.toLowerCase()} entries yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <ul className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatDate(entry.date)} · by {entry.createdBy}
                    </p>
                    {entry.note && (
                      <p className="mt-1 text-xs text-gray-600">{entry.note}</p>
                    )}
                    <p
                      className={`mt-1 text-sm font-semibold ${
                        type === "extra_income"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {formatCurrency(entry.amount)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(entry)}
                      className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === entry.id}
                      onClick={() => handleDelete(entry.id)}
                      className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingId === entry.id ? "..." : "Delete"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <LedgerForm
          open={editing !== null}
          type={type}
          initial={editing}
          submitting={submitting}
          onClose={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      </DashboardLayout>
    </AuthGuard>
  );
}
