import { NextResponse } from "next/server";
import { getAllRentPayments } from "@/lib/rent-storage";
import { addLedgerEntry, getLedgerEntries } from "@/lib/ledger-storage";
import { getTenantNameMap } from "@/lib/tenant-storage";
import { groupRentPayments, paymentTitle } from "@/lib/rent-utils";
import {
  currentMonthKey,
  endOfMonthKey,
  formatDateRangeLabel,
  formatMonthLabel,
  isBeforeDate,
  isInDateRange,
  previousMonthKey,
  startOfMonthKey,
  toMonthKeyFromDate,
} from "@/lib/month-utils";
import type { BalanceSheetItem, LedgerEntryInput } from "@/types/ledger";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function resolveRange(searchParams: URLSearchParams): {
  from: string;
  to: string;
} {
  const fromParam = searchParams.get("from")?.trim() ?? "";
  const toParam = searchParams.get("to")?.trim() ?? "";
  const month = searchParams.get("month") || currentMonthKey();

  if (DATE_RE.test(fromParam) && DATE_RE.test(toParam)) {
    return fromParam <= toParam
      ? { from: fromParam, to: toParam }
      : { from: toParam, to: fromParam };
  }

  return {
    from: startOfMonthKey(month),
    to: endOfMonthKey(month),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { from, to } = resolveRange(searchParams);
  const month = toMonthKeyFromDate(from);

  const [payments, ledger, tenantName] = await Promise.all([
    getAllRentPayments(),
    getLedgerEntries(),
    getTenantNameMap(),
  ]);

  const allIncome: BalanceSheetItem[] = [];
  const allExpenses: BalanceSheetItem[] = [];

  for (const payment of groupRentPayments(payments)) {
    const name = tenantName.get(payment.tenantId) ?? "Tenant";
    const title = paymentTitle({
      type: payment.type,
      rentMonths: payment.rentMonths,
    });
    const source =
      payment.type === "deposit" || payment.type === "initial_advance"
        ? ("deposit" as const)
        : payment.type === "advance"
          ? ("advance" as const)
          : ("rent" as const);

    allIncome.push({
      id: payment.id,
      label: `${name} – ${title}`,
      amount: payment.amount,
      date: payment.receivedDate,
      note: payment.note,
      source,
      by: payment.receivedBy,
    });
  }

  for (const entry of ledger) {
    const item: BalanceSheetItem = {
      id: entry.id,
      label: entry.title,
      amount: entry.amount,
      date: entry.date,
      note: entry.note,
      source: entry.type === "extra_income" ? "extra_income" : "expense",
      by: entry.createdBy,
    };

    if (entry.type === "extra_income") {
      allIncome.push(item);
    } else {
      allExpenses.push(item);
    }
  }

  const prevMonth = previousMonthKey(month);

  // Cumulative opening: all activity before selected range start
  const priorIncome = allIncome
    .filter((i) => isBeforeDate(i.date, from))
    .reduce((sum, i) => sum + i.amount, 0);
  const priorExpense = allExpenses
    .filter((e) => isBeforeDate(e.date, from))
    .reduce((sum, e) => sum + e.amount, 0);
  const carryForward = priorIncome - priorExpense;

  const income = allIncome.filter((i) => isInDateRange(i.date, from, to));
  const expenses = allExpenses.filter((e) => isInDateRange(e.date, from, to));

  if (carryForward !== 0) {
    income.unshift({
      id: `carry-forward-${from}`,
      label: `Opening Balance (${formatMonthLabel(prevMonth)})`,
      amount: carryForward,
      date: from,
      note: "Previous remaining balance carried forward",
      source: "carry_forward",
    });
  }

  income.sort((a, b) => {
    if (a.source === "carry_forward") return -1;
    if (b.source === "carry_forward") return 1;
    return b.date.localeCompare(a.date);
  });
  expenses.sort((a, b) => b.date.localeCompare(a.date));

  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, i) => sum + i.amount, 0);

  return NextResponse.json({
    from,
    to,
    month,
    rangeLabel: formatDateRangeLabel(from, to),
    monthLabel: formatMonthLabel(month),
    income,
    expenses,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    carryForward,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<LedgerEntryInput>;
  const type = body.type;
  const title = body.title?.trim();
  const amount = Number(body.amount);
  const date = body.date?.trim();
  const note = body.note?.trim() ?? "";
  const createdBy = body.createdBy?.trim() || "Admin";

  if (type !== "extra_income" && type !== "expense") {
    return NextResponse.json({ error: "Invalid entry type." }, { status: 400 });
  }

  if (!title || !date) {
    return NextResponse.json(
      { error: "Title and date are required." },
      { status: 400 },
    );
  }

  if (Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Amount must be a valid number greater than 0." },
      { status: 400 },
    );
  }

  const entry = await addLedgerEntry({
    id: crypto.randomUUID(),
    type,
    title,
    amount,
    date,
    note,
    createdBy,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ entry }, { status: 201 });
}
