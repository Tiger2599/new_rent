"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import ImagePreview from "@/components/ImagePreview";
import RentReceiveForm from "@/components/RentReceiveForm";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { electricityUnitsConsumed } from "@/lib/electricity";
import { formatCurrency, formatDate } from "@/lib/format";
import { groupRentPayments, paymentTitle } from "@/lib/rent-utils";
import type { PaymentType, RentPayment } from "@/types/rent";
import type { Tenant } from "@/types/tenant";
import { normalizeTenantProofs } from "@/types/tenant";

export default function TenantDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { notifyError, notifySuccess } = useNotification();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [pendingMonths, setPendingMonths] = useState<string[]>([]);
  const [pendingRemaining, setPendingRemaining] = useState<
    Record<string, number>
  >({});
  const [advanceMonths, setAdvanceMonths] = useState<string[]>([]);
  const [pendingDeposit, setPendingDeposit] = useState(0);
  const [pendingElectricity, setPendingElectricity] = useState<
    Record<string, number>
  >({});
  const [unitsPendingMonths, setUnitsPendingMonths] = useState<string[]>([]);
  const [electricityRate, setElectricityRate] = useState(9);
  const [loading, setLoading] = useState(true);
  const [showRentForm, setShowRentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [prevTenantId, setPrevTenantId] = useState<string | null>(null);
  const [nextTenantId, setNextTenantId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [tenantRes, rentRes] = await Promise.all([
      fetch(`/api/tenants/${params.id}`),
      fetch(`/api/tenants/${params.id}/rent`),
    ]);
    const [tenantData, rentData] = await Promise.all([
      tenantRes.json(),
      rentRes.json(),
    ]);
    setLoading(false);

    if (!tenantRes.ok) {
      notifyError(tenantData.error ?? "Failed to load tenant.");
      return;
    }

    if (!rentRes.ok) {
      notifyError(rentData.error ?? "Failed to load rent history.");
      setTenant(tenantData.tenant);
      return;
    }

    setTenant(tenantData.tenant);
    setPayments(rentData.payments ?? []);
    setPendingMonths(rentData.pendingMonths ?? []);
    setPendingRemaining(rentData.pendingRemaining ?? {});
    setAdvanceMonths(rentData.advanceMonths ?? []);
    setPendingDeposit(rentData.pendingDeposit ?? 0);
    setPendingElectricity(rentData.pendingElectricity ?? {});
    setUnitsPendingMonths(rentData.unitsPendingMonths ?? []);
    setElectricityRate(rentData.electricityRate ?? 9);
  }, [params.id, notifyError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/tenants").then((res) => res.json()),
      fetch("/api/tenants/old").then((res) => res.json()),
    ])
      .then(([current, old]) => {
        if (cancelled) return;
        const currentIds = ((current.tenants ?? []) as { id: string }[]).map(
          (item) => item.id,
        );
        const oldIds = ((old.tenants ?? []) as { id: string }[]).map(
          (item) => item.id,
        );
        const ids = currentIds.includes(params.id) ? currentIds : oldIds;
        const index = ids.indexOf(params.id);
        setPrevTenantId(index > 0 ? ids[index - 1] : null);
        setNextTenantId(
          index >= 0 && index < ids.length - 1 ? ids[index + 1] : null,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setPrevTenantId(null);
          setNextTenantId(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleReceiveRent(data: {
    type: PaymentType;
    rentMonths?: string[];
    amount: number;
    receivedDate: string;
    note: string;
    electricityUnits?: number;
    unitsOnly?: boolean;
    collectBoth?: boolean;
  }) {
    setSubmitting(true);
    const res = await fetch(`/api/tenants/${params.id}/rent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        receivedBy: user?.name ?? "Admin",
      }),
    });
    const result = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      notifyError(result.error ?? "Failed to save payment.");
      return;
    }

    notifySuccess(
      data.unitsOnly
        ? "Units saved. This month stays pending until rent is received."
        : data.collectBoth === false
          ? "Rent saved. This month stays pending until units are also received."
          : "Payment saved successfully.",
    );
    setShowRentForm(false);
    await loadData();
  }

  async function handleDeletePayment(paymentId: string) {
    setDeletingPaymentId(paymentId);
    const res = await fetch(`/api/tenants/${params.id}/rent/${paymentId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setDeletingPaymentId(null);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to delete payment.");
      return;
    }

    notifySuccess("Payment removed.");
    await loadData();
  }

  async function handleRemove() {
    if (!tenant || tenant.removedAt) return;

    setRemoving(true);
    const res = await fetch(`/api/tenants/${tenant.id}`, { method: "DELETE" });
    const data = await res.json();
    setRemoving(false);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to remove tenant.");
      return;
    }

    notifySuccess("Tenant moved to old tenants list.");
    router.push("/tenants?tab=old");
  }

  const isOld = Boolean(tenant?.removedAt);
  const advancePaid = tenant?.advance ?? 0;
  const proofs = tenant ? normalizeTenantProofs(tenant) : [];
  const groupedPayments = groupRentPayments(payments);
  const totalElectricityUnits = groupedPayments.reduce(
    (sum, payment) => sum + electricityUnitsConsumed(payment),
    0,
  );
  const totalElectricityAmount = groupedPayments.reduce(
    (sum, payment) => sum + (payment.electricityCharge ?? 0),
    0,
  );
  const pendingTotal = pendingMonths.reduce(
    (sum, month) => sum + (pendingRemaining[month] ?? tenant?.rent ?? 0),
    0,
  );

  return (
    <AuthGuard>
      <DashboardLayout
        title="Tenant Details"
        backHref={isOld ? "/tenants?tab=old" : "/tenants"}
        backActions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!prevTenantId}
              onClick={() => prevTenantId && router.push(`/tenants/${prevTenantId}`)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={!nextTenantId}
              onClick={() => nextTenantId && router.push(`/tenants/${nextTenantId}`)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        }
      >
        {loading ? (
          <p className="text-sm text-gray-500">Loading details...</p>
        ) : !tenant ? (
          <p className="text-sm text-red-600">Tenant not found.</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {tenant.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    <a
                      href={`tel:${tenant.mobile}`}
                      className="text-blue-600 underline-offset-2 hover:underline"
                    >
                      {tenant.mobile}
                    </a>
                  </p>
                </div>
                {isOld && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    Old Tenant
                  </span>
                )}
              </div>

              {proofs.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {proofs.map((proof, index) => (
                    <button
                      key={`${proof.publicId}-${index}`}
                      type="button"
                      onClick={() => {
                        setPreviewIndex(index);
                        setPreviewOpen(true);
                      }}
                      className="block overflow-hidden rounded-xl border border-gray-200 text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proof.url}
                        alt={`${tenant.name} proof ${index + 1}`}
                        className="h-32 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Building No.</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">
                    {tenant.buildingNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Room No.</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">
                    {tenant.roomNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Deposit</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">
                    {formatCurrency(tenant.deposit)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Advance Paid</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">
                    {formatCurrency(advancePaid)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Pending Deposit</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">
                    {formatCurrency(pendingDeposit)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Rent</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">
                    {formatCurrency(tenant.rent)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Rent Start From</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">
                    {formatDate(tenant.rentStartFrom)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Electricity units</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">
                    {tenant.electricityUnits ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Added On</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">
                    {formatDate(tenant.createdAt)}
                  </dd>
                </div>
                {tenant.removedAt && (
                  <div>
                    <dt className="text-gray-500">Removed On</dt>
                    <dd className="mt-0.5 font-medium text-gray-900">
                      {formatDate(tenant.removedAt)}
                    </dd>
                  </div>
                )}
                <div className="col-span-2">
                  <dt className="text-gray-500">Note</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">
                    {tenant.note || "-"}
                  </dd>
                </div>
              </dl>

              {!isOld && (
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRentForm(true)}
                    className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
                  >
                    Rent
                  </button>
                  <Link
                    href={`/tenants/${tenant.id}/edit`}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    disabled={removing}
                    onClick={handleRemove}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {removing ? "Removing..." : "Remove"}
                  </button>
                </div>
              )}

              {!isOld && pendingMonths.length > 0 && (
                <p className="mt-3 text-xs text-gray-500">
                  Pending rent: {formatCurrency(pendingTotal)} (
                  {paymentTitle({ type: "rent", rentMonth: pendingMonths[0] })}
                  {pendingMonths.length > 1 ? " ..." : ""})
                </p>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Rent History
                </h3>
                {totalElectricityUnits > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Electricity: {totalElectricityUnits} units
                    {totalElectricityAmount > 0
                      ? ` · ${formatCurrency(totalElectricityAmount)}`
                      : ""}
                  </p>
                )}
              </div>

              {groupedPayments.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500">
                  No payments yet.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {groupedPayments.map((payment) => (
                    <li key={payment.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {paymentTitle({
                              type: payment.type,
                              rentMonths: payment.rentMonths,
                              electricityCharge: payment.electricityCharge,
                            })}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Received on {formatDate(payment.receivedDate)}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            by {payment.receivedBy || "Admin"}
                          </p>
                          {electricityUnitsConsumed(payment) > 0 && (
                            <p className="mt-1 text-xs text-amber-800">
                              Units {payment.previousElectricityUnits ?? 0} →{" "}
                              {payment.electricityUnits} (
                              {electricityUnitsConsumed(payment)} used)
                              {payment.electricityCharge
                                ? ` · ${formatCurrency(payment.electricityCharge)}`
                                : ""}
                            </p>
                          )}
                          {payment.note && (
                            <p className="mt-1 text-xs text-gray-600">
                              {payment.note}
                            </p>
                          )}
                          <p className="mt-1 text-sm font-semibold text-green-700">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={deletingPaymentId === payment.id}
                          onClick={() => handleDeletePayment(payment.id)}
                          className="shrink-0 rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingPaymentId === payment.id
                            ? "..."
                            : "Delete"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tenant && !isOld && (
          <RentReceiveForm
            open={showRentForm}
            defaultRent={tenant.rent}
            pendingMonths={pendingMonths}
            pendingRemaining={pendingRemaining}
            pendingElectricity={pendingElectricity}
            unitsPendingMonths={unitsPendingMonths}
            advanceMonths={advanceMonths}
            pendingDeposit={pendingDeposit}
            lastElectricityUnits={tenant.electricityUnits ?? 0}
            electricityRate={electricityRate}
            submitting={submitting}
            onClose={() => setShowRentForm(false)}
            onSubmit={handleReceiveRent}
          />
        )}

        <ImagePreview
          open={previewOpen}
          index={previewIndex}
          images={proofs.map((p, i) => ({
            url: p.url,
            alt: `${tenant?.name ?? "Tenant"} proof ${i + 1}`,
          }))}
          onClose={() => setPreviewOpen(false)}
          onIndexChange={setPreviewIndex}
        />
      </DashboardLayout>
    </AuthGuard>
  );
}
