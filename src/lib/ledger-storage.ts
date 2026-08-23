import { collections, getDb, noId } from "@/lib/mongodb";
import type { LedgerEntry } from "@/types/ledger";

export async function getLedgerEntries(ownerId: string): Promise<LedgerEntry[]> {
  const db = await getDb();
  return db
    .collection<LedgerEntry>(collections.ledger)
    .find({ ownerId }, noId)
    .sort({ date: -1, createdAt: -1 })
    .toArray();
}

export async function getLedgerEntryById(
  id: string,
  ownerId: string,
): Promise<LedgerEntry | null> {
  const db = await getDb();
  return db
    .collection<LedgerEntry>(collections.ledger)
    .findOne({ id, ownerId }, noId);
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
  ownerId: string,
  patch: Partial<Omit<LedgerEntry, "id" | "createdAt" | "ownerId">>,
): Promise<LedgerEntry | null> {
  const db = await getDb();
  const col = db.collection<LedgerEntry>(collections.ledger);

  await col.updateOne({ id, ownerId }, { $set: patch });
  return col.findOne({ id, ownerId }, noId);
}

export async function deleteLedgerEntry(
  id: string,
  ownerId: string,
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .collection(collections.ledger)
    .deleteOne({ id, ownerId });
  return result.deletedCount === 1;
}
