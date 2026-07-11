import { NextResponse } from "next/server";
import {
  deleteLedgerEntry,
  getLedgerEntryById,
  updateLedgerEntry,
} from "@/lib/ledger-storage";
import type { LedgerEntryInput } from "@/types/ledger";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const entry = await getLedgerEntryById(id);

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  return NextResponse.json({ entry });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as Partial<LedgerEntryInput>;

  const title = body.title?.trim();
  const amount = Number(body.amount);
  const date = body.date?.trim();
  const note = body.note?.trim() ?? "";
  const type = body.type;

  if (type && type !== "extra_income" && type !== "expense") {
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

  const entry = await updateLedgerEntry(id, {
    title,
    amount,
    date,
    note,
    ...(type ? { type } : {}),
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  return NextResponse.json({ entry });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const deleted = await deleteLedgerEntry(id);

  if (!deleted) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
