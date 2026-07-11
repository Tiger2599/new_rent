import { collections, getDb, noId } from "@/lib/mongodb";
import type { LedgerEntry } from "@/types/ledger";

export async function getLedgerEntries(): Promise<LedgerEntry[]> {
  const db = await getDb();
  return db
    .collection<LedgerEntry>(collections.ledger)
    .find({}, noId)
    .sort({ date: -1, createdAt: -1 })
    .toArray();
}

export async function getLedgerEntryById(
  id: string,
): Promise<LedgerEntry | null> {
  const db = await getDb();
  return db.collection<LedgerEntry>(collections.ledger).findOne({ id }, noId);
}

export async function addLedgerEntry(
  entry: LedgerEntry,
): Promise<LedgerEntry> {
  const db = await getDb();
  await db.collection(collections.ledger).insertOne(entry);
  return entry;
}

export async function updateLedgerEntry(
  id: string,
  patch: Partial<Omit<LedgerEntry, "id" | "createdAt">>,
): Promise<LedgerEntry | null> {
  const db = await getDb();
  const col = db.collection<LedgerEntry>(collections.ledger);

  await col.updateOne({ id }, { $set: patch });
  return col.findOne({ id }, noId);
}
