import { collections, getDb, noId } from "@/lib/mongodb";
import { getPaymentMonths, groupRentPayments } from "@/lib/rent-utils";
import type { RentPayment } from "@/types/rent";

export async function getAllRentPayments(): Promise<RentPayment[]> {
  const db = await getDb();
  return db
    .collection<RentPayment>(collections.rentPayments)
    .find({}, noId)
    .sort({ receivedDate: -1, createdAt: -1 })
    .toArray();
}

export async function getRentPaymentsByTenant(
  tenantId: string,
): Promise<RentPayment[]> {
  const db = await getDb();
  return db
    .collection<RentPayment>(collections.rentPayments)
    .find({ tenantId }, noId)
    .sort({ receivedDate: -1, createdAt: -1 })
    .toArray();
}

export async function addRentPayment(
  payment: RentPayment,
): Promise<RentPayment> {
  await addRentPayments([payment]);
  return payment;
}

export async function addRentPayments(
  newPayments: RentPayment[],
): Promise<RentPayment[]> {
  if (newPayments.length === 0) return newPayments;

  const db = await getDb();
  const col = db.collection<RentPayment>(collections.rentPayments);

  const monthChecks = newPayments.flatMap((p) => {
    if (p.type !== "rent" && p.type !== "advance") return [];
    return getPaymentMonths(p).map((rentMonth) => ({
      tenantId: p.tenantId,
      rentMonth,
    }));
  });

  // Soft guard: block only exact duplicate month docs in the same insert batch
  const seen = new Set<string>();
  for (const check of monthChecks) {
    const key = `${check.tenantId}:${check.rentMonth}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate month ${check.rentMonth} in the same payment.`);
    }
    seen.add(key);
  }

  await col.insertMany(newPayments);
  return newPayments;
}

export async function getRentPaymentById(
  id: string,
): Promise<RentPayment | null> {
  const db = await getDb();
  return db
    .collection<RentPayment>(collections.rentPayments)
    .findOne({ id }, noId);
}

export async function deleteRentPayment(
  id: string,
): Promise<RentPayment | null> {
  const db = await getDb();
  const col = db.collection<RentPayment>(collections.rentPayments);
  const existing = await col.findOne({ id }, noId);
  if (!existing) return null;

  const tenantPayments = await col
    .find({ tenantId: existing.tenantId }, noId)
    .toArray();
  const group = groupRentPayments(tenantPayments).find((g) =>
    g.ids.includes(id),
  );
  const ids = group?.ids ?? [id];

  await col.deleteMany({ id: { $in: ids } });
  return existing;
}
