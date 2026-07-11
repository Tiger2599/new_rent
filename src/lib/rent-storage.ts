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
  const db = await getDb();
  const col = db.collection<RentPayment>(collections.rentPayments);

  if (
    (payment.type === "rent" || payment.type === "advance") &&
    payment.rentMonth
  ) {
    const exists = await col.findOne({
      tenantId: payment.tenantId,
      rentMonth: payment.rentMonth,
      type: { $in: ["rent", "advance"] },
    });

    if (exists) {
      throw new Error("Rent for this month is already received.");
    }
  }

  await col.insertOne(payment);
  return payment;
}

export async function addRentPayments(
  newPayments: RentPayment[],
): Promise<RentPayment[]> {
  const db = await getDb();
  const col = db.collection<RentPayment>(collections.rentPayments);

  for (const payment of newPayments) {
    if (
      (payment.type === "rent" || payment.type === "advance") &&
      payment.rentMonth
    ) {
      const exists = await col.findOne({
        tenantId: payment.tenantId,
        rentMonth: payment.rentMonth,
        type: { $in: ["rent", "advance"] },
      });

      if (exists) {
        throw new Error(`Rent for ${payment.rentMonth} is already received.`);
      }
    }
  }

  if (newPayments.length > 0) {
    await col.insertMany(newPayments);
  }

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
