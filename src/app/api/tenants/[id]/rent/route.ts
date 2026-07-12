import { NextResponse } from "next/server";
import {
  getAdvanceMonths,
  getFullyPaidMonths,
  getPendingDeposit,
  getPendingMonthBalances,
  getPendingMonths,
} from "@/lib/rent-utils";
import {
  addRentPayment,
  getRentPaymentsByTenant,
} from "@/lib/rent-storage";
import { getTenantById } from "@/lib/tenant-storage";
import type { PaymentType, RentPaymentInput } from "@/types/rent";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const tenant = await getTenantById(id);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  const payments = await getRentPaymentsByTenant(id);
  const pendingBalances = getPendingMonthBalances(
    tenant.rentStartFrom,
    payments,
    tenant.rent,
    tenant.removedAt,
  );
  const pendingMonths = pendingBalances.map((b) => b.month);
  const advanceMonths = tenant.removedAt
    ? []
    : getAdvanceMonths(tenant.rentStartFrom, payments, tenant.rent);
  const pendingDeposit = getPendingDeposit(
    tenant.deposit,
    tenant.advance ?? 0,
    payments,
  );
  const pendingRemaining = Object.fromEntries(
    pendingBalances.map((b) => [b.month, b.remaining]),
  );

  return NextResponse.json({
    payments,
    pendingMonths,
    pendingRemaining,
    advanceMonths,
    pendingDeposit,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const tenant = await getTenantById(id);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  if (tenant.removedAt) {
    return NextResponse.json(
      { error: "Cannot receive payment for removed tenant." },
      { status: 400 },
    );
  }

  const body = (await request.json()) as Partial<RentPaymentInput>;
  const type = (body.type ?? "rent") as PaymentType;
  const rentMonths = Array.from(
    new Set(
      (body.rentMonths ?? (body.rentMonth ? [body.rentMonth] : []))
        .map((m) => m?.trim())
        .filter(Boolean) as string[],
    ),
  ).sort();
  const amount = Number(body.amount);
  const receivedDate = body.receivedDate?.trim();
  const note = body.note?.trim() ?? "";
  const receivedBy = body.receivedBy?.trim() || "Admin";

  if (!receivedDate) {
    return NextResponse.json(
      { error: "Received date is required." },
      { status: 400 },
    );
  }

  if (Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Amount must be a valid number greater than 0." },
      { status: 400 },
    );
  }

  const payments = await getRentPaymentsByTenant(id);

  if (type === "deposit") {
    const pendingDeposit = getPendingDeposit(
      tenant.deposit,
      tenant.advance ?? 0,
      payments,
    );

    if (pendingDeposit <= 0) {
      return NextResponse.json(
        { error: "No pending deposit remaining." },
        { status: 400 },
      );
    }

    if (amount > pendingDeposit) {
      return NextResponse.json(
        {
          error: `Amount cannot exceed pending deposit (${pendingDeposit}).`,
        },
        { status: 400 },
      );
    }

    try {
      const payment = await addRentPayment({
        id: crypto.randomUUID(),
        tenantId: id,
        type: "deposit",
        amount,
        receivedDate,
        note,
        receivedBy,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({ payment }, { status: 201 });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save payment.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (type !== "rent" && type !== "advance") {
    return NextResponse.json({ error: "Invalid payment type." }, { status: 400 });
  }

  if (rentMonths.length === 0) {
    return NextResponse.json(
      { error: "Select at least one month." },
      { status: 400 },
    );
  }

  const pendingMonths = getPendingMonths(
    tenant.rentStartFrom,
    payments,
    tenant.rent,
  );
  const advanceMonths = getAdvanceMonths(
    tenant.rentStartFrom,
    payments,
    tenant.rent,
  );
  const allowed = type === "rent" ? pendingMonths : advanceMonths;
  const fullyPaid = new Set(getFullyPaidMonths(payments, tenant.rent));

  for (const month of rentMonths) {
    if (fullyPaid.has(month)) {
      return NextResponse.json(
        { error: `Rent for ${month} is already fully received.` },
        { status: 400 },
      );
    }
    if (!allowed.includes(month)) {
      return NextResponse.json(
        {
          error:
            type === "rent"
              ? `Month ${month} is not pending.`
              : `Month ${month} is not available for advance.`,
        },
        { status: 400 },
      );
    }
  }

  try {
    const payment = await addRentPayment({
      id: crypto.randomUUID(),
      tenantId: id,
      type,
      rentMonth: rentMonths[0],
      rentMonths,
      amount,
      receivedDate,
      note,
      receivedBy,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ payment, payments: [payment] }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save rent payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
