import { NextResponse } from "next/server";
import { getAllRentPayments } from "@/lib/rent-storage";
import { addLedgerEntry, getLedgerEntries } from "@/lib/ledger-storage";
import { getActiveTenants, getOldTenants } from "@/lib/tenant-storage";
import { paymentTitle } from "@/lib/rent-utils";
import {
  buildMonthOptions,
  currentMonthKey,
  formatMonthLabel,
  isBeforeMonth,
  isInMonth,
  previousMonthKey,
} from "@/lib/month-utils";
import type { BalanceSheetItem, LedgerEntryInput } from "@/types/ledger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") || currentMonthKey();

  const [payments, ledger, activeTenants, oldTenants] = await Promise.all([
    getAllRentPayments(),
    getLedgerEntries(),
    getActiveTenants(),
    getOldTenants(),
  ]);

  const tenants = [...activeTenants, ...oldTenants];
  const tenantName = new Map(tenants.map((t) => [t.id, t.name]));

  const allIncome: BalanceSheetItem[] = [];
  const allExpenses: BalanceSheetItem[] = [];

  for (const payment of payments) {
    const name = tenantName.get(payment.tenantId) ?? "Tenant";
    const title = paymentTitle(payment);
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

  const monthOptions = buildMonthOptions([
    ...allIncome.map((i) => i.date),
    ...allExpenses.map((e) => e.date),
  ]);

  const prevMonth = previousMonthKey(month);
  const prevIncome = allIncome
    .filter((i) => isInMonth(i.date, prevMonth))
    .reduce((sum, i) => sum + i.amount, 0);
  const prevExpense = allExpenses
    .filter((e) => isInMonth(e.date, prevMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  // Cumulative opening: all activity before selected month
  const priorIncome = allIncome
    .filter((i) => isBeforeMonth(i.date, month))
    .reduce((sum, i) => sum + i.amount, 0);
  const priorExpense = allExpenses
    .filter((e) => isBeforeMonth(e.date, month))
    .reduce((sum, e) => sum + e.amount, 0);
  const carryForward = priorIncome - priorExpense;

  const income = allIncome.filter((i) => isInMonth(i.date, month));
  const expenses = allExpenses.filter((e) => isInMonth(e.date, month));

  if (carryForward !== 0) {
    income.unshift({
      id: `carry-forward-${month}`,
      label: `Opening Balance (${formatMonthLabel(prevMonth)})`,
      amount: carryForward,
      date: `${month}-01`,
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
    month,
    monthLabel: formatMonthLabel(month),
    monthOptions,
    income,
    expenses,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    carryForward,
    previousMonthBalance: prevIncome - prevExpense,
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
