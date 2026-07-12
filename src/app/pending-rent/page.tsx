"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import DataTable, { type Column } from "@/components/DataTable";
import RentReceiveForm from "@/components/RentReceiveForm";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { formatCurrency } from "@/lib/format";
import type { PaymentType } from "@/types/rent";

type PendingRentRow = {
  id: string;
  tenantId: string;
  tenantName: string;
  buildingNumber: string;
  roomNumber: string;
  amount: number;
  monthlyRent: number;
  rentMonths: string[];
  monthsLabel: string;
};

export default function PendingRentPage() {
  const { user } = useAuth();
  const { notifyError, notifySuccess } = useNotification();

  const [items, setItems] = useState<PendingRentRow[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [tenantCount, setTenantCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedTenantName, setSelectedTenantName] = useState("");
  const [defaultRent, setDefaultRent] = useState(0);
  const [pendingMonths, setPendingMonths] = useState<string[]>([]);
  const [pendingRemaining, setPendingRemaining] = useState<
    Record<string, number>
  >({});
  const [advanceMonths, setAdvanceMonths] = useState<string[]>([]);
  const [pendingDeposit, setPendingDeposit] = useState(0);
  const [showRentForm, setShowRentForm] = useState(false);
  const [loadingRent, setLoadingRent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/tenants/pending-rent");
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to load pending rent.");
      return;
    }

    setItems(data.items ?? []);
    setTotalAmount(data.totalAmount ?? 0);
    setTenantCount(data.tenantCount ?? 0);
  }, [notifyError]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function openReceive(row: PendingRentRow) {
    setLoadingRent(true);
    setSelectedTenantId(row.tenantId);
    setSelectedTenantName(row.tenantName);

    const res = await fetch(`/api/tenants/${row.tenantId}/rent`);
    const data = await res.json();
    setLoadingRent(false);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to load rent details.");
      setSelectedTenantId(null);
      return;
    }

    setDefaultRent(row.monthlyRent || row.amount);
    setPendingMonths(data.pendingMonths ?? []);
    setPendingRemaining(data.pendingRemaining ?? {});
    setAdvanceMonths(data.advanceMonths ?? []);
    setPendingDeposit(data.pendingDeposit ?? 0);
    setShowRentForm(true);
  }

  async function handleReceiveRent(payload: {
    type: PaymentType;
    rentMonths?: string[];
    amount: number;
    receivedDate: string;
    note: string;
  }) {
    if (!selectedTenantId) return;

    setSubmitting(true);
    const res = await fetch(`/api/tenants/${selectedTenantId}/rent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        receivedBy: user?.name ?? "Admin",
      }),
    });
    const result = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      notifyError(result.error ?? "Failed to save payment.");
      return;
    }

    notifySuccess("Payment saved successfully.");
    setShowRentForm(false);
    setSelectedTenantId(null);
    await loadList();
  }

  const columns: Column<PendingRentRow>[] = [
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "tenantName",
      label: "Tenant",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.tenantName}</span>
      ),
    },
    {
      key: "buildingNumber",
      label: "Room",
      sortable: true,
      render: (row) => `${row.buildingNumber}/${row.roomNumber}`,
    },
    {
      key: "monthsLabel",
      label: "Pending Months",
      sortable: true,
      render: (row) => (
        <span>
          {row.monthsLabel}
          {row.rentMonths.length > 1 ? (
            <span className="ml-1 text-xs text-gray-400">
              ({row.rentMonths.length})
            </span>
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <AuthGuard>
      <DashboardLayout title="Pending Rent" showBack={false}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Total pending amount
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {loading ? "…" : formatCurrency(totalAmount)}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-gray-500">
              <span>
                {loading
                  ? "Loading..."
                  : `${tenantCount} tenant${tenantCount === 1 ? "" : "s"} pending`}
              </span>
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">Loading...</p>
          ) : (
            <DataTable
              title="Pending rent list"
              data={items}
              columns={columns}
              searchPlaceholder="Search tenant, building, room..."
              searchKeys={[
                "tenantName",
                "buildingNumber",
                "roomNumber",
                "monthsLabel",
              ]}
              emptyMessage="No pending rent."
              pageSize={12}
              onRowClick={(row) => {
                if (!loadingRent) void openReceive(row);
              }}
            />
          )}

          {loadingRent && (
            <p className="text-center text-xs text-gray-500">
              Opening rent form...
            </p>
          )}
        </div>

        <RentReceiveForm
          open={showRentForm}
          tenantName={selectedTenantName}
          defaultRent={defaultRent}
          pendingMonths={pendingMonths}
          pendingRemaining={pendingRemaining}
          advanceMonths={advanceMonths}
          pendingDeposit={pendingDeposit}
          submitting={submitting}
          onClose={() => {
            setShowRentForm(false);
            setSelectedTenantId(null);
          }}
          onSubmit={handleReceiveRent}
        />
      </DashboardLayout>
    </AuthGuard>
  );
}
