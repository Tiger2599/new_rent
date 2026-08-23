"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { useNotification } from "@/context/NotificationContext";
import { DEFAULT_ELECTRICITY_RATE } from "@/lib/electricity";

export default function SettingsPage() {
  const { notifyError, notifySuccess } = useNotification();
  const [rate, setRate] = useState(String(DEFAULT_ELECTRICITY_RATE));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/settings");
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to load settings.");
      return;
    }

    setRate(String(data.settings?.electricityRate ?? DEFAULT_ELECTRICITY_RATE));
  }, [notifyError]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ electricityRate: Number(rate) }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to save settings.");
      return;
    }

    setRate(String(data.settings?.electricityRate ?? rate));
    notifySuccess("Electricity unit rate saved for all tenants.");
  }

  return (
    <AuthGuard>
      <DashboardLayout title="Settings" backHref="/dashboard">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Electricity unit rate
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                This rate applies to every tenant. Charge = (new units − last
                units) × rate.
              </p>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Rate per unit (₹)
              </span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gray-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </form>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
