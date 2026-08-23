import { NextResponse } from "next/server";
import { getLedgerEntries } from "@/lib/ledger-storage";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const entries = await getLedgerEntries(session.ownerId);
  return NextResponse.json({ entries });
}
