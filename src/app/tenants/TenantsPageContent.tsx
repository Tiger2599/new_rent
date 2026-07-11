"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import DataTable, { type Column } from "@/components/DataTable";
import { useNotification } from "@/context/NotificationContext";
import { formatCurrency } from "@/lib/format";
import type { Tenant } from "@/types/tenant";

type Tab = "current" | "old";

export default function TenantsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notifyError } = useNotification();

  const initialTab: Tab =
    searchParams.get("tab") === "old" ? "old" : "current";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [currentTenants, setCurrentTenants] = useState<Tenant[]>([]);
  const [oldTenants, setOldTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    const [currentRes, oldRes] = await Promise.all([
      fetch("/api/tenants"),
      fetch("/api/tenants/old"),
    ]);
    const [currentData, oldData] = await Promise.all([
      currentRes.json(),
      oldRes.json(),
    ]);
    setLoading(false);

    if (!currentRes.ok) {
      notifyError(currentData.error ?? "Failed to load tenants.");
      return;
    }

    if (!oldRes.ok) {
      notifyError(oldData.error ?? "Failed to load old tenants.");
      return;
    }

    setCurrentTenants(currentData.tenants);
    setOldTenants(oldData.tenants);
  }, [notifyError]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  function switchTab(next: Tab) {
    setTab(next);
    router.replace(next === "old" ? "/tenants?tab=old" : "/tenants");
  }

  const columns: Column<Tenant>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    { key: "mobile", label: "Mobile", sortable: true },
    {
      key: "rent",
      label: "Rent",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(row.rent)}
        </span>
      ),
    },
  ];

  return (
    <AuthGuard>
      <DashboardLayout title="Tenants" backHref="/dashboard">
        <div className="mb-4 flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => switchTab("current")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              tab === "current"
                ? "bg-gray-800 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Current Tenant
          </button>
          <button
            type="button"
            onClick={() => switchTab("old")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              tab === "old"
                ? "bg-gray-800 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Old Tenant
          </button>
        </div>

        {tab === "current" && (
          <Link
            href="/tenants/add"
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            <span className="text-base leading-none">+</span>
            Add Tenant
          </Link>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading tenants...</p>
        ) : (
          <DataTable
            title={tab === "current" ? "Current" : "Old"}
            data={tab === "current" ? currentTenants : oldTenants}
            searchPlaceholder="Filter by name, mobile..."
            searchKeys={["name", "mobile"]}
            emptyMessage={
              tab === "current"
                ? "No active tenants found."
                : "No old tenants found."
            }
            columns={columns}
            onRowClick={(row) => router.push(`/tenants/${row.id}`)}
          />
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
