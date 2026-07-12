import type { GroupedRentPayment, RentPayment } from "@/types/rent";

export function formatRentMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthKeysBetween(
  startDate: string,
  endDate: Date = new Date(),
): string[] {
  const start = new Date(startDate);
  const months: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= end) {
    months.push(toMonthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

export function getPaymentMonths(payment: {
  rentMonth?: string;
  rentMonths?: string[];
}): string[] {
  if (payment.rentMonths && payment.rentMonths.length > 0) {
    return [...payment.rentMonths].sort();
  }
  if (payment.rentMonth) return [payment.rentMonth];
  return [];
}

function batchKey(payment: RentPayment): string {
  return [
    payment.tenantId,
    payment.type,
    payment.receivedDate,
    payment.createdAt,
    payment.note,
    payment.receivedBy,
  ].join("|");
}

/** Merge legacy per-month split rows into one payment for display / allocation. */
export function groupRentPayments(
  payments: RentPayment[],
): GroupedRentPayment[] {
  const result: GroupedRentPayment[] = [];
  const legacyBatches = new Map<string, RentPayment[]>();

  for (const payment of payments) {
    if (payment.type !== "rent" && payment.type !== "advance") {
      result.push({
        id: payment.id,
        ids: [payment.id],
        tenantId: payment.tenantId,
        type: payment.type,
        rentMonths: [],
        amount: payment.amount,
        receivedDate: payment.receivedDate,
        note: payment.note,
        receivedBy: payment.receivedBy,
        createdAt: payment.createdAt,
      });
      continue;
    }

    if (payment.rentMonths && payment.rentMonths.length > 0) {
      result.push({
        id: payment.id,
        ids: [payment.id],
        tenantId: payment.tenantId,
        type: payment.type,
        rentMonths: getPaymentMonths(payment),
        amount: payment.amount,
        receivedDate: payment.receivedDate,
        note: payment.note,
        receivedBy: payment.receivedBy,
        createdAt: payment.createdAt,
      });
      continue;
    }

    if (payment.rentMonth) {
      const key = batchKey(payment);
      const list = legacyBatches.get(key) ?? [];
      list.push(payment);
      legacyBatches.set(key, list);
      continue;
    }

    result.push({
      id: payment.id,
      ids: [payment.id],
      tenantId: payment.tenantId,
      type: payment.type,
      rentMonths: [],
      amount: payment.amount,
      receivedDate: payment.receivedDate,
      note: payment.note,
      receivedBy: payment.receivedBy,
      createdAt: payment.createdAt,
    });
  }

  for (const list of legacyBatches.values()) {
    const sorted = [...list].sort((a, b) =>
      (a.rentMonth ?? "").localeCompare(b.rentMonth ?? ""),
    );
    result.push({
      id: sorted[0].id,
      ids: sorted.map((p) => p.id),
      tenantId: sorted[0].tenantId,
      type: sorted[0].type,
      rentMonths: sorted
        .map((p) => p.rentMonth)
        .filter(Boolean) as string[],
      amount: sorted.reduce((sum, p) => sum + p.amount, 0),
      receivedDate: sorted[0].receivedDate,
      note: sorted[0].note,
      receivedBy: sorted[0].receivedBy,
      createdAt: sorted[0].createdAt,
    });
  }

  return result.sort((a, b) => {
    const byDate = b.receivedDate.localeCompare(a.receivedDate);
    if (byDate !== 0) return byDate;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/**
 * FIFO: each payment's amount fills its months in order up to monthlyRent.
 * Legacy equal-split rows are grouped first so 5000 for 2×3500 → May full, June 1500.
 */
export function getMonthPaidAmounts(
  payments: RentPayment[],
  monthlyRent: number,
): Map<string, number> {
  const paid = new Map<string, number>();
  const grouped = groupRentPayments(payments).sort((a, b) => {
    const byDate = a.receivedDate.localeCompare(b.receivedDate);
    if (byDate !== 0) return byDate;
    return a.createdAt.localeCompare(b.createdAt);
  });

  for (const payment of grouped) {
    if (payment.type !== "rent" && payment.type !== "advance") continue;

    const months = [...payment.rentMonths].sort();
    if (months.length === 0) continue;

    let leftover = payment.amount;
    for (const month of months) {
      if (leftover <= 0) break;
      const current = paid.get(month) ?? 0;
      if (current >= monthlyRent) continue;
      const fill = Math.min(leftover, monthlyRent - current);
      paid.set(month, current + fill);
      leftover -= fill;
    }

    if (leftover > 0) {
      const last = months[months.length - 1];
      paid.set(last, (paid.get(last) ?? 0) + leftover);
    }
  }

  return paid;
}

export function getFullyPaidMonths(
  payments: RentPayment[],
  monthlyRent: number,
): string[] {
  const paid = getMonthPaidAmounts(payments, monthlyRent);
  return [...paid.entries()]
    .filter(([, amount]) => amount >= monthlyRent)
    .map(([month]) => month)
    .sort();
}

export type PendingMonthBalance = {
  month: string;
  remaining: number;
};

/** Current month rent is due next month, so pending ends at previous month. */
export function getPendingMonthBalances(
  rentStartFrom: string,
  payments: RentPayment[],
  monthlyRent: number,
  endDate?: string,
): PendingMonthBalance[] {
  const reference = endDate ? new Date(endDate) : new Date();
  const pendingUntil = new Date(
    reference.getFullYear(),
    reference.getMonth() - 1,
    1,
  );
  const start = new Date(rentStartFrom);

  if (pendingUntil < new Date(start.getFullYear(), start.getMonth(), 1)) {
    return [];
  }

  const allMonths = getMonthKeysBetween(rentStartFrom, pendingUntil);
  const paid = getMonthPaidAmounts(payments, monthlyRent);

  return allMonths
    .map((month) => ({
      month,
      remaining: Math.max(0, monthlyRent - (paid.get(month) ?? 0)),
    }))
    .filter((row) => row.remaining > 0);
}

export function getPendingMonths(
  rentStartFrom: string,
  payments: RentPayment[],
  monthlyRent: number,
  endDate?: string,
): string[] {
  return getPendingMonthBalances(
    rentStartFrom,
    payments,
    monthlyRent,
    endDate,
  ).map((row) => row.month);
}

/** @deprecated Use getFullyPaidMonths — kept for callers still passing month lists */
export function getPaidRentMonths(
  payments: { type: string; rentMonth?: string; rentMonths?: string[] }[],
): string[] {
  const months = new Set<string>();
  for (const payment of payments) {
    if (payment.type !== "rent" && payment.type !== "advance") continue;
    for (const month of getPaymentMonths(payment)) {
      months.add(month);
    }
  }
  return [...months].sort();
}

/** Current + future months available for advance payment. */
export function getAdvanceMonths(
  rentStartFrom: string,
  payments: RentPayment[],
  monthlyRent: number,
  monthsAhead = 12,
): string[] {
  const now = new Date();
  const rentStart = new Date(rentStartFrom);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startMonth = new Date(rentStart.getFullYear(), rentStart.getMonth(), 1);
  const begin = startMonth > currentMonth ? startMonth : currentMonth;

  const paid = getMonthPaidAmounts(payments, monthlyRent);
  const months: string[] = [];
  const cursor = new Date(begin);

  for (let i = 0; i < monthsAhead; i += 1) {
    const key = toMonthKey(cursor);
    if ((paid.get(key) ?? 0) < monthlyRent) {
      months.push(key);
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

export function getDepositPaidAmount(
  tenantAdvance: number,
  payments: { type: string; amount: number }[],
): number {
  const extra = payments
    .filter((p) => p.type === "deposit")
    .reduce((sum, p) => sum + p.amount, 0);
  return tenantAdvance + extra;
}

export function getPendingDeposit(
  deposit: number,
  tenantAdvance: number,
  payments: { type: string; amount: number }[],
): number {
  return Math.max(0, deposit - getDepositPaidAmount(tenantAdvance, payments));
}

export function formatMonthsLabel(months: string[]): string {
  if (months.length === 0) return "Payment";
  if (months.length === 1) return formatRentMonth(months[0]);
  return `${formatRentMonth(months[0])} – ${formatRentMonth(months[months.length - 1])}`;
}

export function paymentTitle(payment: {
  type: string;
  rentMonth?: string;
  rentMonths?: string[];
}): string {
  const months = getPaymentMonths(payment);

  if (payment.type === "initial_advance") return "Advance (at joining)";
  if (payment.type === "deposit") return "Deposit Received";
  if (payment.type === "advance") {
    return months.length > 0
      ? `Advance – ${formatMonthsLabel(months)}`
      : "Advance";
  }
  if (months.length > 0) return formatMonthsLabel(months);
  return "Payment";
}

export function remainingForMonths(
  months: string[],
  pendingBalances: PendingMonthBalance[],
  monthlyRent: number,
): number {
  const map = new Map(pendingBalances.map((b) => [b.month, b.remaining]));
  return months.reduce(
    (sum, month) => sum + (map.get(month) ?? monthlyRent),
    0,
  );
}
