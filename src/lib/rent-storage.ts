import { collections, getDb, noId } from "@/lib/mongodb";
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

  const monthChecks = newPayments.filter(
    (p) =>
      (p.type === "rent" || p.type === "advance") && Boolean(p.rentMonth),
  );

  if (monthChecks.length > 0) {
    const orFilters = monthChecks.map((p) => ({
      tenantId: p.tenantId,
      rentMonth: p.rentMonth,
      type: { $in: ["rent", "advance"] as const },
    }));

    const existing = await col.findOne(
      { $or: orFilters },
      { projection: { rentMonth: 1 } },
    );

    if (existing) {
      throw new Error(
        existing.rentMonth
          ? `Rent for ${existing.rentMonth} is already received.`
          : "Rent for this month is already received.",
      );
    }

    // Also guard duplicates within the same batch
    const seen = new Set<string>();
    for (const p of monthChecks) {
      const key = `${p.tenantId}:${p.rentMonth}`;
      if (seen.has(key)) {
        throw new Error(`Rent for ${p.rentMonth} is already received.`);
      }
      seen.add(key);
    }
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

export async function deleteRentPayment(id: string): Promise<RentPayment | null> {
  const db = await getDb();
  const col = db.collection<RentPayment>(collections.rentPayments);
  const existing = await col.findOne({ id }, noId);
  if (!existing) return null;
  await col.deleteOne({ id });
  return existing;
}
