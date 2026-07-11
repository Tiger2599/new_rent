import { NextResponse } from "next/server";
import { getLedgerEntries } from "@/lib/ledger-storage";

export async function GET() {
  const entries = await getLedgerEntries();
  return NextResponse.json({ entries });
}
