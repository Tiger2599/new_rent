"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import ProofUpload from "@/components/ProofUpload";
import { useNotification } from "@/context/NotificationContext";
import type { Tenant, TenantProof } from "@/types/tenant";
import { normalizeTenantProofs } from "@/types/tenant";

export default function EditTenantPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { notifyError, notifySuccess } = useNotification();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    buildingNumber: "",
    roomNumber: "",
    deposit: "",
    advance: "",
    rent: "",
    rentStartFrom: "",
    note: "",
  });
  const [proofs, setProofs] = useState<TenantProof[]>([]);
  const [savedProofs, setSavedProofs] = useState<TenantProof[]>([]);

  const loadTenant = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/tenants/${params.id}`);
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to load tenant.");
      return;
    }

    const tenant = data.tenant as Tenant;
    if (tenant.removedAt) {
      notifyError("Cannot edit removed tenant.");
      router.replace(`/tenants/${tenant.id}`);
      return;
    }

    setForm({
      name: tenant.name,
      mobile: tenant.mobile,
      buildingNumber: tenant.buildingNumber,
      roomNumber: tenant.roomNumber,
      deposit: String(tenant.deposit),
      advance: String(tenant.advance ?? 0),
      rent: String(tenant.rent),
      rentStartFrom: tenant.rentStartFrom.slice(0, 10),
      note: tenant.note ?? "",
    });
    const normalized = normalizeTenantProofs(tenant);
    setProofs(normalized);
    setSavedProofs(normalized);
  }, [params.id, notifyError, router]);

  useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch(`/api/tenants/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        mobile: form.mobile,
        buildingNumber: form.buildingNumber,
        roomNumber: form.roomNumber,
        deposit: Number(form.deposit),
        advance: Number(form.advance || 0),
        rent: Number(form.rent),
        rentStartFrom: form.rentStartFrom,
        note: form.note,
        proofs,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to update tenant.");
      return;
    }

    notifySuccess("Tenant updated successfully.");
    router.push(`/tenants/${params.id}`);
  }

  return (
    <AuthGuard>
      <DashboardLayout title="Edit Tenant" backHref={`/tenants/${params.id}`}>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Name *
              </span>
              <input
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Mobile *
              </span>
              <input
                required
                type="tel"
                value={form.mobile}
                onChange={(e) => updateField("mobile", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Building No. *
                </span>
                <input
                  required
                  value={form.buildingNumber}
                  onChange={(e) => updateField("buildingNumber", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Room No. *
                </span>
                <input
                  required
                  value={form.roomNumber}
                  onChange={(e) => updateField("roomNumber", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Deposit *
                </span>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.deposit}
                  onChange={(e) => updateField("deposit", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Advance
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.advance}
                  onChange={(e) => updateField("advance", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Rent *
              </span>
              <input
                required
                type="number"
                min="0"
                value={form.rent}
                onChange={(e) => updateField("rent", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Rent Start From *
              </span>
              <input
                required
                type="date"
                value={form.rentStartFrom}
                onChange={(e) => updateField("rentStartFrom", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
            </label>

            <ProofUpload
              value={proofs}
              savedProofs={savedProofs}
              disabled={submitting}
              onChange={setProofs}
            />

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Note
              </span>
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => updateField("note", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gray-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
