import { collections, getDb, noId } from "@/lib/mongodb";
import type { Tenant } from "@/types/tenant";

export async function getActiveTenants(): Promise<Tenant[]> {
  const db = await getDb();
  return db
    .collection<Tenant>(collections.tenants)
    .find({ removedAt: { $exists: false } }, noId)
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getOldTenants(): Promise<Tenant[]> {
  const db = await getDb();
  return db
    .collection<Tenant>(collections.tenants)
    .find({ removedAt: { $exists: true } }, noId)
    .sort({ removedAt: -1 })
    .toArray();
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const db = await getDb();
  return db.collection<Tenant>(collections.tenants).findOne({ id }, noId);
}

export async function addTenant(tenant: Tenant): Promise<Tenant> {
  const db = await getDb();
  await db.collection(collections.tenants).insertOne(tenant);
  return tenant;
}

export async function removeTenant(id: string): Promise<Tenant | null> {
  const db = await getDb();
  const tenants = db.collection<Tenant>(collections.tenants);
  const existing = await tenants.findOne(
    { id, removedAt: { $exists: false } },
    noId,
  );

  if (!existing) return null;

  const removedAt = new Date().toISOString();
  await tenants.updateOne({ id }, { $set: { removedAt } });

  return { ...existing, removedAt };
}
