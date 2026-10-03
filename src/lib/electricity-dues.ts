import { collections, getDb, noId } from "@/lib/mongodb";
import type { PendingMonthBalance } from "@/lib/rent-utils";

export type ElectricityDue = {
  id: string;
  ownerId: string;
  tenantId: string;
  month: string;
  previousUnits: number;
  units: number;
  charge: number;
  rate: number;
  status: "unpaid" | "paid";
  /** reading = meter stored; flag = units still pending even with no reading yet */
  kind: "reading" | "flag";
  /** True when this reading was created and paid in the same rent payment. */
  createdWithPayment?: boolean;
  paymentId?: string;
  createdAt: string;
};

export async function getElectricityDuesByOwner(
  ownerId: string,
): Promise<ElectricityDue[]> {
  const db = await getDb();
  return db
    .collection<ElectricityDue>(collections.electricityDues)
    .find({ ownerId }, noId)
    .toArray();
}

export async function getElectricityDuesByTenant(
  tenantId: string,
  ownerId: string,
): Promise<ElectricityDue[]> {
  const db = await getDb();
  return db
    .collection<ElectricityDue>(collections.electricityDues)
    .find({ tenantId, ownerId }, noId)
    .toArray();
}

export async function insertElectricityDues(
  dues: ElectricityDue[],
): Promise<void> {
  if (dues.length === 0) return;
  const db = await getDb();
  await db.collection<ElectricityDue>(collections.electricityDues).insertMany(dues);
}

export async function deleteUnpaidFlags(
  tenantId: string,
  ownerId: string,
  months: string[],
): Promise<void> {
  if (months.length === 0) return;
  const db = await getDb();
  await db.collection<ElectricityDue>(collections.electricityDues).deleteMany({
    tenantId,
    ownerId,
    kind: "flag",
    status: "unpaid",
    month: { $in: months },
  });
}

export async function markElectricityDuesPaid(
  ids: string[],
  ownerId: string,
  paymentId: string,
): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  await db.collection<ElectricityDue>(collections.electricityDues).updateMany(
    { id: { $in: ids }, ownerId },
    { $set: { status: "paid", paymentId } },
  );
}

export async function ensureElectricityFlags(input: {
  tenantId: string;
  ownerId: string;
  months: string[];
  paymentId: string;
  existing: ElectricityDue[];
}): Promise<void> {
  const covered = new Set(
    input.existing
      .filter((due) => due.status === "unpaid")
      .map((due) => due.month),
  );
  const now = new Date().toISOString();
  const flags: ElectricityDue[] = [];

  for (const month of input.months) {
    if (covered.has(month)) continue;
    flags.push({
      id: crypto.randomUUID(),
      ownerId: input.ownerId,
      tenantId: input.tenantId,
      month,
      previousUnits: 0,
      units: 0,
      charge: 0,
      rate: 0,
      status: "unpaid",
      kind: "flag",
      paymentId: input.paymentId,
      createdAt: now,
    });
    covered.add(month);
  }

  await insertElectricityDues(flags);
}

/** Undo electricity linked to a deleted payment. */
export async function revertElectricityForPayment(
  paymentId: string,
  ownerId: string,
): Promise<{ created: ElectricityDue | null; restoredUnpaid: number }> {
  const db = await getDb();
  const col = db.collection<ElectricityDue>(collections.electricityDues);
  const linked = await col.find({ ownerId, paymentId }, noId).toArray();
  if (linked.length === 0) return { created: null, restoredUnpaid: 0 };

  const created = linked.find((due) => due.createdWithPayment && due.kind === "reading") ?? null;
  const restoreIds = linked
    .filter((due) => due.kind === "reading" && !due.createdWithPayment)
    .map((due) => due.id);
  const flagIds = linked.filter((due) => due.kind === "flag").map((due) => due.id);

  if (created) {
    await col.deleteOne({ id: created.id, ownerId });
  }
  if (flagIds.length > 0) {
    await col.deleteMany({ id: { $in: flagIds }, ownerId });
  }
  if (restoreIds.length > 0) {
    await col.updateMany(
      { id: { $in: restoreIds }, ownerId },
      { $set: { status: "unpaid" }, $unset: { paymentId: "" } },
    );
  }

  return { created, restoredUnpaid: restoreIds.length };
}

export function unpaidElectricityByMonth(
  dues: ElectricityDue[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const due of dues) {
    if (due.status !== "unpaid" || due.kind !== "reading" || due.charge <= 0) continue;
    map[due.month] = (map[due.month] ?? 0) + due.charge;
  }
  return map;
}

export function unitsPendingMonths(dues: ElectricityDue[]): string[] {
  return dues
    .filter((due) => due.status === "unpaid" && due.kind === "flag")
    .map((due) => due.month);
}

export function pendingBalancesWithElectricity(
  rentBalances: PendingMonthBalance[],
  dues: ElectricityDue[],
): PendingMonthBalance[] {
  const rentMap = new Map(rentBalances.map((row) => [row.month, row.remaining]));
  const extra = unpaidElectricityByMonth(dues);
  const force = new Set<string>([
    ...Object.keys(extra),
    ...unitsPendingMonths(dues),
  ]);

  const months = new Set<string>([...rentMap.keys(), ...force]);
  return [...months]
    .sort()
    .map((month) => ({
      month,
      remaining: (rentMap.get(month) ?? 0) + (extra[month] ?? 0),
    }))
    .filter((row) => row.remaining > 0 || force.has(row.month));
}
