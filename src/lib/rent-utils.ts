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

/** Current month rent is due next month, so pending ends at previous month. */
export function getPendingMonths(
  rentStartFrom: string,
  paidMonths: string[],
  endDate?: string,
): string[] {
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
  const paidSet = new Set(paidMonths);
  return allMonths.filter((m) => !paidSet.has(m));
}

/** Current + future months available for advance payment. */
export function getAdvanceMonths(
  rentStartFrom: string,
  paidMonths: string[],
  monthsAhead = 12,
): string[] {
  const now = new Date();
  const rentStart = new Date(rentStartFrom);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startMonth = new Date(rentStart.getFullYear(), rentStart.getMonth(), 1);
  const begin =
    startMonth > currentMonth ? startMonth : currentMonth;

  const paidSet = new Set(paidMonths);
  const months: string[] = [];
  const cursor = new Date(begin);

  for (let i = 0; i < monthsAhead; i += 1) {
    const key = toMonthKey(cursor);
    if (!paidSet.has(key)) {
      months.push(key);
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

export function getPaidRentMonths(
  payments: { type: string; rentMonth?: string }[],
): string[] {
  return payments
    .filter(
      (p) =>
        (p.type === "rent" || p.type === "advance") && Boolean(p.rentMonth),
    )
    .map((p) => p.rentMonth as string);
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

export function paymentTitle(payment: {
  type: string;
  rentMonth?: string;
}): string {
  if (payment.type === "initial_advance") return "Advance (at joining)";
  if (payment.type === "deposit") return "Deposit Received";
  if (payment.type === "advance" && payment.rentMonth) {
    return `Advance – ${formatRentMonth(payment.rentMonth)}`;
  }
  if (payment.rentMonth) return formatRentMonth(payment.rentMonth);
  return "Payment";
}
