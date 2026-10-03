import { NextResponse } from "next/server";
import {
  getAdvanceMonths,
  getPendingDeposit,
  getPendingMonthBalances,
} from "@/lib/rent-utils";
import {
  addRentPayment,
  getRentPaymentsByTenant,
} from "@/lib/rent-storage";
import { requireSession } from "@/lib/session";
import { getOwnerSettings } from "@/lib/settings-storage";
import { getTenantById, updateTenant } from "@/lib/tenant-storage";
import {
  electricityCharge,
  lastElectricityUnits,
  parseElectricityUnits,
} from "@/lib/electricity";
import {
  deleteUnpaidFlags,
  ensureElectricityFlags,
  getElectricityDuesByTenant,
  insertElectricityDues,
  markElectricityDuesPaid,
  pendingBalancesWithElectricity,
  unpaidElectricityByMonth,
  unitsPendingMonths,
  type ElectricityDue,
} from "@/lib/electricity-dues";
import type { PaymentType, RentPaymentInput } from "@/types/rent";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const { id } = await context.params;
  const tenant = await getTenantById(id, session.ownerId);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  const [payments, settings, dues] = await Promise.all([
    getRentPaymentsByTenant(id, session.ownerId),
    getOwnerSettings(session.ownerId),
    getElectricityDuesByTenant(id, session.ownerId),
  ]);
  const pendingBalances = pendingBalancesWithElectricity(
    getPendingMonthBalances(
      tenant.rentStartFrom,
      payments,
      tenant.rent,
      tenant.removedAt,
    ),
    dues,
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
    lastElectricityUnits: lastElectricityUnits(tenant.electricityUnits),
    electricityRate: settings.electricityRate,
    pendingElectricity: unpaidElectricityByMonth(dues),
    unitsPendingMonths: unitsPendingMonths(dues),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const { id } = await context.params;
  const tenant = await getTenantById(id, session.ownerId);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  if (tenant.removedAt) {
    return NextResponse.json(
      { error: "Cannot receive payment for removed tenant." },
      { status: 400 },
    );
  }

  const body = (await request.json()) as Partial<RentPaymentInput> & {
    unitsOnly?: boolean;
    collectBoth?: boolean;
  };
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

  const unitsOnly = type === "rent" && body.unitsOnly === true;
  const collectBoth = type === "rent" && body.collectBoth !== false && !unitsOnly;

  if (!unitsOnly && (Number.isNaN(amount) || amount <= 0)) {
    return NextResponse.json(
      { error: "Amount must be a valid number greater than 0." },
      { status: 400 },
    );
  }

  const payments = await getRentPaymentsByTenant(id, session.ownerId);

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
        ownerId: session.ownerId,
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

  const lastUnits = lastElectricityUnits(tenant.electricityUnits);
  const [settings, dues] = await Promise.all([
    getOwnerSettings(session.ownerId),
    getElectricityDuesByTenant(id, session.ownerId),
  ]);
  const electricityRate = settings.electricityRate;
  let newCharge = 0;
  let nextUnits: number | undefined;
  const electricityInput = (body as { electricityUnits?: unknown }).electricityUnits;
  const readingMonth = rentMonths[rentMonths.length - 1];

  if (
    type === "rent" &&
    electricityInput !== undefined &&
    electricityInput !== null &&
    electricityInput !== ""
  ) {
    const parsed = parseElectricityUnits(electricityInput);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    if (parsed.units <= lastUnits) {
      return NextResponse.json(
        {
          error: `Electricity units must be greater than last reading (${lastUnits}).`,
        },
        { status: 400 },
      );
    }
    newCharge = electricityCharge(lastUnits, parsed.units, electricityRate);
    nextUnits = parsed.units;
  }

  if (rentMonths.length === 0) {
    return NextResponse.json(
      { error: "Select at least one month." },
      { status: 400 },
    );
  }

  const pendingBalances =
    type === "rent"
      ? pendingBalancesWithElectricity(
          getPendingMonthBalances(tenant.rentStartFrom, payments, tenant.rent),
          dues,
        )
      : [];
  const advanceMonths = getAdvanceMonths(
    tenant.rentStartFrom,
    payments,
    tenant.rent,
  );
  const allowed =
    type === "rent" ? pendingBalances.map((row) => row.month) : advanceMonths;

  for (const month of rentMonths) {
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

  if (unitsOnly) {
    if (rentMonths.length !== 1) {
      return NextResponse.json(
        { error: "Select one month to save units." },
        { status: 400 },
      );
    }
    if (nextUnits === undefined) {
      return NextResponse.json(
        { error: "Enter electricity units greater than the last reading." },
        { status: 400 },
      );
    }

    try {
      await deleteUnpaidFlags(id, session.ownerId, rentMonths);
      await insertElectricityDues([
        readingDue({
          ownerId: session.ownerId,
          tenantId: id,
          month: rentMonths[0],
          previousUnits: lastUnits,
          units: nextUnits,
          charge: newCharge,
          rate: electricityRate,
          status: "unpaid",
        }),
      ]);
      await updateTenant(id, session.ownerId, { electricityUnits: nextUnits });
      return NextResponse.json({ unitsOnly: true }, { status: 201 });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save units.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const storedUnpaid = dues.filter(
    (due) =>
      due.status === "unpaid" &&
      due.kind === "reading" &&
      rentMonths.includes(due.month),
  );
  const storedCharge = storedUnpaid.reduce((sum, due) => sum + due.charge, 0);
  const monthsNeedingReading = rentMonths.filter(
    (month) =>
      dues.some(
        (due) => due.status === "unpaid" && due.kind === "flag" && due.month === month,
      ) &&
      !storedUnpaid.some((due) => due.month === month) &&
      !(nextUnits !== undefined && month === readingMonth),
  );

  if (collectBoth && monthsNeedingReading.length > 0 && nextUnits === undefined) {
    return NextResponse.json(
      { error: "Enter electricity units, or turn off receiving units with rent." },
      { status: 400 },
    );
  }

  const collectedCharge = collectBoth
    ? storedCharge + (nextUnits !== undefined ? newCharge : 0)
    : 0;

  if (collectedCharge > 0 && amount < collectedCharge) {
    return NextResponse.json(
      { error: `Amount must cover the electricity charge (${collectedCharge}).` },
      { status: 400 },
    );
  }

  try {
    const now = new Date().toISOString();
    const paymentId = crypto.randomUUID();
    let meterUpdated = false;

    if (!collectBoth && nextUnits !== undefined) {
      await deleteUnpaidFlags(id, session.ownerId, [readingMonth]);
      await insertElectricityDues([
        readingDue({
          ownerId: session.ownerId,
          tenantId: id,
          month: readingMonth,
          previousUnits: lastUnits,
          units: nextUnits,
          charge: newCharge,
          rate: electricityRate,
          status: "unpaid",
        }),
      ]);
      await updateTenant(id, session.ownerId, { electricityUnits: nextUnits });
      meterUpdated = true;
    }

    const settledUnits =
      collectBoth && nextUnits !== undefined
        ? { previous: lastUnits, units: nextUnits }
        : collectBoth && storedUnpaid.length > 0
          ? {
              previous: [...storedUnpaid].sort((a, b) =>
                a.createdAt.localeCompare(b.createdAt),
              )[0].previousUnits,
              units: [...storedUnpaid].sort((a, b) =>
                a.createdAt.localeCompare(b.createdAt),
              )[storedUnpaid.length - 1].units,
            }
          : null;

    const electricityNote =
      collectedCharge > 0 && settledUnits
        ? nextUnits !== undefined
          ? `Electricity ${settledUnits.previous} → ${settledUnits.units} (${settledUnits.units - settledUnits.previous} × ${electricityRate} = ${newCharge})${storedCharge > 0 ? ` + saved ${storedCharge}` : ""}`
          : `Saved electricity ${collectedCharge}`
        : "";
    const paymentNote = [note, electricityNote].filter(Boolean).join(" · ");

    const payment = await addRentPayment({
      id: paymentId,
      ownerId: session.ownerId,
      tenantId: id,
      type,
      rentMonth: rentMonths[0],
      rentMonths,
      amount,
      receivedDate,
      note: paymentNote,
      receivedBy,
      createdAt: now,
      ...(collectedCharge > 0 && settledUnits
        ? {
            previousElectricityUnits: settledUnits.previous,
            electricityUnits: settledUnits.units,
            electricityCharge: collectedCharge,
          }
        : {}),
    });

    if (collectBoth && nextUnits !== undefined) {
      await deleteUnpaidFlags(id, session.ownerId, [readingMonth]);
      await insertElectricityDues([
        readingDue({
          ownerId: session.ownerId,
          tenantId: id,
          month: readingMonth,
          previousUnits: lastUnits,
          units: nextUnits,
          charge: newCharge,
          rate: electricityRate,
          status: "paid",
          createdWithPayment: true,
          paymentId,
        }),
      ]);
      if (!meterUpdated) {
        await updateTenant(id, session.ownerId, { electricityUnits: nextUnits });
      }
    }

    if (type === "rent" && collectBoth) {
      await markElectricityDuesPaid(
        storedUnpaid.map((due) => due.id),
        session.ownerId,
        paymentId,
      );
      await deleteUnpaidFlags(id, session.ownerId, rentMonths);
    } else if (type === "rent") {
      const covered: ElectricityDue[] = [
        ...dues,
        ...(nextUnits !== undefined
          ? [
              readingDue({
                ownerId: session.ownerId,
                tenantId: id,
                month: readingMonth,
                previousUnits: lastUnits,
                units: nextUnits,
                charge: newCharge,
                rate: electricityRate,
                status: "unpaid",
              }),
            ]
          : []),
      ];
      await ensureElectricityFlags({
        tenantId: id,
        ownerId: session.ownerId,
        months: rentMonths,
        paymentId,
        existing: covered,
      });
    }

    return NextResponse.json({ payment, payments: [payment] }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save rent payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function readingDue(input: {
  ownerId: string;
  tenantId: string;
  month: string;
  previousUnits: number;
  units: number;
  charge: number;
  rate: number;
  status: "unpaid" | "paid";
  createdWithPayment?: boolean;
  paymentId?: string;
}): ElectricityDue {
  return {
    id: crypto.randomUUID(),
    ownerId: input.ownerId,
    tenantId: input.tenantId,
    month: input.month,
    previousUnits: input.previousUnits,
    units: input.units,
    charge: input.charge,
    rate: input.rate,
    status: input.status,
    kind: "reading",
    createdWithPayment: input.createdWithPayment,
    paymentId: input.paymentId,
    createdAt: new Date().toISOString(),
  };
}
