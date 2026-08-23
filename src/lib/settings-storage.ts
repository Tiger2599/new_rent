import { collections, getDb, noId } from "@/lib/mongodb";
import {
  DEFAULT_ELECTRICITY_RATE,
  normalizeElectricityRate,
} from "@/lib/electricity";

export type OwnerSettings = {
  ownerId: string;
  electricityRate: number;
};

export async function getOwnerSettings(ownerId: string): Promise<OwnerSettings> {
  const db = await getDb();
  const existing = await db
    .collection<OwnerSettings>(collections.settings)
    .findOne({ ownerId }, noId);

  if (existing) {
    return {
      ownerId,
      electricityRate: normalizeElectricityRate(existing.electricityRate),
    };
  }

  const settings: OwnerSettings = {
    ownerId,
    electricityRate: DEFAULT_ELECTRICITY_RATE,
  };
  await db.collection(collections.settings).insertOne(settings);
  return settings;
}

export async function updateOwnerSettings(
  ownerId: string,
  patch: { electricityRate: number },
): Promise<OwnerSettings> {
  const electricityRate = normalizeElectricityRate(patch.electricityRate);
  const db = await getDb();
  await db.collection<OwnerSettings>(collections.settings).updateOne(
    { ownerId },
    { $set: { ownerId, electricityRate } },
    { upsert: true },
  );
  return { ownerId, electricityRate };
}
