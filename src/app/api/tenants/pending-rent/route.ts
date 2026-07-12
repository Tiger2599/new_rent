import { NextResponse } from "next/server";
import { getAllRentPayments } from "@/lib/rent-storage";
import { getActiveTenants } from "@/lib/tenant-storage";
import { getPendingMonthBalances } from "@/lib/rent-utils";
import { previousMonthKey, currentMonthKey } from "@/lib/month-utils";

export type PendingRentRow = {
  id: string;
  tenantId: string;
  tenantName: string;
  buildingNumber: string;
  roomNumber: string;
  amount: number;
  monthlyRent: number;
  rentMonth: string;
};

function compareBuildingRoom(
  a: { buildingNumber: string; roomNumber: string },
  b: { buildingNumber: string; roomNumber: string },
) {
  const building = a.buildingNumber.localeCompare(b.buildingNumber, undefined, {
    numeric: true,
    sensitivity: "base",
  });
  if (building !== 0) return building;
  return a.roomNumber.localeCompare(b.roomNumber, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export async function GET() {
  const targetMonth = previousMonthKey(currentMonthKey());

  const [tenants, payments] = await Promise.all([
    getActiveTenants(),
    getAllRentPayments(),
  ]);

  const paymentsByTenant = new Map<string, typeof payments>();
  for (const payment of payments) {
    const list = paymentsByTenant.get(payment.tenantId) ?? [];
    list.push(payment);
    paymentsByTenant.set(payment.tenantId, list);
  }

  const rows: PendingRentRow[] = [];

  for (const tenant of tenants) {
    const tenantPayments = paymentsByTenant.get(tenant.id) ?? [];
    const pendingBalances = getPendingMonthBalances(
      tenant.rentStartFrom,
      tenantPayments,
      tenant.rent,
    );
    const target = pendingBalances.find((b) => b.month === targetMonth);
    if (!target) continue;

    rows.push({
      id: `${tenant.id}-${targetMonth}`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      buildingNumber: tenant.buildingNumber,
      roomNumber: tenant.roomNumber,
      amount: target.remaining,
      monthlyRent: tenant.rent,
      rentMonth: targetMonth,
    });
  }

  rows.sort((a, b) => {
    const place = compareBuildingRoom(a, b);
    if (place !== 0) return place;
    return a.tenantName.localeCompare(b.tenantName);
  });

  return NextResponse.json({
    month: targetMonth,
    items: rows,
    totalAmount: rows.reduce((sum, row) => sum + row.amount, 0),
    count: rows.length,
  });
}
